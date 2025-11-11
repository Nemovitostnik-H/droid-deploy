import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./StatusBadge";
import { PlatformBadge } from "./PlatformBadge";
import { formatDistanceToNow } from "date-fns";

export const PublicationTable = () => {
  const queryClient = useQueryClient();

  // Fetch publications
  const { data: publications, isLoading } = useQuery({
    queryKey: ['publications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          apk:apk_files(name, version, package_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('publication-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'publications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['publications'] });
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
            <TableHead className="text-foreground">Aplikace</TableHead>
            <TableHead className="text-foreground">Verze</TableHead>
            <TableHead className="text-foreground">Platforma</TableHead>
            <TableHead className="text-foreground">Status</TableHead>
            <TableHead className="text-foreground">Publikoval</TableHead>
            <TableHead className="text-foreground">Datum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publications && publications.length > 0 ? (
            publications.map((pub) => (
              <TableRow key={pub.id} className="border-border hover:bg-muted/50">
                <TableCell className="font-medium">{pub.apk?.name || 'N/A'}</TableCell>
                <TableCell>{pub.apk?.version || 'N/A'}</TableCell>
                <TableCell>
                  <PlatformBadge platform={pub.platform} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={pub.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {pub.published_by || 'System'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(pub.created_at), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Žádné publikace k zobrazení
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
