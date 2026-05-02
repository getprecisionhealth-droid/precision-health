'use client'

import Link from 'next/link'
import { Users, Dumbbell, TrendingUp, Plus, ArrowRight, Activity, Apple, UserPlus } from 'lucide-react'
import { useClients, useDashboardStats, useWorkoutPlans, useProfile } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, UserAvatar, Badge, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { STATUS_COLORS, formatDate, formatRelativeTime } from '@/lib/utils'
import { BusinessSetup } from '@/components/auth/business-setup'

function StatCard({ label, value, sub, icon: Icon, accent = false }:
  { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-indigo-500/30 bg-indigo-600/5' : ''}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-tertiary font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-text-primary mt-1 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent ? 'bg-indigo-600/20' : 'bg-surface-2'}`}>
            <Icon className={`h-4 w-4 ${accent ? 'text-indigo-400' : 'text-text-muted'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: plans } = useWorkoutPlans()

  if (profileLoading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
  }

  // If new admin bypassing signup using Google auth, force business setup
  if (profile && !profile.organization_id) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <BusinessSetup profileName={profile.full_name} />
      </div>
    )
  }

  const recentClients = clients?.slice(0, 6) ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="Your coaching overview at a glance"
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/team"><UserPlus className="h-3.5 w-3.5" />Team</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/clients"><Plus className="h-3.5 w-3.5" />Add Client</Link>
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard label="Active Clients" value={stats?.activeClients ?? 0} sub="currently training" icon={Users} accent />
            <StatCard label="Total Clients" value={stats?.totalClients ?? 0} sub="all time" icon={Users} />
            <StatCard label="Workout Plans" value={stats?.totalPlans ?? 0} sub="created" icon={Dumbbell} />
            <StatCard label="Trainers" value={stats?.totalTrainers ?? 0} sub="in your team" icon={UserPlus} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clients */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <CardTitle>Recent Clients</CardTitle>
                  <CardDescription className="mt-0.5">Your latest added clients</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/clients" className="text-xs text-indigo-400 hover:text-indigo-300">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {clientsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1"><Skeleton className="h-3.5 w-32 mb-1.5" /><Skeleton className="h-3 w-24" /></div>
                    </div>
                  ))}
                </div>
              ) : recentClients.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-8 w-8 text-border mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No clients yet</p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/clients/new">Add your first client</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {recentClients.map((tc) => (
                    <Link
                      key={tc.id}
                      href={`/clients/${tc.client_id}`}
                      className="flex items-center gap-3 py-3 hover:bg-surface-2 -mx-5 px-5 transition-colors first:pt-0 last:pb-0"
                    >
                      <UserAvatar name={tc.client?.full_name ?? 'Client'} src={tc.client?.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{tc.client?.full_name}</p>
                        <p className="text-xs text-text-muted truncate">{tc.client?.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[tc.status]}`}>
                          {tc.status}
                        </span>
                        <span className="text-[10px] text-text-faint">{formatRelativeTime(tc.created_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Plans */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <CardTitle>Workout Plans</CardTitle>
                  <CardDescription className="mt-0.5">Recently created</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/workouts" className="text-xs text-indigo-400">
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!plans || plans.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="h-7 w-7 text-border mx-auto mb-2" />
                  <p className="text-xs text-text-muted mb-3">No plans yet</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/workouts/new">Create plan</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {plans.slice(0, 5).map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/workouts/${plan.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-md hover:bg-surface-2 transition-colors group"
                    >
                      <div className="h-7 w-7 rounded bg-indigo-600/15 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{plan.name}</p>
                        <p className="text-[10px] text-text-muted">
                          {plan.client ? `→ ${(plan.client as {full_name: string}).full_name}` : 'Template'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="pb-3">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { href: '/clients/new', icon: Users, label: 'Add new client' },
                { href: '/team', icon: UserPlus, label: 'Manage team' },
                { href: '/workouts/new', icon: Dumbbell, label: 'Create workout plan' },
                { href: '/nutrition-plans', icon: Apple, label: 'Create diet plan' },
                { href: '/health', icon: Activity, label: 'Log health metrics' },
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
