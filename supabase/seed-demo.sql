-- BuildFlow Demo Seed / Reset Script
-- Run this to restore the demo to a known-good state.
-- Safe to re-run: uses conditional DELETEs and re-inserts.
--
-- Usage via Supabase MCP:
--   execute_sql with the contents of this file
--
-- Or via Supabase SQL Editor in the dashboard.
--
-- Prerequisites:
--   - Images must exist in storage at:
--     drawings/demo-seed/drawing-*-sm.webp  (compressed, ~50-150 KB each)
--     construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-*-sm.webp  (compressed, ~100-190 KB each)
--     construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-*-sm.webp  (thumbnails, ~15-25 KB each)

-- ============================================================
-- 1. REMOVE THIN/TEST SITES
-- ============================================================
-- These four sites were early test entries with 0-1 tasks,
-- no client details, and lowercase names. Remove them and all
-- related data so the dashboard only shows the three real sites.

-- Delete photos linked to tasks on those sites
DELETE FROM construction_photos WHERE task_id IN (
  SELECT id FROM tasks WHERE site_id IN (
    '0914e895-5dae-4952-af15-96844b88caf6', -- ainley top flats
    'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c', -- clough road
    'd965c677-fa2a-49be-a1d9-95e746436f89', -- lingards fold
    '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'  -- New build in holmfirth
  )
);

-- Delete drawings on those sites
DELETE FROM drawings WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);

-- Delete timesheets on those sites
DELETE FROM timesheets WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);

-- Delete materials on those sites
DELETE FROM materials WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);

-- Delete tasks on those sites
DELETE FROM tasks WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);

-- Delete the sites themselves
DELETE FROM sites WHERE id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);

-- ============================================================
-- 2. RESET TASK STATUSES
-- ============================================================
-- Target: ~1/3 todo, ~1/3 in_progress, ~1/3 complete
-- Jake Brennan (91fcdfdd) must have at least 2 tasks in "todo"

-- Reset all remaining tasks to todo first
UPDATE tasks SET status = 'todo', completed_at = NULL, completed_by = NULL WHERE status IS NOT NULL;

-- Mark specific tasks as in_progress
UPDATE tasks SET status = 'in_progress', completed_at = NULL, completed_by = NULL
WHERE id IN (
  '1b3e0005-a4a2-4b6d-955b-5803e4d07730', -- Brickwork to DPC level (Jake, Plot 4)
  '74c52ec6-271c-40ee-84fd-54425adf8507', -- Pour concrete foundations (Danny, Meltham Road)
  '1a68a77e-fe7b-44f7-b530-ecb7616bc696'  -- BCO sign-off — DPC level (Dom, Plot 4)
);

-- Mark specific tasks as complete
UPDATE tasks SET status = 'complete',
  completed_at = '2026-09-01T16:00:00Z'::timestamptz,
  completed_by = '164abd7c-ba0c-40f4-a7ad-c287c9336f67'
WHERE id = 'fc383a8b-f887-4bc3-a7c8-7faf0852d964'; -- Pour strip footings — Plot 4

UPDATE tasks SET status = 'complete',
  completed_at = '2026-09-02T15:00:00Z'::timestamptz,
  completed_by = '164abd7c-ba0c-40f4-a7ad-c287c9336f67'
WHERE id = 'b7a29bbe-6ae7-42e8-bd3f-6d3876cf6dd7'; -- Set out foundations

UPDATE tasks SET status = 'complete',
  completed_at = '2026-09-02T17:00:00Z'::timestamptz,
  completed_by = '164abd7c-ba0c-40f4-a7ad-c287c9336f67'
WHERE id = '3afa2b82-bedb-4314-8210-a4431ed343e6'; -- Excavate strip footings

UPDATE tasks SET status = 'complete',
  completed_at = '2026-09-03T12:00:00Z'::timestamptz,
  completed_by = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2'
WHERE id = '5730f560-29e6-4923-8863-0606ed01af92'; -- Install RSJ — kitchen opening

