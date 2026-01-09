"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "./PrivyProvider";
import { WalletProvider } from "./WalletProvider";
import { QueryProvider } from "./QueryProvider";
import { Toaster } from "@/components/ui/toaster";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Combined Providers Component
 * 
 * Wraps the application with all necessary providers:
 * - React Query for data fetching
 * - Privy for embedded wallet authentication
 * - Wallet adapter for blockchain interactions (Petra, etc.)
 * - Toast notifications
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <PrivyProvider>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </PrivyProvider>
    </QueryProvider>
  );
}

