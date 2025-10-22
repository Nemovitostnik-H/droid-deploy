# APK Manager - Deployment Guide

## Přehled

Tato příručka vás provede procesem nasazení kompletní APK Manager aplikace včetně frontendu, backendu a databáze pomocí Docker Compose.

## Architektura

APK Manager se skládá ze 3 Docker kontejnerů:
- **Frontend** (`ghcr.io/nemovitostnik-h/droid-deploy:main`) - React aplikace na portu 8580
- **Backend** (buildovaný lokálně) - Node.js/Express API na portu 3000
- **Database** (`postgres:16-alpine`) - PostgreSQL databáze na portu 5432

## Docker Deployment (Doporučeno)

### Portainer Deployment (Nejjednodušší)

Portainer umožňuje nasazení přímo z GitHub repozitáře s automatickými updaty.

#### Krok 1: Nasaď Stack z Git Repository

1. V Portaineru jdi na **Stacks** → **Add stack**
2. Zvol **Repository** jako Build method
3. Vyplň údaje:
   - **Name**: `apk-manager` (nebo libovolný název stacku)
   - **Authentication**: ⚪ Vypni (repozitář je veřejný)
   - **Repository URL**: `https://github.com/Nemovitostnik-H/droid-deploy`
   - **Repository reference**: `main` (nebo jiná branch/tag)
   - **Compose path**: `docker-compose.yml`
4. **Environment variables** (⚠️ POVINNÉ):
   ```env
   APP_PORT=8580
   API_PORT=3000
   API_BASE_URL=http://localhost:3000/api
   APK_DATA_PATH=/home/jelly/docker/apk-manager
   POSTGRES_USER=apkmanager
   POSTGRES_PASSWORD=VyberSilneHeslo123!
   POSTGRES_DB=apkmanager
   JWT_SECRET=nahodny-dlouhy-secret-minimalne-32-znaku-xyz123
   TZ=Europe/Prague
   ```
   
   **⚠️ DŮLEŽITÉ BEZPEČNOSTNÍ NASTAVENÍ:**
   - `POSTGRES_PASSWORD` - Změň na silné heslo (min 16 znaků)
   - `JWT_SECRET` - Změň na náhodný secret (min 32 znaků)
   
5. **GitOps updates** (volitelné): Zapni pro automatické updaty při změnách v Git repo
6. Klikni **Deploy the stack**
7. **Počkej 30-60 sekund** až se všechny kontejnery nastartují

#### Jak fungují automatické updaty?

Pokud zapneš **GitOps updates**:
- Portainer pravidelně kontroluje změny v GitHub repozitáři
- Při nové verzi automaticky stáhne image a restartuje kontejnery
- Ideální pro CI/CD workflow - push do `main` → automatický deploy

#### První přihlášení

Po úspěšném nasazení se můžeš přihlásit pomocí výchozích credentials:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ KRITICKÉ:** Změň heslo okamžitě po prvním přihlášení!

### Docker Compose (Manuální nasazení)

Pokud preferuješ manuální nasazení bez Portaineru:

#### Rychlý start

```bash
# 1. Klonuj repozitář
git clone https://github.com/Nemovitostnik-H/droid-deploy.git
cd droid-deploy

# 2. Zkopíruj .env.example jako .env a UPRAV hodnoty
cp .env.example .env
nano .env  # nebo vim, code, atd.

# 3. ⚠️ POVINNÉ: Změň v .env souboru:
#    - POSTGRES_PASSWORD (silné heslo)
#    - JWT_SECRET (náhodný secret min 32 znaků)
#    - APK_DATA_PATH (cesta k tvým APK souborům)

# 4. Vytvoř APK adresářovou strukturu (pokud neexistuje)
mkdir -p /home/jelly/docker/apk-manager/{staging,development,release-candidate,production}

# 5. Spusť všechny služby (frontend + backend + databáze)
docker-compose up -d

# 6. Zkontroluj že všechny kontejnery běží
docker-compose ps

# 7. Sleduj logy
docker-compose logs -f

# 8. Počkej až databáze inicializuje (cca 10-20 sekund)
docker-compose logs postgres | grep "database system is ready"
```

#### Ověření nasazení

```bash
# Test backend API health
curl http://localhost:3000/health
# Mělo by vrátit: {"status":"ok","timestamp":"..."}

# Test databáze
docker-compose exec postgres psql -U apkmanager -d apkmanager -c "SELECT COUNT(*) FROM users;"
# Mělo by zobrazit 2 výchozí uživatele

# Test frontendu
curl http://localhost:8580
# Mělo by vrátit HTML
```

### Správa služeb

```bash
# Zastavení všech služeb
docker-compose down

# Restart služeb
docker-compose restart

# Restart konkrétní služby
docker-compose restart backend

# Zobrazení logů konkrétní služby
docker-compose logs -f backend

# Přístup do databáze
docker-compose exec postgres psql -U apkmanager -d apkmanager

# Backup databáze
docker-compose exec postgres pg_dump -U apkmanager apkmanager > backup.sql

# Restore databáze
docker-compose exec -T postgres psql -U apkmanager apkmanager < backup.sql
```

