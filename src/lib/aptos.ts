/**
 * Movement Network SDK Integration for Villages Finance Platform
 * 
 * Provides utilities for interacting with the deployed smart contracts
 * Note: Using Move SDK (Aptos-compatible) with custom Movement Network endpoints for compatibility
 */

import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import {
  CONTRACT_ADDRESS,
  MEMBERS_REGISTRY_ADDR,
  COMPLIANCE_REGISTRY_ADDR,
  TREASURY_ADDR,
  POOL_REGISTRY_ADDR,
  GOVERNANCE_ADDR,
  BANK_REGISTRY_ADDR,
  PROJECT_REGISTRY_ADDR,
  TOKEN_ADMIN_ADDR,
  MODULE_PATHS,
  getNetworkType,
} from "./config";
import { 
  Role, 
  RequestStatus, 
  PoolStatus, 
  ProposalStatus, 
  VotingMechanism,
  TimeBankRequest,
  InvestmentPool,
  Proposal,
  parseContractError,
} from "@/types/contract";
import { stringToBytes, bytesToString } from "./utils";

// Initialize SDK client with Movement Network testnet configuration
// Using custom endpoints to connect to Movement Network while maintaining SDK compatibility
const config = new AptosConfig({ 
  network: getNetworkType(),
  fullnode: process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || "https://testnet.movementnetwork.xyz/v1",
  indexer: process.env.NEXT_PUBLIC_MOVEMENT_INDEXER_URL || "https://hasura.testnet.movementnetwork.xyz/v1/graphql",
});
export const move = new Aptos(config);
// Legacy alias for backward compatibility
export const aptos = move;

// ============================================================================
// View Functions - Members Module
// ============================================================================

/**
 * Check if an address is a registered member
 */
export async function isMember(address: string): Promise<boolean> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.members}::is_member_with_registry`,
        functionArguments: [address, MEMBERS_REGISTRY_ADDR],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking membership:", error);
    return false;
  }
}

/**
 * Get the role of a member
 * Returns null if not a member, or the role number
 */
export async function getMemberRole(address: string): Promise<Role | null> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.members}::get_role_with_registry`,
        functionArguments: [address, MEMBERS_REGISTRY_ADDR],
      },
    });
    // Result is Option<u8> - can be hex string "0x00" or number
    const roleOption = result[0] as { vec: string | number[] } | any;
    
    if (roleOption && roleOption.vec) {
      let roleValue: number;
      
      // Handle hex string like "0x00"
      if (typeof roleOption.vec === 'string') {
        roleValue = parseInt(roleOption.vec, 16);
      } 
      // Handle array - could be ["0x00"] or [0]
      else if (Array.isArray(roleOption.vec) && roleOption.vec.length > 0) {
        const firstItem = roleOption.vec[0];
        if (typeof firstItem === 'string' && firstItem.startsWith('0x')) {
          roleValue = parseInt(firstItem, 16);
        } else {
          roleValue = Number(firstItem);
        }
      }
      else {
        return null;
      }
      
      // Validate and return as Role enum
      if (roleValue >= 0 && roleValue <= 3) {
        return roleValue as Role;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting member role:", error);
    return null;
  }
}

// ============================================================================
// View Functions - Compliance Module
// ============================================================================

/**
 * Check if an address is whitelisted (KYC verified)
 */
export async function isWhitelisted(address: string): Promise<boolean> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.compliance}::is_whitelisted`,
        functionArguments: [address, COMPLIANCE_REGISTRY_ADDR],
      },
    });
    return result[0] as boolean;
  } catch (error) {
    console.error("Error checking whitelist status:", error);
    return false;
  }
}

// ============================================================================
// View Functions - TimeBank Module
// ============================================================================

/**
 * Get a time bank request by ID
 */
export async function getTimeBankRequest(requestId: number): Promise<TimeBankRequest | null> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.timebank}::get_request`,
        functionArguments: [requestId, BANK_REGISTRY_ADDR],
      },
    });
    // Returns: (address, u64, u64, u8, u64)
    // [requester, hours, activity_id, status, created_at]
    const [requester, hours, activityId, status, createdAt] = result as [string, string, string, number, string];
    return {
      id: requestId,
      requester,
      hours: parseInt(hours),
      activityId: parseInt(activityId),
      status: status as RequestStatus,
      createdAt: parseInt(createdAt),
    };
  } catch (error) {
    console.error("Error getting timebank request:", error);
    return null;
  }
}

