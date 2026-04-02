'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, Target, Dumbbell, StickyNote, Calendar, Mail, Phone } from 'lucide-react'
import { useClient, useHealthMetrics, useGoals } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, UserAvatar, Badge, Skeleton, Progress } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogHealthDialog } from '@/components/health-metrics/log-health-dialog'
import { HealthChart } from '@/components/health-metrics/health-chart'
import { AddGoalDialog } from '@/components/goals/add-goal-dialog'
import { STATUS_COLORS, formatDate, getGoalProgress } from '@/lib/utils'

type Tab = 'overview' | 'health' | 'goals' | 'workouts'

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { data: tc, isLoading } = useClient(id)
  const { data: metrics } = useHealthMetrics(id)
  const { data: goals } = useGoals(id)

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
      <p className="text-[#71717a]">Client not found</p>
      <Button asChild variant="outline" className="mt-4"><Link href="/clients">Back</Link></Button>
    </div>
  )

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'health', label: 'Health', icon: Activity },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#a1a1aa] mb-6 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
      </Link>

      {/* Client header card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <UserAvatar name={client.full_name} src={client.avatar_url} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-bold text-[#fafafa]">{client.full_name}</h1>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[tc?.status ?? 'active']}`}>
                  {tc?.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-[#71717a]">
                  <Mail className="h-3 w-3" />{client.email}
                </span>
                {client.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-[#71717a]">
                    <Phone className="h-3 w-3" />{client.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-[#71717a]">
                  <Calendar className="h-3 w-3" />Since {formatDate(tc?.onboarding_date ?? '')}
                </span>
              </div>
              {tc?.goal_summary && (
                <p className="text-xs text-[#71717a] mt-2 max-w-xl leading-relaxed">
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
            <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#1a1a1f]">
              {[
                { label: 'Weight', value: latest.weight_kg ? `${latest.weight_kg} kg` : '—' },
                { label: 'Body Fat', value: latest.body_fat_pct ? `${latest.body_fat_pct}%` : '—' },
                { label: 'BMI', value: latest.bmi?.toString() ?? '—' },
                { label: 'Resting HR', value: latest.resting_hr ? `${latest.resting_hr} bpm` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[10px] text-[#52525b] uppercase tracking-wide">{label}</p>
                  <p className="text-lg font-bold text-[#fafafa] mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#1a1a1f]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#71717a] hover:text-[#a1a1aa]'
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
                  <Target className="h-6 w-6 text-[#27272a] mx-auto mb-2" />
                  <p className="text-xs text-[#52525b]">No active goals</p>
                  <AddGoalDialog clientId={id} trigger={<Button size="sm" variant="outline" className="mt-3">Set Goal</Button>} />
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.filter(g => g.status === 'active').slice(0, 3).map(goal => {
                    const pct = getGoalProgress(goal.baseline_value, goal.current_value, goal.target_value)
                    return (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-[#fafafa] font-medium">{goal.title}</span>
                          <span className="text-xs text-indigo-400 font-medium">{pct}%</span>
                        </div>
                        <Progress value={pct} />
                        {goal.target_date && (
                          <p className="text-[10px] text-[#52525b] mt-1">Target: {formatDate(goal.target_date)}</p>
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
            <div className="text-center py-10 text-[#52525b]">
              <Activity className="h-8 w-8 mx-auto mb-3 text-[#27272a]" />
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
              <Target className="h-10 w-10 text-[#27272a] mx-auto mb-3" />
              <p className="text-sm text-[#71717a]">No goals set yet</p>
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
                            <h3 className="text-sm font-semibold text-[#fafafa]">{goal.title}</h3>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[goal.status]}`}>
                              {goal.status}
                            </span>
                            {goal.timeframe && (
                              <span className="text-[10px] text-[#52525b] capitalize">{goal.timeframe}-term</span>
                            )}
                          </div>
                          {goal.description && <p className="text-xs text-[#71717a] mb-3">{goal.description}</p>}
                          {goal.target_value !== null && (
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-[#71717a]">
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
                          <p className="text-xs text-[#52525b] flex-shrink-0">Due {formatDate(goal.target_date)}</p>
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

      {activeTab === 'workouts' && (
        <div className="text-center py-16">
          <Dumbbell className="h-10 w-10 text-[#27272a] mx-auto mb-3" />
          <p className="text-sm text-[#71717a]">Workout logs coming soon</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/workouts/new">Create a plan for {client.full_name}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
