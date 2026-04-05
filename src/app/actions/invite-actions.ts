'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function sendInviteAction(input: { email: string; role: 'trainer' | 'client' }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // Get the admin's profile to find their org
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return { error: 'No organization found' }
  if (!['admin', 'admin_trainer'].includes(profile.role)) return { error: 'Only admins can send invitations' }

  // Check if invite already exists
  const { data: existing } = await admin
    .from('invitations')
    .select('id')
    .eq('email', input.email)
    .eq('organization_id', profile.organization_id)
    .is('accepted_at', null)
    .single()

  if (existing) return { error: 'An active invitation already exists for this email' }

  // Create invitation
  const { data: invitation, error: inviteError } = await admin
    .from('invitations')
    .insert({
      organization_id: profile.organization_id,
      email: input.email,
      role: input.role,
      invited_by: user.id,
    })
    .select()
    .single()

  if (inviteError) return { error: inviteError.message }

  return { invitationId: invitation.id, token: invitation.token }
}

export async function validateInviteTokenAction(token: string) {
  const admin = createAdminClient()

  const { data: invite, error } = await admin
    .from('invitations')
    .select('*, organization:organizations(*)')
    .eq('token', token)
    .is('accepted_at', null)
    .single()

  if (error || !invite) return { error: 'Invalid or expired invitation' }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This invitation has expired. Please ask for a new one.' }
  }

  return {
    data: {
      org_name: invite.organization?.name ?? 'Unknown Organization',
      role: invite.role,
      email: invite.email,
    }
  }
}

export async function acceptInviteAction(token: string, userId: string) {
  const admin = createAdminClient()

  // Get invitation
  const { data: invite, error: fetchError } = await admin
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single()

  if (fetchError || !invite) return { error: 'Invalid or expired invitation' }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This invitation has expired' }
  }

  // Update the user's profile with role and org
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      role: invite.role,
      organization_id: invite.organization_id,
      is_active: true,
    }, { onConflict: 'id' })

  if (profileError) return { error: profileError.message }

  // Update user metadata in auth
  const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role: invite.role },
  })
  if (metaError) console.error('Metadata update error:', metaError)

  // Mark invitation as accepted
  await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  // For clients, create a trainer_clients link with the inviting admin
  if (invite.role === 'client') {
    await admin.from('trainer_clients').insert({
      trainer_id: invite.invited_by,
      client_id: userId,
      organization_id: invite.organization_id,
      status: 'active',
    })
  }

  return { success: true, role: invite.role }
}
