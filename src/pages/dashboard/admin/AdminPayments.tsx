import { useState, useEffect, useCallback } from "react";
import { Store, Heart, CheckCircle, Loader2 } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatLKR, formatDateTime } from "@/lib/adminUtils";
import {
  fetchAdminSellerPayouts,
  fetchAdminSellerPendingBalances,
  createAdminSellerPayout,
  markAdminSellerPayoutPaid,
  fetchAdminShelterPayouts,
  fetchAdminShelterPendingBalances,
  createAdminShelterPayout,
  markAdminShelterPayoutPaid,
} from "@/lib/api/admin";
import type {
  AdminSellerPayout,
  AdminSellerPendingBalance,
  AdminShelterPayout,
  AdminShelterPendingBalance,
} from "@/types/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type PayoutStatusFilter = "all" | "pending" | "paid";

function SellerPayoutsSection() {
  const [payouts, setPayouts] = useState<AdminSellerPayout[]>([]);
  const [pendingBalances, setPendingBalances] = useState<AdminSellerPendingBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>("all");
  const [creatingFor, setCreatingFor] = useState<AdminSellerPendingBalance | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchAdminSellerPayouts(statusFilter === "all" ? undefined : statusFilter),
      fetchAdminSellerPendingBalances(),
    ])
      .then(([p, pending]) => {
        setPayouts(p);
        setPendingBalances(pending);
      })
      .catch(() => toast.error("Failed to load seller payouts"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreatePayout = async (row: AdminSellerPendingBalance) => {
    setCreatingFor(row);
  };

  const confirmCreatePayout = async () => {
    if (!creatingFor) return;
    try {
      await createAdminSellerPayout(creatingFor.sellerId, creatingFor.pendingAmount);
      toast.success(`Payout of ${formatLKR(creatingFor.pendingAmount)} created for ${creatingFor.sellerName}`);
      setCreatingFor(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create payout");
    }
  };

  const handleMarkPaid = async (id: string) => {
    setMarkingPaidId(id);
    try {
      await markAdminSellerPayoutPaid(id);
      toast.success("Payout marked as paid");
      setMarkingPaidId(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
      setMarkingPaidId(null);
    }
  };

  if (loading && payouts.length === 0 && pendingBalances.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminGlassCard>
        <AdminGlassCardHeader>
          <AdminGlassCardTitle>Pending balances (sellers)</AdminGlassCardTitle>
        </AdminGlassCardHeader>
        <AdminGlassCardContent className="p-0">
          {pendingBalances.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">No pending seller balances.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Seller pending balances">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground">Seller</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Pending</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBalances.map((row) => (
                    <tr
                      key={row.sellerId}
                      className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{row.sellerName}</td>
                      <td className="p-4 text-muted-foreground">{row.sellerEmail}</td>
                      <td className="p-4 text-right font-medium">{formatLKR(row.pendingAmount)}</td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => handleCreatePayout(row)}
                        >
                          Create payout
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminGlassCardContent>
      </AdminGlassCard>

      <AdminGlassCard>
        <AdminGlassCardHeader className="flex flex-row items-center justify-between">
          <AdminGlassCardTitle>Seller payouts</AdminGlassCardTitle>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PayoutStatusFilter)}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </AdminGlassCardHeader>
        <AdminGlassCardContent className="p-0">
          {loading ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payouts.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">No payouts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Seller payouts">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground">Seller</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{p.sellerName}</td>
                      <td className="p-4 text-muted-foreground">{p.sellerEmail}</td>
                      <td className="p-4 text-right font-medium">{formatLKR(p.amount)}</td>
                      <td className="p-4">
                        <span
                          className={
                            p.status === "paid"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {p.paidAt ? formatDateTime(p.paidAt) : formatDateTime(p.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="rounded-xl gap-1"
                            disabled={markingPaidId === p.id}
                            onClick={() => handleMarkPaid(p.id)}
                          >
                            {markingPaidId === p.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Mark paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminGlassCardContent>
      </AdminGlassCard>

      <AlertDialog open={!!creatingFor} onOpenChange={(open) => !open && setCreatingFor(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create seller payout</AlertDialogTitle>
            <AlertDialogDescription>
              Create a payout of {creatingFor ? formatLKR(creatingFor.pendingAmount) : ""} for{" "}
              {creatingFor?.sellerName}. This will record the payout as pending; mark it as paid after you have
              transferred the funds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmCreatePayout}>
              Create payout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ShelterPayoutsSection() {
  const [payouts, setPayouts] = useState<AdminShelterPayout[]>([]);
  const [pendingBalances, setPendingBalances] = useState<AdminShelterPendingBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>("all");
  const [creatingFor, setCreatingFor] = useState<AdminShelterPendingBalance | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchAdminShelterPayouts(statusFilter === "all" ? undefined : statusFilter),
      fetchAdminShelterPendingBalances(),
    ])
      .then(([p, pending]) => {
        setPayouts(p);
        setPendingBalances(pending);
      })
      .catch(() => toast.error("Failed to load shelter payouts"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreatePayout = (row: AdminShelterPendingBalance) => setCreatingFor(row);

  const confirmCreatePayout = async () => {
    if (!creatingFor) return;
    try {
      await createAdminShelterPayout(creatingFor.shelterId, creatingFor.pendingAmount);
      toast.success(`Payout of ${formatLKR(creatingFor.pendingAmount)} created for ${creatingFor.shelterName}`);
      setCreatingFor(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create payout");
    }
  };

  const handleMarkPaid = async (id: string) => {
    setMarkingPaidId(id);
    try {
      await markAdminShelterPayoutPaid(id);
      toast.success("Payout marked as paid");
      setMarkingPaidId(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
      setMarkingPaidId(null);
    }
  };

  if (loading && payouts.length === 0 && pendingBalances.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminGlassCard>
        <AdminGlassCardHeader>
          <AdminGlassCardTitle>Pending balances (shelters)</AdminGlassCardTitle>
        </AdminGlassCardHeader>
        <AdminGlassCardContent className="p-0">
          {pendingBalances.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">
              No pending shelter balances. Add donations to shelters to see pending amounts.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Shelter pending balances">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground">Shelter</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Pending</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBalances.map((row) => (
                    <tr
                      key={row.shelterId}
                      className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{row.shelterName}</td>
                      <td className="p-4 text-muted-foreground">{row.shelterEmail}</td>
                      <td className="p-4 text-right font-medium">{formatLKR(row.pendingAmount)}</td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => handleCreatePayout(row)}
                        >
                          Create payout
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminGlassCardContent>
      </AdminGlassCard>

      <AdminGlassCard>
        <AdminGlassCardHeader className="flex flex-row items-center justify-between">
          <AdminGlassCardTitle>Shelter payouts</AdminGlassCardTitle>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PayoutStatusFilter)}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </AdminGlassCardHeader>
        <AdminGlassCardContent className="p-0">
          {loading ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payouts.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">No payouts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Shelter payouts">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground">Shelter</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{p.shelterName}</td>
                      <td className="p-4 text-muted-foreground">{p.shelterEmail}</td>
                      <td className="p-4 text-right font-medium">{formatLKR(p.amount)}</td>
                      <td className="p-4">
                        <span
                          className={
                            p.status === "paid"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {p.paidAt ? formatDateTime(p.paidAt) : formatDateTime(p.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="rounded-xl gap-1"
                            disabled={markingPaidId === p.id}
                            onClick={() => handleMarkPaid(p.id)}
                          >
                            {markingPaidId === p.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Mark paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminGlassCardContent>
      </AdminGlassCard>

      <AlertDialog open={!!creatingFor} onOpenChange={(open) => !open && setCreatingFor(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create shelter payout</AlertDialogTitle>
            <AlertDialogDescription>
              Create a payout of {creatingFor ? formatLKR(creatingFor.pendingAmount) : ""} for{" "}
              {creatingFor?.shelterName}. This will record the payout as pending; mark it as paid after you have
              transferred the funds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmCreatePayout}>
              Create payout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminPayments() {
  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      <Tabs defaultValue="sellers" className="w-full">
        <TabsList className="rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="sellers" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Store className="h-4 w-4" />
            Seller payouts
          </TabsTrigger>
          <TabsTrigger value="shelters" className="rounded-lg gap-2 data-[state=active]:bg-background">
            <Heart className="h-4 w-4" />
            Shelter payouts
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sellers" className="mt-6">
          <SellerPayoutsSection />
        </TabsContent>
        <TabsContent value="shelters" className="mt-6">
          <ShelterPayoutsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
