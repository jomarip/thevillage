"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Movement/Aptos Wallet Information
 * 
 * Complete wallet info including wallet ID, address, public key, and chain type.
 * The public key is fetched server-side via our API route to ensure reliability.
 */
export type MovementWalletInfo = {
  walletId: string;
  address: string;
  publicKey: string; // hex string, typically 0x-prefixed
  chainType: "movement" | "aptos";
};

/**
 * Hook for managing Movement/Aptos embedded wallets via Privy
 * 
 * Implements the recommended pattern:
 * 1. Extract wallet ID and address from user.linkedAccounts (identity/verification)
 * 2. Fetch public key server-side via Next.js API route (actionability)
 * 3. Return complete wallet info for transaction signing
 * 
 * This eliminates reliance on localStorage and the fragile pattern of expecting
 * publicKey in linkedAccounts.
 * 
 * Reference: Privy docs on linked accounts vs connected wallets
 */
export function useMovementWallet(): {
  movementWallet: MovementWalletInfo | null;
  hasMovementWallet: boolean;
  createMovementWallet: () => Promise<MovementWalletInfo>;
  authenticated: boolean;
  ready: boolean;
  isLoading: boolean;
  error?: any;
} {
  const { user, authenticated, ready, login } = usePrivy();
  const { createWallet } = useCreateWallet();

  /**
   * Normalize hex address to ensure 0x prefix
   */
  const normalizeHexAddress = (addr?: string | null): string | null => {
    if (!addr) return null;
    const normalized = addr.toLowerCase().trim();
    return normalized.startsWith('0x') ? normalized : `0x${normalized}`;
  };

  /**
   * Extract wallet ID and address from linkedAccounts
   * 
   * linkedAccounts is for identity/verification, not actionability.
   * We extract the wallet ID here, then fetch public key separately.
   */
  const linkedWalletInfo = useMemo(() => {
    if (!user?.linkedAccounts) return null;

    const wallet = user.linkedAccounts.find((a: any) => {
      const isWallet = a?.type === 'wallet';
      const isMovement = a?.chainType === 'movement' || a?.chain_type === 'movement';
      const isAptos = a?.chainType === 'aptos' || a?.chain_type === 'aptos';
      return isWallet && (isMovement || isAptos);
    });

    if (!wallet) return null;

    // Extract wallet ID - Privy wallet-linked accounts include `id` or `walletId`
    const walletId = wallet.id || wallet.walletId || wallet.wallet_id;
    const address = normalizeHexAddress(wallet.address || wallet.walletAddress);

    if (!walletId || !address) {
      console.warn('[useMovementWallet] Wallet found but missing walletId or address:', {
        hasId: !!walletId,
        hasAddress: !!address,
        walletKeys: Object.keys(wallet),
      });
      return null;
    }

    const chainType =
      (wallet.chainType || wallet.chain_type) === 'aptos' ? ('aptos' as const) : ('movement' as const);

    return { walletId, address, chainType };
  }, [user?.linkedAccounts]);

  /**
   * Fetch public key from our Next.js API route
   * 
   * The API route calls Privy's Wallet API server-side with app secret,
   * which is the reliable way to get the public key.
   */
  const {
    data: publicKeyData,
    isLoading: isLoadingPublicKey,
    error: publicKeyError,
  } = useQuery({
    queryKey: ['movement-wallet-public-key', linkedWalletInfo?.walletId],
    queryFn: async () => {
      if (!linkedWalletInfo?.walletId) return null;

      const response = await fetch(`/api/privy/wallets/${linkedWalletInfo.walletId}/public-key`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to fetch public key: ${response.statusText}`);
      }

      const data = await response.json();
      return data.publicKey as string | null;
    },
    enabled: !!linkedWalletInfo?.walletId, // Only fetch if we have a wallet ID
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  /**
   * Combine linked wallet info with fetched public key
   */
  const movementWallet = useMemo<MovementWalletInfo | null>(() => {
    if (!linkedWalletInfo) return null;
    
    const publicKey = publicKeyData;
    if (!publicKey) return null; // Don't return wallet without public key

    // Ensure public key has 0x prefix
    const normalizedPublicKey = publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`;

    return {
      walletId: linkedWalletInfo.walletId,
      address: linkedWalletInfo.address,
      publicKey: normalizedPublicKey,
      chainType: linkedWalletInfo.chainType,
    };
  }, [linkedWalletInfo, publicKeyData]);

  /**
   * Check if user has a Movement wallet (by wallet ID, even if public key not yet loaded)
   */
  const hasMovementWallet = useMemo(() => {
    return !!linkedWalletInfo; // We have a wallet if we found it in linkedAccounts
  }, [linkedWalletInfo]);

  /**
   * Create a new Movement wallet
   * 
   * This should only be called when the user doesn't have a wallet yet.
   * After creation, the wallet will appear in linkedAccounts and we'll fetch its public key.
   */
  const createMovementWallet = async (): Promise<MovementWalletInfo> => {
    if (!authenticated) {
      await login();
    }

    if (hasMovementWallet) {
      // If we already have a wallet, return it (wait for public key to load)
      if (movementWallet) {
        return movementWallet;
      }
      // If wallet exists but public key not loaded yet, wait a bit and retry
      throw new Error(
        'Movement wallet exists but public key is still loading. Please wait a moment and try again.'
      );
    }

    try {
      const result = await createWallet({ chainType: 'movement' });
      const wallet = result.wallet || result;

      // Extract wallet info from the creation result
      const walletId = wallet.id || wallet.walletId || wallet.wallet_id;
      const address = normalizeHexAddress(wallet.address || wallet.walletAddress);
      const publicKey = wallet.public_key || wallet.publicKey || wallet.publicKeyHex;

      if (!walletId || !address || !publicKey) {
        throw new Error('Failed to create Movement wallet: missing walletId, address, or public key');
      }

      // Normalize public key
      const normalizedPublicKey = publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`;

      const walletInfo: MovementWalletInfo = {
        walletId,
        address,
        publicKey: normalizedPublicKey,
        chainType: 'movement',
      };

      console.log('[useMovementWallet] Movement wallet created:', {
        walletId,
        address,
        publicKey: normalizedPublicKey.substring(0, 20) + '...',
      });

      // The wallet will appear in linkedAccounts after user object updates,
      // and our query will fetch the public key from the API route
      // For now, return the wallet info from creation
      return walletInfo;
    } catch (error) {
      console.error('[useMovementWallet] Error creating Movement wallet:', error);
      throw error;
    }
  };

  return {
    movementWallet,
    hasMovementWallet,
    createMovementWallet,
    authenticated,
    ready,
    isLoading: !ready || isLoadingPublicKey,
    error: publicKeyError,
  };
}
