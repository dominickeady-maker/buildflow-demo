-- Remove temporary anon upload policies
DROP POLICY IF EXISTS "temp_anon_upload_drawings" ON storage.objects;
DROP POLICY IF EXISTS "temp_anon_upload_photos" ON storage.objects;
