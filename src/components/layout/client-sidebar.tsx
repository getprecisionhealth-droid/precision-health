'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Dumbbell, Apple, Activity,
  Target, Settings, LogOut, ChevronRight, Calendar as CalendarIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useRealtimeSync } from '@/hooks/use-realtime'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { href: '/client-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/my-workouts', icon: Dumbbell, label: 'My Workouts' },
  { href: '/nutrition', icon: Apple, label: 'Nutrition Log' },
  { href: '/calendar', icon: CalendarIcon, label: 'Schedule & Booking' },
  { href: '/my-health', icon: Activity, label: 'Health Metrics' },
  { href: '/my-goals', icon: Target, label: 'My Goals' },
]

interface ClientSidebarProps {
  profile: Profile | null
}

export function ClientSidebar({ profile }: ClientSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  useRealtimeSync()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-[220px] flex-shrink-0 flex-col border-r border-border-subtle bg-surface-alt">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border-subtle">
        <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2.5" fill="white"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight">Precision Health</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/client-dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group',
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-300 font-medium'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-emerald-400' : 'text-text-muted group-hover:text-text-tertiary')} />
                {label}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto text-emerald-500/60" />}
              </Link>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border-subtle">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-faint">Account</p>
          <Link
            href="/client-settings"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group',
              pathname === '/client-settings'
                ? 'bg-emerald-600/15 text-emerald-300'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
            )}
          >
            <Settings className="h-4 w-4 text-text-muted group-hover:text-text-tertiary" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Theme toggle + Profile footer */}
      <div className="border-t border-border-subtle p-3">
        <ThemeToggle className="w-full justify-start mb-2" />
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <UserAvatar name={profile?.full_name ?? 'Client'} src={profile?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{profile?.full_name ?? 'Client'}</p>
            <p className="text-[10px] text-text-muted truncate capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-text-muted hover:text-text-secondary transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
