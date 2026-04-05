'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShieldCheck, AlertCircle } from 'lucide-react'

function InviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [invite, setInvite] = useState<{ org_name: string; role: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No invite token provided.')
        setLoading(false)
        return
      }

      try {
        const { validateInviteTokenAction } = await import('@/app/actions/invite-actions')
        const result = await validateInviteTokenAction(token)
        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setInvite(result.data)
        }
      } catch {
        setError('Unable to validate invite. Please try again.')
      }
      setLoading(false)
    }
    validateToken()
  }, [token])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?invite_token=${token}`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-text-muted">Validating your invitation…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Invalid Invitation</h2>
        <p className="text-sm text-text-muted max-w-xs mx-auto">{error}</p>
      </div>
    )
  }

  if (!invite) return null

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="h-14 w-14 rounded-2xl bg-indigo-600/15 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="h-7 w-7 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">You&apos;re Invited!</h2>
        <p className="mt-2 text-sm text-text-tertiary leading-relaxed">
          You&apos;ve been invited to join<br />
          <span className="text-text-primary font-semibold">{invite.org_name}</span> as a{' '}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600/15 text-indigo-300 capitalize">
            {invite.role}
          </span>
        </p>
        <p className="mt-3 text-xs text-text-muted">
          Invitation sent to <span className="text-text-secondary">{invite.email}</span>
        </p>
      </div>

      <Button
        type="button"
        className="w-full gap-2"
        size="lg"
        onClick={handleGoogleSignIn}
        loading={googleLoading}
      >
        {!googleLoading && (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
        {googleLoading && 'Connecting…'}
      </Button>

      <p className="mt-6 text-xs text-text-faint">
        By signing in, your account will be created and linked to this organization.
      </p>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
