-- Temporary: allow anon to delete from drawings and construction-photos buckets
CREATE POLICY "temp_anon_delete_drawings" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'drawings');

CREATE POLICY "temp_anon_delete_photos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'construction-photos');

-- Also allow anon uploads again for re-upload
CREATE POLICY "temp_anon_upload_drawings2" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'drawings');

CREATE POLICY "temp_anon_upload_photos2" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'construction-photos');
