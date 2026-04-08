'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ArrowRight, Building2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type BusinessType = null | 'agency' | 'solo'

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'business_type'>('form')
  const [businessType, setBusinessType] = useState<BusinessType>(null)
  const [formData, setFormData] = useState<SignupInput | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema) as never,
    defaultValues: { role: 'admin' },
  })

  async function onSubmit(data: SignupInput) {
    setServerError(null)
    setFormData(data)
    setStep('business_type')
  }

  async function handleBusinessTypeSelect(type: BusinessType) {
    if (!formData || !type) return
    setBusinessType(type)
    setIsCreating(true)
    setServerError(null)

    const role = type === 'agency' ? 'admin' : 'admin_trainer'
    const supabase = createClient()

    const { error, data: authData } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.full_name, role },
      },
    })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setServerError('Please check your email to verify your account.')
      } else {
        setServerError(error.message)
      }
      setIsCreating(false)
      return
    }

    if (authData.user && !authData.session) {
      // 1. Auto-confirm the user in the background
      const { autoConfirmUserAction } = await import('@/app/actions/org-actions')
      await autoConfirmUserAction(authData.user.id)
      
      // 2. Log them in to establish the session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        setServerError('Account created but failed automatic login. Try logging in.')
        setIsCreating(false)
        return
      }
    }

    // Create organization
    if (authData.user) {
      const orgName = type === 'agency'
        ? `${formData.full_name}'s Agency`
        : `${formData.full_name}'s Practice`

      const { createOrganizationAction } = await import('@/app/actions/org-actions')
      const result = await createOrganizationAction({ name: orgName, role })
      if (result.error) {
        console.error('Org creation error:', result.error)
      }
    }

    setIsCreating(false)
    router.push('/dashboard')
    router.refresh()
  }

  if (step === 'business_type') {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Set Up Your Business</h2>
          <p className="mt-1.5 text-sm text-text-tertiary">How do you operate?</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleBusinessTypeSelect('agency')}
            disabled={isCreating}
            className={cn(
              'w-full text-left p-4 rounded-xl border transition-all group',
              businessType === 'agency'
                ? 'border-indigo-500 bg-indigo-600/10'
                : 'border-border-subtle hover:border-indigo-500/50 hover:bg-surface-2'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">I manage a team of trainers</p>
                <p className="text-xs text-text-muted mt-0.5">
                  You&apos;ll have a full admin dashboard to invite trainers, assign clients, and oversee everything.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleBusinessTypeSelect('solo')}
            disabled={isCreating}
            className={cn(
              'w-full text-left p-4 rounded-xl border transition-all group',
              businessType === 'solo'
                ? 'border-indigo-500 bg-indigo-600/10'
                : 'border-border-subtle hover:border-indigo-500/50 hover:bg-surface-2'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">I&apos;m an independent coach</p>
                <p className="text-xs text-text-muted mt-0.5">
                  You&apos;ll manage your own clients directly — no extra trainers needed.
                </p>
              </div>
            </div>
          </button>
        </div>

        {isCreating && (
          <div className="mt-4 text-center">
            <p className="text-sm text-text-tertiary">Setting up your account…</p>
          </div>
        )}

        {serverError && (
          <div className="mt-4 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <button
          onClick={() => { setStep('form'); setServerError(null) }}
          className="mt-6 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          ← Back to signup form
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Create Your Account</h2>
        <p className="mt-1.5 text-sm text-text-tertiary">Start managing your fitness business</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('role')} value="admin" />

        <FormField label="Full name" error={errors.full_name?.message}>
          <Input placeholder="Alex Johnson" autoComplete="name" {...register('full_name')} />
        </FormField>

        <FormField label="Email address" error={errors.email?.message}>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
        </FormField>

        <FormField label="Password" error={errors.password?.message} hint="Minimum 8 characters">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Choose a strong password"
              autoComplete="new-password"
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

        <FormField label="Confirm password" error={errors.confirm_password?.message}>
          <Input
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            {...register('confirm_password')}
          />
        </FormField>

        {serverError && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting}>
          {!isSubmitting && <><span>Continue</span><ArrowRight className="h-4 w-4" /></>}
          {isSubmitting && 'Processing…'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-tertiary">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
