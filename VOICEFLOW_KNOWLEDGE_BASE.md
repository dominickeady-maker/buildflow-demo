# BuildFlow App Knowledge Base

## Overview

BuildFlow is a construction project management application designed for construction teams to manage tasks, materials, timesheets, photos, and site information. The app has two main user roles: Workers and Managers, each with different capabilities and access levels.

## User Roles

### Worker Role
Workers are field employees who:
- View and update their assigned tasks
- Log their work hours
- Request materials they need
- Upload photos of their work
- View drawings and blueprints
- Send and receive messages
- Manage their profile

### Manager Role
Managers are supervisors who:
- View dashboard with project overview
- Create, assign, and manage all tasks
- Add and remove workers
- View and approve timesheets for all workers
- Approve and manage material requests
- Create and manage construction sites
- Upload and manage drawings/blueprints
- View and organize all project photos
- Send and receive team messages
- Manage their profile

## Navigation

### For Workers
The app has 7 main tabs accessible from the top navigation:
1. My Tasks - View your assigned tasks
2. My Hours - Log your work hours
3. Request Materials - Submit material requests
4. Drawings - View blueprints and drawings
5. Photos - Upload and view project photos
6. Messages - Team communication
7. Profile - Manage your account settings

### For Managers
The app has 10 main tabs accessible from the top navigation:
1. Dashboard - Overview of all projects
2. Tasks - Manage all tasks
3. Workers - Add and manage workers
4. Timesheets - View and approve worker hours
5. Materials - Manage material requests
6. Sites - Create and manage construction sites
7. Drawings - Upload and manage blueprints
8. Photos - View and organize all photos
9. Messages - Team communication
10. Profile - Manage your account settings

## Feature Details

### Tasks (My Tasks for Workers / Tasks for Managers)

**What it does:**
Tasks represent work assignments on construction sites. Each task has a title, description, assigned worker, site location, and status.

**Task Statuses:**
- **To Do** - Task not yet started
- **In Progress** - Worker is currently working on it
- **Complete** - Task is finished

**How Workers Use Tasks:**
1. Click "My Tasks" tab to see all your assigned tasks
2. View task details including title, description, and site location
3. Click the status dropdown to update progress
4. Mark tasks as "In Progress" when you start working
5. Mark tasks as "Complete" when finished

**How Managers Use Tasks:**
1. Click "Tasks" tab to see all tasks
2. Click "Create Task" button to add a new task
3. Fill in task title, description, select site, and assign to a worker
4. View all tasks with status filters
5. Update or delete tasks as needed
6. See which worker is assigned to each task

### Hours Booking / Timesheets

**What it does:**
Track work hours by site, date, and work type for accurate time tracking and payroll.

**Work Types Available:**
- Framing
- Drywall
- Electrical
- Plumbing
- HVAC
- Painting
- Flooring
- Roofing
- Other

**How Workers Log Hours:**
1. Click "My Hours" tab
2. Click "Book Hours" button
3. Select the site you worked at
4. Select the date (today or previous dates)
5. Enter hours worked (can use decimals, e.g., 7.5)
6. Select work type from dropdown
7. Add notes about what you did (optional)
8. Submit the entry

**How Managers View Timesheets:**
1. Click "Timesheets" tab
2. View all worker hours in a table
3. Filter by date range or worker
4. Export timesheet data to CSV for payroll
5. See total hours per worker

### Materials

**What it does:**
Request and track materials needed for construction projects. Prevents delays by ensuring materials are ordered and delivered on time.

**Material Statuses:**
- **New** - Just submitted, awaiting review
- **Approved** - Manager approved, ready to order
- **Ordered** - Order placed with supplier
- **Delivered** - Materials arrived on site

**How Workers Request Materials:**
1. Click "Request Materials" tab
2. Click "Request Materials" button
3. Enter item name (e.g., "2x4 Lumber")
4. Enter quantity needed
5. Enter unit (e.g., "pieces", "gallons", "boxes")
6. Select which site needs the materials
7. Add notes or specifications (optional)
8. Submit request

