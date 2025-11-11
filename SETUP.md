# APK Manager - Self-hosted Supabase Setup

Kompletní průvodce pro nasazení APK Manageru s self-hosted Supabase na vlastním serveru.

## 📋 Obsah

- [Požadavky](#požadavky)
- [Rychlý start](#rychlý-start)
- [Konfigurace](#konfigurace)
- [Přístup k aplikaci](#přístup-k-aplikaci)
- [Správa](#správa)
- [Troubleshooting](#troubleshooting)

## 🔧 Požadavky

### Hardware
- **CPU**: 2+ cores
- **RAM**: 4GB+ (doporučeno 8GB)
- **Disk**: 20GB+ volného místa

### Software
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (pouze pro generování JWT keys)

### Porty
Následující porty musí být volné:
- `3000` - Frontend
- `3010` - Supabase Studio (admin UI)
- `8000` - Kong API Gateway
- `5432` - PostgreSQL (volitelné - pouze pokud chceš direct access)

## 🚀 Rychlý start

### 1. Clone repository

```bash
git clone <repository-url>
cd apk-manager
```

### 2. Konfigurace prostředí

```bash
# Zkopíruj env template
cp .env.example .env

# Vygeneruj JWT secret (64 znaků hex)
openssl rand -hex 32

# Vygeneruj silné heslo pro PostgreSQL
openssl rand -base64 24
```

### 3. Vygeneruj JWT keys

Pro generování ANON_KEY a SERVICE_ROLE_KEY potřebuješ Node.js a `jsonwebtoken`:

```bash
# Nainstaluj jsonwebtoken globálně
npm install -g jsonwebtoken

# Nastav JWT_SECRET (použij secret z kroku 2)
export JWT_SECRET="tvůj-vygenerovaný-jwt-secret"

# Vygeneruj ANON_KEY
node -e "console.log(require('jsonwebtoken').sign({role:'anon',iss:'supabase'},process.env.JWT_SECRET,{expiresIn:'10y'}))"

# Vygeneruj SERVICE_ROLE_KEY
node -e "console.log(require('jsonwebtoken').sign({role:'service_role',iss:'supabase'},process.env.JWT_SECRET,{expiresIn:'10y'}))"
```

### 4. Edituj .env soubor

Otevři `.env` a vyplň následující hodnoty:

```env
# Database
POSTGRES_PASSWORD=<tvoje-vygenerované-heslo>

# JWT
JWT_SECRET=<tvůj-vygenerovaný-jwt-secret>
ANON_KEY=<vygenerovaný-anon-key>
SERVICE_ROLE_KEY=<vygenerovaný-service-role-key>

# URLs (změň pokud nasazuješ na server s doménou)
SITE_URL=http://localhost:3000
SUPABASE_PUBLIC_URL=http://localhost:8000
```

### 5. Spusť aplikaci

```bash
# Spusť všechny služby
docker-compose -f docker-compose.supabase.yml up -d

# Sleduj logy inicializace
docker-compose -f docker-compose.supabase.yml logs -f init

# Počkej až uvidíš: "✨ Initialization Complete!"
```

### 6. První přihlášení

Aplikace automaticky vytvoří admin účet:

```
Email:    admin@apkmanager.local
Password: admin123
```

⚠️ **DŮLEŽITÉ**: Po prvním přihlášení **ZMĚŇ HESLO** v Supabase Studio!

## 📊 Přístup k aplikaci

Po úspěšném startu máš přístup k:

| Služba | URL | Popis |
|--------|-----|-------|
| **Frontend** | http://localhost:3000 | Hlavní aplikace |
| **Supabase Studio** | http://localhost:3010 | Admin rozhraní pro databázi |
| **API Gateway** | http://localhost:8000 | REST API endpoint |

## 🎨 Supabase Studio

Supabase Studio je webové rozhraní pro správu databáze:

### Funkce:
- 📊 **Table Editor** - Prohlížení a editace dat
- 🔐 **Authentication** - Správa uživatelů
- 🗄️ **Storage** - Správa APK souborů
- 📝 **SQL Editor** - Spouštění SQL dotazů
- 📈 **Logs** - Sledování aktivit
- ⚙️ **Settings** - Konfigurace

### Přístup:
1. Otevři http://localhost:3010
2. Přihlaš se pomocí admin credentials
3. Vybereš svůj projekt "APK Manager"

## 🔧 Konfigurace

### Změna portů

Edituj `.env` soubor:

```env
APP_PORT=3000          # Frontend port
STUDIO_PORT=3010       # Studio port
KONG_HTTP_PORT=8000    # API Gateway port
POSTGRES_PORT=5432     # Database port
```

### Nastavení domény

Pro produkční nasazení s doménou:

```env
SITE_URL=https://apk.tvojadomena.cz
SUPABASE_PUBLIC_URL=https://api.tvojadomena.cz
ADDITIONAL_REDIRECT_URLS=https://apk.tvojadomena.cz/auth/callback
```

Nezapomeň nakonfigurovat reverse proxy (Nginx, Traefik, Caddy).

### SMTP pro email notifikace

Pro odesílání registračních emailů:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tvuj-email@gmail.com
SMTP_PASS=tvoje-app-heslo
SMTP_ADMIN_EMAIL=admin@tvojadomena.cz
SMTP_SENDER_NAME=APK Manager
```

## 🛠️ Správa

### Sledování logů

```bash
# Všechny služby
docker-compose -f docker-compose.supabase.yml logs -f

# Konkrétní služba
docker-compose -f docker-compose.supabase.yml logs -f frontend
docker-compose -f docker-compose.supabase.yml logs -f db
docker-compose -f docker-compose.supabase.yml logs -f kong
```

### Restart služeb

```bash
# Restart všech služeb
docker-compose -f docker-compose.supabase.yml restart

# Restart konkrétní služby
docker-compose -f docker-compose.supabase.yml restart frontend
```

### Stop a odstranění

```bash
# Stop všech služeb
docker-compose -f docker-compose.supabase.yml down

# Stop + odstranění volumes (⚠️ SMAŽE DATA!)
docker-compose -f docker-compose.supabase.yml down -v
```

### Záloha databáze

```bash
# Vytvoř zálohu
docker exec supabase-db pg_dump -U supabase postgres > backup.sql

# Restore zálohy
docker exec -i supabase-db psql -U supabase postgres < backup.sql
```

### Záloha Storage

```bash
# Vytvoř zálohu APK souborů
docker cp supabase-storage:/var/lib/storage ./storage-backup

# Restore
docker cp ./storage-backup supabase-storage:/var/lib/storage
```

## 🔍 Troubleshooting

### Init container selhává

**Problém**: Init container končí s chybou

**Řešení**:
```bash
# Zkontroluj logy
docker-compose -f docker-compose.supabase.yml logs init

# Restart init containeru
docker-compose -f docker-compose.supabase.yml restart init
```

### Database connection failed

**Problém**: Služby se nemohou připojit k databázi

**Řešení**:
```bash
# Zkontroluj status databáze
docker-compose -f docker-compose.supabase.yml ps db

# Zkontroluj logy
docker-compose -f docker-compose.supabase.yml logs db

# Restartuj databázi
docker-compose -f docker-compose.supabase.yml restart db
```

### Kong nefunguje

**Problém**: API Gateway neodpovídá

**Řešení**:
```bash
# Test Kongu
curl http://localhost:8000/health

# Zkontroluj kong.yml
cat supabase/config/kong.yml

# Restart Kongu
docker-compose -f docker-compose.supabase.yml restart kong
```

### Frontend nelze načíst

**Problém**: Frontend zobrazuje chybu "Cannot connect to API"

**Řešení**:
1. Zkontroluj že Kong běží: `curl http://localhost:8000/health`
2. Zkontroluj env proměnné ve frontendu
3. Zkontroluj CORS nastavení v Kongu

### Admin uživatel neexistuje

**Problém**: Nelze se přihlásit s admin@apkmanager.local

**Řešení**:
```bash
# Vytvoř manuálně přes psql
docker exec -it supabase-db psql -U supabase postgres

# V psql:
-- Najdi user ID
SELECT id, email FROM auth.users WHERE email = 'admin@apkmanager.local';

-- Přiřaď admin roli
INSERT INTO public.user_roles (user_id, role)
VALUES ('<USER_ID>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Nebo vytvoř nového admina přes Supabase Studio:
1. Otevři http://localhost:3010
2. Jdi na **Authentication** > **Users**
3. Klikni **Add User**
4. Vytvoř nového uživatele
5. V databázi (Table Editor) přidej záznam do `user_roles` s admin role

### Storage upload selhává

**Problém**: Nelze uploadovat APK soubory

**Řešení**:
1. Zkontroluj že bucket `apk-files` existuje v Storage
2. Zkontroluj RLS policies na `storage.objects`
3. Zkontroluj že uživatel má admin roli

```sql
-- Zkontroluj bucket
SELECT * FROM storage.buckets WHERE id = 'apk-files';

-- Zkontroluj RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 📚 Další zdroje

- **Supabase Docs**: https://supabase.com/docs
- **Docker Compose**: https://docs.docker.com/compose/
- **PostgreSQL**: https://www.postgresql.org/docs/

## 🔒 Bezpečnost v produkci

Pro produkční nasazení:

1. ✅ Změň všechna výchozí hesla
2. ✅ Použij HTTPS s SSL certifikáty
3. ✅ Nastav firewall pravidla
4. ✅ Omez přístup k Supabase Studio (port 3010)
5. ✅ Používej silné JWT secrets (min 64 znaků)
6. ✅ Pravidelně zálohuj databázi a storage
7. ✅ Sleduj logy a monitoring
8. ✅ Aktualizuj Docker images

## 💡 Tipy

- **Disable signup**: Nastav `DISABLE_SIGNUP=true` pro produkci
- **Email autoconfirm**: Nastav `ENABLE_EMAIL_AUTOCONFIRM=false` pro produkci
- **Timezone**: Změň `TZ=Europe/Prague` podle potřeby
- **Performance**: Pro větší zátěž zvyš resources v docker-compose.yml