/**
 * List time bank requests, optionally filtered by status
 * @param statusFilter - 0 = Pending, 1 = Approved, 2 = Rejected, 255 = All
 */
export async function listTimeBankRequests(statusFilter?: RequestStatus): Promise<TimeBankRequest[]> {
  try {
    // Convert RequestStatus enum to contract status filter (0, 1, 2, or 255 for all)
    const filterValue = statusFilter !== undefined ? statusFilter : 255;
    
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.timebank}::list_requests`,
        functionArguments: [BANK_REGISTRY_ADDR, filterValue],
      },
    });
    
    // Returns: vector<u64> - array of request IDs
    const requestIds = result as string[];
    
    // Fetch details for each request
    const requests = await Promise.all(
      requestIds.map(async (idStr) => {
        const id = parseInt(idStr);
        return await getTimeBankRequest(id);
      })
    );
    
    // Filter out null results and return
    return requests.filter((req): req is TimeBankRequest => req !== null);
  } catch (error) {
    console.error("Error listing timebank requests:", error);
    return [];
  }
}

// ============================================================================
// View Functions - Time Token Module
// ============================================================================

/**
 * Get Time Token balance for an address
 * Returns balance in Time Dollars (display units), converted from base units (8 decimals)
 */
export async function getTimeTokenBalance(address: string): Promise<number> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.time_token}::balance`,
        functionArguments: [address, TOKEN_ADMIN_ADDR],
      },
    });
    const baseUnits = parseInt(result[0] as string);
    // Convert from base units (8 decimals) to display units (Time Dollars)
    return baseUnits / 100_000_000;
  } catch (error) {
    console.error("Error getting time token balance:", error);
    return 0;
  }
}

// ============================================================================
// View Functions - Treasury Module
// ============================================================================

/**
 * Get treasury balance for an address
 */
export async function getTreasuryBalance(address: string): Promise<number> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.treasury}::get_balance`,
        functionArguments: [address, TREASURY_ADDR],
      },
    });
    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error getting treasury balance:", error);
    return 0;
  }
}

// ============================================================================
// View Functions - Investment Pool Module
// ============================================================================

/**
 * Get investment pool details by ID
 */
export async function getInvestmentPool(poolId: number): Promise<InvestmentPool | null> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.investment_pool}::get_pool`,
        functionArguments: [poolId, POOL_REGISTRY_ADDR],
      },
    });
    // Returns: (u64, u64, u64, u8, u64, u64, address)
    // [pool_id, target_amount, current_total, status, interest_rate, duration, borrower]
    const [id, targetAmount, currentTotal, status, interestRate, duration, borrower] = result as [
      string, string, string, number, string, string, string
    ];
    return {
      id: parseInt(id),
      borrower,
      targetAmount: parseInt(targetAmount),
      currentTotal: parseInt(currentTotal),
      status: status as PoolStatus,
      interestRate: parseInt(interestRate),
      duration: parseInt(duration),
      createdAt: 0, // Not returned by view function
    };
  } catch (error) {
    console.error("Error getting investment pool:", error);
    return null;
  }
}

// ============================================================================
// View Functions - Project Registry Module
// ============================================================================

/**
 * Get project details by ID
 */
export async function getProject(projectId: number): Promise<Partial<InvestmentPool> | null> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.project_registry}::get_project`,
        functionArguments: [projectId, PROJECT_REGISTRY_ADDR],
      },
    });
    // Returns: (address, vector<u8>, u64, u64, bool, u8, u64)
    // [proposer, metadata_cid, target_usdc, target_hours, is_grant, status, created_at]
    const [proposer, metadataCidBytes, targetUsdc, targetHours, isGrant, status, createdAt] = result as [
      string, number[], string, string, boolean, number, string
    ];
    
    // Note: metadata_cid would need to be fetched from IPFS or similar
    // For now, we'll return basic project data that can be merged with mock data
    return {
      id: projectId,
      borrower: proposer,
      targetAmount: parseInt(targetUsdc),
      currentTotal: 0, // Would need to query pool separately
      status: status as PoolStatus,
      interestRate: 0,
      duration: 0,
      createdAt: parseInt(createdAt),
      // Additional fields for merging with mock data
      metadataCid: bytesToString(metadataCidBytes),
      targetHours: parseInt(targetHours),
      isGrant,
    } as any;
  } catch (error) {
    console.error("Error getting project:", error);
    return null;
  }
}

/**
 * List projects, optionally filtered by status
 * @param statusFilter - PoolStatus enum value, or undefined for all
 */
export async function listProjects(statusFilter?: PoolStatus): Promise<Partial<InvestmentPool>[]> {
  try {
    // Convert status filter: 0-4 for statuses, 255 for all
    const filterValue = statusFilter !== undefined ? statusFilter : 255;
    
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.project_registry}::list_projects`,
        functionArguments: [PROJECT_REGISTRY_ADDR, filterValue],
      },
    });
    
    // Returns: vector<u64> - array of project IDs
    const projectIds = result as string[];
    
    // Fetch details for each project
    const projects = await Promise.all(
      projectIds.map(async (idStr) => {
        const id = parseInt(idStr);
        return await getProject(id);
      })
    );
    
    // Filter out null results
    return projects.filter((proj): proj is Partial<InvestmentPool> => proj !== null);
  } catch (error) {
    console.error("Error listing projects:", error);
    return [];
  }
}

