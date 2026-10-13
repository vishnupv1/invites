import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { logIn, signUp } from "../api";
import { InviteView } from "../components/InviteView";
import { GoogleButton } from "../components/GoogleButton";
import { Spinner } from "../components/Loader";
import { IrApp } from "../components/shell/IrApp";
import { PhoneFrame } from "../components/shell/PhoneFrame";
import { TemplatePreview } from "../components/shell/TemplatePreview";
import { ArrowIcon, BackIcon, CheckIcon } from "../components/shell/marks";
import { getTemplate, sampleFor } from "../data/templates";
import { trackEvent } from "../lib/analytics";
import { prepareGoogleSignIn, signInWithGoogle } from "../lib/google";
import type { InviteFields, Template } from "../types";
import "./auth.css";

type Mode = "login" | "signup";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DRAFT_PREFIX = "invitesready.editor-draft.v1.";
const PUBLISH_KEY = "invitesready.publish-after-login";
const MORE = ["hansa", "moonlit", "palace", "villa", "grandoor", "shaadi"];

type SavedDraft = {
  names: string;
  templateId: string;
  fields: InviteFields | null;
};

function safeReturn(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}

function publishDestination(next: string | null) {
  if (!next || !next.startsWith("/create/") || next.startsWith("//")) return "";
  const id = next.split("?")[0]?.split("/")[2] || "";
  if (!id) return "";
  try {
    return sessionStorage.getItem(PUBLISH_KEY) === id ? next : "";
  } catch {
    return "";
  }
}

function readSavedDraft(): SavedDraft | null {
  try {
    let best: (SavedDraft & { at: number }) | null = null;
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(DRAFT_PREFIX)) continue;
      const parsed = JSON.parse(localStorage.getItem(key) || "") as { fields?: InviteFields; at?: number };
      const at = typeof parsed.at === "number" ? parsed.at : 0;
      if (best && at < best.at) continue;
      best = {
        at,
        names: parsed.fields?.names?.trim() || "",
        templateId: key.slice(DRAFT_PREFIX.length),
        fields: parsed.fields ?? null,
      };
    }
    return best;
  } catch {
    return null;
  }
}

function SignInPhone({ template, fields }: { template: Template; fields: InviteFields }) {
  const frame = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    let play = 0;
    let tries = 0;
    const attempt = () => {
      const opener = [...root.querySelectorAll("button")].find((button) => {
        const label = button.getAttribute("aria-label") ?? "";
        return /^(break the seal|open invitation|open the invitation|tear open|untie the ribbon|light the lantern|pull the rope|open the doors|enter the invitation|lift the veil|open the door|open your gift)/i.test(label);
      });
      if (!opener) {
        if (tries < 30) {
          tries += 1;
          play = window.setTimeout(attempt, 40);
        }
        return;
      }
      opener.click();
      setOpened(true);
    };
    play = window.setTimeout(attempt, 40);
    return () => window.clearTimeout(play);
  }, [template.id]);

  return (
    <div ref={frame} className="si-phone si-phone-main">
      <PhoneFrame label={`${template.name} preview`}>
        <div aria-hidden="true">
          <TemplatePreview label={`${template.name} preview`} radius={34} interactive={!opened}>
            <InviteView template={template} fields={fields} live />
          </TemplatePreview>
        </div>
      </PhoneFrame>
    </div>
  );
}

