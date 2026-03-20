import { useState, useEffect } from "react";
import { Tags, Pencil, Trash2, Plus } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/api/categories";
import { onCategoriesChanged } from "@/lib/socket";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchCategories()
      .then(setCategories)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Real-time: refetch when another client updates/deletes categories
  useEffect(() => {
    const unsubscribe = onCategoriesChanged(() => fetchCategories().then(setCategories));
    return unsubscribe;
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setModalOpen(true);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    const promise = editing
      ? updateCategory(editing.id, { name: trimmed })
      : createCategory({ name: trimmed });
    promise
      .then((saved) => {
        if (editing) {
          setCategories((prev) =>
            prev.map((c) => (c.id === saved.id ? saved : c))
          );
          toast.success("Category updated");
        } else {
          setCategories((prev) => [...prev, saved].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
          toast.success("Category added");
        }
        setModalOpen(false);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteCategory(deleteTarget.id)
      .then(() => {
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        toast.success("Category deleted");
        setDeleteTarget(null);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
      })
      .finally(() => setDeleting(false));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminWaveSeparator />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      <div className="flex justify-end">
        <Button className="rounded-xl" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <AdminEmptyState
          icon={Tags}
          title="No categories yet"
          description="Add categories to show in the seller product form dropdown."
          action={
            <Button className="rounded-xl" onClick={openAdd}>
              Add category
            </Button>
          }
        />
      ) : (
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle>Categories ({categories.length})</AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Categories">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Order</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-medium">{c.name}</td>
                      <td className="p-4 text-muted-foreground">{c.order}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => openEdit(c)}
                            aria-label={`Edit ${c.name}`}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Delete ${c.name}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-2 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Food, Toys"
              className="rounded-xl"
              aria-label="Category name"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <p className="text-sm text-muted-foreground">
              "{deleteTarget?.name}" will be removed. Products using this category will keep the
              category name as text.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
