import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type AddPetModalContextValue = {
  isOpen: boolean;
  openAddPet: () => void;
  closeAddPet: () => void;
};

const AddPetModalContext = createContext<AddPetModalContextValue | null>(null);

export function AddPetModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAddPet = useCallback(() => setIsOpen(true), []);
  const closeAddPet = useCallback(() => setIsOpen(false), []);

  return (
    <AddPetModalContext.Provider value={{ isOpen, openAddPet, closeAddPet }}>
      {children}
    </AddPetModalContext.Provider>
  );
}

export function useAddPetModal() {
  const ctx = useContext(AddPetModalContext);
  if (!ctx) {
    throw new Error("useAddPetModal must be used within AddPetModalProvider");
  }
  return ctx;
}
