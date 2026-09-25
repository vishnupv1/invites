import { useState, type FormEvent } from "react";
import { ensureSession } from "../api";
import type { Template } from "../types";

type Props = {
  template: Template;
  onClose: () => void;
  onPurchased: () => Promise<void>;
};

export function Checkout({ template, onClose, onPurchased }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");

  function onCard(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    setCard(digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
  }

  function onExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const digits = card.replace(/\s/g, "");
    if (name.trim().length < 2) return setError("Add the name on the card.");
    if (!email.includes("@")) return setError("Add a valid email for the receipt.");
    if (digits.length !== 16) return setError("Enter a 16-digit card number.");
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return setError("Use an expiry like 08/28.");
    if (!/^\d{3,4}$/.test(cvc)) return setError("Enter the 3-digit security code.");
    try {
      await ensureSession(email, name);
      await onPurchased();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the purchase.");
    }
  }

  return (
    <div className="modal-back" role="presentation" onClick={onClose}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <p className="eyebrow">One-time purchase</p>
        <h2>Unlock {template.name}</h2>
        <p className="lede">
          Pay ${template.price} once. The design stays yours for every function after this. Demo
          checkout — nothing is charged.
        </p>
        <label>
          Name on card
          <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="cc-name" />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </label>
        <label>
          Card number
          <input
            value={card}
            onChange={(event) => onCard(event.target.value)}
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            autoComplete="cc-number"
          />
        </label>
        <div className="split">
          <label>
            Expiry
            <input
              value={expiry}
              onChange={(event) => onExpiry(event.target.value)}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
            />
          </label>
          <label>
            CVC
            <input
              value={cvc}
              onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </label>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="solid">
            Pay ${template.price} once
          </button>
        </div>
      </form>
    </div>
  );
}
