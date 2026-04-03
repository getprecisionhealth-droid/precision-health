'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile, TrainerClient, HealthMetric, WorkoutPlan, Goal, Exercise, NutritionLog, NutritionPlan } from '@/types/database'

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const KEYS = {
  profile: ['profile'] as const,
  clients: ['clients'] as const,
  client: (id: string) => ['client', id] as const,
  healthMetrics: (clientId: string) => ['health-metrics', clientId] as const,
  workoutPlans: ['workout-plans'] as const,
  workoutPlan: (id: string) => ['workout-plan', id] as const,
  nutritionPlans: ['nutrition-plans'] as const,
  nutritionPlan: (id: string) => ['nutrition-plan', id] as const,
  exercises: ['exercises'] as const,
  goals: (clientId: string) => ['goals', clientId] as const,
  dashboardStats: ['dashboard-stats'] as const,
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export function useProfile() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.profile,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (error) throw error
      return data as Profile
    },
  })
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export function useClients() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.clients,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('trainer_clients')
        .select(`*, client:profiles!trainer_clients_client_id_fkey(*)`)
        .eq('trainer_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as TrainerClient[]
    },
  })
}

export function useClient(clientId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.client(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainer_clients')
        .select(`*, client:profiles!trainer_clients_client_id_fkey(*)`)
        .eq('client_id', clientId)
        .single()
      if (error) throw error
      return data as TrainerClient
    },
    enabled: !!clientId,
  })
}

export function useAddClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      full_name: string; email: string; phone?: string;
      date_of_birth?: string; gender?: string; height_cm?: number; goal_summary?: string
    }) => {
      // Use secure server action (bypasses RLS with service role key)
      const { addClientAction } = await import('@/app/actions/client-actions')
      const result = await addClientAction(input)
      if (result.error) throw new Error(result.error)
      return result.clientId!
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.clients }),
  })
}

export function useUpdateClientStatus() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('trainer_clients').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.clients })
      qc.invalidateQueries({ queryKey: KEYS.dashboardStats })
    },
  })
}

// ─── Health Metrics ───────────────────────────────────────────────────────────
export function useHealthMetrics(clientId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.healthMetrics(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('client_id', clientId)
        .order('metric_date', { ascending: true })
      if (error) throw error
      return data as HealthMetric[]
    },
    enabled: !!clientId,
  })
}

export function useLogHealthMetric() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<HealthMetric> & { client_id: string; metric_date: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Clean empty strings to null
      const cleaned = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [k, v === '' ? null : v])
      )

      const { data, error } = await supabase
        .from('health_metrics')
        .upsert({ ...cleaned, logged_by: user.id }, { onConflict: 'client_id,metric_date' })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: KEYS.healthMetrics(vars.client_id) }),
  })
}

// ─── Workout Plans ────────────────────────────────────────────────────────────
export function useWorkoutPlans() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.workoutPlans,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`*, client:profiles!workout_plans_client_id_fkey(full_name, email)`)
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as WorkoutPlan[]
    },
  })
}

export function useWorkoutPlan(planId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.workoutPlan(planId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`*, exercises:workout_plan_exercises(*, exercise:exercises(*))`)
        .eq('id', planId)
        .single()
      if (error) throw error
      return data as WorkoutPlan
    },
    enabled: !!planId,
  })
}

export function useCreateWorkoutPlan() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string; description?: string; difficulty?: string;
      duration_weeks?: number; client_id?: string; plan_type: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({ ...input, trainer_id: user.id })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.workoutPlans }),
  })
}

export function useDeleteWorkoutPlan() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workout_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.workoutPlans })
      qc.invalidateQueries({ queryKey: ['my-workout-plans'] })
    },
  })
}

export function useAddExerciseToPlan() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      plan_id: string; exercise_id: string; day_of_week?: number;
      order_index?: number; sets?: number; reps?: string;
      weight_kg?: number; rest_seconds?: number; notes?: string
    }) => {
      const { data, error } = await supabase
        .from('workout_plan_exercises').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: KEYS.workoutPlan(vars.plan_id) }),
  })
}

export function useRemoveExerciseFromPlan() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, plan_id: _plan_id }: { id: string; plan_id: string }) => {
      const { error } = await supabase.from('workout_plan_exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: KEYS.workoutPlan(vars.plan_id) }),
  })
}

// ─── Exercises ────────────────────────────────────────────────────────────────
export function useExercises() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.exercises,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`is_global.eq.true,created_by.eq.${user.id}`)
        .order('name')
      if (error) throw error
      return data as Exercise[]
    },
  })
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export function useGoals(clientId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.goals(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals').select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
    enabled: !!clientId,
  })
}

export function useCreateGoal() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Goal> & { client_id: string; title: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('goals').insert({ ...input, trainer_id: user.id }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: KEYS.goals(vars.client_id) }),
  })
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export function useDashboardStats() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.dashboardStats,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [clientsRes, plansRes] = await Promise.all([
        supabase.from('trainer_clients').select('status, created_at').eq('trainer_id', user.id),
        supabase.from('workout_plans').select('id').eq('trainer_id', user.id),
      ])

      const clients = clientsRes.data ?? []
      const active = clients.filter(c => c.status === 'active').length
      const thisMonth = clients.filter(c => {
        const d = new Date(c.created_at)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length

      return {
        totalClients: clients.length,
        activeClients: active,
        newClientsThisMonth: thisMonth,
        totalPlans: plansRes.data?.length ?? 0,
      }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT-SPECIFIC HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// ─── My Trainer ───────────────────────────────────────────────────────────
export function useMyTrainer() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['my-trainer'] as const,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('trainer_clients')
        .select(`*, trainer:profiles!trainer_clients_trainer_id_fkey(*)`)
        .eq('client_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      if (error) throw error
      return data as TrainerClient | null
    },
  })
}

