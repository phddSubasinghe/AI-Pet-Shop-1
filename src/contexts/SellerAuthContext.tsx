import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getStoredUser, setStoredUser, isSellerBlocked, type StoredUser } from "@/lib/auth";
import { onUserStatusChanged } from "@/lib/socket";
import { toast } from "sonner";

type SellerAuthContextValue = {
  user: StoredUser | null;
  refreshUser: () => void;
  isBlocked: boolean;
};

const SellerAuthContext = createContext<SellerAuthContextValue | null>(null);

export function SellerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());

  const refreshUser = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    const unsub = onUserStatusChanged((payload) => {
      const current = getStoredUser();
      if (!current?.id || payload.userId !== current.id) return;
      const newStatus = payload.status as StoredUser["status"];
      setStoredUser({ ...current, status: newStatus });
      setUser(getStoredUser());
      if (newStatus === "active") {
        toast.success("Your seller account has been reactivated. All features are now available.", {
          duration: 5000,
        });
      } else if (newStatus === "blocked") {
        toast.error("Your account has been blocked. Contact support if you have questions.");
      }
    });
    return unsub;
  }, []);

  const isBlocked = user?.role === "seller" && user?.status === "blocked";

  return (
    <SellerAuthContext.Provider value={{ user, refreshUser, isBlocked }}>
      {children}
    </SellerAuthContext.Provider>
  );
}

export function useSellerAuth(): SellerAuthContextValue {
  const ctx = useContext(SellerAuthContext);
  if (!ctx) {
    throw new Error("useSellerAuth must be used within SellerAuthProvider");
  }
  return ctx;
}

/** Returns true when seller account is blocked. Uses context for real-time updates when inside SellerAuthProvider. */
export function useIsSellerBlocked(): boolean {
  const ctx = useContext(SellerAuthContext);
  if (ctx) return ctx.isBlocked;
  return isSellerBlocked();
}