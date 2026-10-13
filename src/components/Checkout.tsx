import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPaymentOrder, ensureSession, getToken, inspectPaymentAttempt, listPendingPayments, verifyCoupon, verifyPayment, type RazorpayPayment } from "../api";
import { ArrowIcon, BackIcon, LockIcon } from "./shell/marks";
import { Spinner } from "./Loader";
import { trackEvent, trackPaymentOutcome, trackPurchase } from "../lib/analytics";
import { claimCallback, safeErrorCode } from "../lib/funnel-events";
import {
  type CapturedPayment,
  beginFinalization,
  checkoutAction,
  emitsBeginCheckout,
  forgetCapturedPayment,
  keepProofAfterFailure,
  readCapturedPayment,
  recoveryMode,
  rememberCapturedPayment,
  requestStatus,
} from "../lib/payment-recovery";
import { useSession } from "../session";
import type { Template } from "../types";
import "./checkout.css";
import "./checkout-shell.css";

type RazorpayFailure = { error?: { description?: string; reason?: string; code?: string } };

type CheckoutStop = Error & { outcome: "cancelled" | "failed"; errorCode?: string };

function checkoutStop(message: string, outcome: "cancelled" | "failed", errorCode?: string) {
  const error = new Error(message) as CheckoutStop;
  error.outcome = outcome;
  error.errorCode = errorCode;
  return error;
}
type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
};
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact?: string };
  theme: { color: string };
  handler: (payment: RazorpayPayment) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

let razorpayScript: Promise<void> | null = null;

function openRazorpay(
  order: { keyId: string; amount: number; currency: string; orderId: string },
  name: string,
  email: string,
  phone: string,
  templateName: string,
) {
  return new Promise<RazorpayPayment>((resolve, reject) => {
    const gate = { taken: false };
    const checkout = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "InvitesReady",
      description: `Unlock ${templateName}`,
      prefill: { name: name.trim(), email: email.trim(), contact: phone.replace(/\D/g, "") },
      theme: { color: "#1C3A2A" },
      handler: (paid) => {
        if (!claimCallback(gate)) return;
        resolve(paid);
      },
      modal: {
        ondismiss: () => {
          if (!claimCallback(gate)) return;
          reject(checkoutStop("Payment was cancelled.", "cancelled"));
        },
      },
    });
    checkout.on("payment.failed", (response) => {
      if (!claimCallback(gate)) return;
      reject(checkoutStop(response.error?.description || "Payment failed. Please try again.", "failed", response.error?.reason || response.error?.code));
    });
    checkout.open();
  });
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScript) {
    razorpayScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Razorpay. Check your connection and try again."));
      document.head.appendChild(script);
    });
  }
  return razorpayScript;
}

const RECOVERY = "Payment received. Finish unlocking this design. You will not be charged again.";
const RESUME = "A checkout is already open for this design. Continue with the same order. You will only be charged if you complete the payment.";

type ServerHold =
  | { kind: "captured"; attemptId: string; coupon: string; amount: number; currency: string }
  | { kind: "unpaid"; attemptId: string; coupon: string; orderId: string; amount: number; currency: string; keyId: string }
  | { kind: "completed"; coupon: string; amount: number; currency: string; paymentId: string }
  | { kind: "support"; message: string }
  | { kind: "wait"; message: string };

function rupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function discountRupees(price: number, percentOff: number) {
  return Math.round((price * percentOff) / 100);
}

type FieldErrors = { name?: string; email?: string; phone?: string };

type Props = {
  template: Template;
  detail?: string;
  onClose: () => void;
  onPurchased: (coupon?: string, payment?: RazorpayPayment) => Promise<void>;
  onEntitled: (coupon?: string) => Promise<void>;
  onAlreadyOwned?: () => void;
};

