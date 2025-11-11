-- APK Manager - Initial Database Schema
-- This migration creates the core database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher', 'developer', 'viewer');

-- =============================================
-- USER ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'Stores user role assignments';
COMMENT ON COLUMN public.user_roles.user_id IS 'References auth.users';
COMMENT ON COLUMN public.user_roles.role IS 'User role from app_role enum';

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- =============================================
-- APK FILES TABLE
-- =============================================
CREATE TABLE public.apk_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    package_name TEXT NOT NULL,
    version TEXT NOT NULL,
    version_code INTEGER NOT NULL,
    build TEXT,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (package_name, version_code)
);

COMMENT ON TABLE public.apk_files IS 'Stores APK file metadata';
COMMENT ON COLUMN public.apk_files.storage_path IS 'Path in Supabase Storage (bucket: apk-files)';
COMMENT ON COLUMN public.apk_files.file_hash IS 'SHA256 hash of the APK file';

CREATE INDEX idx_apk_files_package_name ON public.apk_files(package_name);
CREATE INDEX idx_apk_files_version_code ON public.apk_files(version_code);
CREATE INDEX idx_apk_files_uploaded_by ON public.apk_files(uploaded_by);
CREATE INDEX idx_apk_files_created_at ON public.apk_files(created_at DESC);

-- =============================================
-- PUBLICATIONS TABLE
-- =============================================
CREATE TABLE public.publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apk_id UUID REFERENCES public.apk_files(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('development', 'release-candidate', 'production')),
    published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'completed', 'failed')),
    error_message TEXT,
    target_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.publications IS 'Tracks APK publications to different platforms';
COMMENT ON COLUMN public.publications.target_path IS 'Final path in Storage after publication';

CREATE INDEX idx_publications_apk_id ON public.publications(apk_id);
CREATE INDEX idx_publications_platform ON public.publications(platform);
CREATE INDEX idx_publications_status ON public.publications(status);
CREATE INDEX idx_publications_created_at ON public.publications(created_at DESC);

-- =============================================
-- APP SETTINGS TABLE
-- =============================================
CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.app_settings IS 'Application configuration settings';

CREATE INDEX idx_app_settings_updated_at ON public.app_settings(updated_at DESC);

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKING
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

COMMENT ON FUNCTION public.has_role IS 'Security definer function to check if user has specific role (prevents RLS recursion)';

-- =============================================
-- HELPER FUNCTION: GET USER ROLES
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE (role app_role)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

COMMENT ON FUNCTION public.get_user_roles IS 'Returns all roles for a user';

-- =============================================
-- TRIGGER: UPDATE updated_at TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_apk_files
  BEFORE UPDATE ON public.apk_files
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_app_settings
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apk_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: USER_ROLES
-- =============================================
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES: APK_FILES
-- =============================================
CREATE POLICY "Everyone can view APK files"
  ON public.apk_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert APK files"
  ON public.apk_files
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update APK files"
  ON public.apk_files
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete APK files"
  ON public.apk_files
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES: PUBLICATIONS
-- =============================================
CREATE POLICY "Everyone can view publications"
  ON public.publications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Publishers can create publications"
  ON public.publications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'publisher')
  );

CREATE POLICY "Publishers can update own publications"
  ON public.publications
  FOR UPDATE
  TO authenticated
  USING (
    published_by = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    published_by = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- RLS POLICIES: APP_SETTINGS
-- =============================================
CREATE POLICY "Everyone can read settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert settings"
  ON public.app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings"
  ON public.app_settings
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
