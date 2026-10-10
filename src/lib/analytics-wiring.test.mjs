import assert from "node:assert/strict";
import test from "node:test";

const dataLayer = [];

globalThis.localStorage = {
  getItem() {
    return null;
  },
  setItem() {},
};
globalThis.document = {
  title: "",
  head: { appendChild() {} },
  createElement() {
    return {};
  },
};
globalThis.window = {
  location: { href: "http://127.0.0.1:5173/create/gazal", search: "" },
  dataLayer,
};

const analytics = await import("./analytics.ts");

function named(command, name) {
  return dataLayer.filter((entry) => entry[0] === command && (!name || entry[1] === name));
}

const allowedKeys = new Set([
  "page_path",
  "page_location",
  "page_title",
  "page_type",
  "traffic_type",
  "template_id",
  "template_name",
  "currency",
  "value",
  "items",
  "item_id",
  "item_name",
  "price",
  "transaction_id",
  "coupon",
  "error_code",
  "method",
  "response",
]);

function assertAllowed(payload, label) {
  const stack = [payload];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, value] of Object.entries(current)) {
      if (Array.isArray(current)) {
        stack.push(value);
        continue;
      }
      assert.equal(allowedKeys.has(key), true, `${label} sent ${key}`);
      if (value && typeof value === "object") stack.push(value);
    }
  }
}

test("tracked events follow the funnel rules and stay free of personal fields", () => {
  analytics.trackPageView("/create/gazal", "Design your invitation | InvitesReady");
  assert.equal(named("config")[0][2].send_page_view, false);

  analytics.trackPageView("/create/gazal", "Design your invitation | InvitesReady");
  assert.equal(named("event", "page_view").length, 1);
  analytics.trackPageView("/browse", "Templates | InvitesReady");
  analytics.trackPageView("/create/gazal", "Design your invitation | InvitesReady");
  assert.equal(named("event", "page_view").length, 3);

  analytics.trackTemplatePreview({ id: "gazal", name: "Gazal" });
  analytics.trackTemplatePreview({ id: "gazal", name: "Gazal" });
  analytics.trackStartDesign({ id: "gazal", name: "Gazal" });
  analytics.trackStartDesign({ id: "gazal", name: "Gazal" });
  analytics.trackFirstEdit({ id: "gazal" });
  analytics.trackFirstEdit({ id: "gazal" });
  assert.equal(named("event", "template_preview").length, 1);
  assert.equal(named("event", "start_design").length, 1);
  assert.equal(named("event", "first_edit").length, 1);

  analytics.trackSaveDraft({ id: "", templateId: "gazal", status: "draft" });
  analytics.trackSaveDraft({ id: "inv-1", templateId: "gazal", status: "live" });
  assert.equal(named("event", "save_draft").length, 0);
  analytics.trackSaveDraft({ id: "inv-1", templateId: "gazal", status: "draft" });
  analytics.trackSaveDraft({ id: "inv-1", templateId: "gazal", status: "draft" });
  assert.deepEqual(named("event", "save_draft")[0][2], { template_id: "gazal" });
  assert.equal(named("event", "save_draft").length, 1);

  analytics.trackEvent("begin_checkout", {
    currency: "INR",
    value: 499,
    items: [{ item_id: "shaadi", item_name: "Shaadi", price: 499 }],
  });
  analytics.trackPaymentOutcome("cancelled", { templateId: "shaadi", value: 499, currency: "INR" });
  analytics.trackPaymentOutcome("failed", { templateId: "shaadi", value: 499, currency: "INR", errorCode: "payment_failed" });
  assert.equal(named("event", "purchase").length, 0);

  analytics.trackPurchase({
    templateId: "shaadi",
    templateName: "Shaadi",
    value: 499,
    currency: "INR",
    transactionId: "pay_test",
    items: [{ item_id: "shaadi", item_name: "Shaadi", price: 499 }],
  });
  analytics.trackPurchase({
    templateId: "shaadi",
    templateName: "Shaadi",
    value: 499,
    currency: "INR",
    transactionId: "pay_test",
    items: [{ item_id: "shaadi", item_name: "Shaadi", price: 499 }],
  });
  assert.equal(named("event", "purchase").length, 1);

  analytics.trackSignUp("email");
  analytics.trackLogin("email");
  analytics.trackPublish({ id: "gazal", name: "Gazal" });
  analytics.trackPublish({ id: "gazal", name: "Gazal" });
  assert.equal(named("event", "publish").length, 1);

  analytics.trackShareWhatsApp("Gazal");
  analytics.trackShareWhatsApp("Gazal");
  assert.equal(named("event", "share_whatsapp").length, 1);
  assert.equal(named("event", "share_whatsapp")[0][2].method, "whatsapp");

  analytics.trackRsvpSubmit("yes", { id: "hansa", name: "Hansa" });
  assert.equal(named("event", "rsvp_submit")[0][2].page_type, "guest");
  analytics.trackGuestCtaClick("Hansa");
  assert.equal(named("event", "guest_cta_click")[0][2].page_type, "guest");

  analytics.trackEvent("begin_checkout", {
    email: "host@example.com",
    phone: "9999999999",
    name: "Host",
    template_id: "hansa",
    template_name: "Hansa",
    currency: "INR",
    value: 499,
  });
  const checkout = named("event", "begin_checkout").at(-1)[2];
  assert.equal(checkout.email, undefined);
  assert.equal(checkout.phone, undefined);
  assert.equal(checkout.name, undefined);
  assert.equal(checkout.template_id, "hansa");

  for (const entry of named("event")) assertAllowed(entry[2], entry[1]);
});

test("analytics stays off for headless browsers and crawlers", () => {
  assert.equal(analytics.shouldLoadAnalytics({ webdriver: true, userAgent: "Mozilla/5.0 Chrome" }), false);
  assert.equal(analytics.shouldLoadAnalytics({ userAgent: "Mozilla/5.0 HeadlessChrome" }), false);
  assert.equal(analytics.shouldLoadAnalytics({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" }), false);
  assert.equal(analytics.shouldLoadAnalytics({ userAgent: "Mozilla/5.0 Chrome Lighthouse" }), false);
  assert.equal(analytics.shouldLoadAnalytics({ userAgent: "Mozilla/5.0 Chrome" }), true);
});
