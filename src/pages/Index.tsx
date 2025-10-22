import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ApkTable } from "@/components/ApkTable";
import { PublicationTable } from "@/components/PublicationTable";
import { PublishDialog } from "@/components/PublishDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Scan } from "lucide-react";
import { toast } from "sonner";
import { apkApi, publicationApi, ApkFile, Publication } from "@/services/api";

interface ApkTableItem {
  id: string;
  name: string;
  version: string;
  build: string;
  date: string;
  size: string;
}

interface PublicationTableItem {
  id: string;
  apkName: string;
  version: string;
  platform: 'development' | 'release_candidate' | 'production';
  status: 'pending' | 'published' | 'failed';
  requestedBy: string;
  requestedAt: string;
  publishedBy?: string;
  publishedAt?: string;
}

const Index = () => {
  const [selectedApk, setSelectedApk] = useState<ApkTableItem | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [apkFiles, setApkFiles] = useState<ApkTableItem[]>([]);
  const [publications, setPublications] = useState<PublicationTableItem[]>([]);
  const [isLoadingApks, setIsLoadingApks] = useState(false);
  const [isLoadingPublications, setIsLoadingPublications] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Load APKs
  const loadApks = async () => {
    setIsLoadingApks(true);
    try {
      const response = await apkApi.list();
      if (response.success) {
        const mapped = response.apks.map((apk: ApkFile) => ({
          id: apk.id.toString(),
          name: apk.name,
          version: apk.version,
          build: apk.version_code.toString(),
          date: new Date(apk.created_at).toLocaleString('cs-CZ'),
          size: `${(apk.file_size / 1024 / 1024).toFixed(1)} MB`,
        }));
        setApkFiles(mapped);
      }
    } catch (error: any) {
      toast.error("Chyba při načítání APK", {
        description: error.message,
      });
    } finally {
      setIsLoadingApks(false);
    }
  };

  // Load publications
  const loadPublications = async () => {
    setIsLoadingPublications(true);
    try {
      const response = await publicationApi.list();
      if (response.success) {
        const mapped = response.publications.map((pub: Publication) => ({
          id: pub.id.toString(),
          apkName: pub.apk_name || 'Unknown',
          version: pub.version || 'N/A',
          platform: pub.platform,
          status: pub.status,
          requestedBy: pub.requested_by_name || `User #${pub.requested_by}`,
          requestedAt: new Date(pub.requested_at).toLocaleString('cs-CZ'),
          publishedBy: pub.published_at ? 'Systém' : undefined,
          publishedAt: pub.published_at ? new Date(pub.published_at).toLocaleString('cs-CZ') : undefined,
        }));
        setPublications(mapped);
      }
    } catch (error: any) {
      toast.error("Chyba při načítání publikací", {
        description: error.message,
      });
    } finally {
      setIsLoadingPublications(false);
    }
  };

  // Scan APK directory
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const response = await apkApi.scan();
      if (response.success) {
        toast.success("Skenování dokončeno", {
          description: `Naskenováno: ${response.scanned}, Přidáno: ${response.added}, Přeskočeno: ${response.skipped}`,
        });
        await loadApks();
      }
    } catch (error: any) {
      toast.error("Chyba při skenování", {
        description: error.message,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Initial scan and load
  useEffect(() => {
    // Initial scan and load data
    const initialLoad = async () => {
      await handleScan();
      await loadPublications();
    };
    initialLoad();

    // Set up auto-scan every 60 seconds
    const interval = setInterval(async () => {
      await handleScan();
      await loadPublications();
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const handlePublish = (apk: ApkTableItem) => {
    setSelectedApk(apk);
    setPublishDialogOpen(true);
  };

  const handleConfirmPublish = async (platform: string) => {
    if (!selectedApk) return;

    try {
      const response = await publicationApi.create(parseInt(selectedApk.id), platform);
      if (response.success) {
        toast.success("Publikace zadána", {
          description: `${selectedApk.name} v${selectedApk.version} bude publikováno na ${platform}`,
        });
        setPublishDialogOpen(false);
        setSelectedApk(null);
        // Reload publications to show new entry
        await loadPublications();
      }
    } catch (error: any) {
      toast.error("Chyba při publikaci", {
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="apk" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="apk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              APK Soubory
            </TabsTrigger>
            <TabsTrigger value="publications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Historie publikací
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apk" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Dostupné APK soubory</h2>
                <p className="text-muted-foreground">
                  Přehled všech APK souborů ve sledovaném adresáři
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadApks}
                  disabled={isLoadingApks}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingApks ? 'animate-spin' : ''}`} />
                  Obnovit
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleScan}
                  disabled={isScanning}
                >
                  <Scan className={`h-4 w-4 mr-2 ${isScanning ? 'animate-pulse' : ''}`} />
                  Skenovat adresář
                </Button>
              </div>
            </div>
            <ApkTable apkFiles={apkFiles} onPublish={handlePublish} />
          </TabsContent>

          <TabsContent value="publications" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Historie publikací</h2>
                <p className="text-muted-foreground">
                  Přehled všech publikačních požadavků a jejich stavů
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPublications}
                disabled={isLoadingPublications}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPublications ? 'animate-spin' : ''}`} />
                Obnovit
              </Button>
            </div>
            <PublicationTable publications={publications} />
          </TabsContent>
        </Tabs>
      </main>

      <PublishDialog
        apk={selectedApk}
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onConfirm={handleConfirmPublish}
      />
    </div>
  );
};

export default Index;
