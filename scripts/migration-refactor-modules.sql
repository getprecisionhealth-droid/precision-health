-- Migration to support Multi-Tier Hierarchy and Refactored Modules

-- 1. Workout Engine: Grouping (Circuits/Cluster Sets)
ALTER TABLE workout_plan_exercises 
ADD COLUMN IF NOT EXISTS group_name TEXT;

-- 2. Nutrition Module: Narrative planning
ALTER TABLE nutrition_plan_meals 
ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. Nutrition Logs: Free text entry
ALTER TABLE nutrition_logs 
ADD COLUMN IF NOT EXISTS content TEXT;
