import redirects from "./redirects.json" with { type: "json" };

export const REDIRECTS: Record<string, string> = redirects;

const EVENT_OCCASION: Record<string, string> = {
  marriage: "/wedding",
  birthday: "/birthday",
  baptism: "/baptism",
  housewarming: "/housewarming",
};

export function redirectTarget(pathname: string) {
  if (REDIRECTS[pathname]) return REDIRECTS[pathname];
  if (pathname.startsWith("/c/")) return "/occasions";
  return undefined;
}

export function occasionPathForEvent(eventId: string) {
  return EVENT_OCCASION[eventId] ?? "/occasions";
}
