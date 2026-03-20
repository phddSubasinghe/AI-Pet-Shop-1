import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Heart, FileQuestion, Megaphone } from "lucide-react";
import { GlassCard } from "@/components/shelter/GlassCard";
import { Button } from "@/components/ui/button";
import {
  fetchShelterNotifications,
  markShelterNotificationRead,
  markAllShelterNotificationsRead,
} from "@/lib/api/shelter";
import type { ShelterNotification, ShelterNotificationType } from "@/types/shelter";
import { onNotificationsChanged } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeIcon({ type }: { type: ShelterNotificationType }) {
  switch (type) {
    case "donation":
      return <Heart className="h-5 w-5 text-primary" />;
    case "request":
      return <FileQuestion className="h-5 w-5 text-primary" />;
    case "fundraising":
      return <Megaphone className="h-5 w-5 text-primary" />;
    default:
      return <Bell className="h-5 w-5 text-primary" />;
  }
}

export default function ShelterNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ShelterNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchShelterNotifications();
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return onNotificationsChanged(load);
  }, [load]);

  const handleMarkRead = async (n: ShelterNotification) => {
    if (!n.read) {
      try {
        await markShelterNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        // ignore
      }
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllShelterNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Loading…</p>
        </div>
        <GlassCard className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            All activity — adoption requests, donations, and fundraising updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5 shrink-0"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
            <p className="text-muted-foreground text-sm">No notifications yet.</p>
            <p className="text-muted-foreground text-xs mt-1">
              You’ll see adoption requests, donations, and campaign updates here in real time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/80">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className={cn(
                    "w-full text-left flex gap-4 px-5 py-4 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <TypeIcon type={n.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium text-foreground", !n.read && "font-semibold")}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatTime(n.createdAt)} · {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="shrink-0 mt-2 h-2 w-2 rounded-full bg-primary" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
