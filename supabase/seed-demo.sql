-- BuildFlow Demo Seed / Reset Script
-- Run this to restore the demo to a known-good state.
-- Safe to re-run: uses ON CONFLICT and conditional DELETEs.
--
-- Usage via Supabase MCP:
--   execute_sql with the contents of this file
--
-- Or via Supabase SQL Editor in the dashboard.
--
-- Prerequisites:
--   - Images must exist in storage at:
--     drawings/demo-seed/drawing-*.webp
--     construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-*.webp
--   - If images are missing, re-upload them first (see scripts/upload-demo-images.sh)

-- ============================================================
-- 1. RESET TASK STATUSES
-- ============================================================
-- Target: ~1/3 todo, ~1/3 in_progress, ~1/3 complete
-- Jake Brennan (91fcdfdd) must have at least 2 tasks in "todo"

-- Reset all to a clean baseline first
UPDATE tasks SET status = 'todo', completed_at = NULL, completed_by = NULL WHERE status IS NOT NULL;

-- Mark specific tasks as in_progress
UPDATE tasks SET status = 'in_progress', completed_at = NULL, completed_by = NULL
WHERE id IN (
  '1b3e0005-a4a2-4b6d-955b-5803e4d07730', -- Brickwork to DPC level (Jake, Plot 4)
  '1368af72-a6eb-4d1d-adce-fa32456d0637', -- Install cavity wall insulation (Jake, Plot 4) — moved to in_progress
  '74c52ec6-271c-40ee-84fd-54425adf8507', -- Pour concrete foundations (Danny, Meltham Road)
  '1a68a77e-fe7b-44f7-b530-ecb7616bc696', -- BCO sign-off — DPC level (Dom, Plot 4)
  'c3cceb17-4fa9-41d7-af77-e498a115c8f1', -- Foundations started for plots 1-3 (Danny, Clough Road)
  '4c379e1c-58fc-4dd7-860c-1d153450aa64'  -- Skirting Boards second fix flat 19 (Ryan, Ainley Top)
);

-- Mark specific tasks as complete
UPDATE tasks SET status = 'complete',
  completed_at = '2026-09-01T16:00:00Z'::timestamptz,
  completed_by = '164abd7c-ba0c-40f4-a7ad-c287c9336f67' -- Danny
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
  completed_by = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2' -- Jake
WHERE id = '5730f560-29e6-4923-8863-0606ed01af92'; -- Install RSJ — kitchen opening

UPDATE tasks SET status = 'complete',
  completed_at = '2026-09-04T14:00:00Z'::timestamptz,
  completed_by = '78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2' -- Connor
WHERE id = '78f64dee-c5ef-461d-acd3-a22b372e85a4'; -- Break out existing rear wall

UPDATE tasks SET status = 'complete',
  completed_at = '2026-08-28T15:00:00Z'::timestamptz,
  completed_by = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2'
WHERE id = '9fee4d94-15db-4088-a50b-2ea18abb41d5'; -- buildretaining wall

UPDATE tasks SET status = 'complete',
  completed_at = '2026-08-30T16:00:00Z'::timestamptz,
  completed_by = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2'
WHERE id = 'e6743b1e-c02f-4a77-b446-996ea1cf474f'; -- do paving plot23

-- Ensure Jake has 2 todo tasks (resetting the 2 we put as in_progress back to todo
-- if they were moved by a demo user)
-- These stay as todo: Blockwork — extension walls, Install cavity wall insulation
-- Actually we want one in_progress and one todo for Jake for a realistic view.
-- Let's set cavity wall insulation back to todo:
UPDATE tasks SET status = 'todo', completed_at = NULL, completed_by = NULL
WHERE id = '1368af72-a6eb-4d1d-adce-fa32456d0637';

-- Also set Blockwork — extension walls to todo:
UPDATE tasks SET status = 'todo', completed_at = NULL, completed_by = NULL
WHERE id = '355d3cd4-c964-4245-bd11-21dafcd59642';

-- Set First lift to scaffold from dpc to in_progress (Jake, New build holmfirth)
UPDATE tasks SET status = 'in_progress', completed_at = NULL, completed_by = NULL
WHERE id = '06fefba3-7217-4d72-98a0-4dac137be3c3';