### Build vlastních Docker images

Pokud chcete buildnout vlastní images:

```bash
# Build frontendu
docker build -t apk-manager-frontend:latest .

# Build backendu
docker build -t apk-manager-backend:latest ./backend

# Použití vlastních images v docker-compose.yml:
# Změň:
#   frontend:
#     image: ghcr.io/nemovitostnik-h/droid-deploy:main
# Na:
#   frontend:
#     image: apk-manager-frontend:latest
```

### GitHub Actions - Automatické buildy

Po push do GitHub se automaticky vytvoří a publikuje Docker image frontendu na ghcr.io pomocí GitHub Actions workflow.

Frontend image je dostupný na:
- `ghcr.io/nemovitostnik-h/droid-deploy:main` - nejnovější verze z main
- `ghcr.io/nemovitostnik-h/droid-deploy:v1.0.0` - konkrétní tagged verze

Backend se builduje lokálně při `docker-compose up`.

### Docker konfigurace

**Služby a porty:**
- `frontend` - React UI na portu **8580**
- `backend` - Node.js API na portu **3000**
- `postgres` - PostgreSQL databáze na portu **5432**

**Kritické environment proměnné:**
- `POSTGRES_PASSWORD` - Heslo pro databázi (⚠️ změň v produkci!)
- `JWT_SECRET` - Secret pro JWT tokeny (⚠️ změň v produkci!)
- `APK_DATA_PATH` - Cesta k APK souborům na hostu
- `API_BASE_URL` - URL backendu (pro frontend)

**Volumes:**
- `/data/apk` - APK soubory (backend má read-write přístup)
- `postgres-data` - Databázová data (persistentní Docker volume)

**Health Checks:**
Všechny kontejnery mají health checks:
- Frontend: kontrola HTTP na `/`
- Backend: kontrola HTTP na `/health`
- PostgreSQL: `pg_isready` check

### Docker v produkci s Nginx Proxy

Pro produkci doporučujeme použít reverse proxy (Nginx) pro SSL terminaci:

**nginx-proxy.conf:**
```nginx
server {
    listen 80;
    server_name apk-manager.tvoje-domena.cz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name apk-manager.tvoje-domena.cz;
    
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Pak přidej Nginx do `docker-compose.yml`:
```yaml
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - apk-network
```

---

## Klasická instalace (Bez Dockeru)

## Požadavky

### Systémové požadavky
- **Node.js**: verze 18 nebo vyšší
- **npm**: verze 9 nebo vyšší
- **Webový server**: Nginx, Apache nebo podobný
- **Databáze**: PostgreSQL 14+ (doporučeno) nebo MySQL 8+
- **Storage**: Přístup k souborovému systému pro APK soubory

### Síťové požadavky
- Port 80/443 pro HTTP/HTTPS provoz
- Přístup k databázi (port 5432 pro PostgreSQL)
- Přístup k souborovému systému s APK soubory

## Instalace

### 1. Klonování repositáře

```bash
git clone https://github.com/vase-repo/apk-manager.git
cd apk-manager
```

### 2. Instalace závislostí

```bash
npm install
```

### 3. Konfigurace aplikace

Vytvořte soubor `.env.local` v kořenovém adresáři projektu:

```env
# API konfigurace
VITE_API_BASE_URL=https://api.vase-domena.cz/api

# Souborový systém - cesty k APK souborům
APK_DIRECTORY=/data/apk/staging
PLATFORM_DEV=/data/apk/development
PLATFORM_RC=/data/apk/release-candidate
PLATFORM_PROD=/data/apk/production

# Nastavení kontroly publikací
CHECK_INTERVAL=60

# Databáze (pro backend)
DATABASE_URL=postgresql://user:password@localhost:5432/apk_manager

# Autentizace (pro backend)
JWT_SECRET=vase-tajny-klic-min-32-znaku
SESSION_SECRET=dalsi-tajny-klic-pro-sessions
```

### 4. Úprava konfigurace

Upravte soubor `src/config/app.config.ts` podle vašich potřeb:

- **API endpointy**: Změňte cesty k vašemu backend API
- **Storage cesty**: Nastavte správné cesty k APK souborům
- **Role a oprávnění**: Upravte podle vaší organizační struktury
- **UI nastavení**: Přizpůsobte dle preferencí

### 5. Build aplikace

```bash
npm run build
```

Výstupní soubory budou v adresáři `dist/`.

## Backend API

APK Manager vyžaduje backend API, které musíte implementovat. Níže je specifikace jednotlivých endpointů:

### APK Endpoints

#### GET /api/apk/list
Vrací seznam všech APK souborů.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "MyApp",
      "version": "2.4.1",
      "build": "241",
      "date": "2025-10-10T14:23:00Z",
      "size": "45.2 MB",
      "path": "/data/apk/staging/myapp-2.4.1.apk"
    }
  ]
}
```

