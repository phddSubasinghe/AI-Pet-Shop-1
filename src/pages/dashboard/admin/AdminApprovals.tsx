import { useState, useMemo, useEffect } from "react";
import { Building2, Store, Eye, Check, X, FileQuestion, Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/adminUtils";
import { fetchAdminUsers, updateUserStatus, type AdminUserWithProfile } from "@/lib/api/admin";
import type { AdminShelter, AdminSeller, VerificationStatus } from "@/types/admin";
import { toast } from "sonner";

type ApprovalEntity = AdminShelter | AdminSeller;
const isShelter = (e: ApprovalEntity): e is AdminShelter => "orgName" in e;

function statusToVerification(s: string): VerificationStatus {
  if (s === "active") return "Verified";
  if (s === "blocked") return "Rejected";
  return "Pending";
}

function usersToShelters(users: AdminUserWithProfile[]): AdminShelter[] {
  return users
    .filter((u) => u.role === "shelter" && u.status === "pending")
    .map((u) => ({
      id: u.id,
      orgName: u.organizationName ?? "—",
      contactName: u.ownerName ?? u.name,
      email: u.email,
      phone: u.contactNumberShelter ?? "—",
      district: u.district ?? "—",
      address: u.address ?? "—",
      submittedAt: u.createdAt,
      verificationStatus: statusToVerification(u.status),
      submittedDocs: undefined,
    }));
}

function usersToSellers(users: AdminUserWithProfile[]): AdminSeller[] {
  return users
    .filter((u) => u.role === "seller" && u.status === "pending")
    .map((u) => ({
      id: u.id,
      shopName: u.shopName ?? "—",
      ownerName: u.name,
      email: u.email,
      phone: u.contactNumber ?? "—",
      district: u.district ?? "—",
      address: u.pickupAddress ?? "—",
      submittedAt: u.createdAt,
      verificationStatus: statusToVerification(u.status),
      submittedDocs: undefined,
    }));
}

export default function AdminApprovals() {
  const [users, setUsers] = useState<AdminUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ApprovalEntity | null>(null);
  const [activeTab, setActiveTab] = useState("shelters");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const shelters = useMemo(() => usersToShelters(users), [users]);
  const sellers = useMemo(() => usersToSellers(users), [users]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    fetchAdminUsers()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load approvals");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredShelters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shelters;
    return shelters.filter(
      (s) =>
        s.orgName.toLowerCase().includes(q) ||
        s.contactName.toLowerCase().includes(q) ||
        (s.district && s.district.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [shelters, search]);

  const filteredSellers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter(
      (s) =>
        s.shopName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        (s.district && s.district.toLowerCase().includes(q)) ||
        s.email.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [sellers, search]);

  function openDetail(entity: ApprovalEntity) {
    setSelected(entity);
    setDetailOpen(true);
  }

  async function approveOrReject(
    id: string,
    action: "Verified" | "Rejected",
    isShelterEntity: boolean
  ) {
    const newStatus = action === "Verified" ? "active" : "blocked";
    setUpdatingId(id);
    try {
      const updated = await updateUserStatus(id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: updated.status } : u))
      );
      if (selected && selected.id === id) {
        setSelected({
          ...selected,
          verificationStatus: action,
        });
      }
      const label = isShelterEntity ? "Shelter" : "Seller";
      toast.success(`${label} ${action === "Verified" ? "approved" : "rejected"}. They will be notified in real time.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminWaveSeparator />
        <AdminErrorState
          title="Could not load approvals"
          description={error}
          onRetry={() => {
            setError(null);
            setLoading(true);
            fetchAdminUsers()
              .then(setUsers)
              .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
              .finally(() => setLoading(false));
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminWaveSeparator />
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 flex-1 min-w-[200px] max-w-sm rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle>Loading…</AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="p-4">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </AdminGlassCardContent>
        </AdminGlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
              aria-hidden
            />
            <Input
              placeholder="Search by name, org, district, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-border/80 bg-background/50 backdrop-blur-sm"
              aria-label="Search approvals"
            />
          </div>
          <TabsList className="w-fit rounded-2xl bg-muted/50 p-1 flex flex-wrap gap-1 justify-end ml-auto shrink-0">
            <TabsTrigger value="shelters" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Shelters (AWOs)
            </TabsTrigger>
            <TabsTrigger value="sellers" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Sellers
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="shelters" className="mt-0">
          {filteredShelters.length === 0 ? (
            <AdminEmptyState
              icon={Building2}
              title={search ? "No matching pending shelters" : "No pending shelters"}
              description={search ? "Try a different search term." : "Pending shelter applications will appear here. Approved or rejected accounts are managed on the Users page."}
            />
          ) : (
            <AdminGlassCard>
              <AdminGlassCardHeader>
                <AdminGlassCardTitle>Pending shelter applications</AdminGlassCardTitle>
              </AdminGlassCardHeader>
              <AdminGlassCardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table" aria-label="Shelter approvals">
                    <thead>
                      <tr className="border-b border-border/80">
                        <th className="text-left p-4 font-medium text-muted-foreground">Name / Org</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">District</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShelters.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-medium">{s.orgName}</td>
                          <td className="p-4 text-muted-foreground">{s.district}</td>
                          <td className="p-4 text-muted-foreground">{formatDateTime(s.submittedAt)}</td>
                          <td className="p-4">
                            <AdminStatusBadge status={s.verificationStatus} variant="verification" />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => openDetail(s)}
                                aria-label={`View details for ${s.orgName}`}
                              >
                                <Eye className="h-4 w-4 mr-1" aria-hidden />
                                View
                              </Button>
                              {s.verificationStatus === "Pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => approveOrReject(s.id, "Verified", true)}
                                    disabled={updatingId === s.id}
                                  >
                                    <Check className="h-4 w-4 mr-1" aria-hidden />
                                    {updatingId === s.id ? "..." : "Approve"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => approveOrReject(s.id, "Rejected", true)}
                                    disabled={updatingId === s.id}
                                  >
                                    <X className="h-4 w-4 mr-1" aria-hidden />
                                    Reject
                                  </Button>
                                </>
                              )}
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
        </TabsContent>
        <TabsContent value="sellers" className="mt-0">
          {filteredSellers.length === 0 ? (
            <AdminEmptyState
              icon={Store}
              title={search ? "No matching pending sellers" : "No pending sellers"}
              description={search ? "Try a different search term." : "Pending seller applications will appear here. Approved or rejected accounts are managed on the Users page."}
            />
          ) : (
            <AdminGlassCard>
              <AdminGlassCardHeader>
                <AdminGlassCardTitle>Pending seller applications</AdminGlassCardTitle>
              </AdminGlassCardHeader>
              <AdminGlassCardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" role="table" aria-label="Seller approvals">
                    <thead>
                      <tr className="border-b border-border/80">
                        <th className="text-left p-4 font-medium text-muted-foreground">Shop / Owner</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">District</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSellers.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 font-medium">{s.shopName}</td>
                          <td className="p-4 text-muted-foreground">{s.district}</td>
                          <td className="p-4 text-muted-foreground">{formatDateTime(s.submittedAt)}</td>
                          <td className="p-4">
                            <AdminStatusBadge status={s.verificationStatus} variant="verification" />
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => openDetail(s)}
                                aria-label={`View details for ${s.shopName}`}
                              >
                                <Eye className="h-4 w-4 mr-1" aria-hidden />
                                View
                              </Button>
                              {s.verificationStatus === "Pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => approveOrReject(s.id, "Verified", false)}
                                    disabled={updatingId === s.id}
                                  >
                                    <Check className="h-4 w-4 mr-1" aria-hidden />
                                    {updatingId === s.id ? "..." : "Approve"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => approveOrReject(s.id, "Rejected", false)}
                                    disabled={updatingId === s.id}
                                  >
                                    <X className="h-4 w-4 mr-1" aria-hidden />
                                    Reject
                                  </Button>
                                </>
                              )}
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
        </TabsContent>
      </Tabs>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg rounded-l-3xl border-l border-border/80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">
              {selected
                ? isShelter(selected)
                  ? selected.orgName
                  : selected.shopName
                : "Details"}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {isShelter(selected) ? "Organization" : "Shop"}
                </p>
                <p className="font-medium">
                  {isShelter(selected) ? selected.orgName : selected.shopName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Contact
                </p>
                <p className="font-medium">
                  {isShelter(selected) ? selected.contactName : selected.ownerName}
                </p>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                <p className="text-sm text-muted-foreground">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Address
                </p>
                <p className="text-sm text-foreground">{selected.address}</p>
                <p className="text-sm text-muted-foreground">{selected.district}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Submitted
                </p>
                <p className="text-sm">{formatDateTime(selected.submittedAt)}</p>
              </div>
              {selected.submittedDocs && selected.submittedDocs.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Submitted documents
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selected.submittedDocs.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/80">
                {selected.verificationStatus === "Pending" && (
                  <>
                    <Button
                      variant="default"
                      className="rounded-xl"
                      disabled={updatingId === selected.id}
                      onClick={() => {
                        approveOrReject(selected.id, "Verified", isShelter(selected));
                        setDetailOpen(false);
                      }}
                    >
                      {updatingId === selected.id ? "..." : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-xl"
                      disabled={updatingId === selected.id}
                      onClick={() => {
                        approveOrReject(selected.id, "Rejected", isShelter(selected));
                        setDetailOpen(false);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => toast.info("Request more info (UI only)")}
                >
                  <FileQuestion className="h-4 w-4 mr-2" aria-hidden />
                  Request More Info
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