**How Managers Handle Material Requests:**
1. Click "Materials" tab
2. See all material requests with current status
3. Review new requests
4. Update status as materials move through the process:
   - Approve requests
   - Mark as "Ordered" when placed with supplier
   - Mark as "Delivered" when materials arrive
5. Filter by status or site
6. Delete outdated or duplicate requests

### Sites

**What it does:**
Manage all construction site locations. Sites are used throughout the app to organize tasks, materials, photos, and timesheets.

**How to Use Sites (Manager Only):**
1. Click "Sites" tab
2. Click "Add Site" button to create new site
3. Enter site name (e.g., "123 Main Street Renovation")
4. Enter description with project details
5. Submit to save
6. Edit site information by clicking the edit icon
7. Delete sites that are no longer active
8. Sites appear in dropdowns throughout the app

**Important:** You must create at least one site before creating tasks or logging hours.

### Drawings

**What it does:**
Store and access construction blueprints, plans, and technical drawings. Ensures everyone has access to the latest plans.

**How to Use Drawings:**
1. Click "Drawings" tab
2. **Upload** (Managers only):
   - Click "Upload Drawing" button
   - Select PDF file from your computer
   - Enter drawing name
   - Add description
   - Submit
3. **View**:
   - See all drawings in a grid
   - Click download icon to get PDF file
   - See drawing name, description, and upload date
   - Managers can delete outdated drawings

**Supported Format:** PDF files only

### Photos

**What it does:**
Document work progress with photos. Track before/after shots, completed work, and issues that arise.

**How to Upload Photos:**
1. Click "Photos" tab
2. Click "Upload Photos" button
3. Select site location
4. Optionally link to a specific task
5. Click to select photos or drag and drop
6. Add caption/description for each photo
7. Photos upload automatically
8. Supports HEIC format (iPhone photos) - automatically converts to JPG

**How to Organize Photos:**
1. Filter photos by site using the dropdown
2. View photos in a grid layout
3. Click on photo to view full size
4. See photo details: site, task, date, uploaded by
5. Managers can delete photos
6. Photos are organized chronologically

**Photo Limits:**
- Multiple photos can be uploaded at once
- Each photo should be under 10MB for best performance
- HEIC files are automatically converted to JPG

### Messages

**What it does:**
Team communication channel for asking questions, sharing updates, and coordinating work.

**How to Use Messages:**
1. Click "Messages" tab
2. See conversation thread with newest messages at bottom
3. Type your message in the text box at bottom
4. Press Enter or click Send button
5. Messages show sender name and timestamp
6. All team members in your organization can see messages
7. Messages update in real-time

**Best Practices:**
- Use for quick questions and updates
- Reference task names or site names for clarity
- Keep messages professional and constructive

### Profile (Account Settings)

**What it does:**
Manage your personal account information and view your role.

**Profile Information:**
- Full name
- Email address
- Role (Worker or Manager)
- Organization membership
- Account creation date

**How to Update Profile:**
1. Click "Profile" tab
2. View your current information
3. Update name or email if needed
4. Save changes

**Note:** You cannot change your own role. Contact your organization admin to change roles.

### Dashboard (Manager Only)

**What it does:**
Provides an overview of all projects, tasks, and activity across the organization.

**Dashboard Includes:**
- Task statistics (total, to do, in progress, complete)
- Recent activity feed
- Worker status overview
- Site summaries
- Material request counts
- Quick action buttons

## Common User Workflows

### Worker: Starting Your Day
1. Sign in to BuildFlow
2. Go to "My Tasks" to see what's assigned to you
3. Review task details and site locations
4. Update task status to "In Progress" when you start
5. Check "Drawings" if you need to reference plans
6. Upload photos of your work as you progress
7. At end of day, go to "My Hours" and log your time
8. Mark tasks as "Complete" when finished

### Worker: Requesting Materials
1. Realize you need materials while working
2. Go to "Request Materials"
3. Click "Request Materials" button
4. Fill in what you need with quantities
5. Submit request
6. Manager will review and approve
7. Materials will be ordered and delivered

