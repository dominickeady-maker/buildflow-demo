/*
# Update notification trigger links to include entity IDs

## Changes
- notify_task_assigned: link changed from 'tasks' to 'task:<task_id>'
- notify_task_updated: link changed from 'tasks' to 'task:<task_id>'
- notify_timesheet_submitted: link stays 'timesheets' (no individual timesheet detail view)
- notify_materials_status: link changed from 'materials' to 'materials'
- notify_new_message: link stays 'messages'
*/

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
      'task:' || NEW.id,
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

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
      'task:' || NEW.id,
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;
