"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUnifiedWallet } from "./useUnifiedWallet";
import { isWhitelisted, buildWhitelistAddressTx } from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { showTransactionSuccess, showErrorWithGuidance, parseErrorForGuidance } from "@/lib/toast-helpers";

/**
 * Hook to check if the connected wallet is whitelisted (KYC verified)
 */
export function useIsWhitelisted() {
  const { account, connected } = useUnifiedWallet();

  return useQuery({
    queryKey: queryKeys.user.whitelist(account?.address || ""),
    queryFn: () => isWhitelisted(account!.address),
    enabled: connected && !!account?.address,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to whitelist an address (admin only)
 */
export function useWhitelistAddress() {
  const { signAndSubmitTransaction } = useUnifiedWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressToWhitelist: string) => {
      const payload = buildWhitelistAddressTx(addressToWhitelist);
      const response = await signAndSubmitTransaction({
        data: payload,
      });

      return response;
    },
    onSuccess: (response, addressToWhitelist) => {
      const txHash = typeof response === "string" ? response : response?.hash;
      showTransactionSuccess(
        "Address Whitelisted",
        `Successfully whitelisted ${addressToWhitelist.slice(0, 10)}...`,
        txHash
      );
      // Invalidate the whitelist query for the address
      queryClient.invalidateQueries({ queryKey: queryKeys.user.whitelist(addressToWhitelist) });
    },
    onError: (error: Error) => {
      const { message, guidance } = parseErrorForGuidance(error);
      showErrorWithGuidance("Whitelist Failed", message, guidance);
    },
  });
}

/**
 * Combined compliance status hook
 */
export function useComplianceStatus() {
  const { account, connected } = useUnifiedWallet();
  const { data: whitelisted, isLoading } = useIsWhitelisted();

  return {
    address: account?.address,
    connected,
    isWhitelisted: whitelisted ?? false,
    isKYCVerified: whitelisted ?? false, // Alias for clarity
    isLoading,
    canAccessFinancialFeatures: whitelisted ?? false,
  };
}

