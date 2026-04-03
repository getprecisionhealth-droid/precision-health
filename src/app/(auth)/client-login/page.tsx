'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'

export default function ClientLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setServerError('Please check your email and verify your account first.')
      } else {
        setServerError(error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message)
      }
      return
    }
    
    router.push('/client-dashboard')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2.5" fill="white"/>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-text-primary text-center">Client Sign In</h2>
        <p className="mt-1.5 text-sm text-text-tertiary text-center">Log in to view your workouts and track progress</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email address" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {serverError && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="lg" loading={isSubmitting}>
          {!isSubmitting && <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>}
          {isSubmitting && 'Signing in…'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-tertiary">
        Don&apos;t have an account?{' '}
        <Link href="/client-signup" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
          Create client account
        </Link>
      </p>
      
      <div className="mt-8 pt-6 border-t border-border-subtle text-center">
         <p className="text-xs text-text-muted">
           Are you a Personal Trainer?{' '}
           <Link href="/login" className="text-indigo-400 hover:underline">Trainer Login</Link>
         </p>
      </div>
    </div>
  )
}
