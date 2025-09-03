/*
  # Fix Supabase Authentication Setup

  This migration ensures proper authentication configuration and removes any
  problematic triggers that might interfere with user signup.
*/

-- Drop any existing problematic triggers first
DROP TRIGGER IF EXISTS create_default_categories_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_default_categories();

-- Ensure auth schema exists and is properly configured
-- (This is usually handled by Supabase, but let's make sure)

-- Create a simple function to handle post-signup category creation
-- This will be called from the client side instead of a trigger
CREATE OR REPLACE FUNCTION create_user_default_categories(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (name, color, user_id) VALUES
    ('Food', '#ef4444', user_id),
    ('Housing', '#3b82f6', user_id),
    ('Insurance', '#8b5cf6', user_id),
    ('Transport', '#10b981', user_id),
    ('Sports', '#f59e0b', user_id),
    ('Fun', '#ec4899', user_id),
    ('Other', '#6b7280', user_id)
  ON CONFLICT (name, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_default_categories(uuid) TO authenticated;