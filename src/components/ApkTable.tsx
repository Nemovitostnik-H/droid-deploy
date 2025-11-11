import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PublishDialog } from "@/components/PublishDialog";
import { formatDistanceToNow } from "date-fns";

export const ApkTable = () => {
  const queryClient = useQueryClient();

  // Fetch APK files
  const { data: apkFiles, isLoading } = useQuery({
    queryKey: ['apk-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apk_files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('apk-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'apk_files'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['apk-files'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-foreground">Název aplikace</TableHead>
            <TableHead className="text-foreground">Verze</TableHead>
            <TableHead className="text-foreground">Build</TableHead>
            <TableHead className="text-foreground">Datum</TableHead>
            <TableHead className="text-foreground">Velikost</TableHead>
            <TableHead className="text-foreground text-right">Akce</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apkFiles && apkFiles.length > 0 ? (
            apkFiles.map((apk) => (
              <TableRow key={apk.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-medium">{apk.name}</TableCell>
                <TableCell>{apk.version}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {apk.build || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(apk.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {(apk.file_size / (1024 * 1024)).toFixed(2)} MB
                </TableCell>
                <TableCell className="text-right">
                  <PublishDialog apkId={apk.id} apkName={apk.name} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Žádné APK soubory k zobrazení
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