// ─── My Workout Plans ─────────────────────────────────────────────────────
export function useMyWorkoutPlans() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['my-workout-plans'] as const,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`*, exercises:workout_plan_exercises(*, exercise:exercises(*)), trainer:profiles!workout_plans_trainer_id_fkey(full_name)`)
        .eq('client_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as WorkoutPlan[]
    },
  })
}

// ─── My Goals ─────────────────────────────────────────────────────────────
export function useMyGoals() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['my-goals'] as const,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('goals').select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
  })
}

// ─── My Health Metrics ────────────────────────────────────────────────────
export function useMyHealthMetrics() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['my-health-metrics'] as const,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('health_metrics').select('*')
        .eq('client_id', user.id)
        .order('metric_date', { ascending: true })
      if (error) throw error
      return data as HealthMetric[]
    },
  })
}

// ─── Nutrition Logs ───────────────────────────────────────────────────────
export function useNutritionLogs(clientId: string, date?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['nutrition-logs', clientId, date] as const,
    queryFn: async () => {
      let q = supabase.from('nutrition_logs').select('*').eq('client_id', clientId)
      if (date) q = q.eq('log_date', date)
      q = q.order('created_at', { ascending: true })
      const { data, error } = await q
      if (error) throw error
      return data as NutritionLog[]
    },
    enabled: !!clientId,
  })
}

export function useLogNutrition() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      client_id: string; log_date: string; meal_type: string;
      food_name: string; calories?: number; protein_g?: number;
      carbs_g?: number; fat_g?: number; notes?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('nutrition_logs')
        .insert({ ...input, logged_by: user.id })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['nutrition-logs', vars.client_id] })
      qc.invalidateQueries({ queryKey: ['client-dashboard-stats'] })
    },
  })
}

export function useDeleteNutritionLog() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, client_id }: { id: string; client_id: string }) => {
      const { error } = await supabase.from('nutrition_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['nutrition-logs', vars.client_id] })
      qc.invalidateQueries({ queryKey: ['client-dashboard-stats'] })
    },
  })
}

// ─── Log Workout Session ──────────────────────────────────────────────────
export function useLogWorkoutSession() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      plan_id: string; session_date: string; duration_mins?: number;
      overall_feeling?: number; notes?: string;
      sets?: { exercise_id: string; set_number: number; reps_completed?: number; weight_kg?: number; rpe?: number }[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: log, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          client_id: user.id, plan_id: input.plan_id, logged_by: user.id,
          session_date: input.session_date, duration_mins: input.duration_mins,
          overall_feeling: input.overall_feeling, notes: input.notes,
        })
        .select().single()
      if (logError) throw logError
      if (input.sets?.length) {
        const { error: setsError } = await supabase
          .from('workout_log_sets')
          .insert(input.sets.map(s => ({ ...s, log_id: log.id })))
        if (setsError) throw setsError
      }
      return log
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-workout-plans'] }),
  })
}

// ─── Client Dashboard Stats ──────────────────────────────────────────────
export function useClientDashboardStats() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['client-dashboard-stats'] as const,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const today = new Date().toISOString().slice(0, 10)
      const [goalsRes, metricsRes, plansRes, nutritionRes] = await Promise.all([
        supabase.from('goals').select('id, status').eq('client_id', user.id),
        supabase.from('health_metrics').select('id').eq('client_id', user.id),
        supabase.from('workout_plans').select('id').eq('client_id', user.id).eq('is_active', true),
        supabase.from('nutrition_logs').select('id').eq('client_id', user.id).eq('log_date', today),
      ])
      const goals = goalsRes.data ?? []
      return {
        activeGoals: goals.filter(g => g.status === 'active').length,
        totalMetrics: metricsRes.data?.length ?? 0,
        activePlans: plansRes.data?.length ?? 0,
        todayMeals: nutritionRes.data?.length ?? 0,
      }
    },
  })
}

// ─── Nutrition Plans ──────────────────────────────────────────────────────────
export function useNutritionPlans() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.nutritionPlans,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select(`*, client:profiles!nutrition_plans_client_id_fkey(*)`)
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as NutritionPlan[]
    },
  })
}

export function useNutritionPlan(planId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.nutritionPlan(planId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select(`*, meals:nutrition_plan_meals(*)`)
        .eq('id', planId)
        .single()
      if (error) throw error
      return data as NutritionPlan
    },
    enabled: !!planId,
  })
}

export function useMyNutritionPlans() {
  const supabase = createClient()
  return useQuery({
    queryKey: ['my-nutrition-plans'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select(`*, meals:nutrition_plan_meals(*)`)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as NutritionPlan[]
    },
  })
}

export function useCreateNutritionPlan() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string; description?: string; client_id: string;
      target_calories?: number; target_protein_g?: number; target_carbs_g?: number; target_fat_g?: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('nutrition_plans')
        .insert({ ...input, trainer_id: user.id })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.nutritionPlans })
      qc.invalidateQueries({ queryKey: ['my-nutrition-plans'] })
    },
  })
}

export function useAddNutritionPlanMeal() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      plan_id: string; meal_type: string; food_name: string; portion?: string;
      calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number; sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from('nutrition_plan_meals').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: KEYS.nutritionPlan(vars.plan_id) }),
  })
}

export function useDeleteNutritionPlan() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nutrition_plans').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.nutritionPlans })
      qc.invalidateQueries({ queryKey: ['my-nutrition-plans'] })
    },
  })
}

export function useDeleteNutritionPlanMeal() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, plan_id: _plan_id }: { id: string; plan_id: string }) => {
      const { error } = await supabase.from('nutrition_plan_meals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: KEYS.nutritionPlan(vars.plan_id) }),
  })
}
