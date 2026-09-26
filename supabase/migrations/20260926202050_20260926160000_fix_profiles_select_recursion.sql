/*
# Fix infinite recursion on profiles SELECT policy

## Problem
The migration 20260926_lock_down_org_membership created a profiles
SELECT policy whose USING clause subqueries into profiles itself:

  organization_id = (
    SELECT p.organization_id FROM profiles p
    WHERE p.id = auth.uid()
  )

Postgres re-applies the same RLS policy to that subquery, which
subqueries profiles again, and so on — infinite recursion (42P17).
Every profile read fails and the app cannot load.

## Fix
1. Create current_org_id() — a SECURITY DEFINER STABLE SQL function
   that reads the caller's organization_id from profiles. Because it
   is SECURITY DEFINER, it runs as the function owner (postgres), so
   RLS on profiles is bypassed for the inner read — no recursion.
2. DROP and recreate the "Users view profiles in own org" policy to
   use current_org_id() instead of a direct subquery on profiles.

## No other changes
- No other policy, table, or component is altered.
- The old migration file is not edited.
*/

-- ============================================================
-- 1. current_org_id() helper
-- ============================================================
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION current_org_id() FROM public;
GRANT EXECUTE ON FUNCTION current_org_id() TO authenticated;

-- ============================================================
-- 2. Replace the recursive profiles SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "Users view profiles in own org" ON profiles;

CREATE POLICY "Users view profiles in own org"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR organization_id = current_org_id()
);
