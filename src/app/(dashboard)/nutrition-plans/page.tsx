'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Apple, ArrowRight, Search, Users, Trash2 } from 'lucide-react'
import { useNutritionPlans, useDeleteNutritionPlan } from '@/hooks/use-data'
import { Card, CardContent, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'

export default function NutritionPlansPage() {
  const { data: plans, isLoading } = useNutritionPlans()
  const deletePlan = useDeleteNutritionPlan()
  const [search, setSearch] = useState('')

  const filtered = plans?.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  }) ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Diet Plans"
        description={`${plans?.length ?? 0} plans created`}
        actions={
          <Button asChild size="sm">
            <Link href="/nutrition-plans/new"><Plus className="h-3.5 w-3.5" />New Plan</Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total Plans', value: plans?.length ?? 0, icon: Apple },
          { label: 'Active Plans', value: plans?.filter(p => p.is_active).length ?? 0, icon: Apple },
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

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <Input placeholder="Search plans…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
          <Apple className="h-10 w-10 text-border mx-auto mb-4" />
          <p className="text-sm font-medium text-text-tertiary">
            {search ? 'No plans match your search' : 'No diet plans yet'}
          </p>
          {!search && (
            <>
              <p className="text-xs text-text-muted mt-1 mb-4">Create your first nutrition plan</p>
              <Button asChild size="sm">
                <Link href="/nutrition-plans/new"><Plus className="h-3.5 w-3.5" />Create Plan</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plan => (
            <Card key={plan.id} className="hover:border-text-faint transition-colors group h-full">
              <CardContent className="pt-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-600/15 flex items-center justify-center flex-shrink-0">
                      <Apple className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      {plan.is_active && (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium bg-green-500/10 text-green-400 border-green-500/20">
                          Active
                        </span>
                      )}
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

                <p className="text-sm font-semibold text-text-primary leading-snug mb-1">{plan.title}</p>
                {plan.description && (
                  <p className="text-xs text-text-tertiary line-clamp-2 leading-relaxed mb-3">{plan.description}</p>
                )}

                {/* Macro summary */}
                {(plan.target_calories || plan.target_protein_g || plan.target_carbs_g) && (
                  <div className="flex gap-3 text-[10px] text-text-muted mb-3">
                    {plan.target_calories && <span className="text-amber-400 font-medium">{plan.target_calories} kcal</span>}
                    {plan.target_protein_g && <span>P: {plan.target_protein_g}g</span>}
                    {plan.target_carbs_g && <span>C: {plan.target_carbs_g}g</span>}
                    {plan.target_fat_g && <span>F: {plan.target_fat_g}g</span>}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-border-subtle flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {plan.client && (
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Users className="h-3 w-3" />
                        {(plan.client as { full_name: string }).full_name}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-text-faint group-hover:text-emerald-400 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
