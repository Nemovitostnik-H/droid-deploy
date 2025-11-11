-- APK Manager - Storage Setup
-- Creates storage bucket and RLS policies for APK files

-- =============================================
-- CREATE STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apk-files',
  'apk-files',
  false,  -- Private bucket
  524288000,  -- 500 MB limit
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- STORAGE RLS POLICIES
-- =============================================

-- Allow authenticated users to view all APK files
CREATE POLICY "Authenticated users can view APK files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'apk-files');

-- Allow admins to upload APK files
CREATE POLICY "Admins can upload APK files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'apk-files' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to update APK files
CREATE POLICY "Admins can update APK files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'apk-files' AND
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'apk-files' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to delete APK files
CREATE POLICY "Admins can delete APK files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'apk-files' AND
    public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- STORAGE HELPER FUNCTIONS
-- =============================================

-- Function to get file URL from storage
CREATE OR REPLACE FUNCTION public.get_apk_download_url(storage_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_name TEXT := 'apk-files';
  file_url TEXT;
BEGIN
  -- Generate signed URL valid for 1 hour
  file_url := extensions.get_storage_object_url(bucket_name, storage_path, 3600);
  RETURN file_url;
END;
$$;

COMMENT ON FUNCTION public.get_apk_download_url IS 'Generates signed download URL for APK file';
