"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { useMemo } from "react";
import { useMovementWallet } from "./useMovementWallet";
import { useNightlyWallet } from "./useNightlyWallet";
import { signAndSubmitMovementEntryFunction } from "@/lib/movementPrivyTx";

/**
 * Unified Wallet Hook
 * 
 * Provides a unified interface for multiple wallet types:
 * - Aptos wallet adapter (Petra, Nightly) - Tier 3 support (fully abstracted)
 * - Privy embedded Movement wallets - Tier 2 support (raw signing)
 * 
 * Automatically detects which wallet type is active and provides appropriate methods.
 * Priority: Aptos adapter (Petra/Nightly) > Privy embedded wallet
 * 
 * Transaction Signing:
 * - Petra/Nightly: Uses wallet adapter's signAndSubmitTransaction (handles network internally)
 * - Privy: Uses Tier 2 pattern - builds transaction, signs raw hash, submits via SDK
 * 
 * Error Handling:
 * - Provides helpful error messages for network configuration issues
 * - Suggests using Privy if Petra/Nightly network configuration fails
 * 
 * Extensibility:
 * - Easy to add new wallet types by extending walletType detection logic
 * - Transaction signing is abstracted, so new wallets just need to implement signAndSubmitTransaction
 */
export function useUnifiedWallet() {
  const aptosWallet = useWallet();
  const privy = usePrivy();
  const { movementWallet } = useMovementWallet();
  const { signRawHash } = useSignRawHash();
  const nightlyWallet = useNightlyWallet();

  // Determine active wallet type
  // Priority: Direct Nightly > Aptos adapter (Petra/Nightly) > Privy embedded wallet
  const walletType = useMemo<"nightly-direct" | "aptos" | "privy" | null>(() => {
    // Check direct Nightly connection first (bypasses adapter validation)
    // This is the preferred method for Nightly as it supports Movement Network natively
    if (nightlyWallet.connected && nightlyWallet.account) {
      return "nightly-direct";
    }
    // Check if using Petra or Nightly via adapter
    // Note: If Nightly is connected via adapter, we still use it, but direct is preferred
    if (aptosWallet.connected && aptosWallet.account) {
      return "aptos";
    }
    // Check Privy embedded wallet
    if (privy.authenticated && movementWallet) {
      return "privy";
    }
    return null;
  }, [nightlyWallet.connected, nightlyWallet.account, aptosWallet.connected, aptosWallet.account, privy.authenticated, movementWallet]);

  // Get active account
  // Priority: Direct Nightly > Aptos adapter (Petra/Nightly) > Privy
  const account = useMemo(() => {
    // Direct Nightly connection (preferred for Movement Network)
    if (walletType === "nightly-direct" && nightlyWallet.account) {
      return {
        address: nightlyWallet.account.address,
        publicKey: nightlyWallet.account.publicKey,
      };
    }
    // Aptos adapter (Petra or Nightly via adapter)
    if (walletType === "aptos" && aptosWallet.account) {
      return {
        address: aptosWallet.account.address,
        publicKey: aptosWallet.account.publicKey,
      };
    }
    // Privy embedded wallet
    if (walletType === "privy" && movementWallet) {
      return {
        address: movementWallet.address,
        publicKey: movementWallet.publicKey,
      };
    }
    return null;
  }, [walletType, nightlyWallet.account, aptosWallet.account, movementWallet]);

  // Sign and submit transaction
  // Supports: Direct Nightly (bypasses adapter), Petra/Nightly (via adapter), and Privy (embedded wallet)
  // Priority: Direct Nightly > Petra/Nightly (adapter) > Privy (with automatic fallback)
  const signAndSubmitTransaction = async (payload: {
    data: {
      function: string;
      functionArguments: any[];
      typeArguments?: string[];
    };
  }) => {
    // Use direct Nightly integration first (bypasses adapter network validation)
    // This is the preferred method for Nightly as it natively supports Movement Network
    if (walletType === "nightly-direct" && nightlyWallet.signAndSubmitTransaction) {
      try {
        return await nightlyWallet.signAndSubmitTransaction({
          data: {
            function: payload.data.function,
            functionArguments: payload.data.functionArguments,
            typeArguments: payload.data.typeArguments || [],
          },
        });
      } catch (error: any) {
        console.error("Nightly transaction error:", error);
        throw error;
      }
    }

    // Try Aptos adapter for Petra (not Nightly, as we use direct Nightly above)
    if (walletType === "aptos" && aptosWallet.signAndSubmitTransaction) {
      try {
        return await aptosWallet.signAndSubmitTransaction(payload);
      } catch (error: any) {
        // Check if it's a network validation error
        const isNetworkError = error.message?.includes("Invalid network") || 
                              error.message?.includes("custom network not supported") ||
                              error.message?.includes("network not supported");
        
        if (isNetworkError) {
          // Automatic fallback to Privy if available
          if (privy.authenticated && movementWallet) {
            // Fall through to Privy implementation below - will be caught by the Privy check
          } else if (privy.authenticated && !movementWallet) {
            // User is authenticated with Privy but doesn't have Movement wallet yet
            throw new Error(
              "Network error: Your wallet (Petra/Nightly) doesn't support Movement Network. " +
              "You're logged in with Privy but need to create a Movement wallet. " +
              "Please disconnect and reconnect with Privy to create a Movement wallet, or configure your current wallet for Movement Network."
            );
          } else {
            // No Privy fallback available, provide helpful error
            throw new Error(
              "Network configuration error: Your wallet (Petra/Nightly) doesn't support Movement Network. " +
              "The Aptos wallet adapter validates networks and rejects custom networks like Movement. " +
              "Please use Privy wallet instead (email login) - it natively supports Movement Network and works without configuration."
            );
          }
        } else {
          // Non-network error, re-throw
          throw error;
        }
      }
    }
    
    // Use Privy (either as primary wallet or fallback from Aptos adapter)
    // Note: Fallback happens when walletType === "aptos" but we caught a network error above
    if ((walletType === "privy" || (walletType === "aptos" && privy.authenticated)) && movementWallet) {
      // Use Privy Tier 2 pattern: build -> sign raw hash -> submit
      // Privy natively supports Movement Network
      const txHash = await signAndSubmitMovementEntryFunction({
        senderAddress: movementWallet.address,
        senderPublicKeyHex: movementWallet.publicKey,
        chainType: 'movement',
        signRawHash,
        functionId: payload.data.function,
        functionArgs: payload.data.functionArguments,
        typeArgs: [],
      });

      // Return in format compatible with wallet adapter response
      return {
        hash: txHash,
        success: true,
      };
    }

    throw new Error("No wallet connected. Please connect a wallet (Petra, Nightly, or Privy) to continue.");
  };

  // Unified disconnect function that disconnects all wallet types
  const disconnectAll = async () => {
    try {
      // Disconnect in order: Nightly direct, Aptos adapter, Privy
      if (walletType === "nightly-direct") {
        await nightlyWallet.disconnect();
      }
      if (walletType === "aptos" && aptosWallet.disconnect) {
        await aptosWallet.disconnect();
      }
      if (walletType === "privy" && privy.logout) {
        await privy.logout();
      }
    } catch (error) {
      console.error("Error during disconnect:", error);
      // Continue even if one fails
    }
  };

  return {
    account,
    connected: walletType !== null,
    connecting: aptosWallet.connecting || privy.ready === false || nightlyWallet.connecting,
    walletType,
    signAndSubmitTransaction,
    disconnect: disconnectAll,
    // Nightly-specific methods
    connectNightly: nightlyWallet.connect,
    disconnectNightly: nightlyWallet.disconnect,
    nightlyConnecting: nightlyWallet.connecting,
    nightlyInstalled: nightlyWallet.isInstalled,
    // Expose underlying hooks for advanced usage
    aptosWallet,
    privy,
    movementWallet,
  };
}
