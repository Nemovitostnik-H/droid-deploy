import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ApkFile {
  id: string;
  name: string;
  version: string;
  build: string;
  date: string;
  size: string;
}

interface ApkTableProps {
  apkFiles: ApkFile[];
  onPublish: (apk: ApkFile) => void;
}

export const ApkTable = ({ apkFiles, onPublish }: ApkTableProps) => {
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
          {apkFiles.map((apk) => (
            <TableRow key={apk.id} className="border-border hover:bg-muted/50">
              <TableCell className="font-medium">{apk.name}</TableCell>
              <TableCell>{apk.version}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {apk.build}
              </TableCell>
              <TableCell className="text-muted-foreground">{apk.date}</TableCell>
              <TableCell className="text-muted-foreground">{apk.size}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => onPublish(apk)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Publikovat
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
