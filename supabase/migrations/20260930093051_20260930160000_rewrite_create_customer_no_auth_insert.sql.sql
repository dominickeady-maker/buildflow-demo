-- Rewrite create_customer: only creates the organisation and returns its id + account number.
-- User creation is now handled by the send-invite edge function via admin.inviteUserByEmail,
-- which properly initialises all GoTrue token columns.

DROP FUNCTION IF EXISTS public.create_customer(text, text, text, text, text, text, text);

CREATE FUNCTION public.create_customer(
  p_company_name text,
  p_subdomain text,
  p_manager_name text DEFAULT NULL,
  p_manager_email text DEFAULT NULL,
  p_primary_color text DEFAULT '#ff7a2e',
  p_logo_url text DEFAULT NULL,
  p_plan text DEFAULT 'starter'
)
RETURNS TABLE(org_id uuid, account_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  v_org_id uuid;
  v_account_number text;
  v_max_users integer;
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

  RETURN QUERY SELECT v_org_id, v_account_number;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_customer(text, text, text, text, text, text, text) TO authenticated;

-- Fix MGuille7's org brand colour: was saved as #46ff2e, user entered #2eff62
UPDATE organizations SET primary_color = '#2eff62' WHERE id = 'b0721381-efb1-4cae-9294-f9ce8d95f7e5';
