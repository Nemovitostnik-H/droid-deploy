import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, AppSetting } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function Settings() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: appSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('key');
      
      if (error) throw error;
      
      const settingsObj: Record<string, string> = {};
      data.forEach((setting: AppSetting) => {
        settingsObj[setting.key] = setting.value;
      });
      setSettings(settingsObj);
      
      return data as AppSetting[];
    }
  });

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!hasRole(['admin'])) {
      toast.error('Nemáte oprávnění upravovat nastavení');
      return;
    }

    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);

        if (error) throw error;
      }

      toast.success('Nastavení bylo úspěšně uloženo');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Chyba při ukládání nastavení');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Nastavení aplikace</CardTitle>
            <CardDescription>
              Konfigurace adresářů pro APK soubory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {appSettings?.map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <Label htmlFor={setting.key}>{setting.key}</Label>
                  <Input
                    id={setting.key}
                    value={settings[setting.key] || ''}
                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    disabled={!hasRole(['admin'])}
                  />
                  {setting.description && (
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  )}
                </div>
              ))}
            </div>

            {hasRole(['admin']) && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ukládám...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Uložit nastavení
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
