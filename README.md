# 📱 APK Manager

> Systém pro správu a publikaci Android APK souborů napříč různými platformami (Development, Release Candidate, Production).

## 🏗️ Architektura

APK Manager je moderní webová aplikace postavená na React frontendu s Supabase backendem.

- **Frontend** (React + TypeScript) - `ghcr.io/nemovitostnik-h/droid-deploy:main`
- **Backend** - Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment** - Docker kontejner připojený k existujícímu Supabase stacku

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (http://localhost:3000)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  APK Manager Frontend (Docker Container)                    │
│  - React 18 + TypeScript                                    │
│  - TailwindCSS + shadcn/ui                                  │
│  - Port: 3000                                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Stack (tvůj existující nebo vlastní)             │
│  - Kong API Gateway (port 8000)                             │
│  - PostgreSQL Database                                       │
│  - GoTrue Auth (autentizace)                                │
│  - Storage API (APK soubory)                                │
│  - Edge Functions (publikování)                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Rychlý start

### Požadavky

- Docker a Docker Compose nainstalované
- Běžící Supabase stack (nebo použij `docker-compose.supabase.yml` pro kompletní setup)
- 2GB+ volného RAM

### Instalace (3 kroky)

```bash
# 1. Naklonuj repozitář
git clone https://github.com/Nemovitostnik-H/droid-deploy.git
cd droid-deploy

# 2. Zkopíruj .env.example a uprav hodnoty
cp .env.example .env
nano .env  # Vyplň VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY

# 3. Spusť setup script (aplikuje migrations)
./scripts/setup.sh

# 4. Spusť Docker container
docker compose up -d
```

### První přihlášení

Otevři v prohlížeči: `http://localhost:3000`

- **Email**: `admin@apkmanager.local`
- **Password**: `admin123`

**⚠️ BEZPEČNOST:** Změň heslo okamžitě po prvním přihlášení!

## 📖 Dokumentace

- **[SETUP.md](./SETUP.md)** - Kompletní setup guide pro self-hosted Supabase
- **[scripts/setup.sh](./scripts/setup.sh)** - Automatický setup script pro migrations

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching
- **Supabase JS Client** - Backend komunikace

### Backend (Supabase)
- **PostgreSQL** - Database s Row Level Security
- **GoTrue** - Autentizace uživatelů
- **Storage API** - Správa APK souborů
- **Edge Functions** - Serverless funkce pro publikování
- **PostgREST** - Automatické REST API

### Infrastructure
- **Docker** - Kontejnerizace
- **Nginx** - Frontend web server
- **Kong API Gateway** - API routing (Supabase)
- **GitHub Actions** - CI/CD (automatický build)

## 📁 Struktura projektu

```
droid-deploy/
├── .github/workflows/
│   └── docker-build.yml       # CI/CD - automatický build Docker image
├── migrations/                # Database migrations
│   ├── 00000000000000_initial_schema.sql
│   ├── 00000000000001_storage_setup.sql
│   └── 00000000000002_seed_data.sql
├── supabase/
│   ├── config.toml           # Supabase konfigurace
│   ├── config/kong.yml       # Kong API Gateway config
│   └── functions/
│       └── publish-apk/      # Edge function pro publikaci APK
├── scripts/
│   ├── setup.sh              # Setup script (migrations + admin user)
│   └── generate-jwt-keys.sh  # Generování JWT klíčů
├── src/                       # Frontend React aplikace
│   ├── components/           # UI komponenty
│   ├── contexts/             # React contexts (Auth)
│   ├── pages/                # Stránky aplikace
│   ├── hooks/                # Custom React hooks
│   ├── config/               # Konfigurace
│   └── lib/                  # Utility knihovny
├── docker-compose.yml         # Frontend deployment
├── docker-compose.supabase.yml # Kompletní Supabase stack
├── Dockerfile                 # Frontend build
├── .env.example              # Environment variables template
├── README.md                  # Tato dokumentace
└── SETUP.md                   # Setup guide
```

## 🔧 Development

### Frontend development

```bash
# Instalace dependencies
npm install

# Nastav .env pro development
cp .env.example .env
# Vyplň VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY

# Dev server s hot reload
npm run dev

# Build pro produkci
npm run build

# Preview produkčního buildu
npm run preview
```

### Database migrations

```bash
# Aplikuj všechny migrations
./scripts/setup.sh

# Nebo manuálně přes psql (pokud máš Supabase lokálně)
docker exec -it supabase-db psql -U postgres -d postgres < migrations/00000000000000_initial_schema.sql
```

## 📊 Správa aplikace

```bash
# Zobrazit status kontejneru
docker compose ps

# Sledovat logy
docker compose logs -f apk-manager-frontend

# Restart služby
docker compose restart

# Stop služby
docker compose down

# Aktualizace z Git + restart
git pull && docker compose down && docker compose up -d

# Stáhnout nový Docker image
docker compose pull
```

## 🔐 Bezpečnost

- **JWT authentication** - Supabase GoTrue
- **Row Level Security (RLS)** - Bezpečnostní pravidla na úrovni databáze
- **Storage policies** - Kontrola přístupu k APK souborům
- **HTTPS** - Doporučeno pro produkci
- **Environment variables** - Citlivé údaje oddělené od kódu

**KRITICKÉ pro produkci:**
1. Změň admin heslo po prvním přihlášení
2. Používej silný `POSTGRES_PASSWORD` (min 16 znaků)
3. Používej silný `JWT_SECRET` (min 32 znaků)
4. Nastav `VITE_SUPABASE_URL` na HTTPS URL
5. Používej reverse proxy (Nginx Proxy Manager, Traefik)
6. Pravidelně aktualizuj Docker images

## 🐛 Troubleshooting

### Frontend se nespustí

```bash
# Zkontroluj logy
docker compose logs apk-manager-frontend

# Zkontroluj .env
cat .env

# Zkontroluj síť
docker network ls
docker network inspect supabase_default
```

### Cannot connect to Supabase

**Problém**: Frontend nemůže kontaktovat Supabase API

**Řešení**:
1. Zkontroluj že Supabase běží: `curl http://localhost:8000/`
2. Zkontroluj `VITE_SUPABASE_URL` v `.env`
3. Pro Docker network použij: `VITE_SUPABASE_URL=http://supabase-kong:8000`
4. Pro localhost použij: `VITE_SUPABASE_URL=http://localhost:8000`

### Login nefunguje

**Problém**: Admin user nemá přiřazenou roli

**Řešení**:
```sql
-- V Supabase Studio → SQL Editor
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@apkmanager.local'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Migrations se neaplikují

**Problém**: setup.sh selhává

**Řešení**:
```bash
# Zkontroluj že máš vyplněný POSTGRES_PASSWORD v .env
cat .env | grep POSTGRES_PASSWORD

# Zkontroluj že Supabase DB běží
docker ps | grep supabase-db

# Spusť migrations manuálně
docker exec -i supabase-db psql -U postgres -d postgres < migrations/00000000000000_initial_schema.sql
```

## 🤝 Contributing

1. Fork repozitář
2. Vytvoř feature branch (`git checkout -b feature/amazing-feature`)
3. Commit změny (`git commit -m 'Add amazing feature'`)
4. Push do branch (`git push origin feature/amazing-feature`)
5. Otevři Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Nemovitostnik-H/droid-deploy/issues)
- **Dokumentace**: [SETUP.md](./SETUP.md)
- **Setup Script**: [scripts/setup.sh](./scripts/setup.sh)

## 📄 License

MIT License - viz [LICENSE](./LICENSE) soubor pro detaily.

---

**Vytvořeno s ❤️ pro jednodušší správu Android APK souborů**
