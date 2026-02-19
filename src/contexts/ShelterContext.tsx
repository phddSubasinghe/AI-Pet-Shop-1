import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShelterPet, ShelterProfile } from "@/types/shelter";
import { getStoredUser, setStoredUser, clearStoredUser } from "@/lib/auth";
import {
  fetchShelterPets,
  fetchShelterProfile,
  updateShelterProfile,
  createShelterPet,
  updateShelterPet,
  deleteShelterPet,
} from "@/lib/api/shelter";
import { onPetsChanged } from "@/lib/socket";

const STORAGE_KEY_PETS = "pawpop:shelter:pets";
const STORAGE_KEY_PROFILE = "pawpop:shelter:profile";

const defaultProfile: ShelterProfile = {
  organizationName: "",
  description: "",
  address: "",
  district: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  logoUrl: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  verificationStatus: "Pending",
  updatedAt: new Date().toISOString(),
};

function loadPets(): ShelterPet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShelterPet[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadProfile(): ShelterProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as ShelterProfile;
    return { ...defaultProfile, ...parsed };
  } catch {
    return defaultProfile;
  }
}

function savePets(pets: ShelterPet[]) {
  localStorage.setItem(STORAGE_KEY_PETS, JSON.stringify(pets));
}

function saveProfile(profile: ShelterProfile) {
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
}

type ShelterContextValue = {
  pets: ShelterPet[];
  profile: ShelterProfile;
  addPet: (pet: Omit<ShelterPet, "id" | "createdAt" | "updatedAt">) => Promise<ShelterPet>;
  updatePet: (id: string, updates: Partial<ShelterPet>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  getPet: (id: string) => ShelterPet | undefined;
  setProfile: (profile: Partial<ShelterProfile>) => void | Promise<void>;
  refetchPets: () => Promise<void>;
  refetchProfile: () => Promise<void>;
};

const ShelterContext = createContext<ShelterContextValue | null>(null);

export function ShelterProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<ShelterPet[]>([]);
  const [profile, setProfileState] = useState<ShelterProfile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const fromStorage = loadProfile();
    const storedUser = getStoredUser();
    if (storedUser?.role === "shelter" && storedUser) {
      const handleShelterAccessDenied = (e: unknown) => {
        if (e instanceof Error && e.message === "Shelter access only") {
          clearStoredUser();
          window.location.href = `/auth/signin?redirect=${encodeURIComponent("/dashboard/shelter")}`;
          return;
        }
      };
      fetchShelterProfile()
        .then((apiProfile) => {
          setProfileState({ ...defaultProfile, ...apiProfile });
          saveProfile(apiProfile);
        })
        .catch((e) => {
          handleShelterAccessDenied(e);
          setProfileState((prev) => ({
            ...prev,
            ...fromStorage,
            organizationName: storedUser.organizationName ?? fromStorage.organizationName ?? prev.organizationName,
            address: storedUser.address ?? fromStorage.address ?? prev.address,
            logoUrl: storedUser.logoUrl ?? fromStorage.logoUrl ?? prev.logoUrl,
          }));
        });
      fetchShelterPets()
        .then(setPets)
        .catch((e) => {
          handleShelterAccessDenied(e);
          setPets([]);
        });
    } else {
      setProfileState(fromStorage);
      setPets(loadPets());
    }
    setHydrated(true);
  }, []);

  const refetchPets = useCallback(async () => {
    const user = getStoredUser();
    if (user?.role !== "shelter") return;
    try {
      const list = await fetchShelterPets();
      setPets(list);
    } catch (e) {
      if (e instanceof Error && e.message === "Shelter access only") {
        clearStoredUser();
        window.location.href = `/auth/signin?redirect=${encodeURIComponent("/dashboard/shelter")}`;
      }
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const user = getStoredUser();
    if (user?.role !== "shelter") return;
    const unsub = onPetsChanged(() => refetchPets());
    return unsub;
  }, [hydrated, refetchPets]);

  useEffect(() => {
    if (!hydrated) return;
    const user = getStoredUser();
    if (user?.role !== "shelter") savePets(pets);
  }, [hydrated, pets]);

  useEffect(() => {
    if (!hydrated) return;
    saveProfile(profile);
  }, [hydrated, profile]);

  const addPet = useCallback(
    async (input: Omit<ShelterPet, "id" | "createdAt" | "updatedAt">): Promise<ShelterPet> => {
      const user = getStoredUser();
      if (user?.role === "shelter") {
        const created = await createShelterPet(input);
        setPets((prev) => [...prev, created]);
        return created;
      }
      const now = new Date().toISOString();
      const id = `pet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const pet: ShelterPet = { ...input, id, createdAt: now, updatedAt: now };
      setPets((prev) => [...prev, pet]);
      return pet;
    },
    [],
  );

  const updatePet = useCallback(async (id: string, updates: Partial<ShelterPet>): Promise<void> => {
    const user = getStoredUser();
    if (user?.role === "shelter") {
      const updated = await updateShelterPet(id, updates);
      setPets((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return;
    }
    setPets((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
      ),
    );
  }, []);

  const deletePet = useCallback(async (id: string): Promise<void> => {
    const user = getStoredUser();
    if (user?.role === "shelter") {
      await deleteShelterPet(id);
    }
    setPets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPet = useCallback(
    (id: string) => pets.find((p) => p.id === id),
    [pets],
  );

  const refetchProfile = useCallback(async () => {
    const user = getStoredUser();
    if (user?.role !== "shelter") return;
    try {
      const apiProfile = await fetchShelterProfile();
      setProfileState((prev) => ({ ...prev, ...apiProfile }));
    } catch (e) {
      if (e instanceof Error && e.message === "Shelter access only") {
        clearStoredUser();
        window.location.href = `/auth/signin?redirect=${encodeURIComponent("/dashboard/shelter")}`;
      }
    }
  }, []);

  const setProfile = useCallback(
    async (updates: Partial<ShelterProfile>) => {
      const user = getStoredUser();
      if (user?.role === "shelter") {
        const updated = await updateShelterProfile(updates);
        setProfileState((prev) => ({ ...prev, ...updated }));
        saveProfile(updated);
        const current = getStoredUser();
        if (current?.id) {
          setStoredUser({
            ...current,
            organizationName: updated.organizationName || current.organizationName,
            address: updated.address ?? current.address,
            logoUrl: updated.logoUrl || current.logoUrl,
          });
        }
      } else {
        setProfileState((prev) => ({
          ...prev,
          ...updates,
          updatedAt: new Date().toISOString(),
        }));
        saveProfile({ ...profile, ...updates });
      }
    },
    [profile],
  );

  const value = useMemo<ShelterContextValue>(
    () => ({
      pets,
      profile,
      addPet,
      updatePet,
      deletePet,
      getPet,
      setProfile,
      refetchPets,
      refetchProfile,
    }),
    [pets, profile, addPet, updatePet, deletePet, getPet, setProfile, refetchPets, refetchProfile],
  );

  return (
    <ShelterContext.Provider value={value}>{children}</ShelterContext.Provider>
  );
}

export function useShelter() {
  const ctx = useContext(ShelterContext);
  if (!ctx) {
    throw new Error("useShelter must be used within ShelterProvider");
  }
  return ctx;
}
