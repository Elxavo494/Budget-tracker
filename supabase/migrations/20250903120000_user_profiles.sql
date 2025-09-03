/*
  # Add User Profiles Table

  1. New Table
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text, optional)
      - `avatar_url` (text, optional)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on profiles table
    - Add policies for users to manage their own profile
    - Users can only access their own profile data

  3. Function and Trigger
    - Auto-create profile when user signs up
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Function to create default profile for new users
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, updated_at) VALUES (NEW.id, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default profile when user signs up
CREATE OR REPLACE TRIGGER create_default_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_profile();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
