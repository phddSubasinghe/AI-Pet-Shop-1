import { useState, useEffect, useCallback } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { EmptyState } from "@/components/shelter/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { getLowStockProducts } from "@/mock/sellerData";
import { fetchSellerProducts, patchSellerProductInventory } from "@/lib/api/seller";
import { getToken } from "@/lib/auth";
import { onProductsChanged } from "@/lib/socket";
import { useIsSellerBlocked } from "@/contexts/SellerAuthContext";
import { cn } from "@/lib/utils";
import type { SellerProduct } from "@/types/seller";
import { toast } from "sonner";

const BLOCKED_MESSAGE = "Your seller account is blocked. You cannot change inventory until it is reactivated.";

export default function SellerInventory() {
  const isBlocked = useIsSellerBlocked();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [thresholdDraft, setThresholdDraft] = useState<Record<string, number>>({});
  const lowStock = getLowStockProducts(products);

  const refetch = useCallback(() => {
    const token = getToken();
    if (!token) return;
    fetchSellerProducts(token)
      .then(setProducts)
      .catch(() => setProducts((prev) => prev));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchSellerProducts(token)
      .then(setProducts)
      .catch(() => {
        setProducts([]);
        toast.error("Failed to load inventory");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = onProductsChanged(refetch);
    return unsub;
  }, [refetch]);

  function setThreshold(id: string, value: number) {
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error("Please sign in to update inventory");
      return;
    }
    setUpdatingId(id);
    patchSellerProductInventory(token, id, { lowStockThreshold: value })
      .then((updated) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        setThresholdDraft((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast.success("Low-stock threshold updated");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to update threshold"))
      .finally(() => setUpdatingId(null));
  }

  function handleThresholdBlur(id: string, value: number) {
    const product = products.find((p) => p.id === id);
    if (!product || value === product.lowStockThreshold) return;
    setThreshold(id, value);
  }

  function quickRestock(id: string, add: number) {
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error("Please sign in to update inventory");
      return;
    }
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const newStock = product.stock + add;
    setUpdatingId(id);
    patchSellerProductInventory(token, id, { stock: newStock })
      .then((updated) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        toast.success(`Restocked +${add} units`);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to restock"))
      .finally(() => setUpdatingId(null));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <WaveSeparator />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <WaveSeparator />
        <Card className="rounded-2xl border-border/80 overflow-hidden">
          <CardContent className="p-0">
            <EmptyState
              icon={Package}
              title="No products"
              description="Add products first to manage inventory."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WaveSeparator />
      {lowStock.length > 0 && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm font-medium text-foreground">
              {lowStock.length} product{lowStock.length !== 1 ? "s" : ""} below low-stock threshold.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label="Stock levels">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30">
                <th className="text-left font-medium py-3 px-4">Product</th>
                <th className="text-right font-medium py-3 px-4">Stock</th>
                <th className="text-right font-medium py-3 px-4">Low-stock threshold</th>
                <th className="text-right font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.stock <= p.lowStockThreshold;
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-muted/20 transition-colors",
                      isLow && "bg-amber-500/5",
                    )}
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={isLow ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Input
                        type="number"
                        min={0}
                        value={thresholdDraft[p.id] ?? p.lowStockThreshold}
                        disabled={isBlocked || updatingId === p.id}
                        onChange={(e) =>
                          setThresholdDraft((prev) => ({ ...prev, [p.id]: Number(e.target.value) || 0 }))
                        }
                        onBlur={(e) => handleThresholdBlur(p.id, Number(e.target.value) || 0)}
                        className="w-20 h-8 text-right rounded-lg inline-block"
                        aria-label={`Low-stock threshold for ${p.name}`}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        disabled={isBlocked || updatingId === p.id}
                        onClick={() => quickRestock(p.id, 10)}
                      >
                        {updatingId === p.id ? "..." : "+10 restock"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
