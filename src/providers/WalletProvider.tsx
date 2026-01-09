"use client";

import { ReactNode, useMemo } from "react";
import {
  AptosWalletAdapterProvider,
} from "@aptos-labs/wallet-adapter-react";

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * Wallet Provider Component
 * 
 * Wraps the application with AptosWalletAdapterProvider to enable
 * wallet connections and blockchain interactions.
 * 
 * Supports Multiple Wallet Types:
 * - Petra Wallet (via AptosConnect, included by default)
 * - Nightly Wallet (auto-detected via wallet-standard, included in adapter)
 * - Aptos Connect (auto-detected)
 * - Privy Wallet (embedded wallet solution via PrivyProvider)
 * 
 * Network Configuration:
 * - Movement Network is a custom network (not standard Aptos Mainnet/Testnet/Devnet)
 * - The Aptos wallet adapter validates networks and rejects custom networks
 * - Solution: We don't pass network in dappConfig, letting wallets handle their own network settings
 * - Users must configure Petra/Nightly to use Movement Network manually in wallet settings
 * - Privy natively supports Movement Network and doesn't require manual configuration
 * 
 * Transaction Flow:
 * - Petra/Nightly: Use Aptos adapter's signAndSubmitTransaction (Tier 3 - fully abstracted)
 * - Privy: Use Tier 2 pattern (build -> sign raw hash -> submit) via useUnifiedWallet
 * - All wallet types are unified through useUnifiedWallet hook for consistent API
 * 
 * Performance:
 * - Network validation errors are filtered to avoid console spam
 * - Only non-network errors are logged for debugging
 */
export function WalletProvider({ children }: WalletProviderProps) {
  // Show Petra and Nightly as options even when not already installed
  // Nightly will be auto-detected by the wallet adapter if installed
  const optInWallets = ["Petra", "Nightly"];

  // DApp configuration
  const dappInfo = useMemo(() => ({
    aptosConnect: {
      dappName: "The Village", // Defaults to document's title if not provided
      // dappImageURI: "..." // Optional: defaults to dapp's favicon
    },
  }), []);

  // DApp config WITHOUT network - let wallets handle their own network settings
  // This prevents "Invalid network, custom network not supported" errors
  // Wallets (Petra, Nightly) will use their own network configuration
  // Users must configure their wallets to use Movement Network manually
  const dappConfig = useMemo(() => ({
    // Don't include network - wallets handle their own network settings
    // This allows Petra/Nightly to work with Movement Network (custom network)
    aptosConnect: {
      dappName: "The Village",
      // dappImageURI: "..." // Optional: defaults to dapp's favicon
    },
  }), []);

  return (
    <AptosWalletAdapterProvider
      optInWallets={optInWallets}
      autoConnect={false}
      dappInfo={dappInfo}
      dappConfig={dappConfig}
      onError={(error) => {
        // Only log non-network validation errors to avoid spam
        // Network validation errors are expected for custom networks like Movement
        const isNetworkError = error.message?.includes("Invalid network") || 
                              error.message?.includes("custom network not supported");
        if (!isNetworkError) {
          console.error("Wallet adapter error:", error);
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}

