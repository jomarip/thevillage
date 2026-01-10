/**
 * Configuration for the Villages Finance Platform
 * 
 * Environment variables are loaded from .env.local
 * Create a .env.local file with the following variables:
 * 
 * NEXT_PUBLIC_MOVEMENT_NETWORK=testnet
 * NEXT_PUBLIC_MOVEMENT_RPC_URL=https://testnet.movementnetwork.xyz/v1
 * NEXT_PUBLIC_MOVEMENT_INDEXER_URL=https://hasura.testnet.movementnetwork.xyz/v1/graphql
 * NEXT_PUBLIC_MOVEMENT_FAUCET_URL=https://faucet.testnet.movementnetwork.xyz/
 * NEXT_PUBLIC_CONTRACT_ADDRESS=0x2144ec184b89cf405e430d375b3de991ae14baf26cb6ec9987ea57922c0f1c5b
 * NEXT_PUBLIC_EXPLORER_URL=https://explorer.movementnetwork.xyz/?network=bardock+testnet
 */

import { Network } from "@aptos-labs/ts-sdk";

// Movement Network Configuration
export const MOVEMENT_NETWORK = (process.env.NEXT_PUBLIC_MOVEMENT_NETWORK as "mainnet" | "testnet" | "devnet") || "testnet";
export const MOVEMENT_REST_URL = process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || "https://testnet.movementnetwork.xyz/v1";
export const MOVEMENT_INDEXER_URL = process.env.NEXT_PUBLIC_MOVEMENT_INDEXER_URL || "https://hasura.testnet.movementnetwork.xyz/v1/graphql";
export const MOVEMENT_FAUCET_URL = process.env.NEXT_PUBLIC_MOVEMENT_FAUCET_URL || "https://faucet.testnet.movementnetwork.xyz/";
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.movementnetwork.xyz/?network=bardock+testnet";

// Contract Configuration - Villages Finance deployed contract
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x2144ec184b89cf405e430d375b3de991ae14baf26cb6ec9987ea57922c0f1c5b";

// Registry addresses - all point to contract address for MVP
export const ADMIN_ADDR = CONTRACT_ADDRESS;
export const MEMBERS_REGISTRY_ADDR = CONTRACT_ADDRESS;
export const COMPLIANCE_REGISTRY_ADDR = CONTRACT_ADDRESS;
export const TREASURY_ADDR = CONTRACT_ADDRESS;
export const POOL_REGISTRY_ADDR = CONTRACT_ADDRESS;
export const GOVERNANCE_ADDR = CONTRACT_ADDRESS;
export const BANK_REGISTRY_ADDR = CONTRACT_ADDRESS;
export const PROJECT_REGISTRY_ADDR = CONTRACT_ADDRESS;
export const FRACTIONAL_SHARES_ADDR = CONTRACT_ADDRESS;
export const TOKEN_ADMIN_ADDR = CONTRACT_ADDRESS;

// Network type mapping for SDK
// Note: Using Move SDK (Aptos-compatible) with custom endpoints for Movement Network compatibility
export const getNetworkType = (): Network => {
  // Movement testnet uses custom endpoints, but SDK expects Network enum
  // Using TESTNET as base and overriding with custom URLs in AptosConfig
  switch (MOVEMENT_NETWORK) {
    case "mainnet":
      return Network.MAINNET;
    case "testnet":
      return Network.TESTNET;
    case "devnet":
      return Network.DEVNET;
    default:
      return Network.TESTNET;
  }
};

// Module paths for contract interactions
export const MODULE_PATHS = {
  members: `${CONTRACT_ADDRESS}::members`,
  compliance: `${CONTRACT_ADDRESS}::compliance`,
  timebank: `${CONTRACT_ADDRESS}::timebank`,
  time_token: `${CONTRACT_ADDRESS}::time_token`,
  treasury: `${CONTRACT_ADDRESS}::treasury`,
  investment_pool: `${CONTRACT_ADDRESS}::investment_pool`,
  governance: `${CONTRACT_ADDRESS}::governance`,
  rewards: `${CONTRACT_ADDRESS}::rewards`,
  project_registry: `${CONTRACT_ADDRESS}::project_registry`,
  fractional_asset: `${CONTRACT_ADDRESS}::fractional_asset`,
  token: `${CONTRACT_ADDRESS}::token`,
  registry_hub: `${CONTRACT_ADDRESS}::registry_hub`,
} as const;

// Move token conversion constants
export const OCTAS_PER_MOVE = 100_000_000;

// Convert Move tokens to Octas
export function moveToOctas(move: number): number {
  return Math.floor(move * OCTAS_PER_MOVE);
}

// Convert Octas to Move tokens
export function octasToMove(octas: number): number {
  return octas / OCTAS_PER_MOVE;
}

// Legacy aliases for backward compatibility
export const OCTAS_PER_APT = OCTAS_PER_MOVE;
export const aptToOctas = moveToOctas;
export const octasToApt = octasToMove;

// Time Token conversion constants (8 decimals)
export const TIME_TOKEN_DECIMALS = 8;
export const TIME_TOKEN_BASE_UNITS = 100_000_000; // 10^8

// Convert Time Dollars (display units) to base units
export function timeDollarsToBaseUnits(timeDollars: number): number {
  return Math.floor(timeDollars * TIME_TOKEN_BASE_UNITS);
}

// Convert base units to Time Dollars (display units)
export function baseUnitsToTimeDollars(baseUnits: number): number {
  return baseUnits / TIME_TOKEN_BASE_UNITS;
}

// Format address for display (truncate middle)
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Get explorer URL for transaction
export function getTransactionUrl(txHash: string): string {
  return `${EXPLORER_URL}&txn=${txHash}`;
}

// Get explorer URL for account
export function getAccountUrl(address: string): string {
  return `${EXPLORER_URL}&account=${address}`;
}

