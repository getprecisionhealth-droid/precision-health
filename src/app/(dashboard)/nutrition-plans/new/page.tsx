'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Apple, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useClients, useCreateNutritionPlan, useAddNutritionPlanMeal } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, FormField } from '@/components/ui/input'

const GOALS = ['Acclimatization', 'Fat Loss', 'Muscle Gain', 'Maintenance', 'Performance', 'Recomposition']
const PRIORITY_OPTIONS = ['Protein', 'Healthy Fats', 'Fiber', 'Complex Carbs', 'Hydration', 'Micronutrients', 'Meal Timing']

type IngredientInput = { id: string; name: string; portion: string; calories: string; protein_g: string; carbs_g: string; fat_g: string }
type OptionInput = { id: string; label: string; ingredients: IngredientInput[] }
type MealBlockInput = { id: string; name: string; options: OptionInput[]; collapsed: boolean }

function emptyIngredient(): IngredientInput {
  return { id: crypto.randomUUID(), name: '', portion: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' }
}

function emptyOption(): OptionInput {
  return { id: crypto.randomUUID(), label: '', ingredients: [emptyIngredient()] }
}

function emptyBlock(name = ''): MealBlockInput {
  return { id: crypto.randomUUID(), name, options: [emptyOption()], collapsed: false }
}

export default function NewNutritionPlanPage() {
  const router = useRouter()
  const { data: clients, isLoading } = useClients()
  const createPlan = useCreateNutritionPlan()
  const addMeal = useAddNutritionPlanMeal()

  // Global plan settings
  const [form, setForm] = useState({
    client_id: '', title: '', description: '', goal: '',
    priorities: [] as string[], restrictions: [] as string[],
    target_calories: '', calories_maintenance: '',
    target_protein_g: '', target_carbs_g: '', target_fat_g: '', target_fiber_g: '',
  })
  const [restrictionInput, setRestrictionInput] = useState('')

  // Meal blocks
  const [blocks, setBlocks] = useState<MealBlockInput[]>([
    emptyBlock('Pre-Workout'),
    emptyBlock('Breakfast'),
    emptyBlock('Lunch'),
    emptyBlock('Dinner'),
  ])

  const activeClients = clients?.filter(c => c.status === 'active') ?? []

  function togglePriority(p: string) {
    setForm(f => ({
      ...f,
      priorities: f.priorities.includes(p) ? f.priorities.filter(x => x !== p) : [...f.priorities, p]
    }))
  }

  function addRestriction() {
    if (!restrictionInput.trim()) return
    setForm(f => ({ ...f, restrictions: [...f.restrictions, restrictionInput.trim()] }))
    setRestrictionInput('')
  }

  function removeRestriction(r: string) {
    setForm(f => ({ ...f, restrictions: f.restrictions.filter(x => x !== r) }))
  }

  function updateBlock(blockId: string, updates: Partial<MealBlockInput>) {
    setBlocks(bs => bs.map(b => b.id === blockId ? { ...b, ...updates } : b))
  }

  function addBlock() {
    setBlocks([...blocks, emptyBlock('Snack')])
  }

  function removeBlock(blockId: string) {
    setBlocks(bs => bs.filter(b => b.id !== blockId))
  }

  function addOption(blockId: string) {
    setBlocks(bs => bs.map(b =>
      b.id === blockId ? { ...b, options: [...b.options, emptyOption()] } : b
    ))
  }

  function removeOption(blockId: string, optionId: string) {
    setBlocks(bs => bs.map(b =>
      b.id === blockId ? { ...b, options: b.options.filter(o => o.id !== optionId) } : b
    ))
  }

  function updateOption(blockId: string, optionId: string, field: string, value: string) {
    setBlocks(bs => bs.map(b =>
      b.id === blockId ? {
        ...b,
        options: b.options.map(o => o.id === optionId ? { ...o, [field]: value } : o)
      } : b
    ))
  }

  function addIngredient(blockId: string, optionId: string) {
    setBlocks(bs => bs.map(b =>
      b.id === blockId ? {
        ...b,
        options: b.options.map(o =>
          o.id === optionId ? { ...o, ingredients: [...o.ingredients, emptyIngredient()] } : o
        )
      } : b
    ))
  }

  function removeIngredient(blockId: string, optionId: string, ingredientId: string) {
    setBlocks(bs => bs.map(b =>
      b.id === blockId ? {
        ...b,
        options: b.options.map(o =>
          o.id === optionId ? { ...o, ingredients: o.ingredients.filter(i => i.id !== ingredientId) } : o
        )
      } : b
    ))
  }

  function updateIngredient(blockId: string, optionId: string, ingredientId: string, field: string, value: string) {
    setBlocks(bs => bs.map(b =>
      b.id === blockId ? {
        ...b,
        options: b.options.map(o =>
          o.id === optionId ? {
            ...o,
            ingredients: o.ingredients.map(i => i.id === ingredientId ? { ...i, [field]: value } : i)
          } : o
        )
      } : b
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id || !form.title) return

    const plan = await createPlan.mutateAsync({
      client_id: form.client_id,
      title: form.title,
      description: form.description || undefined,
      goal: form.goal || undefined,
      priorities: form.priorities.length ? form.priorities : undefined,
      restrictions: form.restrictions.length ? form.restrictions : undefined,
      target_calories: form.target_calories ? Number(form.target_calories) : undefined,
      calories_maintenance: form.calories_maintenance ? Number(form.calories_maintenance) : undefined,
      target_protein_g: form.target_protein_g ? Number(form.target_protein_g) : undefined,
      target_carbs_g: form.target_carbs_g ? Number(form.target_carbs_g) : undefined,
      target_fat_g: form.target_fat_g ? Number(form.target_fat_g) : undefined,
      target_fiber_g: form.target_fiber_g ? Number(form.target_fiber_g) : undefined,
    } as any)

    // Add meal block options
    let sortOrder = 0
    for (const block of blocks) {
      for (const option of block.options) {
        if (!option.label && option.ingredients.length === 0) continue
        const ingredients = option.ingredients
          .filter(i => i.name)
          .map(i => ({
            name: i.name,
            portion: i.portion || null,
            calories: i.calories ? Number(i.calories) : null,
            protein_g: i.protein_g ? Number(i.protein_g) : null,
            carbs_g: i.carbs_g ? Number(i.carbs_g) : null,
            fat_g: i.fat_g ? Number(i.fat_g) : null,
          }))

        // Calculate total macros for option
        const totalCals = ingredients.reduce((s, i) => s + (i.calories ?? 0), 0)
        const totalProt = ingredients.reduce((s, i) => s + (i.protein_g ?? 0), 0)
        const totalCarbs = ingredients.reduce((s, i) => s + (i.carbs_g ?? 0), 0)
        const totalFat = ingredients.reduce((s, i) => s + (i.fat_g ?? 0), 0)

        await addMeal.mutateAsync({
          plan_id: plan.id,
          meal_type: 'breakfast', // backwards compat
          meal_block: block.name,
          option_label: option.label || `${block.name} Option`,
          food_name: option.label || `${block.name} Option`,
          ingredients: JSON.stringify(ingredients),
          calories: totalCals || undefined,
          protein_g: totalProt || undefined,
          carbs_g: totalCarbs || undefined,
          fat_g: totalFat || undefined,
          sort_order: sortOrder++,
        } as any)
      }
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
        <h1 className="text-2xl font-bold text-text-primary">Nutrition Plan Builder</h1>
        <p className="text-sm text-text-tertiary">Create a structured, trackable diet plan for your client</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Plan Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Assign to Client">
                <select required className="w-full h-10 px-3 py-2 bg-surface text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Select a client…</option>
                  {activeClients.map(tc => (
                    <option key={tc.client_id} value={tc.client_id}>{tc.client!.full_name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Plan Title">
                <Input required placeholder="e.g. Lean Gain Phase 1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Description (Optional)">
              <Input placeholder="General instructions for this diet" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </FormField>
          </CardContent>
        </Card>

        {/* Global Plan Settings */}
        <Card>
          <CardHeader><CardTitle>Global Plan Settings</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <FormField label="Goal">
              <select className="w-full h-10 px-3 py-2 bg-surface text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
                <option value="">Select goal…</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>

            <div>
              <Label className="mb-2 block text-xs">Priorities</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p} type="button" onClick={() => togglePriority(p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.priorities.includes(p)
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-surface-2 border-border-subtle text-text-muted hover:text-text-secondary'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-xs">Restrictions</Label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="e.g. No fried food" value={restrictionInput}
                  onChange={e => setRestrictionInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRestriction() } }} />
                <Button type="button" size="sm" variant="outline" onClick={addRestriction}>Add</Button>
              </div>
              {form.restrictions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.restrictions.map(r => (
                    <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                      {r}
                      <button type="button" onClick={() => removeRestriction(r)} className="hover:text-red-300">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Macro Targets */}
        <Card>
          <CardHeader><CardTitle>Macro Targets</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <FormField label="Calories (Maintenance)">
                <Input type="number" placeholder="2500" value={form.calories_maintenance} onChange={e => setForm(f => ({ ...f, calories_maintenance: e.target.value }))} />
              </FormField>
              <FormField label="Calories (Goal)">
                <Input type="number" placeholder="2200" value={form.target_calories} onChange={e => setForm(f => ({ ...f, target_calories: e.target.value }))} />
              </FormField>
              <FormField label="Protein (g)">
                <Input type="number" placeholder="180" value={form.target_protein_g} onChange={e => setForm(f => ({ ...f, target_protein_g: e.target.value }))} />
              </FormField>
              <FormField label="Fats (g)">
                <Input type="number" placeholder="80" value={form.target_fat_g} onChange={e => setForm(f => ({ ...f, target_fat_g: e.target.value }))} />
              </FormField>
              <FormField label="Carbs (g)">
                <Input type="number" placeholder="250" value={form.target_carbs_g} onChange={e => setForm(f => ({ ...f, target_carbs_g: e.target.value }))} />
              </FormField>
              <FormField label="Fiber (g)">
                <Input type="number" placeholder="30" value={form.target_fiber_g} onChange={e => setForm(f => ({ ...f, target_fiber_g: e.target.value }))} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Meal Block Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Meal Blocks</h3>
              <p className="text-xs text-text-muted">Build meal options within each time block</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addBlock}>
              <Plus className="h-4 w-4" /> Add Block
            </Button>
          </div>

          {blocks.map((block, blockIdx) => (
            <Card key={block.id}>
              <CardHeader className="cursor-pointer" onClick={() => updateBlock(block.id, { collapsed: !block.collapsed })}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-indigo-600/15 rounded-lg flex items-center justify-center">
                      <Apple className="h-4 w-4 text-indigo-400" />
                    </div>
                    <Input
                      className="font-semibold text-sm border-none bg-transparent p-0 h-auto focus:ring-0 max-w-[200px]"
                      value={block.name}
                      onChange={e => { e.stopPropagation(); updateBlock(block.id, { name: e.target.value }) }}
                      onClick={e => e.stopPropagation()}
                      placeholder="Block name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-faint">{block.options.length} option{block.options.length !== 1 ? 's' : ''}</span>
                    {block.collapsed ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronUp className="h-4 w-4 text-text-muted" />}
                    {blocks.length > 1 && (
                      <button type="button" onClick={e => { e.stopPropagation(); removeBlock(block.id) }} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {!block.collapsed && (
                <CardContent className="space-y-4 pt-0">
                  {block.options.map((option, optIdx) => (
                    <div key={option.id} className="p-4 border border-border-subtle rounded-xl bg-surface-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-faint uppercase tracking-wide">Option {optIdx + 1}</span>
                        </div>
                        {block.options.length > 1 && (
                          <button type="button" onClick={() => removeOption(block.id, option.id)} className="text-red-400 hover:text-red-300 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <FormField label="Option Label">
                        <Input placeholder="e.g. Chicken Sandwich" value={option.label}
                          onChange={e => updateOption(block.id, option.id, 'label', e.target.value)} />
                      </FormField>

                      {/* Ingredients */}
                      <div className="space-y-2">
                        <Label className="text-xs mb-1">Ingredients</Label>
                        {option.ingredients.map((ing) => (
                          <div key={ing.id} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-3">
                              <Input className="h-8 text-xs" placeholder="Name" value={ing.name}
                                onChange={e => updateIngredient(block.id, option.id, ing.id, 'name', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                              <Input className="h-8 text-xs" placeholder="Portion" value={ing.portion}
                                onChange={e => updateIngredient(block.id, option.id, ing.id, 'portion', e.target.value)} />
                            </div>
                            <div className="col-span-1">
                              <Input type="number" className="h-8 text-xs" placeholder="kcal" value={ing.calories}
                                onChange={e => updateIngredient(block.id, option.id, ing.id, 'calories', e.target.value)} />
                            </div>
                            <div className="col-span-1">
                              <Input type="number" className="h-8 text-xs" placeholder="P" value={ing.protein_g}
                                onChange={e => updateIngredient(block.id, option.id, ing.id, 'protein_g', e.target.value)} />
                            </div>
                            <div className="col-span-1">
                              <Input type="number" className="h-8 text-xs" placeholder="C" value={ing.carbs_g}
                                onChange={e => updateIngredient(block.id, option.id, ing.id, 'carbs_g', e.target.value)} />
                            </div>
                            <div className="col-span-1">
                              <Input type="number" className="h-8 text-xs" placeholder="F" value={ing.fat_g}
                                onChange={e => updateIngredient(block.id, option.id, ing.id, 'fat_g', e.target.value)} />
                            </div>
                            <div className="col-span-3 flex gap-1 justify-end">
                              <button type="button" onClick={() => addIngredient(block.id, option.id)}
                                className="h-8 w-8 flex items-center justify-center text-indigo-400 hover:bg-indigo-600/10 rounded transition-colors">
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              {option.ingredients.length > 1 && (
                                <button type="button" onClick={() => removeIngredient(block.id, option.id, ing.id)}
                                  className="h-8 w-8 flex items-center justify-center text-red-400 hover:bg-red-600/10 rounded transition-colors">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button type="button" size="sm" variant="ghost" className="w-full text-xs gap-1.5" onClick={() => addOption(block.id)}>
                    <Plus className="h-3.5 w-3.5" /> Add Option to {block.name}
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" loading={createPlan.isPending || addMeal.isPending}>
            Save Nutrition Plan
          </Button>
        </div>
      </form>
    </div>
  )
}
