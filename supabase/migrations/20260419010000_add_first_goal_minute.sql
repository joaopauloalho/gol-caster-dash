-- Add first_goal_minute to predictions (null=not answered, 0=predicted no goals, 1-90=minute)
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS first_goal_minute INTEGER;

-- Add result column to matches (null=no goals scored, 1-90=minute of first goal)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS result_first_goal_minute INTEGER;
