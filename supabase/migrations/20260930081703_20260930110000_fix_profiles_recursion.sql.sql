/*
# Fix: profiles RLS recursion from platform admin policy

## Problem
The "Platform admins can view all profiles" policy does
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_platform_admin = true)
which queries profiles inside a profiles SELECT policy, causing infinite recursion.

## Fix
Create a SECURITY DEFINER helper `is_platform_admin()` that checks the flag
without going through RLS. Replace all policy references that query profiles
for the admin check with this function.
*/

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- Fix profiles SELECT policy
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON profiles;
CREATE POLICY "Platform admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.is_platform_admin());

-- Fix organizations policies to use the helper too
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Platform admins can update organizations" ON organizations;

CREATE POLICY "Users can view their organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id = public.current_org_id()
  OR public.is_platform_admin()
);

CREATE POLICY "Platform admins can update organizations"
ON organizations FOR UPDATE
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());
