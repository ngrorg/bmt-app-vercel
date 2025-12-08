import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Menu, Bell } from "lucide-react";
import { UserRole } from "@/types";
import { Logo } from "@/components/Logo";

interface AppHeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  driver: "Driver",
  warehouse: "Warehouse",
  executive: "Executive",
  operational_lead: "Ops Lead",
};

export function AppHeader({ onMenuToggle, showMenuButton = true }: AppHeaderProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card safe-top">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Logo size={70} />
            <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user.firstName}</p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[user.role]}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
