/*
# Create programme_milestones table — replaces programme_stages

## Purpose
Each site gets a Programme of Works: a list of milestones with target dates,
actual dates, derived status, and optional notes. This is the contracts-manager
view of the job — the big picture of what's done and what's coming, not the
day-to-day task list.

## New Table: programme_milestones
- id (uuid, primary key)
- organization_id (uuid, references organizations) — for RLS scoping
- site_id (uuid, references sites, ON DELETE CASCADE)
- milestone_name (text) — e.g. "Foundations dug" or a custom name
- sort_order (integer, default 0) — for reordering
- target_date (date, nullable) — null means TBC
- actual_date (date, nullable) — blank until the milestone is done
- notes (text, default '') — optional one-line note
- created_at (timestamptz)
- updated_at (timestamptz)

## Old table: programme_stages
Dropped — replaced entirely by programme_milestones. The old table had
start_date, end_date, percent_complete which don't map to the new model.

## Security
- RLS enabled
- SELECT: all authenticated users in the same org
- INSERT/UPDATE/DELETE: managers in the same org only, blocked for demo users
*/

DROP TABLE IF EXISTS programme_stages CASCADE;

CREATE TABLE IF NOT EXISTS programme_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  target_date date,
  actual_date date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programme_milestones_site_id ON programme_milestones(site_id);
CREATE INDEX IF NOT EXISTS idx_programme_milestones_org_id ON programme_milestones(organization_id);

ALTER TABLE programme_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view org programme milestones" ON programme_milestones;
CREATE POLICY "Users view org programme milestones"
  ON programme_milestones FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Managers insert org programme milestones" ON programme_milestones;
CREATE POLICY "Managers insert org programme milestones"
  ON programme_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Managers update org programme milestones" ON programme_milestones;
CREATE POLICY "Managers update org programme milestones"
  ON programme_milestones FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  )
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Managers delete org programme milestones" ON programme_milestones;
CREATE POLICY "Managers delete org programme milestones"
  ON programme_milestones FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- updated_at trigger
DROP TRIGGER IF EXISTS update_programme_milestones_updated_at ON programme_milestones;
CREATE TRIGGER update_programme_milestones_updated_at BEFORE UPDATE ON programme_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();