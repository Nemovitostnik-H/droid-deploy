import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";

interface PublishDialogProps {
  apkId: string;
  apkName: string;
}

export const PublishDialog = ({ apkId, apkName }: PublishDialogProps) => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<string>("");
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const canPublishToProduction = hasRole(['admin']);

  const publishMutation = useMutation({
    mutationFn: async (selectedPlatform: string) => {
      const { data, error } = await supabase.functions.invoke('publish-apk', {
        body: { 
          apk_id: apkId, 
          platform: selectedPlatform 
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("APK byl úspěšně publikován");
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Chyba při publikování: ${error.message}`);
    }
  });

  const handleConfirm = () => {
    if (platform) {
      publishMutation.mutate(platform);
    }
  };

  const handleClose = () => {
    setPlatform("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Publikovat
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Publikovat APK</DialogTitle>
          <DialogDescription>
            Vyberte platformu pro publikaci aplikace {apkName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Cílová platforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="platform" className="bg-background border-border">
                <SelectValue placeholder="Vyberte platformu" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="development">
                  <div className="flex items-center gap-2">
                    Development
                  </div>
                </SelectItem>
                <SelectItem value="release-candidate">
                  <div className="flex items-center gap-2">
                    Release Candidate
                  </div>
                </SelectItem>
                <SelectItem value="production" disabled={!canPublishToProduction}>
                  <div className="flex items-center gap-2">
                    Production {!canPublishToProduction && "(Pouze admin)"}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {!canPublishToProduction && (
              <Alert variant="default" className="mt-2">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Pouze administrátoři mohou publikovat na produkční prostředí.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={publishMutation.isPending}>
            Zrušit
          </Button>
          <Button onClick={handleConfirm} disabled={!platform || publishMutation.isPending}>
            {publishMutation.isPending ? "Publikuji..." : "Publikovat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
