import { useState, useRef } from 'react';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';
import { toast } from "sonner";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Upload to Supabase Storage
      const filePath = `staging/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('apk-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create DB record
      const { error: dbError } = await supabase
        .from('apk_files')
        .insert({
          name: file.name,
          package_name: 'com.example.app', // TODO: Extract from APK
          version: '1.0.0', // TODO: Extract from APK
          version_code: 1, // TODO: Extract from APK
          storage_path: filePath,
          file_size: file.size,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("APK soubor byl úspěšně nahrán");
      queryClient.invalidateQueries({ queryKey: ['apk-files'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Chyba při nahrávání: ${error.message}`);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.apk')) {
      setSelectedFile(file);
    } else {
      toast.error('Prosím vyberte APK soubor');
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Nahrát APK
        </Button>
      </DialogTrigger>
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
          <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
            Zrušit
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Nahrávám...' : 'Nahrát'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
