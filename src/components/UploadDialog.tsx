import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function UploadDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading,
}: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.apk')) {
      setSelectedFile(file);
    } else {
      alert('Prosím vyberte APK soubor');
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nahrát APK soubor</DialogTitle>
          <DialogDescription>
            Vyberte APK soubor pro nahrání do složky staging
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Klikněte nebo přetáhněte APK soubor
            </p>
            <p className="text-xs text-muted-foreground">
              Maximální velikost: 500 MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".apk"
            className="hidden"
            onChange={handleFileSelect}
          />

          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <File className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Zrušit
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Nahrávám...' : 'Nahrát'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
