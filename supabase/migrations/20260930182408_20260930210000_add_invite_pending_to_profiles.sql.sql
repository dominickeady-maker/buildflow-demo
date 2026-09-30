/*
# Add invite_pending column to profiles

## Purpose
Track whether a worker has accepted their invite (set a password and logged in).
- Set to true when the create-worker edge function creates the profile.
- Flipped to false when the worker first signs in.

## Changes
- Add invite_pending boolean column (default false)
- Trigger to set invite_pending = false on first sign-in
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_pending boolean DEFAULT false;

-- Function to mark invite as accepted when a user logs in
CREATE OR REPLACE FUNCTION public.mark_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Only flip on first sign-in (when last_sign_in_at was null before this update)
  IF OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL THEN
    UPDATE profiles SET invite_pending = false WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS mark_invite_accepted_trigger ON auth.users;
CREATE TRIGGER mark_invite_accepted_trigger
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION mark_invite_accepted();
