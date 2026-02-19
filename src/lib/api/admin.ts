import { getToken } from "@/lib/auth";
import type {
  AdminUser,
  AdminPet,
  AdminAdoptionRequest,
  UserStatus,
  AdminSellerPayout,
  AdminSellerPendingBalance,
  AdminShelterPayout,
  AdminShelterPendingBalance,
  AdminFundraisingCampaign,
  AdminFundraisingCampaignStatus,
  AdminDonation,
  AdoptionRequestStatus,
} from "@/types/admin";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function request<T>(
  path: string,
  options?: RequestInit & { parseJson?: boolean }
): Promise<T> {
  const { parseJson = true, ...init } = options ?? {};
  const token = getToken();
  const hasBody = init.body != null && init.body !== "";
  const method = (init.method ?? "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string>),
  };
  if (hasBody || method === "POST" || method === "PUT" || method === "PATCH") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const errBody = parseJson ? await res.json().catch(() => ({})) : {};
    throw new Error((errBody as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return parseJson ? res.json() : (undefined as T);
}

/** Raw user from API (matches server User model output) */
interface ApiAdminUser {
  id: string;
  name: string;
  email: string;
  role: "seller" | "shelter" | "adopter";
  status?: string;
  district?: string | null;
  createdAt?: string;
  updatedAt?: string;
  shopName?: string | null;
  pickupAddress?: string | null;
  contactNumber?: string | null;
  organizationName?: string | null;
  address?: string | null;
  contactNumberShelter?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  [key: string]: unknown;
}

/** AdminUser plus optional profile fields for Approvals and user detail view */
export interface AdminUserWithProfile extends AdminUser {
  organizationName?: string | null;
  address?: string | null;
  contactNumberShelter?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  shopName?: string | null;
  pickupAddress?: string | null;
  contactNumber?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

function toAdminUser(u: ApiAdminUser): AdminUserWithProfile {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: (u.status === "blocked" || u.status === "pending" ? u.status : "active") as UserStatus,
    district: u.district ?? undefined,
    createdAt: u.createdAt ?? new Date().toISOString(),
    lastActiveAt: undefined,
    requestsCount: 0,
    donationsCount: 0,
    organizationName: u.organizationName ?? undefined,
    address: u.address ?? undefined,
    contactNumberShelter: u.contactNumberShelter ?? undefined,
    ownerName: u.ownerName ?? undefined,
    ownerEmail: u.ownerEmail ?? undefined,
    ownerPhone: u.ownerPhone ?? undefined,
    shopName: u.shopName ?? undefined,
    pickupAddress: u.pickupAddress ?? undefined,
    contactNumber: u.contactNumber ?? undefined,
    description: u.description ?? undefined,
    website: u.website ?? undefined,
    logoUrl: u.logoUrl ?? undefined,
  };
}

export async function fetchAdminUsers(): Promise<AdminUserWithProfile[]> {
  const list = await request<ApiAdminUser[]>("/api/admin/users");
  return Array.isArray(list) ? list.map(toAdminUser) : [];
}

/** Fetch all pets with shelter details for admin dashboard */
export async function fetchAdminPets(): Promise<AdminPet[]> {
  const list = await request<AdminPet[]>("/api/admin/pets");
  return Array.isArray(list) ? list : [];
}

/** Delete a pet (admin). Triggers real-time update via pets:changed. */
export async function deleteAdminPet(petId: string): Promise<void> {
  await request(`/api/admin/pets/${petId}`, {
    method: "DELETE",
    parseJson: false,
  });
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<AdminUserWithProfile> {
  const u = await request<ApiAdminUser>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return toAdminUser(u);
}

/** Set a temporary password for a user. They are notified via websocket and logged out. */
export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await request(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
    parseJson: false,
  });
}

/** Delete a user. They are notified via websocket and logged out. */
export async function deleteUser(userId: string): Promise<void> {
  await request(`/api/admin/users/${userId}`, {
    method: "DELETE",
    parseJson: false,
  });
}

// ---------- Payment management (seller & shelter payouts) ----------

export async function fetchAdminSellerPayouts(status?: "pending" | "paid"): Promise<AdminSellerPayout[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const list = await request<AdminSellerPayout[]>(`/api/admin/payments/seller-payouts${q}`);
  return Array.isArray(list) ? list : [];
}

export async function fetchAdminSellerPendingBalances(): Promise<AdminSellerPendingBalance[]> {
  const list = await request<AdminSellerPendingBalance[]>(`/api/admin/payments/seller-pending`);
  return Array.isArray(list) ? list : [];
}

export async function createAdminSellerPayout(sellerId: string, amount: number): Promise<AdminSellerPayout> {
  return request<AdminSellerPayout>(`/api/admin/payments/seller-payouts`, {
    method: "POST",
    body: JSON.stringify({ sellerId, amount }),
  });
}

export async function markAdminSellerPayoutPaid(payoutId: string): Promise<AdminSellerPayout> {
  return request<AdminSellerPayout>(`/api/admin/payments/seller-payouts/${payoutId}`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function fetchAdminShelterPayouts(status?: "pending" | "paid"): Promise<AdminShelterPayout[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const list = await request<AdminShelterPayout[]>(`/api/admin/payments/shelter-payouts${q}`);
  return Array.isArray(list) ? list : [];
}

export async function fetchAdminShelterPendingBalances(): Promise<AdminShelterPendingBalance[]> {
  const list = await request<AdminShelterPendingBalance[]>(`/api/admin/payments/shelter-pending`);
  return Array.isArray(list) ? list : [];
}

export async function createAdminShelterPayout(shelterId: string, amount: number): Promise<AdminShelterPayout> {
  return request<AdminShelterPayout>(`/api/admin/payments/shelter-payouts`, {
    method: "POST",
    body: JSON.stringify({ shelterId, amount }),
  });
}

export async function markAdminShelterPayoutPaid(payoutId: string): Promise<AdminShelterPayout> {
  return request<AdminShelterPayout>(`/api/admin/payments/shelter-payouts/${payoutId}`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

// ---------- Adoption requests (admin) ----------

export async function fetchAdminAdoptionRequests(): Promise<AdminAdoptionRequest[]> {
  const list = await request<AdminAdoptionRequest[]>("/api/admin/adoption-requests");
  return Array.isArray(list) ? list : [];
}

/** Escalate an adoption request (admin). Shelter is notified to refetch. */
export async function escalateAdminAdoptionRequest(requestId: string): Promise<{ id: string; escalated: boolean; escalatedAt: string }> {
  return request<{ id: string; escalated: boolean; escalatedAt: string }>(
    `/api/admin/adoption-requests/${requestId}/escalate`,
    { method: "POST" }
  );
}

/** Update adoption request status (admin). E.g. Mark for review = status "Under Review". Shelter is notified. */
export async function updateAdminAdoptionRequestStatus(
  requestId: string,
  status: string
): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>(`/api/admin/adoption-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ---------- Event management (admin) ----------

export interface AdminEvent {
  id: string;
  shelterId: string;
  shelterName: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  bannerUrl?: string;
  priceText?: string;
  blocked: boolean;
  likeCount: number;
  createdAt: string;
}

/** Fetch all events (including blocked) for admin dashboard. */
export async function fetchAdminEvents(): Promise<AdminEvent[]> {
  const list = await request<AdminEvent[]>("/api/admin/events");
  return Array.isArray(list) ? list : [];
}

/** Fetch a single event by id (admin). Returns event even when blocked. Same shape as public event + blocked. */
export async function fetchAdminEvent(eventId: string): Promise<AdminEventDetail | null> {
  try {
    return await request<AdminEventDetail>(`/api/admin/events/${eventId}`);
  } catch {
    return null;
  }
}

/** Single event from admin API (includes blocked and shelter). */
export interface AdminEventDetail {
  id: string;
  shelterId: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  bannerUrl?: string;
  priceText?: string;
  likeCount: number;
  blocked: boolean;
  createdAt: string;
  shelter?: {
    id: string;
    name: string;
    address?: string | null;
    district?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    description?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    ownerName?: string | null;
    ownerEmail?: string | null;
    ownerPhone?: string | null;
  };
}

/** Block or unblock an event (admin). Triggers events:changed for real-time visibility on main site. */
export async function updateAdminEventBlock(eventId: string, blocked: boolean): Promise<{ id: string; blocked: boolean }> {
  return request<{ id: string; blocked: boolean }>(`/api/admin/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify({ blocked }),
  });
}

// ---------- Fundraising campaigns (admin) ----------

/** Fetch all fundraising campaigns (optional filter by status). */
export async function fetchAdminFundraisingCampaigns(
  status?: AdminFundraisingCampaignStatus
): Promise<AdminFundraisingCampaign[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const list = await request<AdminFundraisingCampaign[]>(`/api/admin/fundraising${q}`);
  return Array.isArray(list) ? list : [];
}

/** Update campaign: set status (approve/reject) and/or edit title, description, imageUrl, goal, endDate. On approve, shelter is notified in real-time. */
export async function updateAdminFundraisingCampaign(
  campaignId: string,
  updates: { status?: AdminFundraisingCampaignStatus } | { title?: string; description?: string; imageUrl?: string; goal?: number; endDate?: string }
): Promise<AdminFundraisingCampaign> {
  return request<AdminFundraisingCampaign>(`/api/admin/fundraising/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

/** Delete a fundraising campaign (admin only). */
export async function deleteAdminFundraisingCampaign(campaignId: string): Promise<void> {
  await request(`/api/admin/fundraising/${campaignId}`, {
    method: "DELETE",
    parseJson: false,
  });
}

// ---------- Donations (admin list) ----------

/** Fetch all donations with shelter and campaign info for admin dashboard */
export async function fetchAdminDonations(): Promise<AdminDonation[]> {
  const list = await request<AdminDonation[]>("/api/admin/donations");
  return Array.isArray(list) ? list : [];
}

// ---------- Admin overview (dashboard stats + recent activity) ----------

export interface AdminOverviewStats {
  totalUsers: number;
  totalAdopters: number;
  totalShelters: number;
  totalSellers: number;
  verifiedShelters: number;
  verifiedSellers: number;
  pendingShelters: number;
  pendingSellers: number;
  pendingApprovals: number;
  pendingFundraisingCampaigns: number;
  activePetsListed: number;
  donationsThisMonth: number;
  totalDonationsAllTime: number;
}

export interface AdminOverviewActivityItem {
  id: string;
  type: "approval" | "new_listing" | "new_request" | "donation" | "user";
  title: string;
  description: string;
  at: string;
  meta?: Record<string, string>;
}

export interface AdminOverviewResponse {
  stats: AdminOverviewStats;
  recentActivity: AdminOverviewActivityItem[];
}

/** Fetch overview stats and recent activity for admin dashboard (from database). */
export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  return request<AdminOverviewResponse>("/api/admin/overview");
}

// ---------- Admin analytics ----------

export interface AdminAnalyticsResponse {
  startDate: string;
  endDate: string;
  donationsByMonth: { month: string; amount: number }[];
  adoptionRequestsByStatus: { status: AdoptionRequestStatus; count: number }[];
  topAdoptedPetTypes: { species: string; count: number }[];
  averageAiCompatibilityScore: number;
  totalUsers: number;
  verifiedShelters: number;
  verifiedSellers: number;
  activePetsListed: number;
}

/** Fetch analytics data for admin dashboard (from database). Optional startDate/endDate in YYYY-MM-DD. */
export async function fetchAdminAnalytics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<AdminAnalyticsResponse> {
  const sp = new URLSearchParams();
  if (params?.startDate) sp.set("startDate", params.startDate);
  if (params?.endDate) sp.set("endDate", params.endDate);
  const q = sp.toString();
  return request<AdminAnalyticsResponse>(`/api/admin/analytics${q ? `?${q}` : ""}`);
}

// ---------- Admin OpenAI integration ----------

export interface OpenAISettingsResponse {
  model: string;
  baseURL: string | null;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  hasApiKey: boolean;
}

export interface OpenAITestResponse {
  success: boolean;
  latencyMs: number | null;
  model: string | null;
  sampleOutput: string | null;
  error: string | null;
}

export interface AdminHealthSnapshot {
  backend: string;
  database: string;
  mongodb?: string;
  openai: { status: string; lastSuccessAt: string | null };
  queue: string;
  timestamp: string;
  error?: string;
}

export interface IntegrationEventItem {
  id: string;
  type: string;
  status: string;
  latencyMs: number | null;
  message: string | null;
  createdAt: string;
}

/** GET /api/admin/openai/settings */
export async function fetchOpenAISettings(): Promise<OpenAISettingsResponse> {
  return request<OpenAISettingsResponse>("/api/admin/openai/settings");
}

/** PUT /api/admin/openai/settings. Pass apiKey only when setting/replacing (never returned). */
export async function updateOpenAISettings(updates: {
  model?: string;
  baseURL?: string | null;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
  apiKey?: string;
}): Promise<OpenAISettingsResponse> {
  return request<OpenAISettingsResponse>("/api/admin/openai/settings", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/** POST /api/admin/openai/test */
export async function testOpenAI(): Promise<OpenAITestResponse> {
  return request<OpenAITestResponse>("/api/admin/openai/test", { method: "POST" });
}

/** GET /api/admin/health */
export async function fetchAdminHealth(): Promise<AdminHealthSnapshot> {
  return request<AdminHealthSnapshot>("/api/admin/health");
}

/** GET /api/admin/openai/events – last 20 integration events */
export async function fetchIntegrationEvents(): Promise<IntegrationEventItem[]> {
  const list = await request<IntegrationEventItem[]>("/api/admin/openai/events");
  return Array.isArray(list) ? list : [];
}

/** Build URL for SSE health stream (admin). Call with EventSource with credentials if needed. */
export function getAdminHealthStreamUrl(): string {
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  return `${base}/api/admin/health/stream`;
}
