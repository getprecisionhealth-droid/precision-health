'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Profile, TrainerClient, HealthMetric, WorkoutPlan, Goal, Exercise, NutritionLog, NutritionPlan, CalendarEvent, Organization, Invitation, TrainerClientAssignment, ClientMealSelection } from '@/types/database'

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
  calendarEvents: (id?: string) => ['calendar-events', id || 'all'] as const,
  organization: ['organization'] as const,
  orgTrainers: ['org-trainers'] as const,
  orgClients: ['org-clients'] as const,
  invitations: ['invitations'] as const,
  trainerAssignments: ['trainer-assignments'] as const,
  trainerClients: ['trainer-clients'] as const,
  mealSelections: (planId: string, date: string) => ['meal-selections', planId, date] as const,
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

// ─── Organization ─────────────────────────────────────────────────────────────
export function useOrganization() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.organization,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) return null
      const { data, error } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single()
      if (error) return null
      return data as Organization
    },
  })
}

export function useOrganizationTrainers() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.orgTrainers,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .in('role', ['trainer', 'admin_trainer'])
        .order('full_name')
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useOrganizationClients() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.orgClients,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'client')
        .order('full_name')
      if (error) throw error
      return data as Profile[]
    },
  })
}

// ─── Invitations ──────────────────────────────────────────────────────────────
export function useInvitations() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.invitations,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) return []
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Invitation[]
    },
  })
}

export function useSendInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; role: 'trainer' | 'client' }) => {
      const { sendInviteAction } = await import('@/app/actions/invite-actions')
      const result = await sendInviteAction(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.invitations })
    },
  })
}

// ─── Trainer Assignments ──────────────────────────────────────────────────────
export function useTrainerAssignments() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.trainerAssignments,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) return []
      const { data, error } = await supabase
        .from('trainer_client_assignments')
        .select('*, trainer:profiles!trainer_client_assignments_trainer_id_fkey(*), client:profiles!trainer_client_assignments_client_id_fkey(*)')
        .eq('organization_id', profile.organization_id)
      if (error) throw error
      return data as TrainerClientAssignment[]
    },
  })
}

export function useAssignTrainerToClient() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { trainer_id: string; client_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      if (!profile?.organization_id) throw new Error('No organization')
      // 1. Record the admin-level assignment
      const { error } = await supabase.from('trainer_client_assignments').insert({
        organization_id: profile.organization_id,
        trainer_id: input.trainer_id,
        client_id: input.client_id,
        assigned_by: user.id,
      })
      if (error) throw error
      // 2. Also create the trainer_clients link (used by all data hooks)
      const { error: linkError } = await supabase.from('trainer_clients').upsert({
        trainer_id: input.trainer_id,
        client_id: input.client_id,
        organization_id: profile.organization_id,
        status: 'active',
      }, { onConflict: 'trainer_id,client_id' })
      if (linkError) throw linkError
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.trainerAssignments })
      qc.invalidateQueries({ queryKey: KEYS.trainerClients })
      qc.invalidateQueries({ queryKey: KEYS.clients })
    },
  })
}

// ─── Trainer's Assigned Clients (for trainer role) ─────────────────────────────
export function useTrainerClients() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.trainerClients,
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

// ─── Clients (role-aware) ─────────────────────────────────────────────────────
export function useClients() {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.clients,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const role = profile?.role ?? 'admin_trainer'

      if (role === 'trainer') {
        // Trainer: only assigned clients
        const { data, error } = await supabase
          .from('trainer_clients')
          .select(`*, client:profiles!trainer_clients_client_id_fkey(*)`)
          .eq('trainer_id', user.id)
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
        if (error) throw error
        return data as TrainerClient[]
      }

      // Admin/Admin-Trainer: all their linked clients
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
      const { addClientAction } = await import('@/app/actions/client-actions')
      const result = await addClientAction(input)
      if (result.error) throw new Error(result.error)
      return result.clientId!
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.clients })
      qc.invalidateQueries({ queryKey: KEYS.orgClients })
    },
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
      scheduled_date?: string;
      order_index?: number; sets?: number; reps?: string;
      weight_kg?: number; rest_seconds?: number; duration_secs?: number; rpe?: number; group_name?: string; notes?: string
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

      const { data: profile } = await supabase.from('profiles').select('role, organization_id').eq('id', user.id).single()

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

      // For admins, also count trainers in org
      let totalTrainers = 0
      if (profile?.organization_id && ['admin', 'admin_trainer'].includes(profile.role)) {
        const { data: trainers } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', profile.organization_id)
          .in('role', ['trainer', 'admin_trainer'])
        totalTrainers = trainers?.length ?? 0
      }

      return {
        totalClients: clients.length,
        activeClients: active,
        newClientsThisMonth: thisMonth,
        totalPlans: plansRes.data?.length ?? 0,
        totalTrainers,
      }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT-SPECIFIC HOOKS
// ═══════════════════════════════════════════════════════════════════════════

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
      carbs_g?: number; fat_g?: number; notes?: string; content?: string
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
      goal?: string; priorities?: string[]; restrictions?: string[];
      target_calories?: number; calories_maintenance?: number;
      target_protein_g?: number; target_carbs_g?: number; target_fat_g?: number;
      target_fiber_g?: number;
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
      meal_block?: string; option_label?: string; ingredients?: string; content?: string;
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

// ─── Client Meal Selections ──────────────────────────────────────────────────
export function useClientMealSelections(planId?: string, date?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.mealSelections(planId ?? '', date ?? ''),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('client_meal_selections')
        .select('*')
        .eq('client_id', user.id)
        .eq('plan_id', planId!)
        .eq('selected_date', date!)
      if (error) throw error
      return data as ClientMealSelection[]
    },
    enabled: !!planId && !!date,
  })
}

export function useSelectMeal() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { plan_id: string; meal_id: string; selected_date: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('client_meal_selections')
        .insert({ client_id: user.id, ...input })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.mealSelections(vars.plan_id, vars.selected_date) })
    },
  })
}

export function useDeselectMeal() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; plan_id: string; date: string }) => {
      const { error } = await supabase.from('client_meal_selections').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.mealSelections(vars.plan_id, vars.date) })
    },
  })
}

// ─── Calendar Events ─────────────────────────────────────────────────────────

export function useCalendarEvents(clientId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: KEYS.calendarEvents(clientId),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      
      let query = supabase
        .from('calendar_events')
        .select(`*, client:profiles!calendar_events_client_id_fkey(*), trainer:profiles!calendar_events_trainer_id_fkey(*)`)
        .order('start_time', { ascending: true })

      if (profile?.role === 'client') {
        query = query.eq('client_id', user.id)
      } else {
        query = query.eq('trainer_id', user.id)
        if (clientId) query = query.eq('client_id', clientId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as CalendarEvent[]
    },
  })
}

export function useCreateCalendarEvent() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'client' | 'trainer'>) => {
      const { data, error } = await supabase.from('calendar_events').insert([event]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.calendarEvents() })
      qc.invalidateQueries({ queryKey: KEYS.calendarEvents(vars.client_id) })
    },
  })
}

export function useUpdateCalendarEvent() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) => {
      const { data, error } = await supabase.from('calendar_events').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.calendarEvents() })
    },
  })
}

export function useDeleteCalendarEvent() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.calendarEvents() })
    },
  })
}
