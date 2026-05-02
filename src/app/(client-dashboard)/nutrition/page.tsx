'use client'

import { useState, useMemo } from 'react'
import { Apple, Check, ChevronLeft, ChevronRight, Target, Flame, Beef, Wheat, Droplets, Leaf } from 'lucide-react'
import { useMyNutritionPlans, useClientMealSelections, useSelectMeal, useDeselectMeal } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import type { NutritionPlanMeal, MealIngredient } from '@/types/database'

function MacroBar({ label, current, target, icon: Icon, color }: {
  label: string; current: number; target: number; icon: React.ElementType; color: string
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3 w-3 ${color}`} />
          <span className="text-xs text-text-muted">{label}</span>
        </div>
        <span className="text-xs font-medium text-text-secondary">
          {Math.round(current)} / {target}{label === 'Calories' ? '' : 'g'}
        </span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ClientNutritionPage() {
  const { data: plans, isLoading: plansLoading } = useMyNutritionPlans()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const activePlan = plans?.find(p => p.is_active) ?? plans?.[0]

  const { data: selections } = useClientMealSelections(activePlan?.id, selectedDate)
  const selectMeal = useSelectMeal()
  const deselectMeal = useDeselectMeal()

  const selectedMealIds = new Set(selections?.map(s => s.meal_id) ?? [])

  // Group meals by meal_block
  const mealBlocks = useMemo(() => {
    if (!activePlan?.meals) return []
    const blockMap = new Map<string, NutritionPlanMeal[]>()
    for (const meal of activePlan.meals) {
      const block = meal.meal_block || meal.meal_type || 'Other'
      if (!blockMap.has(block)) blockMap.set(block, [])
      blockMap.get(block)!.push(meal)
    }
    return Array.from(blockMap.entries()).map(([name, meals]) => ({ name, meals }))
  }, [activePlan])

  // Calculate consumed macros from selected meals
  const consumedMacros = useMemo(() => {
    if (!activePlan?.meals) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    let calories = 0, protein = 0, carbs = 0, fat = 0
    for (const meal of activePlan.meals) {
      if (selectedMealIds.has(meal.id)) {
        calories += meal.calories ?? 0
        protein += meal.protein_g ?? 0
        carbs += meal.carbs_g ?? 0
        fat += meal.fat_g ?? 0
      }
    }
    return { calories, protein, carbs, fat, fiber: 0 }
  }, [activePlan, selectedMealIds])

  function navigateDate(delta: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  async function toggleMeal(mealId: string) {
    if (!activePlan) return
    if (selectedMealIds.has(mealId)) {
      const sel = selections?.find(s => s.meal_id === mealId)
      if (sel) await deselectMeal.mutateAsync({ id: sel.id, plan_id: activePlan.id, date: selectedDate })
    } else {
      await selectMeal.mutateAsync({ plan_id: activePlan.id, meal_id: mealId, selected_date: selectedDate })
    }
  }

  function parseIngredients(meal: NutritionPlanMeal): MealIngredient[] {
    if (!meal.ingredients) return []
    if (typeof meal.ingredients === 'string') {
      try { return JSON.parse(meal.ingredients) } catch { return [] }
    }
    return meal.ingredients as MealIngredient[]
  }

  const isToday = selectedDate === new Date().toISOString().slice(0, 10)
  const dateLabel = isToday ? 'Today' : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  if (plansLoading) {
    return <div className="p-8"><Skeleton className="h-96 w-full max-w-4xl mx-auto" /></div>
  }

  if (!activePlan) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20">
        <Apple className="h-12 w-12 text-border mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">No Nutrition Plan</h2>
        <p className="text-sm text-text-muted">Your trainer hasn&apos;t assigned a nutrition plan yet.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <PageHeader title="My Nutrition" description={activePlan.title} />

      {/* Plan Info */}
      {(activePlan.goal || activePlan.priorities?.length || activePlan.restrictions?.length) && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            <div className="flex flex-wrap gap-4">
              {activePlan.goal && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-faint">Goal</span>
                  <p className="text-sm font-medium text-text-primary">{activePlan.goal}</p>
                </div>
              )}
              {activePlan.priorities?.length ? (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-faint">Priorities</span>
                  <div className="flex gap-1 mt-0.5">
                    {activePlan.priorities.map(p => (
                      <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-indigo-600/15 text-indigo-300">{p}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {activePlan.restrictions?.length ? (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-faint">Restrictions</span>
                  <div className="flex gap-1 mt-0.5">
                    {activePlan.restrictions.map(r => (
                      <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">{r}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Picker + Macro Summary */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
          <ChevronLeft className="h-4 w-4 text-text-muted" />
        </button>
        <span className="text-sm font-semibold text-text-primary">{dateLabel}</span>
        <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
          <ChevronRight className="h-4 w-4 text-text-muted" />
        </button>
      </div>

      {/* Macro Targets */}
      <Card className="mb-6">
        <CardContent className="pt-5 space-y-3">
          <MacroBar label="Calories" current={consumedMacros.calories} target={activePlan.target_calories ?? 0} icon={Flame} color="text-orange-400" />
          <MacroBar label="Protein" current={consumedMacros.protein} target={activePlan.target_protein_g ?? 0} icon={Beef} color="text-red-400" />
          <MacroBar label="Carbs" current={consumedMacros.carbs} target={activePlan.target_carbs_g ?? 0} icon={Wheat} color="text-amber-400" />
          <MacroBar label="Fat" current={consumedMacros.fat} target={activePlan.target_fat_g ?? 0} icon={Droplets} color="text-blue-400" />
          {activePlan.target_fiber_g && (
            <MacroBar label="Fiber" current={consumedMacros.fiber} target={activePlan.target_fiber_g} icon={Leaf} color="text-green-400" />
          )}
        </CardContent>
      </Card>

      {/* Meal Blocks */}
      <div className="space-y-4">
        {mealBlocks.map(({ name, meals }) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription>Select what you ate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {meals.map(meal => {
                const isSelected = selectedMealIds.has(meal.id)
                const ingredients = parseIngredients(meal)

                return (
                  <button
                    key={meal.id}
                    onClick={() => toggleMeal(meal.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-600/10'
                        : 'border-border-subtle hover:border-border hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-border'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {meal.option_label || meal.food_name}
                        </p>
                        {meal.content && (
                          <div className="mt-1.5 p-2 rounded bg-surface-2">
                            <p className="text-xs text-text-muted whitespace-pre-wrap">{meal.content}</p>
                          </div>
                        )}
                        {/* Macro summary for this option */}
                        <div className="flex gap-3 mt-2">
                          {meal.calories && <span className="text-[10px] text-orange-400">{meal.calories} kcal</span>}
                          {meal.protein_g && <span className="text-[10px] text-red-400">{meal.protein_g}g P</span>}
                          {meal.carbs_g && <span className="text-[10px] text-amber-400">{meal.carbs_g}g C</span>}
                          {meal.fat_g && <span className="text-[10px] text-blue-400">{meal.fat_g}g F</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
