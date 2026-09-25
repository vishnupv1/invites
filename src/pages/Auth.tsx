import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { logIn, signUp } from "../api";
import "./auth.css";

type Mode = "login" | "signup";
type Method = "email" | "phone";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Auth() {
  const [mode, setMode] = useState<Mode>("signup");
  const [method, setMethod] = useState<Method>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const login = mode === "login";

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
    if (method === "phone") {
      setNotice("Mobile codes aren’t available yet. Use your email to continue.");
      if (phone.replace(/\D/g, "").length !== 10) next.phone = "Enter a 10-digit mobile number.";
      setErrors(next);
      return;
    }
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
        window.location.assign("/studio");
        return;
      }
      await signUp(name.trim(), email.trim(), password);
      setDone(true);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Could not sign you in." });
    } finally {
      setBusy(false);
    }
  }

  function continueOn() {
    window.location.assign("/studio");
  }

  return (
    <div className="auth">
      <header className="m-top">
        <svg className="m-rings" viewBox="0 0 240 240" fill="none" aria-hidden="true">
          <circle cx="120" cy="120" r="110" stroke="#C89B5B" strokeOpacity="0.25" strokeWidth="1.5" />
          <circle cx="120" cy="120" r="70" stroke="#C89B5B" strokeOpacity="0.25" strokeWidth="1.5" />
        </svg>
        <div className="m-bar">
          <Link to="/" aria-label="Back to home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </Link>
          <span>
            Invites<em>Ready</em>
          </span>
          <i />
        </div>
        <div className="m-copy">
          <h1>{login ? "Welcome back" : "Create your account"}</h1>
          <p>{login ? "Log in to manage your invites." : "Your first invite is free."}</p>
        </div>
      </header>
      <aside className="auth-brand">
        <Link className="auth-logo" to="/">
          <Envelope />
          <span>
            Invites<em>Ready</em>
          </span>
        </Link>
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
                <em>The Menon family · 4 guests</em>
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
          {done ? (
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
              <button
                type="button"
                className="google"
                onClick={() => setNotice("Google sign-in isn’t available yet. Use your email to continue.")}
              >
                <Google />
                Continue with Google
              </button>
              <div className="or">
                <i />
                or use
                <i />
              </div>
              <div className="methods">
                <button type="button" className={method === "phone" ? "on" : ""} aria-pressed={method === "phone"} onClick={() => { setMethod("phone"); setNotice(""); }}>
                  Mobile number
                </button>
                <button type="button" className={method === "email" ? "on" : ""} aria-pressed={method === "email"} onClick={() => { setMethod("email"); setNotice(""); }}>
                  Email
                </button>
              </div>
              {!login ? (
                <label>
                  Full name
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" />
                  {errors.name ? <small>{errors.name}</small> : null}
                </label>
              ) : null}
              {method === "email" ? (
                <>
                  <label>
                    Email address
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
                    {errors.email ? <small>{errors.email}</small> : null}
                  </label>
                  <label>
                    <span className="label-row">
                      Password
                      {login ? (
                        <button type="button" className="forgot" onClick={() => setNotice("Password reset isn’t available yet.")}>
                          Forgot password?
                        </button>
                      ) : null}
                    </span>
                    <span className="pw">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={login ? "Your password" : "Create a password"}
                        autoComplete={login ? "current-password" : "new-password"}
                      />
                      <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </span>
                    {errors.password ? <small>{errors.password}</small> : null}
                    {!login && !errors.password ? <em>At least 8 characters.</em> : null}
                  </label>
                </>
              ) : (
                <label>
                  Mobile number
                  <span className="auth-dial">
                    <b>+91</b>
                    <input inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="98765 43210" />
                  </span>
                  {errors.phone ? <small>{errors.phone}</small> : <em>A code by SMS isn’t available yet. Use email to sign in.</em>}
                </label>
              )}
              {!login ? (
                <label className="agree">
                  <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
                  <span>I agree to keep this account for my invitations and guest replies.</span>
                  {errors.agree ? <small>{errors.agree}</small> : null}
                </label>
              ) : null}
              {errors.form ? <small className="form-note">{errors.form}</small> : null}
              {notice ? <small className="form-note">{notice}</small> : null}
              <button className="submit" type="submit" disabled={busy}>
                {busy ? "Please wait…" : method === "phone" ? "Send OTP" : login ? "Log in" : "Create account"}
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
  );
}

function Envelope() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="28" height="21" rx="4" stroke="#fff" strokeWidth="2.4" />
      <path d="M4 11l13 9 13-9" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="29" cy="27" r="7.5" fill="#C89B5B" />
      <path d="M25.5 27l2.4 2.4 4.4-4.6" stroke="#4A263E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Google() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" />
      <path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" fill="#FBBC05" />
      <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335" />
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