// ============================================================================
// View Functions - Governance Module
// ============================================================================

/**
 * Get proposal details by ID
 */
export async function getProposal(proposalId: number): Promise<Proposal | null> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.governance}::get_proposal`,
        functionArguments: [proposalId, GOVERNANCE_ADDR],
      },
    });
    // Returns: (address, vector<u8>, u8, u64, u64, u64, u64, u8)
    // [proposer, title, status, votes_yes, votes_no, votes_abstain, threshold, voting_mechanism]
    const [proposer, titleBytes, status, votesYes, votesNo, votesAbstain, threshold, votingMechanism] = result as [
      string, number[], number, string, string, string, string, number
    ];
    return {
      id: proposalId,
      proposer,
      title: bytesToString(titleBytes),
      description: "", // Not returned by view function
      status: status as ProposalStatus,
      votesYes: parseInt(votesYes),
      votesNo: parseInt(votesNo),
      votesAbstain: parseInt(votesAbstain),
      threshold: parseInt(threshold),
      votingMechanism: votingMechanism as VotingMechanism,
      createdAt: 0, // Not returned by view function
      endsAt: 0, // Not returned by view function
    };
  } catch (error) {
    console.error("Error getting proposal:", error);
    return null;
  }
}

/**
 * List proposals, optionally filtered by status
 * @param statusFilter - ProposalStatus enum value, or undefined for all
 */
export async function listProposals(statusFilter?: ProposalStatus): Promise<Proposal[]> {
  try {
    // Convert status filter: 0-4 for statuses, 255 for all
    const filterValue = statusFilter !== undefined ? statusFilter : 255;
    
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.governance}::list_proposals`,
        functionArguments: [GOVERNANCE_ADDR, filterValue],
      },
    });
    
    // Returns: vector<u64> - array of proposal IDs
    const proposalIds = result as string[];
    
    // Fetch details for each proposal
    const proposals = await Promise.all(
      proposalIds.map(async (idStr) => {
        const id = parseInt(idStr);
        return await getProposal(id);
      })
    );
    
    // Filter out null results
    return proposals.filter((prop): prop is Proposal => prop !== null);
  } catch (error) {
    console.error("Error listing proposals:", error);
    return [];
  }
}

// ============================================================================
// View Functions - Rewards Module
// ============================================================================

/**
 * Get pending rewards for a user in a pool
 */
