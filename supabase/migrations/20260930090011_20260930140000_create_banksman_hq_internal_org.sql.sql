-- Add is_internal flag to organizations and create Banksman HQ.
-- Internal orgs are not customer-facing: no subdomain, no account number,
-- not shown in the Customers list, and not subject to plan limits.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false;

-- Create the Banksman HQ internal organisation
INSERT INTO organizations (id, name, slug, display_name, primary_color, subdomain, account_number, plan, max_users, is_internal, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Banksman HQ',
  'banksman-hq',
  'Banksman HQ',
  '#ff7a2e',
  NULL,
  NULL,
  'internal',
  0,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  display_name = EXCLUDED.display_name,
  is_internal = true,
  subdomain = NULL,
  account_number = NULL,
  plan = 'internal',
  max_users = 0;

-- Move dominickeady@gmail.com to Banksman HQ, keep is_platform_admin = true
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'dominickeady@gmail.com';
