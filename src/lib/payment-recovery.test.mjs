import assert from "node:assert/strict";
import test from "node:test";
import {
  afterFinalization,
  beginFinalization,
  checkoutAction,
  emitsBeginCheckout,
  forgetCapturedPayment,
  keepProofAfterFailure,
  readCapturedPayment,
  recoveryMode,
  rememberCapturedPayment,
} from "./payment-recovery.ts";
import { purchaseEventKey } from "./purchase-event-key.ts";

const proof = {
  razorpay_payment_id: "pay_test",
  razorpay_order_id: "order_test",
  razorpay_signature: "abc",
};

function memoryStore() {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
}

test("a new checkout opens Razorpay", () => {
  assert.equal(checkoutAction(null), "open-razorpay");
});

test("a purchase failure after capture keeps the same order and does not publish", () => {
  const store = memoryStore();
  rememberCapturedPayment(store, { templateId: "bloom", coupon: "", payment: proof });
  const held = readCapturedPayment(store, "bloom");
  assert.equal(checkoutAction(held), "finalize");
  assert.equal(keepProofAfterFailure(500), true);
  assert.equal(keepProofAfterFailure(undefined), true);
  assert.deepEqual(afterFinalization("purchase-failed"), { publish: false, chargeAgain: false });
  assert.equal(held.payment.razorpay_order_id, "order_test");
});

test("finalizing again uses the stored order and still does not charge", () => {
  const store = memoryStore();
  rememberCapturedPayment(store, { templateId: "bloom", coupon: "", payment: proof });
  const first = readCapturedPayment(store, "bloom");
  const second = readCapturedPayment(store, "bloom");
  assert.equal(checkoutAction(first), "finalize");
  assert.equal(checkoutAction(second), "finalize");
  assert.equal(first.payment.razorpay_order_id, second.payment.razorpay_order_id);
  assert.equal(afterFinalization("purchase-recorded").chargeAgain, false);
});

test("a successful purchase forgets the proof so the next visit can publish without paying", () => {
  const store = memoryStore();
  rememberCapturedPayment(store, { templateId: "bloom", coupon: "", payment: proof });
  assert.equal(afterFinalization("purchase-recorded").publish, true);
  forgetCapturedPayment(store);
  assert.equal(readCapturedPayment(store, "bloom"), null);
  assert.equal(checkoutAction(null), "open-razorpay");
});

test("a lost purchase response is retried with the same proof", () => {
  const store = memoryStore();
  rememberCapturedPayment(store, { templateId: "bloom", coupon: "", payment: proof });
  assert.equal(keepProofAfterFailure(undefined), true);
  assert.equal(readCapturedPayment(store, "bloom").payment.razorpay_payment_id, "pay_test");
});

test("only a definitive rejection drops the captured payment", () => {
  assert.equal(keepProofAfterFailure(400, "Razorpay could not verify that payment."), false);
  assert.equal(keepProofAfterFailure(400, "That payment does not match this purchase."), false);
  assert.equal(keepProofAfterFailure(400, "Check those details."), false);
  assert.equal(keepProofAfterFailure(400, "That coupon code is not valid."), true);
  assert.equal(keepProofAfterFailure(400), true);
  assert.equal(keepProofAfterFailure(500, "Could not finish that. Try again."), true);
  assert.equal(keepProofAfterFailure(undefined), true);
});

test("a captured payment cannot unlock a different template", () => {
  const store = memoryStore();
  rememberCapturedPayment(store, { templateId: "bloom", coupon: "", payment: proof });
  assert.equal(readCapturedPayment(store, "beach"), null);
});

test("a second finish click is ignored while the first is still running", () => {
  const gate = { current: false };
  const store = memoryStore();
  rememberCapturedPayment(store, { templateId: "bloom", coupon: "", payment: proof });
  assert.equal(beginFinalization(gate), true);
  assert.equal(beginFinalization(gate), false);
  assert.equal(checkoutAction(readCapturedPayment(store, "bloom")), "finalize");
  assert.equal(readCapturedPayment(store, "bloom").payment.razorpay_order_id, "order_test");
});

test("a cleared session recovers from the server attempt and does not start checkout again", () => {
  assert.equal(readCapturedPayment(memoryStore(), "bloom"), null);
  assert.equal(recoveryMode(null, { kind: "captured" }), "captured");
  assert.equal(recoveryMode(null, { kind: "unpaid" }), "unpaid");
  assert.equal(emitsBeginCheckout("captured"), false);
  assert.equal(emitsBeginCheckout("unpaid"), false);
  assert.equal(emitsBeginCheckout("session"), false);
  assert.equal(emitsBeginCheckout("new"), true);
  assert.equal(purchaseEventKey("bloom", "pay_saved"), purchaseEventKey("bloom", "pay_saved"));
});

test("two concurrent finalizations share one stored order", () => {
  const store = memoryStore();
  rememberCapturedPayment(store, { templateId: "bloom", coupon: "", payment: proof });
  const left = readCapturedPayment(store, "bloom");
  const right = readCapturedPayment(store, "bloom");
  assert.equal(left.payment.razorpay_order_id, right.payment.razorpay_order_id);
  assert.equal(checkoutAction(left), "finalize");
  assert.equal(checkoutAction(right), "finalize");
});
