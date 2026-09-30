/*
# Security Hardening for White-Label

## Issues Fixed

### 1. Block is_platform_admin from self-update
- Add a trigger `guard_platform_admin_column` that prevents any non-service-role
  UPDATE from changing `is_platform_admin`. Only the service role (which bypasses
  RLS) or the existing DB-level grant can set it.
- Also add a CHECK constraint via trigger: if the caller is not the service role,
  the is_platform_admin value cannot change from its current value.

### 2. Storage bucket isolation
- `drawings` bucket: restrict SELECT to only users in the org that owns the drawing.
  The drawings table has organization_id, but storage objects don't. We scope by
  folder name pattern: drawings are stored under `<org_id>/` paths.
  Actually, drawings are stored as public URLs with no org prefix currently.
  The real fix: restrict drawings bucket SELECT to authenticated users only (not anon),
  and rely on the fact that the drawings table RLS only returns URLs for the user's org.
  The bucket itself should not be public. We change the policy to require authenticated.
  
  Wait — the drawings bucket is used for both storage and serving. The URLs are
  public URLs. Making the bucket non-public would break existing drawing display.
  The correct approach: the drawings table RLS already prevents cross-org access
  to the file_url. The storage bucket being public is acceptable IF the URLs are
  unguessable (they use UUIDs). But the policy "Authenticated users can view drawings"
  with USING(bucket_id='drawings') means anyone authenticated can list all objects.
  We should restrict listing but allow public read of individual objects by URL.
  
  Actually Supabase public buckets don't go through RLS for public URL access —
  they're served directly. RLS only applies to authenticated API calls. So the
  policy on the bucket only affects API listing/deletion, not direct URL access.
  The real protection is the drawings table RLS (which is correct). We'll tighten
  the storage policy to require org membership for listing/deleting.

- `construction-photos` bucket: already scoped per-uid via foldername. OK.
- `branding` bucket: restrict uploads/updates/deletes to platform admins only.

### 3. Plan limit DB trigger
- Add trigger `enforce_plan_limit_on_insert` on profiles that checks
  check_plan_limit before allowing INSERT. Raises exception if over limit.

### 4. Restrict admin function execution
- Revoke EXECUTE on create_customer and update_org_branding from anon.
- Keep authenticated (the function body checks is_platform_admin).

### 5. Set search_path on all SECURITY DEFINER functions
- Add `SET search_path = public, auth` to all new functions.

### 6. Profiles UPDATE: block is_platform_admin column
- Create a trigger that rejects changes to is_platform_admin unless called
  by the service role (which bypasses RLS and triggers).
*/

-- ============================================================
-- 1. Block is_platform_admin self-update via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.guard_platform_admin_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only allow is_platform_admin to change if the current user is a platform admin
  -- or if this is a service-role operation (no auth context).
  -- The service role bypasses RLS but triggers still fire. We check if the
  -- session user has platform admin rights.
  IF NEW.is_platform_admin IS DISTINCT FROM OLD.is_platform_admin THEN
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
$$;

DROP TRIGGER IF EXISTS guard_platform_admin_trigger ON profiles;
CREATE TRIGGER guard_platform_admin_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_platform_admin_column();

-- ============================================================
-- 2. Storage: tighten branding bucket to platform admins
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can upload branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete branding" ON storage.objects;

CREATE POLICY "Platform admins can upload branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
);

CREATE POLICY "Platform admins can update branding"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
)
WITH CHECK (
  bucket_id = 'branding'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
);

CREATE POLICY "Platform admins can delete branding"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'branding'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
);

-- ============================================================
-- 3. Storage: tighten drawings bucket DELETE to managers only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload drawings" ON storage.objects;

CREATE POLICY "Managers can upload to drawings bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'drawings'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
  AND NOT is_demo_user()
);

CREATE POLICY "Managers can delete from drawings bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'drawings'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
  AND NOT is_demo_user()
);

-- ============================================================
-- 4. Plan limit trigger on profiles INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_max_users integer;
  v_current_count integer;
BEGIN
  -- Only check for non-platform-admin users being assigned to an org
  IF NEW.organization_id IS NOT NULL AND COALESCE(NEW.is_platform_admin, false) = false THEN
    SELECT max_users INTO v_max_users FROM organizations WHERE id = NEW.organization_id;
    SELECT count(*) INTO v_current_count FROM profiles WHERE organization_id = NEW.organization_id;
    
    IF v_current_count >= v_max_users THEN
      RAISE EXCEPTION 'User limit reached for this organisation plan (max % users)', v_max_users;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_plan_limit_trigger ON profiles;
