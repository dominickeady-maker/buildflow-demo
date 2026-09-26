/*
# Create provision_org_and_manager function

## Summary
Adds a SECURITY DEFINER function that creates a new organization and a
manager profile for a given user. This is the server-side provisioning
path that replaces the removed client-side sign-up. It will be called by
a Stripe webhook (in a later task) after a successful subscription.

## Function: provision_org_and_manager
- Parameters: p_user_id uuid, p_email text, p_full_name text,
  p_company_name text
- Returns: uuid (the new organization id)
- Security: SECURITY DEFINER, SET search_path = public
- Idempotent: if a profile already exists for p_user_id, returns its
  organization_id without creating anything.
- Creates an organizations row with:
  - name = p_company_name
  - slug = lowercased hyphenated company name + 8-char random suffix
  - active = true
- Creates a profiles row with:
  - id = p_user_id
  - email = p_email
  - full_name = p_full_name
  - role = 'manager'
  - organization_id = the new org id

## Grants
- REVOKE EXECUTE from anon and authenticated (not callable from browser)
- GRANT EXECUTE to service_role only

## Important notes
1. The function is owned by postgres, so when it inserts into profiles
   the guard_profile_tenancy trigger sees session_user = postgres (the
   table owner) and allows the organization_id and role to be set.
2. The random suffix on slug ensures uniqueness even if two companies
   have the same name.
3. No RLS policies or existing migrations are altered.
*/

CREATE OR REPLACE FUNCTION provision_org_and_manager(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_company_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing_org_id uuid;
  v_org_id uuid;
  v_slug text;
  v_base_slug text;
BEGIN
  -- Idempotent: if profile already exists, return its org id
  SELECT organization_id INTO v_existing_org_id
  FROM profiles
  WHERE id = p_user_id;

  IF v_existing_org_id IS NOT NULL THEN
    RETURN v_existing_org_id;
  END IF;

  -- Build slug: lowercase, hyphenated, alphanumeric only
  v_base_slug := lower(
    regexp_replace(
      trim(p_company_name),
      '[^a-zA-Z0-9]+', '-', 'g'
    )
  );
  v_base_slug := trim(both '-' from v_base_slug);
  IF v_base_slug = '' OR v_base_slug IS NULL THEN
    v_base_slug := 'org';
  END IF;

  -- Append 8-char random suffix for uniqueness
  v_slug := v_base_slug || '-' || substr(
    replace(replace(replace(
      encode(gen_random_bytes(8), 'hex'),
      'a', ''), 'b', ''), 'c', '')
    || encode(gen_random_bytes(4), 'hex'),
    1, 8
  );

  -- Create organization
  INSERT INTO organizations (name, slug, active)
  VALUES (p_company_name, v_slug, true)
  RETURNING id INTO v_org_id;

  -- Create manager profile
  INSERT INTO profiles (id, email, full_name, role, organization_id)
  VALUES (p_user_id, p_email, p_full_name, 'manager', v_org_id);

  RETURN v_org_id;
END;
$$;

-- Lock down: only service_role can call this
REVOKE EXECUTE ON FUNCTION provision_org_and_manager FROM anon;
REVOKE EXECUTE ON FUNCTION provision_org_and_manager FROM authenticated;
GRANT EXECUTE ON FUNCTION provision_org_and_manager TO service_role;
