'use client'

import { useState } from 'react'
import { Search, Plus, Dumbbell, Filter, Library } from 'lucide-react'
import { useExercises } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, FormField, Label } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { KEYS } from '@/hooks/use-data'

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'balance', 'plyometrics', 'sports', 'other'] as const
const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body']

function CreateExerciseDialog() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'strength',
    muscle_groups: [] as string[], equipment: '',
    instructions: '', rpe_default: ''
  })

  function toggleMuscle(m: string) {
    setForm(f => ({
      ...f,
      muscle_groups: f.muscle_groups.includes(m)
        ? f.muscle_groups.filter(x => x !== m)
        : [...f.muscle_groups, m]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('exercises').insert({
      name: form.name,
      description: form.description || null,
      category: form.category,
      muscle_groups: form.muscle_groups.length ? form.muscle_groups : null,
      equipment: form.equipment ? [form.equipment] : null,
      instructions: form.instructions || null,
      created_by: user.id,
      is_global: false,
    })

    setSaving(false)
    if (!error) {
      qc.invalidateQueries({ queryKey: KEYS.exercises })
      setIsOpen(false)
      setForm({ name: '', description: '', category: 'strength', muscle_groups: [], equipment: '', instructions: '', rpe_default: '' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5" />Create Exercise</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Custom Exercise</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Exercise Name">
            <Input required placeholder="e.g. Barbell Back Squat" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>

          <FormField label="Description">
            <Input placeholder="Brief description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select
                className="w-full h-10 px-3 py-2 bg-surface text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </FormField>
            <FormField label="Equipment">
              <Input placeholder="e.g. Barbell" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
            </FormField>
          </div>

          <div>
            <Label className="mb-2 block text-xs">Muscle Groups</Label>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMuscle(m)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.muscle_groups.includes(m)
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-surface-2 border-border-subtle text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <FormField label="Instructions">
            <textarea
              className="w-full min-h-[80px] px-3 py-2 bg-surface text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Step-by-step instructions…"
              value={form.instructions}
              onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            />
          </FormField>

          <Button type="submit" className="w-full" loading={saving}>
            {!saving ? 'Save Exercise' : 'Saving…'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ExerciseLibraryPage() {
  const { data: exercises, isLoading } = useExercises()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const filtered = exercises?.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || e.category === filterCategory
    return matchSearch && matchCategory
  }) ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Exercise Library"
        description="Browse and create custom exercises"
        actions={<CreateExerciseDialog />}
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            className="pl-9"
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 px-3 bg-surface text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Library className="h-10 w-10 text-border mx-auto mb-3" />
            <p className="text-sm text-text-muted">No exercises found</p>
            <p className="text-xs text-text-faint mt-1">Try adjusting your search or create a custom exercise</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <Card key={ex.id} className="hover:border-border transition-colors">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-600/15 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{ex.name}</p>
                    {ex.category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-text-muted capitalize mt-1">
                        {ex.category}
                      </span>
                    )}
                    {ex.description && (
                      <p className="text-xs text-text-muted mt-2 line-clamp-2">{ex.description}</p>
                    )}
                    {ex.muscle_groups?.length ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ex.muscle_groups.slice(0, 3).map(m => (
                          <span key={m} className="text-[10px] text-text-faint bg-surface-2 px-1.5 py-0.5 rounded">{m}</span>
                        ))}
                        {ex.muscle_groups.length > 3 && (
                          <span className="text-[10px] text-text-faint">+{ex.muscle_groups.length - 3}</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
