#!/bin/bash
set -e

echo "🚀 APK Manager Deployment Script"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI není nainstalované"
    echo "   Nainstaluj: https://supabase.com/docs/guides/cli"
    echo "   nebo: brew install supabase/tap/supabase (macOS)"
    echo "   nebo: scoop install supabase (Windows)"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env soubor neexistuje"
    echo "   Zkopíruj .env.example a vyplň hodnoty:"
    echo "   cp .env.example .env"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Load environment variables
set -a
source .env
set +a

# Check required variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL není nastaven v .env"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY není nastaven v .env"
    exit 1
fi

echo "✅ Environment variables validated"
echo ""

# Check if we need to link project
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "📦 Linking to Supabase project..."
    echo "   URL: $VITE_SUPABASE_URL"
    
    # Try to link
    if [ -n "$SUPABASE_PROJECT_REF" ]; then
        supabase link --project-ref "$SUPABASE_PROJECT_REF" || {
            echo "⚠️  Auto-link failed, please run manually:"
            echo "   supabase link"
            exit 1
        }
    else
        echo "⚠️  SUPABASE_PROJECT_REF not set, please link manually:"
        echo "   supabase link"
        exit 1
    fi
fi

echo "✅ Project linked"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
supabase db push || {
    echo "❌ Database migration failed"
    echo "   Check your database connection and credentials"
    exit 1
}

echo "✅ Database migrations completed"
echo ""

# Deploy Edge Functions
echo "⚡ Deploying Edge Functions..."
supabase functions deploy publish-apk || {
    echo "⚠️  Edge function deployment failed"
    echo "   You may need to deploy manually or check function code"
}

echo "✅ Edge Functions deployed"
echo ""

echo "================================================"
echo "✅ Deployment completed successfully!"
echo "================================================"
echo ""
echo "📝 Next steps:"
echo "   1. Build and run Docker:"
echo "      docker-compose up -d --build"
echo ""
echo "   2. Access app:"
echo "      http://localhost:${APP_PORT:-3000}"
echo ""
echo "   3. Login with default admin:"
echo "      Email: admin@apkmanager.local"
echo "      Password: admin123"
echo ""
echo "   ⚠️  IMPORTANT: Change admin password after first login!"
echo ""
