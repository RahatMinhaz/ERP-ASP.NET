const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5266/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("erp_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem("erp_token", token);
  else sessionStorage.removeItem("erp_token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.message === "string" ? body.message : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}
