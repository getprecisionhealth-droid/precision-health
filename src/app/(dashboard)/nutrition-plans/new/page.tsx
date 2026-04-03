'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Apple, Trash2 } from 'lucide-react'
import { useClients, useCreateNutritionPlan, useAddNutritionPlanMeal } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, FormField } from '@/components/ui/input'

type MealInput = { id: string, meal_type: string, food_name: string, portion: string, calories: string, protein_g: string, carbs_g: string, fat_g: string }

export default function NewNutritionPlanPage() {
  const router = useRouter()
  const { data: clients, isLoading } = useClients()
  const createPlan = useCreateNutritionPlan()
  const addMeal = useAddNutritionPlanMeal()

  const [form, setForm] = useState({ client_id: '', title: '', description: '', target_calories: '', target_protein_g: '', target_carbs_g: '', target_fat_g: '' })
  const [meals, setMeals] = useState<MealInput[]>([])

  const activeClients = clients?.filter(c => c.status === 'active') ?? []

  function handleAddMeal() {
    setMeals([...meals, { id: crypto.randomUUID(), meal_type: 'breakfast', food_name: '', portion: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' }])
  }

  function handleRemoveMeal(id: string) {
    setMeals(meals.filter(m => m.id !== id))
  }

  function updateMeal(id: string, field: keyof MealInput, value: string) {
    setMeals(meals.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id || !form.title) return

    const plan = await createPlan.mutateAsync({
      client_id: form.client_id,
      title: form.title,
      description: form.description || undefined,
      target_calories: form.target_calories ? Number(form.target_calories) : undefined,
      target_protein_g: form.target_protein_g ? Number(form.target_protein_g) : undefined,
      target_carbs_g: form.target_carbs_g ? Number(form.target_carbs_g) : undefined,
      target_fat_g: form.target_fat_g ? Number(form.target_fat_g) : undefined,
    } as any)

    // Add meals
    for (const meal of meals) {
      if (!meal.food_name) continue
      await addMeal.mutateAsync({
        plan_id: plan.id,
        meal_type: meal.meal_type,
        food_name: meal.food_name,
        portion: meal.portion || undefined,
        calories: meal.calories ? Number(meal.calories) : undefined,
        protein_g: meal.protein_g ? Number(meal.protein_g) : undefined,
        carbs_g: meal.carbs_g ? Number(meal.carbs_g) : undefined,
        fat_g: meal.fat_g ? Number(meal.fat_g) : undefined,
      } as any)
    }

    router.push(`/clients/${form.client_id}`)
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full max-w-4xl mx-auto" /></div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary mb-6 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Create Diet Plan</h1>
        <p className="text-sm text-text-tertiary">Assign a custom diet plan and macros to a client</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Plan Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Assign to Client">
              <select
                required
                className="w-full h-10 px-3 py-2 bg-surface text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.client_id}
                onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
              >
                <option value="">Select a client...</option>
                {activeClients.map(tc => (
                  <option key={tc.client_id} value={tc.client_id}>{tc.client!.full_name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Plan Title">
              <Input required placeholder="Hypertrophy Macros" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </FormField>
            
            <FormField label="Description (Optional)">
              <Input placeholder="General instructions for this diet" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </FormField>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <FormField label="Target Calories"><Input type="number" placeholder="2500" value={form.target_calories} onChange={e => setForm(f => ({ ...f, target_calories: e.target.value }))} /></FormField>
              <FormField label="Target Protein (g)"><Input type="number" placeholder="180" value={form.target_protein_g} onChange={e => setForm(f => ({ ...f, target_protein_g: e.target.value }))} /></FormField>
              <FormField label="Target Carbs (g)"><Input type="number" placeholder="250" value={form.target_carbs_g} onChange={e => setForm(f => ({ ...f, target_carbs_g: e.target.value }))} /></FormField>
              <FormField label="Target Fat (g)"><Input type="number" placeholder="80" value={form.target_fat_g} onChange={e => setForm(f => ({ ...f, target_fat_g: e.target.value }))} /></FormField>
            </div>
          </CardContent>
        </Card>

        {/* Meals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meals</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={handleAddMeal}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Meal
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {meals.length === 0 && (
              <div className="text-center py-8 text-text-muted border border-dashed border-border-subtle rounded-xl">
                <Apple className="h-8 w-8 mx-auto mb-2 text-border" />
                <p className="text-sm">No meals added to plan.</p>
              </div>
            )}
            {meals.map((meal, idx) => (
              <div key={meal.id} className="p-4 border border-border-subtle rounded-xl bg-surface-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-text-secondary">Meal {idx + 1}</h4>
                  <button type="button" onClick={() => handleRemoveMeal(meal.id)} className="text-red-400 hover:text-red-300 transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3">
                    <Label className="mb-1.5 block text-xs">Meal Type</Label>
                    <select
                      className="w-full h-9 px-2 bg-surface text-sm border border-border rounded-md"
                      value={meal.meal_type}
                      onChange={e => updateMeal(meal.id, 'meal_type', e.target.value)}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div className="col-span-5">
                    <Label className="mb-1.5 block text-xs">Food Name</Label>
                    <Input required className="h-9" placeholder="Chicken breast" value={meal.food_name} onChange={e => updateMeal(meal.id, 'food_name', e.target.value)} />
                  </div>
                  <div className="col-span-4">
                    <Label className="mb-1.5 block text-xs">Portion</Label>
                    <Input className="h-9" placeholder="200g" value={meal.portion} onChange={e => updateMeal(meal.id, 'portion', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="mb-1.5 block text-xs text-text-faint">Calories</Label>
                    <Input type="number" className="h-9" placeholder="kcal" value={meal.calories} onChange={e => updateMeal(meal.id, 'calories', e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-text-faint">Protein (g)</Label>
                    <Input type="number" className="h-9" placeholder="g" value={meal.protein_g} onChange={e => updateMeal(meal.id, 'protein_g', e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-text-faint">Carbs (g)</Label>
                    <Input type="number" className="h-9" placeholder="g" value={meal.carbs_g} onChange={e => updateMeal(meal.id, 'carbs_g', e.target.value)} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-text-faint">Fat (g)</Label>
                    <Input type="number" className="h-9" placeholder="g" value={meal.fat_g} onChange={e => updateMeal(meal.id, 'fat_g', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" loading={createPlan.isPending || addMeal.isPending}>
            Save Diet Plan
          </Button>
        </div>
      </form>
    </div>
  )
}
