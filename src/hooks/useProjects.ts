import { useQuery, useMutation } from '@tanstack/react-query'
import { getProjects, startProject, stopProject } from '../services/api'
import { queryClient } from '../store/queryClient'

export const PROJECTS_KEY = ['projects'] as const

export function useProjects() {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: getProjects,
    refetchInterval: 3000,
  })
}

export function useStartProject() {
  return useMutation({
    mutationFn: (id: string) => startProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useStopProject() {
  return useMutation({
    mutationFn: (id: string) => stopProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}