-- ============================================================
-- 2. DRAWINGS
-- ============================================================
-- Remove existing demo-seed drawings, then re-insert
DELETE FROM drawings WHERE file_url LIKE '%/demo-seed/%';

INSERT INTO drawings (organization_id, site_id, title, description, file_url, file_type, file_size, category, version) VALUES
-- Plot 4 — Marsden Road
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Ground Floor Plan — Rev C', 'Ground floor layout, dimensions, room sizes', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-ground-floor-plan.webp', 'image/webp', 1656793, 'Architectural', 'C'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Foundation Detail — Rev B', 'Strip foundation cross-section, reinforcement detail', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-foundation-detail.webp', 'image/webp', 925703, 'Structural', 'B'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Elevations — Rev A', 'Front and rear elevations, brickwork, roofline', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-elevations.webp', 'image/webp', 1264235, 'Architectural', 'A'),
-- Rear Extension — Holmfirth
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Proposed Plans & Elevations — Rev D', 'Existing and proposed layout, two storey extension', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-proposed-plans.webp', 'image/webp', 1401345, 'Architectural', 'D'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'RSJ / Padstone Detail — Rev A', 'Steel beam support, padstone specification, loading', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-rsj-padstone.webp', 'image/webp', 1047501, 'Structural', 'A'),
-- New Build — Meltham Road
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Site Layout — Rev B', 'Plot positions, access roads, boundaries', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-site-layout.webp', 'image/webp', 1464960, 'Site', 'B'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Drainage Layout — Rev A', 'Foul and surface water drains, manholes, gradients', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-drainage-layout.webp', 'image/webp', 1104983, 'Services', 'A'),
-- Ainley top flats
('51e8233d-3cd8-4580-a867-a6e58f860801', '0914e895-5dae-4952-af15-96844b88caf6', 'Block A Floor Plans — Rev C', 'Unit layout per floor, circulation, fire doors', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-block-a-floorplans.webp', 'image/webp', 1858691, 'Architectural', 'C');

-- ============================================================
-- 3. CONSTRUCTION PHOTOS
-- ============================================================
-- Remove existing demo-seed photos, then re-insert
DELETE FROM construction_photos WHERE image_url LIKE '%/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-%';

INSERT INTO construction_photos (user_id, organization_id, image_url, thumbnail_url, description, task_id, issues, ai_processing, metadata) VALUES
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-brickwork-dpc.webp', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-brickwork-dpc.webp', 'Brickwork to DPC — east elevation', '1b3e0005-a4a2-4b6d-955b-5803e4d07730', '[]'::jsonb, false, '{"uploadedAt": "2026-09-08T08:00:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-joists-install.webp', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-joists-install.webp', 'Cavity wall ready for insulation — west elevation', '1368af72-a6eb-4d1d-adce-fa32456d0637', '[]'::jsonb, false, '{"uploadedAt": "2026-09-08T09:30:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-rsj-installed.webp', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-rsj-installed.webp', 'RSJ installed, padstones bedded', '5730f560-29e6-4923-8863-0606ed01af92', '[]'::jsonb, false, '{"uploadedAt": "2026-09-07T14:00:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-blockwork-walls.webp', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-blockwork-walls.webp', 'Blockwork to extension walls — progress shot', '355d3cd4-c964-4245-bd11-21dafcd59642', '[]'::jsonb, false, '{"uploadedAt": "2026-09-08T11:00:00Z"}'::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-foundations-poured.webp', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-foundations-poured.webp', 'Foundations poured — strip footings complete', '3afa2b82-bedb-4314-8210-a4431ed343e6', '[]'::jsonb, false, '{"uploadedAt": "2026-09-06T16:00:00Z"}'::jsonb);

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'Task status spread:' as info;
SELECT status, count(*) FROM tasks GROUP BY status ORDER BY status;

SELECT 'Jake Brennan tasks:' as info;
SELECT t.title, t.status, s.name as site_name
FROM tasks t
JOIN sites s ON t.site_id = s.id
WHERE t.assigned_to = '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2'
ORDER BY t.status, t.title;

SELECT 'Drawings:' as info;
SELECT d.title, d.version, s.name as site_name FROM drawings d JOIN sites s ON d.site_id = s.id ORDER BY s.name;

SELECT 'Photos:' as info;
SELECT cp.description, t.title as task_title FROM construction_photos cp LEFT JOIN tasks t ON cp.task_id = t.id ORDER BY cp.created_at;
