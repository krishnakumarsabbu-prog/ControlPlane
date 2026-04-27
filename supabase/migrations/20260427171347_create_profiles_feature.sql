/*
  # Create Profiles Feature

  Adds support for grouping projects into named profiles so users can start/stop
  groups of related projects together.

  ## New Tables

  ### profiles
  - `id` (uuid, PK) - unique identifier
  - `name` (text) - profile display name
  - `color` (text) - hex color for visual identification
  - `created_at` (timestamptz) - creation timestamp

  ### profile_projects
  - `id` (uuid, PK) - unique identifier
  - `profile_id` (uuid, FK -> profiles.id) - profile this entry belongs to
  - `project_id` (text) - backend project ID
  - `created_at` (timestamptz) - when the project was added to the profile

  ## Security
  - RLS enabled on both tables
  - Profiles and profile_projects are currently accessible to all authenticated users
    (shared workspace model — all team members can manage profiles)

  ## Notes
  1. project_id is text (not UUID) because it references the backend Node.js process manager, not a Supabase table
  2. ON DELETE CASCADE on profile_projects ensures orphaned rows are cleaned up when a profile is deleted
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#22c55e',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, project_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view profile_projects"
  ON profile_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert profile_projects"
  ON profile_projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete profile_projects"
  ON profile_projects FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_profile_projects_profile_id ON profile_projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_projects_project_id ON profile_projects(project_id);
