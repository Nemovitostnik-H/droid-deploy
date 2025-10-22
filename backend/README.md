# APK Manager Backend API

Node.js/Express backend pro APK Manager aplikaci.

## 🏗️ Stack

- **Node.js** 20+
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Databáze
- **JWT** - Autentizace
- **Bcrypt** - Password hashing

## 📋 API Endpoints

### Authentication

#### POST `/api/auth/login`
Přihlášení uživatele

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "username": "admin",
      "name": "Administrator",
      "role": "admin"
    }
  }
}
```

#### GET `/api/auth/me`
Získání informací o aktuálním uživateli

**Headers:**
```
Authorization: Bearer <token>
```

### APK Files

#### GET `/api/apk/list`
Seznam všech APK souborů

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "MyApp",
      "package_name": "com.example.myapp",
      "version": "2.4.1",
      "version_code": 241,
      "build": "241",
      "file_path": "/data/apk/staging/MyApp-v2.4.1-build241.apk",
      "file_size": 47453184,
      "created_at": "2025-10-10T14:23:00Z",
      "exists": true
    }
  ]
}
```

#### GET `/api/apk/metadata/:id`
Detailní metadata konkrétního APK

#### POST `/api/apk/scan`
Skenování APK adresáře a aktualizace databáze

### Publications

#### GET `/api/publications/list`
Seznam všech publikací

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "apk_id": "uuid",
      "platform": "production",
      "status": "published",
      "created_at": "2025-10-22T10:00:00Z",
      "published_at": "2025-10-22T10:00:05Z",
      "apk_name": "MyApp",
      "version": "2.4.1",
      "build": "241",
      "user_name": "Jan Novák"
    }
  ]
}
```

#### POST `/api/publications/create`
Vytvoření nové publikace (kopírování APK)

**Request:**
```json
{
  "apkId": "uuid",
  "platform": "production"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "targetPath": "/data/apk/production/MyApp-v2.4.1-build241.apk"
  }
}
```

#### GET `/api/publications/:id/status`
Kontrola stavu publikace

### Health Check

#### GET `/health`
Health check endpoint pro monitoring

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T12:00:00.000Z"
}
```

## 🔐 Autentizace

Všechny endpointy kromě `/health` a `/api/auth/login` vyžadují JWT token v Authorization headeru:

```
Authorization: Bearer <token>
```

Token expiruje po 24 hodinách (konfigurovatelné přes `JWT_EXPIRES_IN`).

## 🗄️ Databáze

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### APK Files
```sql
CREATE TABLE apk_files (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    version_code INTEGER NOT NULL,
    build VARCHAR(20),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    md5_hash VARCHAR(32),
    created_at TIMESTAMP,
    UNIQUE(package_name, version_code)
);
```

### Publications
```sql
CREATE TABLE publications (
    id UUID PRIMARY KEY,
    apk_id UUID REFERENCES apk_files(id),
    user_id UUID REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP,
    published_at TIMESTAMP,
    error_message TEXT
);
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run in production
npm start

# Migrate database
npm run db:migrate
```

## 🔧 Environment Variables

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=*
APK_DIRECTORY=/data/apk/staging
PLATFORM_DEV=/data/apk/development
PLATFORM_RC=/data/apk/release-candidate
PLATFORM_PROD=/data/apk/production
```

## 🔒 Bezpečnost

- **JWT**: HS256 algoritmus pro signing
- **Bcrypt**: Cost factor 10 pro password hashing
- **Rate Limiting**: 100 requests per 15 minut
- **Helmet**: HTTP security headers
- **CORS**: Konfigurovatelné CORS policy

## 📝 Error Responses

Všechny chyby vrací unified formát:

```json
{
  "success": false,
  "error": "Error message"
}
```

HTTP status kódy:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🐛 Debugging

```bash
# Logy v Dockeru
docker-compose logs -f backend

# Přístup do containeru
docker-compose exec backend sh

# Test API
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🤝 Contributing

1. Dodržuj TypeScript strict mode
2. Používej async/await místo callbacks
3. Všechny endpointy musí mít error handling
4. Přidej testy pro nové featury

## 📞 Support

Pro další pomoc viz hlavní [README.md](../README.md) nebo otevři issue na GitHubu.
