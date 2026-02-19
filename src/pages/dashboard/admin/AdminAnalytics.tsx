import { useEffect, useState, useMemo, useCallback } from "react";
import { Lightbulb, Download, X } from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import {
  AdminGlassCard,
  AdminGlassCardHeader,
  AdminGlassCardTitle,
  AdminGlassCardContent,
} from "@/components/admin/AdminGlassCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLKR } from "@/lib/adminUtils";
import { fetchAdminAnalytics, type AdminAnalyticsResponse } from "@/lib/api/admin";
import { downloadAdminAnalyticsReportPdf } from "@/lib/adminAnalyticsReportPdf";

type FilterPreset = "month" | "thisYear" | "today" | "lastWeek" | "lastMonth";

const MONTH_OPTIONS = [
  { value: "12months", label: "Last 12 months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDateRangeForMonth(
  monthValue: string,
  year: number
): { startDate: string; endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (monthValue === "12months") {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    return { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(today) };
  }
  const monthIndex = parseInt(monthValue, 10);
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    const start = new Date(today);
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    return { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(today) };
  }
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  return { startDate: toYYYYMMDD(first), endDate: toYYYYMMDD(last) };
}

function getDateRangeForPreset(preset: FilterPreset): { startDate: string; endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "thisYear": {
      const jan = new Date(today.getFullYear(), 0, 1);
      return { startDate: toYYYYMMDD(jan), endDate: toYYYYMMDD(today) };
    }
    case "today":
      return { startDate: toYYYYMMDD(today), endDate: toYYYYMMDD(today) };
    case "lastWeek": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: toYYYYMMDD(start), endDate: toYYYYMMDD(today) };
    }
    case "lastMonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toYYYYMMDD(first), endDate: toYYYYMMDD(last) };
    }
    default:
      return getDateRangeForMonth("12months", now.getFullYear());
  }
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6">
        <Skeleton className="h-6 w-48 mb-6 rounded-lg" />
        <div className="flex items-end gap-2 min-h-[280px] h-72">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-lg min-h-[40px]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6">
          <Skeleton className="h-6 w-56 mb-6 rounded-lg" />
          <div className="flex items-end gap-2 min-h-[240px] h-64">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-lg min-h-[24px]" />
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6">
          <Skeleton className="h-6 w-44 mb-6 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6">
        <Skeleton className="h-6 w-56 mb-4 rounded-lg" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-3xl shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-xs rounded-lg" />
        </div>
      </div>
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6">
        <Skeleton className="h-6 w-32 mb-4 rounded-lg" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function exportReport(data: AdminAnalyticsResponse) {
  const rows: string[][] = [
    ["PawPop Admin Analytics Report"],
    ["Date range", `${data.startDate} to ${data.endDate}`],
    [],
    ["Donations by month", "Amount (LKR)"],
    ...data.donationsByMonth.map((d) => [d.month, String(d.amount)]),
    [],
    ["Adoption requests by status", "Count"],
    ...data.adoptionRequestsByStatus.map((s) => [s.status, String(s.count)]),
    [],
    ["Most adopted pet types", "Count"],
    ...data.topAdoptedPetTypes.map((t) => [t.species, String(t.count)]),
    [],
    ["Summary", ""],
    ["Average AI compatibility score", `${data.averageAiCompatibilityScore}%`],
    ["Total users", String(data.totalUsers)],
    ["Verified shelters", String(data.verifiedShelters)],
    ["Verified sellers", String(data.verifiedSellers)],
    ["Active pets listed", String(data.activePetsListed)],
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pawpop-analytics-${data.startDate}-to-${data.endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PRESETS: { value: FilterPreset; label: string }[] = [
  { value: "thisYear", label: "Jan – Dec (this year)" },
  { value: "today", label: "Today" },
  { value: "lastWeek", label: "Last week" },
  { value: "lastMonth", label: "Last month" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2];

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<FilterPreset>("month");
  const [selectedMonth, setSelectedMonth] = useState<string>("12months");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const load = useCallback(async (range: { startDate: string; endDate: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAnalytics({ startDate: range.startDate, endDate: range.endDate });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (preset === "month") {
      load(getDateRangeForMonth(selectedMonth, selectedYear));
    } else {
      load(getDateRangeForPreset(preset));
    }
  }, [preset, selectedMonth, selectedYear, load]);

  const handlePresetClick = (p: FilterPreset) => {
    if (p === "month") return;
    setPreset(p);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    setPreset("month");
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(parseInt(value, 10));
    setPreset("month");
  };

  const handleClear = () => {
    setPreset("month");
    setSelectedMonth("12months");
    setSelectedYear(currentYear);
    load(getDateRangeForMonth("12months", currentYear));
  };

  const { maxDonations, maxAdoptionCount, maxPetTypeCount, insights } = useMemo(() => {
    if (!data) {
      return { maxDonations: 1, maxAdoptionCount: 1, maxPetTypeCount: 1, insights: [] as string[] };
    }
    const maxDonations = Math.max(...data.donationsByMonth.map((d) => d.amount), 1);
    const maxAdoptionCount = Math.max(...data.adoptionRequestsByStatus.map((s) => s.count), 1);
    const maxPetTypeCount = Math.max(...data.topAdoptedPetTypes.map((t) => t.count), 1);

    const peakMonth = data.donationsByMonth.length
      ? data.donationsByMonth.reduce((best, d) => (d.amount > best.amount ? d : best), data.donationsByMonth[0])
      : null;
    const underReview = data.adoptionRequestsByStatus.find((s) => s.status === "Under Review")?.count ?? 0;
    const interviewScheduled = data.adoptionRequestsByStatus.find((s) => s.status === "Interview Scheduled")?.count ?? 0;
    const topType = data.topAdoptedPetTypes[0];
    const insights: string[] = [];
    if (peakMonth && peakMonth.amount > 0) {
      insights.push(
        `Donations peaked in ${peakMonth.month} at ${formatLKR(peakMonth.amount)}.`
      );
    }
    if (underReview > 0 || interviewScheduled > 0) {
      insights.push(
        `Adoption requests in "Under Review" (${underReview}) and "Interview Scheduled" (${interviewScheduled}) indicate pipeline activity.`
      );
    }
    if (topType) {
      insights.push(
        `${topType.species} is the most adopted pet type (${topType.count} adoption${topType.count !== 1 ? "s" : ""})${data.topAdoptedPetTypes.length > 1 ? `, followed by ${data.topAdoptedPetTypes.slice(1).map((t) => t.species).join(", ")}.` : "."}`
      );
    }
    insights.push(
      `Average AI compatibility score is ${data.averageAiCompatibilityScore}% — consider surfacing high-match requests first.`
    );
    insights.push(
      `Platform has ${data.verifiedShelters} verified shelters and ${data.verifiedSellers} verified sellers; ${data.activePetsListed} active pet listings (${data.totalUsers} total users).`
    );

    return { maxDonations, maxAdoptionCount, maxPetTypeCount, insights };
  }, [data]);

  if (error) {
    return (
      <div className="space-y-8">
        <AdminWaveSeparator />
        <AdminErrorState
          title="Could not load analytics"
          description={error}
          onRetry={() =>
      preset === "month"
        ? load(getDateRangeForMonth(selectedMonth, selectedYear))
        : load(getDateRangeForPreset(preset))
    }
        />
      </div>
    );
  }

  const showContent = !loading && data;

  return (
    <div className="space-y-8">
      <AdminWaveSeparator />

      <section className="flex flex-wrap items-center gap-3" aria-label="Date filter and export">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px] rounded-full h-9" aria-label="Select month">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {MONTH_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="rounded-lg">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMonth !== "12months" && (
            <Select
              value={String(selectedYear)}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px] rounded-full h-9" aria-label="Select year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="rounded-lg">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={preset === p.value ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handlePresetClick(p.value)}
            >
              {p.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
        {showContent && data && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2"
              onClick={() => exportReport(data)}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2"
              onClick={() => downloadAdminAnalyticsReportPdf(data)}
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}
      </section>

      {loading || !data ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {data.startDate && data.endDate && (
            <p className="text-sm text-muted-foreground">
              Showing data from <strong>{data.startDate}</strong> to <strong>{data.endDate}</strong>.
            </p>
          )}

          <section aria-label="Donations by month">
            <AdminGlassCard>
              <AdminGlassCardHeader>
                <AdminGlassCardTitle>Donations by month</AdminGlassCardTitle>
              </AdminGlassCardHeader>
              <AdminGlassCardContent>
                {data.donationsByMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center rounded-2xl bg-muted/30">
                    No donation data for the selected period.
                  </p>
                ) : (
                  <div className="flex gap-2 min-h-[280px] h-72 items-end" role="img" aria-label="Bar chart of donations by month">
                    {data.donationsByMonth.map((d) => {
                      const pct = maxDonations > 0 && d.amount > 0 ? (d.amount / maxDonations) * 100 : 0;
                      return (
                        <div
                          key={d.month}
                          className="flex-1 flex flex-col items-center gap-2 h-full min-w-0"
                        >
                          <div className="flex-1 w-full flex flex-col justify-end min-h-0">
                            <div
                              className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                              style={{
                                height: `${pct}%`,
                                minHeight: d.amount > 0 ? "4px" : "0",
                              }}
                              title={`${d.month}: ${formatLKR(d.amount)}`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground truncate w-full text-center shrink-0">
                            {d.month.replace(/\s\d{4}$/, "")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AdminGlassCardContent>
            </AdminGlassCard>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Adoptions and pet types">
            <AdminGlassCard>
              <AdminGlassCardHeader>
                <AdminGlassCardTitle>Adoption requests by status</AdminGlassCardTitle>
              </AdminGlassCardHeader>
              <AdminGlassCardContent>
                {data.adoptionRequestsByStatus.every((s) => s.count === 0) ? (
                  <p className="text-sm text-muted-foreground py-8 text-center rounded-2xl bg-muted/30">
                    No adoption requests in this period.
                  </p>
                ) : (
                  <div className="flex gap-2 min-h-[240px] h-64 items-end" role="img" aria-label="Bar chart of adoption requests by status">
                    {data.adoptionRequestsByStatus.map((s) => {
                      const pct = maxAdoptionCount > 0 && s.count > 0 ? (s.count / maxAdoptionCount) * 100 : 0;
                      return (
                        <div
                          key={s.status}
                          className="flex-1 flex flex-col items-center gap-2 h-full min-w-0"
                        >
                          <div className="flex-1 w-full flex flex-col justify-end min-h-0">
                            <div
                              className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                              style={{
                                height: `${pct}%`,
                                minHeight: s.count > 0 ? "4px" : "0",
                              }}
                              title={`${s.status}: ${s.count}`}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground truncate w-full text-center shrink-0">
                            {s.status.replace(/\s/g, "\n").split("\n")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AdminGlassCardContent>
            </AdminGlassCard>

            <AdminGlassCard>
              <AdminGlassCardHeader>
                <AdminGlassCardTitle>Most adopted pet types</AdminGlassCardTitle>
              </AdminGlassCardHeader>
              <AdminGlassCardContent>
                {data.topAdoptedPetTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center rounded-2xl bg-muted/30">
                    No approved adoptions in this period.
                  </p>
                ) : (
                  <ul className="space-y-3" role="list">
                    {data.topAdoptedPetTypes.map((t) => (
                      <li key={t.species} className="flex items-center gap-3">
                        <span className="font-medium w-20">{t.species}</span>
                        <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/80 transition-all"
                            style={{
                              width: `${Math.max(10, (t.count / maxPetTypeCount) * 100)}%`,
                            }}
                            aria-label={`${t.species}: ${t.count}`}
                          />
                        </div>
                        <span className="text-sm tabular-nums w-8 text-right">{t.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </AdminGlassCardContent>
            </AdminGlassCard>
          </section>

          <section aria-label="Average AI score">
            <AdminGlassCard>
              <AdminGlassCardHeader>
                <AdminGlassCardTitle>Average AI compatibility score</AdminGlassCardTitle>
              </AdminGlassCardHeader>
              <AdminGlassCardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary text-2xl font-bold tabular-nums">
                    {data.averageAiCompatibilityScore}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Average match score across adoption requests with an AI score (in selected period).
                  </p>
                </div>
              </AdminGlassCardContent>
            </AdminGlassCard>
          </section>

          <section aria-label="Insights">
            <AdminGlassCard>
              <AdminGlassCardHeader>
                <AdminGlassCardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" aria-hidden />
                  Insights
                </AdminGlassCardTitle>
              </AdminGlassCardHeader>
              <AdminGlassCardContent>
                {insights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No insights for this period yet.</p>
                ) : (
                  <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
                    {insights.map((text, i) => (
                      <li key={i} className="text-foreground/90">
                        {text}
                      </li>
                    ))}
                  </ul>
                )}
              </AdminGlassCardContent>
            </AdminGlassCard>
          </section>
        </>
      )}
    </div>
  );
}
