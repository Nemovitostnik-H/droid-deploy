#!/bin/bash

# APK Manager Setup Script
# Tento script aplikuje database migrations a deployuje edge functions

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║        APK Manager - Supabase Setup Script            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Zjištění dostupnosti Supabase CLI (nevyžadujeme ho nutně – použijeme dockerizovanou variantu)
HAS_LOCAL_CLI=0
if command -v supabase &> /dev/null; then
    HAS_LOCAL_CLI=1
    echo "✅ Supabase CLI je nainstalované (lokálně)"
else
    echo "ℹ️ Supabase CLI lokálně nenalezeno – použiji dockerizovanou variantu (doporučeno)"
fi

echo ""


# Kontrola .env souboru
if [ ! -f .env ]; then
    echo "❌ .env soubor nenalezen!"
    echo ""
    echo "📝 Vytvoř .env soubor:"
    echo "   cp .env.production .env"
    echo ""
    echo "📋 Potřebné proměnné:"
    echo "   VITE_SUPABASE_URL=http://localhost:8000"
    echo "   VITE_SUPABASE_ANON_KEY=tvůj-anon-key"
    echo "   SUPABASE_PROJECT_REF=apk-manager"
    exit 1
fi

# Načtení environment variables
source .env

# Validace proměnných
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Chybí povinné proměnné v .env!"
    echo ""
    echo "📝 .env musí obsahovat:"
    echo "   VITE_SUPABASE_URL=http://localhost:8000"
    echo "   VITE_SUPABASE_ANON_KEY=tvůj-anon-key"
    echo "   POSTGRES_PASSWORD=tvoje-postgres-heslo (pro CLI linkování)"
    exit 1
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "⚠️  POSTGRES_PASSWORD není nastavený v .env!"
    echo ""
    echo "📝 Pro self-hosted Supabase potřebuješ database credentials:"
    echo "   POSTGRES_PASSWORD=tvoje-postgres-heslo"
    echo "   POSTGRES_HOST=localhost"
    echo "   POSTGRES_PORT=5432"
    echo ""
    exit 1
fi

echo "✅ Environment variables načteny"
echo "   URL: $VITE_SUPABASE_URL"
echo ""

# Příprava DB připojení
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_URL="postgresql://${DB_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Varianta pro Docker síť (supabase_default → host 'db')
DB_HOST_IN_NETWORK="${DB_HOST_IN_NETWORK:-db}"
DOCKER_DB_URL="postgresql://${DB_USER}:${POSTGRES_PASSWORD}@${DB_HOST_IN_NETWORK}:${DB_PORT}/${DB_NAME}"

echo "🔗 Připojuji k databázi..."
echo "   Host (lokální): ${DB_HOST}:${DB_PORT}"
echo "   Host (docker síť): ${DB_HOST_IN_NETWORK}:${DB_PORT}"
echo ""

# Aplikace migrations (preferujeme dockerizovaný CLI v síti supabase_default)
echo "📦 Aplikuji database migrations..."
echo ""

USE_DOCKER_CLI=0
if command -v docker &>/dev/null && docker network inspect supabase_default >/dev/null 2>&1; then
  USE_DOCKER_CLI=1
fi

if [ "$USE_DOCKER_CLI" -eq 1 ]; then
  echo "🚀 Používám dockerizovaný Supabase CLI v síti 'supabase_default'"
  if docker run --rm --network supabase_default -v "$PWD":/workspace -w /workspace supabase/cli:latest db push --db-url "$DOCKER_DB_URL"; then
    echo "✅ Migrations úspěšně aplikovány (docker CLI)"
  else
    echo "❌ Chyba při aplikaci migrations (docker CLI)"
    echo "   Ověř, že běží Supabase stack a síť 'supabase_default' existuje."
    exit 1
  fi
else
  if [ "$HAS_LOCAL_CLI" -eq 1 ]; then
    echo "ℹ️ Používám lokální Supabase CLI"
    if supabase db push --db-url "$DB_URL"; then
      echo "✅ Migrations úspěšně aplikovány (lokální CLI)"
    else
      echo "❌ Chyba při aplikaci migrations (lokální CLI)"
      echo "   Zvaž použití Docker: 'docker network ls' a ověř existenci supabase_default"
      exit 1
    fi
  else
    echo "❌ Supabase CLI není dostupné a docker síť 'supabase_default' nebyla nalezena."
    echo "   Nainstaluj CLI nebo spusť tento script na stroji, kde běží Docker se sítí 'supabase_default'."
    exit 1
  fi
fi

echo ""

# Edge Functions pro self-hosted Supabase
echo "📦 Edge Functions setup..."
echo ""
echo "⚠️  Pro self-hosted Supabase jsou Edge Functions v Docker volumes:"
echo ""
echo "📝 Zkopíruj Edge Functions manuálně:"
echo "   1. Najdi volumes složku tvého Supabase stacku"
echo "   2. Zkopíruj: supabase/functions/publish-apk/ → volumes/functions/publish-apk/"
echo "   3. Restartuj functions service:"
echo "      docker compose restart functions --no-deps"
echo ""
echo "📋 Nebo použij tento příkaz (změň cestu k volumes):"
echo "   cp -r supabase/functions/publish-apk /path/to/supabase/volumes/functions/"
echo "   cd /path/to/supabase && docker compose restart functions --no-deps"
echo ""

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           ✅ Setup dokončen úspěšně!                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Co bylo uděláno:"
echo "   ✅ Database schema (tabulky, RLS policies)"
echo "   ✅ Storage bucket 'apk-files'"
echo "   ⚠️  Edge functions připraveny ke zkopírování"
echo "   ✅ Seed data (app_role enum)"
echo ""
echo "📋 Další kroky:"
echo ""
echo "1️⃣  Zkopíruj Edge Functions do Supabase volumes:"
echo "   cp -r supabase/functions/publish-apk /path/to/supabase/volumes/functions/"
echo "   docker compose restart functions --no-deps"
echo ""
echo "2️⃣  Vytvoř admin uživatele:"
echo "   curl -X POST 'http://localhost:8000/auth/v1/signup' \\"
echo "     -H 'apikey: $VITE_SUPABASE_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@apkmanager.local\",\"password\":\"admin123\"}'"
echo ""
echo "3️⃣  Přiřaď admin roli (přes Supabase Studio → SQL Editor):"
echo "   INSERT INTO public.user_roles (user_id, role)"
echo "   SELECT id, 'admin'::app_role FROM auth.users"
echo "   WHERE email = 'admin@apkmanager.local';"
echo ""
echo "4️⃣  Spusť Docker container:"
echo "   docker-compose pull"
echo "   docker-compose up -d"
echo ""
echo "5️⃣  Přihlaš se do aplikace:"
echo "   URL: http://localhost:3000"
echo "   Email: admin@apkmanager.local"
echo "   Password: admin123"
echo ""
echo "⚠️  Změň heslo po prvním přihlášení!"
echo ""
