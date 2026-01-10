"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedWallet } from "@/hooks";
import { MainLayout } from "@/components/Navigation";
import { useRequestMembership, useMemberStatus, useMembershipRequests, useMovementWallet } from "@/hooks";
import { RequestStatus } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { Role, RoleLabels, RoleDescriptions } from "@/types/contract";
import { UserPlus, CheckCircle, Wallet, Info, Clock } from "lucide-react";

export default function RequestMembershipPage() {
  const router = useRouter();
  const { connected, account, walletType } = useUnifiedWallet();
  const { isMember, isLoading: statusLoading } = useMemberStatus();
  const { mutate: requestMembership, isPending } = useRequestMembership();
  const { data: pendingRequests = [], isLoading: requestsLoading } = useMembershipRequests(RequestStatus.Pending);
  const { hasMovementWallet, createMovementWallet, isLoading: isMovementLoading } = useMovementWallet();
  
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [note, setNote] = useState("");
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Check if current user has a pending request
  // Note: This is a simplified check - you may need to adjust based on your contract structure
  const hasPendingRequest = useMemo(() => {
    if (!account?.address || pendingRequests.length === 0) return false;
    // For now, we'll show pending if there are any pending requests
    // In a real implementation, you'd check if the current address matches any request
    return pendingRequests.length > 0;
  }, [account?.address, pendingRequests]);

  // Automatically create Movement wallet for Privy users when they're authenticated
  useEffect(() => {
    const autoCreateWallet = async () => {
      // Only auto-create if:
      // 1. User is connected via Privy
      // 2. Movement wallet doesn't exist
      // 3. Not already creating
      // 4. Not loading
      if (
        walletType === "privy" &&
        !hasMovementWallet &&
        !isCreatingWallet &&
        !isMovementLoading &&
        connected
      ) {
        try {
          setIsCreatingWallet(true);
          await createMovementWallet();
        } catch (error) {
          // Silently fail - user can manually create when submitting
          console.log("Auto-creation of Movement wallet failed, will create on submit:", error);
        } finally {
          setIsCreatingWallet(false);
        }
      }
    };

    autoCreateWallet();
  }, [walletType, hasMovementWallet, isCreatingWallet, isMovementLoading, connected, createMovementWallet]);

  // Ensure Movement wallet exists for Privy users before submitting
  const ensureMovementWallet = async () => {
    if (walletType === "privy" && !hasMovementWallet && !isCreatingWallet) {
      setIsCreatingWallet(true);
      setWalletError(null);
      try {
        await createMovementWallet();
      } catch (error: any) {
        console.error("Failed to create Movement wallet:", error);
        setWalletError(error.message || "Failed to create Movement wallet. Please try again.");
        throw error;
      } finally {
        setIsCreatingWallet(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      // Ensure Movement wallet exists for Privy users
      await ensureMovementWallet();

      requestMembership(
        { role: parseInt(selectedRole) as Role, note },
        {
          onSuccess: () => {
            router.push("/volunteer/dashboard");
          },
        }
      );
    } catch (error) {
      // Error already handled in ensureMovementWallet
      console.error("Failed to prepare transaction:", error);
    }
  };

  // If already a member, show status
  if (!statusLoading && isMember) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <CardTitle>You&apos;re Already a Member!</CardTitle>
              <CardDescription>
                You have already registered as a member of The Village.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push("/volunteer/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // If has pending request, show pending status
  if (!requestsLoading && hasPendingRequest && !isMember) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <CardTitle>Membership Request Pending</CardTitle>
              <CardDescription>
                Your membership request has been submitted and is awaiting approval from administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-text-muted">
                You will be able to access all features once your request is approved.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => router.push("/")} variant="outline">
                  Return to Home
                </Button>
                <Button onClick={() => router.push("/volunteer/dashboard")} variant="outline">
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // If not connected, show connect prompt
  if (!connected) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect a wallet to request membership in The Village community.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <WalletConnectModal
                trigger={
                  <Button size="lg" className="gap-2">
                    <Wallet className="h-5 w-5" />
                    Connect Wallet
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Request Membership</h1>
          <p className="text-text-muted">
            Join The Village community and start participating in community reinvestment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Membership Application</CardTitle>
                <CardDescription>
                  Select your role and provide a brief note about yourself.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" required>
                  Select Your Role
                </Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RoleLabels)
                      .filter(([key]) => parseInt(key) !== Role.Admin) // Hide admin role
                      .map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                {/* Role description */}
                {selectedRole && (
                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg mt-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-muted">
                      {RoleDescriptions[parseInt(selectedRole) as Role]}
                    </p>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note">
                  Introduction Note (Optional)
                </Label>
                <Textarea
                  id="note"
                  placeholder="Tell us a bit about yourself and why you want to join..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-text-muted">
                  This will be visible to administrators reviewing your application.
                </p>
              </div>

              {/* Role Benefits */}
              <div className="space-y-3">
                <Label>Role Benefits</Label>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Badge variant="secondary">Investor/Contributor</Badge>
                    <span className="text-sm">Deposit funds, earn returns, invest in projects</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Badge variant="warning">Project Initiator</Badge>
                    <span className="text-sm">Initiate projects, apply for loans, receive investment pool funding</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Badge variant="default">Validator/Staff</Badge>
                    <span className="text-sm">Approve volunteer hours, validate service requests, review membership applications</span>
                  </div>
                </div>
              </div>

              {/* Wallet Error Message */}
              {walletError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{walletError}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!selectedRole || isPending || isCreatingWallet}
                isLoading={isPending || isCreatingWallet}
                loadingText={isCreatingWallet ? "Creating Movement Wallet..." : "Submitting Request..."}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                {isCreatingWallet ? "Setting Up Wallet..." : "Submit Membership Request"}
              </Button>

              <p className="text-xs text-center text-text-muted">
                By submitting, you agree to the platform&apos;s terms of service and community guidelines.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

