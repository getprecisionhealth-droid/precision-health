'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity } from 'lucide-react'
import { format } from 'date-fns'
import { useLogHealthMetric } from '@/hooks/use-data'
import { healthMetricSchema, type HealthMetricInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, Textarea, FormField } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'

interface LogHealthDialogProps {
  clientId: string
  clientName: string
  trigger?: React.ReactNode
}

export function LogHealthDialog({ clientId, clientName, trigger }: LogHealthDialogProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const logMetric = useLogHealthMetric()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<HealthMetricInput>({
    resolver: zodResolver(healthMetricSchema) as never,
    defaultValues: { metric_date: format(new Date(), 'yyyy-MM-dd') },
  })

  async function onSubmit(data: HealthMetricInput) {
    setServerError(null)
    try {
      await logMetric.mutateAsync({ ...data, client_id: clientId })
      reset({ metric_date: format(new Date(), 'yyyy-MM-dd') })
      setOpen(false)
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Failed to save metrics')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Activity className="h-3.5 w-3.5" />
            Log Health
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Health Metrics</DialogTitle>
          <DialogDescription>
            Recording metrics for <strong className="text-[#a1a1aa]">{clientName}</strong>. Fill in only what you have.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-5">
          <FormField label="Date">
            <Input type="date" {...register('metric_date')} />
          </FormField>

          <div>
            <p className="text-xs font-semibold text-[#52525b] uppercase tracking-wider mb-3">Body Composition</p>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Weight (kg)">
                <Input type="number" step="0.1" placeholder="75.0" {...register('weight_kg')} />
              </FormField>
              <FormField label="Body Fat (%)">
                <Input type="number" step="0.1" placeholder="18.5" {...register('body_fat_pct')} />
              </FormField>
              <FormField label="Muscle Mass (kg)">
                <Input type="number" step="0.1" placeholder="60.0" {...register('muscle_mass_kg')} />
              </FormField>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#52525b] uppercase tracking-wider mb-3">Vitals</p>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Systolic (mmHg)">
                <Input type="number" placeholder="120" {...register('bp_systolic')} />
              </FormField>
              <FormField label="Diastolic (mmHg)">
                <Input type="number" placeholder="80" {...register('bp_diastolic')} />
              </FormField>
              <FormField label="Resting HR (bpm)">
                <Input type="number" placeholder="65" {...register('resting_hr')} />
              </FormField>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#52525b] uppercase tracking-wider mb-3">Lifestyle</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sleep (hours)">
                <Input type="number" step="0.5" placeholder="7.5" {...register('sleep_hours')} />
              </FormField>
              <FormField label="Sleep Quality (1–10)">
                <Input type="number" min="1" max="10" placeholder="7" {...register('sleep_quality')} />
              </FormField>
              <FormField label="Hydration (ml)">
                <Input type="number" placeholder="2500" {...register('hydration_ml')} />
              </FormField>
              <FormField label="Steps">
                <Input type="number" placeholder="8000" {...register('steps_count')} />
              </FormField>
              <FormField label="Energy Level (1–10)">
                <Input type="number" min="1" max="10" placeholder="7" {...register('energy_level')} />
              </FormField>
              <FormField label="Stress Level (1–10)">
                <Input type="number" min="1" max="10" placeholder="4" {...register('stress_level')} />
              </FormField>
            </div>
          </div>

          <FormField label="Notes">
            <Textarea placeholder="Any additional observations…" rows={2} {...register('notes')} />
          </FormField>

          {serverError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || logMetric.isPending}>Save Metrics</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
