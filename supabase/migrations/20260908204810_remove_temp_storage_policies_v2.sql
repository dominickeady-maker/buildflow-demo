-- Remove all temporary storage policies
DROP POLICY IF EXISTS "temp_anon_delete_drawings" ON storage.objects;
DROP POLICY IF EXISTS "temp_anon_delete_photos" ON storage.objects;
DROP POLICY IF EXISTS "temp_anon_upload_drawings2" ON storage.objects;
DROP POLICY IF EXISTS "temp_anon_upload_photos2" ON storage.objects;
