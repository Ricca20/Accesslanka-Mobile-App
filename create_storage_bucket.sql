-- Simple SQL Script to Create Storage Bucket
-- Copy and paste this into your Supabase SQL Editor

-- Create the accessibility-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accessibility-photos',
  'accessibility-photos', 
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Note: Policies will be managed through the dashboard for easier setup