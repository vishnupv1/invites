const measurementId = "G-NNF07Q6XYV";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;
let lastPage: string | undefined;

function initialize() {
  if (initialized) return;

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
  window.gtag("config", measurementId, { send_page_view: false });
  initialized = true;
}

type EventItem = { item_id: string; item_name: string; price: number };
type EventValue = string | number | EventItem[];

export function trackEvent(name: string, params?: Record<string, EventValue>) {
  initialize();
  window.gtag("event", name, params);
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
  const params: Record<string, string | number> = {
    page_path: page,
    page_location: window.location.href,
    page_title: title,
  };
  if (pageType) params.page_type = pageType;
  window.gtag("event", "page_view", params);
}
