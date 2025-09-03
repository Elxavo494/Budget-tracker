/*
  # Fix profiles trigger/policies for signup

  - Ensure the profile creation trigger can insert despite RLS by allowing the
    `service_role` to insert into `profiles`.
  - Harden the trigger function with an explicit search_path.
*/

-- Recreate function with explicit search_path to avoid schema resolution issues
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, updated_at)
  VALUES (NEW.id, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Allow the service role (used by GoTrue) to insert into profiles during signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles"
      ON public.profiles FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Ensure trigger exists and points to the updated function
DROP TRIGGER IF EXISTS create_default_profile_trigger ON auth.users;
CREATE TRIGGER create_default_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_profile();


