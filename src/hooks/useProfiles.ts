import { useQuery, useMutation } from '@tanstack/react-query'
import { getProfiles, createProfile, deleteProfile, updateProfileProjects } from '../services/supabase'
import { queryClient } from '../store/queryClient'

export const PROFILES_KEY = ['profiles'] as const

export function useProfiles() {
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: getProfiles,
  })
}

export function useCreateProfile() {
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) => createProfile(name, color),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

export function useDeleteProfile() {
  return useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}

export function useUpdateProfileProjects() {
  return useMutation({
    mutationFn: ({ profileId, projectIds }: { profileId: string; projectIds: string[] }) =>
      updateProfileProjects(profileId, projectIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROFILES_KEY }),
  })
}
