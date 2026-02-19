import type {
  AdoptionRequest,
  Donation,
  FundraisingCampaign,
  ShelterEvent,
  ShelterNotification,
  ShelterPet,
  ShelterProfile,
} from "@/types/shelter";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("pawpop_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Resolve shelter logo URL for display (prepend API base if path is relative) */
export function shelterLogoUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

/** Resolve fundraising campaign image URL (prepend API base if path is relative) */
export function campaignImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

/**
 * Upload shelter logo. Saves file to server data/shelter and updates User.logoUrl in DB.
 * Returns the relative path (use shelterLogoUrl() for display).
 */
export async function uploadShelterLogo(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await fetch(`${API_BASE}/api/shelter/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as { url: string };
}

/**
 * Upload pet image. Saves file to server data/pets; returns path to store in Pet.image (use shelterLogoUrl/petImageUrl for display).
 */
export async function uploadPetImage(file: File): Promise<{ path: string }> {
  const token = localStorage.getItem("pawpop_token");
  if (!token) throw new Error("Sign in to upload images");
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/api/shelter/pets/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as { path: string };
}

/** Resolve event banner URL (prepend API base if path is relative) */
export function eventBannerUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

/**
 * Upload event banner. Saves file to server data/event; returns path to store in event.bannerUrl (use eventBannerUrl for display).
 */
export async function uploadEventBanner(file: File): Promise<{ path: string }> {
  const token = localStorage.getItem("pawpop_token");
  if (!token) throw new Error("Sign in to upload images");
  const formData = new FormData();
  formData.append("banner", file);
  const res = await fetch(`${API_BASE}/api/shelter/events/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as { path: string };
}

/** Map API event to ShelterEvent */
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
    blocked: raw.blocked === true,
    createdAt: String(raw.createdAt ?? ""),
  };
}

/**
 * Fetch all events for the current shelter. Auth required.
 */
