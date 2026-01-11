"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getAptosWallets, type AptosWallet, type NetworkInfo } from "@aptos-labs/wallet-standard";
import { Aptos, AptosConfig, Network as AptosNetwork, AccountAuthenticatorEd25519 } from "@aptos-labs/ts-sdk";
import { MOVEMENT_REST_URL } from "@/lib/config";

// Movement Network configuration
// Bardock Testnet: chainId 250
// Movement Mainnet: chainId 126
const MOVEMENT_TESTNET_CHAIN_ID = 250;
const MOVEMENT_MAINNET_CHAIN_ID = 126;

// Determine which network we're using based on the REST URL
const getMovementChainId = (): number => {
  if (MOVEMENT_REST_URL.includes("testnet")) {
    return MOVEMENT_TESTNET_CHAIN_ID;
  }
  return MOVEMENT_MAINNET_CHAIN_ID;
};

interface NightlyWalletState {
  adapter: AptosWallet | null;
  connected: boolean;
  account: { address: string; publicKey: string } | null;
  connecting: boolean;
}

/**
 * Direct Nightly Wallet Integration Hook
 * 
 * This hook bypasses the AptosWalletAdapterProvider's network validation
 * by using Nightly's adapter directly with Movement Network configuration.
 * 
 * Based on Nightly's official documentation for Movement Network:
 * https://docs.nightly.app/wallets/nightly-extension/aptos-movement
 */
