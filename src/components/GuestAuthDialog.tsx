import { useState, type FormEvent } from "react";
import { logIn, signUp } from "../api";
import { trackLogin, trackSignUp } from "../lib/analytics";
import { signInWithGoogle } from "../lib/google";
import { GoogleButton } from "./GoogleButton";
import { Spinner } from "./Loader";

type Tab = "login" | "signup";

type Props = {
  heading?: string;
  onClose: () => void;
  onDone: () => void;
};

export function GuestAuthDialog({ heading = "Sign in to save your invitation", onClose, onDone }: Props) {
  const [tab, setTab] = useState<Tab>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Add a valid email.");
    if (tab === "signup" && !name.trim()) return setError("Add your name.");
    if (tab === "signup" && password.length < 8) return setError("Use at least 8 characters.");
    if (tab === "login" && !password) return setError("Add your password.");
    setBusy(true);
    try {
      if (tab === "signup") {
        await signUp(name.trim(), email.trim(), password);
        trackSignUp("email");
      } else {
        await logIn(email.trim(), password);
        trackLogin("email");
      }
      onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError("");
    setGoogleBusy(true);
    try {
      const created = await signInWithGoogle();
      if (created) trackSignUp("google");
      else trackLogin("google");
      onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in with Google.");
      setGoogleBusy(false);
    }
  }

  return (
    <div className="ed-modal">
      <div className="ed-dialog" role="dialog" aria-label={heading}>
        <div className="ed-dialog-head">
          <div>
            <h2>{heading}</h2>
            <p className="ed-lead">Your draft stays on this device until you publish.</p>
          </div>
          <button type="button" className="ed-x" aria-label="Close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {googleBusy ? (
          <div className="ed-stack" role="status" aria-live="polite">
            <p className="ed-lead wait-line"><Spinner /> Signing you in with Google…</p>
          </div>
        ) : (
          <form className="ed-stack" onSubmit={submit}>
            <GoogleButton disabled={busy} onClick={() => void onGoogle()} />
            <div className="ed-device" role="tablist" aria-label="Account">
              <button type="button" role="tab" aria-selected={tab === "login"} aria-pressed={tab === "login"} onClick={() => { setTab("login"); setError(""); }}>
                Log in
              </button>
              <button type="button" role="tab" aria-selected={tab === "signup"} aria-pressed={tab === "signup"} onClick={() => { setTab("signup"); setError(""); }}>
                Create account
              </button>
            </div>
            {tab === "signup" ? (
              <label className="ed-field">
                Name
                <input value={name} onChange={(input) => setName(input.target.value)} autoComplete="name" />
              </label>
            ) : null}
            <label className="ed-field">
              Email
              <input type="email" value={email} onChange={(input) => setEmail(input.target.value)} autoComplete="email" />
            </label>
            <label className="ed-field">
              Password
              <input type="password" value={password} onChange={(input) => setPassword(input.target.value)} autoComplete={tab === "signup" ? "new-password" : "current-password"} />
            </label>
            {error ? <div className="ed-alert" role="alert">{error}</div> : null}
            <button type="submit" className="ed-go" disabled={busy} aria-busy={busy || undefined}>
              {busy ? <Spinner tone="paper" /> : tab === "signup" ? "Create account" : "Log in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
