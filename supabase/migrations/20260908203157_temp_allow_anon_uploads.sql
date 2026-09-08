-- Temporary: allow anon to upload to drawings and construction-photos buckets
-- Will be reverted after seeding

CREATE POLICY "temp_anon_upload_drawings" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'drawings');

CREATE POLICY "temp_anon_upload_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'construction-photos');
