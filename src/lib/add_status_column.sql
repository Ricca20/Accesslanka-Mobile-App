-- Add status column to businesses table for business submission workflow
-- This should be run in your Supabase SQL editor

-- Add status column if it doesn't exist
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected', 'verified'));

-- Create index for status column for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);

-- Update existing businesses to have 'approved' status by default (they were already in the system)
UPDATE businesses 
SET status = 'approved' 
WHERE status IS NULL;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name = 'status';