# 📱 APK Manager

> Systém pro správu a publikaci Android APK souborů napříč různými platformami (Development, Release Candidate, Production).

## 🏗️ Architektura

APK Manager je full-stack aplikace postavená na Docker Compose s těmito službami:

- **Frontend** (React + TypeScript) - Moderní UI pro správu APK souborů
- **Backend API** (Node.js + Express) - RESTful API pro business logiku
- **Database** (PostgreSQL 16) - Persistence dat (uživatelé, APK metadata, publikace)

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

## 🚀 Rychlý start

### Požadavky

- Docker Engine 24.0+
- Docker Compose 2.0+
- 2GB+ volného RAM
- Přístup k adresáři pro APK soubory

### Instalace (3 kroky)

```bash
# 1. Klonuj repozitář
git clone https://github.com/Nemovitostnik-H/droid-deploy.git
cd droid-deploy

# 2. Nastav environment variables
cp .env.example .env
nano .env  # ZMĚŇ: POSTGRES_PASSWORD, JWT_SECRET, APK_DATA_PATH

# 3. Spusť aplikaci
docker-compose up -d
```

### První přihlášení

Aplikace vytvoří výchozí admin účet:

- **URL**: `http://localhost:8580`
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ BEZPEČNOST:** Změň heslo okamžitě po prvním přihlášení!

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
- **GitHub Actions** - CI/CD (optional)

## 📁 Struktura projektu

```
droid-deploy/
├── src/                    # Frontend React aplikace
│   ├── components/        # UI komponenty
│   ├── pages/            # Stránky aplikace
│   ├── hooks/            # Custom React hooks
│   └── config/           # Konfigurace
├── backend/               # Backend Node.js API
│   └── src/
│       ├── routes/       # API endpointy
│       ├── middleware/   # Auth middleware
│       └── db/           # Database schema a client
├── docker-compose.yml     # Orchestrace služeb
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
git pull && docker-compose up -d --build
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
