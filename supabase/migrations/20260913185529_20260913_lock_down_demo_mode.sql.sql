/*
# Lock down demo mode — block deletes and uploads for demo accounts

## Purpose
The public demo (advertised via QR code) uses two shared accounts:
- manager@buildflowdemo.com (auth uid: 923b1109-85c9-402f-a443-3c88588a60ec)
- worker@buildflowdemo.com   (auth uid: 91fcdfdd-d9d0-42d7-a837-df84fb34ebc2)

Anyone with the link can sign in as these accounts. We must prevent:
1. Photo uploads (storage INSERT into construction-photos bucket + INSERT into construction_photos table)
2. Drawing uploads (storage INSERT into drawings bucket + INSERT into drawings table)
3. All DELETEs on every table (tasks, sites, profiles, materials, drawings, construction_photos, timesheets, trades, photo_reports)

## Changes
1. New function: `public.is_demo_user()` — returns true when auth.uid() matches one of the two demo account UUIDs.
2. Every DELETE policy on every table: AND NOT public.is_demo_user()
3. INSERT policies on construction_photos and drawings tables: AND NOT public.is_demo_user()
4. Storage policies on construction-photos and drawings buckets:
   - INSERT (upload): AND NOT public.is_demo_user()
   - DELETE: AND NOT public.is_demo_user()
   - SELECT (view): unchanged (demo users can still view seeded content)

## Tables affected
- construction_photos, drawings, tasks, sites, profiles, materials, timesheets, trades, photo_reports

## What stays working
- SELECT on all tables (demo users see everything)
- UPDATE on all tables (start/complete tasks, update statuses)
- INSERT on tasks, sites, materials, messages, timesheets, profiles (creating things works)
- Storage SELECT (viewing photos and drawings)
*/
CREATE OR REPLACE FUNCTION public.is_demo_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IN (
    '923b1109-85c9-402f-a443-3c88588a60ec',  -- manager@buildflowdemo.com
    '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2'   -- worker@buildflowdemo.com
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_demo_user() TO authenticated, anon;

-- ============================================================
-- construction_photos: block DELETE and INSERT for demo users
-- ============================================================
DROP POLICY IF EXISTS "Org members can delete org photos" ON construction_photos;
CREATE POLICY "Org members can delete org photos"
  ON construction_photos FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Users insert org photos" ON construction_photos;
CREATE POLICY "Users insert org photos"
  ON construction_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- drawings: block DELETE and INSERT for demo users
-- ============================================================
DROP POLICY IF EXISTS "Managers can delete drawings" ON drawings;
CREATE POLICY "Managers can delete drawings"
  ON drawings FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Managers can insert drawings" ON drawings;
CREATE POLICY "Managers can insert drawings"
  ON drawings FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- tasks: block DELETE for demo users
-- ============================================================
DROP POLICY IF EXISTS "Managers delete org tasks" ON tasks;
CREATE POLICY "Managers delete org tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- sites: block DELETE for demo users
-- ============================================================
DROP POLICY IF EXISTS "Managers delete org sites" ON sites;
CREATE POLICY "Managers delete org sites"
  ON sites FOR DELETE
  TO authenticated
  USING (
    organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- profiles: block DELETE for demo users
-- ============================================================
DROP POLICY IF EXISTS "Managers can delete profiles" ON profiles;
CREATE POLICY "Managers can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- materials: block DELETE for demo users
-- ============================================================
DROP POLICY IF EXISTS "Managers can delete material requests" ON materials;
CREATE POLICY "Managers can delete material requests"
  ON materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- timesheets: block DELETE for demo users
-- ============================================================
DROP POLICY IF EXISTS "Managers can delete timesheets" ON timesheets;
CREATE POLICY "Managers can delete timesheets"
  ON timesheets FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- trades: block DELETE for demo users
-- ============================================================
DROP POLICY IF EXISTS "Managers can delete trades" ON trades;
CREATE POLICY "Managers can delete trades"
  ON trades FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'manager')
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- photo_reports: block DELETE and INSERT for demo users
-- ============================================================
DROP POLICY IF EXISTS "Users delete own org reports" ON photo_reports;
CREATE POLICY "Users delete own org reports"
  ON photo_reports FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Users insert org reports" ON photo_reports;
CREATE POLICY "Users insert org reports"
  ON photo_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT profiles.organization_id FROM profiles WHERE profiles.id = auth.uid())
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- Storage: construction-photos bucket — block upload + delete for demo users
-- ============================================================
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'construction-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'construction-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND NOT public.is_demo_user()
  );

-- ============================================================
-- Storage: drawings bucket — block upload + delete for demo users
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can upload drawings" ON storage.objects;
CREATE POLICY "Authenticated users can upload drawings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'drawings'
    AND NOT public.is_demo_user()
  );

DROP POLICY IF EXISTS "Authenticated users can delete drawings" ON storage.objects;
CREATE POLICY "Authenticated users can delete drawings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'drawings'
    AND NOT public.is_demo_user()
  );
