'use client'

import Link from 'next/link'
import { Users, Dumbbell, TrendingUp, Plus, ArrowRight, Activity, Apple } from 'lucide-react'
import { useTrainerClients, useDashboardStats, useWorkoutPlans, useProfile } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, UserAvatar, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { STATUS_COLORS, formatRelativeTime } from '@/lib/utils'

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

export default function TrainerDashboardPage() {
  const { data: profile } = useProfile()
  const { data: clients, isLoading: clientsLoading } = useTrainerClients()
  const { data: plans } = useWorkoutPlans()

  const assignedClients = clients ?? []
  const recentClients = assignedClients.slice(0, 6)
  const activeCount = assignedClients.filter(c => c.status === 'active').length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(' ')[0] ?? 'Trainer'}`}
        description="Your assigned clients and coaching overview"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Assigned Clients" value={assignedClients.length} sub="total assigned" icon={Users} accent />
        <StatCard label="Active Clients" value={activeCount} sub="currently training" icon={Users} />
        <StatCard label="Workout Plans" value={plans?.length ?? 0} sub="created" icon={Dumbbell} />
        <StatCard label="This Month" value={
          assignedClients.filter(c => {
            const d = new Date(c.created_at)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length
        } sub="new assignments" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Clients */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between pb-4">
                <div>
                  <CardTitle>My Clients</CardTitle>
                  <CardDescription className="mt-0.5">Clients assigned to you</CardDescription>
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
                  <p className="text-sm text-text-muted">No clients assigned yet</p>
                  <p className="text-xs text-text-faint mt-1">Your admin will assign clients to you</p>
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
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="pb-3">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { href: '/workouts/new', icon: Dumbbell, label: 'Create workout plan' },
                { href: '/nutrition-plans', icon: Apple, label: 'Diet Plans' },
                { href: '/health', icon: Activity, label: 'Log health metrics' },
                { href: '/calendar', icon: Activity, label: 'View calendar' },
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
