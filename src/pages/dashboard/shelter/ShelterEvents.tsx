import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import type { ShelterEvent } from "@/types/shelter";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shelter/EmptyState";
import { EventFormModal } from "@/components/shelter/EventFormModal";
import { Calendar, Plus, Trash2, MapPin, Ticket, Pencil, ExternalLink, AlertTriangle, EyeOff, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  fetchShelterEvents,
  createShelterEvent,
  updateShelterEvent,
  deleteShelterEvent,
  eventBannerUrl,
  uploadEventBanner,
} from "@/lib/api/shelter";
import { getStoredUser } from "@/lib/auth";
import { onEventsChanged } from "@/lib/socket";
import { toast } from "sonner";

function getMonthDay(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return {
    month: format(d, "MMM").toUpperCase(),
    day: format(d, "d"),
  };
}

export default function ShelterEvents() {
  const isBlocked = getStoredUser()?.status === "blocked";
  const [events, setEvents] = useState<ShelterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ShelterEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ShelterEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const list = await fetchShelterEvents();
      setEvents(list);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsub = onEventsChanged(refetch);
    return unsub;
  }, [refetch]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const openCreate = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const openEdit = (ev: ShelterEvent) => {
    setEditingEvent(ev);
    setModalOpen(true);
  };

  const handleSave = async (values: {
    title: string;
    date: string;
    time?: string;
    location: string;
    description: string;
    bannerUrl?: string;
    priceText?: string;
  }) => {
    try {
      if (editingEvent) {
        await updateShelterEvent(editingEvent.id, {
          title: values.title,
          date: values.date,
          time: values.time,
          location: values.location,
          description: values.description,
          bannerUrl: values.bannerUrl,
          priceText: values.priceText,
        });
        toast.success("Event updated");
      } else {
        await createShelterEvent({
          title: values.title,
          date: values.date,
          time: values.time,
          location: values.location,
          description: values.description,
          bannerUrl: values.bannerUrl,
          priceText: values.priceText,
        });
        toast.success("Event created");
      }
      setModalOpen(false);
      setEditingEvent(null);
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
      throw e;
    }
  };

  const openDeleteConfirm = (ev: ShelterEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;
    setEventToDelete(ev);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setDeletingId(eventToDelete.id);
    try {
      await deleteShelterEvent(eventToDelete.id);
      toast.success("Event deleted");
      setEventToDelete(null);
      await refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatEventDate = (ev: ShelterEvent) => {
    const d = new Date(ev.date);
    if (ev.time) {
      return `${format(d, "d MMM yyyy")}, ${ev.time}`;
    }
    return format(d, "d MMM yyyy");
  };

  const EventCard = ({ ev, isPast, disabled }: { ev: ShelterEvent; isPast: boolean; disabled?: boolean }) => {
    const { month, day } = getMonthDay(ev.date);
    const priceLabel = ev.priceText?.trim() || "Free entry";
    return (
      <div
        className={`relative group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 ${isPast ? "opacity-85 hover:opacity-100" : ""}`}
      >
        {/* Banner with hover zoom */}
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          {ev.bannerUrl ? (
            <img
              src={eventBannerUrl(ev.bannerUrl)}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/5">
              <Calendar className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {ev.blocked && (
            <div className="absolute inset-0 bg-destructive/20 flex flex-col items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-medium text-destructive-foreground">
                <EyeOff className="h-3.5 w-3.5" />
                Hidden from public
              </span>
              <p className="text-xs text-center text-muted-foreground px-3">This event is blocked by admin and is not visible to adopters.</p>
            </div>
          )}
          {/* Overlay actions on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              className="rounded-full gap-2 shadow-lg"
              onClick={() => !disabled && openEdit(ev)}
              disabled={disabled}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full gap-2 shadow-lg"
              asChild
            >
              <Link to={`/events/${ev.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                View live
              </Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
            onClick={(e) => !disabled && openDeleteConfirm(ev, e)}
            disabled={disabled || deletingId === ev.id}
            aria-label="Delete event"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Content: date block | divider | details */}
        <div className="flex p-4 gap-3 bg-background">
          <div className="shrink-0 flex flex-col items-center justify-center w-12">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {month}
            </span>
            <span className="text-2xl font-bold font-display text-primary leading-none mt-0.5">
              {day}
            </span>
          </div>
          <div className="w-px bg-border shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{ev.location}</span>
            </p>
            <h3 className="mt-1 font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {ev.title}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ticket className="h-3.5 w-3.5 shrink-0" />
              <span>{priceLabel}</span>
            </p>
          </div>
        </div>

        {/* Footer actions - always visible */}
        <div className="px-4 pb-4 pt-0 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 mt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => !disabled && openEdit(ev)}
            disabled={disabled}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit event
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full gap-1.5" asChild>
            <Link to={`/events/${ev.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              View on site
            </Link>
          </Button>
          {ev.blocked && (
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 border-amber-500/50 text-amber-700 dark:text-amber-400" asChild>
              <Link to="/contact">
                <MessageCircle className="h-3.5 w-3.5" />
                Contact admin
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button className="rounded-full gap-2 w-fit sm:ml-auto" onClick={openCreate} disabled={isBlocked}>
          <Plus className="h-4 w-4" />
          Create event
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="rounded-full bg-muted/50 p-1">
          <TabsTrigger value="upcoming" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Past
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming events"
              description="Create an event to promote adoptions or fundraising."
              action={
                <Button className="rounded-full" onClick={openCreate} disabled={isBlocked}>
                  Create event
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => (
                <EventCard key={ev.id} ev={ev} isPast={false} disabled={isBlocked} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="space-y-4 mt-4">
          {past.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No past events"
              description="Past events will appear here."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((ev) => (
                <EventCard key={ev.id} ev={ev} isPast={true} disabled={isBlocked} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EventFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={editingEvent}
        onSave={handleSave}
        onUploadBanner={async (file) => {
          const { path } = await uploadEventBanner(file);
          return path;
        }}
        resolveBannerUrl={eventBannerUrl}
      />

      {/* Delete confirmation dialog – nothing is deleted until user clicks "Confirm delete" */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent
          className="rounded-2xl max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            setEventToDelete(null);
          }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">Delete this event?</AlertDialogTitle>
                <AlertDialogDescription className="text-left mt-1">
                  {eventToDelete ? (
                    <>
                      <span className="font-medium text-foreground">{eventToDelete.title}</span>
                      {" "}will be permanently removed only after you confirm. This cannot be undone.
                    </>
                  ) : (
                    "This event will be permanently removed after you confirm."
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
              disabled={!!deletingId}
              onClick={() => handleConfirmDelete()}
            >
              {deletingId ? "Deleting…" : "Confirm delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
