'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Dumbbell, GripVertical,
  Users, Clock, ChevronDown, ChevronUp
} from 'lucide-react'
import { useWorkoutPlan, useAddExerciseToPlan, useRemoveExerciseFromPlan } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, FormField, Select } from '@/components/ui/input'
import { ExercisePicker } from '@/components/workouts/exercise-picker'
import { cn, DAYS_OF_WEEK } from '@/lib/utils'
import type { Exercise, WorkoutPlanExercise } from '@/types/database'

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
}

interface ExerciseRowProps {
  item: WorkoutPlanExercise
  onRemove: () => void
}

function ExerciseRow({ item, onRemove }: ExerciseRowProps) {
  const [expanded, setExpanded] = useState(false)
  const ex = item.exercise

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-alt overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <GripVertical className="h-3.5 w-3.5 text-text-faint cursor-grab flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{ex?.name}</p>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-text-muted">
            {item.sets && <span>{item.sets} sets</span>}
            {item.reps && <span>× {item.reps} reps</span>}
            {item.weight_kg && <span>@ {item.weight_kg}kg</span>}
            {item.rest_seconds && <span>{item.rest_seconds}s rest</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onRemove}
            className="h-6 w-6 rounded flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 grid grid-cols-4 gap-2 border-t border-border-subtle pt-3">
          {[
            { label: 'Sets', value: item.sets },
            { label: 'Reps', value: item.reps },
            { label: 'Weight (kg)', value: item.weight_kg },
            { label: 'Rest (sec)', value: item.rest_seconds },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-text-muted mb-1">{label}</p>
              <p className="text-xs text-text-secondary">{value ?? '—'}</p>
            </div>
          ))}
          {item.notes && (
            <div className="col-span-4">
              <p className="text-[10px] text-[#52525b] mb-1">Notes</p>
              <p className="text-xs text-text-tertiary">{item.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface AddExerciseFormProps {
  planId: string
  exercise: Exercise
  onDone: () => void
}

function AddExerciseForm({ planId, exercise, onDone }: AddExerciseFormProps) {
  const addExercise = useAddExerciseToPlan()
  const [form, setForm] = useState({
    day_of_week: '1', sets: '3', reps: '10', weight_kg: '', rest_seconds: '60', notes: ''
  })

  async function handleAdd() {
    await addExercise.mutateAsync({
      plan_id: planId,
      exercise_id: exercise.id,
      day_of_week: parseInt(form.day_of_week) || undefined,
      sets: parseInt(form.sets) || undefined,
      reps: form.reps || undefined,
      weight_kg: parseFloat(form.weight_kg) || undefined,
      rest_seconds: parseInt(form.rest_seconds) || undefined,
      notes: form.notes || undefined,
      order_index: 0,
    })
    onDone()
  }

  const f = (field: keyof typeof form) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  })

  return (
    <div className="rounded-lg border border-indigo-500/30 bg-indigo-600/5 p-4 space-y-3">
      <p className="text-sm font-medium text-text-primary">Configure: {exercise.name}</p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Day">
          <Select {...f('day_of_week')}>
            {DAYS_OF_WEEK.map((d, i) => (
              <option key={i} value={i + 1}>{d}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Sets">
          <Input type="number" min="1" placeholder="3" {...f('sets')} />
        </FormField>
        <FormField label="Reps">
          <Input placeholder="10 or 8-12" {...f('reps')} />
        </FormField>
        <FormField label="Weight (kg)">
          <Input type="number" step="0.5" placeholder="optional" {...f('weight_kg')} />
        </FormField>
        <FormField label="Rest (seconds)">
          <Input type="number" placeholder="60" {...f('rest_seconds')} />
        </FormField>
        <FormField label="Notes">
          <Input placeholder="optional" {...f('notes')} />
        </FormField>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} loading={addExercise.isPending}>
          {!addExercise.isPending && <><Plus className="h-3.5 w-3.5" />Add to Plan</>}
        </Button>
      </div>
    </div>
  )
}

export default function WorkoutPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: plan, isLoading } = useWorkoutPlan(id)
  const removeExercise = useRemoveExerciseFromPlan()
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  if (isLoading) return (
    <div className="p-8 max-w-6xl mx-auto">
      <Skeleton className="h-6 w-32 mb-6" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )

  if (!plan) return (
    <div className="p-8 text-center">
      <p className="text-[#71717a]">Plan not found</p>
      <Button asChild variant="outline" className="mt-4"><Link href="/workouts">Back</Link></Button>
    </div>
  )

  const exercisesByDay = DAYS_OF_WEEK.reduce((acc, _, i) => {
    acc[i + 1] = plan.exercises?.filter(e => e.day_of_week === i + 1) ?? []
    return acc
  }, {} as Record<number, WorkoutPlanExercise[]>)

  const unscheduled = plan.exercises?.filter(e => !e.day_of_week) ?? []
  const currentDayExercises = exercisesByDay[selectedDay] ?? []
  const existingIds = plan.exercises?.map(e => e.exercise_id) ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/workouts" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary mb-6 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to plans
      </Link>

      {/* Plan header */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">{plan.name}</h1>
                {plan.description && (
                  <p className="text-xs text-text-tertiary mt-0.5 max-w-lg">{plan.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {plan.difficulty && (
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize', DIFFICULTY_COLORS[plan.difficulty])}>
                      {plan.difficulty}
                    </span>
                  )}
                  {plan.duration_weeks && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="h-3 w-3" />{plan.duration_weeks} weeks
                    </span>
                  )}
                  {plan.client && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Users className="h-3 w-3" />
                      Assigned to {(plan.client as { full_name: string }).full_name}
                    </span>
                  )}
                  <span className="text-xs text-[#52525b]">
                    {plan.exercises?.length ?? 0} exercises
                  </span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => { setShowPicker(!showPicker); setPendingExercise(null) }}
              variant={showPicker ? 'outline' : 'default'}
            >
              <Plus className="h-3.5 w-3.5" />
              {showPicker ? 'Hide Library' : 'Add Exercise'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className={cn('grid gap-6', showPicker ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1')}>
        {/* Main plan editor */}
        <div className={showPicker ? 'lg:col-span-3' : ''}>
          {/* Day tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {DAYS_OF_WEEK.map((day, i) => {
              const dayNum = i + 1
              const count = exercisesByDay[dayNum]?.length ?? 0
              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
                    selectedDay === dayNum
                      ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400'
                      : 'bg-[#111113] border-[#27272a] text-[#71717a] hover:text-[#a1a1aa] hover:border-[#3f3f46]'
                  )}
                >
                  <span>{day.slice(0, 3)}</span>
                  {count > 0 && (
                    <span className={cn('text-[10px] mt-0.5 font-bold', selectedDay === dayNum ? 'text-indigo-400' : 'text-text-faint')}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Current day exercises */}
          <Card>
            <CardHeader>
              <CardTitle>{DAYS_OF_WEEK[selectedDay - 1]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingExercise && (
                <AddExerciseForm
                  planId={id}
                  exercise={pendingExercise}
                  onDone={() => setPendingExercise(null)}
                />
              )}

              {currentDayExercises.length === 0 && !pendingExercise ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <Dumbbell className="h-6 w-6 text-border mx-auto mb-2" />
                  <p className="text-xs text-text-muted">No exercises for {DAYS_OF_WEEK[selectedDay - 1]}</p>
                  <p className="text-[10px] text-text-faint mt-0.5">
                    {showPicker ? 'Click an exercise from the library →' : 'Click "Add Exercise" to get started'}
                  </p>
                </div>
              ) : (
                currentDayExercises.map(item => (
                  <ExerciseRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeExercise.mutate({ id: item.id, plan_id: id })}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Unscheduled exercises */}
          {unscheduled.length > 0 && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-xs text-[#52525b]">Unscheduled Exercises</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {unscheduled.map(item => (
                  <ExerciseRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeExercise.mutate({ id: item.id, plan_id: id })}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Exercise library panel */}
        {showPicker && (
          <div className="lg:col-span-2">
            <Card className="sticky top-6">
              <CardHeader><CardTitle>Exercise Library</CardTitle></CardHeader>
              <CardContent>
                <ExercisePicker
                  excludeIds={[]}
                  onAdd={(exercise) => {
                    setPendingExercise(exercise)
                    setShowPicker(false)
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