#### GET /api/apk/metadata/:id
Vrací metadata konkrétního APK.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "MyApp",
    "packageName": "com.example.myapp",
    "version": "2.4.1",
    "versionCode": 241,
    "minSdk": 21,
    "targetSdk": 34,
    "permissions": ["INTERNET", "CAMERA"],
    "size": 47456789,
    "md5": "abc123...",
    "sha256": "def456..."
  }
}
```

### Publications Endpoints

#### GET /api/publications/list
Vrací seznam všech publikací.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "apkId": "uuid",
      "apkName": "MyApp",
      "version": "2.4.1",
      "platform": "production",
      "status": "published",
      "requestedBy": "Jan Novák",
      "requestedAt": "2025-10-10T15:30:00Z",
      "publishedBy": "Systém",
      "publishedAt": "2025-10-10T15:45:00Z"
    }
  ]
}
```

#### POST /api/publications/create
Vytvoří novou publikaci.

**Request:**
```json
{
  "apkId": "uuid",
  "platform": "production",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "createdAt": "2025-10-10T16:00:00Z"
  }
}
```

### Auth Endpoints

#### POST /api/auth/login
Přihlášení uživatele.

**Request:**
```json
{
  "username": "jan.novak",
  "password": "heslo"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "username": "jan.novak",
      "name": "Jan Novák",
      "role": "publisher"
    }
  }
}
```

## Publikační proces

Backend musí implementovat následující logiku:

1. **Vytvoření publikace**: Uživatel zadá požadavek na publikaci
2. **Kopírování APK**: Backend zkopíruje APK soubor do cílového adresáře platformy
3. **Kontrola statusu**: Pravidelně (podle CHECK_INTERVAL) kontroluje přítomnost souboru
4. **Aktualizace statusu**: Po úspěšném nalezení označí jako "published"

### Příklad implementace (Node.js/Express)

```javascript
const fs = require('fs').promises;
const path = require('path');

async function publishApk(publicationId, apkPath, platform) {
  const config = {
    development: '/data/apk/development',
    release_candidate: '/data/apk/release-candidate',
    production: '/data/apk/production'
  };
  
  const targetDir = config[platform];
  const fileName = path.basename(apkPath);
  const targetPath = path.join(targetDir, fileName);
  
  try {
    // Kopírování souboru
    await fs.copyFile(apkPath, targetPath);
    
    // Aktualizace statusu v databázi
    await db.publications.update({
      where: { id: publicationId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        publishedBy: 'Systém'
      }
    });
    
    return { success: true };
  } catch (error) {
    // Chyba při publikaci
    await db.publications.update({
      where: { id: publicationId },
      data: { status: 'failed' }
    });
    
    throw error;
  }
}
```

## Nastavení webového serveru

### Nginx konfigurace

```nginx
server {
    listen 80;
    server_name apk-manager.vase-domena.cz;
    
    # Přesměrování na HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name apk-manager.vase-domena.cz;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    root /var/www/apk-manager/dist;
    index index.html;
    
    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache statických souborů
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Databázové schéma

### Tabulka: users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabulka: apk_files
```sql
CREATE TABLE apk_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    version_code INTEGER NOT NULL,
    build VARCHAR(20),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    md5_hash VARCHAR(32),
    sha256_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_name, version_code)
);
```

### Tabulka: publications
```sql
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apk_id UUID REFERENCES apk_files(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_by UUID REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_by VARCHAR(100),
    published_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);
```

## Monitorování a údržba

### Logy
Doporučujeme logovat:
- Všechny publikační akce
- Chyby při zpracování APK
- Přihlášení uživatelů
- API requesty (pro audit)

### Backup
Pravidelně zálohujte:
- Databázi (denně)
- APK soubory (týdně)
- Konfigurační soubory

### Monitoring
Sledujte:
- Dostupnost aplikace
- Velikost souborového systému
- Databázové připojení
- API response times

## Troubleshooting

### Aplikace se nenačítá
- Zkontrolujte nginx logy: `sudo tail -f /var/log/nginx/error.log`
- Ověřte, že build proběhl úspěšně
- Zkontrolujte oprávnění k souborům v `/dist`

### API nefunguje
- Zkontrolujte, že backend běží: `sudo systemctl status apk-manager-api`
- Ověřte CORS nastavení
- Zkontrolujte připojení k databázi

### Publikace selháva
- Ověřte oprávnění k souborovému systému
- Zkontrolujte dostupné místo na disku
- Ověřte cesty v konfiguraci

## Podpora

Pro další pomoc kontaktujte svého systémového administrátora nebo se podívejte do dokumentace přímo v aplikaci (sekce Dokumentace).
