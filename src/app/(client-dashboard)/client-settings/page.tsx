'use client'

import { useProfile, useMyTrainer } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle, UserAvatar, Skeleton } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function ClientSettingsPage() {
  const { data: profile, isLoading } = useProfile()
  const { data: trainerLink } = useMyTrainer()
  const trainer = trainerLink?.trainer

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader title="Settings" description="Your account information" />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-4">
          {/* Profile */}
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <UserAvatar name={profile?.full_name ?? 'Client'} src={profile?.avatar_url} size="lg" />
                <div>
                  <p className="text-base font-semibold text-text-primary">{profile?.full_name}</p>
                  <p className="text-sm text-text-muted">{profile?.email}</p>
                  <p className="text-xs text-text-faint capitalize mt-0.5">{profile?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border-subtle">
                {[
                  { label: 'Phone', value: profile?.phone },
                  { label: 'Date of Birth', value: profile?.date_of_birth },
                  { label: 'Gender', value: profile?.gender },
                  { label: 'Height', value: profile?.height_cm ? `${profile.height_cm} cm` : null },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-text-faint uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-text-secondary mt-0.5">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trainer */}
          <Card>
            <CardHeader><CardTitle>Assigned Trainer</CardTitle></CardHeader>
            <CardContent className="pt-0">
              {trainer ? (
                <div className="flex items-center gap-4">
                  <UserAvatar name={trainer.full_name} src={trainer.avatar_url} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{trainer.full_name}</p>
                    <p className="text-xs text-text-muted">{trainer.email}</p>
                    {trainer.bio && <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{trainer.bio}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">No trainer assigned yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Theme</p>
                  <p className="text-xs text-text-muted">Switch between light and dark mode</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
