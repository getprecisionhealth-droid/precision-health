'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function manualOnboardingAction(input: { 
  email: string; 
  fullName: string; 
  role: 'trainer' | 'client';
  generatePassword?: boolean;
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Verify the inviter is an admin/admin_trainer
  const { data: inviterProfile } = await admin
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!inviterProfile?.organization_id) return { error: 'No organization found' }
  if (!['admin', 'admin_trainer'].includes(inviterProfile.role)) {
    return { error: 'Only admins can perform manual onboarding' }
  }

  // Generate a random password if requested
  const password = input.generatePassword 
    ? Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    : 'TemporaryPassword123!' // Default fallback

  // Create the user in Auth
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: password,
    email_confirm: true,
    user_metadata: {
      role: input.role,
      full_name: input.fullName
    }
  })

  if (createError) {
    if (createError.message.includes('already registered')) {
      return { error: 'A user with this email already exists.' }
    }
    return { error: createError.message }
  }

  if (!newUser.user) return { error: 'Failed to create user' }

  // Update the profile (which is likely auto-created by a Supabase DB trigger on auth.users)
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: newUser.user.id,
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      organization_id: inviterProfile.organization_id,
      is_active: true
    })

  if (profileError) {
    // Cleanup if profile creation fails
    await admin.auth.admin.deleteUser(newUser.user.id)
    return { error: profileError.message }
  }

  // If adding a client, link them to the admin (or a specific trainer, but for now we link to admin)
  if (input.role === 'client') {
    await admin.from('trainer_clients').insert({
      trainer_id: user.id,
      client_id: newUser.user.id,
      organization_id: inviterProfile.organization_id,
      status: 'active'
    })
  }

  return { 
    success: true, 
    userId: newUser.user.id,
    credentials: {
      email: input.email,
      password: password
    }
  }
}

export async function adminUpdateUserPasswordAction(userId: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Verify the inviter is an admin/admin_trainer
  const { data: inviterProfile } = await admin
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!inviterProfile?.organization_id) return { error: 'No organization found' }
  if (!['admin', 'admin_trainer'].includes(inviterProfile.role)) {
    return { error: 'Only admins can update user passwords' }
  }

  // Ensure the target user is in the same organization
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single()

  if (targetProfile?.organization_id !== inviterProfile.organization_id) {
    return { error: 'Cannot update password for user outside your organization' }
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (updateError) return { error: updateError.message }

  return { success: true }
}

export async function userUpdatePasswordAction(newPassword: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) return { error: error.message }
  return { success: true }
}
