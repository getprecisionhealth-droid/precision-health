-- ─── Nutrition Logs Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES auth.users(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')) NOT NULL,
  food_name TEXT NOT NULL,
  calories INT,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast client+date lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_client_date ON nutrition_logs(client_id, log_date DESC);

-- Enable RLS
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own logs
CREATE POLICY "Clients can manage own nutrition logs"
  ON nutrition_logs FOR ALL
  USING (client_id = auth.uid() OR logged_by = auth.uid())
  WITH CHECK (client_id = auth.uid() OR logged_by = auth.uid());

-- Trainers can read logs for their linked clients
CREATE POLICY "Trainers can read client nutrition logs"
  ON nutrition_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trainer_clients
      WHERE trainer_clients.client_id = nutrition_logs.client_id
        AND trainer_clients.trainer_id = auth.uid()
        AND trainer_clients.status = 'active'
    )
  );

-- Enable realtime for nutrition_logs
ALTER PUBLICATION supabase_realtime ADD TABLE nutrition_logs;
