import type {
  SellerReview,
  SellerProduct,
  SellerOrder,
  SellerEarningsResponse,
  SellerOverviewResponse,
  SellerNotification,
} from "@/types/seller";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Resolve seller logo URL for display (prepend API base if path is relative) */
export function sellerLogoUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url.startsWith("/") ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
}

/**
 * Upload seller logo. Saves file to server data/seller and updates User.logoUrl in DB.
 * Returns the relative path (use sellerLogoUrl() for display).
 */
export async function uploadSellerLogo(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("logo", file);
  const res = await fetch(`${API_BASE}/api/seller/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as { url: string };
}

/**
 * Fetch all reviews for the current seller's products (auth required).
 */
export async function fetchSellerReviews(token: string): Promise<SellerReview[]> {
  const res = await fetch(`${API_BASE}/api/seller/reviews`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch all products for the current seller (auth required). Used by Inventory and seller-scoped views.
 */
export async function fetchSellerProducts(token: string): Promise<SellerProduct[]> {
  const res = await fetch(`${API_BASE}/api/seller/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch all orders that contain at least one item from the current seller (auth required).
 */
export async function fetchSellerOrders(token: string): Promise<SellerOrder[]> {
  const res = await fetch(`${API_BASE}/api/seller/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/**
 * Update an order's status (own orders only). Auth required.
 */
export async function updateSellerOrderStatus(
  token: string,
  orderId: string,
  status: string
): Promise<SellerOrder> {
  const res = await fetch(`${API_BASE}/api/seller/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as SellerOrder;
}

/**
 * Fetch dashboard overview: stats, recent orders, low stock, score (auth required).
 */
export async function fetchSellerOverview(token: string): Promise<SellerOverviewResponse> {
  const res = await fetch(`${API_BASE}/api/seller/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as SellerOverviewResponse;
}

/**
 * Fetch earnings summary: total, pending, chart data by period, payouts (auth required).
 */
export async function fetchSellerEarnings(
  token: string,
  period: "monthly" | "weekly" | "daily" = "monthly"
): Promise<SellerEarningsResponse> {
  const res = await fetch(`${API_BASE}/api/seller/earnings?period=${encodeURIComponent(period)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as SellerEarningsResponse;
}

/**
 * Fetch notifications for the current seller (auth required).
 */
export async function fetchSellerNotifications(token: string): Promise<SellerNotification[]> {
  const res = await fetch(`${API_BASE}/api/seller/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return Array.isArray(data) ? data : [];
}

/**
 * Mark one notification as read. Auth required.
 */
export async function markSellerNotificationRead(token: string, notificationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/seller/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
}

/**
 * Mark all notifications as read for the current seller. Auth required.
 */
export async function markAllSellerNotificationsRead(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/seller/notifications/read-all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
}

/**
 * Update a product's stock and/or lowStockThreshold (own products only). Auth required.
 */
export async function patchSellerProductInventory(
  token: string,
  productId: string,
  updates: { stock?: number; lowStockThreshold?: number }
): Promise<SellerProduct> {
  const res = await fetch(`${API_BASE}/api/seller/products/${productId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data as SellerProduct;
}
