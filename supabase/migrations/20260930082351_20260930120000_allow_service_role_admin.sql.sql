/*
# Allow service_role to call create_customer and update_org_branding

## Change
Both functions currently reject any caller who isn't a platform admin.
This adds a second condition: if auth.role() = 'service_role', the call
is allowed. This lets automation using the service key create customers
and update branding without needing a platform admin session.

## Updated check in both functions
  IF NOT (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
  ) THEN
    RAISE EXCEPTION 'Only platform admins or the service role can ...';
  END IF;
*/

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
  IF NOT (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_admin = true)
  ) THEN
    RAISE EXCEPTION 'Only platform admins or the service role can update branding';
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

-- Re-grant and re-revoke (recreating functions resets grants)
GRANT EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_org_branding(uuid, text, text, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_org_branding(uuid, text, text, text, text, text) FROM anon;
