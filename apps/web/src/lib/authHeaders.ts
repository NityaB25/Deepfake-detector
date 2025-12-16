export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/token", { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as { token?: string };
    if (data?.token) return { Authorization: `Bearer ${data.token}` };
  } catch {}
  return {};
}
