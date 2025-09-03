-- Storage Policies for Avatar Upload
-- Run this in your Supabase SQL Editor

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Policy 1: Allow public read access to avatars
CREATE POLICY "Public read access for avatars" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'avatars');

-- Policy 2: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatars" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
);

-- Policy 3: Allow authenticated users to update their own avatars  
CREATE POLICY "Users can update own avatars" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
);

-- Policy 4: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatars" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
);

-- Verify policies were created
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
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
