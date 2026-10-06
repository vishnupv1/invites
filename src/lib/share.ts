export function guestInviteUrl(code: string, campaign?: string) {
  const url = new URL(`/i/${code}`, window.location.origin);
  url.searchParams.set("utm_source", "whatsapp");
  url.searchParams.set("utm_medium", "guest_invite");
  if (campaign) url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export function guestCtaHref(campaign?: string) {
  const params = new URLSearchParams({
    utm_source: "whatsapp",
    utm_medium: "guest_invite",
  });
  if (campaign) params.set("utm_campaign", campaign);
  return `/browse?${params.toString()}`;
}

export function viewInvitePath(code: string) {
  return `/i/${code}`;
}

export function viewInviteUrl(code: string) {
  return `${window.location.origin}/i/${code}`;
}

export function whatsAppShareHref(url: string) {
  return `https://wa.me/?text=${encodeURIComponent(`You're invited: ${url}`)}`;
}
