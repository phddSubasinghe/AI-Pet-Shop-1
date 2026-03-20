import { useState, useEffect } from "react";
import { Package, Search } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProducts } from "@/lib/api/products";
import { fetchCategories } from "@/lib/api/categories";
import { ProductImageSlideshow } from "@/components/ProductImageSlideshow";
import { onCategoriesChanged } from "@/lib/socket";
import type { SellerProduct } from "@/types/seller";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProducts() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = onCategoriesChanged(() => fetchCategories().then(setCategories));
    return unsubscribe;
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sellerName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminWaveSeparator />
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
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
            placeholder="Search by product or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border/80 bg-background/50 backdrop-blur-sm"
            aria-label="Search products"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All categories
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name} className="rounded-lg">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] rounded-xl" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All status
            </SelectItem>
            <SelectItem value="active" className="rounded-lg">
              Active
            </SelectItem>
            <SelectItem value="hidden" className="rounded-lg">
              Hidden
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="No products found"
          description="Products from sellers will appear here."
        />
      ) : (
        <AdminGlassCard>
          <AdminGlassCardHeader>
            <AdminGlassCardTitle>Products ({filtered.length})</AdminGlassCardTitle>
          </AdminGlassCardHeader>
          <AdminGlassCardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Product list">
                <thead>
                  <tr className="border-b border-border/80">
                    <th className="text-left p-4 font-medium text-muted-foreground w-20">Image</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Seller</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/80 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg bg-muted/50 overflow-hidden">
                          <ProductImageSlideshow
                            images={p.images ?? []}
                            className="w-full h-full rounded-lg"
                            placeholderIconClassName="h-6 w-6 text-muted-foreground"
                          />
                        </div>
                      </td>
                      <td className="p-4 font-medium">{p.name}</td>
                      <td className="p-4 text-muted-foreground">{p.category}</td>
                      <td className="p-4">
                        LKR {p.discount != null ? (p.price * (1 - p.discount / 100)).toFixed(0) : p.price}
                      </td>
                      <td className="p-4">{p.stock}</td>
                      <td className="p-4">
                        <span
                          className={
                            p.status === "active"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {p.sellerName || p.sellerId || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminGlassCardContent>
        </AdminGlassCard>
      )}
    </div>
  );
}
