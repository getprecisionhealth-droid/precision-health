'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Dumbbell, ArrowRight, Search, Users, Clock, Trash2 } from 'lucide-react'
import { useWorkoutPlans, useDeleteWorkoutPlan } from '@/hooks/use-data'
import { Card, CardContent, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'


const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function WorkoutsPage() {
  const { data: plans, isLoading } = useWorkoutPlans()
  const deletePlan = useDeleteWorkoutPlan()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'template' | 'assigned'>('all')

  const filtered = plans?.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.plan_type === filter
    return matchSearch && matchFilter
  }) ?? []

  const templates = plans?.filter(p => p.plan_type === 'template') ?? []
  const assigned = plans?.filter(p => p.plan_type === 'assigned') ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Workout Plans"
        description={`${plans?.length ?? 0} plans created`}
        actions={
          <Button asChild size="sm">
            <Link href="/workouts/new"><Plus className="h-3.5 w-3.5" />New Plan</Link>
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Plans', value: plans?.length ?? 0, icon: Dumbbell },
          { label: 'Templates', value: templates.length, icon: Dumbbell },
          { label: 'Assigned', value: assigned.length, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold text-text-primary mt-0.5">{value}</p>
                </div>
                <Icon className="h-5 w-5 text-border" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <Input placeholder="Search plans…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 p-1 bg-surface border border-border rounded-lg">
          {(['all', 'template', 'assigned'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-surface-2 text-text-primary border border-border'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-28 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Dumbbell className="h-10 w-10 text-border mx-auto mb-4" />
          <p className="text-sm font-medium text-text-tertiary">
            {search ? 'No plans match your search' : 'No workout plans yet'}
          </p>
          {!search && (
            <>
              <p className="text-xs text-text-muted mt-1 mb-4">Create your first plan or template</p>
              <Button asChild size="sm">
                <Link href="/workouts/new"><Plus className="h-3.5 w-3.5" />Create Plan</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plan => (
            <Link key={plan.id} href={`/workouts/${plan.id}`}>
              <Card className="hover:border-text-faint transition-colors cursor-pointer group h-full">
                <CardContent className="pt-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-600/15 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        {plan.difficulty && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${DIFFICULTY_COLORS[plan.difficulty]}`}>
                            {plan.difficulty}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium bg-surface-2 text-text-tertiary border-border capitalize">
                          {plan.plan_type}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      disabled={deletePlan.isPending}
                      onClick={(e) => {
                        e.preventDefault()
                        if (confirm('Are you sure you want to delete this plan?')) {
                          deletePlan.mutate(plan.id)
                        }
                      }}
                      className="text-text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-text-primary leading-snug mb-1">{plan.name}</p>
                  {plan.description && (
                    <p className="text-xs text-text-tertiary line-clamp-2 leading-relaxed mb-3">{plan.description}</p>
                  )}

                  <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {plan.duration_weeks && (
                        <span className="flex items-center gap-1 text-[10px] text-text-muted">
                          <Clock className="h-3 w-3" />{plan.duration_weeks}w
                        </span>
                      )}
                      {plan.client && (
                        <span className="flex items-center gap-1 text-[10px] text-text-muted">
                          <Users className="h-3 w-3" />
                          {(plan.client as { full_name: string }).full_name}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-text-faint group-hover:text-indigo-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
