"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { 
  getProject,
  listProjects,
  buildApproveProjectTx,
  buildUpdateProjectStatusTx 
} from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { PoolStatus } from "@/types/contract";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";

/**
 * Hook to get a specific project
 */
export function useProject(projectId: number) {
  return useQuery({
    queryKey: queryKeys.projects.project(projectId),
    queryFn: () => getProject(projectId),
    enabled: projectId > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to list projects, optionally filtered by status
 */
export function useProjects(statusFilter?: PoolStatus) {
  return useQuery({
    queryKey: queryKeys.projects.all(statusFilter),
    queryFn: () => listProjects(statusFilter),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to approve a project (admin only)
 */
export function useApproveProject() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: number) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildApproveProjectTx(projectId);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, projectId) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Project Approved",
        `Project #${projectId} has been approved and is now active.`,
        txHash
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(undefined) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.project(projectId) });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Approval Failed", message, guidance);
    },
  });
}

/**
 * Hook to update project status (admin only)
 */
export function useUpdateProjectStatus() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: number; newStatus: number }) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildUpdateProjectStatusTx(projectId, newStatus);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Status Updated",
        `Project #${variables.projectId} status has been updated.`,
        txHash
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.project(variables.projectId) });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Update Failed", message, guidance);
    },
  });
}
