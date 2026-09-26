/*
# Lock down organisation membership — server-enforced tenancy

## Summary
Organisation membership is currently client-controlled: any authenticated
user can see every profile in every org, insert their own profile with an
arbitrary organisation_id, and change their own organisation_id or role
via the data API. This migration moves all tenancy control to the server.

## Changes

### 1. profiles SELECT policy — scoped to same org only
- DROPPED: "Authenticated users can view all profiles" (USING true —
  every authenticated user saw every profile across all orgs).
- CREATED: "Users view profiles in own org" — returns only profiles whose
  organization_id matches the caller's own profile.organization_id.

### 2. profiles INSERT policy — clients can no longer create profiles
- DROPPED: "Users can insert their own profile" (allowed self-insert
  with arbitrary organisation_id). Profile provisioning will move to a
  SECURITY DEFINER function in a later task.

### 3. profiles UPDATE — guard organisation_id and role via trigger
- KEPT: "Users can update their own profile" policy (auth.uid() = id).
- ADDED: BEFORE UPDATE trigger "guard_profile_tenancy" that raises an
  exception if organisation_id or role is changed, UNLESS the session
  user is the table owner (postgres) — which is the case when a
  SECURITY DEFINER function owned by postgres performs the update.
- This means clients can still update their own display fields
  (full_name, email, updated_at) but cannot change tenancy or role.

### 4. organizations SELECT — already correct, kept as-is
- The existing policy "Users can view their organization" already
  scopes to the caller's own organization_id. No change needed.

### 5. current_org_active() helper + org-active gating on SELECT policies
- CREATED: SQL function current_org_active() that looks up the caller's
  organization_id from profiles and returns organizations.active for it.
  Returns false if the caller has no profile or no organisation.
- MODIFIED SELECT policies on sites, tasks, timesheets, materials,
  construction_photos, and messages to AND current_org_active() into
  the existing USING predicate, so a deactivated org returns no rows.
  - For tables with both a broad "Authenticated users can view *"
    policy (USING true) and an org-scoped policy, the broad policy is
    DROPPED so only the org-scoped + active-org policy remains.
  - For timesheets, the manager "view all org timesheets" and worker
    "view own org timesheets" policies get the active-org guard; the
    legacy "Workers can view their own timesheets" (worker_id only,
    no org check) is dropped in favour of the org-scoped version.

## Policies dropped
1. "Authenticated users can view all profiles" (profiles SELECT)
2. "Users can insert their own profile" (profiles INSERT)
3. "Authenticated users can view sites" (sites SELECT — broad, USING true)
4. "Authenticated users can view tasks" (tasks SELECT — broad, USING true)
5. "Authenticated users can view materials" (materials SELECT — broad, USING true)
6. "Workers can view their own timesheets" (timesheets SELECT — no org check)

## Policies created
1. "Users view profiles in own org" (profiles SELECT)
2. "Users view org sites active" (sites SELECT, replaces #3)
3. "Users view org tasks active" (tasks SELECT, replaces #4)
4. "Users view org materials active" (materials SELECT, replaces #5)
5. "Managers view org timesheets active" (timesheets SELECT, replaces manager variant)
6. "Workers view own org timesheets active" (timesheets SELECT, replaces #6)
7. "Users view org photos active" (construction_photos SELECT, replaces existing)
8. "Users view org messages active" (messages SELECT, replaces existing)

## Functions created
1. current_org_active() — STABLE, SECURITY DEFINER, returns boolean

## Triggers created
1. guard_profile_tenancy — BEFORE UPDATE ON profiles, blocks
   organisation_id/role changes by non-owner sessions.

## Important notes
1. The trigger checks `session_user = (table owner)` to allow
   SECURITY DEFINER functions owned by postgres to change tenancy.
   Client-initiated updates (which run as the authenticated role,
   not postgres) will be blocked.
2. The existing "Managers can update any profile" UPDATE policy is
   kept — managers can still update display fields on any profile in
   their org, but the trigger prevents them from changing
   organisation_id or role.
3. current_org_active() is SECURITY DEFINER so it can read
   organizations even if a future migration tightens that table's
   grants. It is STABLE so the planner caches the result per-statement.
*/

-- ============================================================
-- 1. profiles SELECT: replace broad policy with org-scoped one
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

CREATE POLICY "Users view profiles in own org"
ON profiles FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )
);

-- ============================================================
-- 2. profiles INSERT: remove client self-insert
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- ============================================================
-- 3. profiles UPDATE trigger: guard organisation_id and role
-- ============================================================
CREATE OR REPLACE FUNCTION guard_profile_tenancy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Allow changes made by the table owner (postgres), which is the
  -- session_user when a SECURITY DEFINER function owned by postgres
  -- performs the update. Block everyone else from changing tenancy.
  IF session_user <> (
    SELECT relowner::regrole::text
    FROM pg_class
    WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace
  ) THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'organisation_id cannot be changed by clients';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'role cannot be changed by clients';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_tenancy ON profiles;
CREATE TRIGGER guard_profile_tenancy
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION guard_profile_tenancy();

-- ============================================================
-- 4. organizations SELECT: already scoped correctly — no change
-- ============================================================

-- ============================================================
-- 5a. current_org_active() helper
-- ============================================================
CREATE OR REPLACE FUNCTION current_org_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT o.active
     FROM organizations o
     JOIN profiles p ON p.organization_id = o.id
     WHERE p.id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- 5b. sites SELECT: drop broad policy, replace with org+active
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view sites" ON sites;
DROP POLICY IF EXISTS "Users view org sites" ON sites;

CREATE POLICY "Users view org sites active"
ON sites FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )
  AND current_org_active()
);

-- ============================================================
-- 5c. tasks SELECT: drop broad policy, replace with org+active
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users view org tasks" ON tasks;

CREATE POLICY "Users view org tasks active"
ON tasks FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )
  AND current_org_active()
);

-- ============================================================
-- 5d. materials SELECT: drop broad policy, replace with org+active
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view materials" ON materials;
DROP POLICY IF EXISTS "Users view org materials" ON materials;

CREATE POLICY "Users view org materials active"
ON materials FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )
  AND current_org_active()
);

-- ============================================================
-- 5e. timesheets SELECT: replace existing policies with org+active
-- ============================================================
DROP POLICY IF EXISTS "Managers view all org timesheets" ON timesheets;
DROP POLICY IF EXISTS "Workers can view their own timesheets" ON timesheets;
DROP POLICY IF EXISTS "Workers view own org timesheets" ON timesheets;

CREATE POLICY "Managers view org timesheets active"
ON timesheets FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
  AND current_org_active()
);

CREATE POLICY "Workers view own org timesheets active"
ON timesheets FOR SELECT
TO authenticated
USING (
  worker_id = auth.uid()
  AND organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )
  AND current_org_active()
);

-- ============================================================
-- 5f. construction_photos SELECT: replace with org+active
-- ============================================================
DROP POLICY IF EXISTS "Users view org photos" ON construction_photos;

CREATE POLICY "Users view org photos active"
ON construction_photos FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )
  AND current_org_active()
);

-- ============================================================
-- 5g. messages SELECT: replace with org+active
-- ============================================================
DROP POLICY IF EXISTS "Users can read their messages" ON messages;

CREATE POLICY "Users view org messages active"
ON messages FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )
  AND current_org_active()
);
