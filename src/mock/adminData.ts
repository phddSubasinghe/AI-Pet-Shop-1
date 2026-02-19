/**
 * Mock data for Admin dashboard. Sri Lankan context: Colombo, Kandy, Galle, Jaffna. LKR. PawPop.
 */

import type {
  AdminUser,
  AdminShelter,
  AdminSeller,
  AdminPet,
  AdminAdoptionRequest,
  AdminDonation,
  AdminCampaign,
  AnalyticsSnapshot,
  ActivityItem,
} from "@/types/admin";

const districts = ["Colombo", "Kandy", "Galle", "Jaffna"] as const;

export const mockAdminUsers: AdminUser[] = [
  { id: "u1", name: "Nadeesha Perera", email: "nadeesha@email.com", role: "adopter", status: "active", district: "Colombo", createdAt: "2025-01-10T09:00:00Z", lastActiveAt: "2025-02-14T08:00:00Z", requestsCount: 2, donationsCount: 1 },
  { id: "u2", name: "Samantha Jayawardena", email: "s.j@email.com", role: "adopter", status: "active", district: "Kandy", createdAt: "2025-02-01T12:00:00Z", lastActiveAt: "2025-02-13T14:00:00Z", requestsCount: 1, donationsCount: 0 },
  { id: "u3", name: "Dilshan Fernando", email: "dilshan@email.com", role: "shelter", status: "active", district: "Galle", createdAt: "2024-11-15T10:00:00Z", lastActiveAt: "2025-02-14T07:00:00Z", requestsCount: 0, donationsCount: 0 },
  { id: "u4", name: "Nimal Perera", email: "nimal@petparadise.lk", role: "seller", status: "active", district: "Colombo", createdAt: "2025-01-05T08:00:00Z", lastActiveAt: "2025-02-14T09:00:00Z", requestsCount: 0, donationsCount: 2 },
  { id: "u5", name: "Admin User", email: "admin@pawpop.lk", role: "admin", status: "active", createdAt: "2024-06-01T00:00:00Z", lastActiveAt: "2025-02-14T09:30:00Z" },
  { id: "u6", name: "Kumari Silva", email: "kumari@email.com", role: "adopter", status: "pending", district: "Jaffna", createdAt: "2025-02-12T16:00:00Z", requestsCount: 0, donationsCount: 0 },
  { id: "u7", name: "Rescue Haven", email: "contact@rescuehaven.lk", role: "shelter", status: "active", district: "Colombo", createdAt: "2024-09-20T11:00:00Z", lastActiveAt: "2025-02-14T06:00:00Z" },
];

export const mockAdminShelters: AdminShelter[] = [
  { id: "sh1", orgName: "Rescue Haven", contactName: "Dilshan Fernando", email: "contact@rescuehaven.lk", phone: "772345678", district: "Galle", address: "78 Beach Rd, Galle", submittedAt: "2024-09-20T11:00:00Z", verificationStatus: "Verified", submittedDocs: ["registration.pdf", "address_proof.pdf"] },
  { id: "sh2", orgName: "Paws & Claws AWO", contactName: "Anura Wijesinghe", email: "info@pawsclaws.lk", phone: "771234567", district: "Colombo", address: "45 Independence Ave, Colombo 7", submittedAt: "2025-02-10T09:00:00Z", verificationStatus: "Pending", submittedDocs: ["registration.pdf"] },
  { id: "sh3", orgName: "Kandy Animal Care", contactName: "Malini Herath", email: "admin@kandyanimal.lk", phone: "773456789", district: "Kandy", address: "12 Temple St, Kandy", submittedAt: "2025-02-08T14:00:00Z", verificationStatus: "Rejected", submittedDocs: ["registration.pdf"] },
];

export const mockAdminSellers: AdminSeller[] = [
  { id: "sl1", shopName: "Pet Paradise", ownerName: "Nimal Perera", email: "nimal@petparadise.lk", phone: "7723456789", district: "Colombo", address: "Warehouse A, Colombo 10", submittedAt: "2025-01-05T08:00:00Z", verificationStatus: "Verified", submittedDocs: ["business_reg.pdf", "tax_id.pdf"] },
  { id: "sl2", shopName: "Happy Paws Store", ownerName: "Chamari Liyanage", email: "chamari@happypaws.lk", phone: "774567890", district: "Kandy", address: "34 Lake Rd, Kandy", submittedAt: "2025-02-12T10:00:00Z", verificationStatus: "Pending", submittedDocs: ["business_reg.pdf"] },
];

