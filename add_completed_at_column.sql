-- Add completed_at column to mapmissions table
-- This column tracks when a mission was ended/completed

ALTER TABLE mapmissions ADD COLUMN completed_at TIMESTAMP;