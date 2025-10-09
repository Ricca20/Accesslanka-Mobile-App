-- Create Supabase Storage Bucket for Accessibility Photos
-- Run this in your Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accessibility-photos',
  'accessibility-photos', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create storage policies for the bucket

-- Policy: Anyone can view photos (since bucket is public)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'accessibility-photos');

-- Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload accessibility photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'accessibility-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update own accessibility photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'accessibility-photos' 
  AND auth.uid()::text = (storage.foldername(name))[4] -- Extract user_id from path
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own accessibility photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'accessibility-photos' 
  AND auth.uid()::text = (storage.foldername(name))[4] -- Extract user_id from path
);

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;