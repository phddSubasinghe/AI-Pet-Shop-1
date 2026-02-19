import type { FundraisingCampaign } from "@/types/shelter";
import type { EventShelterInfo } from "@/types/shelter";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Resolve campaign image path to full URL for display */
export function resolveCampaignImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

export interface PublicFundraisingCampaign {
  id: string;
  shelterId: string;
  shelterName: string;
  /** District e.g. Colombo (from list only) */
  shelterDistrict?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  goal: number;
  raised: number;
  endDate: string;
  createdAt: string;
}

/** Single campaign with full shelter details (from GET /api/fundraising/:id) */
export interface PublicFundraisingCampaignDetail extends PublicFundraisingCampaign {
  shelter: EventShelterInfo | null;
}

/**
 * Fetch approved fundraising campaigns (public). Optional shelterId to filter by shelter.
 */
export async function fetchPublicCampaigns(shelterId?: string): Promise<PublicFundraisingCampaign[]> {
  const q = shelterId ? `?shelterId=${encodeURIComponent(shelterId)}` : "";
  const res = await fetch(`${API_BASE}/api/fundraising${q}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch a single approved campaign by id with full shelter details (public).
 */
export async function fetchPublicCampaignById(id: string): Promise<PublicFundraisingCampaignDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/fundraising/${id}`);
    if (res.status === 404) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
    return data as PublicFundraisingCampaignDetail;
  } catch {
    return null;
  }
}

export interface DonatePayload {
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  amount: number;
}

export interface DonateResponse {
  id: string;
  donorName: string;
  donorEmail: string | null;
  donorPhone: string | null;
  amount: number;
  campaignId: string;
  campaignName: string | null;
  createdAt: string;
}

/**
 * Submit a donation for a campaign (public). Saves to DB; no real card processing.
 */
export async function submitDonation(campaignId: string, payload: DonatePayload): Promise<DonateResponse> {
  const res = await fetch(`${API_BASE}/api/fundraising/${campaignId}/donate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as DonateResponse;
}

/** Map public campaign to FundraisingCampaign (for components that use that type) */
export function toFundraisingCampaign(p: PublicFundraisingCampaign): FundraisingCampaign {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    goal: p.goal,
    raised: p.raised,
    endDate: p.endDate,
    status: "approved",
    createdAt: p.createdAt,
  };
}
