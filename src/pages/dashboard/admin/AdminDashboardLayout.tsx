import { Link, NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  PawPrint,
  Heart,
  HandCoins,
  Megaphone,
  Wallet,
  Package,
  CalendarDays,
  Tags,
  BarChart3,
  Settings,
  Shield,
  Menu,
  LogOut,
  Bot,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { getStoredUser } from "@/lib/auth";

const navLinks = [
  { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/admin/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/dashboard/admin/users", label: "Users", icon: Users },
  { to: "/dashboard/admin/pets", label: "Pets", icon: PawPrint },
  { to: "/dashboard/admin/adoptions", label: "Adoptions", icon: Heart },
  { to: "/dashboard/admin/donations", label: "Donations", icon: HandCoins },
  { to: "/dashboard/admin/fundraising", label: "Fundraising", icon: Megaphone },
  { to: "/dashboard/admin/payments", label: "Payments", icon: Wallet },
  { to: "/dashboard/admin/products", label: "Products", icon: Package },
  { to: "/dashboard/admin/events", label: "Events", icon: CalendarDays },
  { to: "/dashboard/admin/categories", label: "Categories", icon: Tags },
  { to: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/admin/integrations/openai", label: "OpenAI", icon: Bot },
  { to: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

function getHeaderTitle(pathname: string): string {
  if (pathname === "/dashboard/admin") return "Overview";
  if (pathname === "/dashboard/admin/approvals") return "Approvals";
  if (pathname === "/dashboard/admin/users") return "Users";
  if (pathname === "/dashboard/admin/pets") return "Pets";
  if (pathname === "/dashboard/admin/adoptions") return "Adoptions";
  if (pathname === "/dashboard/admin/donations") return "Donations";
  if (pathname === "/dashboard/admin/fundraising") return "Fundraising";
  if (pathname === "/dashboard/admin/payments") return "Payments";
  if (pathname === "/dashboard/admin/products") return "Products";
  if (pathname === "/dashboard/admin/events") return "Events";
  if (pathname === "/dashboard/admin/categories") return "Categories";
  if (pathname === "/dashboard/admin/analytics") return "Analytics";
  if (pathname === "/dashboard/admin/integrations/openai") return "OpenAI";
  if (pathname === "/dashboard/admin/settings") return "Settings";
  return "Admin";
}

export default function AdminDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const headerTitle = getHeaderTitle(location.pathname);
  const user = getStoredUser();

  if (!user) {
    return <Navigate to={`/auth/signin?redirect=${encodeURIComponent("/dashboard/admin")}`} replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    setSidebarOpen(false);
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/80",
          "bg-card/80 backdrop-blur-xl shadow-sm transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 px-4">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <span className="font-display font-bold text-foreground text-lg">PawPop Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
          aria-label="Admin dashboard navigation"
        >
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard/admin"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-muted/80 hover:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 p-3 border-t border-border/80">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                Log out
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out of the admin dashboard.
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
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <AdminTopbar title={headerTitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
