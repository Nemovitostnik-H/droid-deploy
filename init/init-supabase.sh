#!/bin/bash
set -e

echo "🚀 APK Manager - Supabase Initialization"
echo "========================================="

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "   Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Wait for Kong API Gateway
echo "⏳ Waiting for Kong API Gateway..."
until curl -s http://kong:8000/health > /dev/null 2>&1; do
  echo "   Kong is unavailable - sleeping"
  sleep 2
done

echo "✅ Kong is ready!"

# Run migrations
echo "📦 Running database migrations..."
for migration in /migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "   Running: $(basename $migration)"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$migration"
  fi
done

echo "✅ Migrations completed!"

# Create default admin user via GoTrue API
echo "👤 Creating default admin user..."

# Admin credentials
ADMIN_EMAIL="admin@apkmanager.local"
ADMIN_PASSWORD="admin123"

# Create admin user via Supabase Auth API
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"name\": \"Administrator\"
    }
  }")

# Extract user ID from response
USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$USER_ID" ]; then
  echo "✅ Admin user created: $ADMIN_EMAIL (ID: $USER_ID)"
  
  # Assign admin role
  echo "🔑 Assigning admin role..."
  PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('${USER_ID}', 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
EOSQL
  
  echo "✅ Admin role assigned!"
else
  echo "⚠️  Admin user might already exist or creation failed"
  echo "   Response: $RESPONSE"
  
  # Try to find existing admin user and assign role
  EXISTING_USER_ID=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT id FROM auth.users WHERE email = '${ADMIN_EMAIL}' LIMIT 1;" | tr -d ' ')
  
  if [ -n "$EXISTING_USER_ID" ]; then
    echo "   Found existing user: $EXISTING_USER_ID"
    PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
      INSERT INTO public.user_roles (user_id, role)
      VALUES ('${EXISTING_USER_ID}', 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
EOSQL
    echo "✅ Admin role assigned to existing user!"
  fi
fi

echo ""
echo "========================================="
echo "✨ Initialization Complete!"
echo "========================================="
echo ""
echo "📋 Access Information:"
echo "   Frontend:        http://localhost:${APP_PORT:-3000}"
echo "   Supabase Studio: http://localhost:${STUDIO_PORT:-3010}"
echo "   API Gateway:     http://localhost:${KONG_HTTP_PORT:-8000}"
echo ""
echo "🔐 Default Login:"
echo "   Email:    admin@apkmanager.local"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"
echo ""
