import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Share2,
  Ticket,
  Mail,
  Phone,
  Globe,
  User,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import {
  fetchEvent,
  eventBannerUrl,
  getVisitorId,
  toggleEventLike,
  shelterLogoUrlForEvent,
} from "@/lib/api/events";
import { fetchAdminEvent } from "@/lib/api/admin";
import { EventLikeButton } from "@/components/events/EventLikeButton";
import type { ShelterEvent, EventShelterInfo } from "@/types/shelter";
import { getStoredUser } from "@/lib/auth";
import { toast } from "sonner";

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function OrganizedBySection({ shelter }: { shelter: EventShelterInfo }) {
  const logoUrl = shelterLogoUrlForEvent(shelter.logoUrl);
  const details: { icon: React.ReactNode; label: string; value: string; href?: string }[] = [];
  if (shelter.address) details.push({ icon: <MapPin className="h-4 w-4 shrink-0" />, label: "Address", value: [shelter.address, shelter.district].filter(Boolean).join(", ") });
  if (shelter.contactEmail) details.push({ icon: <Mail className="h-4 w-4 shrink-0" />, label: "Email", value: shelter.contactEmail, href: `mailto:${shelter.contactEmail}` });
  if (shelter.contactPhone) details.push({ icon: <Phone className="h-4 w-4 shrink-0" />, label: "Phone", value: shelter.contactPhone, href: `tel:${shelter.contactPhone}` });
  if (shelter.website) details.push({ icon: <Globe className="h-4 w-4 shrink-0" />, label: "Website", value: shelter.website.replace(/^https?:\/\//i, ""), href: shelter.website.startsWith("http") ? shelter.website : `https://${shelter.website}` });
  if (shelter.ownerName) details.push({ icon: <User className="h-4 w-4 shrink-0" />, label: "Contact person", value: shelter.ownerName + (shelter.ownerEmail ? ` · ${shelter.ownerEmail}` : shelter.ownerPhone ? ` · ${shelter.ownerPhone}` : "") });

  return (
    <section className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border/80 bg-muted/30">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Organized by
        </h2>
      </div>
      <div className="p-5">
        <div className="flex gap-4">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-muted overflow-hidden border border-border/60 flex items-center justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold font-display text-foreground text-lg">{shelter.name}</h3>
            {shelter.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{shelter.description}</p>
            )}
          </div>
        </div>
        {details.length > 0 && (
          <dl className="mt-4 space-y-3">
            {details.map(({ icon, label, value, href }) => (
              <div key={label} className="flex gap-3 text-sm">
                <dt className="flex items-center gap-2 text-muted-foreground shrink-0 w-28">
                  {icon}
                  <span>{label}</span>
                </dt>
                <dd className="min-w-0 flex-1">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary hover:underline break-all"
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="text-foreground break-words">{value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<ShelterEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const visitorId = getVisitorId();
    const isAdmin = getStoredUser()?.role === "admin";
    fetchEvent(id, visitorId)
      .then((data) => {
        if (!cancelled) {
          if (data) {
            setEvent(data);
            return;
          }
          if (isAdmin) {
            return fetchAdminEvent(id).then((adminEv) => {
              if (!cancelled && adminEv) {
                setEvent({
                  id: adminEv.id,
                  title: adminEv.title,
                  date: adminEv.date,
                  time: adminEv.time,
                  location: adminEv.location,
                  description: adminEv.description,
                  bannerUrl: adminEv.bannerUrl,
                  priceText: adminEv.priceText,
                  likeCount: adminEv.likeCount,
                  liked: false,
                  shelter: adminEv.shelter
                    ? {
                        id: adminEv.shelter.id,
                        name: adminEv.shelter.name,
                        address: adminEv.shelter.address ?? null,
                        district: adminEv.shelter.district ?? null,
                        contactEmail: adminEv.shelter.contactEmail ?? null,
                        contactPhone: adminEv.shelter.contactPhone ?? null,
                        description: adminEv.shelter.description ?? null,
                        website: adminEv.shelter.website ?? null,
                        logoUrl: adminEv.shelter.logoUrl ?? null,
                        ownerName: adminEv.shelter.ownerName ?? null,
                        ownerEmail: adminEv.shelter.ownerEmail ?? null,
                        ownerPhone: adminEv.shelter.ownerPhone ?? null,
                      }
                    : undefined,
                  createdAt: adminEv.createdAt,
                  blocked: adminEv.blocked,
                });
              }
            });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError("Event not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: event?.title ?? "Event",
        url,
        text: event?.description?.slice(0, 100),
      }).then(() => toast.success("Shared")).catch(() => copyLink(url));
    } else {
      copyLink(url);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 py-12 px-6">
          <div className="container max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="aspect-[16/9] bg-muted rounded-2xl" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-muted rounded-xl" />
                <div className="h-24 bg-muted rounded-xl" />
              </div>
              <div className="space-y-2 h-4 bg-muted rounded" />
              <div className="h-40 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16 py-12 px-6">
          <div className="container max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground mb-4">{error ?? "Event not found."}</p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/events">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to events
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const priceLabel = event.priceText?.trim() || "Free entry";
  const addToCalendarUrl = (() => {
    const d = new Date(event.date + (event.time ? `T${event.time}` : "T12:00:00"));
    const end = new Date(d.getTime() + 2 * 60 * 60 * 1000);
    const format = (x: Date) => x.toISOString().replace(/-/g, "").replace(/:/g, "").replace(/\.\d{3}/, "");
    const title = encodeURIComponent(event.title);
    const location = encodeURIComponent(event.location);
    const details = encodeURIComponent(event.description?.slice(0, 500) ?? "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${format(d)}/${format(end)}&details=${details}&location=${location}`;
  })();

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16">
        <div className="container max-w-4xl mx-auto px-6 pb-16">
          <ScrollReveal>
            {/* Back + Share */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full -ml-2 text-muted-foreground hover:text-foreground"
              >
                <Link to="/events" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to events
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            {event.blocked && (
              <div className="mb-6 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                This event is hidden from the public. Only admins can see it.
              </div>
            )}

            {/* Hero banner with overlay */}
            <article className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg">
              <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden rounded-t-2xl group">
                {event.bannerUrl ? (
                  <img
                    src={eventBannerUrl(event.bannerUrl)}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/5">
                    <Calendar className="h-20 w-20 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-white/90 text-sm font-medium uppercase tracking-wider">
                    {formatEventDate(event.date)}
                    {event.time ? ` · ${event.time}` : ""}
                  </p>
                  <h1 className="mt-1 text-3xl sm:text-4xl font-bold font-display drop-shadow-sm">
                    {event.title}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <EventLikeButton
                      eventId={event.id}
                      likeCount={event.likeCount ?? 0}
                      liked={event.liked ?? false}
                      onToggle={(eventId) => toggleEventLike(eventId, getVisitorId())}
                      size="default"
                      className="!text-white hover:!text-white/90 [&_span]:!text-white/90"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Event details grid - interactive cards */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date & time</p>
                        <p className="mt-0.5 font-medium text-foreground">{formatShortDate(event.date)}</p>
                        {event.time && <p className="text-sm text-muted-foreground">{event.time}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Location</p>
                        <p className="mt-0.5 font-medium text-foreground">{event.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {event.priceText != null && event.priceText !== "" && (
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4 mb-6 flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Price</p>
                      <p className="mt-0.5 font-medium text-foreground">Starts from {priceLabel}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <section className="mb-8">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">About this event</h2>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </section>

                {/* Organized by - shelter details */}
                {event.shelter && <OrganizedBySection shelter={event.shelter} />}

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button asChild className="rounded-full" size="lg">
                    <Link to="/events">View all events</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full" size="lg">
                    <a href={addToCalendarUrl} target="_blank" rel="noopener noreferrer">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add to calendar
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </main>
      <ScrollReveal>
        <Footer />
      </ScrollReveal>
    </div>
  );
}
