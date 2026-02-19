import { useState, useEffect, useCallback } from "react";
import { Search, Bell, ChevronDown, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
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
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { clearStoredUser } from "@/lib/auth";
import {
  fetchShelterNotifications,
  markShelterNotificationRead,
  markAllShelterNotificationsRead,
} from "@/lib/api/shelter";
import type { ShelterNotification } from "@/types/shelter";
import { onNotificationsChanged } from "@/lib/socket";

const THEME_STORAGE_KEY = "pawpop:theme";

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);
  return { dark, toggle };
}

function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "Just now";
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

interface DashboardTopbarProps {
  /** Title for current page (optional; can be set by layout) */
  title?: string;
  /** Optional right-side slot */
  children?: React.ReactNode;
  className?: string;
}

export function DashboardTopbar({ title, children, className }: DashboardTopbarProps) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { dark, toggle } = useTheme();
  const [notifications, setNotifications] = useState<ShelterNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const list = await fetchShelterNotifications();
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    return onNotificationsChanged(loadNotifications);
  }, [loadNotifications]);

  const handleNotificationClick = async (n: ShelterNotification) => {
    if (!n.read) {
      try {
        await markShelterNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        // ignore
      }
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllShelterNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border/80",
        "bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
        "px-4 md:px-6 shadow-sm",
        className,
      )}
      role="banner"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {title && (
          <h1 className="truncate text-lg font-semibold font-display text-foreground">
            {title}
          </h1>
        )}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search pets, requests..."
              className="pl-9 rounded-full border-border/80 bg-muted/30 focus-visible:ring-primary/20"
              aria-label="Search"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          aria-label="Search"
          onClick={() => setSearchOpen((o) => !o)}
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={toggle}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl border-border/80 shadow-lg">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <p className="font-medium text-sm text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {notificationsLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="py-3 rounded-lg cursor-pointer"
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className={cn("text-sm", !n.read && "font-medium")}>
                      {n.title}{n.message ? ` – ${n.message}` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatNotificationTime(n.createdAt)}</span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/shelter/notifications" className="text-sm text-primary font-medium">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="rounded-full gap-2 pl-2 pr-2 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Profile menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/80 shadow-lg">
            <DropdownMenuItem asChild>
              <Link to="/dashboard/shelter/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setLogoutOpen(true)}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
          <AlertDialogContent className="max-w-sm p-4 gap-3">
            <AlertDialogHeader className="p-0 space-y-0">
              <AlertDialogTitle className="text-base">Log out?</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm text-muted-foreground">Are you sure you want to log out?</p>
            <AlertDialogFooter className="p-0 pt-2 gap-2 sm:gap-0">
              <AlertDialogCancel className="mt-0 rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-lg"
                onClick={() => {
                  setLogoutOpen(false);
                  clearStoredUser();
                  navigate("/auth/signin");
                }}
              >
                Log out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {children}
      </div>
    </header>
  );
}
