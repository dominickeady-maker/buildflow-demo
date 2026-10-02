/*
# Fix invite_pending trigger, service_role check, and storage photo access

## Changes

### 1. invite_pending: clear on password set, not first sign-in
The old trigger fired on auth.users.last_sign_in_at going from NULL to non-NULL.
That fires on any first sign-in, not specifically when the worker sets their password.
Replace with a trigger that fires on `password_encrypted` (or `encrypted_password`)
changing from empty/null to a non-empty value — i.e. the worker has actually set a password.

### 2. guard_platform_admin_column: use auth.role() = 'service_role'
Replace `auth.uid() IS NULL` (which is unreliable) with `auth.role() = 'service_role'`
as the service-role check.

### 3. Storage: construction-photos SELECT policy
Old: users can only view photos in their own folder (`storage.foldername(name)[1] = auth.uid()`).
New: any authenticated user in the same organisation can view all photos in the bucket.
This lets managers see photos their workers uploaded.
*/

-- ============================================================
-- 1. Fix invite_pending trigger: fire on password set
-- ============================================================

DROP TRIGGER IF EXISTS mark_invite_accepted_trigger ON auth.users;
DROP FUNCTION IF EXISTS mark_invite_accepted();

CREATE OR REPLACE FUNCTION public.mark_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Clear invite_pending only when the user actually sets a password
  -- (encrypted_password goes from empty/null to a real hash).
  IF COALESCE(OLD.encrypted_password, '') = '' AND COALESCE(NEW.encrypted_password, '') <> '' THEN
    UPDATE profiles SET invite_pending = false WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER mark_invite_accepted_trigger
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION mark_invite_accepted();

-- ============================================================
-- 2. Fix guard_platform_admin_column: use auth.role() = 'service_role'
-- ============================================================

CREATE OR REPLACE FUNCTION public.guard_platform_admin_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Block is_platform_admin = true on INSERT and UPDATE unless the caller is
  -- a platform admin or the service role.
  IF NEW.is_platform_admin = true THEN
    IF auth.role() <> 'service_role' THEN
      IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true
      ) THEN
        RAISE EXCEPTION 'is_platform_admin can only be set by a platform admin or the service role';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- 3. Storage: construction-photos SELECT — org members can view all org photos
-- ============================================================

DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
CREATE POLICY "Org members can view construction photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'construction-photos' AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.organization_id IS NOT NULL
  )
);
