import type { SellerProduct } from "@/types/seller";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  path: string,
  options?: RequestInit & { parseJson?: boolean }
): Promise<T> {
  const { parseJson = true, ...init } = options ?? {};
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
  if (!res.ok) {
    const err = parseJson ? await res.json().catch(() => ({})) : {};
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return parseJson ? res.json() : (undefined as T);
}

export async function fetchProducts(): Promise<SellerProduct[]> {
  const list = await request<SellerProduct[]>("/api/products");
  return Array.isArray(list) ? list : [];
}

export async function fetchProduct(id: string): Promise<SellerProduct | null> {
  const product = await request<SellerProduct>(`/api/products/${id}`).catch(() => null);
  return product ?? null;
}

export async function createProduct(
  body: Omit<SellerProduct, "id" | "createdAt" | "updatedAt">
): Promise<SellerProduct> {
  return request<SellerProduct>("/api/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateProduct(
  id: string,
  body: Omit<SellerProduct, "id" | "createdAt" | "updatedAt">
): Promise<SellerProduct> {
  return request<SellerProduct>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function patchProductStatus(
  id: string,
  status: "active" | "hidden"
): Promise<SellerProduct> {
  return request<SellerProduct>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await request<void>(`/api/products/${id}`, { method: "DELETE", parseJson: false });
}

/** Upload image files; returns URLs to store in product.images (paths like /api/products/uploads/xxx.jpg) */
export async function uploadProductImages(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const form = new FormData();
  files.forEach((f) => form.append("images", f));
  const res = await fetch(`${API_BASE}/api/products/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  const data = (await res.json()) as { urls?: string[] };
  return Array.isArray(data.urls) ? data.urls : [];
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
  const list = await request<ProductReview[]>(`/api/products/${productId}/reviews`).catch(() => []);
  return Array.isArray(list) ? list : [];
}

export async function createProductReview(
  productId: string,
  body: { customerName: string; customerEmail: string; rating: number; comment?: string }
): Promise<ProductReview> {
  return request<ProductReview>(`/api/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Resolve image URL for display (prepend API base if path is relative) */
export function productImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}
