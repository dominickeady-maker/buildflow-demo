-- Add updated_at column to organizations with a trigger that sets it on every update.
-- The update_org_branding function already references updated_at = now(), but the
-- column didn't exist, causing "column updated_at of relation organizations does
-- not exist" errors when editing customer branding.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill existing rows
UPDATE organizations SET updated_at = created_at WHERE updated_at IS NULL;

-- Create a trigger function and trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS organizations_set_updated_at ON organizations;
CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
