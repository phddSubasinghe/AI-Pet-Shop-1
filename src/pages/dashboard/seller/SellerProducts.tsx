import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, Pencil, Eye, EyeOff, Trash2, Package, LayoutGrid, List } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { ProductFormModal, type ProductFormValues } from "@/components/seller/ProductFormModal";
import { EmptyState } from "@/components/shelter/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SellerProduct } from "@/types/seller";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  patchProductStatus,
  deleteProduct as deleteProductApi,
} from "@/lib/api/products";
import { ProductImageSlideshow } from "@/components/ProductImageSlideshow";
import { fetchCategories } from "@/lib/api/categories";
import { onCategoriesChanged } from "@/lib/socket";
import { getStoredUser } from "@/lib/auth";
import { useIsSellerBlocked } from "@/contexts/SellerAuthContext";
import { toast } from "sonner";

const BLOCKED_MESSAGE = "Your seller account is blocked. You cannot make changes until it is reactivated.";

const statuses = ["All", "active", "hidden"];

function getSellerName(): string {
  const user = getStoredUser();
  if (user?.role === "seller") return (user.shopName ?? user.name) || "Seller";
  return import.meta.env.VITE_SELLER_NAME ?? "Demo Seller";
}

export default function SellerProducts() {
  const isBlocked = useIsSellerBlocked();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [confirmToggleProduct, setConfirmToggleProduct] = useState<SellerProduct | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<SellerProduct | null>(null);

  const categoryFilterOptions = ["All", ...categories.map((c) => c.name)];

  // Fetch products and categories on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([data, cats]) => {
        if (!cancelled) {
          setProducts(data);
          setCategories(cats);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load data");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onCategoriesChanged(() => fetchCategories().then(setCategories));
    return unsubscribe;
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    const matchStatus = status === "All" || p.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  function handleConfirmToggle() {
    if (!confirmToggleProduct) return;
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      setConfirmToggleProduct(null);
      return;
    }
    const newStatus = confirmToggleProduct.status === "active" ? "hidden" : "active";
    patchProductStatus(confirmToggleProduct.id, newStatus)
      .then((updated) => {
        setProducts((prev) =>
          prev.map((x) => (x.id === updated.id ? { ...x, status: updated.status } : x))
        );
        toast.success(newStatus === "active" ? "Product is now visible" : "Product hidden");
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      })
      .finally(() => setConfirmToggleProduct(null));
  }

  function handleConfirmDelete() {
    if (!confirmDeleteProduct) return;
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      setConfirmDeleteProduct(null);
      return;
    }
    const id = confirmDeleteProduct.id;
    const name = confirmDeleteProduct.name;
    setConfirmDeleteProduct(null);
    deleteProductApi(id)
      .then(() => {
        setProducts((prev) => prev.filter((x) => x.id !== id));
        toast.success(`"${name}" has been deleted`);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete product");
      });
  }

  function handleSaveProduct(values: ProductFormValues): Promise<void> {
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      return Promise.reject(new Error(BLOCKED_MESSAGE));
    }
    const tags = values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const images = values.images ?? [];
    const user = getStoredUser();
    const payload = {
      name: values.name,
      category: values.category,
      price: values.price,
      discount: values.discount,
      stock: values.stock,
      lowStockThreshold: values.lowStockThreshold ?? 5,
      status: values.status,
      description: values.description ?? "",
      images,
      tags,
      sellerId: user?.id ?? undefined,
      sellerName: getSellerName(),
    };
    if (editingProduct) {
      return updateProduct(editingProduct.id, payload)
        .then((updated) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          setEditingProduct(null);
          setModalOpen(false);
          toast.success("Product updated successfully");
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Failed to update product");
          throw err;
        });
    }
    return createProduct(payload)
      .then((created) => {
        setProducts((prev) => [created, ...prev]);
        setEditingProduct(null);
        setModalOpen(false);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to create product");
        throw err;
      });
  }

  const toolbarClass = "h-10 rounded-xl border border-border/80 bg-background/50 backdrop-blur-sm";

  return (
    <div className="space-y-6">
      <WaveSeparator />
      {/* Search + filters left; grid/list + Add Product right */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className={cn("relative min-w-[180px] w-full sm:w-64 sm:max-w-xs", toolbarClass)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full pl-10 pr-3 border-0 bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 rounded-xl"
              aria-label="Search products"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className={cn("w-[130px]", toolbarClass)} aria-label="Category filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryFilterOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={cn("w-[110px]", toolbarClass)} aria-label="Status filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-xl border border-border/80 bg-background/50 overflow-hidden shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-10 w-10 rounded-none border-0", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-10 w-10 rounded-none border-0", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="h-10 rounded-xl shrink-0 transition-transform active:scale-95"
            disabled={isBlocked}
            onClick={() => {
              if (isBlocked) {
                toast.error(BLOCKED_MESSAGE);
                return;
              }
              setEditingProduct(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
      <ProductFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          product={editingProduct}
          onSave={handleSaveProduct}
          categories={categories}
        />

      <AlertDialog open={!!confirmToggleProduct} onOpenChange={(open) => !open && setConfirmToggleProduct(null)}>
        <AlertDialogContent className="max-w-sm p-4 gap-3">
          <AlertDialogHeader className="p-0 space-y-0">
            <AlertDialogTitle className="text-base">
              {confirmToggleProduct?.status === "active" ? "Hide this product?" : "Show this product?"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-0 pt-2 gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-lg" onClick={handleConfirmToggle}>
              {confirmToggleProduct?.status === "active" ? "Hide" : "Show"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDeleteProduct} onOpenChange={(open) => !open && setConfirmDeleteProduct(null)}>
        <AlertDialogContent className="max-w-sm p-4 gap-3">
          <AlertDialogHeader className="p-0 space-y-0">
            <AlertDialogTitle className="text-base">Delete this product?</AlertDialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              {confirmDeleteProduct ? `"${confirmDeleteProduct.name}" will be permanently deleted. This action cannot be undone.` : ""}
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-0 pt-2 gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-border/80 overflow-hidden">
          <CardContent className="p-0">
            <EmptyState
              icon={Package}
              title="No products found"
              description="Add your first product or adjust filters."
              action={
                <Button
                  className="rounded-xl"
                  onClick={() => {
                    setEditingProduct(null);
                    setModalOpen(true);
                  }}
                >
                  Add Product
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
          <div className="divide-y divide-border/50">
            {filtered.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors",
                  p.status === "hidden" && "opacity-70",
                )}
              >
                <div className="w-20 h-20 rounded-xl bg-muted/50 overflow-hidden shrink-0">
                  <ProductImageSlideshow
                    images={p.images ?? []}
                    className="w-full h-full rounded-xl"
                    placeholderIconClassName="h-8 w-8 text-muted-foreground"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.category} · LKR {p.discount != null ? (p.price * (1 - p.discount / 100)).toFixed(0) : p.price}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Stock: {p.stock}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.status === "active"}
                  aria-label={p.status === "active" ? "Active – click to hide" : "Hidden – click to show"}
                  aria-disabled={isBlocked}
                  disabled={isBlocked}
                  onClick={() => (isBlocked ? toast.error(BLOCKED_MESSAGE) : setConfirmToggleProduct(p))}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    isBlocked && "opacity-60 cursor-not-allowed",
                    p.status === "active"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-muted text-muted-foreground border border-border/80 hover:bg-muted/80"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", p.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                  {p.status === "active" ? "Active" : "Hidden"}
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={isBlocked}
                    onClick={() => {
                      if (isBlocked) toast.error(BLOCKED_MESSAGE);
                      else { setEditingProduct(p); setModalOpen(true); }
                    }}
                  >
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem
                        disabled={isBlocked}
                        onClick={() => {
                          if (isBlocked) toast.error(BLOCKED_MESSAGE);
                          else { setEditingProduct(p); setModalOpen(true); }
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isBlocked} onClick={() => (isBlocked ? toast.error(BLOCKED_MESSAGE) : setConfirmToggleProduct(p))}>
                        {p.status === "active" ? <><EyeOff className="h-4 w-4 mr-2" /> Hide</> : <><Eye className="h-4 w-4 mr-2" /> Show</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isBlocked} className="text-destructive focus:text-destructive" onClick={() => setConfirmDeleteProduct(p)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                p.status === "hidden" && "opacity-70",
              )}
            >
              <div className="aspect-video bg-muted/50 overflow-hidden">
                <ProductImageSlideshow
                  images={p.images ?? []}
                  className="w-full h-full"
                  placeholderIconClassName="h-12 w-12 text-muted-foreground"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-1">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.category} · LKR {p.discount != null ? (p.price * (1 - p.discount / 100)).toFixed(0) : p.price}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem
                        disabled={isBlocked}
                        onClick={() => {
                          if (isBlocked) toast.error(BLOCKED_MESSAGE);
                          else { setEditingProduct(p); setModalOpen(true); }
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isBlocked} onClick={() => (isBlocked ? toast.error(BLOCKED_MESSAGE) : setConfirmToggleProduct(p))}>
                        {p.status === "active" ? <><EyeOff className="h-4 w-4 mr-2" /> Hide</> : <><Eye className="h-4 w-4 mr-2" /> Show</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={isBlocked} className="text-destructive focus:text-destructive" onClick={() => setConfirmDeleteProduct(p)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.status === "active"}
                    aria-label={p.status === "active" ? "Active – click to hide" : "Hidden – click to show"}
                    aria-disabled={isBlocked}
                    disabled={isBlocked}
                    onClick={() => (isBlocked ? toast.error(BLOCKED_MESSAGE) : setConfirmToggleProduct(p))}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      isBlocked && "opacity-60 cursor-not-allowed",
                      p.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground border border-border/80 hover:bg-muted/80"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", p.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                    {p.status === "active" ? "Active" : "Hidden"}
                  </button>
                  <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg flex-1"
                    disabled={isBlocked}
                    onClick={() => {
                      if (isBlocked) toast.error(BLOCKED_MESSAGE);
                      else { setEditingProduct(p); setModalOpen(true); }
                    }}
                  >
                    View / Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
