-- ═══════════════════════════════════════════════════════════════════════════
-- PRECISION HEALTH — RBAC Agency Model Migration (FIXED)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Tables Creation ──────────────────────────────────────────────────────

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─── 2. Profiles Update ──────────────────────────────────────────────────────
DO $$
BEGIN
  -- Add organization_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update roles to include admin and admin_trainer
-- First, ensure the check constraint on profiles.role is updated if it exists
DO $$ 
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint c
  JOIN pg_namespace n ON n.oid = c.connamespace
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'profiles' AND pg_get_constraintdef(c.oid) LIKE '%role%';

  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || con_name;
  END IF;

  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'admin_trainer', 'trainer', 'client'));
END $$;

-- Migrate existing trainer accounts to admin_trainer
UPDATE public.profiles SET role = 'admin_trainer' WHERE role = 'trainer';

-- ─── 3. Other Tables Creation ────────────────────────────────────────────────

-- Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('trainer', 'client')),
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trainer-Client Assignments
CREATE TABLE IF NOT EXISTS public.trainer_client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, trainer_id, client_id)
);

-- Client Meal Selections
CREATE TABLE IF NOT EXISTS public.client_meal_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES public.nutrition_plan_meals(id) ON DELETE CASCADE,
  selected_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, meal_id, selected_date)
);

-- ─── 4. Column Updates ───────────────────────────────────────────────────────

-- trainer_clients organization_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainer_clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.trainer_clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- nutrition_plans restructure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nutrition_plans' AND column_name = 'goal'
  ) THEN
    ALTER TABLE public.nutrition_plans ADD COLUMN goal TEXT;
    ALTER TABLE public.nutrition_plans ADD COLUMN priorities TEXT[];
    ALTER TABLE public.nutrition_plans ADD COLUMN restrictions TEXT[];
    ALTER TABLE public.nutrition_plans ADD COLUMN target_fiber_g INTEGER;
    ALTER TABLE public.nutrition_plans ADD COLUMN calories_maintenance INTEGER;
  END IF;
END $$;

-- nutrition_plan_meals restructure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nutrition_plan_meals' AND column_name = 'meal_block'
  ) THEN
    ALTER TABLE public.nutrition_plan_meals ADD COLUMN meal_block TEXT;
    ALTER TABLE public.nutrition_plan_meals ADD COLUMN option_label TEXT;
    ALTER TABLE public.nutrition_plan_meals ADD COLUMN ingredients JSONB DEFAULT '[]'::jsonb;
    
    UPDATE public.nutrition_plan_meals
    SET meal_block = COALESCE(meal_block, meal_type),
        option_label = COALESCE(option_label, food_name),
        ingredients = COALESCE(ingredients, jsonb_build_array(
          jsonb_build_object(
            'name', food_name,
            'portion', portion,
            'calories', calories,
            'protein_g', protein_g,
            'carbs_g', carbs_g,
            'fat_g', fat_g
          )
        ))
    WHERE meal_block IS NULL;
  END IF;
END $$;

-- workout_plan_exercises RPE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_plan_exercises' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE public.workout_plan_exercises ADD COLUMN rpe SMALLINT CHECK (rpe BETWEEN 1 AND 10);
  END IF;
END $$;

-- ─── 5. Row Level Security & Policies ────────────────────────────────────────

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can view their org" ON public.organizations;
CREATE POLICY "Org members can view their org"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Org owners can update their org" ON public.organizations;
CREATE POLICY "Org owners can update their org"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organizations;
CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org admins can manage invitations" ON public.invitations;
CREATE POLICY "Org admins can manage invitations"
  ON public.invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'admin_trainer')
    )
  );

DROP POLICY IF EXISTS "Anyone can read invitations by token" ON public.invitations;
CREATE POLICY "Anyone can read invitations by token"
  ON public.invitations FOR SELECT
  USING (true);

-- Trainer-Client Assignments
ALTER TABLE public.trainer_client_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org admins can manage assignments" ON public.trainer_client_assignments;
CREATE POLICY "Org admins can manage assignments"
  ON public.trainer_client_assignments FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'admin_trainer')
    )
  );

DROP POLICY IF EXISTS "Trainers can view their own assignments" ON public.trainer_client_assignments;
CREATE POLICY "Trainers can view their own assignments"
  ON public.trainer_client_assignments FOR SELECT
  USING (trainer_id = auth.uid());

-- Client Meal Selections
ALTER TABLE public.client_meal_selections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can manage their own selections" ON public.client_meal_selections;
CREATE POLICY "Clients can manage their own selections"
  ON public.client_meal_selections FOR ALL
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can view client selections" ON public.client_meal_selections;
CREATE POLICY "Trainers can view client selections"
  ON public.client_meal_selections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.client_id = client_meal_selections.client_id
        AND tc.trainer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.trainer_client_assignments tca
      WHERE tca.client_id = client_meal_selections.client_id
        AND tca.trainer_id = auth.uid()
    )
  );

-- ─── 6. Realtime publications ───────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'organizations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'invitations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'trainer_client_assignments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trainer_client_assignments;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'client_meal_selections') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE client_meal_selections;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
