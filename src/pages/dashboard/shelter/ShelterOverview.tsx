import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PawPrint,
  FileQuestion,
  CheckCircle,
  Heart,
  Calendar,
  Activity,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { useShelter } from "@/contexts/ShelterContext";
import { useAddPetModal } from "@/contexts/AddPetModalContext";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shelter/GlassCard";
import {
  fetchShelterEvents,
  fetchShelterRequests,
  fetchShelterDonations,
} from "@/lib/api/shelter";
import { onEventsChanged, onAdoptionRequestsChanged, onDonationsChanged } from "@/lib/socket";
import { formatDistanceToNow } from "date-fns";
import type { AdoptionRequest as ShelterRequest } from "@/types/shelter";

const today = () => new Date().toISOString().slice(0, 10);

function donationsThisMonthTotal(donations: { amount: number; donatedAt: string }[]): number {
  const now = new Date();
  return donations
    .filter((d) => {
      const date = new Date(d.donatedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + d.amount, 0);
}

type ActivityItem = { id: string; title: string; description: string; timestamp: string };

function buildRecentActivity(
  requests: ShelterRequest[],
  donations: { id: string; donorName: string; amount: number; campaignName?: string | null; donatedAt: string }[]
): ActivityItem[] {
  const items: ActivityItem[] = [];
  requests.slice(0, 10).forEach((r) => {
    const label =
      r.status === "Approved"
        ? "Adoption approved"
        : r.status === "Rejected" || r.status === "Cancelled"
          ? "Request closed"
          : r.status === "Interview Scheduled"
            ? "Interview scheduled"
            : r.status === "Under Review"
              ? "Request under review"
              : "New adoption request";
    items.push({
      id: `req-${r.id}`,
      title: label,
      description: `${r.adopterName} – ${r.petName}${r.status === "Approved" ? " (approved)" : ""}`,
      timestamp: r.updatedAt,
    });
  });
  donations.slice(0, 10).forEach((d) => {
    items.push({
      id: `don-${d.id}`,
      title: "Donation received",
      description: `LKR ${d.amount.toLocaleString()} from ${d.donorName}${d.campaignName ? ` · ${d.campaignName}` : ""}`,
      timestamp: d.donatedAt,
    });
  });
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, 5);
}

export default function ShelterOverview() {
  const { pets, profile } = useShelter();
  const { openAddPet } = useAddPetModal();
  const [events, setEvents] = useState<{ id: string; title: string; date: string; location: string }[]>([]);
  const [requests, setRequests] = useState<ShelterRequest[]>([]);
  const [donations, setDonations] = useState<{ id: string; donorName: string; amount: number; campaignName?: string | null; donatedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchEvents = useCallback(async () => {
    try {
      const list = await fetchShelterEvents();
      const upcoming = list
        .filter((e) => e.date >= today())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
      setEvents(upcoming);
    } catch {
      setEvents([]);
    }
  }, []);

  const refetchRequestsAndDonations = useCallback(async () => {
    try {
      const [requestList, donationList] = await Promise.all([
        fetchShelterRequests(),
        fetchShelterDonations(),
      ]);
      setRequests(requestList);
      setDonations(donationList);
    } catch {
      setRequests([]);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchEvents();
  }, [refetchEvents]);

  useEffect(() => {
    setLoading(true);
    refetchRequestsAndDonations();
  }, [refetchRequestsAndDonations]);

  useEffect(() => {
    const unsubEvents = onEventsChanged(refetchEvents);
    const unsubRequests = onAdoptionRequestsChanged(() => refetchRequestsAndDonations());
    const unsubDonations = onDonationsChanged(refetchRequestsAndDonations);
    return () => {
      unsubEvents();
      unsubRequests();
      unsubDonations();
    };
  }, [refetchEvents, refetchRequestsAndDonations]);

  const available = pets.filter((p) => p.status === "available" && !p.archived).length;
  const pendingRequests = requests.filter((r) => r.status === "New" || r.status === "Under Review").length;
  const approvedAdoptions = requests.filter((r) => r.status === "Approved").length;
  const donationsThisMonth = donationsThisMonthTotal(donations);
  const upcomingEvents = events;
  const recentActivity = useMemo(() => buildRecentActivity(requests, donations), [requests, donations]);

  const stats = [
    { label: "Total listed", value: pets.length, icon: PawPrint, href: "/dashboard/shelter/pets" },
    { label: "Available", value: available, icon: PawPrint, href: "/dashboard/shelter/pets" },
    { label: "Pending requests", value: pendingRequests, icon: FileQuestion, href: "/dashboard/shelter/requests" },
    { label: "Approved adoptions", value: approvedAdoptions, icon: CheckCircle, href: "/dashboard/shelter/requests" },
    { label: "Donations (this month)", value: `LKR ${donationsThisMonth.toLocaleString()}`, icon: Heart, href: "/dashboard/shelter/fundraising" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground">
          Welcome back
        </h2>
        <p className="text-muted-foreground mt-0.5">
          {profile.organizationName || "Your shelter"} — here’s what’s happening.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} to={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
            <GlassCard className="p-5 h-full transition-all duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold font-display text-foreground mt-1">{value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      <GlassCard className="p-6">
        <h3 className="font-display font-semibold text-foreground mb-2">Quick actions</h3>
        <p className="text-sm text-muted-foreground mb-4">Add a pet to list them for AI matching and adoption.</p>
        <Button className="rounded-full" onClick={openAddPet}>
          <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
          Add pet
        </Button>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming events */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Upcoming events</h3>
            <Button variant="ghost" size="sm" className="rounded-full text-primary" asChild>
              <Link to="/dashboard/shelter/events">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {upcomingEvents.length > 0 ? (
            <ul className="space-y-3">
              {upcomingEvents.map((ev) => (
                <li key={ev.id}>
                  <Link
                    to="/dashboard/shelter/events"
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-3 transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{ev.title}</p>
                      <p className="text-sm text-muted-foreground">{ev.date} · {ev.location}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No upcoming events.</p>
          )}
        </GlassCard>

        {/* Recent activity */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Recent activity</h3>
            <Activity className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {recentActivity.map((act) => (
                <li key={act.id} className="flex gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{act.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
