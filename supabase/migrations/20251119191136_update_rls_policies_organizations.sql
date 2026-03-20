/*
  # Update RLS Policies for Multi-Tenancy
  
  Updates all table policies to filter by organization_id
  ensuring complete data isolation between customers
*/

-- Organization policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Tasks policies with organization filter
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can update tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON tasks;
DROP POLICY IF EXISTS "Managers can insert tasks in their organization" ON tasks;
DROP POLICY IF EXISTS "Managers can update tasks in their organization" ON tasks;
DROP POLICY IF EXISTS "Managers can delete tasks in their organization" ON tasks;

CREATE POLICY "Users view org tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers insert org tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers update org tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers delete org tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Materials policies
DROP POLICY IF EXISTS "Users can view materials" ON materials;
DROP POLICY IF EXISTS "Workers can insert materials" ON materials;
DROP POLICY IF EXISTS "Managers can update materials" ON materials;
DROP POLICY IF EXISTS "Users can view materials in their organization" ON materials;
DROP POLICY IF EXISTS "Workers can insert materials in their organization" ON materials;
DROP POLICY IF EXISTS "Managers can update materials in their organization" ON materials;

CREATE POLICY "Users view org materials"
  ON materials FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users insert org materials"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers update org materials"
  ON materials FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Sites policies
DROP POLICY IF EXISTS "Users can view sites" ON sites;
DROP POLICY IF EXISTS "Managers can insert sites" ON sites;
DROP POLICY IF EXISTS "Managers can update sites" ON sites;
DROP POLICY IF EXISTS "Managers can delete sites" ON sites;
DROP POLICY IF EXISTS "Users can view sites in their organization" ON sites;
DROP POLICY IF EXISTS "Managers can insert sites in their organization" ON sites;
DROP POLICY IF EXISTS "Managers can update sites in their organization" ON sites;
DROP POLICY IF EXISTS "Managers can delete sites in their organization" ON sites;

CREATE POLICY "Users view org sites"
  ON sites FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers insert org sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers update org sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Managers delete org sites"
  ON sites FOR DELETE
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Timesheets policies (uses worker_id not user_id)
DROP POLICY IF EXISTS "Workers can view own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Managers can view all timesheets" ON timesheets;
DROP POLICY IF EXISTS "Workers can insert own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Workers can update own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Managers can update timesheets" ON timesheets;
DROP POLICY IF EXISTS "Workers can view own timesheets in organization" ON timesheets;
DROP POLICY IF EXISTS "Managers can view all timesheets in organization" ON timesheets;
DROP POLICY IF EXISTS "Workers can insert own timesheets in organization" ON timesheets;
DROP POLICY IF EXISTS "Workers can update own timesheets in organization" ON timesheets;
DROP POLICY IF EXISTS "Managers can update timesheets in organization" ON timesheets;

CREATE POLICY "Workers view own org timesheets"
  ON timesheets FOR SELECT
  TO authenticated
  USING (
    worker_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers view all org timesheets"
  ON timesheets FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

CREATE POLICY "Workers insert own org timesheets"
  ON timesheets FOR INSERT
  TO authenticated
  WITH CHECK (
    worker_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Workers update own org timesheets"
  ON timesheets FOR UPDATE
  TO authenticated
  USING (
    worker_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    worker_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers update org timesheets"
  ON timesheets FOR UPDATE
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'))
  WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'manager'));

-- Photos policies
DROP POLICY IF EXISTS "Users can view own photos" ON construction_photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON construction_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON construction_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON construction_photos;
DROP POLICY IF EXISTS "Users can view photos in their organization" ON construction_photos;
DROP POLICY IF EXISTS "Users can insert photos in their organization" ON construction_photos;
DROP POLICY IF EXISTS "Users can update own photos in organization" ON construction_photos;
DROP POLICY IF EXISTS "Users can delete own photos in organization" ON construction_photos;

CREATE POLICY "Users view org photos"
  ON construction_photos FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users insert org photos"
  ON construction_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users update own org photos"
  ON construction_photos FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users delete own org photos"
  ON construction_photos FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Photo reports policies
DROP POLICY IF EXISTS "Users can view own reports" ON photo_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON photo_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON photo_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON photo_reports;
DROP POLICY IF EXISTS "Users can view reports in their organization" ON photo_reports;
DROP POLICY IF EXISTS "Users can insert reports in their organization" ON photo_reports;
DROP POLICY IF EXISTS "Users can update own reports in organization" ON photo_reports;
DROP POLICY IF EXISTS "Users can delete own reports in organization" ON photo_reports;

CREATE POLICY "Users view org reports"
  ON photo_reports FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users insert org reports"
  ON photo_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users update own org reports"
  ON photo_reports FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users delete own org reports"
  ON photo_reports FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );
