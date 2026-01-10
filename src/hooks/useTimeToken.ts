"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { getTimeTokenBalance, buildTransferTimeTokenTx } from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";

/**
 * Hook to get the Time Token balance for the connected wallet
 */
export function useTimeTokenBalance() {
  const { account, connected } = useUnifiedWallet();

  return useQuery({
    queryKey: queryKeys.user.timeTokenBalance(account?.address || ""),
    queryFn: () => getTimeTokenBalance(account!.address),
    enabled: connected && !!account?.address,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get Time Token balance for any address
 */
export function useTimeTokenBalanceOf(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.timeTokenBalance(address || ""),
    queryFn: () => getTimeTokenBalance(address!),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to transfer Time Tokens
 */
export function useTransferTimeToken() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amount }: { recipient: string; amount: number }) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildTransferTimeTokenTx(recipient, amount);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Transfer Successful",
        `Transferred ${variables.amount} Time Dollars to ${variables.recipient.slice(0, 10)}...`,
        txHash
      );
      // Invalidate balance queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.timeTokenBalance(account?.address || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.timeTokenBalance(variables.recipient) });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Transfer Failed", message, guidance);
    },
  });
}

/**
 * Combined Time Token hook
 */
export function useTimeToken() {
  const { account, connected } = useUnifiedWallet();
  const { data: balance, isLoading, refetch } = useTimeTokenBalance();
  const transfer = useTransferTimeToken();

  return {
    address: account?.address,
    connected,
    balance: balance ?? 0,
    isLoading,
    refetch,
    transfer: transfer.mutate,
    isTransferring: transfer.isPending,
  };
}

