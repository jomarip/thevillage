"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/Navigation";
import { useUnifiedWallet } from "@/hooks";
import { useMemberStatus, useInitializeHub, useRegisterCommunity } from "@/hooks";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Wallet,
  Building2,
  Loader2,
  Info,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { CONTRACT_ADDRESS } from "@/lib/config";

export default function CreateCommunityPage() {
  const router = useRouter();
  const { connected, account } = useUnifiedWallet();
  const { isMember, isAdmin, isLoading: memberLoading } = useMemberStatus();
  const { mutate: initializeHub, isPending: isInitializing } = useInitializeHub();
  const { mutate: registerCommunity, isPending: isRegistering } = useRegisterCommunity();

  const [step, setStep] = useState<"hub" | "community">("hub");
  const [hubInitialized, setHubInitialized] = useState(false);
  
  // Community form data
  const [formData, setFormData] = useState({
    communityId: "",
    membersRegistryAddr: "",
    complianceRegistryAddr: "",
    treasuryAddr: "",
    poolRegistryAddr: "",
    fractionalSharesAddr: "",
    governanceAddr: "",
    tokenAdminAddr: "",
    timeTokenAdminAddr: "",
  });

  // Hub address - defaults to contract address or user's address
  const hubAddr = account?.address || CONTRACT_ADDRESS;

  const handleInitializeHub = () => {
    initializeHub(undefined, {
      onSuccess: () => {
        setHubInitialized(true);
        setStep("community");
      },
    });
  };

  const handleRegisterCommunity = () => {
    const communityId = parseInt(formData.communityId);
    if (isNaN(communityId) || communityId < 0) {
      alert("Please enter a valid community ID (non-negative number)");
      return;
    }

    // Validate all addresses are provided
    const requiredFields = [
      "membersRegistryAddr",
      "complianceRegistryAddr",
      "treasuryAddr",
      "poolRegistryAddr",
      "fractionalSharesAddr",
      "governanceAddr",
      "tokenAdminAddr",
      "timeTokenAdminAddr",
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return;
      }
    }

    registerCommunity(
      {
        hubAddr,
        communityId,
        membersRegistryAddr: formData.membersRegistryAddr,
        complianceRegistryAddr: formData.complianceRegistryAddr,
        treasuryAddr: formData.treasuryAddr,
        poolRegistryAddr: formData.poolRegistryAddr,
        fractionalSharesAddr: formData.fractionalSharesAddr,
        governanceAddr: formData.governanceAddr,
        tokenAdminAddr: formData.tokenAdminAddr,
        timeTokenAdminAddr: formData.timeTokenAdminAddr,
      },
      {
        onSuccess: () => {
          router.push("/admin/communities");
        },
      }
    );
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            Connect your wallet to create a new community.
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
            Only administrators can create new communities.
          </p>
          <Link href="/admin/communities">
            <Button variant="outline">Back to Communities</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/communities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Create New Community</h1>
              <Badge variant="default">Admin</Badge>
            </div>
            <p className="text-text-muted">
              Register a new community in the Registry Hub
            </p>
          </div>
        </div>

        {/* Step 1: Initialize Hub */}
        {step === "hub" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Step 1: Initialize Registry Hub
              </CardTitle>
              <CardDescription>
                Initialize the registry hub at your address to manage multiple communities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hub Address</p>
                    <p className="text-sm text-text-muted font-mono break-all">
                      {hubAddr}
                    </p>
                    <p className="text-xs text-text-muted mt-2">
                      The registry hub will be initialized at this address. This only needs to be done once per address.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleInitializeHub}
                disabled={isInitializing || hubInitialized}
                className="w-full"
                size="lg"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : hubInitialized ? (
                  "Hub Initialized ✓"
                ) : (
                  "Initialize Registry Hub"
                )}
              </Button>

              {hubInitialized && (
                <Button
                  onClick={() => setStep("community")}
                  className="w-full"
                  size="lg"
                >
                  Continue to Community Registration
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Register Community */}
        {step === "community" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Step 2: Register Community
              </CardTitle>
              <CardDescription>
                Provide all registry addresses for the new community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-text-muted">
                  <strong>Hub Address:</strong> {hubAddr}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="communityId">Community ID *</Label>
                  <Input
                    id="communityId"
                    type="number"
                    placeholder="0"
                    value={formData.communityId}
                    onChange={(e) => updateField("communityId", e.target.value)}
                  />
                  <p className="text-xs text-text-muted">
                    Unique identifier for this community
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Registry Addresses</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="membersRegistryAddr">Members Registry *</Label>
                    <Input
                      id="membersRegistryAddr"
                      placeholder="0x..."
                      value={formData.membersRegistryAddr}
                      onChange={(e) => updateField("membersRegistryAddr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complianceRegistryAddr">Compliance Registry *</Label>
                    <Input
                      id="complianceRegistryAddr"
                      placeholder="0x..."
                      value={formData.complianceRegistryAddr}
                      onChange={(e) => updateField("complianceRegistryAddr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="treasuryAddr">Treasury *</Label>
                    <Input
                      id="treasuryAddr"
                      placeholder="0x..."
                      value={formData.treasuryAddr}
                      onChange={(e) => updateField("treasuryAddr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poolRegistryAddr">Pool Registry *</Label>
                    <Input
                      id="poolRegistryAddr"
                      placeholder="0x..."
                      value={formData.poolRegistryAddr}
                      onChange={(e) => updateField("poolRegistryAddr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fractionalSharesAddr">Fractional Shares *</Label>
                    <Input
                      id="fractionalSharesAddr"
                      placeholder="0x..."
                      value={formData.fractionalSharesAddr}
                      onChange={(e) => updateField("fractionalSharesAddr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="governanceAddr">Governance *</Label>
                    <Input
                      id="governanceAddr"
                      placeholder="0x..."
                      value={formData.governanceAddr}
                      onChange={(e) => updateField("governanceAddr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tokenAdminAddr">Token Admin *</Label>
                    <Input
                      id="tokenAdminAddr"
                      placeholder="0x..."
                      value={formData.tokenAdminAddr}
                      onChange={(e) => updateField("tokenAdminAddr", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeTokenAdminAddr">Time Token Admin *</Label>
                    <Input
                      id="timeTokenAdminAddr"
                      placeholder="0x..."
                      value={formData.timeTokenAdminAddr}
                      onChange={(e) => updateField("timeTokenAdminAddr", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("hub")}
                  disabled={isRegistering}
                >
                  Back
                </Button>
                <Button
                  onClick={handleRegisterCommunity}
                  disabled={isRegistering}
                  className="flex-1"
                  size="lg"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Community"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
