import { useState, useMemo, useEffect } from "react";
import { Heart, Eye, AlertTriangle, ClipboardCheck, Search, Loader2, ExternalLink, Mail, Phone, MapPin, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/adminUtils";
import { fetchAdminAdoptionRequests, escalateAdminAdoptionRequest, updateAdminAdoptionRequestStatus } from "@/lib/api/admin";
import { onAdoptionRequestsChanged } from "@/lib/socket";
import type { AdminAdoptionRequest, AdoptionRequestStatus } from "@/types/admin";
import { toast } from "sonner";

type DateFilterType = "none" | "date" | "range";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All statuses" },
  { value: "Requested", label: "Requested" },
  { value: "Under Review", label: "Under Review" },
  { value: "Interview Scheduled", label: "Interview Scheduled" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
];

const MONTH_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "All months" },
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

export default function AdminAdoptions() {
  const [requests, setRequests] = useState<AdminAdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [monthFilter, setMonthFilter] = useState<string>(() => String(new Date().getMonth()));
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("none");
  const [singleDate, setSingleDate] = useState<Date | undefined>(() => new Date());
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<AdminAdoptionRequest | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const clearDateFilters = () => {
    setMonthFilter("none");
    setDateFilterType("none");
    setSingleDate(new Date());
    setDateRange(undefined);
  };

  const loadRequests = () => {
    fetchAdminAdoptionRequests()
      .then(setRequests)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load adoption requests"));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminAdoptionRequests()
      .then((list) => {
        if (!cancelled) setRequests(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load adoption requests");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAdoptionRequestsChanged(() => {
      loadRequests();
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    let result = [...requests];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          r.adopterName.toLowerCase().includes(q) ||
          r.adopterEmail.toLowerCase().includes(q) ||
          r.petName.toLowerCase().includes(q) ||
          r.petSpecies.toLowerCase().includes(q) ||
          r.shelterName.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (monthFilter !== "none") {
      const monthIndex = parseInt(monthFilter, 10);
      if (!Number.isNaN(monthIndex)) {
        result = result.filter((r) => new Date(r.submittedAt).getMonth() === monthIndex);
      }
    }
    if (dateFilterType === "date" && singleDate) {
      const dayStart = startOfDay(singleDate);
      const dayEnd = endOfDay(singleDate);
      result = result.filter((r) => {
        const d = new Date(r.submittedAt);
        return d >= dayStart && d <= dayEnd;
      });
    } else if (dateFilterType === "range" && dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      result = result.filter((r) => {
        const d = new Date(r.submittedAt);
        return isWithinInterval(d, { start: from, end: to });
      });
    }
    return result;
  }, [requests, search, statusFilter, monthFilter, dateFilterType, singleDate, dateRange]);

  function openDetail(r: AdminAdoptionRequest) {
    setSelected(r);
    setDrawerOpen(true);
  }

  async function escalate(r: AdminAdoptionRequest) {
    if (actioningId) return;
    setActioningId(r.id);
    try {
      const result = await escalateAdminAdoptionRequest(r.id);
      setRequests((prev) =>
        prev.map((req) =>
          req.id === r.id
            ? { ...req, escalated: true, escalatedAt: result.escalatedAt ?? undefined }
            : req
        )
      );
      if (selected?.id === r.id) setSelected((s) => (s ? { ...s, escalated: true, escalatedAt: result.escalatedAt ?? undefined } : null));
      toast.success("Request escalated. The shelter has been notified.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to escalate");
    } finally {
      setActioningId(null);
    }
  }

  async function markForReview(r: AdminAdoptionRequest) {
    if (actioningId) return;
    setActioningId(r.id);
    try {
      const result = await updateAdminAdoptionRequestStatus(r.id, "Under Review");
      setRequests((prev) =>
        prev.map((req) => (req.id === r.id ? { ...req, status: result.status } : req))
      );
      if (selected?.id === r.id) setSelected((s) => (s ? { ...s, status: result.status } : null));
      toast.success("Status set to Under Review. The shelter will see the update.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-destructive/50"
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchAdminAdoptionRequests()
                .then(setRequests)
                .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
                .finally(() => setLoading(false));
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
              aria-hidden
            />
            <Input
              placeholder="Search by adopter, pet, shelter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-border/80 bg-background/50 backdrop-blur-sm"
              aria-label="Search adoption requests"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl border-border/80 bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[160px] rounded-xl border-border/80 bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateFilterType === "date" ? "secondary" : "outline"}
                size="sm"
                className="rounded-xl gap-1.5 border-border/80 bg-background/50 backdrop-blur-sm"
                aria-label="Pick a date"
              >
                <CalendarIcon className="h-4 w-4" />
                {singleDate ? format(singleDate, "d MMM yyyy") : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
              <CalendarUi
                mode="single"
                selected={singleDate}
                onSelect={(d) => {
                  setSingleDate(d);
                  setDateFilterType("date");
                  if (d) setDateRange(undefined);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateFilterType === "range" ? "secondary" : "outline"}
                size="sm"
                className="rounded-xl gap-1.5 border-border/80 bg-background/50 backdrop-blur-sm"
                aria-label="Pick date range"
              >
                <Filter className="h-4 w-4" />
                {dateRange?.from
                  ? dateRange.to
                    ? `${format(dateRange.from, "d MMM")} – ${format(dateRange.to, "d MMM yyyy")}`
                    : format(dateRange.from, "d MMM yyyy")
                  : "Date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
              <CalendarUi
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  if (range?.from) setDateFilterType("range");
                  if (range?.from) setSingleDate(undefined);
                }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-muted-foreground"
            onClick={clearDateFilters}
          >
            Clear dates
          </Button>
        </div>

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={Heart}
            title="No adoption requests"
            description="Adoption requests will appear here. Try adjusting your search or status filter."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
                <AdminGlassCard
                  key={r.id}
                  className="p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {r.adopterName} → {r.petName} ({r.petSpecies})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.shelterName} · {formatDateTime(r.submittedAt)}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <AdminStatusBadge status={r.status} variant="adoption" />
                        {r.escalated && (
                          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="h-3 w-3 mr-1" aria-hidden />
                            Escalated
                          </span>
                        )}
                        <span className="text-sm font-medium text-primary">
                          AI match: {r.aiCompatibilityScore}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => openDetail(r)}
                        aria-label={`View request ${r.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" aria-hidden />
                        View details
                      </Button>
                      {r.status !== "Cancelled" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => escalate(r)}
                            disabled={r.escalated || actioningId === r.id}
                            aria-label={r.escalated ? "Already escalated" : "Escalate"}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" aria-hidden />
                            {r.escalated ? "Escalated" : actioningId === r.id ? "…" : "Escalate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => markForReview(r)}
                            disabled={r.status === "Under Review" || actioningId === r.id}
                            aria-label={r.status === "Under Review" ? "Already under review" : "Mark for review"}
                          >
                            <ClipboardCheck className="h-4 w-4 mr-1" aria-hidden />
                            {r.status === "Under Review" ? "Under review" : actioningId === r.id ? "…" : "Mark for review"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </AdminGlassCard>
              ))}
            </div>
        )}
      </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg rounded-l-3xl border-l border-border/80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Adoption request details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <AdminStatusBadge status={selected.status} variant="adoption" />
                {selected.escalated && (
                  <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3 mr-1" aria-hidden />
                    Escalated
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Adopter contact
                </p>
                <p className="font-semibold text-foreground">{selected.adopterName}</p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${selected.adopterEmail}`} className="text-primary hover:underline">
                    {selected.adopterEmail}
                  </a>
                </p>
                {selected.adopterPhone && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <a href={`tel:${selected.adopterPhone}`} className="text-primary hover:underline">
                      {selected.adopterPhone}
                    </a>
                  </p>
                )}
                {selected.adopterAddress && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{selected.adopterAddress}</span>
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Pet
                </p>
                <p className="font-medium">{selected.petName} ({selected.petSpecies})</p>
                <p className="text-sm text-muted-foreground">{selected.shelterName}</p>
                <Button variant="outline" size="sm" className="rounded-lg mt-2 gap-1.5" asChild>
                  <Link to={`/pet/${selected.petId}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> View pet page
                  </Link>
                </Button>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  AI compatibility
                </p>
                <p className="font-medium text-primary">{selected.aiCompatibilityScore}%</p>
                {selected.aiReasons && selected.aiReasons.length > 0 && (
                  <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                    {selected.aiReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Status timeline
                </p>
                <ul className="space-y-2 text-sm">
                  {(selected.statusHistory ?? []).length > 0
                    ? (selected.statusHistory ?? []).map((h, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{h.status}</span>
                          <span className="text-muted-foreground">{formatDateTime(h.at)}</span>
                        </li>
                      ))
                    : (
                        <li className="text-muted-foreground">Current status: {selected.status}</li>
                      )}
                </ul>
              </div>
              {selected.status !== "Cancelled" && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border/80">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => escalate(selected)}
                    disabled={selected.escalated || actioningId === selected.id}
                    aria-label={selected.escalated ? "Already escalated" : "Escalate"}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" aria-hidden />
                    {selected.escalated ? "Escalated" : actioningId === selected.id ? "…" : "Escalate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => markForReview(selected)}
                    disabled={selected.status === "Under Review" || actioningId === selected.id}
                    aria-label={selected.status === "Under Review" ? "Already under review" : "Mark for review"}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-1" aria-hidden />
                    {selected.status === "Under Review" ? "Under review" : actioningId === selected.id ? "…" : "Mark for review"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
