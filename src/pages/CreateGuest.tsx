import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getHost, getToken, listEvents, listPurchases, listTemplates, logIn, publishSaved, saveDraft, signUp, updateInvite } from "../api";
import { PublicHeader } from "../components/PublicHeader";
import { GoogleButton } from "../components/GoogleButton";
import { signInWithGoogle } from "../lib/google";
import { Bird, Cake, Check, Gem, Heart, House, PartyPopper, Sparkles, Wine, type LucideIcon } from "lucide-react";
import { hold, SmartButton, Spinner } from "../components/Loader";
import { Notice, type NoticeTone } from "../components/Notice";
import { Checkout } from "../components/Checkout";
import { EVENTS } from "../data/events";
import { TEMPLATES, formatPrice, sampleFor, withCatalogMeta } from "../data/templates";
import { Editor } from "./Editor";
import { trackLogin, trackPublish, trackShareWhatsApp, trackSignUp, trackStartDesign } from "../lib/analytics";
import { guestInviteUrl, whatsAppShareHref } from "../lib/share";
import { formatLongDate, formatShortDate, formatTime } from "../lib/dates";
import { useLibrary } from "../state";
import { Breadcrumbs } from "../components/Breadcrumbs";
import type { EventId, InviteFields } from "../types";
import "./create-guest.css";

const DRAFT_KEY = "invitesready.guest-draft.v1";
const STEPS = ["Occasion", "Template", "Customise", "Publish"] as const;
const BLURB: Record<string, string> = {
  marriage: "The wedding day",
  engagement: "Ring ceremony and party",
  birthday: "Big or small",
  housewarming: "Griha pravesh",
  baptism: "Naming and christening",
  anniversary: "Milestones together",
  reception: "The evening after",
};
const OCCASION_ICONS: Record<string, LucideIcon> = {
  marriage: Gem,
  engagement: Heart,
  reception: Sparkles,
  birthday: Cake,
  anniversary: Wine,
  baptism: Bird,
  housewarming: House,
};

function OccasionIcon({ id }: { id: string }) {
  const Icon = OCCASION_ICONS[id] ?? Sparkles;
  return <Icon size={28} strokeWidth={1.8} aria-hidden="true" />;
}
type PriceFilter = "All" | "Free" | "Premium";
type AuthMode = "publish" | "save" | "login";

type Draft = {
  step: 1 | 2 | 3;
  event: EventId;
  templateId: string;
  price: PriceFilter;
  swatch: string;
  device: "phone" | "desk";
  name1: string;
  name2: string;
  date: string;
  time: string;
  venue: string;
  message: string;
  receptionOn: boolean;
};

function loadDraft(): Partial<Draft> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
  } catch {
    return {};
  }
}

function palettesFor(template: { meta?: { themes: { id: string }[]; defaultTheme: string } }) {
  return template.meta?.themes.map((item) => item.id) ?? [];
}


