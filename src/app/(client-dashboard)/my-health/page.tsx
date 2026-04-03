'use client'

import { useState } from 'react'
import { Activity, Plus } from 'lucide-react'
import { useProfile, useMyHealthMetrics, useLogHealthMetric } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { HealthChart } from '@/components/health-metrics/health-chart'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'

export default function MyHealthPage() {
  const { data: profile } = useProfile()
  const { data: metrics, isLoading } = useMyHealthMetrics()
  const logMetric = useLogHealthMetric()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    metric_date: new Date().toISOString().slice(0, 10),
    weight_kg: '', body_fat_pct: '', sleep_hours: '', sleep_quality: '',
    resting_hr: '', energy_level: '', stress_level: '', steps_count: '', hydration_ml: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    await logMetric.mutateAsync({
      client_id: profile.id,
      metric_date: form.metric_date,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : undefined,
      sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : undefined,
      sleep_quality: form.sleep_quality ? Number(form.sleep_quality) : undefined,
      resting_hr: form.resting_hr ? Number(form.resting_hr) : undefined,
      energy_level: form.energy_level ? Number(form.energy_level) : undefined,
      stress_level: form.stress_level ? Number(form.stress_level) : undefined,
      steps_count: form.steps_count ? Number(form.steps_count) : undefined,
      hydration_ml: form.hydration_ml ? Number(form.hydration_ml) : undefined,
    } as never)
    setDialogOpen(false)
  }

  const latest = metrics?.[metrics.length - 1]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Health Metrics"
        description="Track your daily health data"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5" />Log Metrics</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[520px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Health Metrics</DialogTitle>
                <DialogDescription>Record your daily vitals and wellness data.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Date">
                  <Input type="date" value={form.metric_date} onChange={(e) => setForm(f => ({ ...f, metric_date: e.target.value }))} />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Weight (kg)"><Input type="number" step="0.1" placeholder="75.5" value={form.weight_kg} onChange={(e) => setForm(f => ({ ...f, weight_kg: e.target.value }))} /></FormField>
                  <FormField label="Body Fat %"><Input type="number" step="0.1" placeholder="18" value={form.body_fat_pct} onChange={(e) => setForm(f => ({ ...f, body_fat_pct: e.target.value }))} /></FormField>
                  <FormField label="Sleep (hours)"><Input type="number" step="0.5" placeholder="7.5" value={form.sleep_hours} onChange={(e) => setForm(f => ({ ...f, sleep_hours: e.target.value }))} /></FormField>
                  <FormField label="Sleep Quality (1-10)"><Input type="number" min="1" max="10" placeholder="8" value={form.sleep_quality} onChange={(e) => setForm(f => ({ ...f, sleep_quality: e.target.value }))} /></FormField>
                  <FormField label="Resting HR (bpm)"><Input type="number" placeholder="62" value={form.resting_hr} onChange={(e) => setForm(f => ({ ...f, resting_hr: e.target.value }))} /></FormField>
                  <FormField label="Steps"><Input type="number" placeholder="8000" value={form.steps_count} onChange={(e) => setForm(f => ({ ...f, steps_count: e.target.value }))} /></FormField>
                  <FormField label="Energy (1-10)"><Input type="number" min="1" max="10" placeholder="7" value={form.energy_level} onChange={(e) => setForm(f => ({ ...f, energy_level: e.target.value }))} /></FormField>
                  <FormField label="Hydration (ml)"><Input type="number" placeholder="2500" value={form.hydration_ml} onChange={(e) => setForm(f => ({ ...f, hydration_ml: e.target.value }))} /></FormField>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={logMetric.isPending}>Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Latest Snapshot */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Weight', value: latest.weight_kg, unit: 'kg', color: 'text-emerald-400' },
            { label: 'Sleep', value: latest.sleep_hours, unit: 'hrs', color: 'text-sky-400' },
            { label: 'Resting HR', value: latest.resting_hr, unit: 'bpm', color: 'text-rose-400' },
            { label: 'Steps', value: latest.steps_count, unit: '', color: 'text-amber-400' },
          ].map(({ label, value, unit, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>
                  {value ?? '—'}<span className="text-xs text-text-faint ml-1">{unit}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !metrics || metrics.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="h-10 w-10 text-border mx-auto mb-3" />
            <p className="text-text-muted text-sm">No health data logged yet</p>
            <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" />Log your first entry</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HealthChart metrics={metrics} metric="weight_kg" label="Weight (kg)" color="#10B981" />
          <HealthChart metrics={metrics} metric="sleep_hours" label="Sleep (hrs)" color="#3B82F6" />
          <HealthChart metrics={metrics} metric="resting_hr" label="Resting HR (bpm)" color="#F43F5E" />
          <HealthChart metrics={metrics} metric="steps_count" label="Steps" color="#F59E0B" />
        </div>
      )}
    </div>
  )
}
