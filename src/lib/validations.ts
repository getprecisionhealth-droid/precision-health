import { z } from 'zod'

const optionalNumber = z.union([z.number(), z.literal(''), z.undefined(), z.null()])
  .transform(v => (v === '' || v == null ? undefined : Number(v)))

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  role: z.enum(['trainer', 'client']).default('trainer'),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

export const profileSchema = z.object({
  full_name: z.string().min(2),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  years_experience: z.coerce.number().min(0).max(50).optional(),
})

export const clientSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  height_cm: z.union([z.coerce.number().min(100).max(250), z.literal(''), z.undefined(), z.null()])
    .transform(v => (v === '' || v == null ? undefined : Number(v)))
    .optional(),
  goal_summary: z.string().max(300).optional(),
})

export const healthMetricSchema = z.object({
  metric_date: z.string(),
  weight_kg: optionalNumber,
  body_fat_pct: optionalNumber,
  muscle_mass_kg: optionalNumber,
  bp_systolic: optionalNumber,
  bp_diastolic: optionalNumber,
  resting_hr: optionalNumber,
  sleep_hours: optionalNumber,
  sleep_quality: optionalNumber,
  hydration_ml: optionalNumber,
  steps_count: optionalNumber,
  energy_level: optionalNumber,
  stress_level: optionalNumber,
  notes: z.string().max(500).optional(),
})

export const workoutPlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  description: z.string().max(500).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  duration_weeks: z.coerce.number().min(1).max(52).optional(),
  client_id: z.string().uuid().optional(),
  plan_type: z.enum(['template', 'assigned']).default('template'),
})

export const workoutPlanExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  day_of_week: z.coerce.number().min(1).max(7).optional(),
  order_index: z.coerce.number().default(0),
  sets: z.coerce.number().min(1).max(20).optional(),
  reps: z.string().optional(),
  weight_kg: z.coerce.number().optional(),
  rest_seconds: z.coerce.number().optional(),
  notes: z.string().optional(),
})

export const goalSchema = z.object({
  title: z.string().min(2, 'Goal title is required'),
  description: z.string().optional(),
  category: z.enum(['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'nutrition', 'lifestyle', 'custom']).optional(),
  timeframe: z.enum(['short', 'medium', 'long']).optional(),
  target_value: z.coerce.number().optional(),
  target_unit: z.string().optional(),
  baseline_value: z.coerce.number().optional(),
  target_date: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type HealthMetricInput = z.infer<typeof healthMetricSchema>
export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>
export type WorkoutPlanExerciseInput = z.infer<typeof workoutPlanExerciseSchema>
export type GoalInput = z.infer<typeof goalSchema>
