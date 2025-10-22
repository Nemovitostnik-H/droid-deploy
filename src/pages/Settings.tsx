import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { settingsApi, Setting } from "@/services/api";
import { Loader2, Save, FolderOpen } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.list();
      setSettings(response.settings);
      
      // Initialize form data
      const data: Record<string, string> = {};
      response.settings.forEach(setting => {
        data[setting.key] = setting.value;
      });
      setFormData(data);
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se načíst nastavení",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update all changed settings
      const updates = Object.keys(formData).map(key => 
        settingsApi.update(key, formData[key])
      );
      
      await Promise.all(updates);
      
      toast({
        title: "Uloženo",
        description: "Nastavení byla úspěšně aktualizována",
      });
      
      await loadSettings();
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se uložit nastavení",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'apk_directory': 'Základní APK adresář',
      'apk_staging_directory': 'Staging adresář',
      'platform_dev_directory': 'Development adresář',
      'platform_rc_directory': 'Release Candidate adresář',
      'platform_prod_directory': 'Production adresář',
      'backend_port': 'Backend Port',
      'jwt_secret': 'JWT Secret',
      'jwt_expires_in': 'JWT Expirace',
    };
    return labels[key] || key;
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'backend_port': 'Port na kterém běží backend server (výchozí: 3001)',
      'jwt_secret': 'Tajný klíč pro JWT tokeny (doporučeno minimálně 32 znaků)',
      'jwt_expires_in': 'Doba expirace JWT tokenů (např. "24h", "7d")',
    };
    return descriptions[key] || '';
  };

  const isPasswordField = (key: string): boolean => {
    return key.includes('secret') || key.includes('password');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Pouze administrátoři mají přístup k nastavení.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Nastavení systému</h1>
          <p className="text-muted-foreground mt-2">
            Konfigurace adresářů a nastavení APK Manageru
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                APK Adresáře
              </CardTitle>
              <CardDescription>
                Nakonfigurujte cesty k adresářům pro ukládání APK souborů. Tyto cesty musí existovat v Docker kontejneru.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Directory Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Adresáře</h3>
                {settings
                  .filter(s => s.key.includes('directory'))
                  .map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>
                        {getSettingLabel(setting.key)}
                      </Label>
                      <Input
                        id={setting.key}
                        type="text"
                        value={formData[setting.key] || ''}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        placeholder={setting.value}
                      />
                      {(setting.description || getSettingDescription(setting.key)) && (
                        <p className="text-sm text-muted-foreground">
                          {setting.description || getSettingDescription(setting.key)}
                        </p>
                      )}
                    </div>
                  ))}
              </div>

              {/* Server Settings */}
              {settings.some(s => !s.key.includes('directory')) && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Serverové nastavení</h3>
                  {settings
                    .filter(s => !s.key.includes('directory'))
                    .map((setting) => (
                      <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key}>
                          {getSettingLabel(setting.key)}
                        </Label>
                        <Input
                          id={setting.key}
                          type={isPasswordField(setting.key) ? "password" : "text"}
                          value={formData[setting.key] || ''}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          placeholder={setting.value}
                        />
                        {(setting.description || getSettingDescription(setting.key)) && (
                          <p className="text-sm text-muted-foreground">
                            {setting.description || getSettingDescription(setting.key)}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-4 flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ukládání...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Uložit změny
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={loadSettings} disabled={saving}>
                  Obnovit
                </Button>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">⚠️ Důležité poznámky:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Adresáře musí existovat v Docker kontejneru backendu</li>
                  <li>Po změně adresářů může být nutný restart backend kontejneru</li>
                  <li>Ujistěte se, že jsou adresáře správně namountované v docker-compose.yml</li>
                  <li>Backend musí mít read-write oprávnění k těmto adresářům</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
