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
    echo "   VITE_SUPABASE_URL"
    echo "   VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo "✅ Environment variables načteny"
echo "   URL: $VITE_SUPABASE_URL"
echo ""

# Kontrola linkování projektu
if ! supabase status &> /dev/null; then
    echo "🔗 Linkuji Supabase projekt..."
    
    if [ -n "$SUPABASE_PROJECT_REF" ]; then
        supabase link --project-ref "$SUPABASE_PROJECT_REF"
        echo "✅ Projekt nalinkován"
    else
        echo "⚠️  SUPABASE_PROJECT_REF není nastavený v .env"
        echo ""
        echo "📝 Spusť manuálně:"
        echo "   supabase link --project-ref apk-manager"
        exit 1
    fi
else
    echo "✅ Projekt už je nalinkovaný"
fi

echo ""

# Aplikace migrations
echo "📦 Aplikuji database migrations..."
echo "   Vytvářím tabulky, RLS policies, storage bucket..."
echo ""

if supabase db push; then
    echo "✅ Migrations úspěšně aplikovány"
else
    echo "❌ Chyba při aplikaci migrations"
    exit 1
fi

echo ""

# Deploy Edge Functions
echo "🚀 Deployuji Edge Functions..."
echo "   Function: publish-apk"
echo ""

if supabase functions deploy publish-apk; then
    echo "✅ Edge Functions úspěšně deploynuty"
else
    echo "❌ Chyba při deployi Edge Functions"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           ✅ Setup dokončen úspěšně!                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Co bylo uděláno:"
echo "   ✅ Database schema (tabulky, RLS policies)"
echo "   ✅ Storage bucket 'apk-files'"
echo "   ✅ Edge function 'publish-apk'"
echo "   ✅ Seed data (app_role enum)"
echo ""
echo "📋 Další kroky:"
echo ""
echo "1️⃣  Vytvoř admin uživatele:"
echo "   curl -X POST 'http://localhost:8000/auth/v1/signup' \\"
echo "     -H 'apikey: $VITE_SUPABASE_ANON_KEY' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@apkmanager.local\",\"password\":\"admin123\"}'"
echo ""
echo "2️⃣  Přiřaď admin roli (přes Supabase Studio → SQL Editor):"
echo "   INSERT INTO public.user_roles (user_id, role)"
echo "   SELECT id, 'admin'::app_role FROM auth.users"
echo "   WHERE email = 'admin@apkmanager.local';"
echo ""
echo "3️⃣  Spusť Docker container:"
echo "   docker-compose pull"
echo "   docker-compose up -d"
echo ""
echo "4️⃣  Přihlaš se do aplikace:"
echo "   URL: http://localhost:3000"
echo "   Email: admin@apkmanager.local"
echo "   Password: admin123"
echo ""
echo "⚠️  Změň heslo po prvním přihlášení!"
echo ""
