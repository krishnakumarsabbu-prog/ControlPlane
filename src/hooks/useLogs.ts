import { useRef, useState, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getLogs, clearLogs } from '../services/api'
import { queryClient } from '../store/queryClient'
import type { LogEntry } from '../types'

export type LogFilter = 'all' | 'info' | 'warn' | 'error' | 'success' | 'debug' | 'system'

const MAX_LOG_ENTRIES = 500
const POLL_INTERVAL_MS = 1500

export function useLogs() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const seqRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // track whether the component is mounted to avoid state updates after unmount
  const mountedRef = useRef(true)

  const fetchIncremental = useCallback(async () => {
    try {
      const { logs, seq } = await getLogs(seqRef.current)
      if (!mountedRef.current) return
      if (logs.length > 0) {
        seqRef.current = seq
        setEntries(prev => {
          const combined = [...prev, ...logs]
          return combined.length > MAX_LOG_ENTRIES
            ? combined.slice(combined.length - MAX_LOG_ENTRIES)
            : combined
        })
      }
    } catch {
      // silently retry next tick
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchIncremental()
    intervalRef.current = setInterval(fetchIncremental, POLL_INTERVAL_MS)
    return () => {
      mountedRef.current = false
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