### Manager: Creating a New Project
1. Go to "Sites" and create new site
2. Go to "Tasks" and create tasks for the project
3. Assign tasks to specific workers
4. Upload relevant drawings/blueprints
5. Monitor progress on Dashboard
6. Approve material requests as they come in
7. Review timesheets at end of week

### Manager: Onboarding New Worker
1. Go to "Workers" tab
2. Click "Add Worker" button
3. Enter worker's full name
4. Enter their email address
5. Create a temporary password (worker should change it)
6. Worker receives account and can sign in
7. Assign tasks to the new worker

### Manager: Weekly Review
1. Check Dashboard for project status
2. Review "Timesheets" for all workers
3. Export timesheet data for payroll
4. Review and approve pending material requests
5. Check "Photos" to verify work progress
6. Update task statuses based on progress
7. Create new tasks for upcoming week

## Tips and Best Practices

### For Workers
- Update task status regularly so managers know your progress
- Log hours daily, don't wait until end of week
- Take photos before, during, and after work for documentation
- Request materials early to avoid delays
- Check Messages daily for team updates

### For Managers
- Create clear, detailed task descriptions
- Assign realistic deadlines and workloads
- Review and approve material requests promptly
- Check photos regularly to monitor quality
- Export timesheets weekly for accurate payroll
- Keep site information up to date
- Communicate clearly through Messages

## Troubleshooting

### Cannot See Tasks
- Workers only see tasks assigned to them
- Make sure a manager has assigned tasks to you
- Check that tasks exist for your sites

### Cannot Upload Photos
- Ensure you've selected a site first
- Check file size (should be under 10MB)
- Try refreshing the page
- Supported formats: JPG, PNG, HEIC

### Hours Not Saving
- Make sure you've selected a site
- Ensure hours is a positive number
- Select a work type from the dropdown
- Check that date is not in the future

### Material Request Not Showing
- Check the status filter
- Make sure you selected the correct site
- Refresh the page

### Cannot Delete Worker
- Only managers can delete workers
- Worker may have associated data (tasks, timesheets)
- Try reassigning their tasks first

## Technical Notes

### Authentication
- Email and password login
- Sessions persist across browser sessions
- Secure authentication through Supabase
- Password requirements: minimum 6 characters

### Data Security
- All data is organization-specific
- Users only see data for their organization
- Role-based access control (workers vs managers)
- Secure file storage for photos and drawings

### Browser Support
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Works on tablets and smartphones
- Best experience on desktop/laptop

### Data Export
- Timesheets can be exported to CSV
- CSV files open in Excel or Google Sheets
- Includes all timesheet data for selected period

## Frequently Asked Questions

**Q: How do I change my password?**
A: Click on Profile tab, then use the password change option.

**Q: Can I assign a task to multiple workers?**
A: No, each task can only be assigned to one worker at a time. Create separate tasks if multiple workers need to work on the same item.

**Q: How far back can I log hours?**
A: You can log hours for any past date. Talk to your manager about the cutoff policy for your organization.

**Q: What happens to tasks when a worker is deleted?**
A: Tasks assigned to deleted workers become unassigned. Managers should reassign these tasks.

**Q: Can I see other workers' tasks?**
A: Workers can only see their own tasks. Managers can see all tasks.

**Q: How do I know if my material request was approved?**
A: Check the status in the Materials tab. It will change from "New" to "Approved" to "Ordered" to "Delivered".

**Q: Can I upload videos?**
A: Currently only photos are supported (JPG, PNG, HEIC formats).

**Q: How do I report a problem or bug?**
A: Use the Messages tab to contact your manager or organization admin.

**Q: Can I edit a timesheet entry after submitting?**
A: Currently no, contact your manager if you made a mistake.

**Q: What if I work at multiple sites in one day?**
A: Create separate timesheet entries for each site with the hours split accordingly.

## Conclusion

BuildFlow streamlines construction project management by centralizing tasks, timesheets, materials, photos, and communication in one easy-to-use platform. Whether you're a worker in the field or a manager coordinating multiple projects, BuildFlow helps you stay organized and productive.
