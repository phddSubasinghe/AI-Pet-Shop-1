const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export interface AdoptionReviewItem {
  id: string;
  adopterName: string;
  petName: string | null;
  image: string;
  rating: number;
  message: string;
  createdAt: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("pawpop_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Resolve adoption review image URL (prepend API base if path is relative) */
export function adoptionReviewImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

/** GET /api/adoption-reviews – list of happy match reviews (public) */
export async function fetchAdoptionReviews(): Promise<AdoptionReviewItem[]> {
  const res = await fetch(`${API_BASE}/api/adoption-reviews`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/** POST /api/adoption-reviews – submit a happy match review (adopter, image + rating + message) */
export async function submitAdoptionReview(payload: {
  image: File;
  rating: number;
  message: string;
}): Promise<AdoptionReviewItem> {
  const form = new FormData();
  form.append("image", payload.image);
  form.append("rating", String(payload.rating));
  form.append("message", payload.message.trim());
  const res = await fetch(`${API_BASE}/api/adoption-reviews`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as AdoptionReviewItem;
}
