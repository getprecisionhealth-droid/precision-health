'use client'

import Link from 'next/link'
import { Dumbbell, Apple, Activity, Target, ArrowRight, User } from 'lucide-react'
import { useClientDashboardStats, useMyTrainer, useMyWorkoutPlans, useProfile } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, UserAvatar, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'

function StatCard({ label, value, sub, icon: Icon, accent = false }:
  { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-emerald-500/30 bg-emerald-600/5' : ''}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-text-primary mt-1 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent ? 'bg-emerald-600/20' : 'bg-surface-2'}`}>
            <Icon className={`h-4 w-4 ${accent ? 'text-emerald-400' : 'text-text-muted'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientDashboardPage() {
  const { data: stats, isLoading } = useClientDashboardStats()
  const { data: trainerLink } = useMyTrainer()
  const { data: plans } = useMyWorkoutPlans()
  const { data: profile } = useProfile()

  const trainer = trainerLink?.trainer

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'there'}!`}
        description="Your daily fitness and wellness overview"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard label="Active Plans" value={stats?.activePlans ?? 0} sub="assigned workout plans" icon={Dumbbell} accent />
            <StatCard label="Today's Meals" value={stats?.todayMeals ?? 0} sub="logged today" icon={Apple} />
            <StatCard label="Health Entries" value={stats?.totalMetrics ?? 0} sub="total tracked" icon={Activity} />
            <StatCard label="Active Goals" value={stats?.activeGoals ?? 0} sub="in progress" icon={Target} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workout Plans */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <CardTitle>My Workout Plans</CardTitle>
                  <CardDescription className="mt-0.5">Plans assigned by your trainer</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/my-workouts" className="text-xs text-emerald-400 hover:text-emerald-300">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!plans || plans.length === 0 ? (
                <div className="text-center py-10">
                  <Dumbbell className="h-8 w-8 text-border mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No workout plans assigned yet</p>
                  <p className="text-xs text-text-faint mt-1">Your trainer will assign plans to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plans.slice(0, 5).map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/my-workouts`}
                      className="flex items-center gap-3 p-2.5 rounded-md hover:bg-surface-2 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-emerald-600/15 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{plan.name}</p>
                        <p className="text-xs text-text-muted">
                          {plan.difficulty && <span className="capitalize">{plan.difficulty}</span>}
                          {plan.duration_weeks && <span> · {plan.duration_weeks} weeks</span>}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Assigned Trainer */}
          <Card>
            <CardHeader>
              <CardTitle className="pb-3">My Trainer</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {trainer ? (
                <div className="flex items-center gap-3">
                  <UserAvatar name={trainer.full_name} src={trainer.avatar_url} size="md" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{trainer.full_name}</p>
                    <p className="text-xs text-text-muted">{trainer.email}</p>
                    {trainer.specializations?.length ? (
                      <p className="text-xs text-emerald-400 mt-0.5">{trainer.specializations.slice(0, 2).join(', ')}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="h-7 w-7 text-border mx-auto mb-2" />
                  <p className="text-xs text-text-muted">No trainer assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="pb-3">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { href: '/nutrition', icon: Apple, label: 'Log a meal' },
                { href: '/my-health', icon: Activity, label: 'Log health metrics' },
                { href: '/my-workouts', icon: Dumbbell, label: 'View workout plans' },
                { href: '/my-goals', icon: Target, label: 'Check my goals' },
              ].map(({ href, icon: Icon, label }) => (
                <Button key={href} variant="ghost" className="w-full justify-start gap-3 h-9" asChild>
                  <Link href={href}>
                    <Icon className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-xs">{label}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
