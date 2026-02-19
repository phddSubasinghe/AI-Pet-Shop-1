import { getToken } from "@/lib/auth";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Adopter profile for matchmaking (matches questionnaire + backend). */
export interface AdopterProfilePayload {
  livingSpace: string;
  energyLevel: string;
  experience: string;
  kids: string;
  specialCare: string;
  hasCats?: boolean;
  time_available?: string;
  timeAvailable?: string;
  preferredSpecies?: string;
  preferredSize?: string;
  /** Optional free text: interests, preferences, breed/trait preferences. Used by AI when scoring against pet breed, description, and full profile. */
  additionalInterests?: string;
}

/** Single recommendation from API. */
export interface MatchmakingRecommendation {
  petId: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    image?: string | null;
    age?: number | null;
  };
  score: number;
  label: "SUITABLE" | "CONDITIONAL" | "NOT_SUITABLE";
  reasons: string[];
  risks: string[];
  missing_info: string[];
  version: string;
}

export interface MatchmakingResponse {
  recommendations: MatchmakingRecommendation[];
  count: number;
}

/**
 * Get ranked pet recommendations for an adopter profile. Requires auth (adopter or admin).
 */
export async function getRecommendations(
  adopterProfile: AdopterProfilePayload
): Promise<MatchmakingResponse> {
  const token = getToken();
  if (!token) {
    throw new Error("Sign in to get your AI pet matches.");
  }
  const res = await fetch(`${API_BASE}/api/matchmaking/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      adopterProfile: {
        ...adopterProfile,
        time_available: adopterProfile.time_available ?? adopterProfile.timeAvailable ?? "medium",
        hasCats: adopterProfile.hasCats ?? false,
        additionalInterests: adopterProfile.additionalInterests?.trim() || undefined,
      },
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string }).error ?? res.statusText;
    if (res.status === 401) throw new Error("Sign in to get your AI pet matches.");
    if (res.status === 403) throw new Error("Adopter or admin access required.");
    throw new Error(msg);
  }
  return res.json();
}
