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

  // 2. Use admin client to create an auth user first (profiles.id FK → auth.users.id)
  const admin = createAdminClient()

  const { data: newUser, error: authCreateError } = await admin.auth.admin.createUser({
    email: input.email,
    password: crypto.randomUUID(), // placeholder password — client can reset later
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
    is_active: true,
  }, { onConflict: 'id' })

  if (profileError) {
    console.error('Profile insert error:', profileError)
    // Rollback – remove orphaned auth user
    await admin.auth.admin.deleteUser(clientId)
    return { error: profileError.message }
  }

  // 3. Link trainer → client
  const { error: linkError } = await admin.from('trainer_clients').insert({
    trainer_id: user.id,
    client_id: clientId,
    status: 'active',
    goal_summary: input.goal_summary ?? null,
  })

  if (linkError) {
    console.error('Trainer-client link error:', linkError)
    // Rollback – remove orphaned profile
    await admin.from('profiles').delete().eq('id', clientId)
    return { error: linkError.message }
  }

  return { clientId }
}
