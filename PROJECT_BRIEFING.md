# BuildFlow — Project Briefing (Sept 2026)

## What it is
A construction site management app called BuildFlow. Managers oversee tasks, workers, timesheets, materials, sites, drawings, and photos. Workers log hours, request materials, and view their assigned tasks. Built with React + TypeScript + Vite + Tailwind CSS + Supabase.

## Auth & roles
Supabase email/password auth. Two roles: `manager` and `worker`. Profiles table links each user to an `organization_id`. Demo accounts (`manager@buildflowdemo.com` / `worker@buildflowdemo.com`, password `demo123`) auto-login via a `?demo=manager` URL param.

## Database (Supabase)
12 tables in the public schema — `profiles`, `organizations`, `sites`, `tasks`, `timesheets`, `materials`, `construction_photos`, `drawings`, `messages`, `trades`, `programme_stages`, `programme_milestones`. All have RLS enabled. There's also a `voiceflow-chatbot` edge function and an `is_demo_user()` SECURITY DEFINER helper.

## Hosting
Netlify. `netlify.toml` is configured (build = `npm run build`, publish = `dist`). SPA fallback is in `public/_redirects`. Build passes cleanly.

## Recent security migration (just applied)
Organisation membership was client-controlled — any authenticated user could see all profiles, self-insert a profile with arbitrary org_id, and change their own org/role. This was locked down:

- Profiles SELECT now scoped to same-org only.
- Profiles INSERT policy dropped — clients can no longer create profiles.
- A BEFORE UPDATE trigger (`guard_profile_tenancy`) blocks changes to `organization_id` or `role` unless the session is the table owner (postgres), allowing future SECURITY DEFINER provisioning functions.
- `current_org_active()` helper added; all SELECT policies on sites, tasks, timesheets, materials, construction_photos, and messages now check that the caller's org is active.
- Broad `USING (true)` SELECT policies on sites, tasks, and materials were dropped and replaced with org-scoped + active-org policies.

## Known issue to fix next
`AuthContext.tsx` still calls `supabase.from('profiles').insert(...)` directly in the `signUp` function. This will now fail because the profiles INSERT policy was dropped. The next step is to create a SECURITY DEFINER function (e.g. `create_profile`) that handles profile provisioning server-side, and update `signUp` to call it via `supabase.rpc()`.

## Do not touch
`.env`, Supabase credentials, or any existing component unless the task explicitly asks.
