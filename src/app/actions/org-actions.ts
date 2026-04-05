'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function createOrganizationAction(input: { name: string }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  // Create the organization
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: input.name, owner_id: user.id })
    .select()
    .single()

  if (orgError) return { error: orgError.message }

  // Link the user to their new organization
  const { error: profileError } = await admin
    .from('profiles')
    .update({ organization_id: org.id })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  return { organizationId: org.id }
}
