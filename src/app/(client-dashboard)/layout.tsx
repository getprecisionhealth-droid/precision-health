import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientSidebar } from '@/components/layout/client-sidebar'
import type { Profile } from '@/types/database'

export default async function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ClientSidebar profile={profile as Profile} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
