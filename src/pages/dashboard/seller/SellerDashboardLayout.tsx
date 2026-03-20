import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Star,
  Wallet,
  Bell,
  Settings,
  Store,
  Menu,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { SellerAuthProvider } from "@/contexts/SellerAuthContext";
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
import { SellerDashboardTopbar } from "@/components/seller/SellerDashboardTopbar";

const navLinks = [
  { to: "/dashboard/seller", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/seller/products", label: "Products", icon: Package },
  { to: "/dashboard/seller/orders", label: "Orders", icon: ShoppingCart },
  { to: "/dashboard/seller/inventory", label: "Inventory", icon: Warehouse },
  { to: "/dashboard/seller/reviews", label: "Reviews", icon: Star },
  { to: "/dashboard/seller/earnings", label: "Earnings", icon: Wallet },
  { to: "/dashboard/seller/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/seller/settings", label: "Settings", icon: Settings },
];

function getHeaderTitle(pathname: string): string {
  if (pathname === "/dashboard/seller") return "Overview";
  if (pathname === "/dashboard/seller/products") return "Products";
  if (pathname === "/dashboard/seller/products/new") return "Add product";
  if (pathname.match(/\/dashboard\/seller\/products\/[^/]+\/edit/)) return "Edit product";
  if (pathname === "/dashboard/seller/orders") return "Orders";
  if (pathname === "/dashboard/seller/inventory") return "Inventory";
  if (pathname === "/dashboard/seller/reviews") return "Reviews";
  if (pathname === "/dashboard/seller/earnings") return "Earnings";
  if (pathname === "/dashboard/seller/notifications") return "Notifications";
  if (pathname === "/dashboard/seller/settings") return "Settings";
  return "Seller dashboard";
}

export default function SellerDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const headerTitle = getHeaderTitle(location.pathname);

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/80",
          "bg-card/80 backdrop-blur-xl shadow-sm transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 px-4">
          <Link
            to="/dashboard/seller"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <span className="font-display font-bold text-foreground text-lg">Seller</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Seller dashboard navigation">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard/seller"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:bg-muted/80 hover:shadow-sm active:scale-[0.98]",
                  isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
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
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                Log out
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out of the seller dashboard.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction className="rounded-full bg-primary" onClick={handleLogout}>
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
        <SellerAuthProvider>
          <SellerDashboardTopbar title={headerTitle} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto p-4 md:p-6" role="main">
            <Outlet />
          </main>
        </SellerAuthProvider>
      </div>
    </div>
  );
}
