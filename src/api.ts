import type { EventId, InviteFields, SavedInvite, Template } from "./types";

const TOKEN = "vellum.token.v1";
export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function assetUrl(url: string) {
  if (!url || /^(https?:|data:|blob:)/.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

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
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload as T;
}

function storeToken(token: string) {
  localStorage.setItem(TOKEN, token);
}

export async function signUp(name: string, email: string, password: string) {
  const session = await request<{ token: string }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  storeToken(session.token);
}

export async function logIn(email: string, password: string) {
  const session = await request<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  storeToken(session.token);
}

export async function ensureSession(email: string, name: string) {
  const session = await request<{ token: string }>("/api/session", {
    method: "POST",
    body: JSON.stringify({ email, name: name.trim() || "Host" }),
  });
  storeToken(session.token);
  return session.token;
}

export function signOut() {
  localStorage.removeItem(TOKEN);
}

export type AdminSummary = {
  admin: { name: string; email: string };
  users: { id: string; name: string; email: string; events: number; joined: string }[];
  events: { id: string; name: string; templateId: string; host: string; date: string; replies: number; yes: number; code: string }[];
  purchases: { id: string; templateId: string; host: string; price: number; at: string }[];
};

export function adminSummary() {
  return request<AdminSummary>("/api/admin/summary");
}

export function getHost() {
  return request<{ id: string; email: string; name: string }>("/api/session");
}

export type CatalogEvent = {
  id: EventId;
  label: string;
  cardLabel: string;
  detailLabel: string;
  namesLabel: string;
  hostsLabel: string;
  titleLabel: string;
};

export function listEvents() {
  return request<CatalogEvent[]>("/api/events");
}

export function listTemplates() {
  return request<Template[]>("/api/templates");
}

export function getTemplateRecord(id: string) {
  return request<Template>(`/api/templates/${encodeURIComponent(id)}`);
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

export function listGreetings(slug: string) {
  return request<{ id: string; name: string; note: string; attending: boolean; at: string }[]>(
    `/api/invites/${slug}/greetings`,
  );
}

export function createInvite(templateId: string, fields: InviteFields) {
  return request<SavedInvite>("/api/invites", {
    method: "POST",
    body: JSON.stringify({ templateId, fields }),
  });
}

export function getPublicInvite(slug: string) {
  return request<{ slug: string; templateId: string; fields: InviteFields; greetings?: { name: string; note: string }[] }>(`/api/invites/${slug}`);
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
