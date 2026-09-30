/*
# Create notifications table with RLS and event triggers

## Purpose
Track per-user notifications for messages, task assignments/updates,
timesheet submissions, and materials request status changes.

## New Table
- `notifications`
  - id (uuid, primary key)
  - organization_id (uuid, defaults to current_org_id(), for RLS scoping)
  - user_id (uuid, references profiles, cascade delete — the recipient)
  - type (text: 'message', 'task_assigned', 'task_updated',
         'timesheet_submitted', 'materials_status', 'materials_submitted')
  - title (text — short human-readable summary)
  - body (text — optional longer description)
  - link (text — app-internal navigation hint, e.g. 'messages', 'tasks')
  - read_at (timestamptz, nullable — null means unread)
  - created_at (timestamptz, default now())

## Security
- RLS enabled
- SELECT: users see only their own notifications (user_id = auth.uid())
- UPDATE: users can only mark their own notifications as read
- INSERT: service role only (triggers create these, not the client)
- DELETE: users can delete their own notifications

## Triggers
- After INSERT on messages → create notification for the receiver
- After INSERT on tasks (with assigned_to) → create notification for the assigned worker
- After UPDATE on tasks (status change) → create notification for the assigned worker
- After INSERT on timesheets → create notification for managers in the org
- After UPDATE on materials (status change) → create notification for the requesting worker
- After INSERT on materials → create notification for managers in the org

## Note
Timesheets table has no `status` column, so no status-change trigger for it.
Only a new-submission notification for managers is created.
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid DEFAULT current_org_id(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ALTER COLUMN organization_id SET DEFAULT current_org_id();

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users mark own notifications read" ON notifications;
CREATE POLICY "Users mark own notifications read"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
CREATE POLICY "Users delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- Helper: create a notification safely (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_link text DEFAULT NULL,
  p_org_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link, organization_id)
  VALUES (p_user_id, p_type, p_title, p_body, p_link, COALESCE(p_org_id, current_org_id()));
END;
$function$;

-- ============================================================
-- Trigger: New message → notify receiver
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.receiver_id IS NOT NULL AND NEW.receiver_id != NEW.sender_id THEN
    PERFORM create_notification(
      NEW.receiver_id,
      'message',
      'New message',
      LEFT(NEW.message, 100),
      'messages',
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_new_message_trigger ON messages;
CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- ============================================================
-- Trigger: Task assigned (new task with assigned_to) → notify worker
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'task_assigned',
      'New task assigned',
      NEW.title,
      'tasks',
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_task_assigned_trigger ON tasks;
CREATE TRIGGER notify_task_assigned_trigger
  AFTER INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION notify_task_assigned();

-- ============================================================
-- Trigger: Task status updated → notify assigned worker
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_task_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'task_updated',
      'Task status updated',
      NEW.title || ' → ' || NEW.status,
      'tasks',
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_task_updated_trigger ON tasks;
CREATE TRIGGER notify_task_updated_trigger
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION notify_task_updated();

-- ============================================================
-- Trigger: New timesheet submitted → notify all managers in org
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_timesheet_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mgr RECORD;
BEGIN
  FOR mgr IN
    SELECT id FROM profiles
    WHERE organization_id = NEW.organization_id AND role = 'manager'
  LOOP
    PERFORM create_notification(
      mgr.id,
      'timesheet_submitted',
      'New timesheet submitted',
      NEW.task_description,
      'timesheets',
      NEW.organization_id
    );
  END LOOP;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_timesheet_submitted_trigger ON timesheets;
CREATE TRIGGER notify_timesheet_submitted_trigger
  AFTER INSERT ON timesheets
  FOR EACH ROW
  EXECUTE FUNCTION notify_timesheet_submitted();

-- ============================================================
-- Trigger: Materials status changed → notify requesting worker
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_materials_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.requested_by IS NOT NULL THEN
    PERFORM create_notification(
      NEW.requested_by,
      'materials_status',
      'Materials request ' || NEW.status,
      NEW.item_name,
      'materials',
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_materials_status_trigger ON materials;
CREATE TRIGGER notify_materials_status_trigger
  AFTER UPDATE OF status ON materials
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_materials_status();

-- ============================================================
-- Trigger: New materials request submitted → notify all managers in org
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_materials_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  mgr RECORD;
BEGIN
  FOR mgr IN
    SELECT id FROM profiles
    WHERE organization_id = NEW.organization_id AND role = 'manager'
  LOOP
    PERFORM create_notification(
      mgr.id,
      'materials_submitted',
      'New materials request',
      NEW.item_name,
      'materials',
      NEW.organization_id
    );
  END LOOP;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_materials_submitted_trigger ON materials;
CREATE TRIGGER notify_materials_submitted_trigger
  AFTER INSERT ON materials
  FOR EACH ROW
  EXECUTE FUNCTION notify_materials_submitted();
