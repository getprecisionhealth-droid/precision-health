'use client'

import { Dumbbell, Clock, Flame, ChevronRight } from 'lucide-react'
import { useMyWorkoutPlans } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'

export default function MyWorkoutsPage() {
  const { data: plans, isLoading } = useMyWorkoutPlans()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="My Workouts"
        description="Workout plans assigned by your trainer"
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : !plans || plans.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Dumbbell className="h-10 w-10 text-border mx-auto mb-3" />
            <p className="text-text-muted text-sm">No workout plans assigned yet</p>
            <p className="text-xs text-text-faint mt-1">Your trainer will create and assign workout plans to you</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const exerciseCount = plan.exercises?.length ?? 0
            return (
              <Card key={plan.id} className="group hover:border-emerald-500/30 transition-colors">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-emerald-600/15 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{plan.name}</h3>
                          {plan.description && (
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{plan.description}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-faint group-hover:text-emerald-400 transition-colors mt-0.5" />
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        {plan.difficulty && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                            <Flame className="h-3 w-3" />
                            <span className="capitalize">{plan.difficulty}</span>
                          </span>
                        )}
                        {plan.duration_weeks && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                            <Clock className="h-3 w-3" />
                            {plan.duration_weeks} weeks
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary">
                          <Dumbbell className="h-3 w-3" />
                          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Exercise list */}
                      {plan.exercises && plan.exercises.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border-subtle">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-faint mb-2">Exercises</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {plan.exercises.map((pe, i) => (
                              <div key={pe.id ?? i} className="flex items-center gap-2 text-xs text-text-secondary">
                                <span className="h-5 w-5 rounded bg-surface-2 flex items-center justify-center text-[10px] font-medium text-text-muted flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="truncate">{pe.exercise?.name ?? 'Exercise'}</span>
                                {pe.sets && pe.reps && (
                                  <span className="text-text-faint ml-auto flex-shrink-0">{pe.sets}×{pe.reps}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
