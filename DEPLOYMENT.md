# APK Manager - Deployment Guide

## 📦 Přehled

APK Manager je plně dockerizovaná aplikace připravená pro deployment pomocí **Dockge**, **Portainer** nebo klasického **Docker Compose**.

## 🏗️ Architektura

APK Manager se skládá ze 3 Docker kontejnerů:
- **Frontend** (`ghcr.io/nemovitostnik-h/droid-deploy:main`) - React aplikace na portu 8580
- **Backend** (buildováno z GitHub repozitáře) - Node.js/Express API na portu 3000
- **Database** (`postgres:16-alpine`) - PostgreSQL databáze na portu 5432

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│  Frontend   │─────▶│  Backend    │─────▶│  PostgreSQL  │
│  (port 8580)│      │  (port 3000)│      │  (port 5432) │
└─────────────┘      └─────────────┘      └──────────────┘
       │                    │
       │                    ▼
       │             ┌──────────────┐
       └────────────▶│  File System │
                     │  /data/apk/* │
                     └──────────────┘
```

**Frontend běží z předpřipraveného Docker image, backend se builduje on-the-fly z GitHub repozitáře** - není potřeba lokální klonování!

---

## 🚀 Dockge Deployment (Doporučeno)

### Proč Dockge?
- ✅ **Žádné klonování** - jen zkopíruj docker-compose.yml
- ✅ **Grafické UI** - jednoduché ovládání kontejnerů
- ✅ **Automatické updaty** - pull nové image verze jedním klikem
- ✅ **Integrace s Nginx Proxy Manager** - sdílená síť mediaservarr

### Krok 1: Vytvoř APK adresáře

Na tvém hostitelském serveru vytvoř strukturu pro APK soubory:

```bash
mkdir -p /home/jelly/docker/apk-manager/{staging,development,release-candidate,production}
chmod -R 755 /home/jelly/docker/apk-manager
```

### Krok 2: Zkopíruj docker-compose.yml do Dockge

V Dockge rozhraní:
1. Klikni na **+ New**
2. Pojmenuj stack: `apk-manager`
3. Do editoru vlož tento `docker-compose.yml`:

```yaml
version: "3.8"

services:
  # Frontend - React aplikace
  frontend:
    image: "ghcr.io/nemovitostnik-h/droid-deploy:main"
    container_name: apk-manager-frontend
    restart: unless-stopped
    depends_on:
      - backend
      - postgres
    ports:
      - "${APP_PORT:-8580}:80"
    environment:
      - VITE_API_BASE_URL=${API_BASE_URL:-http://apk-manager-backend:3000/api}
      - TZ=${TZ:-Europe/Prague}
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3
    networks:
      - apk-network
      - mediaservarr

  # Backend - Node.js API
  backend:
    build:
      context: https://github.com/nemovitostnik-h/droid-deploy.git#main
      dockerfile: backend/Dockerfile
    container_name: apk-manager-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${API_PORT:-3000}:3000"
    volumes:
      - ${APK_DATA_PATH:-./data/apk}:/data/apk
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://${POSTGRES_USER:-apkmanager}:${POSTGRES_PASSWORD:-apkmanager}@apk-manager-db:5432/${POSTGRES_DB:-apkmanager}
      - JWT_SECRET=${JWT_SECRET:-change-this-secret-in-production}
      - JWT_EXPIRES_IN=24h
      - CORS_ORIGIN=*
      - APK_DIRECTORY=/data/apk/staging
      - PLATFORM_DEV=/data/apk/development
      - PLATFORM_RC=/data/apk/release-candidate
      - PLATFORM_PROD=/data/apk/production
      - TZ=${TZ:-Europe/Prague}
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3
    networks:
      - apk-network
      - mediaservarr

  # Database - PostgreSQL
  postgres:
    image: postgres:16-alpine
    container_name: apk-manager-db
    restart: unless-stopped
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-apkmanager}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-apkmanager}
      - POSTGRES_DB=${POSTGRES_DB:-apkmanager}
      - TZ=${TZ:-Europe/Prague}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-apkmanager}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - apk-network

volumes:
  postgres-data:
    driver: local

networks:
  apk-network:
    driver: bridge
  mediaservarr:
    external: true
```

### Krok 3: Nastav Environment Variables

V Dockge rozhraní, v sekci **Environment Variables**, přidej:

```env
APP_PORT=8580
API_PORT=3000
API_BASE_URL=http://your-server-ip:3000/api
APK_DATA_PATH=/home/jelly/docker/apk-manager
POSTGRES_USER=apkmanager
POSTGRES_PASSWORD=ZMĚŇ-TOTO-HESLO-NA-SILNÉ
POSTGRES_DB=apkmanager
POSTGRES_PORT=5432
JWT_SECRET=ZMĚŇ-TOTO-NA-NÁHODNÝ-SECRET-MIN-32-ZNAKŮ
TZ=Europe/Prague
```

**⚠️ KRITICKÉ BEZPEČNOSTNÍ NASTAVENÍ:**
- `POSTGRES_PASSWORD` - Změň na silné heslo (min 16 znaků)
- `JWT_SECRET` - Změň na náhodný secret (min 32 znaků, použij např. `openssl rand -hex 32`)
- `API_BASE_URL` - Změň `your-server-ip` na IP adresu tvého serveru, nebo použij Nginx Proxy Manager URL

### Krok 4: Inicializuj databázi

⚠️ **DŮLEŽITÉ:** První spuštění vyžaduje manuální inicializaci databáze:

```bash
# 1. Stáhni schema.sql
wget https://raw.githubusercontent.com/Nemovitostnik-H/droid-deploy/main/backend/src/db/schema.sql

# 2. Po startu stacku (po cca 10 sekundách) spusť inicializaci
docker exec -i apk-manager-db psql -U apkmanager -d apkmanager < schema.sql

# 3. Ověř že se vytvořily tabulky
docker exec apk-manager-db psql -U apkmanager -d apkmanager -c "\dt"
```

### Krok 5: Deploy!

Klikni na **Deploy** v Dockge.

První deploy může trvat 3-5 minut, protože backend se builduje z GitHub repozitáře. Následné starty jsou rychlejší.

### Krok 6: První přihlášení

Otevři v prohlížeči: `http://your-server-ip:8580`

**Výchozí credentials:**
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ OKAMŽITĚ změň heslo po prvním přihlášení!**

### Krok 7: Nginx Proxy Manager (Volitelné)

Pokud chceš mít aplikaci dostupnou přes doménu s SSL:

1. V Nginx Proxy Manager vytvoř nový **Proxy Host**:
   - **Domain Names**: `apk-manager.tvoje-domena.cz`
   - **Scheme**: `http`
   - **Forward Hostname**: `apk-manager-frontend` (Docker DNS)
   - **Forward Port**: `80`
   - **SSL**: Zapni Let's Encrypt

2. Aktualizuj `.env` v Dockge:
   ```env
   API_BASE_URL=https://apk-manager.tvoje-domena.cz/api
   ```

3. Restart stacku v Dockge

---

## 🔄 Správa a údržba

### Aktualizace na novou verzi

V Dockge:
1. Klikni na stack **apk-manager**
2. Klikni na **Pull** (stáhne nové image)
3. Klikni na **Restart**

Nebo příkazem:
```bash
docker-compose pull
docker-compose up -d
```

### Monitoring

```bash
# Zobrazit logy všech služeb
docker-compose logs -f

# Logy konkrétní služby
docker-compose logs -f backend

# Status kontejnerů
docker-compose ps
```

### Backup databáze

```bash
# Vytvoř backup
docker exec apk-manager-db pg_dump -U apkmanager apkmanager > backup-$(date +%Y%m%d).sql

# Restore z backupu
docker exec -i apk-manager-db psql -U apkmanager apkmanager < backup-20251022.sql
```

### Restart služeb

```bash
# Restart všech služeb
docker-compose restart

# Restart konkrétní služby
docker-compose restart backend
```

---

## 🐳 Portainer Deployment (Alternativa)

Pokud používáš Portainer místo Dockge:

1. V Portaineru jdi na **Stacks** → **Add stack**
2. Pojmenuj stack: `apk-manager`
3. Zvol **Web editor** a vlož stejný `docker-compose.yml` jako výše
4. V sekci **Environment variables** přidej stejné proměnné jako v Dockge kroku 3
5. Klikni **Deploy the stack**
6. Proveď inicializaci databáze (viz Dockge Krok 4)

---

## 🛠️ Docker Compose (CLI)

Pro pokročilé uživatele - přímé použití Docker Compose CLI:

```bash
# 1. Vytvoř pracovní adresář
mkdir ~/apk-manager && cd ~/apk-manager

# 2. Stáhni docker-compose.yml
wget https://raw.githubusercontent.com/Nemovitostnik-H/droid-deploy/main/docker-compose.yml

# 3. Vytvoř .env soubor
wget https://raw.githubusercontent.com/Nemovitostnik-H/droid-deploy/main/.env.example -O .env
nano .env  # Uprav hodnoty (POSTGRES_PASSWORD, JWT_SECRET, atd.)

# 4. Vytvoř APK adresáře
mkdir -p /home/jelly/docker/apk-manager/{staging,development,release-candidate,production}

# 5. Spusť stack
docker-compose up -d

# 6. Inicializuj databázi
wget https://raw.githubusercontent.com/Nemovitostnik-H/droid-deploy/main/backend/src/db/schema.sql
docker exec -i apk-manager-db psql -U apkmanager -d apkmanager < schema.sql

# 7. Ověř že běží
docker-compose ps
```

---

## 🔐 Bezpečnost v produkci

### Minimální požadavky:

1. **Silné heslo databáze** (min 16 znaků):
   ```bash
   POSTGRES_PASSWORD=$(openssl rand -base64 24)
   ```

2. **Náhodný JWT secret** (min 32 znaků):
   ```bash
   JWT_SECRET=$(openssl rand -hex 32)
   ```

3. **CORS nastavení** - změň v backendu:
   ```env
   CORS_ORIGIN=https://apk-manager.tvoje-domena.cz
   ```

4. **HTTPS** - vždy používej SSL (přes Nginx Proxy Manager)

5. **Firewall** - uzavři porty 3000 a 5432 z internetu (přístup jen přes nginx)

6. **Pravidelné aktualizace**:
   ```bash
   docker-compose pull && docker-compose up -d
   ```

---

## 🐛 Troubleshooting

### Backend kontejner se nespustí při buildu

**Problém:** Build failuje s chybou při stahování z GitHub

**Řešení 1:** Zkontroluj internetové připojení Dockeru a přístup k GitHub:
```bash
docker run --rm alpine ping -c 3 github.com
```

**Řešení 2:** Zkus manuální build:
```bash
docker build -t apk-manager-backend https://github.com/nemovitostnik-h/droid-deploy.git#main:backend
```

### Databáze není inicializovaná

**Problém:** Frontend hlásí connection errors, backend loguje "relation 'users' does not exist"

**Řešení:** Databáze musí být manuálně inicializována po prvním startu:
```bash
wget https://raw.githubusercontent.com/Nemovitostnik-H/droid-deploy/main/backend/src/db/schema.sql
docker exec -i apk-manager-db psql -U apkmanager -d apkmanager < schema.sql
```

### Frontend nemůže kontaktovat backend

**Problém:** API calls failují s network errors

**Řešení 1 - Zkontroluj API_BASE_URL:**
- V `.env` musí být IP adresa serveru (ne localhost): `API_BASE_URL=http://192.168.1.100:3000/api`
- Nebo použij Nginx Proxy Manager: `API_BASE_URL=https://apk-manager.domain.cz/api`

**Řešení 2 - Zkontroluj že backend běží:**
```bash
curl http://localhost:3000/health
# Mělo by vrátit: {"status":"ok","timestamp":"..."}
```

### Permission denied na APK souborech

**Problém:** Backend nemůže číst/zapisovat APK soubory

**Řešení:**
```bash
chmod -R 755 /home/jelly/docker/apk-manager
chown -R 1000:1000 /home/jelly/docker/apk-manager  # node user v kontejneru
```

### Network "mediaservarr" not found

**Problém:** Stack se nespustí s chybou že síť neexistuje

**Řešení:** Buď vytvoř síť, nebo odstraň z docker-compose.yml:
```bash
# Vytvoř síť
docker network create mediaservarr

# Nebo odstraň z docker-compose.yml:
# networks:
#   mediaservarr:
#     external: true
```

---

## 📚 API Dokumentace

Pro detaily o backend API endpointech viz [backend/README.md](./backend/README.md)

Hlavní endpointy:
- `GET /api/apk/list` - Seznam APK souborů
- `GET /api/publications/list` - Historie publikací
- `POST /api/publications/create` - Nová publikace
- `POST /api/auth/login` - Přihlášení uživatele

---

## 🤝 Support

- **GitHub Issues**: [https://github.com/Nemovitostnik-H/droid-deploy/issues](https://github.com/Nemovitostnik-H/droid-deploy/issues)
- **Docker Images**: 
  - Frontend: `ghcr.io/nemovitostnik-h/droid-deploy:main`
  - Backend: builduje se z `https://github.com/nemovitostnik-h/droid-deploy.git#main`

---

**Vytvořeno pro snadný deployment s Dockge a Nginx Proxy Manager** 🐳
