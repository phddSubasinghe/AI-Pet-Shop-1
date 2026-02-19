const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const STORAGE_LIKED = "pawpop_liked_pets";
const STORAGE_WISHLIST = "pawpop_wishlist_pets";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("pawpop_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface BrowsePet {
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
  /** Number of adoption requests for this pet (shown on browse cards) */
  requestCount?: number;
}

/** Full pet detail (single pet page) with like/wishlist state */
export interface PetDetail extends BrowsePet {
  gender?: string;
  temperament?: string | null;
  vaccinationStatus?: string;
  medicalNotes?: string | null;
  specialCareNeeds?: string | null;
  livingSpace?: string | null;
  energyLevel?: string | null;
  experience?: string | null;
  kids?: string | null;
  specialCare?: string | null;
  size?: string;
  weight?: number | null;
  height?: number | null;
  description?: string | null;
  badges?: string[];
  vaccinated?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  isLiked?: boolean;
  isInWishlist?: boolean;
  hasApplied?: boolean;
  shelterLogoUrl?: string | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error((errBody as { error?: string }).error ?? res.statusText);
  }
  return res.json();
}

/** Fetch pets available for adoption (public, no auth). */
export async function fetchPets(status?: "available" | "reserved" | "adopted"): Promise<BrowsePet[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const list = await request<BrowsePet[]>(`/api/pets${q}`);
  return Array.isArray(list) ? list : [];
}

/** Fetch a single pet by id with full details. Sends auth if present for isLiked/isInWishlist. */
export async function fetchPet(id: string): Promise<PetDetail | null> {
  const pet = await request<PetDetail>(`/api/pets/${id}`, {
    headers: getAuthHeaders(),
  }).catch(() => null);
  if (!pet) return null;
  const token = localStorage.getItem("pawpop_token");
  if (!token) {
    pet.isLiked = getLocalLikedIds().includes(pet.id);
    pet.isInWishlist = getLocalWishlistIds().includes(pet.id);
  }
  return pet;
}

function getLocalLikedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_LIKED);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function getLocalWishlistIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_WISHLIST);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setLocalLikedIds(ids: string[]): void {
  localStorage.setItem(STORAGE_LIKED, JSON.stringify(ids));
}

function setLocalWishlistIds(ids: string[]): void {
  localStorage.setItem(STORAGE_WISHLIST, JSON.stringify(ids));
}

/** Toggle like for a pet. Uses API when logged in, else localStorage. Returns new liked state. */
export async function toggleLike(petId: string): Promise<boolean> {
  const token = localStorage.getItem("pawpop_token");
  if (token) {
    const data = await request<{ liked: boolean }>(`/api/me/likes/${petId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return data.liked;
  }
  const ids = getLocalLikedIds();
  const has = ids.includes(petId);
  const next = has ? ids.filter((id) => id !== petId) : [...ids, petId];
  setLocalLikedIds(next);
  return !has;
}

/** Toggle wishlist for a pet. Uses API when logged in, else localStorage. Returns new inWishlist state. */
export async function toggleWishlist(petId: string): Promise<boolean> {
  const token = localStorage.getItem("pawpop_token");
  if (token) {
    const data = await request<{ inWishlist: boolean }>(`/api/me/wishlist/${petId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return data.inWishlist;
  }
  const ids = getLocalWishlistIds();
  const has = ids.includes(petId);
  const next = has ? ids.filter((id) => id !== petId) : [...ids, petId];
  setLocalWishlistIds(next);
  return !has;
}

/** Resolve pet image URL for display (prepend API base if path is relative). */
export function petImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}
