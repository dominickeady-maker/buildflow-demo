/*
# Create site_workers table for direct worker-to-site assignment

## Purpose
Managers need to assign workers to sites directly (not only via tasks).
This table stores the many-to-many relationship between workers and sites,
scoped by organization_id for RLS.

## New Table
- `site_workers`
  - id (uuid, primary key)
  - site_id (uuid, references sites, cascade delete)
  - worker_id (uuid, references profiles, cascade delete)
  - organization_id (uuid, defaults to current_org_id(), for RLS scoping)
  - created_at (timestamptz, default now())
  - UNIQUE constraint on (site_id, worker_id) to prevent duplicates

## Security
- RLS enabled
- SELECT: users can see assignments in their own org
- INSERT: managers can assign workers in their own org
- DELETE: managers can unassign workers in their own org
- UPDATE: not needed (the relationship is either there or not)
*/

CREATE TABLE IF NOT EXISTS site_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid DEFAULT current_org_id(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (site_id, worker_id)
);

ALTER TABLE site_workers ENABLE ROW LEVEL SECURITY;

ALTER TABLE site_workers ALTER COLUMN organization_id SET DEFAULT current_org_id();

DROP POLICY IF EXISTS "Users view org site assignments" ON site_workers;
CREATE POLICY "Users view org site assignments"
ON site_workers FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Managers assign workers to sites" ON site_workers;
CREATE POLICY "Managers assign workers to sites"
ON site_workers FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
);

DROP POLICY IF EXISTS "Managers unassign workers from sites" ON site_workers;
CREATE POLICY "Managers unassign workers from sites"
ON site_workers FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
);
