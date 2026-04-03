'use client'

import { useState } from 'react'
import { Plus, Trash2, Apple, Coffee, Sun, Moon, Cookie } from 'lucide-react'
import { useProfile, useNutritionLogs, useLogNutrition, useDeleteNutritionLog } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, FormField, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'

const MEAL_ICONS: Record<string, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
}

const MEAL_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-500/15 text-amber-400',
  lunch: 'bg-sky-500/15 text-sky-400',
  dinner: 'bg-violet-500/15 text-violet-400',
  snack: 'bg-rose-500/15 text-rose-400',
}

export default function NutritionPage() {
  const { data: profile } = useProfile()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const { data: logs, isLoading } = useNutritionLogs(profile?.id ?? '', selectedDate)
  const logNutrition = useLogNutrition()
  const deleteLog = useDeleteNutritionLog()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    meal_type: 'breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id || !form.food_name) return
    await logNutrition.mutateAsync({
      client_id: profile.id,
      log_date: selectedDate,
      meal_type: form.meal_type,
      food_name: form.food_name,
      calories: form.calories ? Number(form.calories) : undefined,
      protein_g: form.protein_g ? Number(form.protein_g) : undefined,
      carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
      fat_g: form.fat_g ? Number(form.fat_g) : undefined,
      notes: form.notes || undefined,
    })
    setForm({ meal_type: 'breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' })
    setDialogOpen(false)
  }

  const grouped = (logs ?? []).reduce<Record<string, typeof logs>>((acc, log) => {
    const key = log.meal_type
    if (!acc[key]) acc[key] = []
    acc[key]!.push(log)
    return acc
  }, {})

  const totalCals = (logs ?? []).reduce((s, l) => s + (l.calories ?? 0), 0)
  const totalProtein = (logs ?? []).reduce((s, l) => s + (Number(l.protein_g) ?? 0), 0)
  const totalCarbs = (logs ?? []).reduce((s, l) => s + (Number(l.carbs_g) ?? 0), 0)
  const totalFat = (logs ?? []).reduce((s, l) => s + (Number(l.fat_g) ?? 0), 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Nutrition Log"
        description="Track your daily meals and macros"
        actions={
          <div className="flex items-center gap-3">
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-3.5 w-3.5" />Log Meal</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[440px]">
                <DialogHeader>
                  <DialogTitle>Log a Meal</DialogTitle>
                  <DialogDescription>Add what you ate to your daily log.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormField label="Meal Type">
                    <Select value={form.meal_type} onChange={(e) => setForm(f => ({ ...f, meal_type: e.target.value }))}>
                      <option value="breakfast">🌅 Breakfast</option>
                      <option value="lunch">☀️ Lunch</option>
                      <option value="dinner">🌙 Dinner</option>
                      <option value="snack">🍪 Snack</option>
                    </Select>
                  </FormField>
                  <FormField label="Food Name *">
                    <Input placeholder="e.g. Grilled chicken salad" value={form.food_name} onChange={(e) => setForm(f => ({ ...f, food_name: e.target.value }))} required />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Calories">
                      <Input type="number" placeholder="420" value={form.calories} onChange={(e) => setForm(f => ({ ...f, calories: e.target.value }))} />
                    </FormField>
                    <FormField label="Protein (g)">
                      <Input type="number" placeholder="32" value={form.protein_g} onChange={(e) => setForm(f => ({ ...f, protein_g: e.target.value }))} />
                    </FormField>
                    <FormField label="Carbs (g)">
                      <Input type="number" placeholder="45" value={form.carbs_g} onChange={(e) => setForm(f => ({ ...f, carbs_g: e.target.value }))} />
                    </FormField>
                    <FormField label="Fat (g)">
                      <Input type="number" placeholder="18" value={form.fat_g} onChange={(e) => setForm(f => ({ ...f, fat_g: e.target.value }))} />
                    </FormField>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" loading={logNutrition.isPending}>Add Meal</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Daily Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Calories', value: totalCals, unit: 'kcal', color: 'text-amber-400' },
          { label: 'Protein', value: Math.round(totalProtein), unit: 'g', color: 'text-sky-400' },
          { label: 'Carbs', value: Math.round(totalCarbs), unit: 'g', color: 'text-emerald-400' },
          { label: 'Fat', value: Math.round(totalFat), unit: 'g', color: 'text-rose-400' },
        ].map(({ label, value, unit, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}<span className="text-xs text-text-faint ml-1">{unit}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meal Groups */}
      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Apple className="h-10 w-10 text-border mx-auto mb-3" />
            <p className="text-text-muted">No meals logged for {selectedDate}</p>
            <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" />Log your first meal</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {['breakfast', 'lunch', 'dinner', 'snack'].filter(mt => grouped[mt]).map(mealType => {
            const MealIcon = MEAL_ICONS[mealType] ?? Apple
            const colorClass = MEAL_COLORS[mealType] ?? 'bg-surface-2 text-text-muted'
            return (
              <Card key={mealType}>
                <CardHeader>
                  <div className="flex items-center gap-2 pb-2">
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${colorClass}`}>
                      <MealIcon className="h-3.5 w-3.5" />
                    </div>
                    <CardTitle className="capitalize text-base">{mealType}</CardTitle>
                    <span className="text-xs text-text-faint ml-auto">
                      {grouped[mealType]!.reduce((s, l) => s + (l.calories ?? 0), 0)} kcal
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-border-subtle">
                    {grouped[mealType]!.map(log => (
                      <div key={log.id} className="flex items-center gap-3 py-2.5 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{log.food_name}</p>
                          <p className="text-xs text-text-muted">
                            {[
                              log.calories && `${log.calories} kcal`,
                              log.protein_g && `${log.protein_g}g protein`,
                              log.carbs_g && `${log.carbs_g}g carbs`,
                              log.fat_g && `${log.fat_g}g fat`,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteLog.mutate({ id: log.id, client_id: log.client_id })}
                          className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-red-400 transition-all p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
