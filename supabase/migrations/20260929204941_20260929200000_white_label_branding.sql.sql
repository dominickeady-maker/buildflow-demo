/*
# White-Label Branding Support

## Overview
Adds per-organisation branding, account numbers, plan limits, and platform admin support
to the existing multi-tenant schema. The demo organisation is untouched.

## Changes to `organizations` table
- `display_name` (text, nullable) — branded company name shown in UI. Falls back to `name`.
- `logo_url` (text, nullable) — URL to logo stored in the `branding` storage bucket.
- `primary_color` (text, default '#ff7a2e') — hex accent colour for branded UI.
- `subdomain` (text, unique, nullable) — e.g. "pennine" for pennine.banksman.app.
- `custom_domain` (text, unique, nullable) — e.g. "build.pennine.co.uk".
- `account_number` (text, unique, nullable) — auto-generated like BM-10001.
- `plan` (text, default 'starter') — 'starter' (10 users) or 'growth' (25 users).
- `max_users` (integer, default 10) — derived from plan but stored for flexibility.

## Changes to `profiles` table
- `is_platform_admin` (boolean, default false) — platform-level admin flag.

## New: `account_number_seq` sequence — generates BM-XXXXX numbers, never reused.

## New: `get_org_by_hostname(text)` function — returns org branding by subdomain/custom_domain.

## New: `check_plan_limit(uuid)` function — returns true if org has room for more users.

## New: `create_customer(...)` function (SECURITY DEFINER) — atomically creates org + manager.

## New: `update_org_branding(...)` function (SECURITY DEFINER) — updates branding.

## New: `branding` storage bucket — public bucket for customer logos.

## Security
- RLS on `organizations`: members read own org, platform admins read/update all.
- RLS on `profiles`: platform admins can read all profiles.
- Functions are SECURITY DEFINER with caller privilege checks.
*/

-- ============================================================
-- 1. Add branding columns to organizations
-- ============================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#ff7a2e';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_domain text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS account_number text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users integer DEFAULT 10;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'organizations_subdomain_key') THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_subdomain_key UNIQUE (subdomain);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'organizations_custom_domain_key') THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_custom_domain_key UNIQUE (custom_domain);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'organizations_account_number_key') THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_account_number_key UNIQUE (account_number);
  END IF;
END $$;

-- ============================================================
-- 2. Add is_platform_admin to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_platform_admin boolean DEFAULT false;

-- ============================================================
-- 3. Account number sequence
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS account_number_seq START 10001;

-- ============================================================
-- 4. get_org_by_hostname function
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
AS $$
  SELECT
    o.id, o.name, o.display_name, o.logo_url, o.primary_color,
    o.subdomain, o.custom_domain, o.account_number, o.plan, o.max_users
  FROM organizations o
  WHERE
    (o.subdomain IS NOT NULL AND host_name = (o.subdomain || '.banksman.app'))
    OR (o.custom_domain IS NOT NULL AND host_name = o.custom_domain)
$$;

GRANT EXECUTE ON FUNCTION public.get_org_by_hostname(text) TO anon, authenticated;

-- ============================================================
-- 5. check_plan_limit function
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_plan_limit(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (SELECT count(*)::integer FROM profiles p WHERE p.organization_id = org_id)
    <
    (SELECT max_users FROM organizations WHERE id = org_id)
$$;

GRANT EXECUTE ON FUNCTION public.check_plan_limit(uuid) TO authenticated;

-- ============================================================
-- 6. create_customer function
-- Required params first, optional params with defaults last.
-- ============================================================
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

GRANT EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) TO authenticated;

-- ============================================================
-- 7. update_org_branding function
-- ============================================================
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

GRANT EXECUTE ON FUNCTION public.update_org_branding(uuid, text, text, text, text, text) TO authenticated;

-- ============================================================
-- 8. RLS on organizations
-- ============================================================
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Platform admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Platform admins can update organizations" ON organizations;

CREATE POLICY "Users can view their organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
);

CREATE POLICY "Platform admins can update organizations"
ON organizations FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true));

-- ============================================================
-- 9. RLS on profiles — platform admins can read all
-- ============================================================
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON profiles;
CREATE POLICY "Platform admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_platform_admin = true));

-- ============================================================
-- 10. Mark dominickeady@gmail.com as platform admin
-- ============================================================
UPDATE profiles SET is_platform_admin = true WHERE email = 'dominickeady@gmail.com';

-- ============================================================
-- 11. Branding storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read branding" ON storage.objects;
CREATE POLICY "Public can read branding"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Authenticated can upload branding" ON storage.objects;
CREATE POLICY "Authenticated can upload branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "Authenticated can update branding" ON storage.objects;
CREATE POLICY "Authenticated can update branding"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branding')
WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "Authenticated can delete branding" ON storage.objects;
CREATE POLICY "Authenticated can delete branding"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branding');
