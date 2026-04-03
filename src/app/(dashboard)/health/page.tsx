'use client'

import { useState } from 'react'
import { Activity, Users } from 'lucide-react'
import { useClients, useHealthMetrics } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, UserAvatar, Skeleton } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { HealthChart } from '@/components/health-metrics/health-chart'
import { LogHealthDialog } from '@/components/health-metrics/log-health-dialog'
import { Button } from '@/components/ui/button'
import { formatDate, formatWeight, formatBloodPressure } from '@/lib/utils'

function ClientHealthCard({ tc }: { tc: { client_id: string; client?: { full_name: string; avatar_url: string | null; email: string } } }) {
  const { data: metrics, isLoading } = useHealthMetrics(tc.client_id)
  const latest = metrics?.[metrics.length - 1]
  const client = tc.client

  if (!client) return null

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={client.full_name} src={client.avatar_url} size="sm" />
            <div>
              <p className="text-sm font-semibold text-text-primary">{client.full_name}</p>
              <p className="text-xs text-text-muted">
                {latest ? `Last logged ${formatDate(latest.metric_date)}` : 'No data yet'}
              </p>
            </div>
          </div>
          <LogHealthDialog
            clientId={tc.client_id}
            clientName={client.full_name}
            trigger={
              <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                <Activity className="h-3 w-3 mr-1" />Log
              </Button>
            }
          />
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : metrics && metrics.length > 0 ? (
          <>
            {/* Latest stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Weight', value: formatWeight(latest?.weight_kg ?? null) },
                { label: 'Body Fat', value: latest?.body_fat_pct ? `${latest.body_fat_pct}%` : '—' },
                { label: 'Sleep', value: latest?.sleep_hours ? `${latest.sleep_hours}h` : '—' },
                { label: 'Energy', value: latest?.energy_level ? `${latest.energy_level}/10` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-2 rounded-md bg-surface-alt border border-border-subtle">
                  <p className="text-[9px] text-text-muted uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <HealthChart metrics={metrics} metric="weight_kg" label="Weight" color="#6366f1" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 border border-dashed border-border rounded-lg">
            <p className="text-xs text-text-muted">No metrics logged</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function HealthPage() {
  const { data: clients, isLoading } = useClients()
  const activeClients = clients?.filter(c => c.status === 'active') ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Health Metrics"
        description="Track biometrics and wellness across all your clients"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-48 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : activeClients.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-10 w-10 text-border mx-auto mb-4" />
          <p className="text-sm text-text-tertiary">No active clients to show metrics for</p>
          <p className="text-xs text-text-muted mt-1">Add clients from the Clients page first</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeClients.map(tc => (
            <ClientHealthCard key={tc.id} tc={tc as Parameters<typeof ClientHealthCard>[0]['tc']} />
          ))}
        </div>
      )}
    </div>
  )
}
