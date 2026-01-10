/**
 * Toast helper utilities for consistent transaction feedback
 */

import { toast } from "@/components/ui/use-toast";
import { getTransactionUrl } from "@/lib/config";
import { ToastAction } from "@/components/ui/toast";
import { ExternalLink } from "lucide-react";
import React from "react";

/**
 * Show success toast with transaction explorer link
 */
export function showTransactionSuccess(
  title: string,
  description: string,
  txHash?: string
) {
  const toastContent: any = {
    title,
    description,
    duration: 8000, // Longer duration for transaction toasts
  };

  // Add action button with explorer link if txHash is provided
  if (txHash) {
    toastContent.action = React.createElement(
      ToastAction,
      {
        altText: "View transaction on explorer",
        onClick: () => {
          window.open(getTransactionUrl(txHash), "_blank", "noopener,noreferrer");
        },
      },
      React.createElement(React.Fragment, null,
        "View on Explorer",
        React.createElement(ExternalLink, { className: "ml-1 h-3 w-3" })
      )
    );
  }

  toast(toastContent);
}

/**
 * Show error toast with actionable guidance
 */
export function showErrorWithGuidance(
  title: string,
  error: Error | string,
  guidance?: {
    action?: string;
    link?: string;
    linkText?: string;
  }
) {
  const errorMessage = typeof error === "string" ? error : error.message;
  
  const toastContent: any = {
    title,
    description: errorMessage,
    variant: "destructive" as const,
    duration: 10000, // Longer duration for error messages
  };

  // Add action button if guidance is provided
  if (guidance?.link && guidance?.linkText) {
    const handleAction = () => {
      if (guidance.link === "#") {
        // Special handling for refresh
        window.location.reload();
      } else {
        window.open(guidance.link, "_blank", "noopener,noreferrer");
      }
    };

    toastContent.action = React.createElement(
      ToastAction,
      {
        altText: guidance.action || guidance.linkText,
        onClick: handleAction,
      },
      React.createElement(React.Fragment, null,
        guidance.linkText,
        guidance.link !== "#" && React.createElement(ExternalLink, { className: "ml-1 h-3 w-3" })
      )
    );
  }

  toast(toastContent);
}

/**
 * Parse common errors and provide actionable guidance
 */
export function parseErrorForGuidance(error: Error): {
  message: string;
  guidance?: {
    action?: string;
    link?: string;
    linkText?: string;
  };
} {
  const errorMessage = error.message.toLowerCase();

  // Not a member
  if (errorMessage.includes("not a member") || errorMessage.includes("not registered")) {
    return {
      message: "You need to be a registered member to perform this action.",
      guidance: {
        action: "Request membership",
        link: "/membership/request",
        linkText: "Request Membership",
      },
    };
  }

  // Not whitelisted / KYC
  if (errorMessage.includes("not whitelisted") || errorMessage.includes("kyc") || errorMessage.includes("compliance")) {
    return {
      message: "This action requires KYC verification. Please contact an administrator.",
      guidance: {
        action: "Learn more",
        link: "/help#kyc",
        linkText: "Learn About KYC",
      },
    };
  }

  // Insufficient balance
  if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
    return {
      message: "You don't have enough balance for this transaction.",
      guidance: {
        action: "Get tokens",
        link: "https://faucet.testnet.movementnetwork.xyz/",
        linkText: "Get Test Tokens",
      },
    };
  }

  // Wallet not connected
  if (errorMessage.includes("wallet not connected") || errorMessage.includes("not connected")) {
    return {
      message: "Please connect your wallet to continue.",
      guidance: {
        action: "Connect wallet",
        link: "#", // Will be handled by wallet modal
        linkText: "Connect Wallet",
      },
    };
  }

  // Network error
  if (errorMessage.includes("network") || errorMessage.includes("connection")) {
    return {
      message: "Network connection issue. Please check your connection and try again.",
      guidance: {
        action: "Refresh",
        link: "#",
        linkText: "Refresh Page",
      },
    };
  }

  // Default - return original error
  return {
    message: error.message,
  };
}