export async function getPendingRewards(address: string, poolId: number): Promise<number> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.rewards}::get_pending_rewards`,
        functionArguments: [address, poolId, POOL_REGISTRY_ADDR],
      },
    });
    return parseInt(result[0] as string);
  } catch (error) {
    console.error("Error getting pending rewards:", error);
    return 0;
  }
}

// ============================================================================
// Transaction Builders
// ============================================================================

/**
 * Build transaction data for requesting membership
 * Move function signature: request_membership(applicant, registry_addr, desired_role, note)
 */
export function buildRequestMembershipTx(role: Role, note: string) {
  return {
    function: `${MODULE_PATHS.members}::request_membership` as `${string}::${string}::${string}`,
    functionArguments: [
      MEMBERS_REGISTRY_ADDR, // registry_addr (first)
      role, // desired_role (second) - u8
      Array.from(stringToBytes(note)), // note (third) - vector<u8>
    ],
  };
}

/**
 * Build transaction data for accepting membership
 */
export function buildAcceptMembershipTx() {
  return {
    function: `${MODULE_PATHS.members}::accept_membership` as `${string}::${string}::${string}`,
    functionArguments: [MEMBERS_REGISTRY_ADDR],
  };
}

/**
 * Build transaction data for creating a timebank request
 */
export function buildCreateTimeBankRequestTx(hours: number, activityId: number) {
  return {
    function: `${MODULE_PATHS.timebank}::create_request` as `${string}::${string}::${string}`,
    functionArguments: [
      hours,
      activityId,
      MEMBERS_REGISTRY_ADDR,
      BANK_REGISTRY_ADDR,
    ],
  };
}

/**
 * Build transaction data for approving a timebank request
 */
export function buildApproveTimeBankRequestTx(requestId: number) {
  return {
    function: `${MODULE_PATHS.timebank}::approve_request` as `${string}::${string}::${string}`,
    functionArguments: [
      requestId,
      MEMBERS_REGISTRY_ADDR,
      COMPLIANCE_REGISTRY_ADDR,
      BANK_REGISTRY_ADDR,
      TOKEN_ADMIN_ADDR,
    ],
  };
}

/**
 * Build transaction data for depositing to treasury
 */
export function buildDepositTx(amount: number) {
  return {
    function: `${MODULE_PATHS.treasury}::deposit` as `${string}::${string}::${string}`,
    functionArguments: [
      amount,
      TREASURY_ADDR,
      MEMBERS_REGISTRY_ADDR,
      COMPLIANCE_REGISTRY_ADDR,
    ],
  };
}

/**
 * Build transaction data for withdrawing from treasury
 */
export function buildWithdrawTx(amount: number) {
  return {
    function: `${MODULE_PATHS.treasury}::withdraw` as `${string}::${string}::${string}`,
    functionArguments: [amount, TREASURY_ADDR],
  };
}

/**
 * Build transaction data for creating a governance proposal
 */
export function buildCreateProposalTx(
  title: string,
  description: string,
  threshold: number,
  votingMechanism: VotingMechanism
) {
  return {
    function: `${MODULE_PATHS.governance}::create_proposal` as `${string}::${string}::${string}`,
    functionArguments: [
      Array.from(stringToBytes(title)),
      Array.from(stringToBytes(description)),
      threshold,
      votingMechanism,
      null, // action - optional
      MEMBERS_REGISTRY_ADDR,
      TOKEN_ADMIN_ADDR,
      GOVERNANCE_ADDR,
    ],
  };
}

/**
 * Build transaction data for voting on a proposal
 */
export function buildVoteTx(proposalId: number, choice: number) {
  return {
    function: `${MODULE_PATHS.governance}::vote` as `${string}::${string}::${string}`,
    functionArguments: [
      proposalId,
      choice,
      GOVERNANCE_ADDR,
      MEMBERS_REGISTRY_ADDR,
      TOKEN_ADMIN_ADDR,
    ],
  };
}

/**
 * Build transaction data for staking tokens
 */
export function buildStakeTx(poolId: number, amount: number) {
  return {
    function: `${MODULE_PATHS.rewards}::stake` as `${string}::${string}::${string}`,
    functionArguments: [poolId, amount, POOL_REGISTRY_ADDR],
  };
}

/**
 * Build transaction data for claiming rewards
 */
export function buildClaimRewardsTx(poolId: number) {
  return {
    function: `${MODULE_PATHS.rewards}::claim_rewards` as `${string}::${string}::${string}`,
    functionArguments: [poolId, POOL_REGISTRY_ADDR],
  };
}

/**
 * Build transaction data for unstaking tokens
 */
export function buildUnstakeTx(poolId: number, amount: number) {
  return {
    function: `${MODULE_PATHS.rewards}::unstake` as `${string}::${string}::${string}`,
    functionArguments: [poolId, amount, POOL_REGISTRY_ADDR],
  };
}

/**
 * Build transaction data for transferring time tokens
 * Amount should be in Time Dollars (display units), will be converted to base units (8 decimals)
 */
export function buildTransferTimeTokenTx(recipient: string, amount: number) {
  // Convert from Time Dollars (display units) to base units (8 decimals)
  const baseUnits = Math.floor(amount * 100_000_000);
  return {
    function: `${MODULE_PATHS.time_token}::transfer` as `${string}::${string}::${string}`,
    functionArguments: [recipient, baseUnits, TOKEN_ADMIN_ADDR],
  };
}

/**
 * Build transaction data for whitelisting an address (admin only)
 * 
 * Note: The Move contract's whitelist_address function only takes 1 argument (addr: address).
 * The admin signer is automatically provided by the transaction sender.
 * The ComplianceRegistry is stored at the admin's address, so no registry address is needed.
 */
export function buildWhitelistAddressTx(addressToWhitelist: string) {
  return {
    function: `${MODULE_PATHS.compliance}::whitelist_address` as `${string}::${string}::${string}`,
    functionArguments: [addressToWhitelist], // Only the address to whitelist
  };
}

/**
 * Build transaction data for approving a membership request (admin or validator)
 */
export function buildApproveMembershipTx(requestId: number) {
  return {
    function: `${MODULE_PATHS.members}::approve_membership` as `${string}::${string}::${string}`,
    functionArguments: [requestId, MEMBERS_REGISTRY_ADDR],
  };
}

/**
 * Build transaction data for rejecting a membership request (admin or validator)
 */
export function buildRejectMembershipTx(requestId: number) {
  return {
    function: `${MODULE_PATHS.members}::reject_membership` as `${string}::${string}::${string}`,
    functionArguments: [requestId, MEMBERS_REGISTRY_ADDR],
  };
}

/**
 * List pending membership requests
 */
export async function listMembershipRequests(statusFilter: number = 0): Promise<number[]> {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.members}::list_membership_requests`,
        functionArguments: [MEMBERS_REGISTRY_ADDR, statusFilter], // 0 = Pending, 255 = All
      },
    });
    return (result[0] as number[]) || [];
  } catch (error) {
    console.error("Error listing membership requests:", error);
    return [];
  }
}