export function Checkout({ template, detail, onClose, onPurchased, onEntitled, onAlreadyOwned }: Props) {
  const { host, signedIn } = useSession();
  const [name, setName] = useState(host?.name ?? "");
  const [email, setEmail] = useState(host?.email ?? "");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; percent: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [couponError, setCouponError] = useState("");
  const [captured, setCaptured] = useState<CapturedPayment | null>(() => readCapturedPayment(sessionStorage, template.id));
  const [serverHold, setServerHold] = useState<ServerHold | null>(null);
  const [error, setError] = useState(() => (readCapturedPayment(sessionStorage, template.id) ? RECOVERY : ""));
  const busy = useRef(false);
  // const listPrice = template.free ? 0 : template.price;
  const listPrice = 0;
  const saved = discountRupees(listPrice, applied?.percent ?? 0);
  const total = listPrice - saved;

  useEffect(() => {
    if (host?.name) setName((current) => current || host.name);
    if (host?.email) setEmail((current) => current || host.email);
  }, [host]);

  useEffect(() => {
    if (!signedIn || readCapturedPayment(sessionStorage, template.id)) return;
    let cancel = false;
    listPendingPayments(template.id)
      .then(async (listed) => {
        const attempt = listed.attempts[0];
        if (!attempt || cancel) return;
        const preview = await inspectPaymentAttempt(attempt.id);
        if (cancel) return;
        if (preview.state === "captured") {
          setServerHold({ kind: "captured", attemptId: preview.attemptId, coupon: preview.coupon, amount: preview.amount, currency: preview.currency });
          setError(RECOVERY);
        } else if (preview.state === "unpaid") {
          setServerHold({
            kind: "unpaid",
            attemptId: preview.attemptId,
            coupon: preview.coupon,
            orderId: preview.orderId,
            amount: preview.amount,
            currency: preview.currency,
            keyId: preview.keyId,
          });
          setError(RESUME);
        } else if (preview.state === "completed" || preview.state === "recovered") {
          setServerHold({
            kind: "completed",
            coupon: preview.coupon,
            amount: preview.amount,
            currency: preview.currency,
            paymentId: preview.paymentId,
          });
          setError(RECOVERY);
        }
      })
      .catch((reason) => {
        if (cancel) return;
        const status = requestStatus(reason);
        const message = reason instanceof Error ? reason.message : "Could not check that payment.";
        if (onAlreadyOwned && /already own/i.test(message)) {
          onAlreadyOwned();
          return;
        }
        if (status === 503) {
          setServerHold({ kind: "wait", message });
          setError(message);
        } else if (status === 409) {
          setServerHold({ kind: "support", message });
          setError(message);
        } else if (status === 410) setError(message);
      });
    return () => {
      cancel = true;
    };
  }, [signedIn, template.id]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy.current) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function checkoutItems(price: number) {
    return [{ item_id: template.id, item_name: template.name, price }];
  }

  async function applyCoupon(raw = coupon) {
    const code = raw.trim();
    if (!code) {
      setApplied(null);
      setCouponError("Enter a coupon code.");
      return;
    }
    setChecking(true);
    setCouponError("");
    try {
      const result = await verifyCoupon(code);
      setCoupon("");
      setApplied({ code: result.code, percent: result.percent ?? 100 });
      setError("");
    } catch (reason) {
      setApplied(null);
      setCouponError(reason instanceof Error ? reason.message : "That code isn’t valid. Check the spelling and try again.");
    } finally {
      setChecking(false);
    }
  }

  function problems() {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a 10-digit number.";
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next = problems();
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    if (!beginFinalization(busy)) return;
    setSubmitting(true);
    setError("");
    const mode = recoveryMode(captured, serverHold && serverHold.kind !== "support" && serverHold.kind !== "wait" && serverHold.kind !== "completed" ? serverHold : serverHold?.kind === "completed" ? { kind: "captured" } : null);
    try {
      if (!getToken()) {
        await ensureSession(email.trim(), name.trim());
      }
      if (serverHold?.kind === "wait") {
        const listed = await listPendingPayments(template.id);
        const attempt = listed.attempts[0];
        if (!attempt) {
          setServerHold(null);
          return;
        }
        const preview = await inspectPaymentAttempt(attempt.id);
        if (preview.state === "captured" || preview.state === "completed" || preview.state === "recovered") {
          setServerHold(preview.state === "captured"
            ? { kind: "captured", attemptId: preview.attemptId, coupon: preview.coupon, amount: preview.amount, currency: preview.currency }
            : { kind: "completed", coupon: preview.coupon, amount: preview.amount, currency: preview.currency, paymentId: preview.paymentId });
          setError(RECOVERY);
        } else if (preview.state === "unpaid") {
          setServerHold({
            kind: "unpaid",
            attemptId: preview.attemptId,
            coupon: preview.coupon,
            orderId: preview.orderId,
            amount: preview.amount,
            currency: preview.currency,
            keyId: preview.keyId,
          });
          setError(RESUME);
        }
        return;
      }
      if (serverHold?.kind === "support") return;
      if (serverHold?.kind === "completed" || serverHold?.kind === "captured") {
        const finished = serverHold.kind === "completed"
          ? { coupon: serverHold.coupon, amount: serverHold.amount, currency: serverHold.currency, paymentId: serverHold.paymentId }
          : await inspectPaymentAttempt(serverHold.attemptId, true);
        if ("state" in finished && finished.state !== "recovered" && finished.state !== "completed") {
          setError(RECOVERY);
          return;
        }
        const coupon = finished.coupon || undefined;
        const paymentId = "paymentId" in finished ? finished.paymentId : "";
        forgetCapturedPayment(sessionStorage);
        setCaptured(null);
        setServerHold(null);
        await onEntitled(coupon);
        trackPurchase({
          templateId: template.id,
          templateName: template.name,
          value: finished.amount / 100,
          currency: finished.currency || "INR",
          transactionId: paymentId || undefined,
          coupon,
          items: checkoutItems(finished.amount / 100),
        });
        return;
      }
      const finishing = checkoutAction(captured) === "finalize";
      if (total === 0 && mode === "new") {
        trackEvent("begin_checkout", {
          currency: "INR",
          value: 0,
          template_id: template.id,
          template_name: template.name,
          items: checkoutItems(0),
        });
        await onPurchased(applied?.code);
        trackPurchase({
          templateId: template.id,
          templateName: template.name,
          value: 0,
          currency: "INR",
          coupon: applied?.code,
          items: checkoutItems(0),
        });
        return;
      }
      let payment = captured?.payment;
      const couponCode = finishing ? captured?.coupon || undefined : serverHold?.kind === "unpaid" ? serverHold.coupon || undefined : applied?.code;
      if (mode === "unpaid" && serverHold?.kind === "unpaid") {
        await loadRazorpay();
        if (!window.Razorpay) throw new Error("Could not open Razorpay. Try again.");
        payment = await openRazorpay({
          keyId: serverHold.keyId,
          amount: serverHold.amount,
          currency: serverHold.currency,
          orderId: serverHold.orderId,
        }, name, email, phone, template.name);
        const held = { templateId: template.id, coupon: serverHold.coupon, payment };
        rememberCapturedPayment(sessionStorage, held);
        setCaptured(held);
      } else if (!finishing) {
      const order = await createPaymentOrder(template.id, applied?.code);
      if (order.action === "recover") {
        setServerHold({ kind: "captured", attemptId: order.attemptId, coupon: applied?.code ?? "", amount: total * 100, currency: "INR" });
        setError(RECOVERY);
        return;
      }
      if (!order.reused && emitsBeginCheckout("new")) {
        trackEvent("begin_checkout", {
          currency: "INR",
          value: total,
          template_id: template.id,
          template_name: template.name,
          items: checkoutItems(total),
        });
      }
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Could not open Razorpay. Try again.");
      payment = await openRazorpay(order, name, email, phone, template.name);
      const held = { templateId: template.id, coupon: applied?.code ?? "", payment };
      rememberCapturedPayment(sessionStorage, held);
      setCaptured(held);
      }
      if (!payment) throw new Error("Could not open Razorpay. Try again.");
      await verifyPayment(payment);
      await onPurchased(couponCode, payment);
      forgetCapturedPayment(sessionStorage);
      setCaptured(null);
      trackPurchase({
        templateId: template.id,
        templateName: template.name,
        value: total,
        currency: "INR",
        transactionId: payment.razorpay_payment_id,
        coupon: couponCode,
        items: checkoutItems(total),
      });
    } catch (reason) {
      const stop = reason as Partial<CheckoutStop>;
      if (stop.outcome === "cancelled" || stop.outcome === "failed") {
        trackPaymentOutcome(stop.outcome, {
          templateId: template.id,
          value: total,
          currency: "INR",
          errorCode: safeErrorCode(stop.errorCode),
        });
      }
      const heldNow = readCapturedPayment(sessionStorage, template.id);
      const proofMessage = reason instanceof Error ? reason.message : undefined;
      if (heldNow && keepProofAfterFailure(requestStatus(reason), proofMessage)) {
        setCaptured(heldNow);
        setError(RECOVERY);
      } else {
        if (heldNow && !keepProofAfterFailure(requestStatus(reason), proofMessage)) {
          forgetCapturedPayment(sessionStorage);
          setCaptured(null);
        }
        const message = reason instanceof Error ? reason.message : "Could not complete the purchase.";
        if (onAlreadyOwned && /already own/i.test(message)) {
          onAlreadyOwned();
          return;
        }
        if (message) setError(message);
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  const couponRow = applied ? (
    <div className="ck-applied">
      <span>
        <strong>{applied.code} applied</strong>
        <small>You save {rupees(saved)}</small>
      </span>
      <button type="button" onClick={() => setApplied(null)}>Remove</button>
    </div>
  ) : (
    <>
      <div className="ck-coupon">
        <input
          value={coupon}
          onChange={(event) => {
            setCoupon(event.target.value.toUpperCase());
            setCouponError("");
          }}
          placeholder="Have a coupon code?"
          autoComplete="off"
          aria-label="Coupon code"
          aria-invalid={couponError ? true : undefined}
          className={couponError ? "is-bad" : undefined}
        />
        <button type="button" onClick={() => void applyCoupon()} disabled={checking}>
          {checking ? "…" : "Apply"}
        </button>
      </div>
      {couponError ? <p className="ck-alert" role="alert">{couponError}</p> : null}
    </>
  );

  const payLabel = submitting
    ? (captured || serverHold?.kind === "captured" || serverHold?.kind === "completed" ? "Finishing…" : "Opening Razorpay…")
    : serverHold?.kind === "support"
      ? "Contact support"
      : serverHold?.kind === "wait"
        ? "Check again"
        : captured || serverHold?.kind === "captured" || serverHold?.kind === "completed"
          ? "Finish unlocking"
          : serverHold?.kind === "unpaid"
            ? "Continue payment"
            : total
              ? `Pay ${rupees(total)}`
              : "Unlock template";

  return (
    <form className="ck" onSubmit={(event) => void submit(event)}>
      <header className="ck-bar">
        <button type="button" className="ck-back" aria-label="Back" onClick={onClose}><BackIcon /></button>
        <div className="ck-title">
          <h1>Checkout</h1>
          <small>Review & pay</small>
        </div>
        <p className="ck-crumb">Preview <span>/</span> Sign in <span>/</span> <b>Checkout</b></p>
        <span className="ck-secure"><LockIcon /> Secure checkout</span>
      </header>

      <div className="ck-body">
        <div className="ck-copy">
          <p className="ck-kicker">Almost there</p>
          <h2>Checkout</h2>
          <p className="ck-sub">{email.trim() ? `Signed in as ${email.trim()}` : "Sign-in details"}. Your invitation goes live the moment you pay.</p>
          <div className="ck-fields">
            <label>
              Full name
              <input className={fieldErrors.name ? "is-bad" : undefined} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" />
              {fieldErrors.name ? <small>{fieldErrors.name}</small> : null}
            </label>
            <label>
              Email
              <input className={fieldErrors.email ? "is-bad" : undefined} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" />
              {fieldErrors.email ? <small>{fieldErrors.email}</small> : null}
            </label>
            <label>
              WhatsApp number
              <input className={fieldErrors.phone ? "is-bad" : undefined} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="+91" />
              {fieldErrors.phone ? <small>{fieldErrors.phone}</small> : null}
            </label>
          </div>
          <div className="ck-desk-coupon">
            <p className="ck-label">Coupon</p>
            {couponRow}
          </div>
          <p className="ck-label">Pay with<span className="ck-hint">chosen on the next step</span></p>
          <div className="ck-methods">
            <div><b>UPI</b><small>GPay, PhonePe, Paytm</small></div>
            <div><b>Card</b><small>Visa, Mastercard, RuPay</small></div>
            <div><b>Netbanking</b><small>All major banks</small></div>
          </div>
          <p className="ck-label">What you get</p>
          <ul className="ck-gets">
            <li>Unlimited guests</li>
            <li>RSVP on the invitation</li>
            <li>One link to share</li>
            <li>Free edits forever</li>
          </ul>
        </div>

        <aside className="ck-receipt">
          <div className="ck-card">
          <div className="ck-item">
            <img src={`/covers/${template.id}.jpg`} alt="" />
            <div>
              <b>{template.name}</b>
              <small>{detail || "Your invitation"}</small>
            </div>
          </div>
          <div className="ck-lines">
            <div><span>Template</span><span>{rupees(listPrice)}</span></div>
            {applied ? <div><span>Coupon {applied.code}</span><span>− {rupees(saved)}</span></div> : null}
            <div className="is-soft"><span>GST included</span><span>{rupees(total * 18 / 118)}</span></div>
            <div className="is-total"><span>Total</span><span>{rupees(total)}</span></div>
          </div>
          </div>
          <div className="ck-edge" aria-hidden="true" />
          <div className="ck-mobile-coupon">{couponRow}</div>
          <button type="submit" className="ck-pay ck-pay-desk" disabled={submitting || serverHold?.kind === "support"}>
            <span>{submitting ? <Spinner tone="paper" /> : null}{payLabel}</span>
            <b aria-hidden="true"><ArrowIcon /></b>
          </button>
          <p className="ck-trust"><span>Razorpay secure</span><span>Live instantly</span><span>Free edits</span></p>
          {error ? <p className="ck-alert" role="alert">{error}</p> : null}
        </aside>
      </div>

      <footer className="ck-foot">
        <button type="submit" className="ck-pay" disabled={submitting || serverHold?.kind === "support"}>
          <span>{submitting ? <Spinner tone="paper" /> : null}{payLabel}</span>
          <b aria-hidden="true"><ArrowIcon /></b>
        </button>
        <p>UPI · Cards · Netbanking · Wallets</p>
      </footer>
    </form>
  );
}
