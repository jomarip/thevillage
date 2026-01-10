"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { getTreasuryBalance, buildDepositTx, buildWithdrawTx } from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";
import { octasToApt, aptToOctas } from "@/lib/config";

/**
 * Hook to get the Treasury balance for the connected wallet
 */
export function useTreasuryBalance() {
  const { account, connected } = useUnifiedWallet();

  return useQuery({
    queryKey: queryKeys.user.treasuryBalance(account?.address || ""),
    queryFn: () => getTreasuryBalance(account!.address),
    enabled: connected && !!account?.address,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to deposit to treasury
 */
export function useDeposit() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amountInApt: number) => {
      if (!account) throw new Error("Wallet not connected");

      const amountInOctas = aptToOctas(amountInApt);
      const payload = buildDepositTx(amountInOctas);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, amountInApt) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Deposit Successful",
        `Deposited ${amountInApt} APT to your treasury account.`,
        txHash
      );
      // Invalidate balance queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.treasuryBalance(account?.address || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.all });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Deposit Failed", message, guidance);
    },
  });
}

/**
 * Hook to withdraw from treasury
 */
export function useWithdraw() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amountInApt: number) => {
      if (!account) throw new Error("Wallet not connected");

      const amountInOctas = aptToOctas(amountInApt);
      const payload = buildWithdrawTx(amountInOctas);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, amountInApt) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Withdrawal Successful",
        `Withdrew ${amountInApt} APT from your treasury account.`,
        txHash
      );
      // Invalidate balance queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.treasuryBalance(account?.address || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.all });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Withdrawal Failed", message, guidance);
    },
  });
}

/**
 * Combined Treasury hook
 */
export function useTreasury() {
  const { account, connected } = useUnifiedWallet();
  const { data: balanceInOctas, isLoading, refetch } = useTreasuryBalance();
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  return {
    address: account?.address,
    connected,
    balanceInOctas: balanceInOctas ?? 0,
    balanceInApt: balanceInOctas ? octasToApt(balanceInOctas) : 0,
    isLoading,
    refetch,
    deposit: deposit.mutate,
    withdraw: withdraw.mutate,
    isDepositing: deposit.isPending,
    isWithdrawing: withdraw.isPending,
  };
}

