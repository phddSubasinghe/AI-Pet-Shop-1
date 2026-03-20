import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Clock,
  Wallet,
  Package,
  Star,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { StatCard } from "@/components/seller/StatCard";
import { getToken } from "@/lib/auth";
import { fetchSellerOverview } from "@/lib/api/seller";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SellerOrder } from "@/types/seller";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: SellerOrder["status"] }) {
  const styles: Record<SellerOrder["status"], string> = {
    New: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    Processing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    Shipped: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    Delivered: "bg-green-500/15 text-green-700 dark:text-green-300",
    Cancelled: "bg-red-500/15 text-red-700 dark:text-red-300",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {status}
    </span>
  );
}

export default function SellerOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    todaysOrders: number;
    pendingOrders: number;
    monthRevenue: number;
    lowStockCount: number;
    lowStockProducts: { id: string; name: string; stock: number; lowStockThreshold: number }[];
    averageRating: number;
    reviewCount: number;
    deliverySuccessRate: number;
    cancelRate: number;
    sellerScorePercent: number;
    topSelling: { id: string; name: string; stock: number }[];
    recentOrders: SellerOrder[];
  } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchSellerOverview(token)
      .then(setData)
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load overview");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <WaveSeparator />
        <Card className="rounded-2xl border-border/80 overflow-hidden">
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading overview…
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentOrders = data?.recentOrders ?? [];
  const topSelling = data?.topSelling ?? [];
  const lowStock = data?.lowStockProducts ?? [];

  return (
    <div className="space-y-6">
      <WaveSeparator />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Today's Orders" value={data?.todaysOrders ?? 0} icon={ShoppingCart} />
        <StatCard label="Pending Orders" value={data?.pendingOrders ?? 0} icon={Clock} />
        <StatCard label="Revenue (this month)" value={formatCurrency(data?.monthRevenue ?? 0)} icon={Wallet} />
        <StatCard
          label="Low Stock Items"
          value={data?.lowStockCount ?? 0}
          icon={Package}
          subtitle={lowStock.length ? "Needs restock" : undefined}
        />
        <StatCard label="Average Rating" value={(data?.averageRating ?? 0).toFixed(1)} icon={Star} />
        <StatCard
          label="Seller Score"
          value={`${data?.sellerScorePercent ?? 0}%`}
          icon={TrendingUp}
          subtitle="Important"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="overflow-hidden rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/80 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display">Recent Orders</CardTitle>
              <Button variant="ghost" size="sm" className="rounded-full -mr-2" asChild>
                <Link to="/dashboard/seller/orders" className="flex items-center gap-1">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table" aria-label="Recent orders">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30">
                      <th className="text-left font-medium py-3 px-4">Order ID</th>
                      <th className="text-left font-medium py-3 px-4">Date</th>
                      <th className="text-left font-medium py-3 px-4">Customer</th>
                      <th className="text-right font-medium py-3 px-4">Total</th>
                      <th className="text-left font-medium py-3 px-4">Status</th>
                      <th className="w-10" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">{order.id}</td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4">{order.customerName}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                            <Link to={`/dashboard/seller/orders?order=${order.id}`} aria-label={`View order ${order.id}`}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card className="overflow-hidden rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/80 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display">Product Performance</CardTitle>
              <Button variant="ghost" size="sm" className="rounded-full -mr-2" asChild>
                <Link to="/dashboard/seller/products" className="flex items-center gap-1">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">Top selling</p>
              {topSelling.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No products yet.</p>
              ) : (
                topSelling.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-sm text-muted-foreground">Stock: {p.stock}</span>
                  </div>
                ))
              )}
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 mt-2">Low stock</p>
              {lowStock.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">All good.</p>
              ) : (
                lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-sm text-amber-600 dark:text-amber-400">{p.stock} left</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
