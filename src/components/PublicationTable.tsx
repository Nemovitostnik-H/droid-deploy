import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { PlatformBadge } from "./PlatformBadge";

interface Publication {
  id: string;
  apkName: string;
  version: string;
  platform: "development" | "release_candidate" | "production";
  status: "pending" | "published" | "failed";
  requestedBy: string;
  requestedAt: string;
  publishedAt?: string;
  publishedBy?: string;
}

interface PublicationTableProps {
  publications: Publication[];
}

export const PublicationTable = ({ publications }: PublicationTableProps) => {
  return (
    <Card className="border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="text-foreground">Aplikace</TableHead>
            <TableHead className="text-foreground">Verze</TableHead>
            <TableHead className="text-foreground">Platforma</TableHead>
            <TableHead className="text-foreground">Status</TableHead>
            <TableHead className="text-foreground">Zadal</TableHead>
            <TableHead className="text-foreground">Datum zadání</TableHead>
            <TableHead className="text-foreground">Publikoval</TableHead>
            <TableHead className="text-foreground">Datum publikace</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publications.map((pub) => (
            <TableRow key={pub.id} className="border-border hover:bg-muted/50">
              <TableCell className="font-medium">{pub.apkName}</TableCell>
              <TableCell>{pub.version}</TableCell>
              <TableCell>
                <PlatformBadge platform={pub.platform} />
              </TableCell>
              <TableCell>
                <StatusBadge status={pub.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{pub.requestedBy}</TableCell>
              <TableCell className="text-muted-foreground">{pub.requestedAt}</TableCell>
              <TableCell className="text-muted-foreground">
                {pub.publishedBy || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {pub.publishedAt || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
