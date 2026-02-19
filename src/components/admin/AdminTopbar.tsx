import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AdminTopbarProps {
  title?: string;
  onMenuClick?: () => void;
  className?: string;
}

const mockNotifications = [
  { id: "1", text: "3 shelters pending approval", time: "10m ago", read: false },
  { id: "2", text: "New adoption request for Max", time: "1h ago", read: true },
  { id: "3", text: "Donation report ready", time: "2h ago", read: true },
];

export function AdminTopbar({ title, onMenuClick, className }: AdminTopbarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    setLogoutOpen(false);
    navigate("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border/80",
        "bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80",
        "px-4 md:px-6 shadow-sm transition-shadow",
        className
      )}
      role="banner"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {title && (
          <h1 className="truncate text-lg font-semibold font-display text-foreground">
            {title}
          </h1>
        )}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search users, shelters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-border/80 bg-muted/30 focus-visible:ring-primary/20"
              aria-label="Search dashboard"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl md:hidden focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 rounded-2xl border-border/80 shadow-lg backdrop-blur-xl"
          >
            <div className="px-4 py-3 border-b border-border/80">
              <p className="font-medium text-sm text-foreground">Notifications</p>
            </div>
            {mockNotifications.map((n) => (
              <DropdownMenuItem key={n.id} className="py-3 rounded-xl cursor-pointer">
                <div className="flex flex-col gap-0.5">
                  <span className={cn("text-sm", !n.read && "font-medium")}>{n.text}</span>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/admin/approvals" className="text-sm text-primary font-medium">
                View all
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="rounded-xl gap-2 pl-2 pr-2 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Profile menu"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground hidden sm:block" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/80 shadow-lg">
            <DropdownMenuItem asChild>
              <Link to="/dashboard/admin/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setLogoutOpen(true);
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
          <AlertDialogContent className="rounded-2xl max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be signed out of the PawPop admin dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction className="rounded-xl bg-primary" onClick={handleLogout}>
                Log out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
