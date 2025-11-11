#!/bin/bash

# APK Manager - JWT Keys Generator
# Generates JWT_SECRET, ANON_KEY, and SERVICE_ROLE_KEY for Supabase

set -e

echo "🔐 APK Manager - JWT Keys Generator"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install Node.js first: https://nodejs.org/"
    exit 1
fi

# Check if jsonwebtoken is installed
if ! node -e "require('jsonwebtoken')" 2>/dev/null; then
    echo "📦 Installing jsonwebtoken..."
    npm install -g jsonwebtoken
fi

echo "🎲 Generating JWT_SECRET..."
JWT_SECRET=$(openssl rand -hex 32)
echo "✅ JWT_SECRET generated"
echo ""

echo "🔑 Generating ANON_KEY..."
ANON_KEY=$(node -e "console.log(require('jsonwebtoken').sign({role:'anon',iss:'supabase'},'$JWT_SECRET',{expiresIn:'10y'}))")
echo "✅ ANON_KEY generated"
echo ""

echo "🔑 Generating SERVICE_ROLE_KEY..."
SERVICE_ROLE_KEY=$(node -e "console.log(require('jsonwebtoken').sign({role:'service_role',iss:'supabase'},'$JWT_SECRET',{expiresIn:'10y'}))")
echo "✅ SERVICE_ROLE_KEY generated"
echo ""

echo "===================================="
echo "✨ Keys generated successfully!"
echo "===================================="
echo ""
echo "📋 Add these to your .env file:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "ANON_KEY=$ANON_KEY"
echo ""
echo "SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
echo ""
echo "⚠️  Keep these keys SECRET!"
echo "   Never commit them to Git or share them publicly."
echo ""

# Optionally write to .env file
read -p "❓ Write to .env file? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f .env ]; then
        echo "⚠️  .env file already exists"
        read -p "   Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Cancelled"
            exit 0
        fi
    fi
    
    cp .env.supabase.example .env
    
    # Replace placeholders in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        sed -i '' "s|ANON_KEY=.*|ANON_KEY=$ANON_KEY|" .env
        sed -i '' "s|SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        sed -i "s|ANON_KEY=.*|ANON_KEY=$ANON_KEY|" .env
        sed -i "s|SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env
    fi
    
    echo "✅ Keys written to .env file"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Review and update other values in .env (especially POSTGRES_PASSWORD)"
    echo "   2. Run: docker-compose -f docker-compose.supabase.yml up -d"
    echo ""
fi
