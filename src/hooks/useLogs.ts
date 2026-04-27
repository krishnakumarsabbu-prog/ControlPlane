import { useQuery, useMutation } from '@tanstack/react-query'
import { getLogs, clearLogs } from '../services/api'
import { queryClient } from '../store/queryClient'

export const LOGS_KEY = ['logs'] as const

export function useLogs() {
  return useQuery({
    queryKey: LOGS_KEY,
    queryFn: getLogs,
    refetchInterval: 1000,
  })
}

export function useClearLogs() {
  return useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOGS_KEY })
    },
  })
}
