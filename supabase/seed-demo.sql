-- Banksman Demo Seed / Reset Script
-- Run this to restore the demo to a known-good state.
-- Safe to re-run: deletes demo-org data then re-inserts everything.
--
-- Usage via Supabase MCP:
--   execute_sql with the contents of this file
--
-- Or via Supabase SQL Editor in the dashboard.
--
-- Org:    51e8233d-3cd8-4580-a867-a6e58f860801
-- Sites:  a1000000-0000-0000-0000-000000000001 (Plot 4 — Marsden Road)
--         a1000000-0000-0000-0000-000000000002 (Rear Extension — Holmfirth)
--         a1000000-0000-0000-0000-000000000003 (New Build — Meltham Road)
-- Manager:  923b1109-85c9-402f-a443-3c88588a60ec (Dom Keady / manager@banksman.app)
-- Jake:     91fcdfdd-d9d0-42d7-a837-df84fb34ebc2 (worker@banksman.app)
-- Connor:   78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2
-- Danny:    164abd7c-ba0c-40f4-a7ad-c287c9336f67
-- Ryan:     b0000001-0000-0000-0000-000000000001
-- Mark:     b0000001-0000-0000-0000-000000000002
-- Steve:    b0000001-0000-0000-0000-000000000003
--
-- Prerequisites:
--   - Images must exist in storage at:
--     drawings/demo-seed/drawing-*-sm.webp
--     construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-*-sm.webp
--     construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-*-sm.webp

-- ============================================================
-- 0. CONSTANTS
-- ============================================================
-- Org ID used throughout
-- 51e8233d-3cd8-4580-a867-a6e58f860801

-- ============================================================
-- 1. CLEAN UP OLD TEST SITES (not in the three demo sites)
-- ============================================================
-- These four sites were early test entries. Remove them and all related data.
DELETE FROM construction_photos WHERE task_id IN (
  SELECT id FROM tasks WHERE site_id IN (
    '0914e895-5dae-4952-af15-96844b88caf6',
    'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
    'd965c677-fa2a-49be-a1d9-95e746436f89',
    '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
  )
);
DELETE FROM drawings WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);
DELETE FROM timesheets WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);
DELETE FROM materials WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);
DELETE FROM tasks WHERE site_id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);
DELETE FROM sites WHERE id IN (
  '0914e895-5dae-4952-af15-96844b88caf6',
  'bdc137cc-bfa4-4cae-a2a5-846e2b3e3e2c',
  'd965c677-fa2a-49be-a1d9-95e746436f89',
  '5bf4b623-a474-443c-a6bb-0ff1f722fb3a'
);

-- ============================================================
-- 2. ENSURE PROFILES HAVE CORRECT ORG
-- ============================================================
UPDATE profiles SET organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
WHERE id IN (
  '923b1109-85c9-402f-a443-3c88588a60ec',  -- Dom Keady (manager)
  '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2',  -- Jake Brennan (worker)
  '78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2',  -- Connor Doyle
  '164abd7c-ba0c-40f4-a7ad-c287c9336f67',  -- Danny Whitaker
  'b0000001-0000-0000-0000-000000000001',  -- Ryan Sutcliffe
  'b0000001-0000-0000-0000-000000000002',  -- Mark Ainsworth
  'b0000001-0000-0000-0000-000000000003'   -- Steve Halliwell
);

-- ============================================================
-- 3. ENSURE SITES HAVE CORRECT ORG
-- ============================================================
UPDATE sites SET organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
WHERE id IN (
  'a1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000003'
);

-- ============================================================
-- 4. DELETE ALL EXISTING DEMO-ORG DATA (then re-insert)
-- ============================================================
DELETE FROM construction_photos WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';
DELETE FROM drawings WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';
DELETE FROM timesheets WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';
DELETE FROM materials WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';
DELETE FROM messages WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';
DELETE FROM programme_milestones WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';
DELETE FROM tasks WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';

