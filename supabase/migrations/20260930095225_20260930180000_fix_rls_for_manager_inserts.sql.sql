/*
# Fix RLS for manager/worker inserts across all tables

## Problem
1. profiles table has NO INSERT policy — managers can't create worker profiles.
2. sites, tasks, timesheets, materials tables have organization_id columns
   with RLS policies that check organization_id, but the column has no default,
   so client-side inserts that omit organization_id fail the WITH CHECK.

## Changes
1. Add INSERT policy on profiles: managers can insert workers into their own org.
2. Add defaults to organization_id on sites, tasks, timesheets, materials
   using current_org_id() so inserts that omit it still satisfy RLS.
3. Drop the overly-permissive "Managers can create sites" and "Managers can
   create tasks" policies that only check role without checking org membership.
*/

-- 1. profiles INSERT policy
DROP POLICY IF EXISTS "Managers can insert worker profiles" ON profiles;
CREATE POLICY "Managers can insert worker profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id
    FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
);

-- 2. Set organization_id defaults using current_org_id()
ALTER TABLE sites ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE tasks ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE timesheets ALTER COLUMN organization_id SET DEFAULT current_org_id();
ALTER TABLE materials ALTER COLUMN organization_id SET DEFAULT current_org_id();

-- 3. Drop overly-permissive policies that only check role without org
DROP POLICY IF EXISTS "Managers can create sites" ON sites;
DROP POLICY IF EXISTS "Managers can create tasks" ON tasks;
