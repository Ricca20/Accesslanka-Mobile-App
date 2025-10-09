-- Update businesses table status constraint to allow 'verified' status
-- Run this in your Supabase SQL editor to update the existing constraint

-- First, drop the existing constraint
ALTER TABLE businesses DROP CONSTRAINT businesses_status_check;

-- Add the updated constraint that includes 'verified'
ALTER TABLE businesses 
ADD CONSTRAINT businesses_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'verified'));