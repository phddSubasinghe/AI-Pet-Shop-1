import { useState, useEffect } from "react";
import { Wallet, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { StatCard } from "@/components/seller/StatCard";
import { EmptyState } from "@/components/shelter/EmptyState";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/auth";
import { fetchSellerEarnings } from "@/lib/api/seller";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EarningsPeriod } from "@/types/seller";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const PERIOD_OPTIONS: { value: EarningsPeriod; label: string; subtitle: string }[] = [
  { value: "daily", label: "Daily", subtitle: "Last 14 days" },
  { value: "weekly", label: "Weekly", subtitle: "Last 6 weeks" },
  { value: "monthly", label: "Monthly", subtitle: "Last 6 months" },
];

export default function SellerEarnings() {
  const [period, setPeriod] = useState<EarningsPeriod>("monthly");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totalEarnings: number;
    pendingPayout: number;
    period: EarningsPeriod;
    chartData: { label: string; revenue: number }[];
    payouts: { id: string; amount: number; status: string; paidAt?: string; createdAt: string }[];
  } | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSellerEarnings(token, period)
      .then((res) =>
        setData({
          totalEarnings: res.totalEarnings,
          pendingPayout: res.pendingPayout,
          period: res.period,
          chartData: res.chartData ?? [],
          payouts: Array.isArray(res.payouts) ? res.payouts : [],
        })
      )
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Failed to load earnings");
      })
      .finally(() => setLoading(false));
  }, [period]);

  const chartData = data?.chartData ?? [];
  const currentSubtitle = PERIOD_OPTIONS.find((p) => p.value === period)?.subtitle ?? "Last 6 months";
  const maxRevenue = chartData.length ? Math.max(...chartData.map((r) => r.revenue), 1) : 1;

  return (
    <div className="space-y-3 transition-opacity duration-300">
      <WaveSeparator />

      {loading ? (
        <Card className="rounded-2xl border-border/80 overflow-hidden animate-in fade-in duration-200">
          <CardContent className="p-6 text-center text-muted-foreground">
            Loading earnings…
          </CardContent>
        </Card>
      ) : (
        <div className="animate-in fade-in duration-300 space-y-3">
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300">
            <StatCard
              label="Total earnings (Delivered)"
              value={formatCurrency(data?.totalEarnings ?? 0)}
              icon={Wallet}
            />
            <StatCard
              label="Pending payout"
              value={formatCurrency(data?.pendingPayout ?? 0)}
              icon={CreditCard}
            />
            <StatCard label="Trend" value={currentSubtitle} icon={TrendingUp} subtitle="See chart below" />
          </div>

          {/* Period filter + Revenue chart */}
          <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 pb-2">
              <div>
                <h2 className="text-lg font-display font-semibold">Revenue</h2>
                <p className="text-sm text-muted-foreground">From delivered orders</p>
              </div>
              <div className="flex rounded-xl border border-border/80 p-1 bg-muted/30 transition-colors duration-200">
                {PERIOD_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={period === opt.value ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "rounded-lg font-medium transition-all duration-200 ease-out",
                      period === opt.value && "shadow-sm"
                    )}
                    onClick={() => setPeriod(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="transition-opacity duration-300 p-4 pt-0">
              {chartData.length ? (
                <div
                  className="flex gap-2 sm:gap-3 h-52 w-full overflow-x-auto pb-2"
                  role="img"
                  aria-label={`Revenue bar chart by ${period}`}
                >
                  {chartData.map((r, idx) => {
                    const pct = maxRevenue > 0 ? (r.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div
                        key={`${period}-${r.label}-${idx}`}
                        className="flex-1 min-w-[28px] sm:min-w-0 flex flex-col items-center gap-2 h-full animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
                        style={{ animationDelay: `${idx * 25}ms`, animationFillMode: "backwards" }}
                        title={`${r.label}: ${formatCurrency(r.revenue)}`}
                      >
                        <div className="flex-1 w-full min-h-0 flex flex-col justify-end">
                          <div
                            className="w-full rounded-t-md bg-primary/80 transition-[height,background-color] duration-500 ease-out hover:bg-primary"
                            style={{
                              height: `${Math.max(pct, 2)}%`,
                              minHeight: r.revenue > 0 ? "8px" : "0",
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground truncate w-full text-center shrink-0">
                          {r.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center animate-in fade-in duration-300">
                  No revenue in this period.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent payouts – always show section so it’s visible when payouts exist */}
          <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden min-h-[200px] flex flex-col">
            <CardHeader className="p-4 pb-2 shrink-0">
              <h2 className="text-lg font-display font-semibold">
                Recent payouts
                {data?.payouts?.length ? (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({data.payouts.length})
                  </span>
                ) : null}
              </h2>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 min-h-0 flex flex-col">
              {!data?.payouts?.length ? (
                <EmptyState
                  icon={CreditCard}
                  title="No payouts yet"
                  description="Payouts will appear here when processed."
                />
              ) : (
                <div className="space-y-3 overflow-y-auto min-h-0 max-h-[320px] pr-1">
                  {data.payouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-4 transition-colors hover:bg-muted/30 shrink-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{formatCurrency(p.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.status === "paid" && p.paidAt ? `Paid ${formatDate(p.paidAt)}` : "Pending"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          p.status === "paid"
                            ? "bg-green-500/15 text-green-700 dark:text-green-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
