# Question About Duplicating Bolt.new Project for Demo Purposes

I'm working in Bolt.new (an AI-powered web development environment) and I'm trying to duplicate my BuildFlow construction management app so I can create demo instances for potential customers.

## What I'm Trying to Do:
- Create a duplicate/copy of my entire BuildFlow project
- Each demo should be independent with its own database
- I want to be able to give each potential customer their own demo instance

## Current Project Setup:
- Built with React + TypeScript + Vite
- Uses Supabase for database (auth, tables, storage)
- Has multiple features: worker dashboard, manager dashboard, photo manager, timesheets, etc.
- Database tables: profiles, tasks, materials, sites, timesheets, construction_photos, photo_reports
- Uses Supabase Storage for photo uploads

## The Problem:
When I ask Claude (the AI in Bolt.new) to duplicate the project, it just copies the files to a new directory. But this doesn't work because:
- The copy still points to the SAME Supabase database
- There's no way to give each customer their own isolated demo
- The instructions you're giving me (ChatGPT) don't work in Bolt.new's environment

## Bolt.new Environment Constraints:
- I cannot manually create new Supabase projects
- I cannot change environment variables for multiple instances
- Bolt.new manages the Supabase connection automatically
- I'm working within a web-based IDE with limited file system access

## What I Need:
Clear guidance on how to create multiple demo instances of my app within Bolt.new's constraints, where each demo customer gets their own isolated data/database.

**What is the correct approach to achieve this in Bolt.new?** Should I be using:
- Multi-tenancy with user isolation in a single database?
- Some other approach that works within Bolt.new's environment?
- Is this even possible in Bolt.new, or do I need to deploy elsewhere?

Please provide practical advice that will work within Bolt.new's limitations.
