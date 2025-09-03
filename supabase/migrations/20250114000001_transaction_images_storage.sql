/*
  # Transaction Images Storage Setup
  
  Creates a bucket for storing transaction images (expenses and income receipts/attachments)
  with proper RLS policies.
*/

-- Create transaction-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction-images',
  'transaction-images', 
  true,
  2097152, -- 2MB in bytes (124x124 images should be very small)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for transaction images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own transaction images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own transaction images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own transaction images" ON storage.objects;

-- Policy 1: Allow public read access to transaction images
CREATE POLICY "Public read access for transaction images" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'transaction-images');

-- Policy 2: Allow authenticated users to upload their own transaction images
CREATE POLICY "Users can upload own transaction images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'transaction-images' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
);

-- Policy 3: Allow authenticated users to update their own transaction images  
CREATE POLICY "Users can update own transaction images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'transaction-images' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
)
WITH CHECK (
  bucket_id = 'transaction-images' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
);

-- Policy 4: Allow authenticated users to delete their own transaction images
CREATE POLICY "Users can delete own transaction images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
  bucket_id = 'transaction-images' 
  AND name ~ ('^' || auth.uid()::text || '-.*')
);
