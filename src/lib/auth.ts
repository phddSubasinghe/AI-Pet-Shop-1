import type { ApiUser } from "@/lib/api/auth";

const STORAGE_KEY = "pawpop_user";
const TOKEN_KEY = "pawpop_token";

/** Account status: active (approved), pending (awaiting admin), blocked */
export type StoredUserStatus = "active" | "pending" | "blocked";

/** Full stored user (from API): includes id, role, status, and profile fields */
export interface StoredUser {
  id?: string;
  name: string;
  email: string;
  role?: "seller" | "shelter" | "adopter" | "admin";
  status?: StoredUserStatus;
  shopName?: string | null;
  pickupAddress?: string | null;
  contactNumber?: string | null;
  organizationName?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  [key: string]: unknown;
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (data && typeof data === "object" && "email" in data && typeof (data as StoredUser).email === "string") {
      const u = data as StoredUser;
      return {
        name: typeof u.name === "string" ? u.name : (u.email as string).split("@")[0],
        email: u.email as string,
        ...(typeof u.id === "string" && { id: u.id }),
        ...(u.role && { role: u.role }),
        ...(u.status && { status: u.status as StoredUserStatus }),
        ...(u.shopName !== undefined && { shopName: u.shopName }),
        ...(u.pickupAddress !== undefined && { pickupAddress: u.pickupAddress }),
        ...(u.contactNumber !== undefined && { contactNumber: u.contactNumber }),
        ...(u.organizationName !== undefined && { organizationName: u.organizationName }),
        ...(u.address !== undefined && { address: u.address }),
        ...(u.logoUrl !== undefined && u.logoUrl !== null && { logoUrl: u.logoUrl }),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser | ApiUser): void {
  const toStore = "id" in user && "role" in user
    ? { id: user.id, name: user.name, email: user.email, role: user.role, ...user }
    : { name: user.name, email: user.email, ...user };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function isLoggedIn(): boolean {
  return getStoredUser() != null;
}

/** True when the current user is a seller and their account is blocked (cannot add/edit/delete products, update orders, etc.). */
export function isSellerBlocked(): boolean {
  const u = getStoredUser();
  return u?.role === "seller" && u?.status === "blocked";
}
