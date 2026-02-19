/**
 * Mock data for Shelter dashboard (Sri Lankan context, PawPop branding).
 * Used for adoption requests, events, fundraising, and activity until backend is connected.
 */

import type {
  AdoptionRequest,
  RequestStatus,
  ShelterEvent,
  FundraisingCampaign,
  Donation,
  RecentActivity,
} from "@/types/shelter";

export const mockAdoptionRequests: AdoptionRequest[] = [
  {
    id: "req-1",
    adopterName: "Nadeesha Perera",
    adopterEmail: "nadeesha.p@email.com",
    petId: "pet-1",
    petName: "Luna",
    status: "New",
    compatibilityScore: 94,
    aiReasons: [
      "Active lifestyle matches Luna's high energy—ideal for long walks.",
      "House with yard in Colombo 5 suits her need for space.",
      "Previous dog ownership experience; ready for training commitment.",
    ],
    appliedAt: "2025-02-14T09:30:00Z",
    updatedAt: "2025-02-14T09:30:00Z",
  },
  {
    id: "req-2",
    adopterName: "Samantha Jayawardena",
    adopterEmail: "s.jayawardena@email.com",
    petId: "pet-2",
    petName: "Max",
    status: "Under Review",
    compatibilityScore: 88,
    aiReasons: [
      "Family with older children aligns with Max's gentle nature.",
      "Medium-sized home with outdoor access in Kandy.",
      "Experience with rescue dogs; understands special care needs.",
    ],
    appliedAt: "2025-02-13T14:00:00Z",
    updatedAt: "2025-02-14T08:00:00Z",
  },
  {
    id: "req-3",
    adopterName: "Dilshan Fernando",
    adopterEmail: "dilshan.f@email.com",
    petId: "pet-3",
    petName: "Buddy",
    status: "Interview Scheduled",
    compatibilityScore: 91,
    aiReasons: [
      "First-time adopter with stable schedule—good for Buddy's routine.",
      "Apartment in Negombo with nearby park for daily exercise.",
      "Open to basic obedience training; Buddy responds well to positive reinforcement.",
    ],
    appliedAt: "2025-02-12T11:20:00Z",
    updatedAt: "2025-02-14T10:00:00Z",
  },
  {
    id: "req-4",
    adopterName: "Kavindi Silva",
    adopterEmail: "kavindi.s@email.com",
    petId: "pet-4",
    petName: "Charlie",
    status: "Approved",
    compatibilityScore: 89,
    aiReasons: [
      "Young professional with flexible WFH—can provide companionship.",
      "House with garden in Galle; Charlie enjoys outdoor play.",
      "Willing to continue Charlie's anxiety support routine.",
    ],
    appliedAt: "2025-02-10T16:45:00Z",
    updatedAt: "2025-02-13T15:00:00Z",
  },
];

export const mockEvents: ShelterEvent[] = [
  {
    id: "ev-1",
    title: "PawPop Adoption Drive – Colombo",
    date: "2025-02-22",
    location: "Viharamahadevi Park, Colombo 7",
    description:
      "Meet adoptable dogs and cats from partner shelters. Vet checks, microchipping info, and adoption counselling on site. Brought to you by PawPop and local AWOs.",
    bannerUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    createdAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "ev-2",
    title: "Fundraising Walk for Stray Care",
    date: "2025-03-08",
    location: "Beira Lake Promenade, Colombo",
    description:
      "5 km walk to raise funds for stray feeding and TNR programmes. Registration open; all proceeds go to PawPop partner shelters.",
    bannerUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    createdAt: "2025-02-05T09:00:00Z",
  },
  {
    id: "ev-3",
    title: "Pet First Aid Workshop",
    date: "2025-02-28",
    location: "PawPop Hub, Nugegoda",
    description:
      "Free workshop on basic pet first aid and when to visit a vet. Suitable for adopters and foster carers.",
    createdAt: "2025-02-10T12:00:00Z",
  },
];

export const mockCampaigns: FundraisingCampaign[] = [
  {
    id: "camp-1",
    title: "Medical Fund – Rescue & Recovery",
    goal: 250000,
    raised: 187500,
    endDate: "2025-03-31",
    createdAt: "2025-01-15T08:00:00Z",
  },
  {
    id: "camp-2",
    title: "Shelter Kennel Renovation",
    goal: 100000,
    raised: 42000,
    endDate: "2025-04-15",
    createdAt: "2025-02-01T10:00:00Z",
  },
];

export const mockDonations: Donation[] = [
  { id: "don-1", campaignId: "camp-1", amount: 5000, donorName: "Anonymous", donatedAt: "2025-02-14T08:00:00Z" },
  { id: "don-2", campaignId: "camp-1", amount: 10000, donorName: "Rajitha M.", message: "For Luna's recovery.", donatedAt: "2025-02-13T14:30:00Z" },
  { id: "don-3", campaignId: "camp-1", amount: 2500, donorName: "Chaminda K.", donatedAt: "2025-02-12T09:15:00Z" },
  { id: "don-4", campaignId: "camp-2", amount: 15000, donorName: "Corporate Donor Ltd", donatedAt: "2025-02-11T11:00:00Z" },
];

export const mockRecentActivity: RecentActivity[] = [
  { id: "act-1", type: "request", title: "New adoption request", description: "Nadeesha Perera applied for Luna (94% match)", timestamp: "2025-02-14T09:30:00Z" },
  { id: "act-2", type: "donation", title: "Donation received", description: "LKR 10,000 from Rajitha M. for Medical Fund", timestamp: "2025-02-13T14:30:00Z" },
  { id: "act-3", type: "adoption", title: "Adoption approved", description: "Charlie adopted by Kavindi Silva", timestamp: "2025-02-13T15:00:00Z" },
  { id: "act-4", type: "event", title: "Event reminder", description: "Adoption Drive – Colombo on 22 Feb", timestamp: "2025-02-13T08:00:00Z" },
  { id: "act-5", type: "request", title: "Interview scheduled", description: "Dilshan Fernando – Buddy on 16 Feb", timestamp: "2025-02-12T16:00:00Z" },
];

export const requestStatusOrder: RequestStatus[] = [
  "New",
  "Under Review",
  "Interview Scheduled",
  "Approved",
  "Rejected",
];

export function getDonationsForCurrentMonth(donations: Donation[]): number {
  const now = new Date();
  return donations
    .filter((d) => {
      const date = new Date(d.donatedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, d) => sum + d.amount, 0);
}

export function getUpcomingEvents(events: ShelterEvent[], limit = 3): ShelterEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}
