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
    const debugInfo = {
      nightlyConnected: nightlyWallet.connected,
      hasNightlyAccount: !!nightlyWallet.account,
      aptosConnected: aptosWallet.connected,
      hasAptosAccount: !!aptosWallet.account,
      privyAuthenticated: privy.authenticated,
      hasMovementWallet: !!movementWallet,
      hasLinkedAccounts: !!privy.user?.linkedAccounts,
      linkedAccountsCount: privy.user?.linkedAccounts?.length || 0,
    };
    console.log('[useUnifiedWallet] Determining walletType:', debugInfo);

    // Check direct Nightly connection first (bypasses adapter validation)
    // This is the preferred method for Nightly as it supports Movement Network natively
    if (nightlyWallet.connected && nightlyWallet.account) {
      console.log('[useUnifiedWallet] Wallet type: nightly-direct');
      return "nightly-direct";
    }
    // Check if using Petra or Nightly via adapter
    // Note: If Nightly is connected via adapter, we still use it, but direct is preferred
    if (aptosWallet.connected && aptosWallet.account) {
      console.log('[useUnifiedWallet] Wallet type: aptos');
      return "aptos";
    }
    // Check Privy embedded wallet
    // Check if we have movementWallet OR if Privy is authenticated (even if movementWallet is null due to missing publicKey)
    // This ensures connected state is true even when wallet is missing publicKey temporarily
    const hasPrivyWallet = privy.authenticated && (movementWallet || privy.user?.linkedAccounts?.some((a: any) => 
      a.type === 'wallet' && (a.chainType === 'movement' || a.chainType === 'aptos')
    ));
    if (hasPrivyWallet) {
      console.log('[useUnifiedWallet] Wallet type: privy');
      return "privy";
    }
    console.log('[useUnifiedWallet] Wallet type: null (no wallet detected)');
    return null;
  }, [nightlyWallet.connected, nightlyWallet.account, aptosWallet.connected, aptosWallet.account, privy.authenticated, privy.user?.linkedAccounts, movementWallet]);

  // Get active account
  // Priority: Direct Nightly > Aptos adapter (Petra/Nightly) > Privy
  const account = useMemo(() => {
    console.log('[useUnifiedWallet] Computing account:', {
      walletType,
      hasNightlyAccount: !!nightlyWallet.account,
      hasAptosAccount: !!aptosWallet.account,
      hasMovementWallet: !!movementWallet,
      movementWalletAddress: movementWallet?.address,
      hasLinkedAccounts: !!privy.user?.linkedAccounts,
      authenticated: privy.authenticated,
    });

    // Direct Nightly connection (preferred for Movement Network)
    if (walletType === "nightly-direct" && nightlyWallet.account) {
      console.log('[useUnifiedWallet] Using Nightly direct account');
      return {
        address: nightlyWallet.account.address,
        publicKey: nightlyWallet.account.publicKey,
      };
    }
    // Aptos adapter (Petra or Nightly via adapter)
    if (walletType === "aptos" && aptosWallet.account) {
      console.log('[useUnifiedWallet] Using Aptos adapter account');
      return {
        address: aptosWallet.account.address,
        publicKey: aptosWallet.account.publicKey,
      };
    }
    // Privy embedded wallet
    if (walletType === "privy") {
      // First try movementWallet (has publicKey)
      if (movementWallet) {
        console.log('[useUnifiedWallet] Using movementWallet account:', {
          address: movementWallet.address,
          hasPublicKey: !!movementWallet.publicKey,
        });
        return {
          address: movementWallet.address,
          publicKey: movementWallet.publicKey,
        };
      }
      // Fallback: try to get address from linkedAccounts even if no publicKey
      // This allows UI to show connected state even when publicKey is missing
      if (privy.user?.linkedAccounts) {
        const wallet = privy.user.linkedAccounts.find(
          (a: any) => a.type === 'wallet' && (a.chainType === 'movement' || a.chainType === 'aptos')
        ) as any;
        if (wallet) {
          // Privy's wallet type has address property
          const address = wallet.address || (wallet as any).walletAddress;
          console.log('[useUnifiedWallet] Found wallet in linkedAccounts (fallback):', {
            address,
            hasPublicKey: !!(wallet as any).public_key || !!(wallet as any).publicKey,
            walletKeys: Object.keys(wallet),
          });
          if (address) {
            // Return account with address, but publicKey might be missing
            // This is okay for display purposes, but transactions will fail if publicKey is missing
            const account = {
              address: address.startsWith('0x') ? address : `0x${address}`,
              publicKey: (wallet as any).public_key || (wallet as any).publicKey || (wallet as any).publicKeyHex || '', // May be empty
            };
            console.log('[useUnifiedWallet] Returning fallback account:', account);
            return account;
          }
        }
      }
      console.log('[useUnifiedWallet] No Privy account found');
    }
    console.log('[useUnifiedWallet] No account found - returning null');
    return null;
  }, [walletType, nightlyWallet.account, aptosWallet.account, movementWallet, privy.user?.linkedAccounts, privy.authenticated]);

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
        // Cast payload to work around TypeScript type limitations with Aptos SDK
        return await aptosWallet.signAndSubmitTransaction(payload as any);
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
    if ((walletType === "privy" || (walletType === "aptos" && privy.authenticated))) {
      // Check if we have movementWallet with publicKey
      if (!movementWallet) {
        // Try to get account from linkedAccounts as fallback
        const fallbackWallet = privy.user?.linkedAccounts?.find(
          (a: any) => a.type === 'wallet' && (a.chainType === 'movement' || a.chainType === 'aptos')
        );
        if (fallbackWallet) {
          const address = (fallbackWallet as any).address || (fallbackWallet as any).walletAddress;
          throw new Error(
            `Movement wallet found but missing required information (publicKey). ` +
            `Please click "Connect Wallet" and reconnect your Privy wallet to restore access. ` +
            `Your wallet address: ${address}`
          );
        }
        throw new Error(
          "No Movement wallet found. Please connect your Privy wallet first."
        );
      }

      // Validate Movement wallet has required fields
      if (!movementWallet.address || !movementWallet.publicKey) {
        // Add detailed logging to help debug
        console.error('Movement wallet validation failed:', {
          hasAddress: !!movementWallet.address,
          hasPublicKey: !!movementWallet.publicKey,
          address: movementWallet.address,
          publicKey: movementWallet.publicKey ? movementWallet.publicKey.substring(0, 20) + '...' : 'missing',
          walletObject: movementWallet,
        });
        throw new Error(
          `Movement wallet is missing required information (publicKey). ` +
          `Please click "Connect Wallet" and reconnect your Privy wallet to restore access. ` +
          `Your wallet address: ${movementWallet.address || 'unknown'}`
        );
      }

      // Ensure address is properly formatted (Aptos/Movement addresses are 66 chars: 0x + 64 hex)
      let formattedAddress = movementWallet.address;
      if (!formattedAddress.startsWith('0x')) {
        formattedAddress = `0x${formattedAddress}`;
      }
      
      // Ensure public key is properly formatted
      let formattedPublicKey = movementWallet.publicKey;
      if (!formattedPublicKey.startsWith('0x')) {
        formattedPublicKey = `0x${formattedPublicKey}`;
      }

      // Use Privy Tier 2 pattern: build -> sign raw hash -> submit
      // Privy natively supports Movement Network
      try {
        // Use Privy's raw sign - note: Privy React SDK may support 'aptos' for Movement
        // even if TypeScript types don't reflect it. We cast signRawHash to work around type limitations.
        const txHash = await signAndSubmitMovementEntryFunction({
          senderAddress: formattedAddress,
          senderPublicKeyHex: formattedPublicKey,
          chainType: 'aptos', // Movement uses Aptos standards, so use 'aptos' chainType
          signRawHash: signRawHash as any, // Cast to work around TypeScript type limitations
          functionId: payload.data.function,
          functionArgs: payload.data.functionArguments,
          typeArgs: payload.data.typeArguments,
        });

        // Return in format compatible with wallet adapter response
        return {
          hash: txHash,
          success: true,
        };
      } catch (error: any) {
        // Provide helpful error messages for common issues
        if (error?.message?.includes("wallet not found") || 
            error?.message?.includes("account not found")) {
          throw new Error(
            "Movement wallet not found. Please ensure your Privy wallet is connected and has a Movement wallet created. " +
            "Try disconnecting and reconnecting your wallet."
          );
        }
        throw error;
      }
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
    connecting: (aptosWallet as any).connecting || privy.ready === false || nightlyWallet.connecting,
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
