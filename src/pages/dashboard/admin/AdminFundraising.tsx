import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  Building2,
  Check,
  X,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Search,
} from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminGlassCard } from "@/components/admin/AdminGlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  fetchAdminFundraisingCampaigns,
  updateAdminFundraisingCampaign,
  deleteAdminFundraisingCampaign,
  type AdminFundraisingCampaign,
} from "@/lib/api/admin";
import { onFundraisingChanged } from "@/lib/socket";
import { toast } from "sonner";
import { format } from "date-fns";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: AdminFundraisingCampaign["status"] }) {
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }
  if (status === "approved") {
    return (
      <Badge className="gap-1 bg-green-600 hover:bg-green-700">
        <Check className="h-3 w-3" />
        Public
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <X className="h-3 w-3" />
      Rejected
    </Badge>
  );
}

export default function AdminFundraising() {
  const [campaigns, setCampaigns] = useState<AdminFundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editCampaign, setEditCampaign] = useState<AdminFundraisingCampaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<AdminFundraisingCampaign | null>(null);

  const refetch = useCallback(async () => {
    try {
      const list = await fetchAdminFundraisingCampaigns();
      setCampaigns(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsub = onFundraisingChanged(refetch);
    return unsub;
  }, [refetch]);

  const filtered = campaigns.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.shelterName.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = campaigns.filter((c) => c.status === "pending").length;

  const handleApprove = async (c: AdminFundraisingCampaign) => {
    if (c.status === "approved") return;
    setUpdatingId(c.id);
    try {
      await updateAdminFundraisingCampaign(c.id, { status: "approved" });
      toast.success(`"${c.title}" is now public. Shelter was notified.`);
      setEditCampaign(null);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (c: AdminFundraisingCampaign) => {
    if (c.status === "rejected") return;
    setUpdatingId(c.id);
    try {
      await updateAdminFundraisingCampaign(c.id, { status: "rejected" });
      toast.success(`"${c.title}" was rejected.`);
      setEditCampaign(null);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveEdit = async (
    id: string,
    updates: { title?: string; description?: string; imageUrl?: string; goal?: number; endDate?: string }
  ) => {
    setUpdatingId(id);
    try {
      await updateAdminFundraisingCampaign(id, updates);
      toast.success("Campaign updated.");
      setEditCampaign(null);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (c: AdminFundraisingCampaign) => {
    setUpdatingId(c.id);
    try {
      await deleteAdminFundraisingCampaign(c.id);
      toast.success("Campaign deleted.");
      setDeleteCampaign(null);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Review shelter campaigns. Approve to make them public; shelter is notified in real-time. You can edit or delete any campaign.
        </p>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="w-fit">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or shelter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <AdminGlassCard key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </AdminGlassCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon={Heart}
          title="No campaigns"
          description={campaigns.length === 0 ? "Shelters have not created any fundraising campaigns yet." : "No campaigns match your filters."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <AdminGlassCard key={c.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex gap-3">
                  {c.imageUrl && (
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={c.imageUrl.startsWith("http") ? c.imageUrl : `${(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")}${c.imageUrl}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{c.title}</h4>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.shelterName}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
              )}
              <div className="mb-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Raised</span>
                  <span className="font-medium">
                    LKR {c.raised.toLocaleString()} / LKR {c.goal.toLocaleString()}
                  </span>
                </div>
                <Progress value={Math.min(100, (c.raised / c.goal) * 100)} className="h-2 mt-1" />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Ends {format(new Date(c.endDate), "d MMM yyyy")}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                {c.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      className="rounded-full gap-1"
                      onClick={() => handleApprove(c)}
                      disabled={updatingId === c.id}
                    >
                      {updatingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full gap-1"
                      onClick={() => handleReject(c)}
                      disabled={updatingId === c.id}
                    >
                      {updatingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1"
                  onClick={() => setEditCampaign(c)}
                  disabled={updatingId === c.id}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full gap-1 text-destructive hover:text-destructive"
                  onClick={() => setDeleteCampaign(c)}
                  disabled={updatingId === c.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </AdminGlassCard>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editCampaign} onOpenChange={(open) => !open && setEditCampaign(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit campaign</DialogTitle>
          </DialogHeader>
          {editCampaign && (
            <EditForm
              campaign={editCampaign}
              onSave={(updates) => handleSaveEdit(editCampaign.id, updates)}
              onCancel={() => setEditCampaign(null)}
              saving={updatingId === editCampaign.id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteCampaign} onOpenChange={(open) => !open && setDeleteCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteCampaign?.title}&quot;. Donations linked to it will remain but the campaign will no longer appear.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteCampaign && handleDelete(deleteCampaign)}
              disabled={updatingId === deleteCampaign?.id}
            >
              {updatingId === deleteCampaign?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditForm({
  campaign,
  onSave,
  onCancel,
  saving,
}: {
  campaign: AdminFundraisingCampaign;
  onSave: (u: { title?: string; description?: string; imageUrl?: string; goal?: number; endDate?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description ?? "");
  const [imageUrl, setImageUrl] = useState(campaign.imageUrl ?? "");
  const [goal, setGoal] = useState(String(campaign.goal));
  const [endDate, setEndDate] = useState(campaign.endDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numGoal = parseInt(goal, 10);
    if (!title.trim()) return;
    if (isNaN(numGoal) || numGoal < 1000) return;
    if (!endDate.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      goal: numGoal,
      endDate: endDate.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Image URL (optional)</label>
        <Input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="/api/shelter/campaigns/uploads/..."
          className="mt-1 rounded-lg"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Goal (LKR)</label>
        <Input
          type="number"
          min={1000}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="mt-1 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">End date</label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 rounded-lg"
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
