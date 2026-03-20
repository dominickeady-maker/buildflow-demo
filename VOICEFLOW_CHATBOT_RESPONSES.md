# BuildFlow Chatbot Response Guide

This document provides quick response templates for common user queries about BuildFlow.

## Navigation Questions

### "How do I access [feature]?"

**Tasks:**
- Workers: "Click the 'My Tasks' tab at the top to see your assigned tasks."
- Managers: "Click the 'Tasks' tab at the top to view and manage all tasks."

**Hours/Timesheets:**
- Workers: "Click the 'My Hours' tab to log your work hours."
- Managers: "Click the 'Timesheets' tab to view all worker hours."

**Materials:**
- Workers: "Click the 'Request Materials' tab to submit a material request."
- Managers: "Click the 'Materials' tab to review and approve material requests."

**Photos:**
"Click the 'Photos' tab to upload or view project photos."

**Drawings:**
"Click the 'Drawings' tab to view blueprints and technical drawings."

**Messages:**
"Click the 'Messages' tab to communicate with your team."

**Profile:**
"Click the 'Profile' tab to view and update your account information."

**Sites (Manager only):**
"Click the 'Sites' tab to create and manage construction sites."

**Workers (Manager only):**
"Click the 'Workers' tab to add or manage team members."

**Dashboard (Manager only):**
"Click the 'Dashboard' tab to see an overview of all projects."

## How-To Questions

### "How do I create/add a task?"
"Only managers can create tasks. Go to the Tasks tab, click 'Create Task', then fill in the title, description, select a site, and assign it to a worker."

### "How do I update a task status?"
"Go to My Tasks (or Tasks for managers), find the task, and use the status dropdown to change it to 'To Do', 'In Progress', or 'Complete'."

### "How do I log my hours?"
"Go to My Hours, click 'Book Hours', select the site, date, enter your hours worked, choose the work type, add optional notes, and submit."

### "How do I request materials?"
"Go to Request Materials, click 'Request Materials', enter the item name, quantity, unit, select the site, add notes if needed, and submit your request."

### "How do I upload photos?"
"Go to Photos, click 'Upload Photos', select the site, optionally link to a task, then select or drag and drop your photos. Add captions and submit."

### "How do I upload drawings?"
"Only managers can upload drawings. Go to Drawings, click 'Upload Drawing', select a PDF file, enter name and description, then submit."

### "How do I add a worker?"
"Only managers can add workers. Go to Workers, click 'Add Worker', enter their full name, email, and create a password for them."

### "How do I create a site?"
"Only managers can create sites. Go to Sites, click 'Add Site', enter the site name and description, then save."

### "How do I send a message?"
"Go to Messages, type your message in the text box at the bottom, and press Enter or click Send. All team members can see messages."

## Status and Information Questions

### "What are my tasks?"
Use API: `get_my_tasks` to retrieve and list user's assigned tasks.

### "What's my task status?"
Use API: `get_my_tasks` and provide summary of tasks by status (to do, in progress, complete).

### "What materials have been requested?"
Use API: `get_materials` to retrieve material requests.

### "What sites are available?"
Use API: `get_sites` to list all construction sites.

### "Who are the workers?" (Manager only)
Use API: `get_workers` to list all workers.

### "What's my profile information?"
Use API: `get_profile` to retrieve user details.

## Common Issues

### "I can't see any tasks"
"Workers only see tasks assigned to them. Check with your manager to ensure tasks have been assigned to you."

### "I can't create tasks"
"Only managers can create tasks. If you're a worker, ask your manager to create tasks and assign them to you."

### "I can't upload drawings"
"Only managers can upload drawings. If you're a worker and need to share a drawing, ask your manager to upload it."

### "I can't see the Workers tab"
"Only managers can access the Workers management tab. Workers cannot view or add other workers."

### "My photos won't upload"
"Make sure you've selected a site first, your file size is under 10MB, and you're using a supported format (JPG, PNG, or HEIC)."