export function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 900px)").matches);
  const [draft] = useState(readSavedDraft);

  const login = mode === "login";
  const previewTemplate = getTemplate(draft?.templateId) ?? getTemplate("bloom");
  const previewFields = previewTemplate
    ? draft?.fields ?? sampleFor(previewTemplate, previewTemplate.events[0])
    : null;
  const names = draft?.names || previewFields?.names || previewTemplate?.name || "Your invitation";
  const saved = Boolean(draft?.names);
  const extras = MORE.map((id) => getTemplate(id)).filter((item): item is Template => Boolean(item && item.id !== previewTemplate?.id)).slice(0, 3);
  const next = params.get("next");
  const publishTo = publishDestination(next);
  const publishing = Boolean(publishTo);
  const backTo = publishTo || safeReturn(next) || "/";

  useEffect(() => {
    if (publishing) return;
    try {
      sessionStorage.removeItem(PUBLISH_KEY);
    } catch {
      /* A plain sign-in does not resume a publish. */
    }
  }, [publishing]);

  useEffect(() => {
    document.title = login ? "Log in | InvitesReady" : "Sign up | InvitesReady";
  }, [login]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setDone(false);
  }

  function continueOn() {
    const next = params.get("next");
    window.location.assign(publishDestination(next) || safeReturn(next) || "/studio");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!login && !name.trim()) next.name = "Please enter your name.";
    if (!emailPattern.test(email.trim())) next.email = "Enter a valid email address.";
    if (!login && password.length < 8) next.password = "Password must be at least 8 characters.";
    if (login && !password) next.password = "Please enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      if (login) {
        await logIn(email.trim(), password);
        trackEvent("login", { method: "email" });
        continueOn();
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

  async function onGoogle() {
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
    <IrApp>
      <div className={publishing ? "si" : "si is-account"}>
        <header className="si-bar">
          <Link
            className="si-back"
            to={backTo}
            aria-label="Back"
            onClick={() => {
              try {
                sessionStorage.removeItem(PUBLISH_KEY);
              } catch {
                /* Leaving sign-in still returns to the previous page. */
              }
            }}
          >
            <BackIcon />
          </Link>
          <span>{publishing ? "Sign in to publish" : login ? "Log in" : "Create account"}</span>
        </header>

        {publishing ? <aside className="si-stage" aria-hidden="true">
          <div className="si-glow" />
          <div className="si-cast">
            {extras.map((item, index) => (
              <div key={item.id} className={`si-phone si-phone-side is-${index}`}>
                <PhoneFrame label={item.name}>
                  <img src={`/covers/${item.id}.jpg`} alt="" />
                </PhoneFrame>
              </div>
            ))}
            {wide && previewTemplate && previewFields ? <SignInPhone template={previewTemplate} fields={previewFields} /> : null}
          </div>
          <div className="si-chip">
            <img src={`/covers/${previewTemplate?.id ?? "bloom"}.jpg`} alt="" />
            <div>
              <b>{previewTemplate ? `${names} · ${previewTemplate.name}` : names}</b>
              {saved ? <small><CheckIcon /> Saved — nothing will be lost</small> : null}
            </div>
          </div>
        </aside> : null}

        <main className="si-main">
          {publishing ? <div className="si-ticket">
            <img src={`/covers/${previewTemplate?.id ?? "bloom"}.jpg`} alt="" />
            <div>
              <b>{names}</b>
              {saved ? <small><CheckIcon /> Your invitation is saved</small> : null}
            </div>
          </div> : null}

          {googleBusy ? (
            <div className="si-wait" role="status" aria-live="polite">
              <Spinner size="md" />
              <h1>Signing you in</h1>
              <p>Finishing with Google. This takes a moment.</p>
            </div>
          ) : done ? (
            <div className="si-done">
              <h1>Account created</h1>
              <p>Your account is ready. You can pick up where you left off.</p>
              <button type="button" className="si-go" onClick={continueOn}>
                <span>{publishTo || safeReturn(params.get("next")) ? "Continue" : "Go to dashboard"}</span>
                <b aria-hidden="true"><ArrowIcon /></b>
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <h1>{publishing ? <>One step<br />to <i>publish.</i></> : login ? "Log in" : "Create your account"}</h1>
              <p>{publishing ? "Sign in so RSVPs reach you and your invitation stays safe. Takes 20 seconds." : "Sign in to open your dashboard."}</p>
              <button type="button" className="si-swap" onClick={() => switchMode(login ? "signup" : "login")}>
                {login ? "New here? Create account" : "Already have an account? Log in"}
              </button>
              {!login ? (
                <label className="si-line">
                  <span>Name</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" aria-invalid={errors.name ? true : undefined} />
                  {errors.name ? <small>{errors.name}</small> : null}
                </label>
              ) : null}
              <label className="si-line">
                <span>Email</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" aria-invalid={errors.email ? true : undefined} />
                {errors.email ? <small>{errors.email}</small> : null}
              </label>
              <label className="si-line">
                <span>Password</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={login ? "current-password" : "new-password"} aria-invalid={errors.password ? true : undefined} />
                {errors.password ? <small>{errors.password}</small> : <em>{login ? "" : "At least 8 characters."}</em>}
              </label>
              {errors.form ? <p className="si-alert" role="alert">{errors.form}</p> : null}
              <button className="si-go" type="submit" disabled={busy} aria-busy={busy || undefined}>
                <span>{busy ? <Spinner tone="paper" /> : null}{busy ? "Please wait…" : login ? "Log in" : "Create account"}</span>
                <b aria-hidden="true"><ArrowIcon /></b>
              </button>
              <div className="si-or">OR</div>
              <GoogleButton className="si-google" disabled={!googleReady || busy || googleBusy} onClick={() => void onGoogle()} />
              <p className="si-legal">By continuing you agree to the <Link to="/terms">Terms</Link> & <Link to="/privacy">Privacy Policy</Link></p>
            </form>
          )}
        </main>
      </div>
    </IrApp>
  );
}
