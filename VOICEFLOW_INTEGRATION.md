# Voiceflow Integration Guide for BuildFlow

This guide explains how to integrate your BuildFlow app with Voiceflow using the deployed Edge Function API.

## API Endpoint

```
https://jpujykkjrskihqskbovu.supabase.co/functions/v1/voiceflow-chatbot
```

## Authentication

All requests require the following headers:

```json
{
  "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY",
  "Content-Type": "application/json"
}
```

Your Supabase Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdWp5a2tqcnNraWhxc2tib3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDU1NDYsImV4cCI6MjA3Nzg4MTU0Nn0.25qLvfny-l83Kti3ivOxuHl9cRjs0PdkF3sRXkEu0NI`

## Request Format

All requests should be POST requests with the following structure:

```json
{
  "action": "ACTION_NAME",
  "userId": "USER_UUID",
  "data": {}
}
```

## Available Actions

### 1. Get User Profile

Get information about the current user.

**Action:** `get_profile`

**Request:**
```json
{
  "action": "get_profile",
  "userId": "user-uuid-here"
}
```

**Response:**
```json
{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "worker"
  }
}
```

---

### 2. Get My Tasks

Get all tasks assigned to the user.

**Action:** `get_my_tasks`

**Request:**
```json
{
  "action": "get_my_tasks",
  "userId": "user-uuid-here"
}
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Install drywall",
      "description": "Install drywall in bedroom",
      "status": "in_progress",
      "site": "Main Street Project",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get All Tasks (Manager Only)

Get all tasks in the system.

**Action:** `get_all_tasks`

**Request:**
```json
{
  "action": "get_all_tasks",
  "userId": "manager-uuid-here"
}
```

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "title": "Install drywall",
      "description": "Install drywall in bedroom",
      "status": "in_progress",
      "assigned_to": "John Doe",
      "site": "Main Street Project",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 4. Create Task (Manager Only)

Create a new task.

**Action:** `create_task`

**Request:**
```json
{
  "action": "create_task",
  "userId": "manager-uuid-here",
  "data": {
    "title": "Paint walls",
    "description": "Paint all walls in living room",
    "siteId": "site-uuid",
    "assignedTo": "worker-uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully"
}
```

---

### 5. Update Task Status

Update the status of a task.

**Action:** `update_task_status`

**Request:**
```json
{
  "action": "update_task_status",
  "userId": "user-uuid-here",
  "data": {
    "taskId": "task-uuid",
    "status": "complete"
  }
}
```

**Valid statuses:** `todo`, `in_progress`, `complete`

**Response:**
```json
{
  "success": true,
  "message": "Task status updated successfully"
}
```

---

### 6. Get Materials

Get all material requests.

**Action:** `get_materials`

**Request:**
```json
{
  "action": "get_materials",
  "userId": "user-uuid-here"
}
```

