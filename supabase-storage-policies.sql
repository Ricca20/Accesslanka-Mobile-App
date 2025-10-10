-- =====================================================
-- Supabase Storage Policies for AccessLanka Mobile App
-- =====================================================
-- Run these policies in Supabase Dashboard → Storage → [Bucket] → Policies
-- Or execute via SQL Editor

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Everyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- BUSINESS-PHOTOS BUCKET POLICIES
-- =====================================================

-- Policy: Authenticated users can upload business photos
CREATE POLICY "Authenticated users can upload business photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-photos');

-- Policy: Users can update business photos
CREATE POLICY "Users can update business photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-photos');

-- Policy: Users can delete business photos
CREATE POLICY "Users can delete business photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-photos');

-- Policy: Everyone can view business photos (public bucket)
CREATE POLICY "Business photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-photos');

-- =====================================================
-- ACCESSIBILITY-PHOTOS BUCKET POLICIES
-- =====================================================

-- Policy: Authenticated users can upload accessibility photos
CREATE POLICY "Authenticated users can upload accessibility photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'accessibility-photos');

-- Policy: Users can update accessibility photos
CREATE POLICY "Users can update accessibility photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'accessibility-photos');

-- Policy: Users can delete accessibility photos
CREATE POLICY "Users can delete accessibility photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'accessibility-photos');

-- Policy: Everyone can view accessibility photos (public bucket)
CREATE POLICY "Accessibility photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'accessibility-photos');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('avatars', 'business-photos', 'accessibility-photos');

-- =====================================================
-- CLEANUP QUERIES (Optional - Use with caution!)
-- =====================================================

-- Remove all policies for avatars bucket (if you need to recreate)
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- Remove all policies for business-photos bucket
DROP POLICY IF EXISTS "Authenticated users can upload business photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update business photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete business photos" ON storage.objects;
DROP POLICY IF EXISTS "Business photos are publicly accessible" ON storage.objects;

-- Remove all policies for accessibility-photos bucket
DROP POLICY IF EXISTS "Authenticated users can upload accessibility photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update accessibility photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete accessibility photos" ON storage.objects;
DROP POLICY IF EXISTS "Accessibility photos are publicly accessible" ON storage.objects;

-- =====================================================
-- DATA CLEANUP QUERIES (Clean up old local URIs)
-- =====================================================

-- Find and clean up users with local URIs
SELECT id, email, avatar_url 
FROM users 
WHERE avatar_url LIKE 'file://%';

-- Reset avatar URLs (users will need to re-upload)
UPDATE users 
SET avatar_url = NULL 
WHERE avatar_url LIKE 'file://%';

-- Find businesses with local image URIs
SELECT id, name, images 
FROM businesses 
WHERE images::text LIKE '%file://%';

-- Reset business images (use proper PostgreSQL array syntax)
UPDATE businesses 
SET images = ARRAY[]::text[] 
WHERE images::text LIKE '%file://%';

-- Find accessibility photos with local URIs
SELECT id, photo_url, photo_path, user_id, created_at 
FROM accessibility_photos 
WHERE photo_url LIKE 'file://%';

-- Delete invalid accessibility photos
DELETE FROM accessibility_photos 
WHERE photo_url LIKE 'file://%';

-- =====================================================
-- STORAGE STATISTICS
-- =====================================================

-- Check storage usage by bucket
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size
FROM storage.objects
WHERE bucket_id IN ('avatars', 'business-photos', 'accessibility-photos')
GROUP BY bucket_id
ORDER BY bucket_id;

-- List recent uploads
SELECT 
  bucket_id,
  name,
  created_at,
  pg_size_pretty(COALESCE((metadata->>'size')::bigint, 0)) as file_size
FROM storage.objects
WHERE bucket_id IN ('avatars', 'business-photos', 'accessibility-photos')
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================
-- END OF STORAGE POLICIES
-- =====================================================
