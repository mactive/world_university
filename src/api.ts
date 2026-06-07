import type { University } from "./types";

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
  deleteUniversity: (id: string) =>
    request<{ ok: true }>(`/api/admin/universities/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
