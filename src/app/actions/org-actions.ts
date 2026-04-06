'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createOrganizationAction(input: { name: string; role: 'admin' | 'admin_trainer' }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // 1. Create the organization
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: input.name, owner_id: user.id })
    .select()
    .single()

  if (orgError) return { error: orgError.message }

  // 2. Update profile with role AND organization_id
  const { error: profileError } = await admin
    .from('profiles')
    .update({ 
      organization_id: org.id,
      role: input.role
    })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // 3. Update Auth Metadata role (crucial for Middleware)
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { role: input.role }
  })

  if (metadataError) return { error: metadataError.message }

  return { organizationId: org.id }
}
