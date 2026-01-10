"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';
import { useMemo, useState, useEffect } from 'react';

/**
 * Hook for managing Movement/Aptos embedded wallets via Privy
 * 
 * Provides utilities to:
 * - Check if user has a Movement wallet
 * - Create a Movement wallet if needed
 * - Get the active Movement wallet account
 */
export function useMovementWallet() {
  const { user, authenticated, ready, login } = usePrivy();
  const { createWallet } = useCreateWallet();
  
  // Helper function to extract public key from wallet object (handles both camelCase and snake_case)
  // Privy documentation shows public_key (with underscore) is the standard format
  const extractPublicKey = (wallet: any): string | null => {
    // Check all possible property names (Privy uses snake_case, but some SDKs use camelCase)
    return wallet?.public_key || wallet?.publicKey || wallet?.publicKeyHex || null;
  };

  // Helper function to extract address from wallet object
  const extractAddress = (wallet: any): string | null => {
    return wallet?.address || wallet?.walletAddress || null;
  };

  // Load tempWallet from localStorage on mount
  const loadTempWalletFromStorage = (): { address: string; publicKey: string; chainType: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('movement_wallet_temp');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate stored wallet has required fields
        if (parsed?.address && parsed?.publicKey) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading tempWallet from localStorage:', error);
    }
    return null;
  };

  // Store wallet temporarily if created but not yet in linkedAccounts
  // Initialize from localStorage if available
  const [tempWallet, setTempWallet] = useState<{ address: string; publicKey: string; chainType: string } | null>(() => {
    return loadTempWalletFromStorage();
  });

  // Save tempWallet to localStorage whenever it changes
  useEffect(() => {
    if (tempWallet) {
      try {
        localStorage.setItem('movement_wallet_temp', JSON.stringify(tempWallet));
      } catch (error) {
        console.error('Error saving tempWallet to localStorage:', error);
      }
    } else {
      try {
        localStorage.removeItem('movement_wallet_temp');
      } catch (error) {
        console.error('Error removing tempWallet from localStorage:', error);
      }
    }
  }, [tempWallet]);

  // Find Movement wallet in linked accounts or use temp wallet
  const movementWallet = useMemo(() => {
    // First check linked accounts
    if (user?.linkedAccounts) {
      const wallet = user.linkedAccounts.find(
        (a: any) => a.type === 'wallet' && (a.chainType === 'movement' || a.chainType === 'aptos')
      );
      
      if (wallet) {
        // Extract public key from linkedAccounts wallet (Privy uses public_key with underscore)
        let publicKey = extractPublicKey(wallet);
        const address = extractAddress(wallet);
        
        // If no publicKey in linkedAccounts wallet, try to use it from tempWallet if addresses match
        if (!publicKey && tempWallet && address && tempWallet.address === address) {
          publicKey = tempWallet.publicKey;
          console.log('Using publicKey from tempWallet for linkedAccounts wallet');
        }
        
        // Format public key if we have it
        if (publicKey && !publicKey.startsWith('0x')) {
          publicKey = `0x${publicKey}`;
        }
        
        // Format address if we have it
        let formattedAddress = address;
        if (formattedAddress && !formattedAddress.startsWith('0x')) {
          formattedAddress = `0x${formattedAddress}`;
        }
        
        // If we have both address and publicKey, return the wallet
        if (formattedAddress && publicKey) {
          // Clear temp wallet if found in linked accounts with complete info
          if (tempWallet) setTempWallet(null);
          
          return {
            address: formattedAddress,
            publicKey: publicKey,
            chainType: wallet.chainType || 'movement',
          };
        } else {
          // LinkedAccounts wallet exists but missing publicKey - use tempWallet if addresses match
          if (tempWallet && formattedAddress && tempWallet.address === formattedAddress) {
            // Use tempWallet's publicKey with linkedAccounts address
            return {
              address: formattedAddress,
              publicKey: tempWallet.publicKey,
              chainType: wallet.chainType || 'movement',
            };
          }
          // If no matching tempWallet, we can't use this wallet for transactions
          // But we still return it so hasMovementWallet knows a wallet exists
          // This prevents creating duplicate wallets
          console.warn('Movement wallet found in linkedAccounts but missing publicKey and no matching tempWallet.');
          return null;
        }
      }
    }
    
    // If not in linked accounts but we have a temp wallet, use it
    if (tempWallet) {
      return tempWallet;
    }
    
    return null;
  }, [user?.linkedAccounts, tempWallet]);
  
  // Clear temp wallet when user object updates with the wallet AND it has publicKey
  // Keep tempWallet if linkedAccounts wallet doesn't have publicKey (we need it for transactions)
  useEffect(() => {
    if (user?.linkedAccounts && tempWallet) {
      const found = user.linkedAccounts.find(
        (a: any) => a.type === 'wallet' && 
        (a.chainType === 'movement' || a.chainType === 'aptos') &&
        extractAddress(a) === tempWallet.address
      );
      // Only clear tempWallet if the found wallet has a publicKey
      // If it doesn't have publicKey, we need to keep tempWallet for transactions
      if (found) {
        const foundPublicKey = extractPublicKey(found);
        if (foundPublicKey) {
          // LinkedAccounts now has publicKey, we can clear tempWallet
          setTempWallet(null);
        }
        // If no publicKey, keep tempWallet - we need it!
      }
    }
  }, [user?.linkedAccounts, tempWallet]);

  // State to track if we're fetching wallet details
  const [isFetchingWallet, setIsFetchingWallet] = useState(false);
  const [lastFetchedAddress, setLastFetchedAddress] = useState<string | null>(null);

  // Check if user has Movement wallet (by address, even if missing publicKey)
  // This prevents creating duplicate wallets
  const hasMovementWallet = useMemo(() => {
    // Check if we have a movementWallet object (complete with publicKey)
    if (movementWallet) return true;
    
    // Check if there's a wallet in linkedAccounts (even without publicKey)
    if (user?.linkedAccounts) {
      const wallet = user.linkedAccounts.find(
        (a: any) => a.type === 'wallet' && (a.chainType === 'movement' || a.chainType === 'aptos')
      );
      if (wallet && extractAddress(wallet)) {
        return true; // We have a wallet, even if it's missing publicKey
      }
    }
    
    // Check if we have a tempWallet
    if (tempWallet) return true;
    
    return false;
  }, [movementWallet, user?.linkedAccounts, tempWallet]);

  // Auto-fetch wallet details if we have a wallet in linkedAccounts but missing publicKey
  useEffect(() => {
    const fetchMissingPublicKey = async () => {
      // Don't fetch if already fetching, or if we have movementWallet, or if not authenticated
      if (isFetchingWallet || movementWallet || !authenticated || !ready) return;

      // Check if we have a wallet in linkedAccounts without publicKey
      if (user?.linkedAccounts) {
        const wallet = user.linkedAccounts.find(
          (a: any) => a.type === 'wallet' && (a.chainType === 'movement' || a.chainType === 'aptos')
        );
        
        if (wallet) {
          const address = extractAddress(wallet);
          const publicKey = extractPublicKey(wallet);
          
          // If we have address but no publicKey, and no tempWallet with matching address
          // Also check we haven't already tried to fetch this address
          if (address && !publicKey && (!tempWallet || tempWallet.address !== address) && lastFetchedAddress !== address) {
            setIsFetchingWallet(true);
            setLastFetchedAddress(address);
            try {
              // Call createWallet - Privy should return existing wallet if one exists
              // Per Privy docs: creating a wallet when one exists returns the existing wallet
              // This gives us the publicKey without creating a duplicate
              // Reference: https://docs.privy.io/guides/wallets/using-wallets/other-chains#movement
              const result = await createWallet({ chainType: 'movement' });
              const walletResult = result.wallet || result;
              
              // Extract and format the wallet info
              let walletAddress = extractAddress(walletResult) || address;
              if (walletAddress && !walletAddress.startsWith('0x')) {
                walletAddress = `0x${walletAddress}`;
              }
              
              let walletPublicKey = extractPublicKey(walletResult);
              if (walletPublicKey && !walletPublicKey.startsWith('0x')) {
                walletPublicKey = `0x${walletPublicKey}`;
              }
              
              // If we got the publicKey and addresses match, store it in tempWallet
              if (walletAddress && walletPublicKey) {
                // Normalize addresses for comparison (remove 0x prefix for comparison)
                const normalizedAddress = address.replace(/^0x/, '').toLowerCase();
                const normalizedWalletAddress = walletAddress.replace(/^0x/, '').toLowerCase();
                
                if (normalizedWalletAddress === normalizedAddress) {
                  const walletInfo = {
                    address: walletAddress,
                    publicKey: walletPublicKey,
                    chainType: walletResult.chainType || 'movement',
                  };
                  setTempWallet(walletInfo);
                  console.log('Fetched missing publicKey for wallet:', walletAddress);
                } else {
                  console.warn('Wallet address mismatch:', { expected: address, got: walletAddress });
                }
              }
            } catch (error) {
              console.error('Error fetching wallet details:', error);
              // Reset lastFetchedAddress on error so we can retry later
              setLastFetchedAddress(null);
            } finally {
              setIsFetchingWallet(false);
            }
          }
        }
      }
    };

    fetchMissingPublicKey();
  }, [user?.linkedAccounts, movementWallet, tempWallet, authenticated, ready, isFetchingWallet, lastFetchedAddress, createWallet]);

  // Create Movement wallet
  const createMovementWallet = async () => {
    if (!authenticated) {
      await login();
    }

    // Only create if we truly don't have a wallet (check by address, not just complete object)
    if (!hasMovementWallet) {
      try {
        const result = await createWallet({ chainType: 'movement' });
        
        // Extract wallet info
        const wallet = result.wallet || result;
        
        // Ensure address is properly formatted (Aptos/Movement addresses are 66 chars: 0x + 64 hex)
        let address = extractAddress(wallet) || '';
        if (address && !address.startsWith('0x')) {
          address = `0x${address}`;
        }
        
        // Ensure public key is properly formatted (check for public_key with underscore per Privy docs)
        let publicKey = extractPublicKey(wallet) || '';
        if (publicKey && !publicKey.startsWith('0x')) {
          publicKey = `0x${publicKey}`;
        }
        
        const walletInfo = {
          address,
          publicKey,
          chainType: wallet.chainType || 'movement',
        };
        
        // Validate wallet info
        if (!address || !publicKey) {
          throw new Error('Failed to create Movement wallet: missing address or public key');
        }
        
        // Store temporarily until user object updates
        setTempWallet(walletInfo);
        
        console.log('Movement wallet created:', { address, publicKey: publicKey.substring(0, 20) + '...' });
        
        return walletInfo;
      } catch (error) {
        console.error('Error creating Movement wallet:', error);
        throw error;
      }
    }

    return movementWallet;
  };

  return {
    movementWallet,
    hasMovementWallet,
    createMovementWallet,
    authenticated,
    ready,
    isLoading: !ready,
  };
}
