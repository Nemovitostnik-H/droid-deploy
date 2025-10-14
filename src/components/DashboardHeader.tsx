import { Package, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  userName: string;
  userRole: string;
}

export const DashboardHeader = ({ userName, userRole }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">APK Manager</h1>
              <p className="text-sm text-muted-foreground">
                Správa publikací Android aplikací
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/documentation")}
            >
              <BookOpen className="h-4 w-4" />
              Dokumentace
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
            </div>
            <Button variant="outline" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
