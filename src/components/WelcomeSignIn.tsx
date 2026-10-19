import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { getHost, logIn, signUp } from "../api";
import { trackLogin, trackSignUp } from "../lib/analytics";
import { prepareGoogleSignIn, signInWithGoogle } from "../lib/google";
import { useSession } from "../session";
import { GoogleButton } from "./GoogleButton";
import { Spinner } from "./Loader";
import { ArrowIcon } from "./shell/marks";
import "../pages/auth.css";
import "./welcome-signin.css";

const SEEN_KEY = "invitesready.welcome-auth";

function seenWelcome() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markWelcomeSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* A browser that blocks storage still lets the visitor close the dialog. */
  }
}

function skipWelcome(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/i/") ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/design-check")
  );
}

export function WelcomeSignIn() {
  const { ready, signedIn } = useSession();
  const { pathname } = useLocation();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const login = mode === "login";

  useEffect(() => {
    if (!ready || signedIn || skipWelcome(pathname) || seenWelcome()) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [ready, signedIn, pathname]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    prepareGoogleSignIn()
      .then(() => {
        if (live) setGoogleReady(true);
      })
      .catch(() => {
        if (live) setGoogleReady(true);
      });
    return () => {
      live = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    markWelcomeSeen();
    setOpen(false);
  }

  async function finish() {
    const person = await getHost().catch(() => null);
    markWelcomeSeen();
    if (person?.admin) {
      window.location.assign("/admin");
      return;
    }
    setOpen(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Add a valid email.");
    if (!login && !name.trim()) return setError("Add your name.");
    if (!login && password.length < 8) return setError("Use at least 8 characters.");
    if (login && !password) return setError("Add your password.");
    setBusy(true);
    try {
      if (login) {
        await logIn(email.trim(), password);
        trackLogin("email");
      } else {
        await signUp(name.trim(), email.trim(), password);
        trackSignUp("email");
      }
      await finish();
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
      await finish();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in with Google.");
      setGoogleBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="wa">
      <button type="button" className="wa-shade" aria-label="Close sign in" onClick={close} />
      <div className="wa-card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="wa-close" aria-label="Close" onClick={close}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3l10 10M13 3 3 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        {googleBusy ? (
          <div className="si-main si-wait" role="status">
            <Spinner size="md" />
            <h1 id={titleId}>Signing you in</h1>
            <p>Finishing with Google. This takes a moment.</p>
          </div>
        ) : (
          <form className="si-main" onSubmit={onSubmit}>
            <h1 id={titleId}>{login ? <>Sign in to <i>save</i> your place.</> : <>Create your <i>account.</i></>}</h1>
            <p>{login ? "Keep drafts, collect RSVPs, and open your invitations on any phone." : "It takes a moment. Your invitations stay with this account."}</p>
            <button type="button" className="si-swap" onClick={() => { setMode(login ? "signup" : "login"); setError(""); }}>
              {login ? "New here? Create account" : "Already have an account? Log in"}
            </button>
            {login ? null : (
              <label className="si-line">
                <span>Name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
              </label>
            )}
            <label className="si-line">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            </label>
            <label className="si-line">
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={login ? "current-password" : "new-password"} />
              {login ? null : <em>At least 8 characters.</em>}
            </label>
            {error ? <p className="si-alert" role="alert">{error}</p> : null}
            <button className="si-go" type="submit" disabled={busy} aria-busy={busy || undefined}>
              <span>{busy ? <Spinner tone="paper" /> : null}{busy ? "Please wait…" : login ? "Log in" : "Create account"}</span>
              <b aria-hidden="true"><ArrowIcon /></b>
            </button>
            <div className="si-or">OR</div>
            <GoogleButton className="si-google" disabled={!googleReady || busy || googleBusy} onClick={() => void onGoogle()} />
            <p className="si-legal">By continuing you agree to the <Link to="/terms">Terms</Link> & <Link to="/privacy">Privacy Policy</Link></p>
            <button type="button" className="wa-later" onClick={close}>Not now</button>
          </form>
        )}
      </div>
    </div>
  );
}
