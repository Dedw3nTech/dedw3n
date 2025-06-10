-- Add missing is_flagged column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;