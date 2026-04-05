import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const inviteToken = searchParams.get('invite_token')

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Handle invite-based OAuth
      if (inviteToken) {
        try {
          const { acceptInviteAction } = await import('@/app/actions/invite-actions')
          const result = await acceptInviteAction(inviteToken, data.user.id)

          if (result.success) {
            // Also ensure the profile exists with the user's name/email from Google
            const admin = createAdminClient()
            const googleName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
            const googleEmail = data.user.email || ''

            await admin.from('profiles').upsert({
              id: data.user.id,
              full_name: googleName,
              email: googleEmail,
            }, {
              onConflict: 'id',
              ignoreDuplicates: false,
            })

            const dest = result.role === 'client' ? '/client-dashboard' : '/trainer-dashboard'
            return NextResponse.redirect(`${origin}${dest}`)
          }
        } catch (e) {
          console.error('Invite accept error:', e)
        }
      }

      // Standard login — route based on role
      const role = data.user.user_metadata?.role as string
      if (role === 'client') {
        return NextResponse.redirect(`${origin}/client-dashboard`)
      } else if (role === 'trainer') {
        return NextResponse.redirect(`${origin}/trainer-dashboard`)
      } else {
        return NextResponse.redirect(`${origin}/dashboard`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
