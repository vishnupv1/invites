import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { adminSummary, logIn } from "../api";
import { Brand } from "../components/Brand";
import { Breadcrumbs } from "../components/Breadcrumbs";
import "./admin.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminLogin({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"creds" | "code">("creds");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function continueLogin(event: FormEvent) {
    event.preventDefault();
    if (!emailPattern.test(email.trim()) || !password) {
      setError("Enter your work email and password to continue.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await logIn(email.trim(), password);
      await adminSummary();
      onReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <svg className="rings left" viewBox="0 0 560 560" fill="none" aria-hidden="true">
        <circle cx="280" cy="280" r="270" stroke="#F23F78" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="190" stroke="#F23F78" strokeOpacity="0.18" strokeWidth="1.5" />
      </svg>
      <svg className="rings right" viewBox="0 0 560 560" fill="none" aria-hidden="true">
        <circle cx="280" cy="280" r="270" stroke="#F23F78" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="280" cy="280" r="190" stroke="#F23F78" strokeOpacity="0.18" strokeWidth="1.5" />
      </svg>
      <Link className="admin-mark" to="/">
        <Brand light linked={false} />
        <span className="admin-chip">Admin</span>
      </Link>
      <div className="admin-card">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Admin" }]} />
        {step === "creds" ? (
          <form onSubmit={continueLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="shield">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D81B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1>Admin console</h1>
              <p>Sign in with your team account to manage templates, users and events.</p>
            </div>
            {error ? <div className="admin-alert" role="alert">{error}</div> : null}
            <label>
              Work email
              <input id="ad-email" type="email" placeholder="admin@invitesready.com" value={email} onChange={(input) => setEmail(input.target.value)} />
            </label>
            <label>
              Password
              <input id="ad-pw" type="password" placeholder="Your password" value={password} onChange={(input) => setPassword(input.target.value)} />
            </label>
            <button className="admin-go" type="submit" disabled={busy}>
              {busy ? "Checking…" : "Continue"}
            </button>
            <button className="admin-sso" type="button" onClick={() => setError("Company SSO isn't set up.")}>
              Sign in with company SSO
            </button>
          </form>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (code.length === 6) onReady();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div className="shield" style={{ background: "#F6ECDD" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A6630" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="6" y="2" width="12" height="20" rx="3" />
                <path d="M11 18h2" />
              </svg>
            </div>
            <div>
              <h1>Two-step verification</h1>
              <p>
                Enter the 6-digit code from your authenticator app for <strong style={{ color: "#2A1527" }}>{email}</strong>.
              </p>
            </div>
            <label>
              Verification code
              <input
                className="code-input"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(input) => setCode(input.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <span style={{ fontWeight: 500, color: "#716A6D" }}>{code.length === 6 ? "Code looks good." : "Codes refresh every 30 seconds."}</span>
            </label>
            <button className="admin-go" type="submit" disabled={code.length !== 6}>
              Verify & open console
            </button>
            <button className="admin-back" type="button" onClick={() => { setStep("creds"); setCode(""); }}>
              Use a different account
            </button>
          </form>
        )}
      </div>
      <p className="admin-note">Restricted area. All sign-ins are logged and monitored.</p>
    </div>
  );
}
