'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Target, Users, TrendingUp } from 'lucide-react'
import { useClients, useGoals } from '@/hooks/use-data'
import { Card, CardContent, UserAvatar, Skeleton, Progress } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { AddGoalDialog } from '@/components/goals/add-goal-dialog'
import { Button } from '@/components/ui/button'
import { STATUS_COLORS, formatDate, getGoalProgress } from '@/lib/utils'
import type { TrainerClient } from '@/types/database'

const CATEGORY_ICONS: Record<string, string> = {
  weight_loss: '⚖️', muscle_gain: '💪', endurance: '🏃', flexibility: '🤸',
  nutrition: '🥗', lifestyle: '🌱', custom: '🎯'
}

function ClientGoalsSection({ tc }: { tc: TrainerClient }) {
  const { data: goals, isLoading } = useGoals(tc.client_id)
  const activeGoals = goals?.filter(g => g.status === 'active') ?? []
  const client = tc.client

  if (!client) return null
  if (!isLoading && activeGoals.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserAvatar name={client.full_name} size="sm" />
          <Link href={`/clients/${tc.client_id}`} className="text-sm font-semibold text-[#fafafa] hover:text-indigo-300 transition-colors">
            {client.full_name}
          </Link>
          {!isLoading && (
            <span className="text-[10px] text-[#52525b]">{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <AddGoalDialog clientId={tc.client_id} trigger={
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">+ Goal</Button>
        } />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {activeGoals.map(goal => {
            const pct = getGoalProgress(goal.baseline_value, goal.current_value, goal.target_value)
            return (
              <Card key={goal.id} className="hover:border-[#3f3f46] transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-base">{CATEGORY_ICONS[goal.category ?? 'custom']}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#fafafa] leading-snug">{goal.title}</p>
                      {goal.timeframe && (
                        <p className="text-[10px] text-[#52525b] capitalize mt-0.5">{goal.timeframe}-term</p>
                      )}
                    </div>
                  </div>
                  {goal.target_value !== null && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[#52525b]">
                          {goal.current_value ?? goal.baseline_value ?? 0} → {goal.target_value} {goal.target_unit}
                        </span>
                        <span className="text-indigo-400 font-bold">{pct}%</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  )}
                  {goal.target_date && (
                    <p className="text-[10px] text-[#3f3f46] mt-2">Due {formatDate(goal.target_date)}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function GoalsPage() {
  const { data: clients, isLoading: clientsLoading } = useClients()
  const activeClients = clients?.filter(c => c.status === 'active') ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Goals"
        description="Track client progress toward their targets"
      />

      {clientsLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-24 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      ) : activeClients.length === 0 ? (
        <div className="text-center py-20">
          <Target className="h-10 w-10 text-[#27272a] mx-auto mb-4" />
          <p className="text-sm text-[#71717a]">No active clients to set goals for</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/clients">Go to Clients</Link>
          </Button>
        </div>
      ) : (
        <div>
          {activeClients.map(tc => (
            <ClientGoalsSection key={tc.id} tc={tc as TrainerClient} />
          ))}
        </div>
      )}
    </div>
  )
}
