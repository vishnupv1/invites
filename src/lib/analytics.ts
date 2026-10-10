import { outcomeEvent, saveDraftEvent } from "./funnel-events.ts";
import { purchaseEventKey } from "./purchase-event-key.ts";

const measurementId = "G-NNF07Q6XYV";
const INTERNAL_KEY = "invitesready.internal";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;
let blocked = false;
let lastPage: string | undefined;
let internal = false;

const PERSONAL = new Set(["email", "phone", "name", "guest", "guest_name", "host_name", "full_name", "first_name", "last_name"]);

export function shouldLoadAnalytics(agent?: { webdriver?: boolean; userAgent?: string }) {
  const nav = agent ?? (typeof navigator === "undefined" ? undefined : navigator);
  if (!nav) return true;
  if (nav.webdriver) return false;
  return !/HeadlessChrome|bot|crawler|spider|Lighthouse/i.test(nav.userAgent || "");
}

function withoutPersonal<T extends Record<string, unknown>>(params?: T) {
  if (!params) return params;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (PERSONAL.has(key)) continue;
    next[key] = value;
  }
  return next as T;
}

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
  initialized = true;
  if (!shouldLoadAnalytics()) {
    blocked = true;
    return;
  }
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
  const config: Record<string, unknown> = { send_page_view: false };
  if (internal) config.traffic_type = "internal";
  window.gtag("config", measurementId, config);
  if (internal) window.gtag("set", { traffic_type: "internal" });
}

type EventItem = { item_id: string; item_name: string; price: number };
type EventValue = string | number | boolean | EventItem[] | undefined;

export function trackEvent(name: string, params?: Record<string, EventValue>) {
  initialize();
  if (blocked) return;
  window.gtag("event", name, withTraffic(withoutPersonal(params)));
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
  if (blocked) return;
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

export function trackFirstEdit(template: { id: string }) {
  trackOnce("first_edit", template.id, { template_id: template.id });
}

export function trackSaveDraft(saved: { id: string; status?: string; templateId?: string }, fallbackTemplateId?: string) {
  const event = saveDraftEvent({
    reachedServer: true,
    ok: Boolean(saved.id),
    inviteId: saved.id,
    templateId: saved.templateId || fallbackTemplateId,
    status: saved.status,
  });
  if (!event) return;
  trackOnce(event.name, event.key, event.params);
}

export function trackPaymentOutcome(
  outcome: "cancelled" | "failed",
  facts: { templateId: string; value: number; currency: string; errorCode?: string },
) {
  const event = outcomeEvent(outcome, facts);
  if (!event || event.name === "purchase") return;
  trackEvent(event.name, event.params);
}

export function trackSignUp(method: "google" | "email") {
  trackEvent("sign_up", { method });
}

export function trackLogin(method: "google" | "email") {
  trackEvent("login", { method });
}

const recentActions = new Map<string, number>();

function trackAction(name: string, key: string, params?: Record<string, EventValue>) {
  const id = `${name}:${key}`;
  const now = Date.now();
  const previous = recentActions.get(id);
  if (previous !== undefined && now - previous < 1000) return;
  recentActions.set(id, now);
  trackEvent(name, params);
}

export function trackPublish(template: { id: string; name: string }) {
  trackAction("publish", template.id, {
    template_id: template.id,
    template_name: template.name,
  });
}

export function trackShareWhatsApp(templateName?: string) {
  trackAction("share_whatsapp", templateName || "invite", {
    method: "whatsapp",
    ...(templateName ? { template_name: templateName } : {}),
  });
}

export function trackRsvpSubmit(response: "yes" | "no", template?: { id: string; name: string }) {
  trackEvent("rsvp_submit", {
    response,
    page_type: "guest",
    ...(template ? { template_id: template.id, template_name: template.name } : {}),
  });
}

export { purchaseEventKey };

export function trackPurchase(params: {
  templateId: string;
  templateName: string;
  value: number;
  currency: string;
  transactionId?: string;
  coupon?: string;
  items: EventItem[];
}) {
  trackOnce("purchase", purchaseEventKey(params.templateId, params.transactionId, params.coupon), {
    currency: params.currency,
    value: params.value,
    template_id: params.templateId,
    template_name: params.templateName,
    ...(params.transactionId ? { transaction_id: params.transactionId } : {}),
    ...(params.coupon ? { coupon: params.coupon } : {}),
    items: params.items,
  });
}

export function trackGuestCtaClick(templateName?: string) {
  trackEvent("guest_cta_click", {
    page_type: "guest",
    ...(templateName ? { template_name: templateName } : {}),
  });
}

export function isInternalTraffic() {
  rememberInternalTraffic();
  return internal;
}
