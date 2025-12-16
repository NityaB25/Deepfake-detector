import { getSession } from "next-auth/react";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Auth-aware fetch helper
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const session = await getSession();
  const backendToken = (session as any)?.backendToken;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (backendToken) {
    headers.set("Authorization", `Bearer ${backendToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}
