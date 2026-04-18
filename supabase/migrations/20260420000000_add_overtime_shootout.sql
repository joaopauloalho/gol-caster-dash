-- Add knockout-round prediction fields to predictions
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS has_overtime BOOLEAN;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS has_shootout BOOLEAN;

-- Add result columns to matches (only relevant for knockout stages)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS result_overtime BOOLEAN;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS result_shootout BOOLEAN;
