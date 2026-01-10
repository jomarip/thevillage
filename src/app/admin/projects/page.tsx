"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/Navigation";
import { useUnifiedWallet } from "@/hooks";
import { useMemberStatus, useProjects, useApproveProject, useUpdateProjectStatus } from "@/hooks";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Building2,
  CheckCircle,
  X,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatAddress } from "@/lib/config";
import { PoolStatus, PoolStatusLabels } from "@/types/contract";

export default function AdminProjectsPage() {
  const { connected } = useUnifiedWallet();
  const { isMember, isAdmin, isLoading: memberLoading } = useMemberStatus();
  const { data: allProjects = [], isLoading: projectsLoading, refetch } = useProjects();
  const { mutate: approveProject, isPending: isApproving } = useApproveProject();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateProjectStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PoolStatus | "all">("all");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<number>(PoolStatus.Active);

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = allProjects;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by search query (project ID or borrower address)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.id?.toString().includes(query) ||
          p.borrower?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allProjects, statusFilter, searchQuery]);

  // Get pending projects (status = Pending = 0)
  const pendingProjects = allProjects.filter((p) => p.status === PoolStatus.Pending);

  const handleApprove = (projectId: number) => {
    approveProject(projectId, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleUpdateStatus = () => {
    if (selectedProject === null) return;
    updateStatus(
      { projectId: selectedProject, newStatus },
      {
        onSuccess: () => {
          setShowStatusDialog(false);
          setSelectedProject(null);
          refetch();
        },
      }
    );
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
            Connect your wallet to manage projects.
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
            Only administrators can approve projects.
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
              <h1 className="text-2xl font-bold">Project Management</h1>
              <Badge variant="default">Admin</Badge>
            </div>
            <p className="text-text-muted">
              Review and approve community project proposals
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={projectsLoading}>
              {projectsLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Refresh
            </Button>
            <Link href="/projects">
              <Button variant="outline">View All Projects</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allProjects.length}</p>
                <p className="text-sm text-text-muted">Total Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingProjects.length}</p>
                <p className="text-sm text-text-muted">Pending Approval</p>
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
                  {allProjects.filter((p) => p.status === PoolStatus.Active).length}
                </p>
                <p className="text-sm text-text-muted">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {allProjects.filter((p) => p.status === PoolStatus.Active).length}
                </p>
                <p className="text-sm text-text-muted">Active</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Projects */}
        {pendingProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Pending Approval ({pendingProjects.length})
              </CardTitle>
              <CardDescription>
                Projects waiting for admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Project #{project.id}</p>
                        <p className="text-sm text-text-muted font-mono">
                          {project.borrower ? formatAddress(project.borrower) : "Unknown"}
                        </p>
                        {project.targetAmount && (
                          <p className="text-xs text-text-muted mt-1">
                            Target: {project.targetAmount / 1e8} MOV
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApprove(project.id!)}
                        disabled={isApproving}
                      >
                        {isApproving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search by project ID or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                {Object.entries(PoolStatusLabels).map(([key, label]) => {
                  const status = parseInt(key) as PoolStatus;
                  return (
                    <Button
                      key={key}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Projects</CardTitle>
            <CardDescription>
              Manage project status and view details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
                <p className="text-text-muted">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No projects found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">Project #{project.id}</p>
                          <Badge variant="secondary">
                            {PoolStatusLabels[project.status as PoolStatus] || "Unknown"}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted font-mono">
                          {project.borrower ? formatAddress(project.borrower) : "Unknown"}
                        </p>
                        {project.targetAmount && (
                          <p className="text-xs text-text-muted mt-1">
                            Target: {project.targetAmount / 1e8} MOV
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {project.status === PoolStatus.Pending && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApprove(project.id!)}
                          disabled={isApproving}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {project.status !== PoolStatus.Pending && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProject(project.id!);
                            setNewStatus(project.status as number);
                            setShowStatusDialog(true);
                          }}
                          disabled={isUpdating}
                        >
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Project Status</DialogTitle>
              <DialogDescription>
                Change the status of project #{selectedProject}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={newStatus}
                  onChange={(e) => setNewStatus(parseInt(e.target.value))}
                >
                  {Object.entries(PoolStatusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
