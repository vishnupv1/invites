import type { InviteFields, SavedInvite } from "./types";

const TOKEN = "vellum.token.v1";

export function getToken() {
  return localStorage.getItem(TOKEN);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload as T;
}

export async function ensureSession(email: string, name: string) {
  const session = await request<{ token: string }>("/api/session", {
    method: "POST",
    body: JSON.stringify({ email, name: name.trim() || "Host" }),
  });
  localStorage.setItem(TOKEN, session.token);
  return session.token;
}

export function listPurchases() {
  return request<string[]>("/api/purchases");
}

export function purchaseTemplate(templateId: string) {
  return request<{ templateId: string }>("/api/purchases", {
    method: "POST",
    body: JSON.stringify({ templateId }),
  });
}

export function listInvites() {
  return request<SavedInvite[]>("/api/invites");
}

export function createInvite(templateId: string, fields: InviteFields) {
  return request<SavedInvite>("/api/invites", {
    method: "POST",
    body: JSON.stringify({ templateId, fields }),
  });
}

export function getPublicInvite(slug: string) {
  return request<{ slug: string; templateId: string; fields: InviteFields }>(`/api/invites/${slug}`);
}

export function sendGreeting(slug: string, body: { name: string; note: string; attending: boolean }) {
  return request(`/api/invites/${slug}/greetings`, { method: "POST", body: JSON.stringify(body) });
}

export async function uploadMedia(file: File) {
  const body = new FormData();
  body.append("file", file);
  const saved = await request<{ url: string }>("/api/media", { method: "POST", body });
  return saved.url;
}
