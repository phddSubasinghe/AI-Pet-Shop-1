const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface Category {
  id: string;
  name: string;
  order: number;
}

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

export async function fetchCategories(): Promise<Category[]> {
  const list = await request<Category[]>("/api/categories");
  return Array.isArray(list) ? list : [];
}

export async function createCategory(body: { name: string; order?: number }): Promise<Category> {
  return request<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCategory(
  id: string,
  body: { name?: string; order?: number }
): Promise<Category> {
  return request<Category>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await request<void>(`/api/categories/${id}`, { method: "DELETE", parseJson: false });
}
