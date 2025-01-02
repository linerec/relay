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

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cuts' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE cuts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 기존 RLS 정책 유지

-- Allow collaborators to update and delete cuts
CREATE POLICY "Collaborators can update cuts"
  ON cuts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comics
      WHERE comics.id = cuts.comic_id
      AND (comics.owner_id = auth.uid() 
           OR comics.collaborators @> ARRAY[auth.uid()]::uuid[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comics
      WHERE comics.id = cuts.comic_id
      AND (comics.owner_id = auth.uid() 
           OR comics.collaborators @> ARRAY[auth.uid()]::uuid[])
    )
  );

CREATE POLICY "Collaborators can delete cuts"
  ON cuts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comics
      WHERE comics.id = cuts.comic_id
      AND (comics.owner_id = auth.uid() 
           OR comics.collaborators @> ARRAY[auth.uid()]::uuid[])
    )
  );