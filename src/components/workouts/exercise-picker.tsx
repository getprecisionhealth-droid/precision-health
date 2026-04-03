'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { useExercises } from '@/hooks/use-data'
import { Input } from '@/components/ui/input'

import { Skeleton } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

interface ExercisePickerProps {
  onAdd: (exercise: Exercise) => void
  excludeIds?: string[]
}

const CATEGORY_COLORS: Record<string, string> = {
  strength: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  cardio: 'bg-green-500/10 text-green-400 border-green-500/20',
  flexibility: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  balance: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  plyometrics: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  sports: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export function ExercisePicker({ onAdd, excludeIds = [] }: ExercisePickerProps) {
  const { data: exercises, isLoading } = useExercises()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const categories = ['all', 'strength', 'cardio', 'flexibility', 'balance', 'plyometrics', 'other']

  const filtered = exercises?.filter(ex => {
    const matchSearch = !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscle_groups?.some(m => m.includes(search.toLowerCase()))
    const matchCat = categoryFilter === 'all' || ex.category === categoryFilter
    const notExcluded = !excludeIds.includes(ex.id)
    return matchSearch && matchCat && notExcluded
  }) ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
        <Input
          placeholder="Search exercises or muscles…"
          className="pl-9 h-8 text-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-1 flex-wrap mb-3">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-medium border capitalize transition-colors',
              categoryFilter === cat
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                : 'bg-transparent text-text-muted border-border-subtle hover:text-text-tertiary'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[380px] pr-0.5">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-text-muted">No exercises found</p>
          </div>
        ) : (
          filtered.map(ex => (
            <div
              key={ex.id}
              className="flex items-center gap-3 rounded-md p-2.5 hover:bg-surface-2 group transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{ex.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {ex.category && (
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-medium capitalize',
                      CATEGORY_COLORS[ex.category] ?? CATEGORY_COLORS.other
                    )}>
                      {ex.category}
                    </span>
                  )}
                  {ex.muscle_groups?.slice(0, 2).map(m => (
                    <span key={m} className="text-[9px] text-text-faint capitalize">{m.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onAdd(ex)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-text-faint mt-3 text-center">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} available
      </p>
    </div>
  )
}