export const mockAdminPets: AdminPet[] = [
  { id: "pet1", name: "Max", species: "Dog", breed: "Mixed", age: "2 years", shelterId: "sh1", shelterName: "Rescue Haven", adoptionStatus: "available", flagged: false, vaccinated: true, specialCareNotes: "Good with kids.", images: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&fit=crop"], listedAt: "2025-02-01T10:00:00Z" },
  { id: "pet2", name: "Luna", species: "Cat", breed: "Siamese", age: "1 year", shelterId: "sh1", shelterName: "Rescue Haven", adoptionStatus: "reserved", flagged: false, vaccinated: true, images: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&fit=crop"], listedAt: "2025-02-05T14:00:00Z" },
  { id: "pet3", name: "Buddy", species: "Dog", breed: "Labrador", age: "3 years", shelterId: "sh1", shelterName: "Rescue Haven", adoptionStatus: "adopted", flagged: false, vaccinated: true, images: ["https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&fit=crop"], listedAt: "2024-12-10T09:00:00Z" },
  { id: "pet4", name: "Milo", species: "Cat", age: "6 months", shelterId: "sh2", shelterName: "Paws & Claws AWO", adoptionStatus: "available", flagged: true, vaccinated: false, specialCareNotes: "Needs vaccination before adoption.", images: ["https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&fit=crop"], listedAt: "2025-02-11T08:00:00Z" },
  { id: "pet5", name: "Rex", species: "Dog", breed: "Beagle", age: "4 years", shelterId: "sh1", shelterName: "Rescue Haven", adoptionStatus: "available", flagged: false, vaccinated: true, images: ["https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400&fit=crop"], listedAt: "2025-02-08T12:00:00Z" },
];

export const mockAdminAdoptionRequests: AdminAdoptionRequest[] = [
  { id: "ar1", adopterId: "u1", adopterName: "Nadeesha Perera", adopterEmail: "nadeesha@email.com", shelterId: "sh1", shelterName: "Rescue Haven", petId: "pet1", petName: "Max", petSpecies: "Dog", aiCompatibilityScore: 92, submittedAt: "2025-02-12T11:00:00Z", status: "Under Review", statusHistory: [{ status: "Requested", at: "2025-02-12T11:00:00Z" }, { status: "Under Review", at: "2025-02-13T09:00:00Z" }], aiReasons: ["Living situation suitable for dog", "Previous pet experience"] },
  { id: "ar2", adopterId: "u2", adopterName: "Samantha Jayawardena", adopterEmail: "s.j@email.com", shelterId: "sh1", shelterName: "Rescue Haven", petId: "pet2", petName: "Luna", petSpecies: "Cat", aiCompatibilityScore: 88, submittedAt: "2025-02-10T14:00:00Z", status: "Interview Scheduled", statusHistory: [{ status: "Requested", at: "2025-02-10T14:00:00Z" }, { status: "Under Review", at: "2025-02-11T10:00:00Z" }, { status: "Interview Scheduled", at: "2025-02-12T16:00:00Z" }], aiReasons: ["Cat-friendly home", "Stable routine"] },
  { id: "ar3", adopterId: "u6", adopterName: "Kumari Silva", adopterEmail: "kumari@email.com", shelterId: "sh1", shelterName: "Rescue Haven", petId: "pet5", petName: "Rex", petSpecies: "Dog", aiCompatibilityScore: 65, submittedAt: "2025-02-14T08:00:00Z", status: "Requested", aiReasons: [] },
  { id: "ar4", adopterId: "u1", adopterName: "Nadeesha Perera", adopterEmail: "nadeesha@email.com", shelterId: "sh1", shelterName: "Rescue Haven", petId: "pet3", petName: "Buddy", petSpecies: "Dog", aiCompatibilityScore: 90, submittedAt: "2025-01-05T10:00:00Z", status: "Approved", statusHistory: [{ status: "Requested", at: "2025-01-05T10:00:00Z" }, { status: "Under Review", at: "2025-01-06T09:00:00Z" }, { status: "Interview Scheduled", at: "2025-01-08T14:00:00Z" }, { status: "Approved", at: "2025-01-10T11:00:00Z" }], aiReasons: ["Ideal match for large dog"] },
  { id: "ar5", adopterId: "u2", adopterName: "Samantha Jayawardena", adopterEmail: "s.j@email.com", shelterId: "sh1", shelterName: "Rescue Haven", petId: "pet4", petName: "Milo", petSpecies: "Cat", aiCompatibilityScore: 72, submittedAt: "2025-02-01T09:00:00Z", status: "Rejected", statusHistory: [{ status: "Requested", at: "2025-02-01T09:00:00Z" }, { status: "Under Review", at: "2025-02-02T10:00:00Z" }, { status: "Rejected", at: "2025-02-03T15:00:00Z" }], aiReasons: [] },
];

export const mockAdminDonations: AdminDonation[] = [
  { id: "d1", donorName: "Nadeesha Perera", amount: 5000, type: "one-time", campaignId: "c1", campaignName: "Shelter Food Drive Feb 2025", date: "2025-02-14T09:00:00Z" },
  { id: "d2", donorName: "Nimal Perera", amount: 10000, type: "recurring", campaignId: "c1", campaignName: "Shelter Food Drive Feb 2025", date: "2025-02-13T14:00:00Z" },
  { id: "d3", donorName: "Anonymous", amount: 2500, type: "one-time", campaignId: "c1", campaignName: "Shelter Food Drive Feb 2025", date: "2025-02-12T11:00:00Z" },
  { id: "d4", donorName: "Samantha J.", amount: 7500, type: "one-time", campaignId: "c2", campaignName: "Vet Care Fund", date: "2025-02-10T16:00:00Z" },
  { id: "d5", donorName: "Nimal Perera", amount: 10000, type: "recurring", campaignId: "c1", campaignName: "Shelter Food Drive Feb 2025", date: "2025-02-01T08:00:00Z" },
];

export const mockAdminCampaigns: AdminCampaign[] = [
  { id: "c1", name: "Shelter Food Drive Feb 2025", goal: 500000, raised: 125000, currency: "LKR", active: true, startDate: "2025-02-01", endDate: "2025-02-28" },
  { id: "c2", name: "Vet Care Fund", goal: 200000, raised: 87500, currency: "LKR", active: true, startDate: "2025-01-15" },
  { id: "c3", name: "Emergency Rescue Jan 2025", goal: 100000, raised: 100000, currency: "LKR", active: false, startDate: "2025-01-01", endDate: "2025-01-31" },
];

export const mockAnalyticsSnapshots: AnalyticsSnapshot = {
  donationsByMonth: [
    { month: "Sep 2024", amount: 85000 },
    { month: "Oct 2024", amount: 92000 },
    { month: "Nov 2024", amount: 78000 },
    { month: "Dec 2024", amount: 120000 },
    { month: "Jan 2025", amount: 95000 },
    { month: "Feb 2025", amount: 67000 },
  ],
  adoptionRequestsByStatus: [
    { status: "Requested", count: 1 },
    { status: "Under Review", count: 1 },
    { status: "Interview Scheduled", count: 1 },
    { status: "Approved", count: 1 },
    { status: "Rejected", count: 1 },
  ],
  topAdoptedPetTypes: [
    { species: "Dog", count: 12 },
    { species: "Cat", count: 8 },
    { species: "Rabbit", count: 2 },
  ],
  averageAiCompatibilityScore: 81.4,
  totalUsers: 1247,
  verifiedShelters: 8,
  verifiedSellers: 5,
  activePetsListed: 42,
};

export const mockAdminActivity: ActivityItem[] = [
  { id: "a1", type: "approval", title: "New shelter pending", description: "Paws & Claws AWO submitted verification documents.", at: "2025-02-10T09:00:00Z", meta: { orgName: "Paws & Claws AWO" } },
  { id: "a2", type: "new_listing", title: "New pet listed", description: "Milo (Cat) listed by Paws & Claws AWO.", at: "2025-02-11T08:00:00Z", meta: { petName: "Milo" } },
  { id: "a3", type: "new_request", title: "Adoption request", description: "Kumari Silva requested to adopt Rex from Rescue Haven.", at: "2025-02-14T08:00:00Z", meta: { adopterName: "Kumari Silva", petName: "Rex" } },
  { id: "a4", type: "donation", title: "Donation received", description: "Nadeesha Perera donated LKR 5,000 to Shelter Food Drive Feb 2025.", at: "2025-02-14T09:00:00Z", meta: { amount: "5000" } },
  { id: "a5", type: "user", title: "New user signup", description: "Kumari Silva signed up as adopter.", at: "2025-02-12T16:00:00Z", meta: { userName: "Kumari Silva" } },
];
