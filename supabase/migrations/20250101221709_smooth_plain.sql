/*
  # Add drawing column to cuts table

  1. Changes
    - Add `drawing` column to `cuts` table for storing Base64 encoded images
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cuts' AND column_name = 'drawing'
  ) THEN
    ALTER TABLE cuts ADD COLUMN drawing TEXT;
  END IF;
END $$;