UPDATE tasks SET status = 'complete',
  completed_at = '2026-09-04T14:00:00Z'::timestamptz,
  completed_by = '78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2'
WHERE id = '78f64dee-c5ef-461d-acd3-a22b372e85a4'; -- Break out existing rear wall

-- ============================================================
-- 3. DRAWINGS (compressed images, ~50-150 KB each)
-- ============================================================
DELETE FROM drawings WHERE file_url LIKE '%/demo-seed/%';

INSERT INTO drawings (organization_id, site_id, title, description, file_url, file_type, file_size, category, version) VALUES
-- Plot 4 — Marsden Road
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Ground Floor Plan — Rev C', 'Ground floor layout, dimensions, room sizes', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-ground-floor-plan-sm.webp', 'image/webp', 61688, 'Architectural', 'C'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Foundation Detail — Rev B', 'Strip foundation cross-section, reinforcement detail', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-foundation-detail-sm.webp', 'image/webp', 77034, 'Structural', 'B'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Elevations — Rev A', 'Front and rear elevations, brickwork, roofline', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-elevations-sm.webp', 'image/webp', 138130, 'Architectural', 'A'),
-- Rear Extension — Holmfirth
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Proposed Plans & Elevations — Rev D', 'Existing and proposed layout, two storey extension', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-proposed-plans-sm.webp', 'image/webp', 109439, 'Architectural', 'D'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'RSJ / Padstone Detail — Rev A', 'Steel beam support, padstone specification, loading', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-rsj-padstone-sm.webp', 'image/webp', 52736, 'Structural', 'A'),
-- New Build — Meltham Road
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Site Layout — Rev B', 'Plot positions, access roads, boundaries', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-site-layout-sm.webp', 'image/webp', 153707, 'Site', 'B'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Drainage Layout — Rev A', 'Foul and surface water drains, manholes, gradients', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-drainage-layout-sm.webp', 'image/webp', 142106, 'Services', 'A');

-- ============================================================
-- 4. CONSTRUCTION PHOTOS (compressed, ~100-190 KB full, ~15-25 KB thumb)
-- ============================================================
DELETE FROM construction_photos WHERE image_url LIKE '%/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-%';

INSERT INTO construction_photos (user_id, organization_id, image_url, thumbnail_url, description, task_id, issues, ai_processing, metadata) VALUES
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-brickwork-dpc-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-brickwork-dpc-sm.webp',
  'Brickwork to DPC — east elevation', '1b3e0005-a4a2-4b6d-955b-5803e4d07730', '[]'::jsonb, false, '{"uploadedAt": "2026-09-08T08:00:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-joists-install-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-joists-install-sm.webp',
  'Cavity wall ready for insulation — west elevation', '1368af72-a6eb-4d1d-adce-fa32456d0637', '[]'::jsonb, false, '{"uploadedAt": "2026-09-08T09:30:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-rsj-installed-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-rsj-installed-sm.webp',
  'RSJ installed, padstones bedded', '5730f560-29e6-4923-8863-0606ed01af92', '[]'::jsonb, false, '{"uploadedAt": "2026-09-07T14:00:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-blockwork-walls-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-blockwork-walls-sm.webp',
  'Blockwork to extension walls — progress shot', '355d3cd4-c964-4245-bd11-21dafcd59642', '[]'::jsonb, false, '{"uploadedAt": "2026-09-08T11:00:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-foundations-poured-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-foundations-poured-sm.webp',
  'Foundations poured — strip footings complete', '3afa2b82-bedb-4314-8210-a4431ed343e6', '[]'::jsonb, false, '{"uploadedAt": "2026-09-06T16:00:00Z"}'::jsonb);

-- ============================================================
-- 5. MESSAGES — realistic demo threads
-- ============================================================
-- Manager: Dom Keady (923b1109-85c9-402f-a443-3c88588a60ec)
-- Jake Brennan: 91fcdfdd-d9d0-42d7-a837-df84fb34ebc2
-- Ryan Sutcliffe: b0000001-0000-0000-0000-000000000001
-- Org: 51e8233d-3cd8-4580-a867-a6e58f860801

DELETE FROM messages;

