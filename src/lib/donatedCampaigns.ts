const STORAGE_KEY = "pawpop_donated_campaign_ids";

export function getDonatedCampaignIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markCampaignDonated(campaignId: string): void {
  const ids = getDonatedCampaignIds();
  if (ids.includes(campaignId)) return;
  ids.push(campaignId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function hasDonatedToCampaign(campaignId: string): boolean {
  return getDonatedCampaignIds().includes(campaignId);
}
