/*
  # Add email column to profiles table

  1. Changes
    - Add email column to profiles table
    - Update RLS policies to include email field
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Update email from auth.users when profile is created
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET email = (SELECT email FROM auth.users WHERE id = NEW.id)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_email_trigger ON profiles;

CREATE TRIGGER sync_profile_email_trigger
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_email();