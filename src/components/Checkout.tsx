import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, Lock, Tag } from "lucide-react";
import { createPaymentOrder, ensureSession, getToken, inspectPaymentAttempt, listPendingPayments, verifyCoupon, verifyPayment, type RazorpayPayment } from "../api";
import { Brand } from "./Brand";
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

const OFFERS = [{ code: "WELCOME26", detail: "This template is free" }];
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
};

export function Checkout({ template, detail, onClose, onPurchased, onEntitled }: Props) {
  const { host, signedIn } = useSession();
  const [name, setName] = useState(host?.name ?? "");
  const [email, setEmail] = useState(host?.email ?? "");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; percent: number } | null>(null);
  const [offersOpen, setOffersOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [couponError, setCouponError] = useState("");
  const [captured, setCaptured] = useState<CapturedPayment | null>(() => readCapturedPayment(sessionStorage, template.id));
  const [serverHold, setServerHold] = useState<ServerHold | null>(null);
  const [error, setError] = useState(() => (readCapturedPayment(sessionStorage, template.id) ? RECOVERY : ""));
  const busy = useRef(false);
  const listPrice = template.free ? 0 : template.price;
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
      setOffersOpen(false);
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
        if (message) setError(message);
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="co-screen">
      <header className="co-head">
        <Brand />
        <ol className="co-steps" aria-label="Checkout progress">
          {["Design", "Details", "Payment"].map((label, index) => (
            <li key={label} className="co-step-wrap" style={{ display: "contents" }}>
              <span className={index === 2 ? "co-step is-now" : "co-step"}>
                <span className="co-dot" aria-hidden="true">{index === 2 ? "3" : <Check size={14} strokeWidth={2.6} />}</span>
                {label}
              </span>
              {index < 2 ? <span className="co-bar" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
        <span className="co-secure">
          <Lock size={16} strokeWidth={2.2} aria-hidden="true" />
          Secure checkout
        </span>
      </header>

      <form className="co-main" onSubmit={(event) => void submit(event)}>
        <div className="co-pin">
          <h1>Checkout</h1>
          <section className="co-card">
            <div className="co-item">
              <img src={`/covers/${template.id}.jpg`} alt="" />
              <div>
                <strong>{template.name}</strong>
                {detail ? <small>{detail}</small> : null}
                <button type="button" className="co-edit" onClick={onClose}>Edit design</button>
              </div>
              <span className="co-price">{rupees(listPrice)}</span>
            </div>
            <span className="co-note">One-time payment · RSVP tracking · no watermark · yours to share forever</span>
          </section>
        </div>

        <div className="co-scroll">
          <section className="co-card co-details">
            <h2>Your details</h2>
            <div className="co-fields">
              <label className="co-field">
                <span>Full name</span>
                <input className={fieldErrors.name ? "is-bad" : undefined} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" />
                {fieldErrors.name ? <small>{fieldErrors.name}</small> : null}
              </label>
              <label className="co-field">
                <span>Email</span>
                <input className={fieldErrors.email ? "is-bad" : undefined} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" />
                {fieldErrors.email ? <small>{fieldErrors.email}</small> : null}
              </label>
              <label className="co-field">
                <span>WhatsApp number</span>
                <input className={fieldErrors.phone ? "is-bad" : undefined} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="+91" />
                {fieldErrors.phone ? <small>{fieldErrors.phone}</small> : null}
              </label>
            </div>
            <span className="co-hint">Your receipt and invitation link will be sent here.</span>
          </section>

        <aside className="co-card co-aside">
          <h2>Order summary</h2>
          <div className="co-line">
            <span>{template.name} template</span>
            <b>{rupees(listPrice)}</b>
          </div>
          {applied ? (
            <div className="co-line">
              <span>Coupon {applied.code}</span>
              <b className="is-save">−{rupees(saved)}</b>
            </div>
          ) : null}

          <div className={applied ? "co-coupon is-on" : "co-coupon"}>
            {applied ? (
              <div className="co-applied">
                <span className="co-tag"><Tag size={18} strokeWidth={2.4} aria-hidden="true" /></span>
                <span>
                  <strong>{applied.code} applied</strong>
                  <small>You save {rupees(saved)}</small>
                </span>
                <button type="button" className="co-remove" onClick={() => setApplied(null)}>Remove</button>
              </div>
            ) : (
              <>
                <label className="co-field">
                  <span>Have a coupon code?</span>
                  <span className="co-code">
                    <input
                      value={coupon}
                      onChange={(event) => {
                        setCoupon(event.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      placeholder="Enter code"
                      autoComplete="off"
                      aria-invalid={couponError ? true : undefined}
                      className={couponError ? "is-bad" : undefined}
                    />
                    <button type="button" className="co-apply" onClick={() => void applyCoupon()} disabled={checking}>
                      {checking ? <Spinner tone="paper" /> : "Apply"}
                    </button>
                  </span>
                </label>
                {couponError ? <span className="co-alert" role="alert">{couponError}</span> : null}
                <button type="button" className="co-offers-toggle" aria-expanded={offersOpen} onClick={() => setOffersOpen((open) => !open)}>
                  {offersOpen ? "Hide offers" : `View available offers (${OFFERS.length})`}
                </button>
                {offersOpen ? (
                  <div className="co-offers">
                    {OFFERS.map((offer) => (
                      <div className="co-offer" key={offer.code}>
                        <div>
                          <b>{offer.code}</b>
                          <small>{offer.detail}</small>
                        </div>
                        <button type="button" className="co-use" onClick={() => void applyCoupon(offer.code)}>Apply</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="co-total">
            <span>Total</span>
            <b>{rupees(total)}</b>
          </div>
          <span className="co-gst">Includes {rupees(total * 18 / 118)} GST · one-time payment</span>
          {error ? <span className="co-alert" role="alert">{error}</span> : null}
          <button type="submit" className="co-pay" disabled={submitting || serverHold?.kind === "support"}>
            {submitting ? <Spinner tone="paper" /> : null}
            {submitting
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
                        ? `Pay ${rupees(total)} securely`
                        : "Unlock template"}
          </button>
          <div className="co-trust">
            <span><Check size={16} strokeWidth={2.4} color="#2E8B57" aria-hidden="true" />Pay securely with Razorpay: UPI, cards, netbanking & wallets</span>
            <span><Check size={16} strokeWidth={2.4} color="#2E8B57" aria-hidden="true" /><Link to="/refunds">7-day refund</Link> if you haven’t shared the invite</span>
            <span><Check size={16} strokeWidth={2.4} color="#2E8B57" aria-hidden="true" />GST invoice emailed instantly</span>
          </div>
        </aside>
        </div>
      </form>
    </div>
  );
}
