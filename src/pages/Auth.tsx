import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { logIn, signUp } from "../api";
import { trackEvent } from "../lib/analytics";
import { Brand } from "../components/Brand";
import { PublicHeader } from "../components/PublicHeader";
import { GoogleButton } from "../components/GoogleButton";
import { signInWithGoogle } from "../lib/google";
import { Spinner } from "../components/Loader";
import { Breadcrumbs } from "../components/Breadcrumbs";
import "./auth.css";

type Mode = "login" | "signup";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const login = mode === "login";

  useEffect(() => {
    document.title = login ? "Log in | InvitesReady" : "Sign up | InvitesReady";
  }, [login]);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setNotice("");
    setDone(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    const next: Record<string, string> = {};
    if (!login && !name.trim()) next.name = "Please enter your name.";
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (!login && password.length < 8) next.password = "Password must be at least 8 characters.";
    if (login && !password) next.password = "Please enter your password.";
    if (!login && !agreed) next.agree = "Please accept the terms to continue.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      if (login) {
        await logIn(email.trim(), password);
        trackEvent("login", { method: "email" });
        window.location.assign("/studio");
        return;
      }
      await signUp(name.trim(), email.trim(), password);
      trackEvent("sign_up", { method: "email" });
      setDone(true);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Could not sign you in." });
    } finally {
      setBusy(false);
    }
  }

  function continueOn() {
    const next = params.get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/studio";
    window.location.assign(safe);
  }

  async function onGoogle() {
    setNotice("");
    if (!login && !agreed) {
      setErrors({ agree: "Please accept the terms to continue." });
      return;
    }
    setErrors({});
    setGoogleBusy(true);
    try {
      const created = await signInWithGoogle();
      trackEvent(created ? "sign_up" : "login", { method: "google" });
      continueOn();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Could not sign you in with Google." });
      setGoogleBusy(false);
    }
  }

  return (
    <div className="auth-page">
    <PublicHeader />
    <div className="auth">
      <header className="m-top">
        <svg className="m-rings" viewBox="0 0 240 240" fill="none" aria-hidden="true">
          <circle cx="120" cy="120" r="110" stroke="#1C3A2A" strokeOpacity="0.25" strokeWidth="1.5" />
          <circle cx="120" cy="120" r="70" stroke="#1C3A2A" strokeOpacity="0.25" strokeWidth="1.5" />
        </svg>
        <div className="m-bar">
          <Link to="/" aria-label="Back to home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </Link>
          <img className="brand-name" src="/brand/wordmark.png" alt="InvitesReady" />
          <i />
        </div>
        <div className="m-copy">
          <p className="auth-mobile-title">{login ? "Welcome back" : "Create your account"}</p>
          <p>{login ? "Log in to manage your invites." : "Your first invite is free."}</p>
        </div>
      </header>
      <aside className="auth-brand">
        <Brand />
        <div className="auth-pitch">
          <div>
            <h1>
              Beautiful invites,
              <br />
              <em>ready in minutes.</em>
            </h1>
            <p>Design an invitation, share the link, and read every reply — for each day of the celebration.</p>
          </div>
          <div className="auth-preview" aria-hidden="true">
            <div className="auth-card">
              <div>
                <span>You're invited</span>
                <strong>
                  Meera
                  <br />
                  <em>&amp;</em> Arjun
                </strong>
                <i />
                <em className="date">12 · 01 · 2027</em>
              </div>
            </div>
            <div className="auth-float rsvp">
              <span>
                <Check />
              </span>
              <div>
                <strong>New RSVP</strong>
                <em>Vishnu's family · 4 guests</em>
              </div>
            </div>
            <div className="auth-float count">
              <span>Attending</span>
              <div>
                <strong>186</strong> of 320
              </div>
              <i />
            </div>
          </div>
          <ul>
            <li>
              <Check /> Your first invite is free
            </li>
            <li>
              <Check /> Guests reply without an account
            </li>
            <li>
              <Check /> Your family's details stay on your account
            </li>
          </ul>
        </div>
        <p className="auth-copy">© 2026 InvitesReady.com</p>
      </aside>

      <main>
        <div className="auth-card-form">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: login ? "Log in" : "Sign up" }]} />
          {googleBusy ? (
            <div className="auth-wait" role="status" aria-live="polite">
              <Spinner size="md" />
              <h2>Signing you in</h2>
              <p>Finishing with Google. This takes a moment.</p>
            </div>
          ) : done ? (
            <div className="auth-done">
              <span>
                <Check />
              </span>
              <h2>{login ? "Welcome back" : "Account created"}</h2>
              <p>
                {login
                  ? "Taking you to the studio, where your invites and replies live."
                  : "Your account is ready. The free wedding note is the place to start."}
              </p>
              <button type="button" onClick={continueOn}>
                Go to dashboard
              </button>
              <button type="button" className="quiet" onClick={() => setDone(false)}>
                Back to the form
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="auth-tabs" role="tablist" aria-label="Account">
                <button type="button" role="tab" aria-selected={login} className={login ? "on" : ""} onClick={() => switchMode("login")}>
                  Log in
                </button>
                <button type="button" role="tab" aria-selected={!login} className={login ? "" : "on"} onClick={() => switchMode("signup")}>
                  Sign up
                </button>
              </div>
              <div className="auth-head">
                <h2>{login ? "Welcome back" : "Create your account"}</h2>
                <p>{login ? "Log in to manage your invites and replies." : "Your first invite is free. No card needed."}</p>
              </div>
              <GoogleButton disabled={busy || googleBusy} onClick={() => void onGoogle()} />
              <div className="or" aria-hidden="true">
                <i />
                or
                <i />
              </div>
              {!login ? (
                <label>
                  Full name
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "auth-name-error" : undefined} />
                  {errors.name ? <small id="auth-name-error">{errors.name}</small> : null}
                </label>
              ) : null}
              <label>
                Email address
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? "auth-email-error" : undefined} />
                {errors.email ? <small id="auth-email-error">{errors.email}</small> : null}
              </label>
              <label>
                <span className="label-row">Password</span>
                <span className="pw">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={login ? "Your password" : "Create a password"}
                    autoComplete={login ? "current-password" : "new-password"}
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? "auth-password-error" : undefined}
                  />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </span>
                {errors.password ? <small id="auth-password-error">{errors.password}</small> : null}
                {!login && !errors.password ? <em>At least 8 characters.</em> : null}
              </label>
              {!login ? (
                <label className="agree">
                  <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                  <span>
                    I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy policy</Link>.
                  </span>
                  {errors.agree ? <small>{errors.agree}</small> : null}
                </label>
              ) : null}
              {errors.form ? <small className="form-note" role="alert">{errors.form}</small> : null}
              {notice ? <small className="form-note">{notice}</small> : null}
              {login ? <p className="switch">Password reset is not available yet.</p> : null}
              <button className="submit" type="submit" disabled={busy} aria-busy={busy || undefined}>
                {busy ? <Spinner tone="paper" /> : login ? "Log in" : "Create account"}
                {busy ? <span className="spin-sr">{login ? "Logging in" : "Creating account"}</span> : null}
              </button>
              <p className="switch">
                {login ? "New to InvitesReady?" : "Already have an account?"}{" "}
                <button type="button" onClick={() => switchMode(login ? "signup" : "login")}>
                  {login ? "Create an account" : "Log in"}
                </button>
              </p>
            </form>
          )}
        </div>
        <p className="secure">
          <Lock />
          Your password stays on the account. We never share it.
        </p>
      </main>
    </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12c0-1.5 3.5-7 9-7s9 5.5 9 7-3.5 7-9 7-9-5.5-9-7z" stroke="#716A6D" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="#716A6D" strokeWidth="2" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="#716A6D" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 5.1A10 10 0 0 1 12 5c5.5 0 9 5.5 9 7 0 .7-.9 2.3-2.4 3.8M6.6 6.6C4.4 8 3 10.8 3 12c0 1.5 3.5 7 9 7 1.6 0 3-.4 4.3-1.1" stroke="#716A6D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
