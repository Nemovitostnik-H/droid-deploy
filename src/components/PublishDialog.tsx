import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { PlatformBadge } from "./PlatformBadge";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface ApkFile {
  id: string;
  name: string;
  version: string;
  build: string;
}

interface PublishDialogProps {
  apk: ApkFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (platform: string) => void;
}

export const PublishDialog = ({
  apk,
  open,
  onOpenChange,
  onConfirm,
}: PublishDialogProps) => {
  const [platform, setPlatform] = useState<string>("");
  const { user } = useAuth();

  const canPublishToProduction = user?.role === 'admin';

  const handleConfirm = () => {
    if (platform) {
      onConfirm(platform);
      setPlatform("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Publikovat APK</DialogTitle>
          <DialogDescription>
            Vyberte platformu pro publikaci aplikace {apk?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Verze:</span> {apk?.version}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Build:</span>{" "}
              <span className="font-mono">{apk?.build}</span>
            </p>
          </div>
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
                <SelectItem value="release_candidate">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button onClick={handleConfirm} disabled={!platform}>
            Publikovat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
