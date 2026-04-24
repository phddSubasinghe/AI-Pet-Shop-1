import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { fetchEvents, eventBannerUrl, getVisitorId, toggleEventLike } from "@/lib/api/events";
import { onEventsChanged } from "@/lib/socket";
import { EventLikeButton } from "@/components/events/EventLikeButton";
import type { ShelterEvent } from "@/types/shelter";

function getMonthDay(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return {
    month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    day: d.getDate(),
  };
}

function EventCard({ event, onLikeToggle }: { event: ShelterEvent; onLikeToggle: (eventId: string) => Promise<{ count: number; liked: boolean }> }) {
  const { month, day } = getMonthDay(event.date);
  const priceLabel = event.priceText?.trim() || "Free entry";

  return (
    <article className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md hover:shadow-xl transition-all duration-300">
      {/* Banner image - full bleed, rounded top */}
      <div className="aspect-[16/9] bg-muted overflow-hidden rounded-t-2xl">
        {event.bannerUrl ? (
          <img
            src={eventBannerUrl(event.bannerUrl)}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-primary/5">
            <Calendar className="h-14 w-14 text-primary/30" />
          </div>
        )}
      </div>

      {/* Content: date block | divider | details */}
      <div className="flex p-5 gap-4 bg-background">
        {/* Date block - month + large day in accent */}
        <div className="shrink-0 flex flex-col items-center justify-center w-14">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {month}
          </span>
          <span className="text-3xl font-bold font-display text-primary leading-none mt-0.5">
            {day}
          </span>
        </div>

        {/* Vertical separator */}
        <div className="w-px bg-border shrink-0" aria-hidden />

        {/* Event details */}
        <div className="min-w-0 flex-1 flex flex-col">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
          <h3 className="mt-1 text-lg font-bold font-display text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ticket className="h-3.5 w-3.5 shrink-0" />
            <span>Starts from {priceLabel}</span>
          </p>
        </div>
      </div>

      {/* Footer: like + view details */}
      <div className="px-5 pb-5 pt-0 flex flex-wrap items-center gap-2">
        <EventLikeButton
          eventId={event.id}
          likeCount={event.likeCount ?? 0}
          liked={event.liked ?? false}
          onToggle={onLikeToggle}
          size="sm"
        />
        <Button size="sm" className="rounded-full" variant="outline" asChild>
          <Link to={`/events/${event.id}`}>View details</Link>
        </Button>
      </div>
    </article>
  );
}

const today = new Date().toISOString().slice(0, 10);

const Events = () => {
  const [events, setEvents] = useState<ShelterEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const visitorId = getVisitorId();
  const refetch = useCallback(async () => {
    try {
      const list = await fetchEvents(undefined, visitorId);
      setEvents(list);
    } finally {
      setLoading(false);
    }
  }, [visitorId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const unsub = onEventsChanged(refetch);
    return unsub;
  }, [refetch]);

  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <section className="py-16 px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4">
              Events
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Adoption drives, workshops, and fundraisers near you. Join events and support shelters.
            </p>
          </div>
        </section>

        <section className="py-12 px-6 lg:px-8 bg-gradient-to-b from-primary/[0.04] to-background">
          <div className="container mx-auto max-w-6xl">
            <ScrollReveal>
              {loading ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
                  <p className="text-muted-foreground">Loading events…</p>
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      onLikeToggle={(id) => toggleEventLike(id, visitorId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming events right now.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back soon for adoption drives and workshops.
                  </p>
                </div>
              )}
            </ScrollReveal>
          </div>
        </section>
      </main>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </div>
  );
};

export default Events;
