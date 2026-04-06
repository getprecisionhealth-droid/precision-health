import { useState } from 'react'
import { Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { KEYS } from '@/hooks/use-data'

type BusinessType = null | 'agency' | 'solo'

export function BusinessSetup({ profileName }: { profileName: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [businessType, setBusinessType] = useState<BusinessType>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleBusinessTypeSelect(type: BusinessType) {
    if (!type) return
    setBusinessType(type)
    setIsCreating(true)
    setServerError(null)

    try {
      const role = type === 'agency' ? 'admin' : 'admin_trainer'
      const orgName = type === 'agency'
        ? `${profileName || 'Your'}'s Agency`
        : `${profileName || 'Your'}'s Practice`

      const { createOrganizationAction } = await import('@/app/actions/org-actions')
      const result = await createOrganizationAction({ name: orgName, role })
      
      if (result.error) throw new Error(result.error)

      // Invalidate the profile query so the dashboard refetches and sees the organization_id
      await qc.invalidateQueries({ queryKey: KEYS.profile })
      
      router.refresh()
    } catch (e: any) {
      setServerError(e.message || 'An error occurred setting up your business.')
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border border-border-subtle rounded-2xl bg-surface-1 shadow-sm">
      <div className="mb-8 text-center">
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
        <div className="mt-6 text-center">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-text-tertiary">Setting up your account…</p>
        </div>
      )}

      {serverError && (
        <div className="mt-4 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <p className="text-sm text-red-400">{serverError}</p>
        </div>
      )}
    </div>
  )
}
