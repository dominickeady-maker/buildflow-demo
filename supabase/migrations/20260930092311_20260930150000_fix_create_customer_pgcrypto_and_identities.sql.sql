-- Fix create_customer:
-- 1. Schema-qualify gen_salt/crypt as extensions.* (pgcrypto lives in extensions schema)
-- 2. Add 'extensions' to search_path
-- 3. Insert auth.identities row so email provider login works

CREATE OR REPLACE FUNCTION public.create_customer(
  p_company_name text,
  p_subdomain text,
  p_manager_name text,
  p_manager_email text,
  p_primary_color text DEFAULT '#ff7a2e',
  p_logo_url text DEFAULT NULL,
  p_plan text DEFAULT 'starter'
)
RETURNS TABLE(org_id uuid, account_number text, manager_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions, auth
AS $function$
DECLARE
  v_org_id uuid;
  v_account_number text;
  v_max_users integer;
  v_user_id uuid;
  v_encrypted_password text;
  v_plan text := COALESCE(p_plan, 'starter');
BEGIN
  IF NOT (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
  ) THEN
    RAISE EXCEPTION 'Only platform admins or the service role can create customers';
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

  v_encrypted_password := extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf'));

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

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_id,
    provider,
    provider_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    'email',
    p_manager_email,
    jsonb_build_object('sub', v_user_id::text, 'email', p_manager_email, 'email_verified', true),
    now(),
    now(),
    now()
  );

  INSERT INTO profiles (id, email, full_name, role, organization_id)
  VALUES (v_user_id, p_manager_email, p_manager_name, 'manager', v_org_id);

  RETURN QUERY SELECT v_org_id, v_account_number, v_user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) TO authenticated;