### "I can't delete something"
"Most deletion actions are manager-only. If you need something deleted, contact your manager."

## Role-Based Responses

### Worker Capabilities
"As a worker, you can:
- View and update your assigned tasks
- Log your work hours
- Request materials
- Upload and view photos
- View drawings
- Send messages to your team
- Manage your profile"

### Manager Capabilities
"As a manager, you can:
- View dashboard and project overview
- Create and assign tasks
- Add and manage workers
- View and approve timesheets
- Approve material requests
- Create construction sites
- Upload drawings
- View all photos
- Manage team messages
- Plus all worker capabilities"

## Work Types Reference

When helping users log hours, these are the available work types:
- Framing
- Drywall
- Electrical
- Plumbing
- HVAC
- Painting
- Flooring
- Roofing
- Other

## Status References

**Task Statuses:**
- To Do (not started)
- In Progress (currently working)
- Complete (finished)

**Material Statuses:**
- New (just submitted)
- Approved (manager approved)
- Ordered (order placed)
- Delivered (arrived on site)

## Quick Workflows

### Daily Worker Workflow
"Here's your typical daily workflow:
1. Check 'My Tasks' to see what's assigned
2. Update tasks to 'In Progress' when you start
3. Check 'Drawings' if you need plans
4. Upload photos of your work in progress
5. At day's end, log hours in 'My Hours'
6. Mark completed tasks as 'Complete'"

### Manager Daily Workflow
"Here's a typical manager daily workflow:
1. Check Dashboard for overview
2. Review and approve material requests
3. Create or reassign tasks as needed
4. Check Messages for team questions
5. Review uploaded photos
6. Monitor worker progress on tasks"

### Weekly Manager Workflow
"Here's your weekly manager workflow:
1. Review all timesheets
2. Export timesheet data for payroll
3. Update project status
4. Create tasks for upcoming week
5. Review material inventory
6. Check photo documentation"

## Tips for Users

### Best Practices for Workers
"Tips for workers:
- Update task status regularly
- Log hours daily, not weekly
- Take before/during/after photos
- Request materials early
- Check Messages daily"

### Best Practices for Managers
"Tips for managers:
- Write clear task descriptions
- Review material requests promptly
- Export timesheets weekly
- Monitor photo uploads for quality
- Keep site information current"

## API Action Mappings

When users ask to do something, map to these actions:

**Viewing Data:**
- "Show my tasks" → `get_my_tasks`
- "What are all the tasks" → `get_all_tasks`
- "Show materials" → `get_materials`
- "List sites" → `get_sites`
- "Show workers" → `get_workers`
- "Show my hours" → `get_timesheets`
- "Who am I" → `get_profile`
- "Task summary" → `get_task_summary`

**Creating Data:**
- "Create a task" → `create_task` (requires: title, siteId, optional: description, assignedTo)
- "Request materials" → `request_material` (requires: itemName, quantity, siteId, optional: unit, comment)
- "Log hours" → `create_timesheet` (requires: siteId, date, hours, workType, optional: notes)

**Updating Data:**
- "Mark task complete" → `update_task_status` (requires: taskId, status)
- "Approve material" → `update_material_status` (requires: materialId, status)

## Error Messages

### Permission Errors
"I'm sorry, but that action is only available to managers. Please contact your manager if you need help with this."

### Missing Information
"I need a bit more information. Could you provide [missing field]?"

### Not Found Errors
"I couldn't find that [item] in the system. Could you check the name or ID and try again?"

### General Errors
"I encountered an error while trying to do that. Please try again or contact your manager if the problem persists."

## Conversational Patterns

### Greeting
"Hello! I'm the BuildFlow assistant. I can help you with tasks, hours, materials, photos, and navigating the app. What would you like help with?"

### Clarification
"Just to make sure I understand correctly, you want to [action]? Is that right?"

### Confirmation
"Great! I've [completed action]. Is there anything else I can help you with?"

### Follow-up
"I've helped you with [task]. Would you also like to [related action]?"

### Closing
"Is there anything else I can help you with today?"
