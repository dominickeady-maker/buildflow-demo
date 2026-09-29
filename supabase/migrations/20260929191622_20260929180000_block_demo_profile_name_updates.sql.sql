/*
# Block demo users from updating profile name

## Purpose
Demo users share two public accounts. Anyone with the demo link can sign in.
We must prevent them from changing the profile name (full_name) to keep
the demo looking correct for everyone.

## Changes
1. Replace the "Users can update their own profile" UPDATE policy on `profiles`
   with one that blocks demo users via `is_demo_user()`.
2. Non-demo users retain the same self-update ability.
3. Manager UPDATE ("Managers can update any profile") is also blocked for demo users.

## What stays working
- SELECT on profiles (demo users see all org profiles)
- Non-demo users can still update their own profile
- Managers can still update any profile (non-demo only)
*/

-- Block demo users from updating their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND NOT public.is_demo_user())
  WITH CHECK (auth.uid() = id AND NOT public.is_demo_user());

-- Block demo users from manager-level profile updates too
DROP POLICY IF EXISTS "Managers can update any profile" ON profiles;
CREATE POLICY "Managers can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'manager')
    AND NOT public.is_demo_user()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'manager')
    AND NOT public.is_demo_user()
  );