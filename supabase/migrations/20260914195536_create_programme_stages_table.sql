/*
# Create programme_stages table

## Purpose
Each site gets a Programme — a project timeline showing the major stages
of the job (groundworks, foundations, superstructure, roof, etc.) plotted
against a date axis. This is separate from the day-to-day Tasks list.
Managers can add/edit/reorder/delete stages and drag bars to adjust dates.
Workers get read-only access.

## New Table: programme_stages
- id (uuid, primary key)
- organization_id (uuid, references organizations) — for RLS scoping
- site_id (uuid, references sites, ON DELETE CASCADE)
- name (text) — editable stage name, e.g. "Groundworks"
- start_date (date) — when the stage begins
- end_date (date) — when the stage should finish
- percent_complete (integer, 0–100, default 0)
- sort_order (integer, default 0) — for reordering stages
- created_at (timestamptz)
- updated_at (timestamptz)

## Security
- RLS enabled
- SELECT: all authenticated users in the same org can view
- INSERT/UPDATE/DELETE: managers in the same org only
- DELETE blocked for demo users (AND NOT public.is_demo_user())
- UPDATE blocked for demo users (AND NOT public.is_demo_user()) so demo
  visitors can't drag bars or change progress
*/

CREATE TABLE IF NOT EXISTS programme_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  percent_complete integer NOT NULL DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programme_stages_site_id ON programme_stages(site_id);
CREATE INDEX IF NOT EXISTS idx_programme_stages_org_id ON programme_stages(organization_id);

ALTER TABLE programme_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view org programme stages" ON programme_stages;
CREATE POLICY "Users view org programme stages"
  ON programme_stages FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Managers insert org programme stages" ON programme_stages;
CREATE POLICY "Managers insert org programme stages"
  ON programme_stages FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Managers update org programme stages" ON programme_stages;
CREATE POLICY "Managers update org programme stages"
  ON programme_stages FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  )
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Managers delete org programme stages" ON programme_stages;
CREATE POLICY "Managers delete org programme stages"
  ON programme_stages FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- updated_at trigger
DROP TRIGGER IF EXISTS update_programme_stages_updated_at ON programme_stages;
CREATE TRIGGER update_programme_stages_updated_at BEFORE UPDATE ON programme_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();