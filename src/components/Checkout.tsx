import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, Lock, Tag } from "lucide-react";
import { createPaymentOrder, ensureSession, getToken, verifyCoupon, verifyPayment, type RazorpayPayment } from "../api";
import { Brand } from "./Brand";
import { Spinner } from "./Loader";
import { trackEvent, trackSignUp } from "../lib/analytics";
import { useSession } from "../session";
import type { Template } from "../types";
import "./checkout.css";

type RazorpayFailure = { error?: { description?: string } };
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

function rupees(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

type FieldErrors = { name?: string; email?: string; phone?: string };

type Props = {
  template: Template;
  detail?: string;
  onClose: () => void;
  onPurchased: (coupon?: string, payment?: RazorpayPayment) => Promise<void>;
};

export function Checkout({ template, detail, onClose, onPurchased }: Props) {
  const { host } = useSession();
  const [name, setName] = useState(host?.name ?? "");
  const [email, setEmail] = useState(host?.email ?? "");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [offersOpen, setOffersOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const listPrice = template.free ? 0 : template.price;
  const total = applied || template.free ? 0 : listPrice;

  useEffect(() => {
    if (host?.name) setName((current) => current || host.name);
    if (host?.email) setEmail((current) => current || host.email);
  }, [host]);

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
      setApplied("");
      setCouponError("Enter a coupon code.");
      return;
    }
    setChecking(true);
    setCouponError("");
    try {
      const result = await verifyCoupon(code);
      setCoupon("");
      setApplied(result.code);
      setOffersOpen(false);
      setError("");
    } catch (reason) {
      setApplied("");
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
    if (busy.current) return;
    const next = problems();
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    busy.current = true;
    setSubmitting(true);
    setError("");
    trackEvent("begin_checkout", {
      currency: "INR",
      value: total,
      items: checkoutItems(total),
    });
    try {
      if (!getToken()) {
        await ensureSession(email.trim(), name.trim());
        trackSignUp("email");
      }
      if (applied || template.free) {
        await onPurchased(applied || undefined);
        trackEvent("purchase", {
          currency: "INR",
          value: 0,
          template_name: template.name,
          coupon: applied || undefined,
          items: checkoutItems(0),
        });
        return;
      }
      const order = await createPaymentOrder(template.id);
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Could not open Razorpay. Try again.");
      const payment = await new Promise<RazorpayPayment>((resolve, reject) => {
        const checkout = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.orderId,
          name: "InvitesReady",
          description: `Unlock ${template.name}`,
          prefill: { name: name.trim(), email: email.trim(), contact: phone.replace(/\D/g, "") },
          theme: { color: "#D81B60" },
          handler: resolve,
          modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
        });
        checkout.on("payment.failed", (response) => {
          reject(new Error(response.error?.description || "Payment failed. Please try again."));
        });
        checkout.open();
      });
      await verifyPayment(payment);
      await onPurchased(undefined, payment);
      trackEvent("purchase", {
        currency: "INR",
        value: template.price,
        transaction_id: payment.razorpay_payment_id,
        template_name: template.name,
        coupon: applied || undefined,
        items: checkoutItems(template.price),
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not complete the purchase.";
      if (message) setError(message);
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
              <span>Coupon {applied}</span>
              <b className="is-save">−{rupees(listPrice)}</b>
            </div>
          ) : null}

          <div className={applied ? "co-coupon is-on" : "co-coupon"}>
            {applied ? (
              <div className="co-applied">
                <span className="co-tag"><Tag size={18} strokeWidth={2.4} aria-hidden="true" /></span>
                <span>
                  <strong>{applied} applied</strong>
                  <small>You save {rupees(listPrice)}</small>
                </span>
                <button type="button" className="co-remove" onClick={() => setApplied("")}>Remove</button>
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
          <button type="submit" className="co-pay" disabled={submitting}>
            {submitting ? <Spinner tone="paper" /> : null}
            {submitting ? "Opening Razorpay…" : total ? `Pay ${rupees(total)} securely` : "Unlock template"}
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
