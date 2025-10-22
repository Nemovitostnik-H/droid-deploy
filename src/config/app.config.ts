/**
 * Konfigurace aplikace APK Manager
 * 
 * Tento soubor obsahuje všechny cesty a nastavení, které je potřeba přizpůsobit
 * pro deployment do vlastního datacentra.
 */

export const appConfig = {
  // Základní informace o aplikaci
  app: {
    name: "APK Manager",
    version: "1.0.0",
    description: "Správa publikací Android aplikací",
  },

  // API endpointy - upravte podle vaší infrastruktury
  api: {
    // Základní URL vašeho API serveru
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
    
    // Endpointy pro jednotlivé operace
    endpoints: {
      // APK soubory
      apk: {
        list: "/apk/list",              // GET - seznam všech APK
        metadata: "/apk/metadata/:id",  // GET - metadata konkrétního APK
        upload: "/apk/upload",          // POST - upload nového APK
        delete: "/apk/delete/:id",      // DELETE - smazání APK
      },
      
      // Publikace
      publications: {
        list: "/publications/list",     // GET - seznam publikací
        create: "/publications/create", // POST - vytvoření nové publikace
        update: "/publications/update/:id", // PUT - aktualizace statusu
        history: "/publications/history/:apkId", // GET - historie pro APK
      },
      
      // Uživatelé a autentizace
      auth: {
        login: "/auth/login",           // POST - přihlášení
        logout: "/auth/logout",         // POST - odhlášení
        verify: "/auth/verify",         // GET - ověření session
        refresh: "/auth/refresh",       // POST - refresh tokenu
      },
      
      // Správa uživatelů (admin)
      users: {
        list: "/users/list",            // GET - seznam uživatelů
        create: "/users/create",        // POST - vytvoření uživatele
        update: "/users/update/:id",    // PUT - aktualizace uživatele
        delete: "/users/delete/:id",    // DELETE - smazání uživatele
        roles: "/users/roles/:id",      // PUT - změna rolí
      },
    },
  },

  // Nastavení souborového systému
  storage: {
    // Cesta ke sledovanému adresáři s APK soubory
    apkDirectory: process.env.APK_DIRECTORY || "/files/docker/apk-manager/staging",
    
    // Cesty k publikačním platformám
    platforms: {
      development: process.env.PLATFORM_DEV || "/files/docker/apk-manager/development",
      release_candidate: process.env.PLATFORM_RC || "/files/docker/apk-manager/release-candidate",
      production: process.env.PLATFORM_PROD || "/files/docker/apk-manager/production",
    },
    
    // Maximální velikost APK souboru (v MB)
    maxApkSize: 200,
  },

  // Nastavení kontroly publikací
  publication: {
    // Interval kontroly statusu publikací (v sekundách)
    checkInterval: parseInt(process.env.CHECK_INTERVAL || "60"),
    
    // Počet pokusů před označením jako "failed"
    maxRetries: 3,
    
    // Timeout pro publikaci (v minutách)
    publishTimeout: 30,
  },

  // Role a oprávnění
  roles: {
    admin: {
      name: "Admin",
      permissions: ["all"],
    },
    publisher: {
      name: "Publisher",
      permissions: ["publish", "view_all", "view_history"],
    },
    developer: {
      name: "Developer",
      permissions: ["publish_dev", "publish_rc", "view_all"],
    },
    viewer: {
      name: "Viewer",
      permissions: ["view_all", "view_history"],
    },
  },

  // Nastavení UI
  ui: {
    // Počet položek na stránku
    itemsPerPage: 20,
    
    // Formát data a času
    dateFormat: "DD.MM.YYYY HH:mm",
    
    // Automatické obnovení dat (v sekundách, 0 = vypnuto)
    autoRefreshInterval: 30,
  },
};

// Typ pro export
export type AppConfig = typeof appConfig;
