const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("pawpop_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface MeProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  contactNumber?: string | null;
  address?: string | null;
}

/** Fetch current user profile (for edit form). */
export async function getProfile(): Promise<MeProfile> {
  const res = await fetch(`${API_BASE}/api/me/profile`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as MeProfile;
}

/** Update own profile (name, contactNumber, address). Email cannot be changed. */
export async function updateProfile(updates: { name?: string; contactNumber?: string | null; address?: string | null }): Promise<MeProfile> {
  const res = await fetch(`${API_BASE}/api/me/profile`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as MeProfile;
}

export type AdopterRequestStatus = "New" | "Under Review" | "Interview Scheduled" | "Approved" | "Rejected" | "Cancelled";

export interface AdopterAdoptionRequest {
  id: string;
  petId: string;
  petName: string;
  shelterId: string;
  shelterName: string;
  status: AdopterRequestStatus;
  appliedAt: string;
  updatedAt: string;
}

/** Fetch adoption requests for the current adopter. */
export async function fetchMyAdoptionRequests(): Promise<AdopterAdoptionRequest[]> {
  const res = await fetch(`${API_BASE}/api/me/adoption-requests`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/** Cancel own adoption request (adopter only). Returns updated request. */
export async function cancelAdoptionRequest(requestId: string): Promise<AdopterAdoptionRequest> {
  const res = await fetch(`${API_BASE}/api/me/adoption-requests/${requestId}/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as AdopterAdoptionRequest;
}

/** Saved pet (same shape as BrowsePet from pets API). */
export interface SavedPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age: string;
  gender?: string;
  energyLevel?: string | null;
  weight?: number | null;
  height?: number | null;
  shelterId: string;
  shelterName: string;
  shelterEmail?: string | null;
  shelterAddress?: string | null;
  shelterPhone?: string | null;
  adoptionStatus: "available" | "reserved" | "adopted";
  images: string[];
  listedAt: string;
}

/** Fetch saved pets (liked + wishlist) for current user. Auth required. */
export async function fetchSavedPets(): Promise<SavedPet[]> {
  const res = await fetch(`${API_BASE}/api/me/saved-pets`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/** Remove a pet from saved (both liked and wishlist). Auth required. */
export async function removeFromSavedPets(petId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/me/saved-pets/${petId}/remove`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
}

/** Fetch wishlist product ids for current user. Auth required. */
export async function fetchWishlistProductIds(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/me/wishlist-products`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  const list = (data as { productIds?: string[] }).productIds;
  return Array.isArray(list) ? list : [];
}

/** Toggle product in wishlist. Auth required. Returns new inWishlist state. */
export async function toggleProductWishlist(productId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/me/wishlist-products/${productId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return (data as { inWishlist: boolean }).inWishlist;
}
