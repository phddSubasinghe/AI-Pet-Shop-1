import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WaveSeparator } from "@/components/seller/WaveSeparator";
import { getToken } from "@/lib/auth";
import {
  fetchSellerNotifications,
  markSellerNotificationRead,
  markAllSellerNotificationsRead,
} from "@/lib/api/seller";
import type { SellerNotification } from "@/types/seller";
import { onNotificationsChanged } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SellerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchSellerNotifications(token);
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

  const handleMarkRead = async (n: SellerNotification) => {
    if (n.read) return;
    const token = getToken();
    if (!token) return;
    try {
      await markSellerNotificationRead(token, n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch {
      // ignore
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await markAllSellerNotificationsRead(token);
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <WaveSeparator />
        <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WaveSeparator />
      <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold font-display">Notifications</h2>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-border/80">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl transition-colors hover:bg-muted/50",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("text-sm", !n.read && "font-medium")}>
                        {n.title}
                        {n.message ? ` – ${n.message}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTime(n.createdAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
