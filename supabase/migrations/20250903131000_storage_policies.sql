/*
  # Storage Setup for Avatars
  
  Note: Storage policies need to be created through the Supabase Dashboard
  due to permission restrictions in SQL editor.
  
  This migration only creates the bucket. 
  Policies must be set up manually in Dashboard > Storage > Policies.
*/

-- Ensure the avatars bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
