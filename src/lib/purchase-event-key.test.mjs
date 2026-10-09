import assert from "node:assert/strict";
import test from "node:test";
import { purchaseEventKey } from "./purchase-event-key.ts";

test("a paid purchase is deduped by the payment id", () => {
  assert.equal(purchaseEventKey("shaadi", "pay_123", "SAVE"), "paid:pay_123");
  assert.equal(purchaseEventKey("shaadi", "pay_123"), purchaseEventKey("gazal", "pay_123", "OTHER"));
});

test("a zero-price purchase is deduped by template and coupon", () => {
  assert.equal(purchaseEventKey("inland", undefined, "FREE100"), "zero:inland:FREE100");
  assert.notEqual(purchaseEventKey("inland", undefined, "FREE100"), purchaseEventKey("shaadi", undefined, "FREE100"));
  assert.notEqual(purchaseEventKey("inland"), purchaseEventKey("inland", undefined, "FREE100"));
});