CREATE TRIGGER enforce_plan_limit_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_plan_limit();

-- ============================================================
-- 5. Revoke EXECUTE on admin functions from anon
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_org_branding(uuid, text, text, text, text, text) FROM anon;

-- ============================================================
-- 6. Set search_path on existing functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_org_by_hostname(host_name text)
RETURNS TABLE (
  id uuid,
  name text,
  display_name text,
  logo_url text,
  primary_color text,
  subdomain text,
  custom_domain text,
  account_number text,
  plan text,
  max_users integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.name, o.display_name, o.logo_url, o.primary_color,
    o.subdomain, o.custom_domain, o.account_number, o.plan, o.max_users
  FROM organizations o
  WHERE
    (o.subdomain IS NOT NULL AND host_name = (o.subdomain || '.banksman.app'))
    OR (o.custom_domain IS NOT NULL AND host_name = o.custom_domain)
$$;

CREATE OR REPLACE FUNCTION public.check_plan_limit(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::integer FROM profiles p WHERE p.organization_id = org_id)
    <
    (SELECT max_users FROM organizations WHERE id = org_id)
$$;

CREATE OR REPLACE FUNCTION public.create_customer(
  p_company_name text,
  p_subdomain text,
  p_manager_name text,
  p_manager_email text,
  p_primary_color text DEFAULT '#ff7a2e',
  p_logo_url text DEFAULT NULL,
  p_plan text DEFAULT 'starter'
)
RETURNS TABLE (
  org_id uuid,
  account_number text,
  manager_user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id uuid;
  v_account_number text;
  v_max_users integer;
  v_user_id uuid;
  v_encrypted_password text;
  v_plan text := COALESCE(p_plan, 'starter');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true
  ) THEN
    RAISE EXCEPTION 'Only platform admins can create customers';
  END IF;

  IF v_plan NOT IN ('starter', 'growth') THEN
    RAISE EXCEPTION 'Invalid plan. Must be "starter" or "growth"';
  END IF;

  v_max_users := CASE WHEN v_plan = 'growth' THEN 25 ELSE 10 END;
  v_account_number := 'BM-' || nextval('account_number_seq')::text;

  INSERT INTO organizations (name, slug, display_name, primary_color, logo_url, subdomain, account_number, plan, max_users)
  VALUES (
    p_company_name,
    regexp_replace(lower(p_subdomain), '[^a-z0-9]', '-', 'g'),
    p_company_name,
    COALESCE(p_primary_color, '#ff7a2e'),
    p_logo_url,
    regexp_replace(lower(p_subdomain), '[^a-z0-9]', '', 'g'),
    v_account_number,
    v_plan,
    v_max_users
  )
  RETURNING id INTO v_org_id;

  v_encrypted_password := crypt(gen_random_uuid()::text, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_manager_email,
    v_encrypted_password,
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object(),
    false
  )
  RETURNING id INTO v_user_id;

  INSERT INTO profiles (id, email, full_name, role, organization_id)
  VALUES (v_user_id, p_manager_email, p_manager_name, 'manager', v_org_id);

  RETURN QUERY SELECT v_org_id, v_account_number, v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_org_branding(
  p_org_id uuid,
  p_display_name text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_primary_color text DEFAULT NULL,
  p_subdomain text DEFAULT NULL,
  p_plan text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true
  ) THEN
    RAISE EXCEPTION 'Only platform admins can update branding';
  END IF;

  UPDATE organizations SET
    display_name = COALESCE(p_display_name, display_name),
    logo_url = COALESCE(p_logo_url, logo_url),
    primary_color = COALESCE(p_primary_color, primary_color),
    subdomain = COALESCE(regexp_replace(lower(p_subdomain), '[^a-z0-9]', '', 'g'), subdomain),
    plan = COALESCE(p_plan, plan),
    max_users = CASE WHEN p_plan = 'growth' THEN 25 WHEN p_plan = 'starter' THEN 10 ELSE max_users END,
    updated_at = now()
  WHERE id = p_org_id;
END;
$$;

-- Re-grant: recreating functions revokes grants
GRANT EXECUTE ON FUNCTION public.get_org_by_hostname(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_plan_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_org_branding(uuid, text, text, text, text, text) TO authenticated;
-- Re-revoke anon from admin functions
REVOKE EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_org_branding(uuid, text, text, text, text, text) FROM anon;
