# APK Manager - Docker Deployment Guide

Kompletní návod pro nasazení APK Manager na server s existujícím Supabase stackem.

## Předpoklady

- ✅ Běžící Supabase stack (PostgreSQL, Kong API, Auth, Storage)
- ✅ Docker a Docker Compose nainstalované
- ✅ Git nainstalovaný
- ✅ Supabase CLI nainstalované ([instalace](https://supabase.com/docs/guides/cli/getting-started))

## Architektura

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  http://localhost:3000 (nebo tvoje-domena.cz)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  APK Manager Frontend (Docker Container)                    │
│  Port: 3000                                                  │
│  Image: ghcr.io/nemovitostnik-h/droid-deploy:main          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Stack (tvůj existující)                          │
│  - Kong API Gateway (port 8000)                             │
│  - PostgreSQL (port 5432)                                    │
│  - GoTrue Auth                                               │
│  - Storage API                                               │
│  - Edge Functions                                            │
└─────────────────────────────────────────────────────────────┘
```

## Krok 1: Příprava projektu (5 min)

```bash
# 1. Naklonuj repository
git clone https://github.com/nemovitostnik-h/droid-deploy.git
cd droid-deploy

# 2. Zkopíruj production environment variables
cp .env.production .env

# 3. Uprav .env podle tvého Supabase setupu
nano .env
```

### Konfigurace `.env`

```bash
# Pro lokální Supabase (localhost)
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=<tvůj-anon-key-ze-supabase>

# Nebo pro Docker network (pokud frontend běží v síti se Supabase)
VITE_SUPABASE_URL=http://supabase-kong:8000
VITE_SUPABASE_ANON_KEY=<tvůj-anon-key-ze-supabase>

# Port pro frontend
APP_PORT=3000
TZ=Europe/Prague
```

**Kde najdu ANON_KEY?**
- V tvém Supabase `.env` souboru jako `ANON_KEY`
- Nebo v Supabase Studio → Settings → API

## Krok 2: Setup databáze a Edge Functions (10 min)

```bash
# 1. Linkni Supabase projekt
supabase link --project-ref apk-manager

# 2. Aplikuj database migrations
supabase db push

# 3. Deploy Edge Function pro publikování APK
supabase functions deploy publish-apk
```

**Co se děje při migrations?**
- ✅ Vytvoří tabulky: `apk_files`, `publications`, `publication_logs`, `user_roles`
- ✅ Nastaví RLS policies (bezpečnostní pravidla)
- ✅ Vytvoří Storage bucket `apk-files`
- ✅ Nasadí seed data (admin user)

## Krok 3: Vytvoření admin uživatele (3 min)

### Metoda A: Přes curl (doporučeno)

```bash
# 1. Vytvoř uživatele přes Supabase Auth API
curl -X POST 'http://localhost:8000/auth/v1/signup' \
  -H "apikey: <tvůj-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@apkmanager.local",
    "password": "admin123"
  }'
```

### Metoda B: Přes Supabase Studio

1. Otevři Supabase Studio: `http://localhost:54323`
2. Přejdi do **Authentication** → **Users**
3. Klikni **Add user**
4. Vyplň:
   - Email: `admin@apkmanager.local`
   - Password: `admin123`
   - Auto Confirm: ✅

### Přiřazení admin role

**DŮLEŽITÉ:** Admin role se musí přidat ručně v databázi!

```sql
-- Spusť v Supabase Studio → SQL Editor
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@apkmanager.local';
```

## Krok 4: Spuštění Docker containeru (2 min)

```bash
# 1. Stáhni nejnovější image z GitHub Container Registry
docker-compose pull

# 2. Spusť container
docker-compose up -d

# 3. Zkontroluj logy
docker-compose logs -f apk-manager-frontend

# 4. Zkontroluj status
docker-compose ps
```

### Očekávaný output:

```
NAME                    STATUS    PORTS
apk-manager-frontend    running   0.0.0.0:3000->80/tcp
```

## Krok 5: Přístup k aplikaci (1 min)

1. **Otevři browser:** `http://localhost:3000`
2. **Přihlaš se:**
   - Email: `admin@apkmanager.local`
   - Password: `admin123`
3. **IHNED změň heslo** v Settings!

## Přístup přes Nginx Proxy Manager (volitelné)

Pokud chceš publikovat aplikaci na doménu:

```nginx
# Přidej proxy host v NPM
Domain: apk.tvoje-domena.cz
Forward to: localhost:3000
Websockets: ✅ (pro realtime updates)
SSL: ✅ (doporučeno)
```

## Aktualizace na novou verzi

```bash
# 1. Zastav container
docker-compose down

# 2. Stáhni nejnovější image
docker-compose pull

# 3. Spusť znovu
docker-compose up -d

# 4. Aplikuj nové migrations (pokud existují)
supabase db push

# 5. Redeploy edge functions (pokud se změnily)
supabase functions deploy publish-apk
```

## Troubleshooting

### ❌ Frontend container se nespustí

```bash
# Zkontroluj logy
docker-compose logs apk-manager-frontend

# Zkontroluj .env
cat .env

# Zkontroluj síť
docker network ls
docker network inspect apk-network
```

### ❌ "Failed to fetch" při načítání dat

**Příčina:** Špatná `VITE_SUPABASE_URL` nebo frontend nemůže kontaktovat Supabase.

**Řešení:**

```bash
# Zkontroluj, zda Supabase běží
curl http://localhost:8000/

# Pro Docker network použij container name
VITE_SUPABASE_URL=http://supabase-kong:8000

# Pro host machine použij localhost
VITE_SUPABASE_URL=http://localhost:8000
```

### ❌ Login nefunguje

**Příčina:** Admin user nemá přiřazenou roli.

**Řešení:**

```sql
-- Zkontroluj role
SELECT u.email, ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@apkmanager.local';

-- Přidej admin roli
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@apkmanager.local'
ON CONFLICT (user_id, role) DO NOTHING;
```

### ❌ APK upload selhává

**Příčina:** Storage bucket není vytvořen nebo nemá správná oprávnění.

**Řešení:**

```sql
-- Zkontroluj storage bucket
SELECT * FROM storage.buckets WHERE id = 'apk-files';

-- Vytvoř bucket pokud neexistuje
INSERT INTO storage.buckets (id, name, public)
VALUES ('apk-files', 'apk-files', false);

-- Zkontroluj RLS policies na storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### ❌ Edge function selhává

```bash
# Zkontroluj deployment
supabase functions list

# Zkontroluj logy
supabase functions logs publish-apk

# Redeploy
supabase functions deploy publish-apk --no-verify-jwt
```

## Bezpečnostní doporučení pro produkci

### 1. Změň výchozí hesla

```bash
# Admin user
# Přihlaš se → Settings → změň heslo
```

### 2. Používej HTTPS

- ✅ Nastav NPM s Let's Encrypt SSL
- ✅ Nastav `VITE_SUPABASE_URL=https://supabase.tvoje-domena.cz`

### 3. Omezeně CORS

```sql
-- V Supabase config.toml
[auth]
site_url = "https://apk.tvoje-domena.cz"
additional_redirect_urls = ["https://apk.tvoje-domena.cz"]
```

### 4. Pravidelné zálohy

```bash
# Backup Supabase databáze
docker exec supabase-db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i supabase-db psql -U postgres postgres < backup_20250111.sql
```

## Užitečné příkazy

```bash
# Restart containeru
docker-compose restart apk-manager-frontend

# Sleduj logy
docker-compose logs -f

# Zastav vše
docker-compose down

# Smaž vše včetně volumes
docker-compose down -v

# Rebuild image lokálně (pro development)
docker-compose build --no-cache
```

## Struktura projektu

```
droid-deploy/
├── .github/workflows/
│   └── docker-build.yml       # Automatický build na GitHub
├── migrations/                # Supabase database migrations
│   ├── 00000000000000_initial_schema.sql
│   ├── 00000000000001_storage_setup.sql
│   └── 00000000000002_seed_data.sql
├── supabase/
│   ├── config.toml           # Supabase konfigurace
│   └── functions/
│       └── publish-apk/      # Edge function pro publikaci
├── src/                      # React frontend source
├── docker-compose.yml        # Production deployment
├── Dockerfile                # Frontend build
├── .env.production           # Production env template
└── scripts/setup.sh          # Setup script
```

## Podpora

- **GitHub Issues:** https://github.com/nemovitostnik-h/droid-deploy/issues
- **Documentation:** https://github.com/nemovitostnik-h/droid-deploy/blob/main/README.md

## License

MIT License - viz [LICENSE](LICENSE)
