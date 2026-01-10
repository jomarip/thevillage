"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { 
  getPendingRewards, 
  buildStakeTx, 
  buildClaimRewardsTx, 
  buildUnstakeTx 
} from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";

/**
 * Hook to get pending rewards for a specific pool
 */
export function usePendingRewards(poolId: number) {
  const { account, connected } = useUnifiedWallet();

  return useQuery({
    queryKey: queryKeys.rewards.pending(account?.address || "", poolId),
    queryFn: () => getPendingRewards(account!.address, poolId),
    enabled: connected && !!account?.address && poolId > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to stake tokens in a pool
 */
export function useStake() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: number; amount: number }) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildStakeTx(poolId, amount);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Stake Successful",
        `Staked ${variables.amount} tokens in pool #${variables.poolId}.`,
        txHash
      );
      // Invalidate rewards and balance queries
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.timeTokenBalance(account?.address || "") });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Stake Failed", message, guidance);
    },
  });
}

/**
 * Hook to claim rewards from a pool
 */
export function useClaimRewards() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poolId: number) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildClaimRewardsTx(poolId);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, poolId) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Rewards Claimed",
        `Successfully claimed rewards from pool #${poolId}.`,
        txHash
      );
      // Invalidate rewards and balance queries
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.timeTokenBalance(account?.address || "") });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Claim Failed", message, guidance);
    },
  });
}

/**
 * Hook to unstake tokens from a pool
 */
export function useUnstake() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: number; amount: number }) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildUnstakeTx(poolId, amount);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Unstake Successful",
        `Unstaked ${variables.amount} tokens from pool #${variables.poolId}.`,
        txHash
      );
      // Invalidate rewards and balance queries
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.timeTokenBalance(account?.address || "") });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Unstake Failed", message, guidance);
    },
  });
}

/**
 * Combined Rewards hook
 */
export function useRewards() {
  const { account, connected } = useUnifiedWallet();
  const stake = useStake();
  const claimRewards = useClaimRewards();
  const unstake = useUnstake();

  return {
    address: account?.address,
    connected,
    stake: stake.mutate,
    claimRewards: claimRewards.mutate,
    unstake: unstake.mutate,
    isStaking: stake.isPending,
    isClaiming: claimRewards.isPending,
    isUnstaking: unstake.isPending,
  };
}

