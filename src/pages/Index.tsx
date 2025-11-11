import { DashboardHeader } from "@/components/DashboardHeader";
import { ApkTable } from "@/components/ApkTable";
import { PublicationTable } from "@/components/PublicationTable";
import { UploadDialog } from "@/components/UploadDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { hasRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="apk" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="apk">APK Soubory</TabsTrigger>
            <TabsTrigger value="publications">Historie publikací</TabsTrigger>
          </TabsList>

          <TabsContent value="apk" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Dostupné APK soubory</h2>
                <p className="text-muted-foreground">Přehled všech APK souborů</p>
              </div>
              {hasRole(['admin', 'publisher']) && <UploadDialog />}
            </div>
            <ApkTable />
          </TabsContent>

          <TabsContent value="publications" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Historie publikací</h2>
              <p className="text-muted-foreground">Přehled všech publikací</p>
            </div>
            <PublicationTable />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
