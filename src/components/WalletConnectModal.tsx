"use client";

import { useState, useEffect } from "react";
import { useWallet, WalletName } from "@aptos-labs/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useMovementWallet } from "@/hooks/useMovementWallet";
import { useNightlyWallet } from "@/hooks/useNightlyWallet";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Loader2, Mail } from "lucide-react";
import { formatAddress } from "@/lib/config";

interface WalletConnectModalProps {
  trigger?: React.ReactNode;
}

export function WalletConnectModal({ trigger }: WalletConnectModalProps) {
  const { connect, disconnect, account, connected, connecting, wallets } = useWallet();
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { movementWallet, hasMovementWallet, createMovementWallet, isLoading: isMovementLoading } = useMovementWallet();
  const {
    connected: nightlyConnected,
    account: nightlyAccount,
    connect: connectNightly,
    disconnect: disconnectNightly,
    connecting: nightlyConnecting,
    isInstalled: nightlyInstalled,
  } = useNightlyWallet();
  const { disconnect: disconnectAll } = useUnifiedWallet();
  const [open, setOpen] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted (client-side only) to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle button click - always allow opening the dialog
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  // Handle wallet connection
  const handleConnect = async (walletName: WalletName) => {
    try {
      await connect(walletName);
      setOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  // Handle disconnect - disconnect all wallet types using unified function
  const handleDisconnect = async () => {
    try {
      // Use unified disconnect which handles all wallet types
      await disconnectAll();
      setOpen(false);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      // Force close dialog even if disconnect fails
      setOpen(false);
    }
  };

  // Check if Petra is installed
  const isPetraInstalled = typeof window !== "undefined" && "aptos" in window;
  
  // Check if Nightly is installed
  const isNightlyInstalled = typeof window !== "undefined" && 
    (window as any).nightly?.aptos !== undefined;
  
  // Find Nightly wallet from the wallets array
  const nightlyWallet = wallets.find((w) => w.name === "Nightly");

  // Handle Privy login and wallet creation
  const handlePrivyLogin = async () => {
    try {
      if (!authenticated) {
        await login();
      }
      
      // If authenticated, ensure we have a Movement wallet with publicKey
      if (authenticated && !isCreatingWallet) {
        setIsCreatingWallet(true);
        try {
          // This will create a wallet if needed, or refresh existing wallet's publicKey
          await createMovementWallet();
        } catch (error: any) {
          console.error("Failed to create/refresh Movement wallet:", error);
          // Show error to user
          if (error?.message?.includes("missing required information")) {
            // Wallet exists but missing publicKey - user needs to reconnect
            alert(
              "Your Movement wallet is missing required information. " +
              "Please disconnect and reconnect to restore access."
            );
          }
        } finally {
          setIsCreatingWallet(false);
        }
      }
      
      setOpen(false);
    } catch (error) {
      console.error("Failed to login with Privy:", error);
    }
  };

  // Handle Privy logout
  const handlePrivyLogout = async () => {
    try {
      await logout();
      setOpen(false);
    } catch (error) {
      console.error("Failed to logout from Privy:", error);
    }
  };

  // Get active account (check all wallet types)
  const activeAccount = account || 
    (nightlyAccount ? {
      address: nightlyAccount.address,
      publicKey: nightlyAccount.publicKey,
    } : null) ||
    (movementWallet ? {
      address: movementWallet.address,
      publicKey: movementWallet.publicKey,
    } : null);
  const isConnected = connected || nightlyConnected || (authenticated && (hasMovementWallet || !!movementWallet));

  // Debug logging
  useEffect(() => {
    console.log('[WalletConnectModal] Wallet state:', {
      hasAccount: !!account,
      accountAddress: account?.address,
      hasNightlyAccount: !!nightlyAccount,
      hasMovementWallet: !!movementWallet,
      movementWalletAddress: movementWallet?.address,
      authenticated,
      connected,
      nightlyConnected,
      isConnected,
      activeAccountAddress: activeAccount?.address,
    });
  }, [account, nightlyAccount, movementWallet, authenticated, connected, nightlyConnected, isConnected, activeAccount]);

  // If connected, show account info
  if (isConnected && activeAccount) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
              {trigger || (
            <Button variant="outline" className="gap-2">
              <Wallet className="h-4 w-4" />
              {formatAddress(activeAccount.address)}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connected Wallet</DialogTitle>
            <DialogDescription>
              Manage your wallet connection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-text-muted mb-1">Address</p>
              <p className="font-mono text-sm break-all">{activeAccount.address}</p>
              {connected && (
                <p className="text-xs text-text-muted mt-1">Connected via Aptos Wallet</p>
              )}
              {authenticated && !connected && (
                <p className="text-xs text-text-muted mt-1">Connected via Privy</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDisconnect}
              >
                Disconnect All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to The Village platform
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {/* Privy Wallet - Embedded Wallet */}
          <button
            onClick={handlePrivyLogin}
            disabled={!ready || connecting || isCreatingWallet}
            className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50 bg-primary/5"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Privy Wallet</p>
              <p className="text-sm text-text-muted">
                {authenticated && !hasMovementWallet
                  ? "Creating Movement wallet..."
                  : "Email login with embedded wallet"}
              </p>
            </div>
            {(!ready || connecting || isCreatingWallet) && <Loader2 className="h-5 w-5 animate-spin" />}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-text-muted">Or connect with</span>
            </div>
          </div>

          {/* Petra Wallet */}
          <button
            onClick={() => handleConnect("Petra" as WalletName)}
            disabled={connecting}
            className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Petra Wallet</p>
              <p className="text-sm text-text-muted">
                {isPetraInstalled ? "Click to connect" : "Install required"}
              </p>
            </div>
            {connecting && <Loader2 className="h-5 w-5 animate-spin" />}
          </button>

          {/* Install Petra link if not installed */}
          {!isPetraInstalled && (
            <a
              href="https://petra.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
            >
              Install Petra Wallet
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Nightly Wallet - Direct Integration (bypasses adapter network validation) */}
          {nightlyInstalled && (
            <button
              onClick={async () => {
                try {
                  if (nightlyConnected) {
                    await disconnectNightly();
                  } else {
                    await connectNightly();
                  }
                  setOpen(false);
                } catch (error) {
                  console.error("Failed to connect/disconnect Nightly:", error);
                }
              }}
              disabled={nightlyConnecting}
              className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Nightly Wallet</p>
                <p className="text-sm text-text-muted">
                  {nightlyConnected ? "Connected (Direct)" : nightlyConnecting ? "Connecting..." : "Click to connect"}
                </p>
              </div>
              {nightlyConnecting && <Loader2 className="h-5 w-5 animate-spin" />}
            </button>
          )}

          {/* Install Nightly link if not installed */}
          {!nightlyInstalled && (
            <a
              href="https://nightly.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
            >
              Install Nightly Wallet
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Other wallets from adapter */}
          {wallets
            .filter((w) => w.name !== "Petra" && w.name !== "Nightly")
            .map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleConnect(wallet.name)}
                disabled={connecting}
                className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-sm text-text-muted">Click to connect</p>
                </div>
                {connecting && <Loader2 className="h-5 w-5 animate-spin" />}
              </button>
            ))}
        </div>
        <div className="text-center text-xs text-text-muted">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
}

