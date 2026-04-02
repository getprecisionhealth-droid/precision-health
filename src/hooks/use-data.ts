'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile, TrainerClient, HealthMetric, WorkoutPlan, Goal, Exercise } from '@/types/database'

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const KEYS = {
  profile: ['profile'] as const,
  clients: ['clients'] as const,
  client: (id: string) => ['client', id] as const,
  healthMetrics: (clientId: string) => ['health-metrics', clientId] as const,
  workoutPlans: ['workout-plans'] as const,
  workoutPlan: (id: string) => ['workout-plan', id] as const,
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
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      full_name: string; email: string; phone?: string;
      date_of_birth?: string; gender?: string; height_cm?: number; goal_summary?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // In production: use a server action with service role key to create auth user
      // For scaffold: create profile entry for an invited client
      const clientId = crypto.randomUUID()
      const { error: profileError } = await supabase.from('profiles').insert({
        id: clientId,
        role: 'client',
        full_name: input.full_name,
        email: input.email,
        phone: input.phone ?? null,
        date_of_birth: input.date_of_birth ?? null,
        gender: input.gender ?? null,
        height_cm: input.height_cm ?? null,
        is_active: true,
      })
      if (profileError) throw profileError

      const { error: linkError } = await supabase.from('trainer_clients').insert({
        trainer_id: user.id,
        client_id: clientId,
        status: 'active',
        goal_summary: input.goal_summary ?? null,
      })
      if (linkError) throw linkError
      return clientId
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
