'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Dumbbell, Activity,
  Target, StickyNote, Settings, LogOut, ChevronRight, Apple, Calendar as CalendarIcon, Menu, X, UserPlus, Library
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useRealtimeSync } from '@/hooks/use-realtime'
import type { Profile } from '@/types/database'

function getNavItems(role: string) {
  const base = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/clients', icon: Users, label: 'Clients' },
    { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { href: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    { href: '/nutrition-plans', icon: Apple, label: 'Diet Plans' },
    { href: '/exercise-library', icon: Library, label: 'Exercise Library' },
    { href: '/health', icon: Activity, label: 'Health Metrics' },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/notes', icon: StickyNote, label: 'Notes' },
  ]

  if (role === 'admin' || role === 'admin_trainer') {
    // Insert Team after Clients
    const clientsIdx = base.findIndex(i => i.href === '/clients')
    base.splice(clientsIdx + 1, 0, { href: '/team', icon: UserPlus, label: 'Team' })
  }

  if (role === 'trainer') {
    // Replace dashboard href for trainers
    base[0] = { href: '/trainer-dashboard', icon: LayoutDashboard, label: 'Dashboard' }
  }

  return base
}

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  useRealtimeSync()

  const navItems = getNavItems(profile?.role ?? 'admin_trainer')

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const roleLabel = profile?.role === 'admin' ? 'Admin'
    : profile?.role === 'admin_trainer' ? 'Admin · Trainer'
    : profile?.role === 'trainer' ? 'Trainer'
    : 'User'

  const SidebarContent = (
    <div className="flex h-full w-[240px] md:w-[220px] flex-shrink-0 flex-col bg-surface-alt border-r border-border-subtle">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border-subtle">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && href !== '/trainer-dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-medium'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-text-muted group-hover:text-text-tertiary')} />
                {label}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto text-indigo-500/60" />}
              </Link>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border-subtle">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-faint">Account</p>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group',
              pathname === '/settings'
                ? 'bg-indigo-600/15 text-indigo-300'
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
          <UserAvatar name={profile?.full_name ?? 'User'} src={profile?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{profile?.full_name ?? 'User'}</p>
            <p className="text-[10px] text-text-muted truncate">{roleLabel}</p>
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
    </div>
  )

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border-subtle z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary tracking-tight">Precision Health</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1.5 text-text-secondary hover:text-text-primary bg-surface-alt rounded-md border border-border-subtle">
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {SidebarContent}
            <button 
              onClick={() => setMobileOpen(false)} 
              className="absolute top-4 right-4 p-1.5 rounded-md text-text-muted hover:text-text-primary bg-surface-2 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
