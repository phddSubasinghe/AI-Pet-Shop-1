import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Building2,
  EyeOff,
  Eye,
  ExternalLink,
  Search,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { AdminWaveSeparator } from "@/components/admin/AdminWaveSeparator";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchAdminEvents, updateAdminEventBlock, type AdminEvent } from "@/lib/api/admin";
import { eventBannerUrl } from "@/lib/api/events";
import { onEventsChanged } from "@/lib/socket";
import { toast } from "sonner";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterBlocked, setFilterBlocked] = useState<"all" | "blocked" | "visible">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [eventToBlock, setEventToBlock] = useState<AdminEvent | null>(null);

  const refetch = useCallback(() => {
    setError(null);
    fetchAdminEvents()
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminEvents()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = onEventsChanged(refetch);
    return unsub;
  }, [refetch]);

  const filtered = events.filter((ev) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      ev.shelterName.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q);
    const matchFilter =
      filterBlocked === "all" ||
      (filterBlocked === "blocked" && ev.blocked) ||
      (filterBlocked === "visible" && !ev.blocked);
    return matchSearch && matchFilter;
  });

  const handleToggleBlock = async (ev: AdminEvent) => {
    setUpdatingId(ev.id);
    try {
      await updateAdminEventBlock(ev.id, !ev.blocked);
      toast.success(ev.blocked ? "Event is now visible to adopters" : "Event is now hidden from adopters");
      setEventToBlock(null);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const openBlockConfirm = (ev: AdminEvent) => {
    if (ev.blocked) return;
    setEventToBlock(ev);
  };

  const confirmBlock = () => {
    if (!eventToBlock) return;
    handleToggleBlock(eventToBlock);
  };

  return (
    <div className="space-y-6">
      <AdminWaveSeparator />
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, shelter, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "visible", "blocked"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filterBlocked === f ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setFilterBlocked(f)}
                >
                  {f === "all" ? "All" : f === "blocked" ? "Blocked" : "Visible"}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <AdminEmptyState
              title={events.length === 0 ? "No events yet" : "No events match your filters"}
              description={
                events.length === 0
                  ? "Events created by shelters will appear here."
                  : "Try changing search or filter."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((ev) => (
                <div
                  key={ev.id}
                  className={`rounded-xl border overflow-hidden bg-card transition-all ${
                    ev.blocked ? "opacity-75 border-destructive/30" : "border-border/80"
                  }`}
                >
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    {ev.bannerUrl ? (
                      <img
                        src={eventBannerUrl(ev.bannerUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {ev.blocked && (
                      <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                        <Badge variant="destructive" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Hidden from public
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {ev.shelterName}
                    </p>
                    <h3 className="font-semibold text-foreground mt-0.5 line-clamp-1">{ev.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(ev.date)}
                      {ev.time ? ` · ${ev.time}` : ""}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{ev.location}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{ev.likeCount} likes</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant={ev.blocked ? "default" : "destructive"}
                        size="sm"
                        className="rounded-full gap-1.5"
                        disabled={!!updatingId}
                        onClick={() => (ev.blocked ? handleToggleBlock(ev) : openBlockConfirm(ev))}
                      >
                        {updatingId === ev.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : ev.blocked ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Block
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full gap-1.5" asChild>
                        <Link to={`/events/${ev.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <AlertDialog open={!!eventToBlock} onOpenChange={(open) => !open && setEventToBlock(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">Block this event?</AlertDialogTitle>
                <AlertDialogDescription className="text-left mt-1">
                  {eventToBlock ? (
                    <>
                      <span className="font-medium text-foreground">{eventToBlock.title}</span>
                      {" "}will be hidden from the public and adopters. It will disappear from the home page and events list in real time. You can unblock it later.
                    </>
                  ) : (
                    "This event will be hidden from the public."
                  )}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-2 sm:gap-2 mt-6">
            <AlertDialogCancel className="rounded-full mt-0">Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={!!updatingId}
              onClick={confirmBlock}
            >
              {updatingId === eventToBlock?.id ? "Blocking..." : "Block event"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
