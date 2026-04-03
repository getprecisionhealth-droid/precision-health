'use client'

import { Target, CheckCircle2, Clock, PauseCircle } from 'lucide-react'
import { useMyGoals } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  active:   { icon: Clock,        color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  achieved: { icon: CheckCircle2,  color: 'text-sky-400',     bg: 'bg-sky-500/15 border-sky-500/30' },
  paused:   { icon: PauseCircle,   color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  cancelled: { icon: Target,       color: 'text-text-muted',  bg: 'bg-surface-2 border-border' },
}

export default function MyGoalsPage() {
  const { data: goals, isLoading } = useMyGoals()

  const active = goals?.filter(g => g.status === 'active') ?? []
  const completed = goals?.filter(g => g.status !== 'active') ?? []

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="My Goals"
        description="Goals set by your trainer for you to achieve"
      />

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !goals || goals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="h-10 w-10 text-border mx-auto mb-3" />
            <p className="text-text-muted text-sm">No goals set yet</p>
            <p className="text-xs text-text-faint mt-1">Your trainer will set goals for you to work towards</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">Active Goals</h2>
              <div className="space-y-3">
                {active.map(goal => {
                  const cfg = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.active
                  const StatusIcon = cfg.icon
                  const progress = goal.target_value && goal.current_value
                    ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                    : null
                  return (
                    <Card key={goal.id} className={`border ${cfg.bg}`}>
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <StatusIcon className={`h-4 w-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-sm font-semibold text-text-primary">{goal.title}</h3>
                                {goal.description && (
                                  <p className="text-xs text-text-muted mt-0.5">{goal.description}</p>
                                )}
                              </div>
                              {goal.category && <Badge variant="outline" className="capitalize text-[10px]">{goal.category.replace('_', ' ')}</Badge>}
                            </div>
                            {progress !== null && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                                  <span>Progress</span>
                                  <span>{goal.current_value} / {goal.target_value} {goal.target_unit}</span>
                                </div>
                                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {goal.target_date && (
                              <p className="text-xs text-text-faint mt-2">Target: {new Date(goal.target_date).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">Completed / Other</h2>
              <div className="space-y-3">
                {completed.map(goal => {
                  const cfg = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.cancelled
                  const StatusIcon = cfg.icon
                  return (
                    <Card key={goal.id} className="opacity-75">
                      <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-text-secondary">{goal.title}</h3>
                          </div>
                          <Badge variant="outline" className="capitalize text-[10px]">{goal.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
