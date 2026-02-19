import { useState, useMemo, useEffect, useCallback } from "react";
import { getStoredUser } from "@/lib/auth";
import { fetchShelterRequests, updateShelterRequestStatus } from "@/lib/api/shelter";
import { onAdoptionRequestsChanged } from "@/lib/socket";
import type { AdoptionRequest, RequestStatus } from "@/types/shelter";
import { RequestCard } from "@/components/shelter/RequestCard";
import { RequestListRow } from "@/components/shelter/RequestListRow";
import { RequestDetailDrawer } from "@/components/shelter/RequestDetailDrawer";
import { EmptyState } from "@/components/shelter/EmptyState";
import { FileQuestion, LayoutGrid, List, Search, Calendar, Filter } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type DateFilterType = "none" | "date" | "range";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "New", label: "New" },
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

export default function ShelterRequests() {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdoptionRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>(() => String(new Date().getMonth()));
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("none");
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(undefined);

  const shelterId = getStoredUser()?.id ?? null;

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchShelterRequests();
      setRequests(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!shelterId) return;
    const unsubscribe = onAdoptionRequestsChanged((payload) => {
      if (payload.shelterId === shelterId) loadRequests();
    });
    return unsubscribe;
  }, [shelterId, loadRequests]);

  const filtered = useMemo(() => {
    let result = [...requests];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.adopterName.toLowerCase().includes(q) ||
          r.adopterEmail.toLowerCase().includes(q) ||
          r.petName.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (monthFilter !== "none") {
      const monthIndex = parseInt(monthFilter, 10);
      result = result.filter((r) => new Date(r.appliedAt).getMonth() === monthIndex);
    }
    if (dateFilterType === "date" && singleDate) {
      const dayStart = startOfDay(singleDate);
      const dayEnd = endOfDay(singleDate);
      result = result.filter((r) => {
        const d = new Date(r.appliedAt);
        return d >= dayStart && d <= dayEnd;
      });
    } else if (dateFilterType === "range" && dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      result = result.filter((r) => {
        const d = new Date(r.appliedAt);
        return isWithinInterval(d, { start: from, end: to });
      });
    }
    return result;
  }, [requests, search, statusFilter, monthFilter, dateFilterType, singleDate, dateRange]);

  const openDetail = (request: AdoptionRequest) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
  };

  const updateStatus = async (id: string, status: RequestStatus) => {
    try {
      const updated = await updateShelterRequestStatus(id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
      );
      if (selectedRequest?.id === id) setSelectedRequest((r) => (r ? { ...r, status: updated.status } : null));
      setDrawerOpen(false);
      toast.success(`Request ${status.toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const clearDateFilters = () => {
    setMonthFilter("none");
    setDateFilterType("none");
    setSingleDate(undefined);
    setDateRange(undefined);
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    clearDateFilters();
  };

  if (loading) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Loading requests…"
        description="Fetching adoption requests from the shelter."
      />
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="No adoption requests yet"
        description="When adopters sign in and apply to adopt your pets, requests will appear here in real time."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by adopter, pet, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full"
          aria-label="Search requests"
        />
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] rounded-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[160px] rounded-full">
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
                className="rounded-full gap-1.5"
                aria-label="Pick a date"
              >
                <Calendar className="h-4 w-4" />
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
                className="rounded-full gap-1.5"
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

          {(monthFilter !== "none" || dateFilterType !== "none" || singleDate || dateRange) && (
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={clearDateFilters}>
              Clear dates
            </Button>
          )}
        </div>

        <div className="flex rounded-full border border-border bg-muted/30 p-0.5 ml-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full h-8 px-3"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full h-8 px-3"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No requests match your filters"
          description="Try adjusting search or filter criteria."
          action={
            <Button variant="outline" className="rounded-full" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((req) => (
            <RequestCard key={req.id} request={req} onViewDetails={openDetail} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/80">
                <TableHead>Adopter</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Pet</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <RequestListRow key={req.id} request={req} onViewDetails={openDetail} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RequestDetailDrawer
        request={selectedRequest}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onApprove={(id) => updateStatus(id, "Approved")}
        onReject={(id) => updateStatus(id, "Rejected")}
        onRequestInfo={() => toast.info("Request more info (mock)")}
        onScheduleInterview={(id) => updateStatus(id, "Interview Scheduled")}
      />
    </div>
  );
}