**Response:**
```json
{
  "materials": [
    {
      "id": "material-uuid",
      "item": "2x4 lumber",
      "quantity": 50,
      "unit": "pieces",
      "comment": "For framing",
      "status": "new",
      "requested_by": "John Doe",
      "site": "Main Street Project",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 7. Request Material

Create a new material request.

**Action:** `request_material`

**Request:**
```json
{
  "action": "request_material",
  "userId": "user-uuid-here",
  "data": {
    "itemName": "Paint - White",
    "quantity": 10,
    "unit": "gallons",
    "comment": "For interior walls",
    "siteId": "site-uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Material request created successfully"
}
```

---

### 8. Update Material Status (Manager Only)

Update the status of a material request.

**Action:** `update_material_status`

**Request:**
```json
{
  "action": "update_material_status",
  "userId": "manager-uuid-here",
  "data": {
    "materialId": "material-uuid",
    "status": "approved"
  }
}
```

**Valid statuses:** `new`, `approved`, `ordered`, `delivered`

**Response:**
```json
{
  "success": true,
  "message": "Material status updated successfully"
}
```

---

### 9. Get Sites

Get all construction sites.

**Action:** `get_sites`

**Request:**
```json
{
  "action": "get_sites",
  "userId": "user-uuid-here"
}
```

**Response:**
```json
{
  "sites": [
    {
      "id": "site-uuid",
      "name": "Main Street Project",
      "description": "Residential renovation"
    }
  ],
  "count": 1
}
```

---

### 10. Get Workers (Manager Only)

Get all workers.

**Action:** `get_workers`

**Request:**
```json
{
  "action": "get_workers",
  "userId": "manager-uuid-here"
}
```

**Response:**
```json
{
  "workers": [
    {
      "id": "worker-uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "worker"
    }
  ],
  "count": 1
}
```

---

### 11. Get Timesheets

Get timesheet entries. Workers see only their own, managers can see all or filter by worker.

**Action:** `get_timesheets`

**Request (Worker):**
```json
{
  "action": "get_timesheets",
  "userId": "worker-uuid-here"
}
```

**Request (Manager - specific worker):**
```json
{
  "action": "get_timesheets",
  "userId": "manager-uuid-here",
  "data": {
    "workerId": "worker-uuid"
  }
}
```

**Response:**
```json
{
  "timesheets": [
    {
      "id": "timesheet-uuid",
      "date": "2024-01-15",
      "hours": 8,
      "work_type": "Framing",
      "notes": "Completed bedroom framing",
      "worker": "John Doe",
      "site": "Main Street Project"
    }
  ],
  "count": 1
}
```

---

### 12. Create Timesheet

Log work hours.

**Action:** `create_timesheet`

**Request:**
```json
{
  "action": "create_timesheet",
  "userId": "user-uuid-here",
  "data": {
    "siteId": "site-uuid",
    "date": "2024-01-15",
    "hours": 8,
    "workType": "Framing",
    "notes": "Completed bedroom framing"
  }
}
```

**Valid work types:** `Framing`, `Drywall`, `Electrical`, `Plumbing`, `HVAC`, `Painting`, `Flooring`, `Roofing`, `Other`

**Response:**
```json
{
  "success": true,
  "message": "Timesheet entry created successfully"
}
```

---

### 13. Get Task Summary

Get a summary of task counts by status.

**Action:** `get_task_summary`

**Request:**
```json
{
  "action": "get_task_summary",
  "userId": "user-uuid-here"
}
```

**Response:**
```json
{
  "summary": {
    "total": 15,
    "todo": 5,
    "in_progress": 7,
    "complete": 3
  }
}
```

---

## Setting Up in Voiceflow

### Step 1: Create API Integration Block

1. In Voiceflow, add an **API Integration** block
2. Set the **Method** to `POST`
3. Set the **URL** to: `https://jpujykkjrskihqskbovu.supabase.co/functions/v1/voiceflow-chatbot`

### Step 2: Configure Headers

Add the following headers:

- **Authorization**: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdWp5a2tqcnNraWhxc2tib3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDU1NDYsImV4cCI6MjA3Nzg4MTU0Nn0.25qLvfny-l83Kti3ivOxuHl9cRjs0PdkF3sRXkEu0NI`
- **Content-Type**: `application/json`

### Step 3: Configure Request Body

Use variables from your Voiceflow flow. Example for getting tasks:

```json
{
  "action": "get_my_tasks",
  "userId": "{user_id}"
}
```

### Step 4: Map Response

Map the API response to Voiceflow variables to use in your conversation flow.

---

## Example Voiceflow Conversation Flows

### Flow 1: Check My Tasks

**User:** "What are my tasks?"

**Voiceflow Actions:**
1. API call with `get_my_tasks`
2. Parse response
3. If tasks exist, list them
4. If no tasks, say "You have no assigned tasks"

### Flow 2: Update Task Status

**User:** "Mark task as complete"

**Voiceflow Actions:**
1. Ask which task (could use NLU to extract task ID from conversation)
2. API call with `update_task_status` and status `complete`
3. Confirm success

### Flow 3: Request Materials

**User:** "I need to order materials"

**Voiceflow Actions:**
1. Ask what material
2. Ask quantity and unit
3. Ask which site
4. API call with `request_material`
5. Confirm material request created

### Flow 4: Log Hours

**User:** "Log my hours"

**Voiceflow Actions:**
1. Ask for date (or use today)
2. Ask for hours worked
3. Ask for work type
4. Ask which site
5. API call with `create_timesheet`
6. Confirm hours logged

---

## User ID Management

The `userId` must be the UUID from the `profiles` table in your Supabase database. You can:

1. Have users provide their email, then look it up (you'd need to add a `get_user_by_email` action)
2. Store the userId in Voiceflow variables after initial login/authentication
3. Use Voiceflow's user identification features

---

## Error Handling

All errors return with appropriate HTTP status codes and error messages:

```json
{
  "error": "Error message here"
}
```

Common errors:
- Missing `userId`: 400 Bad Request
- Invalid action: 400 Bad Request
- Permission denied (e.g., worker trying to view all tasks): 200 OK with error in response
- Database errors: 500 Internal Server Error

---

## Testing the API

You can test the API using curl:

```bash
curl -X POST https://jpujykkjrskihqskbovu.supabase.co/functions/v1/voiceflow-chatbot \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdWp5a2tqcnNraWhxc2tib3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDU1NDYsImV4cCI6MjA3Nzg4MTU0Nn0.25qLvfny-l83Kti3ivOxuHl9cRjs0PdkF3sRXkEu0NI" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_sites",
    "userId": "your-user-uuid-here"
  }'
```

---

## Notes

- All dates should be in ISO 8601 format (e.g., `2024-01-15T10:00:00Z`)
- The API uses Row Level Security (RLS) policies to ensure users can only access their authorized data
- Manager-only actions will return an error if called by a worker
- The API returns up to 50 results for list queries to prevent overwhelming responses
