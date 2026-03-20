# BuildFlow Multi-Tenancy Guide

## Overview

BuildFlow now supports multi-tenancy, allowing you to serve multiple customers from a single Bolt project while keeping their data completely isolated.

## How It Works

### Database Structure

1. **Organizations Table**: Each customer gets an organization record
   - `id`: Unique identifier
   - `name`: Customer company name
   - `slug`: URL-friendly identifier (e.g., 'acme-construction')
   - `settings`: Custom settings per organization
   - `active`: Enable/disable organizations

2. **Organization Links**: All tables now have `organization_id`:
   - profiles
   - tasks
   - materials
   - sites
   - timesheets
   - construction_photos
   - photo_reports

3. **Row Level Security (RLS)**: Every query automatically filters by organization_id
   - Users only see data from their organization
   - Complete data isolation between customers
   - No code changes needed per customer

## Onboarding a New Customer

### Step 1: Create Organization in Database

Run this SQL in Bolt's Database tab:

```sql
INSERT INTO organizations (name, slug, settings, active)
VALUES ('Customer Company Name', 'customer-slug', '{}', true);
```

### Step 2: Invite Customer Users

When users sign up, they are automatically assigned to the default organization ('demo-construction'). To assign them to a specific organization:

```sql
-- Get the organization ID
SELECT id FROM organizations WHERE slug = 'customer-slug';

-- Update user's profile
UPDATE profiles
SET organization_id = 'org-uuid-here'
WHERE email = 'customer@example.com';
```

### Step 3: That's It!

The customer can now:
- Sign in to the same Bolt app
- Only see their organization's data
- Add team members (who will inherit the same organization)

## Benefits of This Approach

1. **Single Codebase**: One Bolt project serves all customers
2. **Easy Updates**: Changes apply to all customers instantly
3. **Cost Effective**: One database, one deployment
4. **Secure**: RLS ensures complete data isolation
5. **Scalable**: Add unlimited customers without new deployments

## Limitations in Bolt

❌ **You CANNOT**: Create separate Bolt Database instances per customer

✅ **You CAN**: Use multi-tenancy as shown above

## Alternative: Deploy Outside Bolt

If you need fully separate databases per customer, you must deploy outside Bolt:

1. Deploy to Vercel/Netlify
2. Create separate Supabase projects per customer
3. Configure environment variables per deployment

But this is more complex and expensive than multi-tenancy!

## How to Demo to Customers

1. Create a new organization for each demo customer
2. Create demo accounts assigned to that organization
3. Each customer sees only their data
4. After demo, either keep or delete the organization

## Managing Organizations

### List All Organizations
```sql
SELECT * FROM organizations ORDER BY created_at DESC;
```

### Deactivate an Organization
```sql
UPDATE organizations SET active = false WHERE slug = 'customer-slug';
```

### Delete an Organization (and ALL its data)
```sql
DELETE FROM organizations WHERE slug = 'customer-slug';
-- This CASCADE deletes all related data!
```

## Security Notes

- RLS policies automatically enforce organization boundaries
- Users cannot see or modify data from other organizations
- The `organization_id` check happens at the database level
- Even if app code has bugs, RLS protects the data

## Questions?

This multi-tenancy setup works within Bolt's constraints and provides production-ready customer isolation. Each customer gets their own logical "database" within the same physical database.
