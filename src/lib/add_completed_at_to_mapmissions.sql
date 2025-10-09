-- Add completed_at column to mapmissions table
-- Run this SQL script in your Supabase SQL editor

-- Add completed_at column (run this manually if column doesn't exist)
-- ALTER TABLE mapmissions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on completed_at queries
CREATE INDEX IF NOT EXISTS idx_mapmissions_completed_at ON mapmissions(completed_at);