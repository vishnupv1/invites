export type PaymentProof = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type CapturedPayment = {
  templateId: string;
  coupon: string;
  payment: PaymentProof;
};

const KEY = "invitesready.captured-payment.v1";

type Store = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function complete(payment: Partial<PaymentProof> | undefined): payment is PaymentProof {
  return Boolean(payment?.razorpay_order_id && payment.razorpay_payment_id && payment.razorpay_signature);
}

export function readCapturedPayment(store: Store, templateId: string): CapturedPayment | null {
  try {
    const raw = store.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CapturedPayment>;
    if (parsed.templateId !== templateId || !complete(parsed.payment)) return null;
    return { templateId, coupon: parsed.coupon ?? "", payment: parsed.payment };
  } catch {
    return null;
  }
}

export function rememberCapturedPayment(store: Store, captured: CapturedPayment) {
  store.setItem(KEY, JSON.stringify(captured));
}

export function forgetCapturedPayment(store: Store) {
  store.removeItem(KEY);
}

export function checkoutAction(captured: CapturedPayment | null): "open-razorpay" | "finalize" {
  return captured ? "finalize" : "open-razorpay";
}

export function beginFinalization(gate: { current: boolean }) {
  if (gate.current) return false;
  gate.current = true;
  return true;
}

export type RecoveryMode = "session" | "captured" | "unpaid" | "new";

export function recoveryMode(
  sessionProof: CapturedPayment | null,
  server: { kind: "captured" | "unpaid" | "support" | "wait" } | null,
): RecoveryMode {
  if (sessionProof) return "session";
  if (server?.kind === "captured") return "captured";
  if (server?.kind === "unpaid") return "unpaid";
  return "new";
}

export function emitsBeginCheckout(mode: RecoveryMode) {
  return mode === "new";
}

const UNRECOVERABLE_PROOF = new Set([
  "Razorpay could not verify that payment.",
  "That payment does not match this purchase.",
  "Check those details.",
]);

export function keepProofAfterFailure(status: number | undefined, message?: string) {
  if (status !== 400) return true;
  return !message || !UNRECOVERABLE_PROOF.has(message);
}

export function afterFinalization(result: "purchase-failed" | "purchase-recorded") {
  if (result === "purchase-failed") return { publish: false, chargeAgain: false };
  return { publish: true, chargeAgain: false };
}

export function requestStatus(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
}
