/**
 * Shelter dashboard types. Align with AI matching dimensions (see matchMockData).
 */

export type LivingSpace = "apartment" | "house" | "house-with-yard";
export type EnergyLevel = "low" | "medium" | "high" | "very-high";
export type ExperienceLevel = "first-time" | "some" | "experienced";
export type KidsAtHome = "none" | "young" | "older" | "any";
export type SpecialCare = "none" | "anxiety" | "medical" | "senior" | "training";

export type PetStatus = "available" | "pending" | "adopted";
export type AdoptionStatus = "Available" | "Reserved" | "Adopted";
export type Gender = "male" | "female" | "unknown";
export type VaccinationStatus = "up-to-date" | "partial" | "not-started" | "unknown";

export interface ShelterPet {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  age: number;
  gender?: Gender;
  image: string;
  photos?: string[];
  badges: string[];
  status: PetStatus;
  adoptionStatus?: AdoptionStatus;
  temperament?: string;
  vaccinationStatus?: VaccinationStatus;
  medicalNotes?: string;
  specialCareNeeds?: string;
  livingSpace: LivingSpace;
  energyLevel: EnergyLevel;
  experience: ExperienceLevel;
  kids: KidsAtHome;
  specialCare: SpecialCare;
  size?: "small" | "medium" | "large";
  weight?: number | null;
  height?: number | null;
  description?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShelterProfile {
  organizationName: string;
  description: string;
  address: string;
  district?: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
  /** Shelter / organisation owner or primary contact person */
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  verificationStatus?: "Pending" | "Verified";
  updatedAt: string;
}

/** Adoption request pipeline status */
export type RequestStatus = "New" | "Under Review" | "Interview Scheduled" | "Approved" | "Rejected" | "Cancelled";

export interface AdoptionRequest {
  id: string;
  adopterName: string;
  adopterEmail: string;
  adopterPhone?: string | null;
  adopterAddress?: string | null;
  petId: string;
  petName: string;
  /** Pet details (included when listing shelter requests) */
  petImage?: string | null;
  petSpecies?: string | null;
  petBreed?: string | null;
  petAge?: number | null;
  petGender?: string | null;
  petDescription?: string | null;
  petAdoptionStatus?: string | null;
  status: RequestStatus;
  /** AI match score 0–100, or null if adopter hasn't completed matching for this pet */
  compatibilityScore: number | null;
  aiReasons: string[];
  message?: string;
  appliedAt: string;
  updatedAt: string;
}

/** Shelter info returned with a single event (organizer details) */
export interface EventShelterInfo {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

export interface ShelterEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  bannerUrl?: string;
  /** Optional price display e.g. "Free", "GHS 150" */
  priceText?: string;
  /** Total like count (from API) */
  likeCount?: number;
  /** Current visitor has liked (when visitorId passed) */
  liked?: boolean;
  /** Organizer details (included when fetching single event) */
  shelter?: EventShelterInfo;
  createdAt: string;
  /** Present when loaded via admin API; event is hidden from public when true */
  blocked?: boolean;
}

export type FundraisingCampaignStatus = "pending" | "approved" | "rejected";

export interface FundraisingCampaign {
  id: string;
  title: string;
  description?: string;
  /** Image URL (e.g. /api/shelter/campaigns/uploads/...) */
  imageUrl?: string;
  goal: number;
  raised: number;
  endDate: string;
  status?: FundraisingCampaignStatus;
  createdAt: string;
}

export interface Donation {
  id: string;
  campaignId?: string;
  campaignName?: string;
  amount: number;
  donorName: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  message?: string;
  donatedAt: string;
}

export interface RecentActivity {
  id: string;
  type: "adoption" | "request" | "donation" | "event";
  title: string;
  description: string;
  timestamp: string;
}

export type ShelterNotificationType = "payout" | "donation" | "request" | "fundraising";

export interface ShelterNotification {
  id: string;
  type: ShelterNotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
