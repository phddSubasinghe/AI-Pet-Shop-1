const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type AuthRole = "seller" | "shelter" | "adopter" | "admin";

export type ApiUserStatus = "active" | "pending" | "blocked";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  status?: ApiUserStatus;
  shopName?: string | null;
  pickupAddress?: string | null;
  contactNumber?: string | null;
  organizationName?: string | null;
  address?: string | null;
  district?: string | null;
  contactEmail?: string | null;
  contactNumberShelter?: string | null;
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
}

export interface SignupPayload {
  role: "adopter" | "seller" | "shelter" | "admin";
  email: string;
  password: string;
  name: string;
  shopName?: string;
  pickupAddress?: string;
  contactNumber?: string;
  organizationName?: string;
  address?: string;
  district?: string;
  contactEmail?: string;
  contactNumber?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
}

async function request<T>(path: string, options?: RequestInit & { parseJson?: boolean }): Promise<T> {
  const { parseJson = true, ...init } = options ?? {};
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
  if (!res.ok) {
    const errBody = parseJson ? await res.json().catch(() => ({})) : {};
    const msg = (errBody as { error?: string }).error ?? res.statusText;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return parseJson ? res.json() : (undefined as T);
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  if (!API_BASE) {
    throw new Error("API URL is not set. Add VITE_API_URL to your .env (e.g. http://localhost:3001).");
  }
  // For shelter, account email/name come from ownerEmail/ownerName
  const email =
    payload.role === "shelter"
      ? (payload.ownerEmail ?? payload.email ?? "").toString().trim().toLowerCase()
      : (payload.email ?? "").toString().trim().toLowerCase();
  const name =
    payload.role === "shelter"
      ? (payload.ownerName ?? payload.name ?? "").toString().trim()
      : (payload.name ?? payload.fullName ?? "").toString().trim();
  const password = payload.password;
  if (!email || !name || !password) {
    throw new Error("Email, password, and name are required.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const body: Record<string, unknown> = {
    role: payload.role,
    email,
    password,
    name,
  };
  if (payload.role === "adopter") {
    body.contactNumber = payload.contactNumber ?? null;
  }
  if (payload.role === "seller") {
    body.shopName = payload.shopName ?? null;
    body.pickupAddress = payload.pickupAddress ?? null;
    body.contactNumber = payload.contactNumber ?? null;
  }
  if (payload.role === "shelter") {
    body.organizationName = payload.organizationName ?? null;
    body.address = payload.address ?? null;
    body.district = payload.district ?? null;
    body.contactEmail = payload.contactEmail ?? payload.ownerEmail ?? null;
    body.contactNumber = payload.contactNumber ?? null;
    body.description = payload.description ?? null;
    body.website = payload.website ?? null;
    body.logoUrl = payload.logoUrl ?? null;
    body.ownerName = payload.ownerName ?? null;
    body.ownerEmail = payload.ownerEmail ?? null;
    body.ownerPhone = payload.ownerPhone ?? null;
  }
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function signin(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });
}