// ============================================================================
// View Functions - Registry Hub Module
// ============================================================================

/**
 * Get community configuration from registry hub
 */
export async function getCommunityConfig(hubAddr: string, communityId: number) {
  try {
    const result = await move.view({
      payload: {
        function: `${MODULE_PATHS.registry_hub}::get_community_config`,
        functionArguments: [hubAddr, communityId],
      },
    });
    // Returns: CommunityConfig struct with all registry addresses
    return {
      members_registry_addr: result[0] as string,
      compliance_registry_addr: result[1] as string,
      treasury_addr: result[2] as string,
      pool_registry_addr: result[3] as string,
      fractional_shares_addr: result[4] as string,
      governance_addr: result[5] as string,
      token_admin_addr: result[6] as string,
      time_token_admin_addr: result[7] as string,
    };
  } catch (error) {
    console.error("Error getting community config:", error);
    return null;
  }
}

// ============================================================================
// Transaction Builders - Registry Hub
// ============================================================================

/**
 * Build transaction data for initializing registry hub
 */
export function buildInitializeHubTx() {
  return {
    function: `${MODULE_PATHS.registry_hub}::initialize` as `${string}::${string}::${string}`,
    functionArguments: [],
  };
}

/**
 * Build transaction data for registering a new community
 */
export function buildRegisterCommunityTx(
  hubAddr: string,
  communityId: number,
  membersRegistryAddr: string,
  complianceRegistryAddr: string,
  treasuryAddr: string,
  poolRegistryAddr: string,
  fractionalSharesAddr: string,
  governanceAddr: string,
  tokenAdminAddr: string,
  timeTokenAdminAddr: string
) {
  return {
    function: `${MODULE_PATHS.registry_hub}::register_community` as `${string}::${string}::${string}`,
    functionArguments: [
      hubAddr,
      communityId,
      membersRegistryAddr,
      complianceRegistryAddr,
      treasuryAddr,
      poolRegistryAddr,
      fractionalSharesAddr,
      governanceAddr,
      tokenAdminAddr,
      timeTokenAdminAddr,
    ],
  };
}

// ============================================================================
// Transaction Builders - Project Registry
// ============================================================================

/**
 * Build transaction data for approving a project (admin only)
 */
export function buildApproveProjectTx(projectId: number) {
  return {
    function: `${MODULE_PATHS.project_registry}::approve_project` as `${string}::${string}::${string}`,
    functionArguments: [projectId, PROJECT_REGISTRY_ADDR],
  };
}

/**
 * Build transaction data for updating project status (admin only)
 */
export function buildUpdateProjectStatusTx(projectId: number, newStatus: number) {
  return {
    function: `${MODULE_PATHS.project_registry}::update_project_status` as `${string}::${string}::${string}`,
    functionArguments: [projectId, newStatus, PROJECT_REGISTRY_ADDR],
  };
}

// Export error parser for use in components
export { parseContractError };

