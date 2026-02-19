/**
 * Admin dashboard types: users, shelters, sellers, pets, adoptions, donations, analytics.
 */

export type UserRole = "adopter" | "shelter" | "seller" | "admin";
export type UserStatus = "active" | "pending" | "blocked";
export type VerificationStatus = "Pending" | "Verified" | "Rejected";
export type AdoptionRequestStatus =
  | "Requested"
  | "Under Review"
  | "Interview Scheduled"
  | "Approved"
  | "Rejected"
  | "Cancelled";
export type DonationType = "one-time" | "recurring";
export type PetAdoptionStatus = "available" | "reserved" | "adopted";

export interface AdminSellerPayout {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  status: "pending" | "paid";
  paidAt: string | null;
  createdAt: string;
}

export interface AdminSellerPendingBalance {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  pendingAmount: number;
}

export interface AdminShelterPayout {
  id: string;
  shelterId: string;
  shelterName: string;
  shelterEmail: string;
  amount: number;
  status: "pending" | "paid";
  paidAt: string | null;
  createdAt: string;
}

export interface AdminShelterPendingBalance {
  shelterId: string;
  shelterName: string;
  shelterEmail: string;
  pendingAmount: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  district?: string;
  createdAt: string;
  lastActiveAt?: string;
  requestsCount?: number;
  donationsCount?: number;
}

export interface AdminShelter {
  id: string;
  orgName: string;
  contactName: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  submittedAt: string;
  verificationStatus: VerificationStatus;
  submittedDocs?: string[];
}

export interface AdminSeller {
  id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  district: string;
  address: string;
  submittedAt: string;
  verificationStatus: VerificationStatus;
  submittedDocs?: string[];
}

export interface AdminPet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age: string;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  shelterId: string;
  shelterName: string;
  shelterEmail?: string;
  shelterAddress?: string | null;
  shelterPhone?: string | null;
  status?: string;
  adoptionStatus: PetAdoptionStatus;
  flagged: boolean;
  vaccinated: boolean;
  vaccinationStatus?: string;
  temperament?: string | null;
  medicalNotes?: string | null;
  specialCareNeeds?: string | null;
  /** Combined medical/special care for list display */
  specialCareNotes?: string | null;
  description?: string | null;
  livingSpace?: string | null;
  energyLevel?: string | null;
  experience?: string | null;
  kids?: string | null;
  specialCare?: string | null;
  size?: string | null;
  badges?: string[];
  images: string[];
  listedAt: string;
  updatedAt?: string;
}

export interface AdminAdoptionRequest {
  id: string;
  adopterId: string;
  adopterName: string;
  adopterEmail: string;
  adopterPhone?: string | null;
  adopterAddress?: string | null;
  shelterId: string;
  shelterName: string;
  petId: string;
  petName: string;
  petSpecies: string;
  aiCompatibilityScore: number;
  submittedAt: string;
  status: AdoptionRequestStatus;
  statusHistory?: { status: AdoptionRequestStatus; at: string }[];
  aiReasons?: string[];
  escalated?: boolean;
  escalatedAt?: string | null;
}

export interface AdminDonation {
  id: string;
  donorName: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  amount: number;
  type: DonationType;
  shelterId: string;
  shelterName: string;
  campaignId: string | null;
  campaignName: string | null;
  date: string;
}

export interface AdminCampaign {
  id: string;
  name: string;
  goal: number;
  raised: number;
  currency: string;
  active: boolean;
  startDate: string;
  endDate?: string;
}

export type AdminFundraisingCampaignStatus = "pending" | "approved" | "rejected";

export interface AdminFundraisingCampaign {
  id: string;
  shelterId: string;
  shelterName: string;
  title: string;
  description?: string;
  imageUrl?: string;
  goal: number;
  raised: number;
  endDate: string;
  status: AdminFundraisingCampaignStatus;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  donationsByMonth: { month: string; amount: number }[];
  adoptionRequestsByStatus: { status: AdoptionRequestStatus; count: number }[];
  topAdoptedPetTypes: { species: string; count: number }[];
  averageAiCompatibilityScore: number;
  totalUsers: number;
  verifiedShelters: number;
  verifiedSellers: number;
  activePetsListed: number;
}

export interface ActivityItem {
  id: string;
  type: "approval" | "new_listing" | "new_request" | "donation" | "user";
  title: string;
  description: string;
  at: string;
  meta?: Record<string, string>;
}
