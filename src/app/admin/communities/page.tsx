"use client";

import { useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/Navigation";
import { useUnifiedWallet } from "@/hooks";
import { useMemberStatus, useCommunityConfig } from "@/hooks";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  AlertCircle,
  Building2,
  Plus,
  ExternalLink,
  Info,
} from "lucide-react";
import { CONTRACT_ADDRESS, formatAddress } from "@/lib/config";

// Mock communities for demonstration
// In production, this would fetch from the registry hub
const MOCK_COMMUNITIES = [
  {
    id: 0,
    name: "Homewood Children's Village",
    hubAddr: CONTRACT_ADDRESS,
    createdAt: Date.now() - 86400000 * 30,
  },
];

export default function AdminCommunitiesPage() {
  const { connected, account } = useUnifiedWallet();
  const { isMember, isAdmin, isLoading: memberLoading } = useMemberStatus();
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(null);
  const hubAddr = account?.address || CONTRACT_ADDRESS;

  // Fetch community config if one is selected
  const { data: communityConfig, isLoading: configLoading } = useCommunityConfig(
    selectedCommunity !== null ? hubAddr : undefined,
    selectedCommunity ?? 0
  );

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
            Connect your wallet to manage communities.
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
            Only administrators can manage communities.
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
              <h1 className="text-2xl font-bold">Community Management</h1>
              <Badge variant="default">Admin</Badge>
            </div>
            <p className="text-text-muted">
              Manage and view all registered communities
            </p>
          </div>
          <Link href="/admin/communities/create">
            <Button className="gap-2">
              <Plus className="h-5 w-5" />
              Create Community
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{MOCK_COMMUNITIES.length}</p>
                <p className="text-sm text-text-muted">Total Communities</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{MOCK_COMMUNITIES.length}</p>
                <p className="text-sm text-text-muted">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <Info className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hubAddr ? "1" : "0"}</p>
                <p className="text-sm text-text-muted">Hub Initialized</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communities List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered Communities</CardTitle>
            <CardDescription>
              Click on a community to view its configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {MOCK_COMMUNITIES.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No communities registered yet</p>
                <Link href="/admin/communities/create">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Community
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {MOCK_COMMUNITIES.map((community) => (
                  <div
                    key={community.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCommunity === community.id
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedCommunity(community.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{community.name}</h3>
                          <Badge variant="secondary">ID: {community.id}</Badge>
                        </div>
                        <p className="text-sm text-text-muted font-mono">
                          Hub: {formatAddress(community.hubAddr)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://explorer.movementnetwork.xyz/?network=bardock+testnet&account=${community.hubAddr}`,
                            "_blank"
                          );
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Expanded Config View */}
                    {selectedCommunity === community.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {configLoading ? (
                          <p className="text-sm text-text-muted">Loading configuration...</p>
                        ) : communityConfig ? (
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="font-medium text-text-muted mb-1">Members Registry</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.members_registry_addr)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-text-muted mb-1">Compliance Registry</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.compliance_registry_addr)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-text-muted mb-1">Treasury</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.treasury_addr)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-text-muted mb-1">Pool Registry</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.pool_registry_addr)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-text-muted mb-1">Fractional Shares</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.fractional_shares_addr)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-text-muted mb-1">Governance</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.governance_addr)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-text-muted mb-1">Token Admin</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.token_admin_addr)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-text-muted mb-1">Time Token Admin</p>
                              <p className="font-mono text-xs break-all">
                                {formatAddress(communityConfig.time_token_admin_addr)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-text-muted">
                            Configuration not found. This community may not be registered in the hub.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
