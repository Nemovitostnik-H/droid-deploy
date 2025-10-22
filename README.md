# 📱 APK Manager

> Systém pro správu a publikaci Android APK souborů napříč různými platformami (Development, Release Candidate, Production).

## 🏗️ Architektura

APK Manager je plně dockerizovaná aplikace postavená na standardních Docker images.

- **Frontend** (React + TypeScript) - `ghcr.io/nemovitostnik-h/droid-deploy:main`
- **Backend API** (Node.js + Express) - `ghcr.io/nemovitostnik-h/droid-deploy-backend:main`
- **Database** (PostgreSQL 16) - `postgres:16-alpine`

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

## ✨ Nové funkce v této verzi

### 🎛️ Administrátorské nastavení (v0.2.0)
- **Webové rozhraní pro konfiguraci** - administrátoři mohou přímo z UI upravit cesty k APK adresářům
- **Dynamická konfigurace** - změny se ukládají do databáze a lze je změnit bez restartu
- **Fallback na ENV** - pokud nastavení v databázi chybí, použijí se environment variables
- **Lepší parsing názvů APK** - podpora pro formáty: `AppName-v1.2.3.apk`, `AppName_1.2.3_Build.apk`

## 🚀 Rychlý start (Dockge)

### Požadavky

- Docker Engine 24.0+
- Dockge nebo Portainer (doporučeno)
- 2GB+ volného RAM

### Instalace (5 kroků)

```bash
# 1. Naklonuj repozitář
git clone https://github.com/Nemovitostnik-H/droid-deploy.git
cd droid-deploy

# 2. Vytvoř APK adresáře
mkdir -p /files/docker/apk-manager/{staging,development,release-candidate,production}
chmod -R 755 /files/docker/apk-manager

# 3. Zkopíruj .env.example a uprav hodnoty
cp .env.example .env
nano .env  # ZMĚŇ POSTGRES_PASSWORD, JWT_SECRET a APK_DATA_PATH

# 4. Deploy v Dockge
# - V Dockge vytvoř nový stack "apk-manager"
# - Zkopíruj obsah docker-compose.yml
# - Nastav environment variables z .env souboru
# - Klikni Deploy

# 5. Databáze se inicializuje automaticky při prvním startu
# Zkontroluj logy: docker-compose logs postgres
```

### První přihlášení

Otevři v prohlížeči: `http://your-server-ip:8580`

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ BEZPEČNOST:** Změň heslo okamžitě po prvním přihlášení!

### Konfigurace APK adresářů

Po přihlášení jako administrátor:
1. Klikni na tlačítko **"Nastavení"** v pravém horním rohu
2. Uprav cesty k adresářům podle potřeby
3. Ujisti se, že adresáře existují v Docker kontejneru
4. Klikni **"Uložit změny"**

**Výchozí nastavení:**
- Základní adresář: `/data/apk`
- Staging: `/data/apk/staging`
- Development: `/data/apk/development`
- Release Candidate: `/data/apk/release-candidate`
- Production: `/data/apk/production`

## 📖 Dokumentace

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Kompletní deployment guide (Portainer + Docker Compose)
- **[backend/README.md](./backend/README.md)** - API dokumentace a backend development
- **Frontend dokumentace** - Dostupná přímo v aplikaci po přihlášení

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **TanStack Query** - Data fetching

### Backend
- **Node.js 20+** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL 16** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Frontend web server
- **ts-node** - TypeScript runtime (backend)
- **GitHub Actions** - CI/CD (frontend build)

## 📁 Struktura projektu

```
droid-deploy/
├── src/                    # Frontend React aplikace
│   ├── components/        # UI komponenty
│   ├── pages/            # Stránky aplikace
│   ├── hooks/            # Custom React hooks
│   └── config/           # Konfigurace
├── backend/               # Backend Node.js API (TypeScript)
│   └── src/
│       ├── routes/       # API endpointy
│       ├── middleware/   # Auth middleware
│       └── db/           # Database schema a client
├── docker-compose.yml     # Orchestrace služeb (backend běží s ts-node)
├── .env.example          # Template pro environment variables
└── DEPLOYMENT.md         # Deployment průvodce
```

## 🔧 Development

### Frontend development

```bash
# Instalace dependencies
npm install

# Dev server s hot reload
npm run dev

# Build pro produkci
npm run build
```

### Backend development

```bash
cd backend

# Instalace dependencies
npm install

# Dev server s auto-restart
npm run dev

# Build
npm run build

# Produkční start
npm start
```

## 📊 Správa služeb

```bash
# Zobrazit status všech kontejnerů
docker-compose ps

# Sledovat logy
docker-compose logs -f

# Restart služby
docker-compose restart backend

# Stop všech služeb
docker-compose down

# Aktualizace z Git + restart
git pull && docker-compose down && docker-compose up -d
```

## 🔐 Bezpečnost

- **JWT authentication** s HS256
- **Bcrypt** password hashing (cost factor 10)
- **Rate limiting** (100 req/15min)
- **Helmet.js** security headers
- **CORS** konfigurace
- **PostgreSQL** s prepared statements

**KRITICKÉ pro produkci:**
1. Změň `POSTGRES_PASSWORD` na silné heslo (min 16 znaků)
2. Změň `JWT_SECRET` na náhodný secret (min 32 znaků)
3. Nastav `CORS_ORIGIN` na konkrétní doménu (ne `*`)
4. Používej HTTPS reverse proxy (Traefik/Caddy)
5. Pravidelně aktualizuj Docker images

## 🐛 Troubleshooting

### Kontejnery se nespustí

```bash
# Zkontroluj logy
docker-compose logs

# Restartuj všechny služby
docker-compose down && docker-compose up -d
```

### Backend nemůže přistoupit k APK souborům

```bash
# Zkontroluj oprávnění
ls -la /data/apk

# Oprav oprávnění
chmod -R 755 /data/apk
```

### Databáze se neinicializuje

```bash
# Resetuj databázi (POZOR: smaže data!)
docker-compose down -v
docker-compose up -d
```

## 🤝 Contributing

1. Fork repozitář
2. Vytvoř feature branch (`git checkout -b feature/amazing-feature`)
3. Commit změny (`git commit -m 'Add amazing feature'`)
4. Push do branch (`git push origin feature/amazing-feature`)
5. Otevři Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Nemovitostnik-H/droid-deploy/issues)
- **Dokumentace**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Docs**: [backend/README.md](./backend/README.md)

## 📄 License

MIT License - viz [LICENSE](./LICENSE) soubor pro detaily.

---

**Vytvořeno s ❤️ pro jednodušší správu Android APK souborů**
