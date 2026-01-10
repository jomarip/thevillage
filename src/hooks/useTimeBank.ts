"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { 
  getTimeBankRequest,
  listTimeBankRequests,
  buildCreateTimeBankRequestTx, 
  buildApproveTimeBankRequestTx 
} from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";
import { TimeBankRequest, RequestStatus } from "@/types/contract";

/**
 * Hook to get a specific timebank request
 */
export function useTimeBankRequest(requestId: number) {
  return useQuery({
    queryKey: queryKeys.timebank.request(requestId),
    queryFn: () => getTimeBankRequest(requestId),
    enabled: requestId > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to list timebank requests, optionally filtered by status
 */
export function useTimeBankRequests(statusFilter?: RequestStatus) {
  return useQuery({
    queryKey: queryKeys.timebank.requests(statusFilter),
    queryFn: () => listTimeBankRequests(statusFilter),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for pending requests
  });
}

/**
 * Hook specifically for pending requests (most common use case)
 */
export function usePendingRequests() {
  return useTimeBankRequests(RequestStatus.Pending);
}

/**
 * Hook to create a new service hours request
 */
export function useCreateRequest() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hours, activityId }: { hours: number; activityId: number }) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildCreateTimeBankRequestTx(hours, activityId);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Request Submitted",
        `Your request for ${variables.hours} hour(s) has been submitted for approval.`,
        txHash
      );
      // Invalidate timebank queries
      queryClient.invalidateQueries({ queryKey: queryKeys.timebank.all });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Request Failed", message, guidance);
    },
  });
}

/**
 * Hook to approve a service hours request (validator/admin only)
 */
export function useApproveRequest() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildApproveTimeBankRequestTx(requestId);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, requestId) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Request Approved",
        `Request #${requestId} has been approved and Time Dollars have been minted.`,
        txHash
      );
      // Invalidate timebank queries
      queryClient.invalidateQueries({ queryKey: queryKeys.timebank.all });
      // Also invalidate time token balances as they may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.user.timeTokenBalance("") });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Approval Failed", message, guidance);
    },
  });
}

/**
 * Combined TimeBank hook
 */
export function useTimeBank() {
  const { account, connected } = useUnifiedWallet();
  const createRequest = useCreateRequest();
  const approveRequest = useApproveRequest();

  return {
    address: account?.address,
    connected,
    createRequest: createRequest.mutate,
    approveRequest: approveRequest.mutate,
    isCreating: createRequest.isPending,
    isApproving: approveRequest.isPending,
  };
}

