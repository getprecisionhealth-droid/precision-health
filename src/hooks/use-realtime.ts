'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribes to Supabase Realtime changes on key tables.
 * Automatically invalidates React Query caches so trainers see client data instantly.
 */
export function useRealtimeSync() {
  const qc = useQueryClient()
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel('realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'health_metrics' },
        (payload) => {
          const clientId = (payload.new as Record<string, string>)?.client_id ?? (payload.old as Record<string, string>)?.client_id
          if (clientId) {
            qc.invalidateQueries({ queryKey: ['health-metrics', clientId] })
            qc.invalidateQueries({ queryKey: ['my-health-metrics'] })
          }
          qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
          qc.invalidateQueries({ queryKey: ['client-dashboard-stats'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'nutrition_logs' },
        (payload) => {
          const clientId = (payload.new as Record<string, string>)?.client_id ?? (payload.old as Record<string, string>)?.client_id
          if (clientId) {
            qc.invalidateQueries({ queryKey: ['nutrition-logs', clientId] })
          }
          qc.invalidateQueries({ queryKey: ['client-dashboard-stats'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workout_logs' },
        () => {
          qc.invalidateQueries({ queryKey: ['my-workout-plans'] })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals' },
        (payload) => {
          const clientId = (payload.new as Record<string, string>)?.client_id ?? (payload.old as Record<string, string>)?.client_id
          if (clientId) {
            qc.invalidateQueries({ queryKey: ['goals', clientId] })
            qc.invalidateQueries({ queryKey: ['my-goals'] })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainer_clients' },
        () => {
          qc.invalidateQueries({ queryKey: ['clients'] })
          qc.invalidateQueries({ queryKey: ['my-trainer'] })
          qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc])
}
