import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Platform = "development" | "release_candidate" | "production";

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

export const PlatformBadge = ({ platform, className }: PlatformBadgeProps) => {
  const variants = {
    development: "bg-muted text-muted-foreground border-border",
    release_candidate: "bg-warning/20 text-warning border-warning/50",
    production: "bg-success/20 text-success border-success/50",
  };

  const labels = {
    development: "Development",
    release_candidate: "Release Candidate",
    production: "Production",
  };

  return (
    <Badge variant="outline" className={cn(variants[platform], "font-medium", className)}>
      {labels[platform]}
    </Badge>
  );
};
