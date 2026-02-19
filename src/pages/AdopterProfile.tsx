import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCircle, Heart, Sparkles, ShoppingBag, ShoppingCart, Package, Bookmark, FileText, LogOut, Pencil, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { getStoredUser, clearStoredUser, setStoredUser } from "@/lib/auth";
import { updateProfile } from "@/lib/api/me";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const adopterOperations = [
  { to: "/browse-pets", label: "Browse Pets", description: "Find pets available for adoption", icon: Heart },
  { to: "/ai-matching", label: "AI Matching", description: "Get matched with your perfect pet", icon: Sparkles },
  { to: "/pet-store", label: "Pet Store", description: "Shop for pet supplies", icon: ShoppingBag },
  { to: "/cart", label: "Cart", description: "View cart and checkout", icon: ShoppingCart },
  { to: "/profile/orders", label: "My Orders", description: "View and track your orders", icon: Package },
  { to: "/profile/saved", label: "Saved Pets", description: "Pets and items you've saved", icon: Bookmark },
  { to: "/profile/requests", label: "Adoption Requests", description: "Track your adoption applications", icon: FileText },
  { to: "/profile/happy-match", label: "Share your happy match", description: "Post your adoption story with a photo", icon: MessageCircle },
];

export default function AdopterProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const isAdopter = user?.role === "adopter";
  const { totalItems } = useCart();
  const { openCart } = useCartDrawer();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true, state: { from: "/profile" } });
      return;
    }
    if (!isAdopter) {
      navigate("/", { replace: true });
    }
  }, [user, isAdopter, navigate]);

  function handleSignOut() {
    setLogoutOpen(false);
    clearStoredUser();
    navigate("/");
  }

  function openEdit() {
    setEditName(user?.name ?? "");
    setEditPhone(user?.contactNumber ?? "");
    setEditAddress(user?.address ?? "");
    setEditOpen(true);
  }

  async function handleSaveProfile() {
    const name = editName.trim();
    const phone = editPhone.replace(/\D/g, "").slice(0, 10) || null;
    const address = editAddress.trim() || null;
    if (name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (phone !== null && phone.length !== 10) {
      toast.error("Phone must be 10 digits or leave empty");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ name, contactNumber: phone || undefined, address: address ?? undefined });
      setStoredUser(updated);
      setUser(getStoredUser());
      setEditOpen(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!user || !isAdopter) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="pt-16">
        {/* Dashboard-style header strip */}
        <section className="border-b border-border/80 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-4xl px-6 lg:px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">Profile</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Hi, {user.name} — manage your account and activities.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl space-y-8">
            {/* Profile details – editable */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Profile details
              </h2>
              <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl">
                <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="grid gap-2 text-sm">
                    <p><span className="text-muted-foreground">Name</span> <span className="font-medium text-foreground">{user.name}</span></p>
                    <p><span className="text-muted-foreground">Email</span> <span className="text-foreground">{user.email}</span></p>
                    <p>
                      <span className="text-muted-foreground">Phone</span>{" "}
                      <span className="text-foreground">{user.contactNumber || "—"}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Address</span>{" "}
                      <span className="text-foreground">{user.address || "—"}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={openEdit}>
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick actions – grid on larger screens */}
            <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Quick actions
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {adopterOperations.map((op) => {
                const Icon = op.icon;
                const content = (
                  <Card
                    className={cn(
                      "rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden transition-all hover:shadow-md hover:border-primary/20",
                      op.disabled && "opacity-60"
                    )}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{op.label}</p>
                        <p className="text-sm text-muted-foreground">{op.description}</p>
                      </div>
                      {op.disabled && (
                        <span className="text-xs text-muted-foreground shrink-0">Coming soon</span>
                      )}
                    </CardContent>
                  </Card>
                );
                if (op.disabled) {
                  return (
                    <div key={op.to} className="cursor-not-allowed" aria-disabled>
                      {content}
                    </div>
                  );
                }
                if (op.to === "/cart") {
                  return (
                    <button
                      key={op.to}
                      type="button"
                      onClick={openCart}
                      className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
                    >
                      {content}
                    </button>
                  );
                }
                return (
                  <Link key={op.to} to={op.to} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
                    {content}
                  </Link>
                );
              })}
            </div>
            </div>

            {/* Sign out */}
            <div className="mt-10 pt-6 border-t border-border/80">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-2 text-muted-foreground hover:text-destructive"
                onClick={() => setLogoutOpen(true)}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your name and phone. Email cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                className="rounded-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={user?.email ?? ""}
                disabled
                className="rounded-lg bg-muted"
                title="Email cannot be changed"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone number</Label>
              <Input
                id="edit-phone"
                type="tel"
                inputMode="numeric"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="e.g. 771234567"
                maxLength={10}
                className="rounded-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address (required for adoption applications)</Label>
              <Input
                id="edit-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="e.g. City, street"
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-primary" onClick={handleSignOut}>
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
