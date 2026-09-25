import type { InviteFields, InvitePayload } from "../types";

export function encodeInvite(templateId: string, fields: InviteFields) {
  const json = JSON.stringify({ t: templateId, f: fields } satisfies InvitePayload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeInvite(code: string): InvitePayload | null {
  try {
    const padded = code.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((code.length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as InvitePayload;
    if (!parsed || typeof parsed.t !== "string" || !parsed.f) return null;
    return parsed;
  } catch {
    return null;
  }
}
