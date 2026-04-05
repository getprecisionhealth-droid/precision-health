-- ═══════════════════════════════════════════════════════════════════════════
-- PRECISION HEALTH — RBAC Agency Model Migration
-- Run this in your Supabase SQL Editor AFTER all previous migrations.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Organizations table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their org"
  ON public.organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org owners can update their org"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create orgs"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ─── 2. Expand profiles role + add organization_id ───────────────────────────

-- Drop old check constraint if it exists (may vary by setup)
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

-- Migrate existing trainer accounts to admin_trainer (independent coaches)
UPDATE public.profiles SET role = 'admin_trainer' WHERE role = 'trainer';

-- ─── 3. Invitations table ────────────────────────────────────────────────────
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

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage invitations"
  ON public.invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'admin_trainer')
    )
  );

-- Public read for invite validation (by token)
CREATE POLICY "Anyone can read invitations by token"
  ON public.invitations FOR SELECT
  USING (true);

-- ─── 4. Trainer-Client Assignments (Admin team management) ───────────────────
CREATE TABLE IF NOT EXISTS public.trainer_client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, trainer_id, client_id)
);

ALTER TABLE public.trainer_client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage assignments"
  ON public.trainer_client_assignments FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'admin_trainer')
    )
  );

CREATE POLICY "Trainers can view their own assignments"
  ON public.trainer_client_assignments FOR SELECT
  USING (trainer_id = auth.uid());

-- ─── 5. Add organization_id to trainer_clients ───────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainer_clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.trainer_clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 6. Restructure nutrition_plans ──────────────────────────────────────────
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

-- ─── 7. Restructure nutrition_plan_meals ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nutrition_plan_meals' AND column_name = 'meal_block'
  ) THEN
    ALTER TABLE public.nutrition_plan_meals ADD COLUMN meal_block TEXT;
    ALTER TABLE public.nutrition_plan_meals ADD COLUMN option_label TEXT;
    ALTER TABLE public.nutrition_plan_meals ADD COLUMN ingredients JSONB DEFAULT '[]'::jsonb;
    -- Migrate old data: set meal_block from meal_type, option_label = food_name
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

-- ─── 8. Client Meal Selections ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_meal_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES public.nutrition_plan_meals(id) ON DELETE CASCADE,
  selected_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, meal_id, selected_date)
);

ALTER TABLE public.client_meal_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their own selections"
  ON public.client_meal_selections FOR ALL
  USING (client_id = auth.uid());

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

-- ─── 9. Add RPE to workout_plan_exercises ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_plan_exercises' AND column_name = 'rpe'
  ) THEN
    ALTER TABLE public.workout_plan_exercises ADD COLUMN rpe SMALLINT CHECK (rpe BETWEEN 1 AND 10);
  END IF;
END $$;

-- ─── 10. Realtime publications ───────────────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trainer_client_assignments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE client_meal_selections;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — Run this in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════
