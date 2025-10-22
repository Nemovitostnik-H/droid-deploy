-- APK Manager Database Schema
-- PostgreSQL 14+

-- Required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- APK files table
CREATE TABLE IF NOT EXISTS apk_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    version_code INTEGER NOT NULL,
    build VARCHAR(20),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    md5_hash VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_name, version_code)
);

-- Publications table
CREATE TABLE IF NOT EXISTS publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apk_id UUID NOT NULL REFERENCES apk_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    error_message TEXT
);

-- Settings table - Application configuration
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO settings (key, value, description)
VALUES 
    ('apk_directory', '/data/apk', 'Base directory for APK files'),
    ('apk_staging_directory', '/data/apk/staging', 'Staging directory for uploaded APK files'),
    ('platform_dev_directory', '/data/apk/development', 'Development platform directory'),
    ('platform_rc_directory', '/data/apk/release-candidate', 'Release Candidate platform directory'),
    ('platform_prod_directory', '/data/apk/production', 'Production platform directory'),
    ('backend_port', '3001', 'Backend server port'),
    ('jwt_secret', 'your-secret-key-change-this-in-production', 'JWT secret key for token signing'),
    ('jwt_expires_in', '24h', 'JWT token expiration time')
ON CONFLICT (key) DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_apk_files_package_version ON apk_files(package_name, version_code);
CREATE INDEX IF NOT EXISTS idx_publications_status ON publications(status);
CREATE INDEX IF NOT EXISTS idx_publications_created ON publications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publications_apk ON publications(apk_id);

-- Create default admin user (password: admin123)
-- You should change this password immediately after first deployment!
INSERT INTO users (username, password_hash, name, role, email)
VALUES (
    'admin',
    '$2a$10$X3F3qJV0QkHxE7Y.YfZQ3OEJ8vqBQXJ0K.bJnKqB7r9mKCvZEX7n6',
    'Administrator',
    'admin',
    'admin@example.com'
) ON CONFLICT (username) DO NOTHING;

-- Create sample developer user (password: dev123)
INSERT INTO users (username, password_hash, name, role, email)
VALUES (
    'developer',
    '$2a$10$k5HxV0YdC6jPJ8qMJyKZ8ePPRxZKYCZJqKXjCvJRK9jXVK5wX7n6',
    'Developer User',
    'developer',
    'dev@example.com'
) ON CONFLICT (username) DO NOTHING;
