"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { 
  getCommunityConfig,
  buildInitializeHubTx,
  buildRegisterCommunityTx 
} from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";

/**
 * Hook to get community configuration
 */
export function useCommunityConfig(hubAddr: string | undefined, communityId: number) {
  return useQuery({
    queryKey: queryKeys.community.config(hubAddr || "", communityId),
    queryFn: () => getCommunityConfig(hubAddr!, communityId),
    enabled: !!hubAddr && communityId >= 0,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to initialize registry hub
 */
export function useInitializeHub() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildInitializeHubTx();
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Registry Hub Initialized",
        "The registry hub has been successfully initialized.",
        txHash
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.community.all });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Initialization Failed", message, guidance);
    },
  });
}

/**
 * Hook to register a new community
 */
export function useRegisterCommunity() {
  const { signAndSubmitTransaction, account } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      hubAddr,
      communityId,
      membersRegistryAddr,
      complianceRegistryAddr,
      treasuryAddr,
      poolRegistryAddr,
      fractionalSharesAddr,
      governanceAddr,
      tokenAdminAddr,
      timeTokenAdminAddr,
    }: {
      hubAddr: string;
      communityId: number;
      membersRegistryAddr: string;
      complianceRegistryAddr: string;
      treasuryAddr: string;
      poolRegistryAddr: string;
      fractionalSharesAddr: string;
      governanceAddr: string;
      tokenAdminAddr: string;
      timeTokenAdminAddr: string;
    }) => {
      if (!account) throw new Error("Wallet not connected");

      const payload = buildRegisterCommunityTx(
        hubAddr,
        communityId,
        membersRegistryAddr,
        complianceRegistryAddr,
        treasuryAddr,
        poolRegistryAddr,
        fractionalSharesAddr,
        governanceAddr,
        tokenAdminAddr,
        timeTokenAdminAddr
      );
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Community Registered",
        `Community #${variables.communityId} has been successfully registered.`,
        txHash
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.community.all });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.community.config(variables.hubAddr, variables.communityId) 
      });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Registration Failed", message, guidance);
    },
  });
}
