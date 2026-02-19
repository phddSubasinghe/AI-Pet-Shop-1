/**
 * Mock data for AI Matching flow (no backend).
 * Adopter answers, pets catalog, and AI output.
 */

export type LivingSpace = "apartment" | "house" | "house-with-yard";
export type EnergyLevel = "low" | "medium" | "high" | "very-high";
export type ExperienceLevel = "first-time" | "some" | "experienced";
export type KidsAtHome = "none" | "young" | "older" | "any";
export type SpecialCare = "none" | "anxiety" | "medical" | "senior" | "training";

export interface AdopterAnswers {
  livingSpace: LivingSpace;
  energyLevel: EnergyLevel;
  experience: ExperienceLevel;
  kids: KidsAtHome;
  specialCare: SpecialCare;
  preferredSpecies?: "dog" | "cat" | "any";
  preferredSize?: "small" | "medium" | "large" | "any";
  /** Optional free text: interests, preferences, or anything else for the AI to consider when matching. */
  additionalInterests?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  age: number; // years
  image: string;
  badges: string[];
  compatibilityScore: number;
  breakdown: {
    livingSpace: number;
    energyLevel: number;
    experience: number;
    kids: number;
    specialCare: number;
  };
}

export interface ExplainableReasons {
  reasons: string[];
}

export const defaultAdopterAnswers: AdopterAnswers = {
  livingSpace: "house-with-yard",
  energyLevel: "medium",
  experience: "some",
  kids: "older",
  specialCare: "none",
  preferredSpecies: "dog",
  preferredSize: "medium",
};

/** Mock adopter answers (used when navigating to results without completing questionnaire). */
export const mockAdopterAnswers: AdopterAnswers = {
  livingSpace: "house-with-yard",
  energyLevel: "high",
  experience: "some",
  kids: "older",
  specialCare: "none",
  preferredSpecies: "dog",
  preferredSize: "medium",
};

/** Mock AI explainable reasons for top match. */
export const mockExplainableReasons: ExplainableReasons = {
  reasons: [
    "Your active lifestyle matches Luna's high energy level—she loves long walks and playtime.",
    "Your experience with dogs means you're prepared for her need for mental stimulation and training.",
    "Your house with a yard gives her the space she needs to run and explore safely.",
    "Older kids at home align with her friendly, patient nature around children.",
    "No special care requirements on your side fits her current health and temperament.",
    "Medium-sized dogs fit your preference and living situation.",
  ],
};

/** Mock top 8 ranked pets with compatibility breakdown. */
export const mockRankedPets: Pet[] = [
  {
    id: "pet-1",
    name: "Luna",
    species: "dog",
    breed: "Border Collie",
    age: 2,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
    badges: ["Active", "Kid-friendly", "House-trained"],
    compatibilityScore: 94,
    breakdown: { livingSpace: 98, energyLevel: 95, experience: 90, kids: 92, specialCare: 96 },
  },
  {
    id: "pet-2",
    name: "Max",
    species: "dog",
    breed: "Golden Retriever",
    age: 3,
    image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&q=80",
    badges: ["Family dog", "Gentle", "Loves play"],
    compatibilityScore: 89,
    breakdown: { livingSpace: 88, energyLevel: 85, experience: 92, kids: 96, specialCare: 84 },
  },
  {
    id: "pet-3",
    name: "Buddy",
    species: "dog",
    breed: "Labrador",
    age: 4,
    image: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400&q=80",
    badges: ["Obedient", "Kid-friendly", "Medium energy"],
    compatibilityScore: 86,
    breakdown: { livingSpace: 90, energyLevel: 82, experience: 88, kids: 88, specialCare: 82 },
  },
  {
    id: "pet-4",
    name: "Charlie",
    species: "dog",
    breed: "Beagle",
    age: 1,
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&q=80",
    badges: ["Curious", "Friendly", "Adaptable"],
    compatibilityScore: 82,
    breakdown: { livingSpace: 85, energyLevel: 88, experience: 75, kids: 85, specialCare: 78 },
  },
  {
    id: "pet-5",
    name: "Daisy",
    species: "dog",
    breed: "Australian Shepherd",
    age: 2,
    image: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=400&q=80",
    badges: ["Smart", "Energetic", "Loyal"],
    compatibilityScore: 79,
    breakdown: { livingSpace: 80, energyLevel: 92, experience: 85, kids: 78, specialCare: 80 },
  },
  {
    id: "pet-6",
    name: "Cooper",
    species: "dog",
    breed: "Mixed",
    age: 5,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&q=80",
    badges: ["Calm", "Rescue", "Good with cats"],
    compatibilityScore: 76,
    breakdown: { livingSpace: 82, energyLevel: 70, experience: 90, kids: 82, specialCare: 76 },
  },
  {
    id: "pet-7",
    name: "Milo",
    species: "cat",
    breed: "Domestic Shorthair",
    age: 1,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80",
    badges: ["Playful", "Indoor", "Social"],
    compatibilityScore: 72,
    breakdown: { livingSpace: 78, energyLevel: 75, experience: 70, kids: 74, specialCare: 72 },
  },
  {
    id: "pet-8",
    name: "Rocky",
    species: "dog",
    breed: "Boxer",
    age: 3,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80",
    badges: ["Protective", "Active", "Loyal"],
    compatibilityScore: 70,
    breakdown: { livingSpace: 75, energyLevel: 88, experience: 72, kids: 68, specialCare: 68 },
  },
];

export const compatibilityLabels: Record<keyof Pet["breakdown"], string> = {
  livingSpace: "Living space",
  energyLevel: "Energy level",
  experience: "Experience fit",
  kids: "Kids at home",
  specialCare: "Special care",
};
