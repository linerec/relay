/*
  # Create Comics Table and Security Policies

  1. New Tables
    - `comics`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `owner_id` (uuid, references auth.users)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `comics` table
    - Policies:
      - Everyone can view comics
      - Only authenticated users can create comics
      - Only owners can update their comics
      - Only owners can delete their comics
*/

-- Create comics table
CREATE TABLE comics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to read comics
CREATE POLICY "Comics are viewable by everyone"
  ON comics
  FOR SELECT
  USING (true);

-- Allow authenticated users to create comics
CREATE POLICY "Authenticated users can create comics"
  ON comics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Allow owners to update their comics
CREATE POLICY "Users can update their own comics"
  ON comics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow owners to delete their comics
CREATE POLICY "Users can delete their own comics"
  ON comics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);