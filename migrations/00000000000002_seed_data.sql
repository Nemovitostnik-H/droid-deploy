-- APK Manager - Seed Data
-- Inserts default settings and admin user

-- =============================================
-- DEFAULT APP SETTINGS
-- =============================================
INSERT INTO public.app_settings (key, value, description) VALUES
  ('source_directory', 'source', 'Zdrojový adresář pro APK soubory v Storage'),
  ('staging_directory', 'staging', 'Staging adresář pro uploady'),
  ('dev_directory', 'development', 'Destinace pro development publikace'),
  ('rc_directory', 'release-candidate', 'Destinace pro RC publikace'),
  ('prod_directory', 'production', 'Destinace pro production publikace'),
  ('check_interval', '60', 'Interval kontroly publikací (sekundy)'),
  ('max_file_size', '524288000', 'Maximální velikost souboru v bytech (500 MB)')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- DEFAULT ADMIN USER
-- =============================================
-- Note: Password will be hashed by GoTrue
-- Default credentials: admin@apkmanager.local / admin123

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@apkmanager.local';
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;

  -- If admin doesn't exist, we'll need to create via API
  -- This part will be handled by init script
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Admin user will be created by init script';
  ELSE
    -- Ensure admin has admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to existing user: %', admin_email;
  END IF;
END $$;

-- =============================================
-- SAMPLE DATA (Optional - for development)
-- =============================================
-- Uncomment to add sample APK files for testing

-- INSERT INTO public.apk_files (
--   name,
--   package_name,
--   version,
--   version_code,
--   build,
--   storage_path,
--   file_size,
--   file_hash
-- ) VALUES
--   (
--     'SampleApp-1.0.0.apk',
--     'com.example.sampleapp',
--     '1.0.0',
--     1,
--     'debug',
--     'staging/SampleApp-1.0.0.apk',
--     5242880,
--     'abc123def456'
--   )
-- ON CONFLICT (package_name, version_code) DO NOTHING;
