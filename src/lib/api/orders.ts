import type { CustomerOrder } from "@/types/order";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function request<T>(
  path: string,
  options: RequestInit & { token: string; parseJson?: boolean }
): Promise<T> {
  const { token, parseJson = true, ...init } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...init,
  });
  if (!res.ok) {
    const err = parseJson ? await res.json().catch(() => ({})) : {};
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return parseJson ? res.json() : (undefined as T);
}

export async function fetchMyOrders(token: string): Promise<CustomerOrder[]> {
  const data = await request<CustomerOrder[]>("/api/orders", { token });
  return Array.isArray(data) ? data : [];
}

export type CreateOrderBody = {
  address: string;
  items: { productId: string; quantity: number }[];
  paymentMethod?: string;
  cardLast4?: string;
};

export async function createOrder(
  token: string,
  body: CreateOrderBody
): Promise<CustomerOrder> {
  return request<CustomerOrder>("/api/orders", {
    method: "POST",
    token,
    body: JSON.stringify(body),
  });
}
