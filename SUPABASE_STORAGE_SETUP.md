# Create Supabase Storage Bucket - Dashboard Method

Since you're getting a "Bucket not found" error, you need to create the storage bucket in your Supabase project.

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create a new bucket"

3. **Create the Bucket**
   - **Bucket name**: `accessibility-photos`
   - **Public bucket**: ✅ Enable (so photos can be viewed publicly)
   - **File size limit**: `50 MB` (optional)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp` (optional)

4. **Set Bucket Policies**
   - After creating the bucket, click on it
   - Go to "Policies" tab
   - Create these policies:

   **Policy 1: Allow authenticated users to upload**
   ```sql
   CREATE POLICY "Authenticated users can upload" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'accessibility-photos' 
     AND auth.role() = 'authenticated'
   );
   ```

   **Policy 2: Users can update their own photos**
   ```sql
   CREATE POLICY "Users can update own photos" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'accessibility-photos' 
     AND auth.uid()::text = (storage.foldername(name))[4]
   );
   ```

   **Policy 3: Users can delete their own photos**
   ```sql
   CREATE POLICY "Users can delete own photos" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'accessibility-photos' 
     AND auth.uid()::text = (storage.foldername(name))[4]
   );
   ```

## Method 2: Using SQL Editor

1. Go to SQL Editor in your Supabase dashboard
2. Run this command:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accessibility-photos',
  'accessibility-photos', 
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);
```

3. Then create the policies using the SQL commands above.

## Verify Bucket Creation

After creating the bucket, you should see:
- ✅ `accessibility-photos` bucket in your Storage section
- ✅ Public access enabled
- ✅ Upload policies configured for authenticated users

## Test the Fix

1. Create the bucket using either method above
2. Restart your Expo app
3. Try taking/uploading a photo in the AccessibilityContribution screen
4. The upload should now work without the "Bucket not found" error

## Troubleshooting

If you still get errors after creating the bucket:
- Double-check the bucket name is exactly `accessibility-photos`
- Ensure the bucket is set to public
- Verify your Supabase URL and keys are correct in your app
- Check that you're using the correct Supabase project

The bucket creation is a one-time setup. Once created, all users will be able to upload accessibility photos during MapMissions! 📸