export function useNightlyWallet() {
  const [state, setState] = useState<NightlyWalletState>({
    adapter: null,
    connected: false,
    account: null,
    connecting: false,
  });

  // Detect Nightly wallet (lazy detection to avoid blocking initial render)
  const nightlyWallet = useMemo(() => {
    if (typeof window === "undefined") return null;
    
    try {
      // Try wallet-standard detection first
      const wallets = getAptosWallets();
      const aptosWallets = wallets.aptosWallets;
      const nightly = aptosWallets.find((w) => w.name === "Nightly");
      
      if (nightly) {
        return nightly as AptosWallet;
      }
      
      // Fallback: check window.nightly directly (faster for initial detection)
      const nightlyAptos = (window as any).nightly?.aptos;
      if (nightlyAptos?.standardWallet) {
        return nightlyAptos.standardWallet as AptosWallet;
      }
      
      return null;
    } catch (error) {
      // Silently fail during detection to avoid blocking render
      return null;
    }
  }, []);

  // Retry wallet detection after a short delay if not found initially
  // This helps with wallets that inject after initial page load
  useEffect(() => {
    if (nightlyWallet || typeof window === "undefined") return;
    
    const retryDetection = setTimeout(() => {
      try {
        const wallets = getAptosWallets();
        const aptosWallets = wallets.aptosWallets;
        const nightly = aptosWallets.find((w) => w.name === "Nightly");
        if (nightly && !state.adapter) {
          setState((prev) => ({ ...prev, adapter: nightly as AptosWallet }));
        }
      } catch (error) {
        // Silently fail
      }
    }, 500);
    
    return () => clearTimeout(retryDetection);
  }, [nightlyWallet, state.adapter]);

  // Initialize adapter when Nightly is detected
  useEffect(() => {
    if (nightlyWallet && !state.adapter) {
      setState((prev) => ({ ...prev, adapter: nightlyWallet }));
    }
  }, [nightlyWallet, state.adapter]);

  // Check for existing connection ONLY if user has previously connected
  // We use sessionStorage to track if user explicitly connected
  // This prevents auto-connection on page load
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!state.adapter || state.connected) return;
      
      // Only auto-connect if user explicitly connected before (stored in sessionStorage)
      const wasConnected = typeof window !== "undefined" && 
        sessionStorage.getItem("nightly_wallet_connected") === "true";
      
      if (!wasConnected) {
        // User hasn't explicitly connected, don't auto-connect
        return;
      }

      try {
        // Method 1: Try to get account directly (if wallet is already connected)
        if (state.adapter.features["aptos:account"]) {
          try {
            const accountInfo = await state.adapter.features["aptos:account"].account();
            if (accountInfo) {
              setState({
                adapter: state.adapter,
                connected: true,
                account: {
                  address: accountInfo.address.toString(),
                  publicKey: accountInfo.publicKey.toString(),
                },
                connecting: false,
              });
              return; // Successfully got account, exit early
            }
          } catch (error) {
            // Account feature might not be available or wallet not connected
            // Clear the session flag if connection failed
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("nightly_wallet_connected");
            }
            return;
          }
        }

        // Method 2: Try silent connect to check for existing connection
        // First parameter (true) means silent - won't prompt if not connected
        const chainId = getMovementChainId();
        const networkInfo: NetworkInfo = {
          chainId,
          name: AptosNetwork.CUSTOM,
        };

        const connectResult = await state.adapter.features["aptos:connect"].connect(true, networkInfo);
        
        // Handle UserResponse type (can be approval or rejection)
        if (connectResult && typeof connectResult === 'object' && 'status' in connectResult) {
          if (connectResult.status === 'Approved' && 'args' in connectResult) {
            const account = connectResult.args;
            if (account) {
              setState({
                adapter: state.adapter,
                connected: true,
                account: {
                  address: account.address?.toString() || account.address || "",
                  publicKey: account.publicKey 
                    ? (typeof account.publicKey === 'string' ? account.publicKey : account.publicKey.toString())
                    : "",
                },
                connecting: false,
              });
            }
          }
        } else {
          // Handle direct account return (legacy format)
          const accounts = Array.isArray(connectResult) ? connectResult : [connectResult];
          const account: any = accounts[0];
          if (account) {
            setState({
              adapter: state.adapter,
              connected: true,
              account: {
                address: account.address?.toString() || account.address || "",
                publicKey: account.publicKey 
                  ? (typeof account.publicKey === 'string' ? account.publicKey : account.publicKey.toString())
                  : "",
              },
              connecting: false,
            });
          }
        }
      } catch (error) {
        // Connection failed, clear the session flag
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("nightly_wallet_connected");
        }
      }
    };

    if (state.adapter && !state.connected) {
      checkExistingConnection();
    }
  }, [state.adapter, state.connected]);

  // Connect to Nightly with Movement Network configuration
  const connect = useCallback(async () => {
    if (!state.adapter) {
      throw new Error("Nightly wallet not detected. Please install Nightly extension.");
    }

    setState((prev) => ({ ...prev, connecting: true }));

    try {
      const chainId = getMovementChainId();
      
      // Network info for Movement Network
      // Note: NetworkInfo.name expects Network enum from @aptos-labs/ts-sdk
      // The wallet-standard package uses the same Network enum from ts-sdk
      const networkInfo: NetworkInfo = {
        chainId,
        name: AptosNetwork.CUSTOM, // Use Network from @aptos-labs/ts-sdk
      };

      // Connect with Movement Network configuration
      // This is the crucial difference - we pass Network.CUSTOM with the Movement chainId
      // First parameter (false) means not silent - will prompt user if not connected
      const connectResult = await state.adapter.features["aptos:connect"].connect(false, networkInfo);
      
      // Handle UserResponse type (can be approval or rejection)
      let account: any = null;
      if (connectResult && typeof connectResult === 'object' && 'status' in connectResult) {
        if (connectResult.status === 'Approved' && 'args' in connectResult) {
          account = connectResult.args;
        } else {
          throw new Error("User rejected connection");
        }
      } else {
        // Handle direct account return (legacy format)
        const accounts = Array.isArray(connectResult) ? connectResult : [connectResult];
        account = accounts[0];
      }

      if (account) {
        // Mark that user explicitly connected (for session persistence)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("nightly_wallet_connected", "true");
        }
        setState({
          adapter: state.adapter,
          connected: true,
          account: {
            address: account.address?.toString() || account.address || "",
            publicKey: account.publicKey 
              ? (typeof account.publicKey === 'string' ? account.publicKey : account.publicKey.toString())
              : "",
          },
          connecting: false,
        });
      } else {
        throw new Error("Failed to get account from Nightly wallet");
      }
    } catch (error: any) {
      setState((prev) => ({ ...prev, connecting: false }));
      throw error;
    }
  }, [state.adapter]);

  // Disconnect from Nightly
  const disconnect = useCallback(async () => {
    // Clear session storage to prevent auto-reconnect
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("nightly_wallet_connected");
    }

    if (!state.adapter || !state.connected) {
      // Even if not connected, clear state
      setState({
        adapter: state.adapter,
        connected: false,
        account: null,
        connecting: false,
      });
      return;
    }

    try {
      await state.adapter.features["aptos:disconnect"].disconnect();
      setState({
        adapter: state.adapter,
        connected: false,
        account: null,
        connecting: false,
      });
    } catch (error) {
      console.error("Error disconnecting Nightly wallet:", error);
      // Even if disconnect fails, clear local state
      setState({
        adapter: state.adapter,
        connected: false,
        account: null,
        connecting: false,
      });
    }
  }, [state.adapter, state.connected]);

  // Sign and submit transaction using Nightly's adapter directly
  const signAndSubmitTransaction = useCallback(async (payload: {
    data: {
      function: string;
      functionArguments: any[];
      typeArguments?: string[];
    };
  }) => {
    if (!state.adapter || !state.account) {
      throw new Error("Nightly wallet not connected");
    }

    try {
      // Create Movement SDK instance
      const movementConfig = new AptosConfig({
        fullnode: MOVEMENT_REST_URL,
        network: AptosNetwork.CUSTOM,
      });
      const movement = new Aptos(movementConfig);

      // Build transaction
      const transaction = await movement.transaction.build.simple({
        sender: state.account.address,
        data: {
          function: payload.data.function as `${string}::${string}::${string}`,
          typeArguments: payload.data.typeArguments || [],
          functionArguments: payload.data.functionArguments,
        },
      });

      // Sign and submit using Nightly's adapter
      // This bypasses the AptosWalletAdapterProvider's network validation
      // Note: The adapter's signAndSubmitTransaction expects a different format,
      // so we use sign + submit separately which works with SimpleTransaction
      const signFeature = state.adapter.features["aptos:signTransaction"];
      if (!signFeature) {
        throw new Error("Nightly wallet does not support signTransaction");
      }
      
      // Sign transaction
      // Handle UserResponse type (can be approval or rejection)
      const signResult = await signFeature.signTransaction(transaction);
      let accountAuthenticator: any = null;
      
      if (signResult && typeof signResult === 'object' && 'status' in signResult) {
        if (signResult.status === 'Approved' && 'args' in signResult) {
          accountAuthenticator = signResult.args;
        } else {
          throw new Error("User rejected transaction signing");
        }
      } else {
        // Handle direct return (legacy format)
        accountAuthenticator = signResult;
      }
      
      if (!accountAuthenticator) {
        throw new Error("Failed to get account authenticator from signing");
      }
      
      // Create authenticator and submit
      const authenticator = new AccountAuthenticatorEd25519(
        accountAuthenticator.public_key,
        accountAuthenticator.signature
      );
      
      const pending = await movement.transaction.submit.simple({
        transaction,
        senderAuthenticator: authenticator,
      });
      
      // Wait for confirmation
      await movement.waitForTransaction({ transactionHash: pending.hash });
      
      return {
        hash: pending.hash,
        success: true,
      };
    } catch (error: any) {
      // If signAndSubmitTransaction fails, try sign + submit separately
      if (error.message?.includes("network") || error.message?.includes("Network")) {
        // Fallback: sign and submit separately
        const movementConfig = new AptosConfig({
          fullnode: MOVEMENT_REST_URL,
          network: AptosNetwork.CUSTOM,
        });
        const movement = new Aptos(movementConfig);

        const transaction = await movement.transaction.build.simple({
          sender: state.account.address,
          data: {
            function: payload.data.function as `${string}::${string}::${string}`,
            typeArguments: payload.data.typeArguments || [],
            functionArguments: payload.data.functionArguments,
          },
        });

        // Sign transaction
        const signFeature = state.adapter.features["aptos:signTransaction"];
        if (!signFeature) {
          throw new Error("Nightly wallet does not support signTransaction");
        }
        
        // Handle UserResponse type (can be approval or rejection)
        const signResult = await signFeature.signTransaction(transaction);
        let accountAuthenticator: any = null;
        
        if (signResult && typeof signResult === 'object' && 'status' in signResult) {
          if (signResult.status === 'Approved' && 'args' in signResult) {
            accountAuthenticator = signResult.args;
          } else {
            throw new Error("User rejected transaction signing");
          }
        } else {
          // Handle direct return (legacy format)
          accountAuthenticator = signResult;
        }
        
        if (!accountAuthenticator) {
          throw new Error("Failed to get account authenticator from signing");
        }

        // Create authenticator and submit
        const authenticator = new AccountAuthenticatorEd25519(
          accountAuthenticator.public_key,
          accountAuthenticator.signature
        );

        const pending = await movement.transaction.submit.simple({
          transaction,
          senderAuthenticator: authenticator,
        });

        return {
          hash: pending.hash,
          success: true,
        };
      }
      throw error;
    }
  }, [state.adapter, state.account]);

  // Check if Nightly is installed
  const isInstalled = !!nightlyWallet;

  return {
    adapter: state.adapter,
    connected: state.connected,
    account: state.account,
    connecting: state.connecting,
    connect,
    disconnect,
    signAndSubmitTransaction,
    isInstalled,
  };
}
