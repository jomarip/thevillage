"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { isMember, getMemberRole, buildRequestMembershipTx, buildAcceptMembershipTx, buildApproveMembershipTx, buildRejectMembershipTx, listMembershipRequests } from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { Role, RoleLabels, RequestStatus } from "@/types/contract";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";

/**
 * Hook to check if the connected wallet is a registered member
 */
export function useIsMember() {
  const { account, connected } = useUnifiedWallet();

  return useQuery({
    queryKey: queryKeys.user.membership(account?.address || ""),
    queryFn: () => isMember(account!.address),
    enabled: connected && !!account?.address,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get the role of the connected wallet
 */
export function useMemberRole() {
  const { account, connected } = useUnifiedWallet();

  return useQuery({
    queryKey: queryKeys.user.role(account?.address || ""),
    queryFn: () => getMemberRole(account!.address),
    enabled: connected && !!account?.address,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to check if user is an admin
 */
export function useIsAdmin() {
  const { data: role, isLoading } = useMemberRole();
  return {
    isAdmin: role === Role.Admin,
    isLoading,
  };
}

/**
 * Hook to check if user is a validator
 */
export function useIsValidator() {
  const { data: role, isLoading } = useMemberRole();
  return {
    isValidator: role === Role.Validator || role === Role.Admin,
    isLoading,
  };
}

/**
 * Hook to request membership
 */
export function useRequestMembership() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, note }: { role: Role; note: string }) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildRequestMembershipTx(role, note);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Membership Requested",
        `Your request to become a ${RoleLabels[variables.role]} has been submitted.`,
        txHash
      );
      // Invalidate membership queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.membership(account?.address || "") });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Request Failed", message, guidance);
    },
  });
}

/**
 * Hook to accept membership
 */
export function useAcceptMembership() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildAcceptMembershipTx();
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Membership Accepted",
        "You are now a registered member of The Village.",
        txHash
      );
      // Invalidate membership queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Acceptance Failed", message, guidance);
    },
  });
}

/**
 * Combined hook for member status
 */
export function useMemberStatus() {
  // Use unified wallet to support both Aptos adapter and Privy wallets
  const { account, connected } = useUnifiedWallet();
  const { data: isMemberData, isLoading: isMemberLoading } = useIsMember();
  const { data: roleData, isLoading: isRoleLoading } = useMemberRole();

  return {
    address: account?.address,
    connected,
    isMember: isMemberData ?? false,
    role: roleData ?? null,
    // roleData can be undefined while the query is loading; only index when it's a real Role.
    roleLabel: roleData != null ? RoleLabels[roleData] : null,
    isAdmin: roleData === Role.Admin,
    isValidator: roleData === Role.Validator || roleData === Role.Admin,
    isBorrower: roleData === Role.Borrower,
    isDepositor: roleData === Role.Depositor,
    isLoading: isMemberLoading || isRoleLoading,
  };
}

/**
 * Hook to list pending membership requests
 */
export function useMembershipRequests(statusFilter: RequestStatus = RequestStatus.Pending) {
  return useQuery({
    queryKey: queryKeys.membershipRequests(statusFilter),
    queryFn: () => listMembershipRequests(statusFilter),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to approve a membership request (admin or validator)
 */
export function useApproveMembershipRequest() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildApproveMembershipTx(requestId);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, requestId) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Request Approved",
        `Membership request #${requestId} has been approved.`,
        txHash
      );
      // Invalidate membership requests queries
      queryClient.invalidateQueries({ queryKey: ["membershipRequests"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Approval Failed", message, guidance);
    },
  });
}

/**
 * Hook to reject a membership request (admin or validator)
 */
export function useRejectMembershipRequest() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildRejectMembershipTx(requestId);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, requestId) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Request Rejected",
        `Membership request #${requestId} has been rejected.`,
        txHash
      );
      // Invalidate membership requests queries
      queryClient.invalidateQueries({ queryKey: ["membershipRequests"] });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Rejection Failed", message, guidance);
    },
  });
}

