import type { University, UniversityAlias, UniversityOfferRecord } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `请求失败 (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  universities: () => request<{ universities: University[]; source: string }>("/api/universities"),
  universityAliases: () => request<{ aliases: UniversityAlias[] }>("/api/university-aliases"),
  offerRecords: (universityId?: string) => {
    const query = universityId ? `?universityId=${encodeURIComponent(universityId)}` : "";
    return request<{ offerRecords: UniversityOfferRecord[] }>(`/api/offer-records${query}`);
  },
  session: () => request<{ authenticated: boolean }>("/api/admin/session"),
  login: (password: string) =>
    request<{ ok: true }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  logout: () => request<{ ok: true }>("/api/admin/logout", { method: "POST" }),
  saveUniversity: (university: University) =>
    request<{ university: University }>("/api/admin/universities", {
      method: "POST",
      body: JSON.stringify(university),
    }),
  backfillMissingUniversities: () =>
    request<{ inserted: number; skipped: number; total: number }>("/api/admin/universities/backfill-missing", {
      method: "POST",
    }),
  saveOfferRecord: (offerRecord: Partial<UniversityOfferRecord>) =>
    request<{ offerRecord: UniversityOfferRecord }>("/api/admin/offer-records", {
      method: "POST",
      body: JSON.stringify(offerRecord),
    }),
  deleteOfferRecord: (id: string) =>
    request<{ ok: true }>(`/api/admin/offer-records/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  saveUniversityAlias: (alias: Partial<UniversityAlias>) =>
    request<{ alias: UniversityAlias }>("/api/admin/university-aliases", {
      method: "POST",
      body: JSON.stringify(alias),
    }),
  deleteUniversityAlias: (alias: string) =>
    request<{ ok: true }>(`/api/admin/university-aliases/${encodeURIComponent(alias)}`, {
      method: "DELETE",
    }),
  deleteUniversity: (id: string) =>
    request<{ ok: true }>(`/api/admin/universities/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
