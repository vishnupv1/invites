import assert from "node:assert/strict";
import test from "node:test";
import { claimCallback, outcomeEvent, rememberOnce, safeErrorCode, saveDraftEvent } from "./funnel-events.ts";

test("a successful draft save is recorded once per invite", () => {
  const seen = new Set();
  const first = saveDraftEvent({ reachedServer: true, ok: true, inviteId: "inv-1", templateId: "shaadi", status: "draft" });
  const again = saveDraftEvent({ reachedServer: true, ok: true, inviteId: "inv-1", templateId: "shaadi", status: "draft" });
  assert.equal(first?.name, "save_draft");
  assert.deepEqual(first?.params, { template_id: "shaadi" });
  assert.equal(rememberOnce(seen, first.name, first.key), true);
  assert.equal(rememberOnce(seen, again.name, again.key), false);
});

test("a failed or local-only save does not record a draft", () => {
  assert.equal(saveDraftEvent({ reachedServer: true, ok: false, inviteId: "inv-1", templateId: "shaadi", status: "draft" }), null);
  assert.equal(saveDraftEvent({ reachedServer: false, ok: true, inviteId: "inv-1", templateId: "shaadi" }), null);
  assert.equal(saveDraftEvent({ reachedServer: true, ok: true, templateId: "shaadi", status: "draft" }), null);
});

test("updating a live invitation is not a draft save", () => {
  assert.equal(saveDraftEvent({ reachedServer: true, ok: true, inviteId: "inv-1", templateId: "gazal", status: "live" }), null);
});

test("dismissing Razorpay records a cancellation and not a purchase", () => {
  const event = outcomeEvent("cancelled", { templateId: "shaadi", value: 499, currency: "INR" });
  assert.equal(event?.name, "payment_cancelled");
  assert.deepEqual(event?.params, { template_id: "shaadi", value: 499, currency: "INR" });
  assert.equal(outcomeEvent("purchase_recorded", { templateId: "shaadi", value: 499, currency: "INR" })?.name, "purchase");
  assert.notEqual(event?.name, "purchase");
});

test("a payment failure records a short code and not a purchase", () => {
  const event = outcomeEvent("failed", {
    templateId: "shaadi",
    value: 499,
    currency: "INR",
    errorCode: "payment_failed",
  });
  assert.equal(event?.name, "payment_failed");
  assert.equal(event?.params.error_code, "payment_failed");
  assert.equal("description" in event.params, false);
  assert.equal(outcomeEvent("purchase_rejected", { templateId: "shaadi", value: 499, currency: "INR" }), null);
});

test("bank text is not accepted as an error code", () => {
  assert.equal(safeErrorCode("Card declined by HDFC Bank for user@example.com"), undefined);
  const event = outcomeEvent("failed", {
    templateId: "shaadi",
    value: 499,
    currency: "INR",
    errorCode: "Card declined by the bank",
  });
  assert.equal("error_code" in event.params, false);
});

test("a repeated Razorpay callback is ignored", () => {
  const gate = { taken: false };
  assert.equal(claimCallback(gate), true);
  assert.equal(claimCallback(gate), false);
  assert.equal(claimCallback(gate), false);
});
