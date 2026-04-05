export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'admin_trainer' | 'trainer' | 'client'
export type ClientStatus = 'active' | 'inactive' | 'pending' | 'archived'
export type GoalStatus = 'active' | 'achieved' | 'paused' | 'cancelled'
export type GoalCategory = 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility' | 'nutrition' | 'lifestyle' | 'custom'
export type GoalTimeframe = 'short' | 'medium' | 'long'
export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'balance' | 'plyometrics' | 'sports' | 'other'
export type NoteCategory = 'general' | 'session' | 'nutrition' | 'progress' | 'medical' | 'goal'

// ─── Organization ─────────────────────────────────────────────────────────────
export interface Organization {
  id: string
  name: string
  owner_id: string
  created_at: string
}

// ─── Invitation ───────────────────────────────────────────────────────────────
export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: 'trainer' | 'client'
  invited_by: string
  token: string
  accepted_at: string | null
  expires_at: string
  created_at: string
  // Joined
  organization?: Organization
  inviter?: Profile
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  avatar_url: string | null
  bio: string | null
  phone: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  certifications: string[] | null
  specializations: string[] | null
  years_experience: number | null
  height_cm: number | null
  organization_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Trainer-Client Link ──────────────────────────────────────────────────────
export interface TrainerClient {
  id: string
  trainer_id: string
  client_id: string
  organization_id: string | null
  status: ClientStatus
  goal_summary: string | null
  onboarding_date: string
  end_date: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client?: Profile
  trainer?: Profile
}

// ─── Trainer-Client Assignment (Admin team management) ────────────────────────
export interface TrainerClientAssignment {
  id: string
  organization_id: string
  trainer_id: string
  client_id: string
  assigned_by: string
  created_at: string
  // Joined
  trainer?: Profile
  client?: Profile
}

// ─── Exercise ─────────────────────────────────────────────────────────────────
export interface Exercise {
  id: string
  created_by: string | null
  name: string
  description: string | null
  muscle_groups: string[] | null
  equipment: string[] | null
  category: ExerciseCategory | null
  is_global: boolean
  instructions: string | null
  video_url: string | null
  created_at: string
}

// ─── Workout Plan ─────────────────────────────────────────────────────────────
export interface WorkoutPlan {
  id: string
  trainer_id: string
  client_id: string | null
  name: string
  description: string | null
  plan_type: 'template' | 'assigned' | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  duration_weeks: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  exercises?: WorkoutPlanExercise[]
  client?: Profile
}

export interface WorkoutPlanExercise {
  id: string
  plan_id: string
  exercise_id: string
  day_of_week: number | null
  order_index: number
  sets: number | null
  reps: string | null
  weight_kg: number | null
  rest_seconds: number | null
  duration_secs: number | null
  rpe: number | null
  notes: string | null
  created_at: string
  // Joined
  exercise?: Exercise
}

// ─── Workout Log ──────────────────────────────────────────────────────────────
export interface WorkoutLog {
  id: string
  client_id: string
  plan_id: string | null
  logged_by: string
  session_date: string
  start_time: string | null
  end_time: string | null
  duration_mins: number | null
  overall_feeling: number | null
  notes: string | null
  created_at: string
  // Joined
  sets?: WorkoutLogSet[]
  plan?: WorkoutPlan
}

export interface WorkoutLogSet {
  id: string
  log_id: string
  exercise_id: string
  set_number: number
  reps_completed: number | null
  weight_kg: number | null
  duration_secs: number | null
  distance_m: number | null
  rpe: number | null
  notes: string | null
  created_at: string
  exercise?: Exercise
}

// ─── Health Metric ────────────────────────────────────────────────────────────
export interface HealthMetric {
  id: string
  client_id: string
  logged_by: string
  metric_date: string
  weight_kg: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  bmi: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
  resting_hr: number | null
  sleep_hours: number | null
  sleep_quality: number | null
  hydration_ml: number | null
  steps_count: number | null
  energy_level: number | null
  stress_level: number | null
  notes: string | null
  created_at: string
}

// ─── Goal ─────────────────────────────────────────────────────────────────────
export interface Goal {
  id: string
  client_id: string
  trainer_id: string
  title: string
  description: string | null
  category: GoalCategory | null
  timeframe: GoalTimeframe | null
  target_value: number | null
  target_unit: string | null
  baseline_value: number | null
  current_value: number | null
  target_date: string | null
  status: GoalStatus
  created_at: string
  updated_at: string
}

// ─── Note ─────────────────────────────────────────────────────────────────────
export interface Note {
  id: string
  trainer_id: string
  client_id: string
  title: string | null
  content: string
  category: NoteCategory
  is_shared_with_client: boolean
  created_at: string
  updated_at: string
}

// ─── Nutrition ────────────────────────────────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface NutritionLog {
  id: string
  client_id: string
  logged_by: string
  log_date: string
  meal_type: MealType
  food_name: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  notes: string | null
  created_at: string
}

export interface NutritionPlan {
  id: string
  trainer_id: string
  client_id: string
  title: string
  description: string | null
  goal: string | null
  priorities: string[] | null
  restrictions: string[] | null
  target_calories: number | null
  calories_maintenance: number | null
  target_protein_g: number | null
  target_carbs_g: number | null
  target_fat_g: number | null
  target_fiber_g: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  meals?: NutritionPlanMeal[]
  client?: Profile
}

export interface MealIngredient {
  name: string
  portion: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}

export interface NutritionPlanMeal {
  id: string
  plan_id: string
  meal_type: MealType
  meal_block: string | null
  option_label: string | null
  food_name: string
  portion: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  ingredients: MealIngredient[] | null
  notes: string | null
  sort_order: number | null
  created_at: string
}

export interface ClientMealSelection {
  id: string
  client_id: string
  plan_id: string
  meal_id: string
  selected_date: string
  created_at: string
  // Joined
  meal?: NutritionPlanMeal
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
export type EventType = 'workout' | 'nutrition' | 'video_call' | 'other'
export type EventStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled'

export interface CalendarEvent {
  id: string
  trainer_id: string
  client_id: string
  event_type: EventType
  title: string
  description: string | null
  start_time: string
  end_time: string
  status: EventStatus
  meeting_link: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Profile
  trainer?: Profile
}