-- ============================================================
-- 5. TASKS — 18 tasks across 3 sites
-- All dates relative to CURRENT_DATE so the demo never goes stale.
-- ============================================================
INSERT INTO tasks (id, organization_id, site_id, title, description, assigned_to, status, completed_at, completed_by) VALUES
-- Plot 4 — Marsden Road (Site 1) — 7 tasks
('fc383a8b-f887-4bc3-a7c8-7faf0852d964', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001',
  'Pour strip footings — Plot 4', 'Pour concrete strip footings to drawing specification. Check rebar placement before pour.',
  '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'complete', (CURRENT_DATE - INTERVAL '9 days' + INTERVAL '16 hours')::timestamptz, '164abd7c-ba0c-40f4-a7ad-c287c9336f67'),
('b7a29bbe-6ae7-42e8-bd3f-6d3876cf6dd7', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001',
  'Set out foundations', 'Set out foundation lines from architects drawing. Check offsets and boundary distances.',
  '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'complete', (CURRENT_DATE - INTERVAL '8 days' + INTERVAL '15 hours')::timestamptz, '164abd7c-ba0c-40f4-a7ad-c287c9336f67'),
('1b3e0005-a4a2-4b6d-955b-5803e4d07730', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001',
  'Brickwork to DPC level', 'Brickwork and blockwork up to DPC. Cavity trays, weep vents and gas membrane as per drawing.',
  '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'in_progress', NULL, NULL),
('1a68a77e-fe7b-44f7-b530-ecb7616bc696', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001',
  'BCO sign-off — DPC level', 'Book BCO inspection for DPC stage. Have cavity trays and DPC details ready on site.',
  '923b1109-85c9-402f-a443-3c88588a60ec', 'in_progress', NULL, NULL),
('1368af72-a6eb-4d1d-adce-fa32456d0637', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001',
  'Install cavity wall insulation', 'Install Knauf DriTherm 32 batts 100mm. Keep cavity clear, check wall ties spacing.',
  '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'todo', NULL, NULL),
('5fa99a0a-9b75-412c-bbd5-539b219bf0b9', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001',
  'First floor joist installation', 'Install engineered I-joists at 400mm centres. Herringbone strutting at mid-span.',
  'b0000001-0000-0000-0000-000000000001', 'todo', NULL, NULL),
('5b4cfd16-f49a-4d61-9128-fbbf229c561c', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001',
  'Order scaffold — second lift', 'Contact SG Scaffolding to book second lift for week commencing 14th.',
  '923b1109-85c9-402f-a443-3c88588a60ec', 'todo', NULL, NULL),

-- Rear Extension — Holmfirth (Site 2) — 6 tasks
('78f64dee-c5ef-461d-acd3-a22b372e85a4', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002',
  'Break out existing rear wall', 'Break out existing rear wall opening for extension. Temporary props as required.',
  '78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2', 'complete', (CURRENT_DATE - INTERVAL '6 days' + INTERVAL '14 hours')::timestamptz, '78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2'),
('355d3cd4-c964-4245-bd11-21dafcd59642', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002',
  'Blockwork — extension walls', 'External and internal blockwork up to plate height. Check cavity width maintained.',
  '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'todo', NULL, NULL),
('07966d38-a00f-475b-a7d3-d3ec26ba51d6', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002',
  'Flat roof deck installation', 'Install timber firrings and plywood deck to flat roof. Fall to gutter 1:40.',
  'b0000001-0000-0000-0000-000000000001', 'todo', NULL, NULL),
('058d07e6-aad1-4b97-aa1f-ae35d6e436aa', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002',
  'First fix plumbing — underfloor', 'First fix underfloor heating pipework and manifold. Pressure test before screed.',
  'b0000001-0000-0000-0000-000000000002', 'todo', NULL, NULL),
('31654f3c-0659-49b3-a66a-979cae49cca5', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002',
  'Client walkround — Thursday 2pm', 'Mrs Patel on site Thursday at 2pm to view progress and discuss tile selections.',
  '923b1109-85c9-402f-a443-3c88588a60ec', 'todo', NULL, NULL),
('a2000001-0000-0000-0000-000000000001', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002',
  'Form opening for bi-fold doors', 'Cut out existing masonry opening to accept 3m bi-fold door set. Ensure temporary support remains until RSJ fully loaded.',
  '78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2', 'todo', NULL, NULL),

-- New Build — Meltham Road (Site 3) — 5 tasks
('3afa2b82-bedb-4314-8210-a4431ed343e6', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003',
  'Excavate strip footings', 'Excavate strip footings to depth shown on drawings. Watch for services crossing trench.',
  '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'complete', (CURRENT_DATE - INTERVAL '8 days' + INTERVAL '17 hours')::timestamptz, '164abd7c-ba0c-40f4-a7ad-c287c9336f67'),
('74c52ec6-271c-40ee-84fd-54425adf8507', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003',
  'Pour concrete foundations', 'Pour C25 concrete to strip footings. Vibrate and level. Keep samples for cube test.',
  '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'in_progress', NULL, NULL),
('c3000001-0000-0000-0000-000000000001', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003',
  'Set out foundations — Meltham', 'Set out foundation lines from architects drawing. Check offsets and boundary distances.',
  '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'complete', (CURRENT_DATE - INTERVAL '8 days' + INTERVAL '15 hours')::timestamptz, '164abd7c-ba0c-40f4-a7ad-c287c9336f67'),
('ef114afb-c699-48ba-b4ae-823ae100d1fd', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003',
  'Submit building regs drawings', 'Finalise and submit building regs package to local authority. Include structural calcs.',
  '923b1109-85c9-402f-a443-3c88588a60ec', 'todo', NULL, NULL),
('a2000001-0000-0000-0000-000000000002', '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003',
  'Drainage connection — adoptable', 'Lay adoptable foul and surface water drainage. Coordinate with Yorkshire Water inspection.',
  'b0000001-0000-0000-0000-000000000003', 'todo', NULL, NULL);

-- ============================================================
-- 6. TIMESHEETS — 11 entries, dates relative to CURRENT_DATE
-- Spread across last 10 days with several in the current week.
-- ============================================================
INSERT INTO timesheets (organization_id, worker_id, site_id, plot_number, work_type, task_description, hours_worked, pricework_amount, date_worked, notes) VALUES
('51e8233d-3cd8-4580-a867-a6e58f860801', '78ec9ba8-22d8-4f57-ab1e-20ce6b49c6b2', 'a1000000-0000-0000-0000-000000000002', '', 'daywork', 'Break out rear wall', 8, NULL, (CURRENT_DATE - INTERVAL '10 days')::date, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'a1000000-0000-0000-0000-000000000001', '', 'daywork', 'Set out foundations', 8, NULL, (CURRENT_DATE - INTERVAL '10 days')::date, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'a1000000-0000-0000-0000-000000000001', '', 'daywork', 'Strip footings excavation', 8, NULL, (CURRENT_DATE - INTERVAL '9 days')::date, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'b0000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', '', 'daywork', 'Blockwork to extension', 8, NULL, (CURRENT_DATE - INTERVAL '9 days')::date, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'a1000000-0000-0000-0000-000000000001', '', 'price', 'Brickwork to DPC', NULL, 320.00, (CURRENT_DATE - INTERVAL '8 days')::date, '1000 bricks + 600 blocks'),
('51e8233d-3cd8-4580-a867-a6e58f860801', '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'a1000000-0000-0000-0000-000000000003', '', 'daywork', 'Excavate strip footings', 4, NULL, (CURRENT_DATE - INTERVAL '8 days')::date, 'Half day — machine breakdown'),
('51e8233d-3cd8-4580-a867-a6e58f860801', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'a1000000-0000-0000-0000-000000000001', '', 'price', 'Cavity wall insulation', NULL, 180.00, (CURRENT_DATE - INTERVAL '3 days')::date, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'a1000000-0000-0000-0000-000000000003', '', 'daywork', 'Pour concrete foundations', 8, NULL, (CURRENT_DATE - INTERVAL '2 days')::date, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'a1000000-0000-0000-0000-000000000001', '', 'daywork', 'Brickwork continuation', 7, NULL, (CURRENT_DATE - INTERVAL '1 day')::date, ''),
('51e8233d-3cd8-4580-a867-a6e58f860801', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'a1000000-0000-0000-0000-000000000002', '', 'price', 'RSJ installation', NULL, 250.00, (CURRENT_DATE - INTERVAL '1 day')::date, 'Steel beam + padstones'),
('51e8233d-3cd8-4580-a867-a6e58f860801', '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'a1000000-0000-0000-0000-000000000003', '', 'daywork', 'Foundations continuation', 8, NULL, CURRENT_DATE, '');

-- ============================================================
-- 7. MATERIALS — 11 requests (includes 2 from Jake Brennan)
-- Dates relative to CURRENT_DATE.
-- ============================================================
INSERT INTO materials (organization_id, site_id, item_name, quantity, unit, requested_by, status, comment, created_at) VALUES
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Knauf DriTherm 32 Batts 100mm', 20, 'batts', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'new', '', (CURRENT_DATE - INTERVAL '2 days')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Ibstock Tradesman Red Bricks', 3000, 'bricks', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'ordered', 'Travis Perkins, delivery Wed', (CURRENT_DATE - INTERVAL '7 days')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'OPC Cement 25kg bags', 40, 'bags', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'delivered', '', (CURRENT_DATE - INTERVAL '9 days')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Cavity Wall Ties (box)', 2, 'boxes', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'approved', '', (CURRENT_DATE - INTERVAL '5 days')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'OSB Board 18mm sheets', 25, 'sheets', 'b0000001-0000-0000-0000-000000000001', 'approved', '', (CURRENT_DATE - INTERVAL '6 days')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Underfloor Heating Pipe 100m', 100, 'metres', 'b0000001-0000-0000-0000-000000000002', 'new', '', (CURRENT_DATE - INTERVAL '1 day')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Thermalite Blocks 100mm', 300, 'blocks', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'ordered', '', (CURRENT_DATE - INTERVAL '4 days')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Concrete C25 Ready Mix', 12, 'm3', '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'approved', '', (CURRENT_DATE - INTERVAL '8 days')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'DPC Roll 600mm', 5, 'rolls', '164abd7c-ba0c-40f4-a7ad-c287c9336f67', 'new', '', (CURRENT_DATE - INTERVAL '3 days')::timestamptz),
-- Jake Brennan material requests: 1 pending (new), 1 approved
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Wall Ties Stainless Steel 200mm', 1, 'boxes', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'new', 'Need these for the cavity wall before Thursday', (CURRENT_DATE - INTERVAL '1 day')::timestamptz),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Plasterboard 12.5mm 2400x1200', 50, 'boards', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'approved', 'For drylining the extension walls', (CURRENT_DATE - INTERVAL '5 days')::timestamptz);

-- ============================================================
-- 8. DRAWINGS — 7 drawings, all uploaded by manager
-- ============================================================
INSERT INTO drawings (organization_id, site_id, title, description, file_url, file_type, file_size, category, version, uploaded_by) VALUES
-- Plot 4 — Marsden Road
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Ground Floor Plan — Rev C', 'Ground floor layout, dimensions, room sizes', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-ground-floor-plan-sm.webp', 'image/webp', 61688, 'Architectural', 'C', '923b1109-85c9-402f-a443-3c88588a60ec'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Foundation Detail — Rev B', 'Strip foundation cross-section, reinforcement detail', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-foundation-detail-sm.webp', 'image/webp', 77034, 'Structural', 'B', '923b1109-85c9-402f-a443-3c88588a60ec'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', 'Elevations — Rev A', 'Front and rear elevations, brickwork, roofline', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-elevations-sm.webp', 'image/webp', 138130, 'Architectural', 'A', '923b1109-85c9-402f-a443-3c88588a60ec'),
-- Rear Extension — Holmfirth
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'Proposed Plans & Elevations — Rev D', 'Existing and proposed layout, two storey extension', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-proposed-plans-sm.webp', 'image/webp', 109439, 'Architectural', 'D', '923b1109-85c9-402f-a443-3c88588a60ec'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', 'RSJ / Padstone Detail — Rev A', 'Steel beam support, padstone specification, loading', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-rsj-padstone-sm.webp', 'image/webp', 52736, 'Structural', 'A', '923b1109-85c9-402f-a443-3c88588a60ec'),
-- New Build — Meltham Road
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Site Layout — Rev B', 'Plot positions, access roads, boundaries', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-site-layout-sm.webp', 'image/webp', 153707, 'Site', 'B', '923b1109-85c9-402f-a443-3c88588a60ec'),
('51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', 'Drainage Layout — Rev A', 'Foul and surface water drains, manholes, gradients', 'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/drawings/demo-seed/drawing-drainage-layout-sm.webp', 'image/webp', 142106, 'Services', 'A', '923b1109-85c9-402f-a443-3c88588a60ec');

-- ============================================================
-- 9. CONSTRUCTION PHOTOS — 5 photos by Jake, linked to tasks
-- ============================================================
INSERT INTO construction_photos (user_id, organization_id, image_url, thumbnail_url, description, task_id, issues, ai_processing, metadata) VALUES
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-brickwork-dpc-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-brickwork-dpc-sm.webp',
  'Brickwork to DPC — east elevation', '1b3e0005-a4a2-4b6d-955b-5803e4d07730', '[]'::jsonb, false, json_build_object('uploadedAt', (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '8 hours'))::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-joists-install-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-joists-install-sm.webp',
  'Cavity wall ready for insulation — west elevation', '1368af72-a6eb-4d1d-adce-fa32456d0637', '[]'::jsonb, false, json_build_object('uploadedAt', (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '9 hours 30 mins'))::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-rsj-installed-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-rsj-installed-sm.webp',
  'RSJ installed, padstones bedded', '355d3cd4-c964-4245-bd11-21dafcd59642', '[]'::jsonb, false, json_build_object('uploadedAt', (CURRENT_DATE - INTERVAL '3 days' + INTERVAL '14 hours'))::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-blockwork-walls-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-blockwork-walls-sm.webp',
  'Blockwork to extension walls — progress shot', '355d3cd4-c964-4245-bd11-21dafcd59642', '[]'::jsonb, false, json_build_object('uploadedAt', (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '11 hours'))::jsonb),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '51e8233d-3cd8-4580-a867-a6e58f860801',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/photo-foundations-poured-sm.webp',
  'https://jpujykkjrskihqskbovu.supabase.co/storage/v1/object/public/construction-photos/91fcdfdd-d9d0-42d7-a837-df84fb34ebc2/thumbs/photo-foundations-poured-sm.webp',
  'Foundations poured — strip footings complete', '3afa2b82-bedb-4314-8210-a4431ed343e6', '[]'::jsonb, false, json_build_object('uploadedAt', (CURRENT_DATE - INTERVAL '4 days' + INTERVAL '16 hours'))::jsonb);

-- ============================================================
-- 10. MESSAGES — 8 messages across 3 threads
-- ============================================================
INSERT INTO messages (sender_id, receiver_id, message, read, created_at, organization_id) VALUES
-- Thread 1: Jake Brennan <-> Manager, Plot 4 Marsden Road
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '923b1109-85c9-402f-a443-3c88588a60ec', 'Blocks are down to about half a pack. Will need another 2 packs before Thursday or we''ll be stood about.', true, (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '7 hours 15 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('923b1109-85c9-402f-a443-3c88588a60ec', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'Ordered this morning, Travis are delivering Wednesday am. Leave the drop next to the site cabin, not the driveway.', true, (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '8 hours 30 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '923b1109-85c9-402f-a443-3c88588a60ec', 'No problem. DPC will be done by then.', false, (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '9 hours 45 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
-- Thread 2: Ryan Sutcliffe <-> Manager, Rear Extension Holmfirth
('b0000001-0000-0000-0000-000000000001', '923b1109-85c9-402f-a443-3c88588a60ec', 'Is the RSJ detail on Rev A still current? Steel arrives Monday and the padstone sizes look different to what''s on site.', true, (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10 hours 20 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('923b1109-85c9-402f-a443-3c88588a60ec', 'b0000001-0000-0000-0000-000000000001', 'Good spot. Rev B went up last night, padstones are 215 not 140. Use the Rev B drawing.', true, (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '11 hours 5 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('b0000001-0000-0000-0000-000000000001', '923b1109-85c9-402f-a443-3c88588a60ec', 'Got it, thanks.', false, (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '11 hours 30 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
-- Thread 3: Manager <-> Jake Brennan, New Build Meltham Road
('923b1109-85c9-402f-a443-3c88588a60ec', '91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', 'Can you get a few photos of the foundations before the pour so we''ve got them for building control?', true, (CURRENT_DATE + INTERVAL '6 hours 45 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801'),
('91fcdfdd-d9d0-42d7-a837-df84fb34ebc2', '923b1109-85c9-402f-a443-3c88588a60ec', 'Done, uploaded four just now.', false, (CURRENT_DATE + INTERVAL '7 hours 30 mins')::timestamptz, '51e8233d-3cd8-4580-a867-a6e58f860801');

-- ============================================================
-- 11. PROGRAMME MILESTONES — programme of works per site
-- All dates are relative to CURRENT_DATE so the demo never goes stale.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Site 1: Plot 4 — Marsden Road (new build, early stage)
-- ────────────────────────────────────────────────────────────
INSERT INTO programme_milestones (organization_id, site_id, milestone_name, sort_order, target_date, actual_date, notes)
SELECT '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000001', m.milestone_name, m.sort_order,
       m.target_date, m.actual_date, m.notes
FROM (VALUES
  ('Site set-up & welfare',                       0,  (CURRENT_DATE - INTERVAL '42 days')::date, (CURRENT_DATE - INTERVAL '40 days')::date, ''),
  ('Site strip / reduce dig',                     1,  (CURRENT_DATE - INTERVAL '35 days')::date, (CURRENT_DATE - INTERVAL '30 days')::date, ''),
  ('Setting out',                                 2,  (CURRENT_DATE - INTERVAL '8 days')::date,  NULL, 'Waiting on setting-out engineer'),
  ('Temporary services',                          3,  (CURRENT_DATE + INTERVAL '3 days')::date,   NULL, ''),
  ('Foundations dug',                             4,  (CURRENT_DATE + INTERVAL '10 days')::date,  NULL, ''),
  ('NHBC/BC excavation inspection',               5,  (CURRENT_DATE + INTERVAL '14 days')::date,  NULL, ''),
  ('Foundations poured',                          6,  NULL::date, NULL::date, ''),
  ('Footings up to DPC',                          7,  NULL::date, NULL::date, ''),
  ('DPC laid (FFL to DPC)',                       8,  NULL::date, NULL::date, ''),
  ('Below-ground drainage',                       9,  NULL::date, NULL::date, ''),
  ('Oversite / ground floor slab',               10,  NULL::date, NULL::date, ''),
  ('Beam & block floor laid',                    11,  NULL::date, NULL::date, ''),
  ('First lift',                                 12,  NULL::date, NULL::date, ''),
  ('Ground floor lintels & frames',              13,  NULL::date, NULL::date, ''),
  ('Scaffold first lift',                        14,  NULL::date, NULL::date, ''),
  ('First floor joists on (floors on)',          15,  NULL::date, NULL::date, ''),
  ('Second lift',                                 16,  NULL::date, NULL::date, ''),
  ('Gables up',                                  17,  NULL::date, NULL::date, ''),
  ('Wall plate on',                              18,  NULL::date, NULL::date, ''),
  ('Steels in (RSJ)',                            19,  NULL::date, NULL::date, ''),
  ('Roof trusses / rafters set',                 20,  NULL::date, NULL::date, ''),
  ('Roof on (felt & batten)',                    21,  NULL::date, NULL::date, ''),
  ('Tiling / slating complete',                  22,  NULL::date, NULL::date, ''),
  ('Fascias, soffits & guttering',               23,  NULL::date, NULL::date, ''),
  ('Windows & external doors in',                24,  NULL::date, NULL::date, ''),
  ('Watertight / weathertight',                  25,  NULL::date, NULL::date, ''),
  ('NHBC/BC superstructure inspection',          26,  NULL::date, NULL::date, ''),
  ('Internal studwork & partitions',             27,  NULL::date, NULL::date, ''),
  ('1st fix carpentry',                          28,  NULL::date, NULL::date, ''),
  ('1st fix electrics',                          29,  NULL::date, NULL::date, ''),
  ('1st fix plumbing & heating',                 30,  NULL::date, NULL::date, ''),
  ('Insulation & airtightness',                  31,  NULL::date, NULL::date, ''),
  ('NHBC/BC pre-plaster inspection',             32,  NULL::date, NULL::date, ''),
  ('Plasterboard / dot & dab',                   33,  NULL::date, NULL::date, ''),
  ('Plastering & skim',                          34,  NULL::date, NULL::date, ''),
  ('Floor screed',                               35,  NULL::date, NULL::date, ''),
  ('2nd fix carpentry (doors, skirting, architrave)', 36, NULL::date, NULL::date, ''),
  ('2nd fix electrics',                          37,  NULL::date, NULL::date, ''),
  ('2nd fix plumbing & sanitaryware',            38,  NULL::date, NULL::date, ''),
  ('Kitchen fit',                                39,  NULL::date, NULL::date, ''),
  ('Wall & floor tiling',                        40,  NULL::date, NULL::date, ''),
  ('Decoration',                                 41,  NULL::date, NULL::date, ''),
  ('Floor coverings',                            42,  NULL::date, NULL::date, ''),
  ('External render / brick clean',              43,  NULL::date, NULL::date, ''),
  ('Scaffold struck',                            44,  NULL::date, NULL::date, ''),
  ('Drives, paths & patios',                     45,  NULL::date, NULL::date, ''),
  ('Landscaping & turfing',                      46,  NULL::date, NULL::date, ''),
  ('Fencing & boundaries',                       47,  NULL::date, NULL::date, ''),
  ('Commissioning & testing',                    48,  NULL::date, NULL::date, ''),
  ('Air test / EPC',                             49,  NULL::date, NULL::date, ''),
  ('Building Control sign-off',                  50,  NULL::date, NULL::date, ''),
  ('Pre-handover inspection',                    51,  NULL::date, NULL::date, ''),
  ('Snagging',                                   52,  NULL::date, NULL::date, ''),
  ('Practical completion / handover',            53,  NULL::date, NULL::date, '')
) AS m(milestone_name, sort_order, target_date, actual_date, notes);

-- ────────────────────────────────────────────────────────────
-- Site 2: Rear Extension — Holmfirth (extension, further along)
-- ────────────────────────────────────────────────────────────
INSERT INTO programme_milestones (organization_id, site_id, milestone_name, sort_order, target_date, actual_date, notes)
SELECT '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000002', m.milestone_name, m.sort_order,
       m.target_date, m.actual_date, m.notes
FROM (VALUES
  ('Site set-up & protection',                     0, (CURRENT_DATE - INTERVAL '70 days')::date, (CURRENT_DATE - INTERVAL '68 days')::date, ''),
  ('Break out / demolition',                       1, (CURRENT_DATE - INTERVAL '65 days')::date, (CURRENT_DATE - INTERVAL '58 days')::date, ''),
  ('Foundations dug',                              2, (CURRENT_DATE - INTERVAL '55 days')::date, (CURRENT_DATE - INTERVAL '50 days')::date, ''),
  ('Foundations poured',                           3, (CURRENT_DATE - INTERVAL '48 days')::date, (CURRENT_DATE - INTERVAL '46 days')::date, ''),
  ('Footings up to DPC',                           4, (CURRENT_DATE - INTERVAL '40 days')::date, (CURRENT_DATE - INTERVAL '36 days')::date, ''),
  ('Drainage & manhole alterations',               5, (CURRENT_DATE - INTERVAL '33 days')::date, (CURRENT_DATE - INTERVAL '29 days')::date, 'Building control signed off drainage'),
  ('Oversite / slab',                              6, (CURRENT_DATE - INTERVAL '25 days')::date, (CURRENT_DATE - INTERVAL '22 days')::date, ''),
  ('Superstructure blockwork',                     7, (CURRENT_DATE - INTERVAL '18 days')::date, (CURRENT_DATE - INTERVAL '12 days')::date, ''),
  ('Steels in (RSJ)',                              8, (CURRENT_DATE - INTERVAL '10 days')::date, (CURRENT_DATE - INTERVAL '7 days')::date,  'Steel delivery put back a week'),
  ('Wall plate on',                                9, (CURRENT_DATE + INTERVAL '2 days')::date,   NULL::date, ''),
  ('Roof structure',                              10, (CURRENT_DATE + INTERVAL '9 days')::date,   NULL::date, ''),
  ('Roof covering',                               11, (CURRENT_DATE + INTERVAL '16 days')::date,  NULL::date, ''),
  ('Windows & external doors in',                 12, (CURRENT_DATE + INTERVAL '23 days')::date,  NULL::date, ''),
  ('Watertight',                                  13, (CURRENT_DATE + INTERVAL '28 days')::date,  NULL::date, ''),
  ('Knock-through / opening formed',              14, NULL::date, NULL::date, ''),
  ('1st fix trades',                              15, NULL::date, NULL::date, ''),
  ('Plastering',                                  16, NULL::date, NULL::date, ''),
  ('2nd fix trades',                              17, NULL::date, NULL::date, ''),
  ('Kitchen / bathroom fit',                      18, NULL::date, NULL::date, ''),
  ('Decoration',                                  19, NULL::date, NULL::date, ''),
  ('External works & making good',                20, NULL::date, NULL::date, ''),
  ('Snagging',                                    21, NULL::date, NULL::date, ''),
  ('Handover',                                    22, NULL::date, NULL::date, '')
) AS m(milestone_name, sort_order, target_date, actual_date, notes);

-- ────────────────────────────────────────────────────────────
-- Site 3: New Build — Meltham Road (new build, foundation stage)
-- ────────────────────────────────────────────────────────────
INSERT INTO programme_milestones (organization_id, site_id, milestone_name, sort_order, target_date, actual_date, notes)
SELECT '51e8233d-3cd8-4580-a867-a6e58f860801', 'a1000000-0000-0000-0000-000000000003', m.milestone_name, m.sort_order,
       m.target_date, m.actual_date, m.notes
FROM (VALUES
  ('Site set-up & welfare',                         0,  (CURRENT_DATE - INTERVAL '50 days')::date, (CURRENT_DATE - INTERVAL '48 days')::date, ''),
  ('Site strip / reduce dig',                       1,  (CURRENT_DATE - INTERVAL '45 days')::date, (CURRENT_DATE - INTERVAL '40 days')::date, ''),
  ('Setting out',                                   2,  (CURRENT_DATE - INTERVAL '38 days')::date, (CURRENT_DATE - INTERVAL '36 days')::date, ''),
  ('Temporary services',                            3,  (CURRENT_DATE - INTERVAL '32 days')::date, (CURRENT_DATE - INTERVAL '30 days')::date, ''),
  ('Foundations dug',                               4,  (CURRENT_DATE - INTERVAL '25 days')::date, (CURRENT_DATE - INTERVAL '21 days')::date, ''),
  ('NHBC/BC excavation inspection',                 5,  (CURRENT_DATE - INTERVAL '20 days')::date, (CURRENT_DATE - INTERVAL '19 days')::date, 'Waiting on building control'),
  ('Foundations poured',                            6,  (CURRENT_DATE - INTERVAL '15 days')::date, (CURRENT_DATE - INTERVAL '12 days')::date, ''),
  ('Footings up to DPC',                            7,  (CURRENT_DATE - INTERVAL '6 days')::date,  NULL::date, 'Concrete delayed — rescheduled with supplier'),
  ('DPC laid (FFL to DPC)',                         8,  (CURRENT_DATE + INTERVAL '3 days')::date,   NULL::date, ''),
  ('Below-ground drainage',                         9,  (CURRENT_DATE + INTERVAL '10 days')::date,  NULL::date, ''),
  ('Oversite / ground floor slab',                 10,  (CURRENT_DATE + INTERVAL '17 days')::date,  NULL::date, ''),
  ('First lift',                                   11,  (CURRENT_DATE + INTERVAL '24 days')::date,  NULL::date, ''),
  ('First floor joists on (floors on)',            12,  (CURRENT_DATE + INTERVAL '31 days')::date,  NULL::date, ''),
  ('Beam & block floor laid',                      13,  NULL::date, NULL::date, ''),
  ('Ground floor lintels & frames',                14,  NULL::date, NULL::date, ''),
  ('Scaffold first lift',                          15,  NULL::date, NULL::date, ''),
  ('Second lift',                                  16,  NULL::date, NULL::date, ''),
  ('Gables up',                                    17,  NULL::date, NULL::date, ''),
  ('Wall plate on',                                18,  NULL::date, NULL::date, ''),
  ('Steels in (RSJ)',                              19,  NULL::date, NULL::date, ''),
  ('Roof trusses / rafters set',                   20,  NULL::date, NULL::date, ''),
  ('Roof on (felt & batten)',                      21,  NULL::date, NULL::date, ''),
  ('Tiling / slating complete',                    22,  NULL::date, NULL::date, ''),
  ('Fascias, soffits & guttering',                 23,  NULL::date, NULL::date, ''),
  ('Windows & external doors in',                  24,  NULL::date, NULL::date, ''),
  ('Watertight / weathertight',                    25,  NULL::date, NULL::date, ''),
  ('NHBC/BC superstructure inspection',            26,  NULL::date, NULL::date, ''),
  ('Internal studwork & partitions',               27,  NULL::date, NULL::date, ''),
  ('1st fix carpentry',                            28,  NULL::date, NULL::date, ''),
  ('1st fix electrics',                            29,  NULL::date, NULL::date, ''),
  ('1st fix plumbing & heating',                   30,  NULL::date, NULL::date, ''),
  ('Insulation & airtightness',                    31,  NULL::date, NULL::date, ''),
  ('NHBC/BC pre-plaster inspection',               32,  NULL::date, NULL::date, ''),
  ('Plasterboard / dot & dab',                     33,  NULL::date, NULL::date, ''),
  ('Plastering & skim',                            34,  NULL::date, NULL::date, ''),
  ('Floor screed',                                 35,  NULL::date, NULL::date, ''),
  ('2nd fix carpentry (doors, skirting, architrave)', 36, NULL::date, NULL::date, ''),
  ('2nd fix electrics',                            37,  NULL::date, NULL::date, ''),
  ('2nd fix plumbing & sanitaryware',              38,  NULL::date, NULL::date, ''),
  ('Kitchen fit',                                  39,  NULL::date, NULL::date, ''),
  ('Wall & floor tiling',                          40,  NULL::date, NULL::date, ''),
  ('Decoration',                                   41,  NULL::date, NULL::date, ''),
  ('Floor coverings',                              42,  NULL::date, NULL::date, ''),
  ('External render / brick clean',                43,  NULL::date, NULL::date, ''),
  ('Scaffold struck',                              44,  NULL::date, NULL::date, ''),
  ('Drives, paths & patios',                       45,  NULL::date, NULL::date, ''),
  ('Landscaping & turfing',                        46,  NULL::date, NULL::date, ''),
  ('Fencing & boundaries',                         47,  NULL::date, NULL::date, ''),
  ('Commissioning & testing',                      48,  NULL::date, NULL::date, ''),
  ('Air test / EPC',                               49,  NULL::date, NULL::date, ''),
  ('Building Control sign-off',                    50,  NULL::date, NULL::date, ''),
  ('Pre-handover inspection',                      51,  NULL::date, NULL::date, ''),
  ('Snagging',                                     52,  NULL::date, NULL::date, ''),
  ('Practical completion / handover',              53,  NULL::date, NULL::date, '')
) AS m(milestone_name, sort_order, target_date, actual_date, notes);

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT '--- ROW COUNTS ---' AS info;
SELECT 'tasks' AS t, COUNT(*) AS c FROM tasks WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
UNION ALL SELECT 'timesheets', COUNT(*) FROM timesheets WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
UNION ALL SELECT 'materials', COUNT(*) FROM materials WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
UNION ALL SELECT 'photos', COUNT(*) FROM construction_photos WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
UNION ALL SELECT 'messages', COUNT(*) FROM messages WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
UNION ALL SELECT 'drawings', COUNT(*) FROM drawings WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
UNION ALL SELECT 'sites', COUNT(*) FROM sites WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
UNION ALL SELECT 'milestones', COUNT(*) FROM programme_milestones WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801';

SELECT '--- TASK STATUS SPREAD ---' AS info;
SELECT status, COUNT(*) FROM tasks WHERE organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801' GROUP BY status ORDER BY status;

SELECT '--- WORKER TASK COUNTS ---' AS info;
SELECT p.full_name, COUNT(t.id) AS total, COUNT(t.id) FILTER (WHERE t.status != 'complete') AS active
FROM profiles p
LEFT JOIN tasks t ON t.assigned_to = p.id AND t.organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
WHERE p.role = 'worker' AND p.organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801'
GROUP BY p.id, p.full_name ORDER BY p.full_name;

SELECT '--- DRAWINGS UPLOADED_BY ---' AS info;
SELECT d.title, d.uploaded_by IS NOT NULL AS has_uploader FROM drawings d WHERE d.organization_id = '51e8233d-3cd8-4580-a867-a6e58f860801' ORDER BY d.title;
