const measurementId = "G-NNF07Q6XYV";
const INTERNAL_KEY = "invitesready.internal";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;
let lastPage: string | undefined;
let internal = false;

function rememberInternalTraffic() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("team") === "1") {
      localStorage.setItem(INTERNAL_KEY, "1");
    }
    internal = localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    internal = false;
  }
}

function withTraffic<T extends Record<string, unknown>>(params?: T) {
  if (!internal) return params;
  return { ...params, traffic_type: "internal" };
}

function initialize() {
  if (initialized) return;
  rememberInternalTraffic();

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // Google's script only accepts the special arguments object, not a normal array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, withTraffic({ send_page_view: false }));
  if (internal) window.gtag("set", { traffic_type: "internal" });
  initialized = true;
}

type EventItem = { item_id: string; item_name: string; price: number };
type EventValue = string | number | boolean | EventItem[] | undefined;

export function trackEvent(name: string, params?: Record<string, EventValue>) {
  initialize();
  window.gtag("event", name, withTraffic(params));
}

const once = new Set<string>();

export function trackOnce(name: string, key: string, params?: Record<string, EventValue>) {
  const id = `${name}:${key}`;
  if (once.has(id)) return;
  once.add(id);
  trackEvent(name, params);
}

export function trackPageView(page: string, title: string, pageType?: string) {
  if (lastPage === page) return;

  initialize();
  lastPage = page;
  document.title = title;
  const params: Record<string, EventValue> = {
    page_path: page,
    page_location: window.location.href,
    page_title: title,
  };
  if (pageType) params.page_type = pageType;
  window.gtag("event", "page_view", withTraffic(params));
}

export function trackTemplatePreview(template: { id: string; name: string }) {
  trackOnce("template_preview", template.id, {
    template_id: template.id,
    template_name: template.name,
  });
}

export function trackStartDesign(template: { id: string; name: string }) {
  trackOnce("start_design", template.id, {
    template_id: template.id,
    template_name: template.name,
  });
}

export function trackSignUp(method: "google" | "email") {
  trackEvent("sign_up", { method });
}

export function trackLogin(method: "google" | "email") {
  trackEvent("login", { method });
}

export function trackPublish(template: { id: string; name: string }) {
  trackEvent("publish", {
    template_id: template.id,
    template_name: template.name,
  });
}

export function trackShareWhatsApp(templateName?: string) {
  trackEvent("share_whatsapp", templateName ? { template_name: templateName } : undefined);
}

export function trackRsvpSubmit(response: "yes" | "no", template?: { id: string; name: string }) {
  trackEvent("rsvp_submit", {
    response,
    ...(template ? { template_id: template.id, template_name: template.name } : {}),
  });
}

export function trackGuestCtaClick(templateName?: string) {
  trackEvent("guest_cta_click", templateName ? { template_name: templateName } : undefined);
}

export function isInternalTraffic() {
  rememberInternalTraffic();
  return internal;
}
