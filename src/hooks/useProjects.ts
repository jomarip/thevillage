"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  getProject,
  listProjects,
} from "@/lib/aptos";
import { queryKeys } from "@/providers/QueryProvider";
import { PoolStatus } from "@/types/contract";

/**
 * Hook to get a specific project
 */
export function useProject(projectId: number) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: projectId > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to list projects, optionally filtered by status
 */
export function useProjects(statusFilter?: PoolStatus) {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => listProjects(statusFilter),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
