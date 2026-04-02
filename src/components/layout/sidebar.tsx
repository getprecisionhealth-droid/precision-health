'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Dumbbell, Activity,
  Target, StickyNote, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/card'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { href: '/health', icon: Activity, label: 'Health Metrics' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
]

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-[220px] flex-shrink-0 flex-col border-r border-[#1a1a1f] bg-[#0d0d10]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1a1a1f]">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2.5" fill="white"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-[#fafafa] tracking-tight">Precision Health</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-medium'
                    : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#1a1a1f]'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-indigo-400' : 'text-[#52525b] group-hover:text-[#71717a]')} />
                {label}
                {isActive && <ChevronRight className="h-3 w-3 ml-auto text-indigo-500/60" />}
              </Link>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#1a1a1f]">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#3f3f46]">Account</p>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group',
              pathname === '/settings'
                ? 'bg-indigo-600/15 text-indigo-300'
                : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#1a1a1f]'
            )}
          >
            <Settings className="h-4 w-4 text-[#52525b] group-hover:text-[#71717a]" />
            Settings
          </Link>
        </div>
      </nav>

      {/* Profile footer */}
      <div className="border-t border-[#1a1a1f] p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <UserAvatar name={profile?.full_name ?? 'Trainer'} src={profile?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#fafafa] truncate">{profile?.full_name ?? 'Trainer'}</p>
            <p className="text-[10px] text-[#52525b] truncate capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[#52525b] hover:text-[#a1a1aa] transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
