import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ApkTable } from "@/components/ApkTable";
import { PublicationTable } from "@/components/PublicationTable";
import { PublishDialog } from "@/components/PublishDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Mock data
const mockApkFiles = [
  {
    id: "1",
    name: "MyApp",
    version: "2.4.1",
    build: "241",
    date: "2025-10-10 14:23",
    size: "45.2 MB",
  },
  {
    id: "2",
    name: "MyApp",
    version: "2.4.0",
    build: "240",
    date: "2025-10-08 09:15",
    size: "44.8 MB",
  },
  {
    id: "3",
    name: "MyApp",
    version: "2.3.9",
    build: "239",
    date: "2025-10-05 16:42",
    size: "44.5 MB",
  },
];

const mockPublications = [
  {
    id: "1",
    apkName: "MyApp",
    version: "2.4.0",
    platform: "production" as const,
    status: "published" as const,
    requestedBy: "Jan Novák",
    requestedAt: "2025-10-08 10:00",
    publishedBy: "Systém",
    publishedAt: "2025-10-08 10:15",
  },
  {
    id: "2",
    apkName: "MyApp",
    version: "2.4.1",
    platform: "release_candidate" as const,
    status: "pending" as const,
    requestedBy: "Petr Dvořák",
    requestedAt: "2025-10-10 15:30",
  },
  {
    id: "3",
    apkName: "MyApp",
    version: "2.3.8",
    platform: "development" as const,
    status: "published" as const,
    requestedBy: "Marie Svobodová",
    requestedAt: "2025-10-03 11:20",
    publishedBy: "Systém",
    publishedAt: "2025-10-03 11:25",
  },
];

const Index = () => {
  const [selectedApk, setSelectedApk] = useState<typeof mockApkFiles[0] | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const handlePublish = (apk: typeof mockApkFiles[0]) => {
    setSelectedApk(apk);
    setPublishDialogOpen(true);
  };

  const handleConfirmPublish = (platform: string) => {
    toast.success(`Publikace zadána`, {
      description: `${selectedApk?.name} v${selectedApk?.version} bude publikováno na ${platform}`,
    });
    setPublishDialogOpen(false);
    setSelectedApk(null);
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
            </div>
            <ApkTable apkFiles={mockApkFiles} onPublish={handlePublish} />
          </TabsContent>

          <TabsContent value="publications" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Historie publikací</h2>
                <p className="text-muted-foreground">
                  Přehled všech publikačních požadavků a jejich stavů
                </p>
              </div>
            </div>
            <PublicationTable publications={mockPublications} />
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
