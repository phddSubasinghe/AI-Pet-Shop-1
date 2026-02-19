import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { getStoredUser, getToken } from "@/lib/auth";
import { fetchMyOrders } from "@/lib/api/orders";
import type { CustomerOrder, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";

function formatPrice(amount: number) {
  return `LKR ${amount.toLocaleString()}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    New: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    Processing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    Shipped: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    Delivered: "bg-green-500/15 text-green-700 dark:text-green-300",
    Cancelled: "bg-red-500/15 text-red-700 dark:text-red-300",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

export default function AdopterOrders() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const isAdopter = user?.role === "adopter";
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true, state: { from: "/profile/orders" } });
      return;
    }
    if (!isAdopter) {
      navigate("/profile", { replace: true });
      return;
    }
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMyOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, isAdopter, navigate]);

  if (!user || !isAdopter) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <main className="pt-16">
        <section className="py-12 px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <Button variant="ghost" size="sm" className="rounded-full -ml-2 mb-6" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to profile
              </Link>
            </Button>
            <h1 className="text-3xl font-bold font-display text-foreground mb-2">My orders</h1>
            <p className="text-muted-foreground mb-8">View and track your orders.</p>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card className="rounded-2xl border-border/80 overflow-hidden">
                <CardContent className="py-16 text-center">
                  <Package className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                  <Button className="rounded-full" asChild>
                    <Link to="/pet-store/products">Browse products</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="rounded-2xl border-border/80 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(-8)} · {formatDate(order.createdAt)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">{order.address}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <ul className="space-y-2 border-t border-border/80 pt-4">
                        {order.items.map((item, i) => (
                          <li
                            key={`${item.productId}-${i}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-foreground">
                              {item.productName} × {item.quantity}
                            </span>
                            <span className="text-muted-foreground">
                              {formatPrice(item.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-right font-semibold text-foreground mt-3 pt-2 border-t border-border/80">
                        Total: {formatPrice(order.total)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
