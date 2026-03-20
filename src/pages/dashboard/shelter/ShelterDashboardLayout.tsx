import { Link, NavLink, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  PawPrint,
  Building2,
  Menu,
  LogOut,
  FileQuestion,
  Calendar,
  Heart,
  Bell,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { getStoredUser, setStoredUser, clearStoredUser } from "@/lib/auth";
import { onUserStatusChanged } from "@/lib/socket";
import { toast } from "sonner";
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
import { AddPetModalProvider, useAddPetModal } from "@/contexts/AddPetModalContext";
import { useShelter } from "@/contexts/ShelterContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ShelterPetForm from "@/pages/dashboard/shelter/ShelterPetForm";
import { DashboardTopbar } from "@/components/shelter/DashboardTopbar";

function AddPetDrawer() {
  const { isOpen, closeAddPet } = useAddPetModal();
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeAddPet()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-l-3xl border-l border-border/80 p-0 flex flex-col overflow-hidden [&>button]:hidden"
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <ShelterPetForm
            embedded
            petId={null}
            onSuccess={closeAddPet}
            onClose={closeAddPet}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

const navLinks = [
  { to: "/dashboard/shelter", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/shelter/pets", label: "Pets", icon: PawPrint },
  { to: "/dashboard/shelter/requests", label: "Requests", icon: FileQuestion },
  { to: "/dashboard/shelter/events", label: "Events", icon: Calendar },
  { to: "/dashboard/shelter/fundraising", label: "Fundraising", icon: Heart },
  { to: "/dashboard/shelter/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/shelter/settings", label: "Settings", icon: Settings },
];

function getHeaderTitle(pathname: string): string {
  if (pathname === "/dashboard/shelter") return "Overview";
  if (pathname === "/dashboard/shelter/pets") return "Pets";
  if (pathname.match(/\/dashboard\/shelter\/pets\/[^/]+\/edit/)) return "Edit pet";
  if (pathname === "/dashboard/shelter/requests") return "Adoption requests";
  if (pathname === "/dashboard/shelter/events") return "Events";
  if (pathname === "/dashboard/shelter/fundraising") return "Fundraising";
  if (pathname === "/dashboard/shelter/notifications") return "Notifications";
  if (pathname === "/dashboard/shelter/settings") return "Settings";
  return "Dashboard";
}

function ShelterDashboardInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getStoredUser());
  const location = useLocation();
  const navigate = useNavigate();
  const { refetchProfile } = useShelter();
  const headerTitle = getHeaderTitle(location.pathname);
  const isPending = user?.status === "pending";
  const isBlocked = user?.status === "blocked";

  // Real-time: when admin approves or blocks, update stored user, profile (verification status), and UI
  useEffect(() => {
    const unsub = onUserStatusChanged((payload) => {
      const current = getStoredUser();
      if (!current?.id || payload.userId !== current.id) return;
      const newStatus = payload.status as "active" | "pending" | "blocked";
      setStoredUser({ ...current, status: newStatus });
      setUser(getStoredUser());
      refetchProfile();
      if (newStatus === "active") {
        toast.success("Your shelter account has been approved. All features are now available.", {
          duration: 5000,
        });
      } else if (newStatus === "blocked") {
        toast.error("Your account has been blocked. Contact support if you have questions.");
      }
    });
    return unsub;
  }, [refetchProfile]);

  const handleLogout = () => {
    setSidebarOpen(false);
    clearStoredUser();
    navigate("/auth/signin");
  };

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Fixed Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/80",
          "bg-card/80 backdrop-blur-md shadow-sm transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border/80 px-5">
          <Link
            to="/dashboard/shelter"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <PawPrint className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <span className="font-display font-bold text-foreground text-lg">Shelter</span>
          </Link>
        </div>

        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
          aria-label="Dashboard navigation"
        >
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard/shelter"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator className="mx-3" />

        <div className="shrink-0 p-3">
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
                  You will be signed out of the shelter dashboard and returned to the main site.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full bg-primary"
                  onClick={handleLogout}
                >
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
        <DashboardTopbar title={headerTitle} />
        {isPending && (
          <div className="mx-4 mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Your account is under review. You’ll be able to use all features once approved.
          </div>
        )}
        {isBlocked && (
          <div className="mx-4 mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            Your account has been blocked. You cannot add, edit, or delete fundraisings, events, pets, or profile.
          </div>
        )}
        <main className="flex-1 overflow-auto p-4 md:p-6" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function ShelterDashboardLayout() {
  const user = getStoredUser();
  if (!user?.id) {
    return (
      <Navigate
        to={`/auth/signin?redirect=${encodeURIComponent("/dashboard/shelter")}`}
        replace
      />
    );
  }
  if (user.role !== "shelter") {
    return <Navigate to="/" replace />;
  }
  return (
    <AddPetModalProvider>
      <AddPetDrawer />
      <ShelterDashboardInner />
    </AddPetModalProvider>
  );
}
