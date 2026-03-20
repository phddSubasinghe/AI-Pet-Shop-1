import { useState, useMemo, useEffect } from "react";
import { Search, Users as UsersIcon, Eye, Key, Trash2 } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { sellerLogoUrl } from "@/lib/api/seller";
import { shelterLogoUrl } from "@/lib/api/shelter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/adminUtils";
import { fetchAdminUsers, updateUserStatus, resetUserPassword, deleteUser, type AdminUserWithProfile } from "@/lib/api/admin";
import type { AdminUser, UserRole, UserStatus } from "@/types/admin";
import { onUserStatusChanged } from "@/lib/socket";
import { toast } from "sonner";

const roleOptions: UserRole[] = ["adopter", "shelter", "seller", "admin"];
const statusOptions: UserStatus[] = ["active", "pending", "blocked"];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserWithProfile | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [unblockConfirmUser, setUnblockConfirmUser] = useState<AdminUser | null>(null);
  const [blockConfirmUser, setBlockConfirmUser] = useState<AdminUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUserWithProfile | null>(null);
  const [resetTempPassword, setResetTempPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUserWithProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    fetchAdminUsers()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = onUserStatusChanged((payload) => {
      const { userId, status } = payload;
      if (!userId || !["active", "pending", "blocked"].includes(status)) return;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: status as UserStatus } : u))
      );
      setSelectedUser((prev) =>
        prev?.id === userId ? { ...prev, status: status as UserStatus } : prev
      );
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  function openDetail(user: AdminUser) {
    setSelectedUser(user);
    setDrawerOpen(true);
  }

  function openResetPassword(user: AdminUserWithProfile) {
    setResetPasswordUser(user);
    setResetTempPassword("");
    setResetConfirmPassword("");
  }

  async function submitResetPassword() {
    if (!resetPasswordUser) return;
    const pass = resetTempPassword.trim();
    const confirm = resetConfirmPassword.trim();
    if (pass.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (pass !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setResettingPassword(true);
    try {
      await resetUserPassword(resetPasswordUser.id, pass);
      toast.success("Password updated. User will be logged out and must sign in with the new password.");
      setResetPasswordUser(null);
      setResetTempPassword("");
      setResetConfirmPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResettingPassword(false);
    }
  }

  async function confirmDeleteUser() {
    const user = deleteConfirmUser;
    if (!user) return;
    setDeletingId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
        setDrawerOpen(false);
      }
      setDeleteConfirmUser(null);
      toast.success("User deleted. They have been logged out in real time.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function activateUser(user: AdminUser) {
    setUpdatingId(user.id);
    try {
      const updated = await updateUserStatus(user.id, "active");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: updated.status } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, status: updated.status });
      }
      toast.success("Seller activated. They will be notified in real time.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Activation failed");
    } finally {
      setUpdatingId(null);
    }
  }

  function requestUnblock(user: AdminUser) {
    setUnblockConfirmUser(user);
  }

  async function confirmUnblock() {
    const user = unblockConfirmUser;
    setUnblockConfirmUser(null);
    if (!user) return;
    const newStatus: UserStatus = "active";
    setUpdatingId(user.id);
    try {
      const updated = await updateUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: updated.status } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, status: updated.status });
      }
      toast.success("User unblocked. They will be notified in real time.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  function requestBlock(user: AdminUser) {
    setBlockConfirmUser(user);
  }

  async function confirmBlock() {
    const user = blockConfirmUser;
    setBlockConfirmUser(null);
    if (!user) return;
    setUpdatingId(user.id);
    try {
      const updated = await updateUserStatus(user.id, "blocked");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: updated.status } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, status: updated.status });
      }
      toast.success("User blocked.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleBlock(user: AdminUser) {
    if (user.status === "blocked") {
      requestUnblock(user);
    } else {
      requestBlock(user);
    }
  }

  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
            aria-hidden
          />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border/80 bg-background/50 backdrop-blur-sm"
            aria-label="Search users"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl" aria-label="Filter by role">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">All roles</SelectItem>
            {roleOptions.map((r) => (
              <SelectItem key={r} value={r} className="rounded-lg capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">All status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s} className="rounded-lg capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <AdminErrorState
          title={error === "Admin access required" ? "Admin access required" : "Could not load users"}
          description={
            error === "Admin access required"
              ? "Sign in with an admin account to manage users."
              : error
          }
          actionLabel={error === "Admin access required" ? "Sign in" : "Try again"}
          onRetry={
            error === "Admin access required"
              ? () => {
                  window.location.href = `/auth/signin?redirect=${encodeURIComponent("/dashboard/admin")}`;
                }
              : () => {
                  setError(null);
                  setLoading(true);
                  fetchAdminUsers()
                    .then(setUsers)
                    .catch((e) => setError(e instanceof Error ? e.message : "Failed to load users"))
                    .finally(() => setLoading(false));
                }
          }
        />
      ) : loading ? (
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle>Users</AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="p-4">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </AdminGlassCardContent>
        </AdminGlassCard>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle>Users</AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="User list">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4">
                        <span className="capitalize">{u.role}</span>
                      </td>
                      <td className="p-4">
                        <AdminStatusBadge status={u.status} variant="user" />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => openDetail(u)}
                            aria-label={`View ${u.name}`}
                          >
                            <Eye className="h-4 w-4 mr-1" aria-hidden />
                            View
                          </Button>
                          {u.role !== "admin" && u.status === "pending" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => activateUser(u)}
                              disabled={updatingId === u.id}
                            >
                              {updatingId === u.id ? "..." : "Activate"}
                            </Button>
                          )}
                          {u.role !== "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => (u.status === "blocked" ? requestUnblock(u) : toggleBlock(u))}
                              disabled={updatingId === u.id}
                            >
                              {updatingId === u.id
                                ? "..."
                                : u.status === "blocked"
                                  ? "Unblock"
                                  : "Block"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={deletingId === u.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" aria-hidden />
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => openResetPassword(u)}
                          >
                            <Key className="h-4 w-4 mr-1" aria-hidden />
                            Reset
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminGlassCardContent>
        </AdminGlassCard>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg rounded-l-3xl border-l border-border/80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">User details</SheetTitle>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              {(selectedUser.logoUrl || (selectedUser.role === "shelter" && selectedUser.organizationName)) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Logo
                  </p>
                  {selectedUser.logoUrl ? (
                    <img
                      src={selectedUser.role === "shelter" ? shelterLogoUrl(selectedUser.logoUrl) : sellerLogoUrl(selectedUser.logoUrl)}
                      alt=""
                      className="h-20 w-20 rounded-xl border border-border/80 object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl border border-border/80 bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      No logo
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Name
                </p>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-sm">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Role & Status
                </p>
                <p className="capitalize">{selectedUser.role}</p>
                <AdminStatusBadge status={selectedUser.status} variant="user" className="mt-2" />
              </div>
              {selectedUser.role === "seller" && (
                <>
                  {(selectedUser.shopName || selectedUser.pickupAddress || selectedUser.contactNumber) && (
                    <div className="space-y-3 pt-2 border-t border-border/80">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seller profile</p>
                      {selectedUser.shopName && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Shop name</p>
                          <p className="text-sm font-medium">{selectedUser.shopName}</p>
                        </div>
                      )}
                      {selectedUser.pickupAddress && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Pickup address</p>
                          <p className="text-sm">{selectedUser.pickupAddress}</p>
                        </div>
                      )}
                      {selectedUser.contactNumber && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Contact number</p>
                          <p className="text-sm">{selectedUser.contactNumber}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {selectedUser.role === "adopter" && (
                <>
                  {(selectedUser.contactNumber != null && selectedUser.contactNumber !== "") && (
                    <div className="space-y-3 pt-2 border-t border-border/80">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adopter contact</p>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Phone number</p>
                        <p className="text-sm">
                          <a href={`tel:${selectedUser.contactNumber}`} className="text-primary hover:underline">
                            {selectedUser.contactNumber}
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedUser.role === "shelter" && (
                <div className="space-y-3 pt-2 border-t border-border/80">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shelter (AWO) profile</p>
                  {selectedUser.organizationName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Organization</p>
                      <p className="text-sm font-medium">{selectedUser.organizationName}</p>
                    </div>
                  )}
                  {selectedUser.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                      <p className="text-sm">{selectedUser.description}</p>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                      <p className="text-sm">{selectedUser.address}</p>
                    </div>
                  )}
                  {selectedUser.district && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">District</p>
                      <p className="text-sm">{selectedUser.district}</p>
                    </div>
                  )}
                  {selectedUser.contactEmail && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Contact email</p>
                      <p className="text-sm">{selectedUser.contactEmail}</p>
                    </div>
                  )}
                  {selectedUser.contactNumberShelter && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Contact phone</p>
                      <p className="text-sm">{selectedUser.contactNumberShelter}</p>
                    </div>
                  )}
                  {selectedUser.website && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Website</p>
                      <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                        {selectedUser.website}
                      </a>
                    </div>
                  )}
                  {(selectedUser.ownerName || selectedUser.ownerEmail || selectedUser.ownerPhone) && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</p>
                      {selectedUser.ownerName && <p className="text-sm font-medium">{selectedUser.ownerName}</p>}
                      {selectedUser.ownerEmail && <p className="text-sm">{selectedUser.ownerEmail}</p>}
                      {selectedUser.ownerPhone && <p className="text-sm">{selectedUser.ownerPhone}</p>}
                    </div>
                  )}
                </div>
              )}
              {selectedUser.district && selectedUser.role !== "shelter" && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">District</p>
                  <p className="text-sm">{selectedUser.district}</p>
                </div>
              )}
              <div className="pt-2 border-t border-border/80">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Joined
                </p>
                <p className="text-sm">{formatDateTime(selectedUser.createdAt)}</p>
              </div>
              {selectedUser.lastActiveAt && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Last active
                  </p>
                  <p className="text-sm">{formatDateTime(selectedUser.lastActiveAt)}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Activity summary
                </p>
                <p className="text-sm">
                  Adoption requests: {selectedUser.requestsCount ?? 0} · Donations:{" "}
                  {selectedUser.donationsCount ?? 0}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/80">
                {selectedUser.status === "pending" && selectedUser.role !== "admin" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => activateUser(selectedUser)}
                    disabled={updatingId === selectedUser.id}
                  >
                    {updatingId === selectedUser.id ? "..." : "Activate"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() =>
                    selectedUser.role !== "admin" &&
                    (selectedUser.status === "blocked" ? requestUnblock(selectedUser) : toggleBlock(selectedUser))
                  }
                  disabled={selectedUser.role === "admin"}
                >
                  {selectedUser.status === "blocked" ? "Unblock" : "Block"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirmUser(selectedUser)}
                  disabled={deletingId === selectedUser.id}
                >
                  <Trash2 className="h-4 w-4 mr-1" aria-hidden />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => openResetPassword(selectedUser)}
                >
                  Reset password
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!unblockConfirmUser} onOpenChange={(open) => !open && setUnblockConfirmUser(null)}>
        <AlertDialogContent className="rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock user?</AlertDialogTitle>
            <AlertDialogDescription>
              {unblockConfirmUser && (
                <>
                  Are you sure you want to unblock <strong>{unblockConfirmUser.name}</strong> ({unblockConfirmUser.email})?
                  They will be able to use all features again and will be notified in real time.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-primary"
              onClick={confirmUnblock}
            >
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!blockConfirmUser} onOpenChange={(open) => !open && setBlockConfirmUser(null)}>
        <AlertDialogContent className="rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Block user?</AlertDialogTitle>
            <AlertDialogDescription>
              {blockConfirmUser && (
                <>
                  Are you sure you want to block <strong>{blockConfirmUser.name}</strong> ({blockConfirmUser.email})?
                  They will no longer be able to add or edit products, update orders, change inventory, or edit their profile.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmBlock}
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
        <AlertDialogContent className="rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmUser && (
                <>
                  Are you sure you want to delete <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})?
                  Their account will be removed and they will be logged out immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteUser}
              disabled={!!deletingId}
            >
              {deletingId ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <AlertDialogContent className="rounded-xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password</AlertDialogTitle>
            <AlertDialogDescription>
              {resetPasswordUser && (
                <>
                  Set a temporary password for <strong>{resetPasswordUser.name}</strong>. They will be logged out and must sign in with the new password.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {resetPasswordUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="reset-temp-password" className="text-sm font-medium">
                  Temporary password
                </label>
                <Input
                  id="reset-temp-password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={resetTempPassword}
                  onChange={(e) => setResetTempPassword(e.target.value)}
                  className="rounded-xl"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reset-confirm-password" className="text-sm font-medium">
                  Confirm password
                </label>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  placeholder="Confirm"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  className="rounded-xl"
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <Button
              className="rounded-xl"
              disabled={resettingPassword}
              onClick={submitResetPassword}
            >
              {resettingPassword ? "Updating…" : "Set password"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
