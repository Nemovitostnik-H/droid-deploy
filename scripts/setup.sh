#!/bin/bash

# APK Manager Setup Script
# Tento script aplikuje database migrations a deployuje edge functions

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║        APK Manager - Supabase Setup Script            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Kontrola Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI není nainstalované!"
    echo ""
    echo "📥 Instalace:"
    echo "   macOS:   brew install supabase/tap/supabase"
    echo "   Linux:   curl -fsSL https://supabase.com/install.sh | sh"
    echo "   Windows: scoop install supabase"
    echo ""
    echo "📖 Více info: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "✅ Supabase CLI je nainstalované"
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

# Pro self-hosted Supabase použijeme přímé DB připojení
DB_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-postgres}"

echo "🔗 Připojuji k databázi..."
echo "   Database: ${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}"
echo ""

# Aplikace migrations pomocí přímého DB URL
echo "📦 Aplikuji database migrations..."
echo "   Vytvářím tabulky, RLS policies, storage bucket..."
echo ""

if supabase db push --db-url "$DB_URL"; then
    echo "✅ Migrations úspěšně aplikovány"
else
    echo "❌ Chyba při aplikaci migrations"
    echo ""
    echo "📝 Zkontroluj:"
    echo "   1. Je Supabase database dostupná na ${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}?"
    echo "   2. Je POSTGRES_PASSWORD správně? ($POSTGRES_PASSWORD)"
    echo "   3. Má uživatel $POSTGRES_USER práva k databázi?"
    echo ""
    echo "📝 Můžeš zkusit manuálně:"
    echo "   psql \"$DB_URL\" -c '\\dt'"
    exit 1
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
