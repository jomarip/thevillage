"use client";

import { useState } from "react";
import { MainLayout } from "@/components/Navigation";
import { useUnifiedWallet } from "@/hooks";
import { useMemberStatus, useWhitelistAddress, useIsWhitelisted } from "@/hooks";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  AlertCircle,
  Shield,
  CheckCircle,
  X,
  Search,
  UserPlus,
  Loader2,
} from "lucide-react";
import { formatAddress } from "@/lib/config";

// Mock whitelisted addresses for demonstration
const MOCK_WHITELISTED = [
  "0x2144ec184b89cf405e430d375b3de991ae14baf26cb6ec9987ea57922c0f1c5b",
  "0x1234567890abcdef1234567890abcdef12345678",
  "0xabcdef1234567890abcdef1234567890abcdef12",
];

export default function AdminCompliancePage() {
  const { connected, account } = useUnifiedWallet();
  const { isMember, isAdmin, isLoading: memberLoading } = useMemberStatus();
  const { mutate: whitelistAddress, isPending: isWhitelisting } = useWhitelistAddress();

  const [searchQuery, setSearchQuery] = useState("");
  const [addressToWhitelist, setAddressToWhitelist] = useState("");
  const [showWhitelistDialog, setShowWhitelistDialog] = useState(false);
  const [checkAddress, setCheckAddress] = useState("");
  
  // Check if a specific address is whitelisted (when checkAddress is set)
  // Note: useIsWhitelisted only checks the connected wallet, so we'll use a direct query
  const [isAddressWhitelisted, setIsAddressWhitelisted] = useState<boolean | undefined>(undefined);
  const [checkingAddress, setCheckingAddress] = useState(false);
  
  // Check current wallet's whitelist status
  const { data: isCurrentWalletWhitelisted, isLoading: checkingStatus } = useIsWhitelisted();

  const filteredAddresses = MOCK_WHITELISTED.filter((addr) =>
    addr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWhitelist = () => {
    if (!addressToWhitelist) return;
    whitelistAddress(addressToWhitelist, {
      onSuccess: () => {
        setShowWhitelistDialog(false);
        setAddressToWhitelist("");
      },
    });
  };

  // Not connected state
  if (!connected) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-text-muted mb-8">
            Connect your wallet to manage compliance.
          </p>
          <WalletConnectModal
            trigger={
              <Button size="lg" className="gap-2">
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </Button>
            }
          />
        </div>
      </MainLayout>
    );
  }

  // Not an admin state
  if (!memberLoading && (!isMember || !isAdmin)) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto bg-warning/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-text-muted mb-8">
            Only administrators can manage compliance.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Compliance & KYC</h1>
              <Badge variant="default">Admin</Badge>
            </div>
            <p className="text-text-muted">
              Manage KYC verification and whitelist addresses
            </p>
          </div>
          <Button onClick={() => setShowWhitelistDialog(true)} className="gap-2">
            <Shield className="h-5 w-5" />
            Whitelist Address
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{MOCK_WHITELISTED.length}</p>
                <p className="text-sm text-text-muted">Whitelisted Addresses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {account && isCurrentWalletWhitelisted ? "1" : "0"}
                </p>
                <p className="text-sm text-text-muted">Your Status</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {MOCK_WHITELISTED.length}
                </p>
                <p className="text-sm text-text-muted">KYC Verified</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check Address Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Check Address Status</CardTitle>
            <CardDescription>
              Verify if an address is whitelisted (KYC verified)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter address to check..."
                value={checkAddress}
                onChange={(e) => setCheckAddress(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={async () => {
                  if (!checkAddress) return;
                  setCheckingAddress(true);
                  try {
                    const { isWhitelisted } = await import("@/lib/aptos");
                    const result = await isWhitelisted(checkAddress);
                    setIsAddressWhitelisted(result);
                  } catch (error) {
                    console.error("Error checking whitelist status:", error);
                    setIsAddressWhitelisted(false);
                  } finally {
                    setCheckingAddress(false);
                  }
                }}
                disabled={!checkAddress || checkingAddress}
              >
                {checkingAddress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Check"
                )}
              </Button>
            </div>
            {checkAddress && isAddressWhitelisted !== undefined && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  {isAddressWhitelisted ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="text-sm font-medium text-success">
                        Address is whitelisted (KYC verified)
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="h-5 w-5 text-error" />
                      <span className="text-sm font-medium text-error">
                        Address is not whitelisted
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search whitelisted addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Whitelisted Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Whitelisted Addresses</CardTitle>
            <CardDescription>
              All addresses that have passed KYC verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAddresses.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No whitelisted addresses found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAddresses.map((address) => (
                  <div
                    key={address}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-mono text-sm">{formatAddress(address)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            KYC Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCheckAddress(address);
                      }}
                    >
                      Check Status
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Status */}
        {account && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Compliance Status</CardTitle>
              <CardDescription>
                Current KYC verification status for your connected wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-mono text-sm">{formatAddress(account.address)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {checkingStatus ? (
                        <Badge variant="secondary">Checking...</Badge>
                      ) : isCheckedWhitelisted ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          KYC Verified
                        </Badge>
                      ) : (
                        <Badge variant="warning">Not Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {!isCurrentWalletWhitelisted && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setAddressToWhitelist(account.address);
                      setShowWhitelistDialog(true);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Request Whitelist
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Whitelist Dialog */}
        <Dialog open={showWhitelistDialog} onOpenChange={setShowWhitelistDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Whitelist Address</DialogTitle>
              <DialogDescription>
                Add an address to the compliance whitelist (KYC verified)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                  id="address"
                  placeholder="0x..."
                  value={addressToWhitelist}
                  onChange={(e) => setAddressToWhitelist(e.target.value)}
                />
              </div>
              <p className="text-sm text-text-muted">
                This will allow the address to participate in financial operations
                like deposits and investments. Ensure KYC verification has been completed
                before whitelisting.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWhitelistDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleWhitelist}
                isLoading={isWhitelisting}
                loadingText="Whitelisting..."
                disabled={!addressToWhitelist}
              >
                <Shield className="h-4 w-4 mr-2" />
                Whitelist Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
