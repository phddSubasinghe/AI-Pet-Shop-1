import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUi } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { EmptyState } from "@/components/shelter/EmptyState";
import { getToken } from "@/lib/auth";
import { fetchSellerOrders, updateSellerOrderStatus } from "@/lib/api/seller";
import { onOrdersChanged } from "@/lib/socket";
import { useIsSellerBlocked } from "@/contexts/SellerAuthContext";
import { toast } from "sonner";

const BLOCKED_MESSAGE = "Your seller account is blocked. You cannot update orders until it is reactivated.";
import { cn } from "@/lib/utils";
import type { SellerOrder, OrderStatus } from "@/types/seller";

const statusOptions: OrderStatus[] = ["New", "Processing", "Shipped", "Delivered", "Cancelled"];
const isValidStatus = (s: string): s is OrderStatus => statusOptions.includes(s as OrderStatus);
type StatusFilter = OrderStatus | "All";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentMonthValue = String(new Date().getMonth() + 1); // 1-12

type DateRange = { from: Date; to?: Date };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatDateRange(range: DateRange): string {
  const fromStr = range.from.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (!range.to || range.to.getTime() === range.from.getTime()) return fromStr;
  const toStr = range.to.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${fromStr} – ${toStr}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {status}
    </span>
  );
}

