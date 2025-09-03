/*
  # Avatar Storage Setup

  This migration creates the storage bucket for avatars.
  Storage policies need to be created through the Supabase Dashboard
  or using the storage-specific SQL functions.

  1. Storage Bucket
    - Create 'avatars' bucket for user profile pictures
    - Set up public access for avatars
    - Configure file size and type restrictions

  Note: Storage policies should be created via the Supabase Dashboard
  under Storage > Policies, not through direct SQL migration.
*/

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
