import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pending" | "published" | "failed";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variants = {
    pending: "bg-pending text-pending-foreground",
    published: "bg-success text-success-foreground",
    failed: "bg-destructive text-destructive-foreground",
  };

  const labels = {
    pending: "Čeká",
    published: "Publikováno",
    failed: "Selhalo",
  };

  return (
    <Badge className={cn(variants[status], "font-medium", className)}>
      {labels[status]}
    </Badge>
  );
};
