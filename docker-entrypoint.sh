#!/bin/sh
set -e

# Generate env-config.js from runtime environment variables
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}"
};
EOF

echo "✅ Generated env-config.js with runtime ENV variables"
echo "   VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}"

# Start nginx
exec nginx -g "daemon off;"
