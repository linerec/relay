/*
  # Create Cuts Table and Security Policies

  1. New Tables
    - `cuts`
      - `id` (uuid, primary key)
      - `comic_id` (uuid, references comics)
      - `order_index` (integer)
      - `storyboard_text` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `cuts` table
    - Policies:
      - Everyone can view cuts
      - Only comic owners can create/update/delete cuts
*/

CREATE TABLE cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comic_id UUID NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  storyboard_text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cuts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Cuts are viewable by everyone"
  ON cuts
  FOR SELECT
  USING (true);

CREATE POLICY "Comic owners can insert cuts"
  ON cuts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comics
      WHERE comics.id = cuts.comic_id
      AND comics.owner_id = auth.uid()
    )
  );

CREATE POLICY "Comic owners can update cuts"
  ON cuts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comics
      WHERE comics.id = cuts.comic_id
      AND comics.owner_id = auth.uid()
    )
  );

CREATE POLICY "Comic owners can delete cuts"
  ON cuts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comics
      WHERE comics.id = cuts.comic_id
      AND comics.owner_id = auth.uid()
    )
  );