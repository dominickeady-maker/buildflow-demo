-- Exclude platform admins from plan limit counts.
-- Platform admins are not customer users and must not count against an org's
-- max_users limit. The enforce_plan_limit trigger already skips them on INSERT;
-- this fixes the check_plan_limit function to also exclude them.

CREATE OR REPLACE FUNCTION public.check_plan_limit(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  (SELECT count(*)::integer FROM profiles p
   WHERE p.organization_id = org_id
   AND COALESCE(p.is_platform_admin, false) = false)
  <
  (SELECT max_users FROM organizations WHERE id = org_id)
$$;

GRANT EXECUTE ON FUNCTION public.check_plan_limit(uuid) TO authenticated;
