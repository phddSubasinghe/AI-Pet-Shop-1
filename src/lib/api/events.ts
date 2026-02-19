import type { ShelterEvent, EventShelterInfo } from "@/types/shelter";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function request<T>(path: string, opts: { method?: string; body?: string } = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.body ? {} : {}) },
  }).then((res) => {
    if (!res.ok) return res.json().then((d) => Promise.reject(new Error((d as { error?: string }).error ?? res.statusText)));
    return res.json();
  });
}

const VISITOR_ID_KEY = "pawpop_event_visitor_id";

/** Get or create anonymous visitor id (localStorage) for like/unlike without login. */
export function getVisitorId(): string {
  let id = typeof localStorage !== "undefined" ? localStorage.getItem(VISITOR_ID_KEY) : null;
  if (!id) {
    id = "v_" + crypto.randomUUID().replace(/-/g, "");
    try {
      localStorage.setItem(VISITOR_ID_KEY, id);
    } catch {
      // ignore
    }
  }
  return id;
}

function toShelterInfo(raw: Record<string, unknown> | null | undefined): EventShelterInfo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Shelter"),
    address: raw.address != null && raw.address !== "" ? String(raw.address) : null,
    district: raw.district != null && raw.district !== "" ? String(raw.district) : null,
    contactEmail: raw.contactEmail != null && raw.contactEmail !== "" ? String(raw.contactEmail) : null,
    contactPhone: raw.contactPhone != null && raw.contactPhone !== "" ? String(raw.contactPhone) : null,
    description: raw.description != null && raw.description !== "" ? String(raw.description) : null,
    website: raw.website != null && raw.website !== "" ? String(raw.website) : null,
    logoUrl: raw.logoUrl != null && raw.logoUrl !== "" ? String(raw.logoUrl) : null,
    ownerName: raw.ownerName != null && raw.ownerName !== "" ? String(raw.ownerName) : null,
    ownerEmail: raw.ownerEmail != null && raw.ownerEmail !== "" ? String(raw.ownerEmail) : null,
    ownerPhone: raw.ownerPhone != null && raw.ownerPhone !== "" ? String(raw.ownerPhone) : null,
  };
}

function toShelterEvent(raw: Record<string, unknown>): ShelterEvent {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    date: String(raw.date ?? ""),
    time: raw.time != null && raw.time !== "" ? String(raw.time) : undefined,
    location: String(raw.location ?? ""),
    description: String(raw.description ?? ""),
    bannerUrl: raw.bannerUrl != null && raw.bannerUrl !== "" ? String(raw.bannerUrl) : undefined,
    priceText: raw.priceText != null && raw.priceText !== "" ? String(raw.priceText) : undefined,
    likeCount: raw.likeCount != null ? Number(raw.likeCount) : 0,
    liked: raw.liked === true,
    shelter: toShelterInfo(raw.shelter as Record<string, unknown> | undefined),
    createdAt: String(raw.createdAt ?? ""),
  };
}

/**
 * Fetch all events (public). Optional shelterId; pass visitorId for liked state and likeCount.
 */
export async function fetchEvents(shelterId?: string, visitorId?: string): Promise<ShelterEvent[]> {
  const params = new URLSearchParams();
  if (shelterId) params.set("shelterId", shelterId);
  if (visitorId) params.set("visitorId", visitorId);
  const q = params.toString() ? `?${params.toString()}` : "";
  const data = await request<Record<string, unknown>[]>(`/api/events${q}`);
  return Array.isArray(data) ? data.map((e) => toShelterEvent(e)) : [];
}

/**
 * Fetch a single event by id (public). Pass visitorId for liked state. Returns null if not found.
 */
export async function fetchEvent(id: string, visitorId?: string): Promise<ShelterEvent | null> {
  const q = visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : "";
  const data = await request<Record<string, unknown>>(`/api/events/${id}${q}`).catch(() => null);
  return data ? toShelterEvent(data) : null;
}

/**
 * Toggle like on an event (no auth). Returns new { count, liked }.
 */
export async function toggleEventLike(
  eventId: string,
  visitorId: string
): Promise<{ count: number; liked: boolean }> {
  const data = await request<{ count: number; liked: boolean }>(`/api/events/${eventId}/like`, {
    method: "POST",
    body: JSON.stringify({ visitorId }),
  });
  return data;
}

/** Resolve event banner URL for display (prepend API base if path is relative) */
export function eventBannerUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

/** Resolve shelter logo URL (for event organizer) */
export function shelterLogoUrlForEvent(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}
