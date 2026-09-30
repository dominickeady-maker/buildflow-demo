/*
# Security hardening follow-up

## Changes
1. Remove the client-side INSERT policy on profiles — worker creation is now
   handled exclusively by the create-worker edge function (service role), so
   no client-side inserts into profiles are needed.
2. Extend guard_platform_admin_column to also fire BEFORE INSERT and block
   is_platform_admin = true unless the caller is a platform admin or service role.
3. Add organization_id DEFAULT current_org_id() to construction_photos, matching
   the other org-scoped tables.
*/

-- 1. Remove the client-side INSERT policy on profiles
DROP POLICY IF EXISTS "Managers can insert worker profiles" ON profiles;

-- 2. Extend guard_platform_admin_column to handle INSERT (not just UPDATE)
CREATE OR REPLACE FUNCTION public.guard_platform_admin_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Block is_platform_admin = true on INSERT and UPDATE unless the caller is
  -- a platform admin or the service role (auth.uid() IS NULL).
  IF NEW.is_platform_admin = true THEN
    IF auth.uid() IS NOT NULL THEN
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

-- Add a BEFORE INSERT trigger (the BEFORE UPDATE trigger already exists)
DROP TRIGGER IF EXISTS guard_platform_admin_insert_trigger ON profiles;
CREATE TRIGGER guard_platform_admin_insert_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION guard_platform_admin_column();

-- 3. Add organization_id default to construction_photos
ALTER TABLE construction_photos ALTER COLUMN organization_id SET DEFAULT current_org_id();