INSERT INTO messages (sender_id, receiver_id, message, read, created_at, organization_id) VALUES
-- Thread 1: Jake Brennan <-> Manager, Plot 4 Marsden Road
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '923b1109-85c9-402f-a443-3c88588a60ec', 'Blocks are down to about half a pack. Will need another 2 packs before Thursday or we''ll be stood about.', true, '2026-09-08T07:15:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('923b1109-85c9-402f-a443-3c88588a60ec', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'Ordered this morning, Travis are delivering Wednesday am. Leave the drop next to the site cabin, not the driveway.', true, '2026-09-08T08:30:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '923b1109-85c9-402f-a443-3c88588a60ec', 'No problem. DPC will be done by then.', false, '2026-09-08T09:45:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),

-- Thread 2: Ryan Sutcliffe <-> Manager, Rear Extension Holmfirth
('b0000001-0000-0000-0000-000000000001', '923b1109-85c9-402f-a443-3c88588a60ec', 'Is the RSJ detail on Rev A still current? Steel arrives Monday and the padstone sizes look different to what''s on site.', true, '2026-09-09T10:20:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('923b1109-85c9-402f-a443-3c88588a60ec', 'b0000001-0000-0000-0000-000000000001', 'Good spot. Rev B went up last night, padstones are 215 not 140. Use the Rev B drawing.', true, '2026-09-09T11:05:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('b0000001-0000-0000-0000-000000000001', '923b1109-85c9-402f-a443-3c88588a60ec', 'Got it, thanks.', false, '2026-09-09T11:30:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),

-- Thread 3: Manager <-> Jake Brennan, New Build Meltham Road
('923b1109-85c9-402f-a443-3c88588a60ec', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'Can you get a few photos of the foundations before the pour so we''ve got them for building control?', true, '2026-09-10T06:45:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '923b1109-85c9-402f-a443-3c88588a60ec', 'Done, uploaded four just now.', false, '2026-09-10T07:30:00Z'::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801');

-- ============================================================
-- 6. PROGRAMME MILESTONES — programme of works per site
-- ============================================================
DELETE FROM programme_milestones WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';

-- Plot 4 — Marsden Road: New build preset with dates on first 6 milestones
-- Milestones 0-1: complete (actual dates set)
-- Milestone 2: target in past, no actual → overdue
-- Milestone 3: target within 7 days → due
-- Milestones 4-5: target in future → not started
-- Rest: TBC
INSERT INTO programme_milestones (organization_id, site_id, milestone_name, sort_order, target_date, actual_date, notes) VALUES
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Site set-up & welfare', 0, '2026-07-06', '2026-07-08', ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Site strip / reduce dig', 1, '2026-07-09', '2026-07-15', ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Setting out', 2, '2026-08-01', NULL, 'Waiting on setting-out engineer'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Temporary services', 3, '2026-09-18', NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Foundations dug', 4, '2026-09-25', NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'NHBC/BC excavation inspection', 5, '2026-09-29', NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Foundations poured', 6, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Footings up to DPC', 7, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'DPC laid (FFL to DPC)', 8, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Below-ground drainage', 9, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Oversite / ground floor slab', 10, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Beam & block floor laid', 11, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'First lift', 12, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Ground floor lintels & frames', 13, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Scaffold first lift', 14, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'First floor joists on (floors on)', 15, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Second lift', 16, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Gables up', 17, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Wall plate on', 18, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Steels in (RSJ)', 19, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Roof trusses / rafters set', 20, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Roof on (felt & batten)', 21, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Tiling / slating complete', 22, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Fascias, soffits & guttering', 23, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Windows & external doors in', 24, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Watertight / weathertight', 25, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'NHBC/BC superstructure inspection', 26, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Internal studwork & partitions', 27, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', '1st fix carpentry', 28, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', '1st fix electrics', 29, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', '1st fix plumbing & heating', 30, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Insulation & airtightness', 31, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'NHBC/BC pre-plaster inspection', 32, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Plasterboard / dot & dab', 33, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Plastering & skim', 34, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Floor screed', 35, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', '2nd fix carpentry (doors, skirting, architrave)', 36, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', '2nd fix electrics', 37, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', '2nd fix plumbing & sanitaryware', 38, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Kitchen fit', 39, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Wall & floor tiling', 40, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Decoration', 41, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Floor coverings', 42, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'External render / brick clean', 43, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Scaffold struck', 44, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Drives, paths & patios', 45, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Landscaping & turfing', 46, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Fencing & boundaries', 47, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Commissioning & testing', 48, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Air test / EPC', 49, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Building Control sign-off', 50, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Pre-handover inspection', 51, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Snagging', 52, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Practical completion / handover', 53, NULL, NULL, '');

-- Rear Extension — Holmfirth: Extension preset with a few dates
INSERT INTO programme_milestones (organization_id, site_id, milestone_name, sort_order, target_date, actual_date, notes) VALUES
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Site set-up & protection', 0, '2026-08-03', '2026-08-05', ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Break out / demolition', 1, '2026-08-06', '2026-08-15', ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Foundations dug', 2, '2026-08-18', '2026-08-25', ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Foundations poured', 3, '2026-08-27', '2026-08-29', ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Footings up to DPC', 4, '2026-09-01', NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Drainage & manhole alterations', 5, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Oversite / slab', 6, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Superstructure blockwork', 7, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Steels in (RSJ)', 8, NULL, NULL, 'Waiting on steel fabrication'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Wall plate on', 9, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Roof structure', 10, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Roof covering', 11, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Windows & external doors in', 12, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Watertight', 13, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Knock-through / opening formed', 14, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', '1st fix trades', 15, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Plastering', 16, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', '2nd fix trades', 17, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Kitchen / bathroom fit', 18, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Decoration', 19, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'External works & making good', 20, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Snagging', 21, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Handover', 22, NULL, NULL, '');

-- New Build — Meltham Road: Extension preset, all TBC
INSERT INTO programme_milestones (organization_id, site_id, milestone_name, sort_order, target_date, actual_date, notes) VALUES
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Site set-up & protection', 0, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Break out / demolition', 1, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Foundations dug', 2, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Foundations poured', 3, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Footings up to DPC', 4, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Drainage & manhole alterations', 5, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Oversite / slab', 6, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Superstructure blockwork', 7, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Steels in (RSJ)', 8, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Wall plate on', 9, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Roof structure', 10, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Roof covering', 11, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Windows & external doors in', 12, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Watertight', 13, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Knock-through / opening formed', 14, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', '1st fix trades', 15, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Plastering', 16, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', '2nd fix trades', 17, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Kitchen / bathroom fit', 18, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Decoration', 19, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'External works & making good', 20, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Snagging', 21, NULL, NULL, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Handover', 22, NULL, NULL, '');

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Sites:' as info;
SELECT s.name, s.description, count(t.id) as task_count
FROM sites s LEFT JOIN tasks t ON t.site_id = s.id
GROUP BY s.id, s.name, s.description ORDER BY s.name;

SELECT 'Task status spread:' as info;
SELECT status, count(*) FROM tasks GROUP BY status ORDER BY status;

SELECT 'Jake Brennan tasks:' as info;
SELECT t.title, t.status, s.name as site_name
FROM tasks t JOIN sites s ON t.site_id = s.id
WHERE t.assigned_to = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2'
ORDER BY t.status, t.title;

SELECT 'Drawings:' as info;
SELECT d.title, d.version, d.file_size, s.name as site_name
FROM drawings d JOIN sites s ON d.site_id = s.id ORDER BY s.name;

SELECT 'Photos:' as info;
SELECT cp.description, t.title as task_title
FROM construction_photos cp LEFT JOIN tasks t ON cp.task_id = t.id
ORDER BY cp.created_at;

SELECT 'Programme milestones:' as info;
SELECT pm.milestone_name, pm.target_date, pm.actual_date, pm.notes, s.name as site_name
FROM programme_milestones pm JOIN sites s ON pm.site_id = s.id
ORDER BY pm.site_id, pm.sort_order;
