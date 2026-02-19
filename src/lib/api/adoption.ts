const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("pawpop_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AdoptionRequestPayload {
  id: string;
  adopterName: string;
  adopterEmail: string;
  petId: string;
  petName: string;
  status: string;
  compatibilityScore: number | null;
  aiReasons: string[];
  message?: string;
  appliedAt: string;
  updatedAt: string;
}

/**
 * Submit an adoption request for a pet. Requires login as adopter.
 * Pass compatibilityScore (0–100) and aiReasons when the adopter has AI match data (e.g. from match cache).
 * Request is sent to the shelter in realtime.
 */
export async function createAdoptionRequest(
  petId: string,
  message?: string,
  compatibilityScore?: number | null,
  aiReasons?: string[]
): Promise<AdoptionRequestPayload> {
  const body: Record<string, unknown> = { petId, message: message ?? "" };
  if (compatibilityScore != null && Number.isFinite(compatibilityScore) && compatibilityScore >= 0 && compatibilityScore <= 100) {
    body.compatibilityScore = Math.round(compatibilityScore);
  }
  if (Array.isArray(aiReasons) && aiReasons.length > 0) {
    body.aiReasons = aiReasons.slice(0, 20).filter((r) => typeof r === "string");
  }
  const res = await fetch(`${API_BASE}/api/adoption-requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as AdoptionRequestPayload;
}