export function CreateGuest() {
  const [params, setParams] = useSearchParams();
  const requested = TEMPLATES.find((item) => item.id === params.get("template"));
  const requestedEvent = params.get("event");
  const startEvent = requested && requestedEvent && requested.events.includes(requestedEvent as EventId)
    ? requestedEvent as EventId
    : requested?.events[0];
  const saved = useMemo(loadDraft, []);
  const library = useLibrary();
  const [events, setEvents] = useState(EVENTS);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(requested ? 3 : saved.step === 1 || saved.step === 2 || saved.step === 3 ? saved.step : 1);
  const [eventId, setEventId] = useState<EventId>(startEvent ?? (saved.event && EVENTS.some((item) => item.id === saved.event) ? saved.event : "marriage"));
  const [templateId, setTemplateId] = useState(requested?.id || saved.templateId || "gazal");
  const [price, setPrice] = useState<PriceFilter>(saved.price || "All");
  const [swatch, setSwatch] = useState(requested ? requested.meta.defaultTheme || palettesFor(requested)[0] || "" : saved.swatch || "terracotta");
  const [device] = useState<"phone" | "desk">(saved.device || "phone");
  const [name1] = useState(saved.name1 || "");
  const [name2] = useState(saved.name2 || "");
  const [date] = useState(saved.date || "");
  const [time] = useState(saved.time || "");
  const [venue] = useState(saved.venue || "");
  const [message] = useState(saved.message || "");
  const [receptionOn] = useState(saved.receptionOn !== false);
  const [host, setHost] = useState<{ name: string; email: string } | null>(null);
  const [owned, setOwned] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("publish");
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authDone, setAuthDone] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [pubPhase, setPubPhase] = useState<"idle" | "loading" | "done">("idle");
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [liveCode, setLiveCode] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<NoticeTone>("ok");
  function notify(message: string, tone: NoticeTone = "ok") {
    setToastTone(tone);
    setToast(message);
  }
  const [editorSummary, setEditorSummary] = useState({ names: "", date: "", time: "", venue: "" });
  const inviteIdRef = useRef("");
  const creatingRef = useRef<Promise<string> | null>(null);
  const liveRef = useRef(false);

  const onEditorInvite = useCallback((id: string) => {
    inviteIdRef.current = id;
  }, []);
  const onEditorSummary = useCallback((summary: { names: string; date: string; time: string; venue: string }) => {
    setEditorSummary((current) =>
      current.names === summary.names && current.date === summary.date && current.time === summary.time && current.venue === summary.venue
        ? current
        : summary,
    );
  }, []);

  useEffect(() => {
    if (!params.get("template") && !params.get("event")) return;
    setParams((current) => {
      if (!current.get("template") && !current.get("event")) return current;
      const next = new URLSearchParams(current);
      next.delete("template");
      next.delete("event");
      return next;
    }, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    listEvents().then(setEvents).catch(() => undefined);
    listTemplates().then((rows) => setTemplates(rows.map(withCatalogMeta))).catch(() => undefined);
    if (!getToken()) return;
    getHost()
      .then((person) => setHost({ name: person.name, email: person.email }))
      .catch(() => undefined);
    listPurchases()
      .then(setOwned)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const draft: Draft = {
      step: step === 4 ? 3 : step,
      event: eventId,
      templateId,
      price,
      swatch,
      device,
      name1,
      name2,
      date,
      time,
      venue,
      message,
      receptionOn,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [step, eventId, templateId, price, swatch, device, name1, name2, date, time, venue, message, receptionOn]);

  const eventOrder: EventId[] = ["marriage", "engagement", "reception", "birthday", "anniversary", "baptism", "housewarming"];
  const eventRank = (id: EventId) => {
    const index = eventOrder.indexOf(id);
    return index === -1 ? eventOrder.length : index;
  };
  const orderedEvents = [...events].sort((a, b) => eventRank(a.id) - eventRank(b.id));
  const event = orderedEvents.find((item) => item.id === eventId) ?? orderedEvents[0];
  const matching = templates.filter((item) => item.events.includes(event.id));
  const visible = matching.filter((item) => price === "All" || (price === "Free" ? item.free : !item.free));
  const template = templates.find((item) => item.id === templateId && item.events.includes(event.id)) ?? matching[0] ?? templates[0];
  useEffect(() => {
    if (step < 3 || !template) return;
    trackStartDesign(template);
  }, [step, template]);
  const two = template?.meta.names === "couple";
  const sample = template ? sampleFor(template, event.id) : null;
  const typedNames = two ? [name1.trim(), name2.trim()].filter(Boolean).join(" & ") : name1.trim();
  const fields: InviteFields | null = sample
    ? {
        ...sample,
        event: event.id,
        names: typedNames || sample.names,
        hosts: typedNames ? "" : sample.hosts,
        date: date || sample.date,
        time: time || sample.time,
        venue: venue || sample.venue,
        message: message || sample.message,
        photos: [],
        audio: "",
        receptionVenue: receptionOn ? sample.receptionVenue : "",
        receptionTime: receptionOn ? sample.receptionTime : "",
        receptionAddress: receptionOn ? sample.receptionAddress : "",
      }
    : null;

  useEffect(() => {
    if (step >= 3 || liveRef.current || !getToken() || !template || !fields) return;
    if (!name1.trim() && !date && !venue.trim() && !message.trim()) return;
    const templateIdNow = template.id;
    const payload: InviteFields = { ...fields, names: typedNames, message, venue, time };
    const editor = { swatch, receptionOn };
    const timer = window.setTimeout(() => {
      const run = async () => {
        if (liveRef.current && inviteIdRef.current) {
          const saved = await updateInvite(inviteIdRef.current, templateIdNow, payload, editor);
          library.remember(saved);
          return;
        }
        if (liveRef.current) return;
        if (!inviteIdRef.current) {
          if (!creatingRef.current) {
            creatingRef.current = saveDraft(templateIdNow, payload, editor).then((saved) => {
              inviteIdRef.current = saved.id;
              library.remember(saved);
              return saved.id;
            });
          }
          await creatingRef.current;
          creatingRef.current = null;
        }
        if (!inviteIdRef.current || liveRef.current) return;
        const saved = await updateInvite(inviteIdRef.current, templateIdNow, payload, editor);
        library.remember(saved);
      };
      void run().catch(() => {
        creatingRef.current = null;
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [step, name1, name2, date, time, venue, message, receptionOn, swatch, templateId, eventId, host]);

  const previewNames = typedNames || "Your names";
  const previewWhen = date ? `${formatLongDate(date)}${time ? ` · ${formatTime(time)}` : ""}` : "Date and time";
  const shownNames = editorSummary.names.trim() || previewNames;
  const shownWhen = editorSummary.date
    ? `${formatLongDate(editorSummary.date)}${editorSummary.time ? ` · ${formatTime(editorSummary.time)}` : ""}`
    : previewWhen;
  const ownsTemplate = Boolean(template && (template.free || owned.includes(template.id) || library.owns(template.id, template.free)));
  const link = liveCode ? guestInviteUrl(liveCode, template?.id) : "";

  function pickEvent(id: EventId) {
    const next = templates.find((item) => item.events.includes(id));
    setEventId(id);
    if (next) {
      setTemplateId(next.id);
      setSwatch(next.meta.defaultTheme || palettesFor(next)[0] || "");
    }
    setStep(2);
  }

  function openAuth(mode: AuthMode) {
    if (host && mode === "publish") {
      setStep(4);
      return;
    }
    setAuthMode(mode);
    setAuthTab("login");
    setAuthDone(false);
    setAuthError("");
    setAuthOpen(true);
  }

  async function refreshHost() {
    const person = await getHost();
    setHost({ name: person.name, email: person.email });
    const purchases = await listPurchases().catch(() => [] as string[]);
    setOwned(purchases);
  }

  async function onGoogle() {
    setAuthError("");
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      inviteIdRef.current = "";
      await refreshHost();
      if (authTab === "signup") trackSignUp("google");
      else trackLogin("google");
      setAuthDone(true);
      setJustLoggedIn(true);
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : "Could not sign in with Google.");
    } finally {
      setGoogleBusy(false);
    }
  }

  async function submitAuth(kind: "login" | "signup") {
    setAuthError("");
    if (!authEmail.includes("@")) return setAuthError("Add a valid email.");
    if (kind === "signup" && authName.trim().length < 1) return setAuthError("Add your name.");
    if (kind === "signup" && authPassword.length < 8) return setAuthError("Use at least 8 characters.");
    if (kind === "login" && !authPassword) return setAuthError("Add your password.");
    setBusy(true);
    try {
      if (kind === "signup") {
        await signUp(authName.trim(), authEmail.trim(), authPassword);
        trackSignUp("email");
      } else {
        await logIn(authEmail.trim(), authPassword);
        trackLogin("email");
      }
      inviteIdRef.current = "";
      await refreshHost();
      setAuthPassword("");
      setAuthDone(true);
      setJustLoggedIn(true);
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  function finishAuth() {
    setAuthOpen(false);
    if (authMode === "publish") setStep(4);
    else notify(getToken() ? "Draft saved to your events. You can pick it up anytime." : "Draft kept on this device.");
  }

  async function draftOnThisAccount() {
    if (!template) return "";
    const localKey = `invitesready.editor-draft.v1.${template.id}`;
    const localRaw = localStorage.getItem(localKey);
    const local = localRaw
      ? (JSON.parse(localRaw) as { fields?: InviteFields; editor?: { swatch: string; receptionOn: boolean; sections: { id: string; on: boolean }[] } })
      : null;
    const source = local?.fields ?? fields;
    if (!source) return "";
    const payload: InviteFields = {
      ...source,
      names: editorSummary.names.trim() || source.names,
      date: editorSummary.date || source.date,
      time: editorSummary.time || source.time,
      venue: editorSummary.venue || source.venue,
    };
    const drafted = await saveDraft(template.id, payload, local?.editor ?? { swatch, receptionOn });
    inviteIdRef.current = drafted.id;
    library.remember(drafted);
    localStorage.removeItem(localKey);
    return drafted.id;
  }

  async function publishNow() {
    if (!template) return;
    const summaryNames = editorSummary.names.trim();
    const summaryDate = editorSummary.date;
    if (!summaryNames && (!name1.trim() || (two && !name2.trim()))) return notify("Add the names before you publish.", "warn");
    if (!summaryDate && !date) return notify("Add the date before you publish.", "warn");
    setBusy(true);
    setPubPhase("loading");
    try {
      if (creatingRef.current) inviteIdRef.current = await creatingRef.current;
      let savedInvite;
      if (inviteIdRef.current) {
        try {
          savedInvite = await publishSaved(inviteIdRef.current);
        } catch (reason) {
          if (!(reason instanceof Error) || reason.message !== "Invitation not found.") throw reason;
          inviteIdRef.current = "";
        }
      }
      if (!savedInvite) {
        const id = await draftOnThisAccount();
        if (!id) {
          notify("Add the names and a date before you publish.", "warn");
          return;
        }
        savedInvite = await publishSaved(id);
      }
      liveRef.current = true;
      library.remember(savedInvite);
      setPubPhase("done");
      await hold();
      setLiveCode(savedInvite.code);
      setShowQr(false);
      trackPublish(template);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Could not publish.", "bad");
    } finally {
      setBusy(false);
      setPubPhase("idle");
    }
  }

  async function publish() {
    if (!template) return;
    if (!ownsTemplate) {
      setCheckout(true);
      return;
    }
    await publishNow();
  }

  function onAuth(event: FormEvent) {
    event.preventDefault();
    void submitAuth(authTab);
  }

  const initials = (host?.name || "Y")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="cg-root">
      <PublicHeader />
      <header className="cg-header">
        <ol className="cg-steps" aria-label="Steps">
          {STEPS.map((label, index) => {
            const n = (index + 1) as 1 | 2 | 3 | 4;
            const locked = n === 4 ? !host : n > step;
            const current = step === n;
            const done = step > n;
            return (
              <li key={label}>
                <button
                  type="button"
                  className={current ? "cg-step on" : "cg-step"}
                  disabled={locked}
                  aria-current={current ? "step" : undefined}
                  onClick={() => setStep(n)}
                >
                  <span className={current ? "cg-dot on" : done ? "cg-dot done" : "cg-dot"}>{done ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : n}</span>
                  <span className="cg-step-label">{label}</span>
                </button>
                {index < 3 ? <i className="cg-rule" aria-hidden="true" /> : null}
              </li>
            );
          })}
        </ol>
        <div className="cg-account">
          {host ? (
            <>
              <span className="cg-kept">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4E6853" strokeWidth="3" aria-hidden="true">
                  <path d="M5 12l4 4L19 7" />
                </svg>
                Signed in
              </span>
              <div className="cg-avatar">{initials}</div>
            </>
          ) : (
            <>
              <span className="cg-save">
                <i />
                Draft saved on this device
              </span>
              <button type="button" className="cg-text" onClick={() => openAuth("login")}>
                Log in
              </button>
            </>
          )}
        </div>
      </header>
      <Breadcrumbs className="cg-trail" items={[{ label: "Home", to: "/" }, { label: "Create invite" }]} />

      {!host && step < 4 ? (
        <div className="cg-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A5A26" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
          </svg>
          <span>
            You're creating as a <strong>guest</strong> — no account needed to design. Your draft is kept on this device until you publish.
          </span>
        </div>
      ) : null}

      <main className="cg-main">
        {step === 1 ? (
          <div className="cg-panel cg-step1">
            <div className="cg-intro">
              <span className="cg-kicker">Step 1 of 4 · Free to design</span>
              <h1>
                What are you <em>celebrating?</em>
              </h1>
              <p>We'll suggest templates that fit your event.</p>
            </div>
            <div className="cg-grid">
              {orderedEvents.map((item) => {
                const count = templates.filter((template) => template.events.includes(item.id)).length;
                const on = item.id === event.id;
                return (
                  <button key={item.id} type="button" className={on ? "cg-event on" : "cg-event"} aria-pressed={on} onClick={() => pickEvent(item.id)}>
                    <span className="cg-emoji">
                      <OccasionIcon id={item.id} />
                    </span>
                    <strong>{item.label}</strong>
                    <small>{BLURB[item.id] ?? item.cardLabel}</small>
                    <em>{count === 1 ? "1 template" : `${count} templates`}</em>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="cg-panel cg-step2">
            <div className="cg-step2-head">
              <div>
                <button type="button" className="cg-back" onClick={() => setStep(1)}>
                  ← {event.label} · change
                </button>
                <h1>Pick a template you love</h1>
                <p className="cg-muted">Every template is free to customise. Premium ones are paid only when you publish.</p>
              </div>
              <div className="cg-pills" role="group" aria-label="Price">
                {(["All", "Free", "Premium"] as const).map((label) => (
                  <button key={label} type="button" className={price === label ? "cg-pill on" : "cg-pill"} aria-pressed={price === label} onClick={() => setPrice(label)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {visible.length ? (
              <div className="cg-cards">
                {visible.map((item) => {
                  const selected = item.id === template?.id;
                  return (
                    <div key={item.id} className="cg-card-wrap">
                      <button
                        type="button"
                        className={selected ? "cg-card on" : "cg-card"}
                        aria-label={`Select ${item.name}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setTemplateId(item.id);
                          setSwatch(item.meta.defaultTheme || palettesFor(item)[0] || "");
                        }}
                      >
                        <img src={`/covers/${item.id}.jpg`} alt="" />
                        <span className={item.free ? "cg-badge" : "cg-badge premium"}>{item.free ? "Free" : "Premium"}</span>
                        {selected ? (
                          <span className="cg-tick">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" aria-hidden="true">
                              <path d="M5 12l4 4L19 7" />
                            </svg>
                          </span>
                        ) : null}
                      </button>
                      <div className="cg-card-foot">
                        <div>
                          <strong>{item.name}</strong>
                          <span>{formatPrice(item)}</span>
                        </div>
                        <button
                          type="button"
                          className="cg-use"
                          onClick={() => {
                            setTemplateId(item.id);
                            setSwatch(item.meta.defaultTheme || palettesFor(item)[0] || "");
                            setStep(3);
                          }}
                        >
                          Customise
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cg-empty">No templates in this filter yet — try "All".</div>
            )}
          </div>
        ) : null}

        {step === 3 && template ? (
          <div className="cg-step3 cg-step3-editor">
            <Editor
              key={`${template.id}:${eventId}`}
              embedded
              templateId={template.id}
              eventId={eventId}
              onInvite={onEditorInvite}
              onSummary={onEditorSummary}
            />
          </div>
        ) : null}

        {step === 4 && template && fields ? (
          <div className="cg-panel cg-step4">
            <div className="cg-proof">
              <div className="cg-proof-card">
                <img src={`/covers/${template.id}.jpg`} alt="" />
                <div>
                  <strong>{shownNames}</strong>
                  <span>{shownWhen}</span>
                </div>
              </div>
              <button type="button" className="cg-back" onClick={() => setStep(3)}>
                ← Keep editing
              </button>
            </div>
            <div className="cg-publish-copy">
              {justLoggedIn && !liveCode ? (
                <div className="cg-welcome" role="status">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4E6853" strokeWidth="2.6" aria-hidden="true">
                    <path d="M5 12l4 4L19 7" />
                  </svg>
                  <span>
                    Welcome, <strong>{host?.name || "there"}</strong>. Your draft is still on this device — publish it to keep the invitation in your account.
                  </span>
                </div>
              ) : null}
              {!liveCode ? (
                <div className="cg-live">
                  <h1>Ready to share?</h1>
                  <label className="cg-field">
                    Your invitation link
                    <div className="cg-linkbox">
                      <span>invitesready.com/i/</span>created when you publish
                    </div>
                  </label>
                  <p className="cg-muted">Publish when the preview looks right. The link stays the same if you edit later.</p>
                  <div className={template.free ? "cg-plan" : "cg-plan premium"}>
                    <header>
                      <strong>
                        {template.name} · {template.free || ownsTemplate ? (template.free ? "Free" : "Owned") : "Premium"}
                      </strong>
                      <b>{ownsTemplate && !template.free ? "Owned" : formatPrice(template)}</b>
                    </header>
                    <p>
                      {template.free
                        ? "Free for this event, with a small Made with InvitesReady credit on the page."
                        : ownsTemplate
                          ? "This design is already yours. Publishing does not charge you again."
                          : `One-time ${formatPrice(template)} for this design. You pay once at checkout, then you can publish.`}
                    </p>
                  </div>
                  <SmartButton
                    className="cg-publish"
                    phase={pubPhase}
                    idle={ownsTemplate ? "Publish" : `Get ${template.name}`}
                    onClick={() => void publish()}
                  />
                </div>
              ) : (
                <div className="cg-live">
                  <span className="pop" aria-hidden="true">
                    <PartyPopper size={44} />
                  </span>
                  <h1>Your invitation is live!</h1>
                  <div className="cg-linkbox">{link.replace(/^https?:\/\//, "")}</div>
                  <div className="cg-shares">
                    <button type="button" onClick={() => {
                      if (!link) return;
                      trackShareWhatsApp(template?.name);
                      window.open(whatsAppShareHref(link), "_blank", "noopener");
                    }}>
                      <img src="/whatsapp.png" alt="" width={22} height={22} />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(link).then(
                          () => notify("Link copied."),
                          () => notify(link, "warn"),
                        );
                      }}
                    >
                      Copy link
                    </button>
                    <button type="button" onClick={() => setShowQr((open) => !open)}>
                      QR code
                    </button>
                  </div>
                  {showQr ? <img className="cg-qr" alt="QR code for the invitation" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`} /> : null}
                  <Link className="cg-dash" to="/studio">
                    Go to my dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {step === 2 || step === 3 ? (
        <div className="cg-bar">
          <div className="cg-bar-id">
            {template ? <img src={`/covers/${template.id}.jpg`} alt="" /> : <i />}
            <div>
              <strong>{step === 2 ? `${template?.name ?? "Template"} selected` : shownNames}</strong>
              <span>
                {step === 2
                  ? `${event.label} · ${template?.free ? "Free to publish" : `${template ? formatPrice(template) : ""} when you publish`}`
                  : host
                    ? "Draft on this device until you publish"
                    : "Guest draft · saved on this device"}
              </span>
            </div>
          </div>
          <div className="cg-bar-actions">
            {step === 3 ? (
              <button type="button" className="cg-ghost" onClick={() => (host ? notify("Draft kept on this device. Publish it to save the invitation to your account.", "warn") : openAuth("save"))}>
                Save draft
              </button>
            ) : null}
            <button
              type="button"
              className="cg-bar-btn"
              disabled={step === 2 && !visible.length}
              onClick={() => (step === 2 ? setStep(3) : host ? setStep(4) : openAuth("publish"))}
            >
              {step === 2 ? "Customise this template →" : host ? "Continue to publish →" : "Publish & share →"}
            </button>
          </div>
        </div>
      ) : null}

      {authOpen ? (
        <div className="cg-shade">
          <div className="cg-dialog" role="dialog" aria-label={authMode === "publish" ? "Log in to publish" : authMode === "save" ? "Save your draft" : "Log in"}>
            <div className="cg-side">
              <em>Your draft is safe</em>
              {template ? (
                <div className="cg-auth-card">
                  <img src={`/covers/${template.id}.jpg`} alt="" />
                  <div>
                    <strong>{previewNames}</strong>
                    <span>{previewWhen}</span>
                  </div>
                </div>
              ) : null}
              <p>{template ? template.name : "Your invitation"}</p>
              <small>{authDone ? "You can publish it from this page." : "Sign in to save your invitation. The draft stays on this device until you publish."}</small>
            </div>
            <form className="cg-auth" onSubmit={onAuth}>
              <button type="button" className="cg-close" aria-label="Close" onClick={() => setAuthOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              {googleBusy ? (
                <div className="cg-wait" role="status" aria-live="polite">
                  <Spinner size="md" />
                  <h2>Signing you in</h2>
                  <p>Finishing with Google. This takes a moment.</p>
                </div>
              ) : authDone ? (
                <>
                  <span className="cg-done-mark">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4E6853" strokeWidth="2.6" aria-hidden="true">
                      <path d="M5 12l4 4L19 7" />
                    </svg>
                  </span>
                  <h2>You're in!</h2>
                  <p className="cg-muted">Your draft is still on this device, exactly as you left it.</p>
                  <button type="button" className="cg-next" onClick={finishAuth}>
                    {authMode === "publish" ? "Continue to publish →" : "Keep editing"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <h2>
                      {authTab === "signup"
                        ? authMode === "publish"
                          ? "Create an account to publish"
                          : authMode === "save"
                            ? "Create an account to save"
                            : "Create an account"
                        : authMode === "publish"
                          ? "Log in to publish"
                          : authMode === "save"
                            ? "Log in to save your draft"
                            : "Log in to InvitesReady"}
                    </h2>
                    <p>Use Google or email. Your design stays as it is.</p>
                  </div>
                  <GoogleButton className="cg-google" disabled={busy} onClick={() => void onGoogle()} />
                  <div className="cg-tabs" role="tablist" aria-label="Account">
                    <button type="button" role="tab" aria-selected={authTab === "login"} className={authTab === "login" ? "on" : ""} onClick={() => { setAuthTab("login"); setAuthError(""); }}>
                      Log in
                    </button>
                    <button type="button" role="tab" aria-selected={authTab === "signup"} className={authTab === "signup" ? "on" : ""} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>
                      Create account
                    </button>
                  </div>
                  {authTab === "signup" ? (
                    <label className="cg-field">
                      Name
                      <input value={authName} onChange={(input) => setAuthName(input.target.value)} autoComplete="name" />
                    </label>
                  ) : null}
                  <label className="cg-field">
                    Email
                    <input type="email" value={authEmail} onChange={(input) => setAuthEmail(input.target.value)} autoComplete="email" />
                  </label>
                  <label className="cg-field">
                    Password
                    <input type="password" value={authPassword} onChange={(input) => setAuthPassword(input.target.value)} autoComplete={authTab === "signup" ? "new-password" : "current-password"} />
                  </label>
                  {authError ? <p className="cg-error">{authError}</p> : null}
                  <div className="cg-auth-actions">
                    <button type="submit" className="fill" disabled={busy} aria-busy={busy || undefined}>
                      {busy ? <Spinner tone="paper" /> : authTab === "signup" ? "Create account" : "Log in"}
                      {busy ? <span className="spin-sr">{authTab === "signup" ? "Creating account" : "Logging in"}</span> : null}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      ) : null}

      {checkout && template ? (
        <Checkout
          template={template}
          detail={[shownNames, event.label, editorSummary.date || date ? formatShortDate(editorSummary.date || date) : ""].filter(Boolean).join(" · ")}
          onClose={() => setCheckout(false)}
          onPurchased={async (coupon, payment) => {
            await library.purchase(template.id, coupon, payment);
            setOwned((current) => (current.includes(template.id) ? current : [...current, template.id]));
            await refreshHost();
            setCheckout(false);
            await publishNow();
          }}
        />
      ) : null}

      {toast ? <Notice message={toast} tone={toastTone} onClose={() => setToast("")} /> : null}
    </div>
  );
}
