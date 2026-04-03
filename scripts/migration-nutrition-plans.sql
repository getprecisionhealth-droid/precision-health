-- Create nutrition_plans table
CREATE TABLE public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_calories INTEGER,
  target_protein_g INTEGER,
  target_carbs_g INTEGER,
  target_fat_g INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create nutrition_plan_meals table
CREATE TABLE public.nutrition_plan_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  portion TEXT,
  calories INTEGER,
  protein_g NUMERIC(5,1),
  carbs_g NUMERIC(5,1),
  fat_g NUMERIC(5,1),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plan_meals ENABLE ROW LEVEL SECURITY;

-- Policies for nutrition_plans
CREATE POLICY "Trainers can manage their created nutrition plans" 
  ON public.nutrition_plans FOR ALL 
  USING (auth.uid() = trainer_id);

CREATE POLICY "Clients can view their assigned nutrition plans" 
  ON public.nutrition_plans FOR SELECT 
  USING (auth.uid() = client_id);

-- Policies for nutrition_plan_meals
CREATE POLICY "Trainers can manage meals for their plans" 
  ON public.nutrition_plan_meals FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_plans np 
      WHERE np.id = plan_id AND np.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view meals for their plans" 
  ON public.nutrition_plan_meals FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_plans np 
      WHERE np.id = plan_id AND np.client_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION moddatetime (updated_at);

-- Publication for realtime (for instant sync)
ALTER PUBLICATION supabase_realtime ADD TABLE nutrition_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE nutrition_plan_meals;
