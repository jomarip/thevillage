/**
 * Village Transaction Registry
 * 
 * Provides clean, one-liner transaction functions for Village platform operations.
 * Handles all the transaction building internally.
 */

import { signAndSubmitMovementEntryFunction } from './movementPrivyTx';
import {
  MODULE_PATHS,
  MEMBERS_REGISTRY_ADDR,
  COMPLIANCE_REGISTRY_ADDR,
  TREASURY_ADDR,
  POOL_REGISTRY_ADDR,
  GOVERNANCE_ADDR,
  BANK_REGISTRY_ADDR,
  TOKEN_ADMIN_ADDR,
  moveToOctas,
  timeDollarsToBaseUnits,
} from './config';
import { Role, VotingMechanism, VoteChoice } from '@/types/contract';
import { stringToBytes } from './utils';

// Import the type from movementPrivyTx to ensure consistency
type PrivySignRawHash = (opts: {
  address: string;
  chainType: string; // Privy React SDK may support 'aptos' for Movement even if types don't show it
  hash: `0x${string}`;
}) => Promise<{ signature: `0x${string}` }>;

interface VillageTxOptions {
  senderAddress: string;
  senderPublicKeyHex: string;
  signRawHash: PrivySignRawHash;
}

/**
 * Village Transaction Registry
 * 
 * Usage:
 * const villageTx = new VillageTx({ senderAddress, senderPublicKeyHex, signRawHash });
 * await villageTx.recordHours({ recipient, hours });
 */
export class VillageTx {
  constructor(private opts: VillageTxOptions) {}

  // ============================================================================
  // Membership Transactions
  // ============================================================================

  async requestMembership(role: Role, note: string): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.members}::request_membership`,
      functionArgs: [
        MEMBERS_REGISTRY_ADDR,
        role,
        Array.from(stringToBytes(note)),
      ],
    });
  }

  async acceptMembership(): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.members}::accept_membership`,
      functionArgs: [MEMBERS_REGISTRY_ADDR],
    });
  }

  // ============================================================================
  // TimeBank Transactions
  // ============================================================================

  async createTimeBankRequest(hours: number, activityId: number): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.timebank}::create_request`,
      functionArgs: [
        hours,
        activityId,
        MEMBERS_REGISTRY_ADDR,
        BANK_REGISTRY_ADDR,
      ],
    });
  }

  async approveTimeBankRequest(requestId: number): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.timebank}::approve_request`,
      functionArgs: [
        requestId,
        MEMBERS_REGISTRY_ADDR,
        COMPLIANCE_REGISTRY_ADDR,
        BANK_REGISTRY_ADDR,
        TOKEN_ADMIN_ADDR,
      ],
    });
  }

  // ============================================================================
  // Treasury Transactions
  // ============================================================================

  async depositToTreasury(amountInMove: number): Promise<string> {
    const amountInOctas = moveToOctas(amountInMove);
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.treasury}::deposit`,
      functionArgs: [
        amountInOctas,
        TREASURY_ADDR,
        MEMBERS_REGISTRY_ADDR,
        COMPLIANCE_REGISTRY_ADDR,
      ],
    });
  }

  async withdrawFromTreasury(amountInMove: number): Promise<string> {
    const amountInOctas = moveToOctas(amountInMove);
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.treasury}::withdraw`,
      functionArgs: [amountInOctas, TREASURY_ADDR],
    });
  }

  // ============================================================================
  // Time Token Transactions
  // ============================================================================

  async transferTimeToken(recipient: string, amountInTimeDollars: number): Promise<string> {
    const amountInBaseUnits = timeDollarsToBaseUnits(amountInTimeDollars);
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.time_token}::transfer`,
      functionArgs: [recipient, amountInBaseUnits, TOKEN_ADMIN_ADDR],
    });
  }

  // ============================================================================
  // Governance Transactions
  // ============================================================================

  async createProposal(
    title: string,
    description: string,
    threshold: number,
    votingMechanism: VotingMechanism
  ): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.governance}::create_proposal`,
      functionArgs: [
        Array.from(stringToBytes(title)),
        Array.from(stringToBytes(description)),
        threshold,
        votingMechanism,
        null, // action - optional
        MEMBERS_REGISTRY_ADDR,
        TOKEN_ADMIN_ADDR,
        GOVERNANCE_ADDR,
      ],
    });
  }

  async voteOnProposal(proposalId: number, choice: VoteChoice): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.governance}::vote`,
      functionArgs: [
        proposalId,
        choice,
        GOVERNANCE_ADDR,
        MEMBERS_REGISTRY_ADDR,
        TOKEN_ADMIN_ADDR,
      ],
    });
  }

  // ============================================================================
  // Rewards Transactions
  // ============================================================================

  async stake(poolId: number, amount: number): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.rewards}::stake`,
      functionArgs: [poolId, amount, POOL_REGISTRY_ADDR],
    });
  }

  async claimRewards(poolId: number): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.rewards}::claim_rewards`,
      functionArgs: [poolId, POOL_REGISTRY_ADDR],
    });
  }

  async unstake(poolId: number, amount: number): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.rewards}::unstake`,
      functionArgs: [poolId, amount, POOL_REGISTRY_ADDR],
    });
  }

  // ============================================================================
  // Admin Transactions
  // ============================================================================

  async whitelistAddress(addressToWhitelist: string): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.compliance}::whitelist_address`,
      functionArgs: [addressToWhitelist, COMPLIANCE_REGISTRY_ADDR],
    });
  }

  async approveMembershipRequest(requestId: number): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.members}::approve_membership`,
      functionArgs: [requestId, MEMBERS_REGISTRY_ADDR],
    });
  }

  async rejectMembershipRequest(requestId: number): Promise<string> {
    return signAndSubmitMovementEntryFunction({
      ...this.opts,
      chainType: 'aptos',
      functionId: `${MODULE_PATHS.members}::reject_membership`,
      functionArgs: [requestId, MEMBERS_REGISTRY_ADDR],
    });
  }
}
