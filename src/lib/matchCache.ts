/**
 * Client-side cache for AI match scores (by pet id). Used on browse-pets to show
 * compatibility score when adopter has completed the questionnaire; otherwise show prompt.
 */

const MATCH_CACHE_KEY = "pawpop_match_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface MatchCache {
  savedAt: number;
  scoresByPetId: Record<string, number>;
}

export function getMatchCache(): MatchCache | null {
  try {
    const raw = localStorage.getItem(MATCH_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as MatchCache;
    if (!data || typeof data.savedAt !== "number" || typeof data.scoresByPetId !== "object") return null;
    if (Date.now() - data.savedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

/** Save scores from matchmaking recommendations. Call when user lands on match results. */
export function setMatchCache(recommendations: { petId: string; score: number }[]): void {
  const scoresByPetId: Record<string, number> = {};
  for (const r of recommendations) {
    scoresByPetId[r.petId] = r.score;
  }
  const cache: MatchCache = { savedAt: Date.now(), scoresByPetId };
  localStorage.setItem(MATCH_CACHE_KEY, JSON.stringify(cache));
}

/** Get cached score for a pet, or null if not in cache. */
export function getScoreForPet(petId: string): number | null {
  const cache = getMatchCache();
  if (!cache) return null;
  const score = cache.scoresByPetId[petId];
  return typeof score === "number" ? score : null;
}

/** True if adopter has completed AI matching and cache is valid. */
export function hasCompletedMatch(): boolean {
  return getMatchCache() != null;
}
