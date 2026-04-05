'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface AddClientInput {
  full_name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string
  height_cm?: number
  goal_summary?: string
}

export async function addClientAction(input: AddClientInput) {
  // 1. Verify the caller is authenticated via session cookies
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // 2. Get caller's profile for org context
  const admin = createAdminClient()
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const organizationId = callerProfile?.organization_id ?? null

  // 3. Use admin client to create an auth user first (profiles.id FK → auth.users.id)
  const { data: newUser, error: authCreateError } = await admin.auth.admin.createUser({
    email: input.email,
    password: crypto.randomUUID(), // placeholder password — client can reset or use Google OAuth
    email_confirm: true,
    user_metadata: { full_name: input.full_name, role: 'client' },
  })

  if (authCreateError) {
    console.error('Auth user create error:', authCreateError)
    return { error: authCreateError.message }
  }

  const clientId = newUser.user.id

  // Use upsert in case a DB trigger already created a skeleton profile on auth signup
  const { error: profileError } = await admin.from('profiles').upsert({
    id: clientId,
    role: 'client',
    full_name: input.full_name,
    email: input.email,
    phone: input.phone ?? null,
    date_of_birth: input.date_of_birth ?? null,
    gender: input.gender ?? null,
    height_cm: input.height_cm ?? null,
    organization_id: organizationId,
    is_active: true,
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('Profile insert error:', profileError)
    // Rollback – remove orphaned auth user
    await admin.auth.admin.deleteUser(clientId)
    return { error: profileError.message }
  }

  // 4. Link trainer → client (with organization context)
  const { error: linkError } = await admin.from('trainer_clients').insert({
    trainer_id: user.id,
    client_id: clientId,
    organization_id: organizationId,
    status: 'active',
    goal_summary: input.goal_summary ?? null,
  })

  if (linkError) {
    console.error('Trainer-client link error:', linkError)
    // Rollback – remove orphaned profile
    await admin.from('profiles').delete().eq('id', clientId)
    return { error: linkError.message }
  }

  // 5. If caller is admin_trainer (solo), auto-assign themselves as the trainer
  if (callerProfile?.role === 'admin_trainer' && organizationId) {
    await admin.from('trainer_client_assignments').insert({
      organization_id: organizationId,
      trainer_id: user.id,
      client_id: clientId,
      assigned_by: user.id,
    })
  }

  return { clientId }
}
