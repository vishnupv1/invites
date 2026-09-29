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
  window.gtag = (...args: unknown[]) => {
    window.dataLayer.push(args);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
  initialized = true;
}

export function trackPageView(page: string) {
  if (lastPage === page) return;

  initialize();
  lastPage = page;
  window.gtag("event", "page_view", {
    page_path: page,
    page_location: window.location.href,
    page_title: document.title,
  });
}
