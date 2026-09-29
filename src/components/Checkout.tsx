import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createPaymentOrder, ensureSession, getToken, verifyCoupon, verifyPayment, type RazorpayPayment } from "../api";
import { formatPrice } from "../data/templates";
import { trackEvent } from "../lib/analytics";
import { useSession } from "../session";
import type { Template } from "../types";

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
  prefill: { name: string; email: string };
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

type Props = {
  template: Template;
  onClose: () => void;
  onPurchased: (coupon?: string, payment?: RazorpayPayment) => Promise<void>;
};

export function Checkout({ template, onClose, onPurchased }: Props) {
  const { host, signedIn } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackEvent("begin_checkout", {
      currency: "INR",
      value: template.free ? 0 : template.price,
      item_id: template.id,
    });
  }, [template.free, template.id, template.price]);

  async function applyCoupon() {
    const code = coupon.trim();
    if (!code) {
      setApplied(false);
      setError("Enter a coupon code.");
      return;
    }
    setChecking(true);
    try {
      const result = await verifyCoupon(code);
      setCoupon(result.code);
      setApplied(true);
      setError("");
    } catch (reason) {
      setApplied(false);
      setError(reason instanceof Error ? reason.message : "That coupon code is not valid.");
    } finally {
      setChecking(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!signedIn && !getToken()) {
      if (name.trim().length < 2) return setError("Add your name.");
      if (!email.includes("@")) return setError("Add a valid email.");
    }
    setSubmitting(true);
    setError("");
    try {
      if (!getToken()) await ensureSession(email, name);
      if (applied) {
        await onPurchased(coupon.trim());
        trackEvent("purchase", { currency: "INR", value: 0, item_id: template.id });
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
          prefill: {
            name: name.trim() || host?.name || "",
            email: email.trim() || host?.email || "",
          },
          theme: { color: "#7c4d3a" },
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
        item_id: template.id,
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not complete the purchase.";
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-back" role="presentation" onClick={onClose}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <p className="eyebrow">One-time purchase</p>
        <h2>Unlock {template.name}</h2>
        <p className="lede">
          {applied
            ? "Coupon applied. This template is yours with no payment."
            : `Pay ${formatPrice(template)} once. Razorpay collects the payment, and the design stays yours after that.`}
        </p>
        <label>
          Coupon code
          <span className="coupon-row">
            <input
              value={coupon}
              onChange={(event) => {
                setCoupon(event.target.value);
                setApplied(false);
              }}
              autoComplete="off"
              placeholder="Enter a code"
            />
            <button type="button" className="ghost" onClick={() => void applyCoupon()} disabled={checking}>
              {checking ? "Checking…" : "Apply"}
            </button>
          </span>
        </label>
        {applied ? <p className="coupon-ok">{coupon} applied</p> : null}
        {signedIn || getToken() ? null : (
          <>
            <label>
              Your name
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </label>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
          </>
        )}
        {!applied ? (
          <p className="checkout-note">
            Cards, UPI, netbanking, and wallets are handled by Razorpay. <Link to="/refunds">Refunds</Link>
          </p>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="solid" disabled={submitting}>
            {submitting ? "Please wait…" : applied ? "Unlock template" : `Pay ${formatPrice(template)} with Razorpay`}
          </button>
        </div>
      </form>
    </div>
  );
}
