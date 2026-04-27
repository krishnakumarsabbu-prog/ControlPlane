import { useQuery, useMutation } from '@tanstack/react-query'
import { getProjects, startProject, stopProject, updateProjectConfig, getPorts } from '../services/api'
import { queryClient } from '../store/queryClient'

export const PROJECTS_KEY = ['projects'] as const
export const PORTS_KEY = ['ports'] as const

// Poll projects every 4s — reduced from 3s to ease load
// Exponential backoff on error is handled by react-query's retry config
export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: getProjects,
    refetchInterval: 4000,
    retry: 2,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 5000),
  })
}

export function usePorts() {
  return useQuery({
    queryKey: PORTS_KEY,
    queryFn: getPorts,
    refetchInterval: 6000,
    retry: 2,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 5000),
  })
}

export function useStartProject() {
  return useMutation({
    mutationFn: (id: string) => startProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: PORTS_KEY })
    },
  })
}

export function useStopProject() {
  return useMutation({
    mutationFn: (id: string) => stopProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: PORTS_KEY })
    },
  })
}

export function useUpdateProjectConfig() {
  return useMutation({
    mutationFn: ({ id, config }: { id: string; config: { autoRestart?: boolean; maxRetries?: number } }) =>
      updateProjectConfig(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}
