-- Manual sync script for business verification status
-- Run this SQL script in your Supabase SQL editor to update existing businesses
-- that have active MapMissions but aren't marked as verified yet

-- Update businesses that have active MapMissions to verified status
UPDATE businesses 
SET 
  status = 'verified',
  verified = true,
  verification_method = 'mapmission',
  verified_at = NOW()
WHERE businesses.id IN (
  SELECT DISTINCT m.business_id 
  FROM mapmissions m 
  WHERE m.status IN ('active', 'completed')
  AND m.business_id IS NOT NULL
)
AND businesses.status != 'verified';

-- Show the results of the update
SELECT 
  b.id,
  b.name,
  b.status,
  b.verified,
  b.verification_method,
  b.verified_at,
  COUNT(m.id) as mission_count
FROM businesses b
LEFT JOIN mapmissions m ON b.id = m.business_id AND m.status IN ('active', 'completed')
WHERE b.status = 'verified'
GROUP BY b.id, b.name, b.status, b.verified, b.verification_method, b.verified_at
ORDER BY b.verified_at DESC;