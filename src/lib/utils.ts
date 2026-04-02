import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

export function formatRelativeTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' }
  if (bmi < 25) return { label: 'Normal', color: 'text-green-400' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' }
  return { label: 'Obese', color: 'text-red-400' }
}

export function getGoalProgress(baseline: number | null, current: number | null, target: number | null): number {
  if (baseline === null || current === null || target === null) return 0
  if (target === baseline) return 100
  const progress = ((current - baseline) / (target - baseline)) * 100
  return Math.min(Math.max(Math.round(progress), 0), 100)
}

export function formatWeight(kg: number | null): string {
  if (kg === null) return '—'
  return `${kg} kg`
}

export function formatBloodPressure(systolic: number | null, diastolic: number | null): string {
  if (!systolic || !diastolic) return '—'
  return `${systolic}/${diastolic} mmHg`
}

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'core',
  'lats', 'rhomboids', 'lower_back', 'hip_flexors', 'cardiovascular'
]

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  archived: 'bg-zinc-700/10 text-zinc-500 border-zinc-700/20',
  achieved: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
}
