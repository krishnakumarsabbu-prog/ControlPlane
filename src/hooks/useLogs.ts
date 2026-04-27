import { useRef, useState, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getLogs, clearLogs } from '../services/api'
import { queryClient } from '../store/queryClient'
import type { LogEntry } from '../types'

export type LogFilter = 'all' | 'info' | 'warn' | 'error' | 'success' | 'debug' | 'system'

export function useLogs() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const seqRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchIncremental = useCallback(async () => {
    try {
      const { logs, seq } = await getLogs(seqRef.current)
      if (logs.length > 0) {
        seqRef.current = seq
        setEntries(prev => {
          const combined = [...prev, ...logs]
          // Keep at most 1000 in the frontend buffer
          return combined.length > 1000 ? combined.slice(combined.length - 1000) : combined
        })
      }
    } catch {
      // silently retry next tick
    }
  }, [])

  useEffect(() => {
    fetchIncremental()
    intervalRef.current = setInterval(fetchIncremental, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchIncremental])

  const clear = useCallback(() => {
    setEntries([])
    seqRef.current = 0
  }, [])

  return { entries, clear }
}

export function useClearLogs(onCleared?: () => void) {
  return useMutation({
    mutationFn: clearLogs,
    onSuccess: () => {
      onCleared?.()
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
  })
}
