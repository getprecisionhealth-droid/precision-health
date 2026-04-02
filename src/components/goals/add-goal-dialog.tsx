'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Target } from 'lucide-react'
import { useCreateGoal } from '@/hooks/use-data'
import { goalSchema, type GoalInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, Textarea, FormField, Select } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'

interface AddGoalDialogProps {
  clientId: string
  trigger?: React.ReactNode
}

export function AddGoalDialog({ clientId, trigger }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const createGoal = useCreateGoal()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema) as never,
  })

  async function onSubmit(data: GoalInput) {
    setServerError(null)
    try {
      await createGoal.mutateAsync({ ...data, client_id: clientId })
      reset()
      setOpen(false)
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Failed to create goal')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Target className="h-3.5 w-3.5" />
            Add Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Set Client Goal</DialogTitle>
          <DialogDescription>Define a measurable goal to track client progress.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Goal Title *" error={errors.title?.message}>
            <Input placeholder="e.g. Reach 75kg body weight" {...register('title')} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <Select {...register('category')} placeholder="Select category">
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
                <option value="nutrition">Nutrition</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="custom">Custom</option>
              </Select>
            </FormField>
            <FormField label="Timeframe">
              <Select {...register('timeframe')} placeholder="Select timeframe">
                <option value="short">Short (&lt;4 weeks)</option>
                <option value="medium">Medium (1–3 months)</option>
                <option value="long">Long (3+ months)</option>
              </Select>
            </FormField>
            <FormField label="Baseline Value">
              <Input type="number" step="0.1" placeholder="e.g. 85" {...register('baseline_value')} />
            </FormField>
            <FormField label="Target Value">
              <Input type="number" step="0.1" placeholder="e.g. 75" {...register('target_value')} />
            </FormField>
          </div>

          <FormField label="Unit" hint="e.g. kg, %, reps, km">
            <Input placeholder="kg" {...register('target_unit')} />
          </FormField>

          <FormField label="Target Date">
            <Input type="date" {...register('target_date')} />
          </FormField>

          <FormField label="Description">
            <Textarea placeholder="Add more context about this goal…" rows={2} {...register('description')} />
          </FormField>

          {serverError && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false) }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createGoal.isPending}>Create Goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
