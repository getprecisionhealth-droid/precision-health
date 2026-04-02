'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useCreateWorkoutPlan, useClients } from '@/hooks/use-data'
import { workoutPlanSchema, type WorkoutPlanInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, Textarea, FormField, Select } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Plan Details' },
  { id: 2, label: 'Assignment' },
  { id: 3, label: 'Confirm' },
]

export default function NewWorkoutPlanPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const createPlan = useCreateWorkoutPlan()
  const { data: clients } = useClients()
  const activeClients = clients?.filter(c => c.status === 'active') ?? []

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WorkoutPlanInput>({
    resolver: zodResolver(workoutPlanSchema) as never,
    defaultValues: { plan_type: 'template' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const planType = watch('plan_type')
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedName = watch('name')
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedClientId = watch('client_id')
  const selectedClient = activeClients.find(c => c.client_id === watchedClientId)

  async function onSubmit(data: WorkoutPlanInput) {
    setServerError(null)
    try {
      const plan = await createPlan.mutateAsync({
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        duration_weeks: data.duration_weeks,
        client_id: data.plan_type === 'assigned' ? data.client_id : undefined,
        plan_type: data.plan_type,
      })
      router.push(`/workouts/${plan.id}`)
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Failed to create plan')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/workouts" className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#a1a1aa] mb-8 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to plans
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#fafafa]">Create Workout Plan</h1>
        <p className="text-sm text-[#71717a] mt-0.5">Build a reusable template or assign directly to a client</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
              step > s.id ? 'bg-indigo-600 text-white' :
              step === s.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40' :
              'bg-[#1a1a1f] text-[#52525b] border border-[#27272a]'
            )}>
              {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
            </div>
            <span className={cn('text-xs', step === s.id ? 'text-[#fafafa]' : 'text-[#52525b]')}>{s.label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-[#27272a] mx-1" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1 — Plan Details */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField label="Plan Name *" error={errors.name?.message}>
                <Input placeholder="e.g. 12-Week Strength Foundation" {...register('name')} />
              </FormField>

              <FormField label="Description" error={errors.description?.message}>
                <Textarea
                  placeholder="What is this plan designed to achieve? Who is it for?"
                  rows={3}
                  {...register('description')}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Difficulty">
                  <Select {...register('difficulty')} placeholder="Select difficulty">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </FormField>
                <FormField label="Duration (weeks)">
                  <Input type="number" min="1" max="52" placeholder="8" {...register('duration_weeks')} />
                </FormField>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!watchedName}
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Assignment */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-[#a1a1aa]">How do you want to use this plan?</p>

              <div className="space-y-2">
                {([
                  ['template', 'Reusable Template', 'Save as a template you can assign to multiple clients later'],
                  ['assigned', 'Assign to Client', 'Directly assign this plan to a specific client right now'],
                ] as const).map(([val, title, desc]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setValue('plan_type', val)}
                    className={cn(
                      'w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-all',
                      planType === val
                        ? 'border-indigo-500 bg-indigo-500/8'
                        : 'border-[#27272a] bg-[#111113] hover:border-[#3f3f46]'
                    )}
                  >
                    <div className={cn(
                      'h-4 w-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-colors',
                      planType === val ? 'border-indigo-500 bg-indigo-500' : 'border-[#3f3f46]'
                    )}>
                      {planType === val && <div className="h-full w-full rounded-full bg-white scale-50" />}
                    </div>
                    <div>
                      <p className={cn('text-sm font-medium', planType === val ? 'text-[#fafafa]' : 'text-[#a1a1aa]')}>{title}</p>
                      <p className="text-xs text-[#52525b] mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {planType === 'assigned' && (
                <FormField label="Select Client" error={errors.client_id?.message}>
                  {activeClients.length === 0 ? (
                    <p className="text-xs text-[#71717a] p-3 rounded-md bg-[#1a1a1f] border border-[#27272a]">
                      No active clients found. <Link href="/clients/new" className="text-indigo-400">Add a client first.</Link>
                    </p>
                  ) : (
                    <Select {...register('client_id')} placeholder="Choose a client…">
                      {activeClients.map(tc => (
                        <option key={tc.client_id} value={tc.client_id}>
                          {tc.client?.full_name} — {tc.client?.email}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>
              )}

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-[#a1a1aa] mb-4">Review your plan before creating</p>

              <div className="space-y-3 rounded-lg bg-[#0d0d10] border border-[#1a1a1f] p-4">
                {[
                  { label: 'Name', value: watch('name') },
                  { label: 'Type', value: planType === 'template' ? 'Reusable Template' : 'Assigned to Client' },
                  { label: 'Assigned to', value: selectedClient?.client?.full_name ?? (planType === 'template' ? 'N/A' : 'No client selected') },
                  { label: 'Difficulty', value: watch('difficulty') ?? 'Not set' },
                  { label: 'Duration', value: watch('duration_weeks') ? `${watch('duration_weeks')} weeks` : 'Not set' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-xs text-[#52525b] w-24 flex-shrink-0">{label}</span>
                    <span className="text-xs text-[#fafafa] capitalize text-right">{value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#52525b] mt-4">
                After creating, you&apos;ll be taken to the plan editor to add exercises day by day.
              </p>

              {serverError && (
                <div className="mt-4 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                  <p className="text-sm text-red-400">{serverError}</p>
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>
                <Button type="submit" loading={createPlan.isPending}>
                  {!createPlan.isPending && <><Check className="h-3.5 w-3.5" />Create Plan</>}
                  {createPlan.isPending && 'Creating…'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
