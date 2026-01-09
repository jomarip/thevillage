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
  // Store wallet temporarily if created but not yet in linkedAccounts
  const [tempWallet, setTempWallet] = useState<{ address: string; publicKey: string; chainType: string } | null>(null);

  // Find Movement wallet in linked accounts or use temp wallet
  const movementWallet = useMemo(() => {
    // First check linked accounts
    if (user?.linkedAccounts) {
      const wallet = user.linkedAccounts.find(
        (a: any) => a.type === 'wallet' && (a.chainType === 'movement' || a.chainType === 'aptos')
      ) as { address: string; publicKey: string; chainType: string } | null;
      
      if (wallet) {
        // Clear temp wallet if found in linked accounts
        if (tempWallet) setTempWallet(null);
        return wallet;
      }
    }
    
    // If not in linked accounts but we have a temp wallet, use it
    if (tempWallet) {
      return tempWallet;
    }
    
    return null;
  }, [user?.linkedAccounts, tempWallet]);
  
  // Clear temp wallet when user object updates with the wallet
  useEffect(() => {
    if (user?.linkedAccounts && tempWallet) {
      const found = user.linkedAccounts.find(
        (a: any) => a.type === 'wallet' && 
        (a.chainType === 'movement' || a.chainType === 'aptos') &&
        a.address === tempWallet.address
      );
      if (found) {
        setTempWallet(null);
      }
    }
  }, [user?.linkedAccounts, tempWallet]);

  // Check if user has Movement wallet
  const hasMovementWallet = !!movementWallet;

  // Create Movement wallet
  const createMovementWallet = async () => {
    if (!authenticated) {
      await login();
    }

    if (!hasMovementWallet) {
      try {
        const result = await createWallet({ chainType: 'movement' });
        
        // Extract wallet info
        const wallet = result.wallet || result;
        const walletInfo = {
          address: wallet.address || wallet.walletAddress,
          publicKey: wallet.publicKey || wallet.publicKeyHex,
          chainType: wallet.chainType || 'movement',
        };
        
        // Store temporarily until user object updates
        setTempWallet(walletInfo);
        
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