export async function fetchShelterEvents(): Promise<ShelterEvent[]> {
  const res = await fetch(`${API_BASE}/api/shelter/events`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data.map((e: Record<string, unknown>) => toShelterEvent(e)) : [];
}

/**
 * Create an event for the current shelter. Auth required.
 */
export async function createShelterEvent(
  event: Omit<ShelterEvent, "id" | "createdAt">
): Promise<ShelterEvent> {
  const res = await fetch(`${API_BASE}/api/shelter/events`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(event),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return toShelterEvent(data as Record<string, unknown>);
}

/**
 * Update an event. Auth required; event must belong to current shelter.
 */
export async function updateShelterEvent(
  id: string,
  updates: Partial<Pick<ShelterEvent, "title" | "date" | "time" | "location" | "description" | "bannerUrl" | "priceText">>
): Promise<ShelterEvent> {
  const res = await fetch(`${API_BASE}/api/shelter/events/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return toShelterEvent(data as Record<string, unknown>);
}

/**
 * Delete an event. Auth required; event must belong to current shelter.
 */
export async function deleteShelterEvent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/shelter/events/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
}

/**
 * Fetch shelter profile from API (auth, shelter only). Used for profile form and context.
 */
export async function fetchShelterProfile(): Promise<ShelterProfile> {
  const res = await fetch(`${API_BASE}/api/shelter/profile`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  const raw = data as Record<string, unknown>;
  return {
    organizationName: String(raw.organizationName ?? ""),
    description: String(raw.description ?? ""),
    address: String(raw.address ?? ""),
    district: raw.district != null && raw.district !== "" ? String(raw.district) : undefined,
    contactEmail: String(raw.contactEmail ?? ""),
    contactPhone: String(raw.contactPhone ?? ""),
    website: String(raw.website ?? ""),
    logoUrl: String(raw.logoUrl ?? ""),
    ownerName: raw.ownerName != null && raw.ownerName !== "" ? String(raw.ownerName) : undefined,
    ownerEmail: raw.ownerEmail != null && raw.ownerEmail !== "" ? String(raw.ownerEmail) : undefined,
    ownerPhone: raw.ownerPhone != null && raw.ownerPhone !== "" ? String(raw.ownerPhone) : undefined,
    verificationStatus: (raw.verificationStatus as ShelterProfile["verificationStatus"]) ?? "Pending",
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

/**
 * Update shelter profile (auth, shelter only). Returns updated profile.
 */
export async function updateShelterProfile(updates: Partial<ShelterProfile>): Promise<ShelterProfile> {
  const body: Record<string, unknown> = {};
  if (updates.organizationName !== undefined) body.organizationName = updates.organizationName;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.address !== undefined) body.address = updates.address;
  if (updates.district !== undefined) body.district = updates.district;
  if (updates.contactEmail !== undefined) body.contactEmail = updates.contactEmail;
  if (updates.contactPhone !== undefined) body.contactPhone = updates.contactPhone;
  if (updates.website !== undefined) body.website = updates.website;
  if (updates.logoUrl !== undefined) body.logoUrl = updates.logoUrl;
  if (updates.ownerName !== undefined) body.ownerName = updates.ownerName;
  if (updates.ownerEmail !== undefined) body.ownerEmail = updates.ownerEmail;
  if (updates.ownerPhone !== undefined) body.ownerPhone = updates.ownerPhone;
  const res = await fetch(`${API_BASE}/api/shelter/profile`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  const raw = data as Record<string, unknown>;
  return {
    organizationName: String(raw.organizationName ?? ""),
    description: String(raw.description ?? ""),
    address: String(raw.address ?? ""),
    district: raw.district != null && raw.district !== "" ? String(raw.district) : undefined,
    contactEmail: String(raw.contactEmail ?? ""),
    contactPhone: String(raw.contactPhone ?? ""),
    website: String(raw.website ?? ""),
    logoUrl: String(raw.logoUrl ?? ""),
    ownerName: raw.ownerName != null && raw.ownerName !== "" ? String(raw.ownerName) : undefined,
    ownerEmail: raw.ownerEmail != null && raw.ownerEmail !== "" ? String(raw.ownerEmail) : undefined,
    ownerPhone: raw.ownerPhone != null && raw.ownerPhone !== "" ? String(raw.ownerPhone) : undefined,
    verificationStatus: (raw.verificationStatus as ShelterProfile["verificationStatus"]) ?? "Pending",
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

/**
 * Fetch notifications for the current shelter (auth required).
 */
export async function fetchShelterNotifications(): Promise<ShelterNotification[]> {
  const res = await fetch(`${API_BASE}/api/shelter/notifications`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/**
 * Mark one notification as read. Auth required.
 */
export async function markShelterNotificationRead(notificationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/shelter/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
}

/**
 * Mark all notifications as read for the current shelter. Auth required.
 */
export async function markAllShelterNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/shelter/notifications/read-all`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
}

/** Map API pet to ShelterPet (ensure arrays and dates) */
function toShelterPet(raw: Record<string, unknown>): ShelterPet {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    species: (raw.species === "dog" || raw.species === "cat" ? raw.species : "dog") as ShelterPet["species"],
    breed: String(raw.breed ?? ""),
    age: Number(raw.age) ?? 0,
    gender: (raw.gender === "male" || raw.gender === "female" || raw.gender === "unknown" ? raw.gender : "unknown") as ShelterPet["gender"],
    image: String(raw.image ?? ""),
    photos: Array.isArray(raw.photos) ? raw.photos.map((u) => String(u)) : [],
    badges: Array.isArray(raw.badges) ? raw.badges.map((b) => String(b)) : [],
    status: (raw.status === "available" || raw.status === "pending" || raw.status === "adopted" ? raw.status : "available") as ShelterPet["status"],
    adoptionStatus: (raw.adoptionStatus === "Available" || raw.adoptionStatus === "Reserved" || raw.adoptionStatus === "Adopted" ? raw.adoptionStatus : "Available") as ShelterPet["adoptionStatus"],
    temperament: raw.temperament != null ? String(raw.temperament) : undefined,
    vaccinationStatus: (raw.vaccinationStatus as ShelterPet["vaccinationStatus"]) ?? undefined,
    medicalNotes: raw.medicalNotes != null ? String(raw.medicalNotes) : undefined,
    specialCareNeeds: raw.specialCareNeeds != null ? String(raw.specialCareNeeds) : undefined,
    livingSpace: (raw.livingSpace as ShelterPet["livingSpace"]) ?? "house-with-yard",
    energyLevel: (raw.energyLevel as ShelterPet["energyLevel"]) ?? "medium",
    experience: (raw.experience as ShelterPet["experience"]) ?? "some",
    kids: (raw.kids as ShelterPet["kids"]) ?? "older",
    specialCare: (raw.specialCare as ShelterPet["specialCare"]) ?? "none",
    size: (raw.size as ShelterPet["size"]) ?? undefined,
    description: raw.description != null ? String(raw.description) : undefined,
    archived: !!raw.archived,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date((raw.createdAt as Date)?.valueOf?.() ?? 0).toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date((raw.updatedAt as Date)?.valueOf?.() ?? 0).toISOString(),
  };
}

/**
 * Fetch all pets for the current shelter. Auth required.
 */
export async function fetchShelterPets(): Promise<ShelterPet[]> {
  const res = await fetch(`${API_BASE}/api/shelter/pets`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data.map((p: Record<string, unknown>) => toShelterPet(p)) : [];
}

/**
 * Create a pet for the current shelter. Auth required.
 */
export async function createShelterPet(pet: Omit<ShelterPet, "id" | "createdAt" | "updatedAt">): Promise<ShelterPet> {
  const res = await fetch(`${API_BASE}/api/shelter/pets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(pet),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return toShelterPet(data as Record<string, unknown>);
}

/**
 * Update a pet. Auth required; pet must belong to current shelter.
 */
export async function updateShelterPet(id: string, updates: Partial<ShelterPet>): Promise<ShelterPet> {
  const { id: _id, createdAt, updatedAt, ...rest } = updates as Partial<ShelterPet> & { id?: string };
  const res = await fetch(`${API_BASE}/api/shelter/pets/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(rest),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return toShelterPet(data as Record<string, unknown>);
}

/**
 * Delete a pet. Auth required; pet must belong to current shelter.
 */
export async function deleteShelterPet(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/shelter/pets/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
}

/** Map API request row to AdoptionRequest type */
function toAdoptionRequest(raw: Record<string, unknown>): AdoptionRequest {
  return {
    id: String(raw.id),
    adopterName: String(raw.adopterName ?? ""),
    adopterEmail: String(raw.adopterEmail ?? ""),
    adopterPhone: raw.adopterPhone != null && raw.adopterPhone !== "" ? String(raw.adopterPhone) : undefined,
    adopterAddress: raw.adopterAddress != null && raw.adopterAddress !== "" ? String(raw.adopterAddress) : undefined,
    petId: String(raw.petId ?? ""),
    petName: String(raw.petName ?? ""),
    petImage: raw.petImage != null && raw.petImage !== "" ? String(raw.petImage) : undefined,
    petSpecies: raw.petSpecies != null ? String(raw.petSpecies) : undefined,
    petBreed: raw.petBreed != null ? String(raw.petBreed) : undefined,
    petAge: raw.petAge != null ? Number(raw.petAge) : undefined,
    petGender: raw.petGender != null ? String(raw.petGender) : undefined,
    petDescription: raw.petDescription != null && raw.petDescription !== "" ? String(raw.petDescription) : undefined,
    petAdoptionStatus: raw.petAdoptionStatus != null ? String(raw.petAdoptionStatus) : undefined,
    status: (raw.status as AdoptionRequest["status"]) ?? "New",
    compatibilityScore: raw.compatibilityScore != null ? Number(raw.compatibilityScore) : null,
    aiReasons: Array.isArray(raw.aiReasons) ? raw.aiReasons.map(String) : [],
    message: raw.message != null ? String(raw.message) : undefined,
    appliedAt: String(raw.appliedAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

/**
 * Fetch adoption requests for the current shelter. Auth required.
 */
export async function fetchShelterRequests(): Promise<AdoptionRequest[]> {
  const res = await fetch(`${API_BASE}/api/shelter/requests`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data.map((r: Record<string, unknown>) => toAdoptionRequest(r)) : [];
}

/**
 * Update adoption request status. Auth required; request must belong to current shelter.
 */
export async function updateShelterRequestStatus(
  requestId: string,
  status: AdoptionRequest["status"]
): Promise<AdoptionRequest> {
  const res = await fetch(`${API_BASE}/api/shelter/requests/${requestId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return toAdoptionRequest(data as Record<string, unknown>);
}

/** Map API campaign to FundraisingCampaign */
function toFundraisingCampaign(raw: Record<string, unknown>): FundraisingCampaign {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    description: raw.description != null && raw.description !== "" ? String(raw.description) : undefined,
    imageUrl: raw.imageUrl != null && raw.imageUrl !== "" ? String(raw.imageUrl) : undefined,
    goal: Number(raw.goal) ?? 0,
    raised: Number(raw.raised) ?? 0,
    endDate: String(raw.endDate ?? ""),
    status: (raw.status as FundraisingCampaign["status"]) ?? "pending",
    createdAt: String(raw.createdAt ?? ""),
  };
}

/**
 * Fetch all campaigns for the current shelter (all statuses). Auth required.
 */
export async function fetchShelterCampaigns(): Promise<FundraisingCampaign[]> {
  const res = await fetch(`${API_BASE}/api/shelter/campaigns`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data.map((c: Record<string, unknown>) => toFundraisingCampaign(c)) : [];
}

/**
 * Upload campaign image. Saves to server data/funds; returns path to store in campaign.imageUrl.
 */
export async function uploadCampaignImage(file: File): Promise<{ path: string }> {
  const token = localStorage.getItem("pawpop_token");
  if (!token) throw new Error("Sign in to upload images");
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/api/shelter/campaigns/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as { path: string };
}

/**
 * Fetch recent donations for the current shelter (all campaigns). Auth required.
 */
export async function fetchShelterDonations(): Promise<Donation[]> {
  const res = await fetch(`${API_BASE}/api/shelter/donations`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data)
    ? data.map((d: Record<string, unknown>) => ({
        id: String(d.id),
        campaignId: d.campaignId != null ? String(d.campaignId) : undefined,
        campaignName: d.campaignName != null ? String(d.campaignName) : undefined,
        amount: Number(d.amount) ?? 0,
        donorName: String(d.donorName ?? ""),
        donorEmail: d.donorEmail != null && d.donorEmail !== "" ? String(d.donorEmail) : null,
        donorPhone: d.donorPhone != null && d.donorPhone !== "" ? String(d.donorPhone) : null,
        donatedAt: String(d.donatedAt ?? ""),
      }))
    : [];
}

/**
 * Create a fundraising campaign (status: pending until admin approves). Auth required.
 * Shelter cannot edit or delete after create.
 */
export async function createShelterCampaign(
  campaign: Omit<FundraisingCampaign, "id" | "raised" | "status" | "createdAt">
): Promise<FundraisingCampaign> {
  const res = await fetch(`${API_BASE}/api/shelter/campaigns`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(campaign),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return toFundraisingCampaign(data as Record<string, unknown>);
}
