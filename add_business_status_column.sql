-- Add status column to businesses table for business submissions
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);

-- Update existing businesses to have 'approved' status (since they're already in the system)
UPDATE businesses SET status = 'approved' WHERE status IS NULL;