import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Book, Server, Settings, Shield, FileCode, Database } from "lucide-react";

const Documentation = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Book className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dokumentace</h1>
              <p className="text-muted-foreground">
                Kompletní příručka pro konfiguraci a deployment APK Manageru
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Přehled</TabsTrigger>
            <TabsTrigger value="config">Konfigurace</TabsTrigger>
            <TabsTrigger value="api">API Specifikace</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="database">Databáze</TabsTrigger>
          </TabsList>

          {/* Přehled */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 border-border">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Architektura aplikace</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground mb-4">
                  APK Manager je webová aplikace postavená na moderních technologiích pro správu
                  a publikaci Android APK souborů.
                </p>

                <div className="grid md:grid-cols-3 gap-4 my-6">
                  <Card className="p-4 border-border bg-muted/50">
                    <FileCode className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-bold text-foreground mb-2">Frontend</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>React 18</li>
                      <li>TypeScript</li>
                      <li>Tailwind CSS</li>
                      <li>Vite</li>
                    </ul>
                  </Card>

                  <Card className="p-4 border-border bg-muted/50">
                    <Server className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-bold text-foreground mb-2">Backend (vyžadováno)</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>REST API</li>
                      <li>Autentizace (JWT)</li>
                      <li>Souborový systém</li>
                      <li>Kontrola publikací</li>
                    </ul>
                  </Card>

                  <Card className="p-4 border-border bg-muted/50">
                    <Database className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-bold text-foreground mb-2">Databáze</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>PostgreSQL 14+</li>
                      <li>MySQL 8+</li>
                      <li>nebo jiná SQL DB</li>
                    </ul>
                  </Card>
                </div>

                <h3 className="text-xl font-bold mt-6 mb-3 text-foreground">Workflow publikace</h3>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Uživatel vybere APK soubor a cílovou platformu</li>
                  <li>2. Systém vytvoří záznam publikace se statusem "pending"</li>
                  <li>3. Backend zkopíruje APK do cílového adresáře</li>
                  <li>4. Pravidelná kontrola ověřuje přítomnost souboru</li>
                  <li>5. Po potvrzení se status změní na "published"</li>
                </ol>
              </div>
            </Card>
          </TabsContent>

          {/* Konfigurace */}
          <TabsContent value="config" className="space-y-6">
            <Card className="p-6 border-border">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Konfigurační soubor</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                Všechna nastavení najdete v souboru{" "}
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  src/config/app.config.ts
                </code>
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">API Endpointy</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`api: {
  baseUrl: "http://localhost:3000/api",
  endpoints: {
    apk: {
      list: "/apk/list",
      metadata: "/apk/metadata/:id",
    },
    publications: {
      list: "/publications/list",
      create: "/publications/create",
    }
  }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Storage cesty</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`storage: {
  apkDirectory: "/data/apk/staging",
  platforms: {
    development: "/data/apk/development",
    release_candidate: "/data/apk/release-candidate",
    production: "/data/apk/production"
  }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Environment proměnné</h3>
                  <p className="text-muted-foreground mb-2">
                    Vytvořte soubor <code className="bg-muted px-2 py-1 rounded text-sm">.env.local</code>:
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`VITE_API_BASE_URL=https://api.vase-domena.cz/api
APK_DIRECTORY=/data/apk/staging
PLATFORM_DEV=/data/apk/development
PLATFORM_RC=/data/apk/release-candidate
PLATFORM_PROD=/data/apk/production
CHECK_INTERVAL=60`}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* API Specifikace */}
          <TabsContent value="api" className="space-y-6">
            <Card className="p-6 border-border">
              <h2 className="text-2xl font-bold mb-4 text-foreground">REST API Specifikace</h2>
              <p className="text-muted-foreground mb-6">
                Backend musí implementovat následující endpointy:
              </p>

              <div className="space-y-6">
                {/* APK Endpoints */}
                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                    APK Endpointy
                    <Badge variant="outline">GET/POST/DELETE</Badge>
                  </h3>

                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-success text-success-foreground">GET</Badge>
                        <code className="text-sm">/api/apk/list</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Seznam všech APK souborů ze sledovaného adresáře
                      </p>
                      <div className="bg-muted/50 p-3 rounded text-xs">
                        <pre className="text-muted-foreground overflow-x-auto">
{`Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "MyApp",
      "version": "2.4.1",
      "build": "241",
      "date": "2025-10-10T14:23:00Z",
      "size": "45.2 MB"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-success text-success-foreground">GET</Badge>
                        <code className="text-sm">/api/apk/metadata/:id</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Detailní metadata konkrétního APK souboru
                      </p>
                    </div>
                  </div>
                </div>

                {/* Publications Endpoints */}
                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                    Publikační Endpointy
                    <Badge variant="outline">GET/POST/PUT</Badge>
                  </h3>

                  <div className="space-y-4">
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-secondary text-secondary-foreground">POST</Badge>
                        <code className="text-sm">/api/publications/create</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Vytvoření nové publikace
                      </p>
                      <div className="bg-muted/50 p-3 rounded text-xs">
                        <pre className="text-muted-foreground overflow-x-auto">
{`Request: {
  "apkId": "uuid",
  "platform": "production",
  "userId": "uuid"
}

Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending"
  }
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-success text-success-foreground">GET</Badge>
                        <code className="text-sm">/api/publications/list</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Seznam všech publikací s jejich statusy
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auth Endpoints */}
                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground flex items-center gap-2">
                    Autentizační Endpointy
                    <Badge variant="outline">POST/GET</Badge>
                  </h3>

                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-secondary text-secondary-foreground">POST</Badge>
                      <code className="text-sm">/api/auth/login</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Přihlášení uživatele s JWT tokenem
                    </p>
                    <div className="bg-muted/50 p-3 rounded text-xs">
                      <pre className="text-muted-foreground overflow-x-auto">
{`Request: {
  "username": "jan.novak",
  "password": "heslo"
}

Response: {
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "name": "Jan Novák",
      "role": "publisher"
    }
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Deployment */}
          <TabsContent value="deployment" className="space-y-6">
            <Card className="p-6 border-border">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Deployment do datacentra</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">1. Klonování repositáře</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground">
{`git clone https://github.com/vase-repo/apk-manager.git
cd apk-manager
npm install`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">2. Konfigurace</h3>
                  <p className="text-muted-foreground mb-2">
                    Upravte soubory:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-3">
                    <li><code className="bg-muted px-2 py-1 rounded text-sm">src/config/app.config.ts</code> - aplikační nastavení</li>
                    <li><code className="bg-muted px-2 py-1 rounded text-sm">.env.local</code> - environment proměnné</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">3. Build</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground">
{`npm run build`}
                    </pre>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Výstup bude v adresáři <code className="bg-muted px-2 py-1 rounded">dist/</code>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">4. Nginx konfigurace</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`server {
    listen 443 ssl http2;
    server_name apk-manager.vase-domena.cz;
    
    root /var/www/apk-manager/dist;
    index index.html;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">5. Spuštění</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground">
{`sudo systemctl restart nginx
sudo systemctl enable nginx`}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Databáze */}
          <TabsContent value="database" className="space-y-6">
            <Card className="p-6 border-border">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Databázové schéma</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Tabulka: users</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Tabulka: apk_files</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`CREATE TABLE apk_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    version_code INTEGER NOT NULL,
    build VARCHAR(20),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    md5_hash VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(package_name, version_code)
);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Tabulka: publications</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`CREATE TABLE publications (
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
);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2 text-foreground flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Role a oprávnění
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 border-border bg-muted/50">
                      <h4 className="font-bold mb-2">Admin</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Vše</li>
                        <li>✓ Správa uživatelů</li>
                        <li>✓ Publikace na všechny platformy</li>
                      </ul>
                    </Card>
                    <Card className="p-4 border-border bg-muted/50">
                      <h4 className="font-bold mb-2">Publisher</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Publikace na všechny platformy</li>
                        <li>✓ Zobrazení historie</li>
                      </ul>
                    </Card>
                    <Card className="p-4 border-border bg-muted/50">
                      <h4 className="font-bold mb-2">Developer</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Publikace na Dev & RC</li>
                        <li>✓ Zobrazení všech APK</li>
                      </ul>
                    </Card>
                    <Card className="p-4 border-border bg-muted/50">
                      <h4 className="font-bold mb-2">Viewer</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Pouze čtení</li>
                        <li>✓ Zobrazení historie</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Documentation;