export default function SellerOrders() {
  const isBlocked = useIsSellerBlocked();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const today = useMemo(() => startOfDay(new Date()), []);
  const [dateRange, setDateRange] = useState<DateRange>(() => ({ from: today, to: today }));
  const [monthFilter, setMonthFilter] = useState<string>(currentMonthValue);

  const refetch = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const list = await fetchSellerOrders(token);
      setOrders(list);
      setSelectedOrder((prev) => {
        if (!prev) return null;
        const updated = list.find((o) => o.id === prev.id);
        return updated ?? prev;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsub = onOrdersChanged(refetch);
    return unsub;
  }, [refetch]);

  const statusParam = searchParams.get("status");
  const orderIdParam = searchParams.get("order");
  const statusFilter: StatusFilter =
    statusParam === "All" || (statusParam && isValidStatus(statusParam)) ? (statusParam as StatusFilter) : "All";

  function setStatusInUrl(status: StatusFilter) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (status === "All") next.delete("status");
      else next.set("status", status);
      return next;
    });
  }

  function handleStatusSelect(value: string) {
    setStatusInUrl(value === "All" ? "All" : (value as OrderStatus));
  }

  // Open order drawer from URL ?order=id
  useEffect(() => {
    if (!orderIdParam) return;
    const order = orders.find((o) => o.id === orderIdParam);
    if (order) {
      setSelectedOrder(order);
      setDrawerOpen(true);
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        n.set("order", orderIdParam);
        n.set("status", order.status);
        return n;
      });
    }
  }, [orderIdParam]);

  async function updateStatus(orderId: string, newStatus: OrderStatus) {
    if (isBlocked) {
      toast.error(BLOCKED_MESSAGE);
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error("Please sign in again.");
      return;
    }
    try {
      const updated = await updateSellerOrderStatus(token, orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSelectedOrder((prev) => (prev?.id === orderId ? updated : prev));
      setStatusInUrl(newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rangeFrom = dateRange.from ? startOfDay(dateRange.from) : null;
    const rangeTo = dateRange.to ? endOfDay(dateRange.to) : dateRange.from ? endOfDay(dateRange.from) : null;

    let result = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (rangeFrom && orderDate < rangeFrom) return false;
      if (rangeTo && orderDate > rangeTo) return false;
      if (!q) return true;
      const matchId = o.id.toLowerCase().includes(q);
      const matchCustomer = o.customerName.toLowerCase().includes(q);
      const matchEmail = o.customerEmail.toLowerCase().includes(q);
      const matchAddress = (o.address ?? "").toLowerCase().includes(q);
      const matchProduct = o.items.some((i) => i.productName.toLowerCase().includes(q));
      return matchId || matchCustomer || matchEmail || matchAddress || matchProduct;
    });

    if (statusFilter !== "All") result = result.filter((o) => o.status === statusFilter);
    if (monthFilter !== "All") {
      const monthNum = parseInt(monthFilter, 10);
      result = result.filter((o) => new Date(o.createdAt).getMonth() === monthNum - 1);
    }
    return result;
  }, [orders, search, dateRange, statusFilter, monthFilter]);

  return (
    <div className="space-y-6">
      <WaveSeparator />
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" aria-hidden />
          <Input
            placeholder="Search by order ID, customer, email, address, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-border/80 bg-background/50 backdrop-blur-sm"
            aria-label="Search orders"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "rounded-xl min-w-[240px] justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
              aria-label="Select date range"
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden />
              {dateRange?.from ? formatDateRange(dateRange) : "Pick a range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
            <CalendarUi
              mode="range"
              defaultMonth={dateRange?.from ?? new Date()}
              selected={dateRange}
              onSelect={(range) => range && setDateRange(range)}
              numberOfMonths={1}
            />
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-lg"
                onClick={() => setDateRange({ from: today, to: today })}
              >
                Reset to today
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Select value={statusFilter} onValueChange={handleStatusSelect}>
          <SelectTrigger className="w-[160px] rounded-xl" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="All" className="rounded-lg">All</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[120px] rounded-xl" aria-label="Filter by month">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="All" className="rounded-lg">All months</SelectItem>
            {monthLabels.map((label, i) => (
              <SelectItem key={i} value={String(i + 1)} className="rounded-lg">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card className="rounded-2xl border-border/80 overflow-hidden">
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading orders…
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-border/80 overflow-hidden">
          <CardContent className="p-0">
            <EmptyState
              icon={Package}
              title={orders.length === 0 ? "No orders yet" : "No orders found"}
              description={
                orders.length === 0
                  ? "Orders from adopters will appear here in real time."
                  : "Orders matching your filters will appear here. Try adjusting status or month."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card
              key={order.id}
              className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden transition-all hover:shadow-md cursor-pointer"
              onClick={() => {
                setSelectedOrder(order);
                setDrawerOpen(true);
                setSearchParams((prev) => {
                  const n = new URLSearchParams(prev);
                  n.set("order", order.id);
                  n.set("status", order.status);
                  return n;
                });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedOrder(order);
                  setDrawerOpen(true);
                  setSearchParams((prev) => {
                    const n = new URLSearchParams(prev);
                    n.set("order", order.id);
                    n.set("status", order.status);
                    return n;
                  });
                }
              }}
              aria-label={`View order ${order.id}`}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium text-foreground">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.customerName} · {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete("order"); return n; });
        }}
      >
        <SheetContent className="w-full sm:max-w-lg rounded-l-2xl border-l border-border/80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Order details</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Order ID</p>
                <p className="font-mono font-medium">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date placed</p>
                <p className="text-sm text-foreground">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delivery address</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedOrder.address}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <li key={i} className="flex justify-between gap-2 text-sm">
                      <span className="min-w-0">
                        {item.productName} × {item.quantity}
                        {item.unitPrice != null && (
                          <span className="text-muted-foreground font-normal ml-1">
                            @ {formatCurrency(item.unitPrice)} each
                          </span>
                        )}
                      </span>
                      <span className="shrink-0">{formatCurrency(item.total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 pt-2 space-y-1 border-t border-border text-sm">
                  {selectedOrder.subtotal != null && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                  )}
                  {selectedOrder.shipping != null && selectedOrder.shipping > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>{formatCurrency(selectedOrder.shipping)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-foreground pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</p>
                <p className="text-sm text-foreground">
                  {selectedOrder.paymentMethod === "card" && selectedOrder.cardLast4
                    ? `Card •••• ${selectedOrder.cardLast4}`
                    : selectedOrder.paymentMethod === "cash"
                      ? "Cash on delivery"
                      : selectedOrder.paymentMethod === "bank"
                        ? "Bank transfer"
                        : selectedOrder.paymentMethod
                          ? String(selectedOrder.paymentMethod)
                          : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status timeline</p>
                <ul className="space-y-1 text-sm">
                  {(selectedOrder.statusHistory ?? []).map((h, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{h.status}</span>
                      <span className="text-muted-foreground">{formatDate(h.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.filter((s) => s !== selectedOrder.status).map((s) => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      disabled={isBlocked}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                    >
                      Mark {s}
                    </Button>
                  ))}
                </div>
                {isBlocked && (
                  <p className="text-xs text-muted-foreground mt-2">Your account is blocked. You cannot change order status.</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
