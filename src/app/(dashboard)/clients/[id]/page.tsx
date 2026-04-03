'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, Target, Dumbbell, StickyNote, Calendar, Mail, Phone, Apple, Coffee, Sun, Moon, Cookie, Trash2 } from 'lucide-react'
import { useClient, useHealthMetrics, useGoals, useNutritionLogs, useNutritionPlans, useDeleteNutritionPlan, useWorkoutPlans, useDeleteWorkoutPlan } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, UserAvatar, Badge, Skeleton, Progress } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogHealthDialog } from '@/components/health-metrics/log-health-dialog'
import { HealthChart } from '@/components/health-metrics/health-chart'
import { AddGoalDialog } from '@/components/goals/add-goal-dialog'
import { STATUS_COLORS, formatDate, getGoalProgress } from '@/lib/utils'

type Tab = 'overview' | 'health' | 'goals' | 'workouts' | 'nutrition'

const MEAL_ICONS: Record<string, React.ElementType> = {
  breakfast: Coffee, lunch: Sun, dinner: Moon, snack: Cookie,
}
const MEAL_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-500/15 text-amber-400',
  lunch: 'bg-sky-500/15 text-sky-400',
  dinner: 'bg-violet-500/15 text-violet-400',
  snack: 'bg-rose-500/15 text-rose-400',
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { data: tc, isLoading } = useClient(id)
  const { data: metrics } = useHealthMetrics(id)
  const { data: goals } = useGoals(id)
  const today = new Date().toISOString().slice(0, 10)
  const { data: nutritionLogs } = useNutritionLogs(id, today)
  
  const { data: allNutritionPlans } = useNutritionPlans()
  const nutritionPlans = allNutritionPlans?.filter(p => p.client_id === id) ?? []
  const deleteNutritionPlan = useDeleteNutritionPlan()

  const { data: allWorkoutPlans } = useWorkoutPlans()
  const workoutPlans = allWorkoutPlans?.filter(p => p.client_id === id && p.plan_type === 'assigned') ?? []
  const deleteWorkoutPlan = useDeleteWorkoutPlan()

  const client = tc?.client
  const latest = metrics?.[metrics.length - 1]

  if (isLoading) return (
    <div className="p-8 max-w-5xl mx-auto">
      <Skeleton className="h-6 w-32 mb-6" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )

  if (!client) return (
    <div className="p-8 text-center">
      <p className="text-text-tertiary">Client not found</p>
      <Button asChild variant="outline" className="mt-4"><Link href="/clients">Back</Link></Button>
    </div>
  )

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary mb-6 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
      </Link>

      {/* Client header card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <UserAvatar name={client.full_name} src={client.avatar_url} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-bold text-text-primary">{client.full_name}</h1>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[tc?.status ?? 'active']}`}>
                  {tc?.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Mail className="h-3 w-3" />{client.email}
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <Phone className="h-3 w-3" />{client.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Calendar className="h-3 w-3" />Since {formatDate(tc?.onboarding_date ?? '')}
                </span>
              </div>
              {tc?.goal_summary && (
                <p className="text-xs text-text-tertiary mt-2 max-w-xl leading-relaxed">
                  🎯 {tc.goal_summary}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <LogHealthDialog clientId={id} clientName={client.full_name} />
              <AddGoalDialog clientId={id} />
            </div>
          </div>

          {/* Quick stats row */}
          {latest && (
            <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-border-subtle">
              {[
                { label: 'Weight', value: latest.weight_kg ? `${latest.weight_kg} kg` : '—' },
                { label: 'Body Fat', value: latest.body_fat_pct ? `${latest.body_fat_pct}%` : '—' },
                { label: 'BMI', value: latest.bmi?.toString() ?? '—' },
                { label: 'Resting HR', value: latest.resting_hr ? `${latest.resting_hr} bpm` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-subtle">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Weight Trend</CardTitle></CardHeader>
            <CardContent>
              <HealthChart metrics={metrics ?? []} metric="weight_kg" label="Weight (kg)" color="#6366f1" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Active Goals</CardTitle></CardHeader>
            <CardContent>
              {!goals || goals.filter(g => g.status === 'active').length === 0 ? (
                <div className="text-center py-6">
                  <Target className="h-6 w-6 text-border mx-auto mb-2" />
                  <p className="text-xs text-text-muted">No active goals</p>
                  <AddGoalDialog clientId={id} trigger={<Button size="sm" variant="outline" className="mt-3">Set Goal</Button>} />
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.filter(g => g.status === 'active').slice(0, 3).map(goal => {
                    const pct = getGoalProgress(goal.baseline_value, goal.current_value, goal.target_value)
                    return (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-text-primary font-medium">{goal.title}</span>
                          <span className="text-xs text-indigo-400 font-medium">{pct}%</span>
                        </div>
                        <Progress value={pct} />
                        {goal.target_date && (
                          <p className="text-[10px] text-text-muted mt-1">Target: {formatDate(goal.target_date)}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Weight (kg)</CardTitle></CardHeader>
              <CardContent><HealthChart metrics={metrics ?? []} metric="weight_kg" label="Weight" color="#6366f1" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Body Fat %</CardTitle></CardHeader>
              <CardContent><HealthChart metrics={metrics ?? []} metric="body_fat_pct" label="Body Fat %" color="#f59e0b" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Sleep (hours)</CardTitle></CardHeader>
              <CardContent><HealthChart metrics={metrics ?? []} metric="sleep_hours" label="Sleep" color="#22c55e" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Resting Heart Rate</CardTitle></CardHeader>
              <CardContent><HealthChart metrics={metrics ?? []} metric="resting_hr" label="HR (bpm)" color="#ef4444" /></CardContent>
            </Card>
          </div>
          {(!metrics || metrics.length === 0) && (
            <div className="text-center py-10 text-text-muted">
              <Activity className="h-8 w-8 mx-auto mb-3 text-border" />
              <p className="text-sm">No health metrics logged yet</p>
              <LogHealthDialog clientId={id} clientName={client.full_name}
                trigger={<Button size="sm" className="mt-3">Log First Entry</Button>} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <div className="flex justify-end mb-4">
            <AddGoalDialog clientId={id} />
          </div>
          {!goals || goals.length === 0 ? (
            <div className="text-center py-16">
              <Target className="h-10 w-10 text-border mx-auto mb-3" />
              <p className="text-sm text-text-tertiary">No goals set yet</p>
              <AddGoalDialog clientId={id} trigger={<Button className="mt-4">Set First Goal</Button>} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {goals.map(goal => {
                const pct = getGoalProgress(goal.baseline_value, goal.current_value, goal.target_value)
                return (
                  <Card key={goal.id}>
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-text-primary">{goal.title}</h3>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[goal.status]}`}>
                              {goal.status}
                            </span>
                            {goal.timeframe && (
                              <span className="text-[10px] text-text-muted capitalize">{goal.timeframe}-term</span>
                            )}
                          </div>
                          {goal.description && <p className="text-xs text-text-tertiary mb-3">{goal.description}</p>}
                          {goal.target_value !== null && (
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-text-tertiary">
                                  {goal.current_value ?? goal.baseline_value ?? 0} {goal.target_unit} →{' '}
                                  {goal.target_value} {goal.target_unit}
                                </span>
                                <span className="text-indigo-400 font-medium">{pct}%</span>
                              </div>
                              <Progress value={pct} />
                            </div>
                          )}
                        </div>
                        {goal.target_date && (
                          <p className="text-xs text-text-muted flex-shrink-0">Due {formatDate(goal.target_date)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'nutrition' && (
        <div>
          {!nutritionLogs || nutritionLogs.length === 0 ? (
            <div className="text-center py-16">
              <Apple className="h-10 w-10 text-border mx-auto mb-3" />
              <p className="text-sm text-text-tertiary">No nutrition logs from {client.full_name} today</p>
              <p className="text-xs text-text-faint mt-1">Their entries will appear here in real-time</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Calories', value: nutritionLogs.reduce((s, l) => s + (l.calories ?? 0), 0), unit: 'kcal', color: 'text-amber-400' },
                  { label: 'Protein', value: Math.round(nutritionLogs.reduce((s, l) => s + (Number(l.protein_g) ?? 0), 0)), unit: 'g', color: 'text-sky-400' },
                  { label: 'Carbs', value: Math.round(nutritionLogs.reduce((s, l) => s + (Number(l.carbs_g) ?? 0), 0)), unit: 'g', color: 'text-emerald-400' },
                  { label: 'Fat', value: Math.round(nutritionLogs.reduce((s, l) => s + (Number(l.fat_g) ?? 0), 0)), unit: 'g', color: 'text-rose-400' },
                ].map(({ label, value, unit, color }) => (
                  <Card key={label}>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
                      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}<span className="text-xs text-text-faint ml-1">{unit}</span></p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-3">
                {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                  const items = nutritionLogs.filter(l => l.meal_type === mealType)
                  if (!items.length) return null
                  const MealIcon = MEAL_ICONS[mealType as keyof typeof MEAL_ICONS] ?? Apple
                  const colorClass = MEAL_COLORS[mealType] ?? 'bg-surface-2 text-text-muted'
                  return (
                    <Card key={mealType}>
                      <CardHeader>
                        <div className="flex items-center gap-2 pb-2">
                          <div className={`h-7 w-7 rounded-md flex items-center justify-center ${colorClass}`}>
                            <MealIcon className="h-3.5 w-3.5" />
                          </div>
                          <CardTitle className="capitalize text-base">{mealType}</CardTitle>
                          <span className="text-xs text-text-faint ml-auto">{items.reduce((s, l) => s + (l.calories ?? 0), 0)} kcal</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="divide-y divide-border-subtle">
                          {items.map(log => (
                            <div key={log.id} className="flex items-center gap-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{log.food_name}</p>
                                <p className="text-xs text-text-muted">
                                  {[log.calories && `${log.calories} kcal`, log.protein_g && `${log.protein_g}g protein`, log.carbs_g && `${log.carbs_g}g carbs`, log.fat_g && `${log.fat_g}g fat`].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {/* Assigned Diet Plans */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Assigned Diet Plans</h3>
              <Button asChild size="sm" variant="outline">
                <Link href="/nutrition-plans/new">Create Diet Plan</Link>
              </Button>
            </div>
            {!nutritionPlans || nutritionPlans.length === 0 ? (
               <div className="text-center py-8 text-text-muted border border-border border-dashed rounded-xl">
                 <p className="text-sm">No diet plans assigned to {client.full_name}</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                 {nutritionPlans.map(plan => (
                   <Card key={plan.id}>
                     <CardContent className="pt-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-text-primary">{plan.title}</h4>
                            {plan.description && <p className="text-xs text-text-tertiary mt-1">{plan.description}</p>}
                            <div className="flex gap-4 mt-3">
                              {plan.target_calories && <p className="text-xs font-medium text-amber-500">{plan.target_calories} kcal</p>}
                              {plan.target_protein_g && <p className="text-xs text-text-muted">P: {plan.target_protein_g}g</p>}
                              {plan.target_carbs_g && <p className="text-xs text-text-muted">C: {plan.target_carbs_g}g</p>}
                              {plan.target_fat_g && <p className="text-xs text-text-muted">F: {plan.target_fat_g}g</p>}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={deleteNutritionPlan.isPending}
                            onClick={(e) => {
                              e.preventDefault()
                              if (confirm('Are you sure you want to delete this diet plan?')) {
                                deleteNutritionPlan.mutate(plan.id)
                              }
                            }}
                            className="text-text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'workouts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Assigned Workout Plans</h3>
            <Button asChild size="sm" variant="outline">
              <Link href="/workouts/new">Create Workout Plan</Link>
            </Button>
          </div>
          {!workoutPlans || workoutPlans.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="h-10 w-10 text-border mx-auto mb-3" />
              <p className="text-sm text-text-tertiary">No workout plans assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {workoutPlans.map(plan => (
                 <Card key={plan.id}>
                    <CardContent className="pt-5 flex flex-col h-full">
                       <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-text-primary">{plan.name}</h4>
                          <button
                            type="button"
                            disabled={deleteWorkoutPlan.isPending}
                            onClick={(e) => {
                              e.preventDefault()
                              if (confirm('Are you sure you want to delete this plan?')) {
                                deleteWorkoutPlan.mutate(plan.id)
                              }
                            }}
                            className="text-text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                       </div>
                       {plan.description && <p className="text-xs text-text-tertiary line-clamp-2 mb-3">{plan.description}</p>}
                       {plan.difficulty && (
                          <span className={`self-start inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize mt-auto bg-surface-2 text-text-tertiary border-border`}>
                            {plan.difficulty}
                          </span>
                       )}
                    </CardContent>
                 </Card>
               ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
