/**
 * Testing utilities and mock data helpers for The Village platform
 * 
 * These utilities help with:
 * - Generating mock data for testing
 * - Creating test scenarios
 * - Validating data structures
 * - Simulating blockchain responses
 */

import { Role, RequestStatus, PoolStatus, ProposalStatus, VoteChoice } from "@/types/contract";
import { formatAddress } from "./config";

/**
 * Generate a random address for testing
 */
export function generateTestAddress(): string {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 64; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Generate mock member data
 */
export function generateMockMember(overrides?: Partial<{
  address: string;
  role: Role;
  isWhitelisted: boolean;
  joinedAt: number;
}>) {
  return {
    address: overrides?.address || generateTestAddress(),
    role: overrides?.role || Role.Depositor,
    isWhitelisted: overrides?.isWhitelisted ?? true,
    joinedAt: overrides?.joinedAt || Date.now() - Math.random() * 86400000 * 90,
  };
}

/**
 * Generate mock Time Bank request
 */
export function generateMockTimeBankRequest(overrides?: Partial<{
  id: number;
  requester: string;
  hours: number;
  activityId: number;
  status: RequestStatus;
  createdAt: number;
}>) {
  return {
    id: overrides?.id || Math.floor(Math.random() * 1000),
    requester: overrides?.requester || generateTestAddress(),
    hours: overrides?.hours || Math.floor(Math.random() * 20) + 1,
    activityId: overrides?.activityId || Math.floor(Math.random() * 8),
    status: overrides?.status || RequestStatus.Pending,
    createdAt: overrides?.createdAt || Date.now() - Math.random() * 86400000 * 7,
  };
}

/**
 * Generate mock project data
 */
export function generateMockProject(overrides?: Partial<{
  id: number;
  name: string;
  description: string;
  borrower: string;
  targetAmount: number;
  currentAmount: number;
  status: PoolStatus;
  createdAt: number;
}>) {
  return {
    id: overrides?.id || Math.floor(Math.random() * 100),
    name: overrides?.name || `Test Project ${Math.floor(Math.random() * 100)}`,
    description: overrides?.description || "A test project description",
    borrower: overrides?.borrower || generateTestAddress(),
    targetAmount: overrides?.targetAmount || Math.floor(Math.random() * 100000) * 1e8,
    currentAmount: overrides?.currentAmount || 0,
    status: overrides?.status || PoolStatus.Proposed,
    createdAt: overrides?.createdAt || Date.now() - Math.random() * 86400000 * 30,
  };
}

/**
 * Generate mock proposal data
 */
export function generateMockProposal(overrides?: Partial<{
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  votesYes: number;
  votesNo: number;
  createdAt: number;
}>) {
  return {
    id: overrides?.id || Math.floor(Math.random() * 100),
    title: overrides?.title || `Test Proposal ${Math.floor(Math.random() * 100)}`,
    description: overrides?.description || "A test proposal description",
    proposer: overrides?.proposer || generateTestAddress(),
    status: overrides?.status || ProposalStatus.Active,
    votesYes: overrides?.votesYes || Math.floor(Math.random() * 50),
    votesNo: overrides?.votesNo || Math.floor(Math.random() * 30),
    votesAbstain: 0,
    threshold: 10,
    votingMechanism: 0,
    createdAt: overrides?.createdAt || Date.now() - Math.random() * 86400000 * 7,
    endsAt: Date.now() + Math.random() * 86400000 * 7,
  };
}

/**
 * Generate multiple mock items
 */
export function generateMockItems<T>(
  generator: () => T,
  count: number,
  overrides?: (index: number) => Partial<T>
): T[] {
  return Array.from({ length: count }, (_, index) => {
    const base = generator();
    const override = overrides ? overrides(index) : {};
    return { ...base, ...override } as T;
  });
}

/**
 * Validate address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

/**
 * Validate community ID
 */
export function isValidCommunityId(id: number): boolean {
  return Number.isInteger(id) && id >= 0;
}

/**
 * Validate project ID
 */
export function isValidProjectId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

/**
 * Simulate blockchain delay
 */
export async function simulateBlockchainDelay(ms: number = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create test scenario data
 */
export interface TestScenario {
  name: string;
  members: ReturnType<typeof generateMockMember>[];
  projects: ReturnType<typeof generateMockProject>[];
  proposals: ReturnType<typeof generateMockProposal>[];
  requests: ReturnType<typeof generateMockTimeBankRequest>[];
}

/**
 * Generate a complete test scenario
 */
export function generateTestScenario(name: string): TestScenario {
  return {
    name,
    members: generateMockItems(generateMockMember, 10, (i) => ({
      role: i === 0 ? Role.Admin : i < 3 ? Role.Validator : Role.Depositor,
      isWhitelisted: i < 7,
    })),
    projects: generateMockItems(generateMockProject, 5, (i) => ({
      status: i === 0 ? PoolStatus.Proposed : i === 1 ? PoolStatus.Active : PoolStatus.Approved,
    })),
    proposals: generateMockItems(generateMockProposal, 3, (i) => ({
      status: i === 0 ? ProposalStatus.Active : ProposalStatus.Passed,
    })),
    requests: generateMockItems(generateMockTimeBankRequest, 8, (i) => ({
      status: i < 3 ? RequestStatus.Pending : RequestStatus.Approved,
    })),
  };
}

/**
 * Format test data for display
 */
export function formatTestData(data: any): string {
  if (typeof data === "string") {
    if (isValidAddress(data)) {
      return formatAddress(data);
    }
    return data;
  }
  if (typeof data === "number") {
    return data.toLocaleString();
  }
  if (Array.isArray(data)) {
    return `[${data.length} items]`;
  }
  if (typeof data === "object" && data !== null) {
    return JSON.stringify(data, null, 2);
  }
  return String(data);
}

/**
 * Test helper: Check if running in test environment
 */
export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.NEXT_PUBLIC_TEST_MODE === "true" ||
    typeof window !== "undefined" && (window as any).__TEST_MODE__
  );
}

/**
 * Test helper: Enable test mode
 */
export function enableTestMode() {
  if (typeof window !== "undefined") {
    (window as any).__TEST_MODE__ = true;
  }
}

/**
 * Test helper: Disable test mode
 */
export function disableTestMode() {
  if (typeof window !== "undefined") {
    delete (window as any).__TEST_MODE__;
  }
}

/**
 * Mock blockchain response wrapper
 */
export function mockBlockchainResponse<T>(data: T, delay: number = 500): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Create test transaction hash
 */
export function generateTestTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}`;
}
