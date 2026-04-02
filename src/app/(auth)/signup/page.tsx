'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ArrowRight, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input, Label, FormField } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema) as never,
    defaultValues: { role: 'trainer' },
  })

  const role = watch('role')

  async function onSubmit(data: SignupInput) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: data.role },
      },
    })
    if (error) { setServerError(error.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#fafafa]">Create your account</h2>
        <p className="mt-1.5 text-sm text-[#71717a]">Start managing your clients in minutes</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector */}
        <div>
          <Label className="mb-2 block">I am a</Label>
          <div className="grid grid-cols-1 gap-2">
            {([['trainer', 'Personal Trainer', 'Manage clients, create plans, track progress']] as const).map(([val, title, desc]) => (
              <button
                key={val}
                type="button"
                onClick={() => setValue('role', val)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all',
                  role === val
                    ? 'border-indigo-500 bg-indigo-500/10 text-[#fafafa]'
                    : 'border-[#27272a] bg-[#111113] text-[#71717a] hover:border-[#3f3f46]'
                )}
              >
                <div className={cn('h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0',
                  role === val ? 'bg-indigo-600' : 'bg-[#1a1a1f]')}>
                  <Dumbbell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className={cn('text-sm font-medium', role === val ? 'text-[#fafafa]' : 'text-[#a1a1aa]')}>{title}</p>
                  <p className="text-xs text-[#52525b] mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
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
          {!isSubmitting && <><span>Create account</span><ArrowRight className="h-4 w-4" /></>}
          {isSubmitting && 'Creating account…'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#71717a]">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
