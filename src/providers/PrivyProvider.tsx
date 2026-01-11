"use client";

import { ReactNode } from "react";
import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";

interface PrivyProviderProps {
  children: ReactNode;
}

/**
 * Privy Provider Component
 * 
 * Wraps the application with PrivyProvider to enable
 * embedded wallet functionality and authentication.
 * 
 * Supports:
 * - Email authentication with OTP
 * - Embedded wallets for Movement Network (Aptos-compatible)
 * - Social logins (configurable)
 * 
 * Note: Privy embedded wallets support Aptos/Movement Network.
 * Users can authenticate via email and get an embedded wallet automatically.
 */
export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmk4lgdrw00bejm0c787048ac";
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || "client-WY6UwjAGzG31cKZbQD2ZSMK8Sat2L56nNsJYw3nKe1Vau";

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        // Login methods
        // Available options: "email", "sms", "wallet", "google", "apple", "twitter", 
        // "discord", "github", "linkedin", "tiktok", "spotify", "instagram", "line"
        // Note: Social logins must be enabled in Privy Dashboard first
        loginMethods: [
          "email",
          "google",
          "apple",
          "twitter",
          "discord",
          "github",
          "wallet",
        ],
        
        // Embedded wallet configuration
        // Note: For Tier 2 chains like Movement, we disable automatic Ethereum wallet creation
        // and create Movement wallets manually via useCreateWallet hook
        embeddedWallets: {
          // Disable automatic Ethereum wallet creation (we only use Movement wallets)
          createOnLogin: "off",
          requireUserPasswordOnCreate: false,
        },
        
        // Appearance
        appearance: {
          theme: "light",
          accentColor: "#5E3FA3",
          logo: "/handshake.png",
        },
        
        // Legal
        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
        
        // Performance optimizations
        // Don't prefetch wallet connectors on initial load to improve page load time
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
