'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ArrowRight, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, FormField } from '@/components/ui/input'

export default function ClientSignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema) as never,
    defaultValues: { role: 'client' }, // Force client role
  })

  async function onSubmit(data: SignupInput) {
    setServerError(null)
    const supabase = createClient()
    const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: 'client' }, // Force client role
      },
    })
    
    if (error) { 
      setServerError(error.message)
      return 
    }
    
    // If we land here, the user was created successfully in authentication
    // Show the "email confirmation required" UI instead of routing to dashboard
    setIsSuccess(true)
  }

  // Render the success state if verification is sent
  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-emerald-600/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <MailCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
        <p className="text-text-secondary leading-relaxed mb-8">
          We've sent a verification link to your email address.<br/>
          Please click the link to confirm your account before signing in.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/client-login">Return to login</Link>
        </Button>
      </div>
    )
  }

  // Render the signup form normally
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary text-center">Create Client Account</h2>
        <p className="mt-1.5 text-sm text-text-tertiary text-center">Join to connect with your trainer and track progress</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden role field since we force 'client' in defaultValues and onSubmit */}
        <input type="hidden" {...register('role')} value="client" />

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

        <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="lg" loading={isSubmitting}>
          {!isSubmitting && <><span>Create account</span><ArrowRight className="h-4 w-4" /></>}
          {isSubmitting && 'Creating account…'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-tertiary">
        Already have an account?{' '}
        <Link href="/client-login" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
          Sign in
        </Link>
      </p>
      
      <div className="mt-8 pt-6 border-t border-border-subtle text-center">
         <p className="text-xs text-text-muted">
           Are you a Personal Trainer?{' '}
           <Link href="/signup" className="text-indigo-400 hover:underline">Trainer Signup</Link>
         </p>
      </div>
    </div>
  )
}
