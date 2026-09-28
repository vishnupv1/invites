import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createInvite, getHost, getToken, listEvents, listPurchases, listTemplates, logIn, signUp } from "../api";
import { AnnaInvite } from "../components/AnnaInvite";
import { BaptismInvite } from "../components/BaptismInvite";
import { BeachInvite, type BeachTheme } from "../components/BeachInvite";
import { Checkout } from "../components/Checkout";
import { HomeInvite, type HomeTheme } from "../components/HomeInvite";
import { InviteSite } from "../components/InviteSite";
import { VivahInvite, type VivahTheme } from "../components/VivahInvite";
import { ThiruvizhaInvite, type ThiruvizhaLang, type ThiruvizhaTheme } from "../components/ThiruvizhaInvite";
import { EVENTS } from "../data/events";
import { TEMPLATES, formatPrice, sampleFor, usesField, withCatalogMeta } from "../data/templates";
import { formatLongDate, formatTime } from "../lib/dates";
import { useLibrary } from "../state";
import { Breadcrumbs } from "../components/Breadcrumbs";
import type { EventId, InviteFields, Template } from "../types";
import "./create-guest.css";

const DRAFT_KEY = "vellum.guest-draft.v1";
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
const EMOJI: Record<string, string> = {
  marriage: "💍",
  engagement: "💞",
  birthday: "🎂",
  housewarming: "🏡",
  baptism: "🕊️",
  anniversary: "🥂",
  reception: "✨",
};
const SWATCHES = [
  { id: "terracotta", name: "Terracotta", cover: "#F6F0E6", dot: "#A44B32" },
  { id: "plum", name: "Plum & gold", cover: "#4A263E", dot: "#D9B26A" },
  { id: "emerald", name: "Emerald & gold", cover: "#12352B", dot: "#D9B26A" },
  { id: "sky", name: "Sky blue", cover: "#DCEBF7", dot: "#2F5E8A" },
  { id: "rose", name: "Rose blush", cover: "#F6DCE2", dot: "#9B4A5E" },
  { id: "midnight", name: "Midnight", cover: "#1B2433", dot: "#D9B26A" },
];

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

function annaTheme(swatch: string) {
  if (swatch === "emerald") return "sage" as const;
  if (swatch === "midnight") return "dusk" as const;
  return "terracotta" as const;
}

function homeTheme(swatch: string): HomeTheme {
  if (swatch === "rose") return "sunset";
  if (swatch === "midnight") return "night";
  return "day";
}

function beachTheme(swatch: string): BeachTheme {
  if (swatch === "sky") return "tropical";
  if (swatch === "plum") return "dusk";
  return "sunset";
}

function vivahTheme(swatch: string): VivahTheme {
  if (swatch === "emerald") return "emerald";
  if (swatch === "plum") return "royal";
  return "midnight";
}

function thiruTheme(swatch: string): ThiruvizhaTheme {
  if (swatch === "ivory") return "ivory";
  if (swatch === "emerald") return "emerald";
  return "rani";
}

function baptismTheme(swatch: string) {
  if (swatch === "rose") return "blush" as const;
  if (swatch === "emerald") return "sage" as const;
  return "sky" as const;
}

function GuestPreview({ template, fields, swatch, lang }: { template: Template; fields: InviteFields; swatch: string; lang?: ThiruvizhaLang }) {
  if (template.style === "thiruvizha") return <ThiruvizhaInvite fields={fields} theme={thiruTheme(swatch)} lang={lang ?? "both"} />;
  if (template.style === "anna") return <AnnaInvite fields={fields} theme={annaTheme(swatch)} />;
  if (template.style === "baptism") return <BaptismInvite fields={fields} theme={baptismTheme(swatch)} />;
  if (template.style === "vivah") return <VivahInvite fields={fields} theme={vivahTheme(swatch)} guest="friend" />;
  if (template.style === "beach") return <BeachInvite fields={fields} theme={beachTheme(swatch)} />;
  if (template.style === "home") return <HomeInvite fields={fields} theme={homeTheme(swatch)} />;
  return <InviteSite template={template} fields={fields} />;
}

function Mark() {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="19" r="14" stroke="#6B3A5B" strokeWidth="2.6" />
      <circle cx="18" cy="19" r="8" stroke="#C89B5B" strokeWidth="2.4" />
      <circle cx="18" cy="4" r="2.6" fill="#6B3A5B" />
    </svg>
  );
}

export function CreateGuest() {
  const saved = useMemo(loadDraft, []);
  const library = useLibrary();
  const [events, setEvents] = useState(EVENTS);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(saved.step === 1 || saved.step === 2 || saved.step === 3 ? saved.step : 1);
  const [eventId, setEventId] = useState<EventId>(saved.event && EVENTS.some((item) => item.id === saved.event) ? saved.event : "marriage");
  const [templateId, setTemplateId] = useState(saved.templateId || "gazal");
  const [price, setPrice] = useState<PriceFilter>(saved.price || "All");
  const [swatch, setSwatch] = useState(saved.swatch || "terracotta");
  const [device, setDevice] = useState<"phone" | "desk">(saved.device || "phone");
  const [name1, setName1] = useState(saved.name1 || "");
  const [name2, setName2] = useState(saved.name2 || "");
  const [date, setDate] = useState(saved.date || "");
  const [time, setTime] = useState(saved.time || "");
  const [venue, setVenue] = useState(saved.venue || "");
  const [message, setMessage] = useState(saved.message || "");
  const [receptionOn, setReceptionOn] = useState(saved.receptionOn !== false);
  const [host, setHost] = useState<{ name: string; email: string } | null>(null);
  const [owned, setOwned] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("publish");
  const [authDone, setAuthDone] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [liveCode, setLiveCode] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [toast, setToast] = useState("");
  const [inviteLang, setInviteLang] = useState<ThiruvizhaLang>("both");

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
  const previewNames = typedNames || "Your names";
  const previewWhen = date ? `${formatLongDate(date)}${time ? ` · ${formatTime(time)}` : ""}` : "Date and time";
  const palettes = template ? palettesFor(template) : [];
  const ownsTemplate = Boolean(template && (template.free || owned.includes(template.id) || library.owns(template.id, template.free)));
  const link = liveCode ? `${window.location.origin}/i/${liveCode}` : "";

  function touch() {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 800);
  }

  function pickEvent(id: EventId) {
    const next = templates.find((item) => item.events.includes(id));
    setEventId(id);
    if (next) {
      setTemplateId(next.id);
      setSwatch(next.meta.defaultTheme || palettesFor(next)[0] || "");
    }
  }

  function openAuth(mode: AuthMode) {
    if (host && mode === "publish") {
      setStep(4);
      return;
    }
    setAuthMode(mode);
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

  async function submitAuth(kind: "login" | "signup") {
    setAuthError("");
    if (!authEmail.includes("@")) return setAuthError("Add a valid email.");
    if (kind === "signup" && authName.trim().length < 1) return setAuthError("Add your name.");
    if (kind === "signup" && authPassword.length < 8) return setAuthError("Use at least 8 characters.");
    if (kind === "login" && !authPassword) return setAuthError("Add your password.");
    setBusy(true);
    try {
      if (kind === "signup") await signUp(authName.trim(), authEmail.trim(), authPassword);
      else await logIn(authEmail.trim(), authPassword);
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
    else setToast("Draft kept on this device. Publish it to save the invitation to your account.");
  }

  async function publishNow() {
    if (!template || !fields) return;
    if (!name1.trim() || (two && !name2.trim())) return setToast("Add the names before you publish.");
    if (!date) return setToast("Add the date before you publish.");
    setBusy(true);
    try {
      const savedInvite = await createInvite(template.id, {
        ...fields,
        names: typedNames,
        message,
        venue,
        time,
      });
      library.remember(savedInvite);
      setLiveCode(savedInvite.code);
      setShowQr(false);
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : "Could not publish.");
    } finally {
      setBusy(false);
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
  }

  const initials = (host?.name || "Y")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="cg-root">
      <header className="cg-header">
        <Link className="cg-brand" to="/">
          <Mark />
          invitesready.com
        </Link>
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
                  <span className={current ? "cg-dot on" : done ? "cg-dot done" : "cg-dot"}>{done ? "✓" : n}</span>
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
              <span className={saving ? "cg-save busy" : "cg-save"}>
                <i />
                {saving ? "Saving draft…" : "Draft saved on this device"}
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
                    <span className="cg-emoji" aria-hidden="true">
                      {EMOJI[item.id] ?? "🎉"}
                    </span>
                    <strong>{item.label}</strong>
                    <small>{BLURB[item.id] ?? item.cardLabel}</small>
                    <em>{count === 1 ? "1 template" : `${count} templates`}</em>
                  </button>
                );
              })}
            </div>
            <button type="button" className="cg-next" onClick={() => setStep(2)}>
              Choose a template →
            </button>
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

        {step === 3 && template && fields ? (
          <div className="cg-step3">
            <aside className="cg-form">
              <div className="cg-form-top">
                <button type="button" className="cg-back" onClick={() => setStep(2)}>
                  ← Change template
                </button>
                <span className={template.free ? "cg-tier" : "cg-tier premium"}>
                  {template.name} · {formatPrice(template)}
                </span>
              </div>
              <div>
                <h2>Make it yours</h2>
                <p>Changes appear on the preview. Sample names stay until you type yours.</p>
              </div>
              <div className={two ? "cg-fields two" : "cg-fields"}>
                <label className="cg-field">
                  {two ? "Your name" : template.meta.names === "child" ? "Child's name" : template.meta.names === "family" ? "Family name" : "Name"}
                  <input value={name1} onChange={(input) => { setName1(input.target.value); touch(); }} />
                </label>
                {two ? (
                  <label className="cg-field">
                    Partner's name
                    <input value={name2} onChange={(input) => { setName2(input.target.value); touch(); }} />
                  </label>
                ) : null}
              </div>
              <div className="cg-fields date">
                <label className="cg-field">
                  Date
                  <input type="date" value={date} onChange={(input) => { setDate(input.target.value); touch(); }} />
                </label>
                <label className="cg-field">
                  Time
                  <input type="time" value={time} onChange={(input) => { setTime(input.target.value); touch(); }} />
                </label>
              </div>
              <label className="cg-field">
                Venue
                <input value={venue} onChange={(input) => { setVenue(input.target.value); touch(); }} />
              </label>
              {usesField(template, "message") ? (
                <label className="cg-field">
                  Message to guests
                  <textarea rows={3} value={message} onChange={(input) => { setMessage(input.target.value); touch(); }} />
                </label>
              ) : null}
              <div className="cg-field">
                Functions
                <label className="cg-fn">
                  <input type="checkbox" checked readOnly onChange={() => setToast("This design always includes that section.")} />
                  {template.meta.ceremony}
                  <span>{time ? formatTime(time) : "Time"}</span>
                </label>
                {template.meta.reception ? (
                  <label className="cg-fn">
                    <input type="checkbox" checked={receptionOn} onChange={() => { setReceptionOn((on) => !on); touch(); }} />
                    {template.meta.reception}
                    <span>{sample?.receptionTime ? formatTime(sample.receptionTime) : "Evening"}</span>
                  </label>
                ) : null}
              </div>
              <div className="cg-field">
                Colour
                {palettes.length ? (
                  <div className="cg-swatches">
                    {palettes.map((id) => {
                      const tone = SWATCHES.find((item) => item.id === id);
                      if (!tone) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          className={swatch === id ? "cg-swatch on" : "cg-swatch"}
                          style={{ background: tone.cover }}
                          aria-label={template.meta.themes.find((theme) => theme.id === id)?.name ?? tone.name}
                          aria-pressed={swatch === id}
                          onClick={() => setSwatch(id)}
                        >
                          <i style={{ background: tone.dot }} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="cg-muted">This invitation keeps its own colours.</p>
                )}
              </div>
              <div className="cg-field">
                Language
                <div className="cg-langs">
                  {template?.id === "thiruvizha" ? (
                    <>
                      <button type="button" className={inviteLang === "en" ? "cg-lang on" : "cg-lang"} aria-pressed={inviteLang === "en"} onClick={() => setInviteLang("en")}>English</button>
                      <button type="button" className={inviteLang === "ta" ? "cg-lang on" : "cg-lang"} aria-pressed={inviteLang === "ta"} onClick={() => setInviteLang("ta")}>தமிழ்</button>
                      <button type="button" className={inviteLang === "both" ? "cg-lang on" : "cg-lang"} aria-pressed={inviteLang === "both"} onClick={() => setInviteLang("both")}>Bilingual</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="cg-lang on" aria-pressed="true">
                        English
                      </button>
                      <button type="button" className="cg-lang" aria-pressed="false" onClick={() => setToast("English is the language available right now.")}>
                        മലയാളം
                      </button>
                      <button type="button" className="cg-lang" aria-pressed="false" onClick={() => setToast("English is the language available right now.")}>
                        Bilingual
                      </button>
                    </>
                  )}
                </div>
              </div>
            </aside>
            <section className="cg-stage">
              <div className="cg-pills" role="group" aria-label="Preview device">
                <button type="button" className={device === "phone" ? "cg-pill on" : "cg-pill"} aria-pressed={device === "phone"} onClick={() => setDevice("phone")}>
                  Mobile
                </button>
                <button type="button" className={device === "desk" ? "cg-pill on" : "cg-pill"} aria-pressed={device === "desk"} onClick={() => setDevice("desk")}>
                  Desktop
                </button>
              </div>
              <div className={device === "phone" ? "cg-frame phone" : "cg-frame desk"}>
                <div className="cg-screen">
                  <GuestPreview template={template} fields={fields} swatch={swatch} lang={inviteLang} />
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {step === 4 && template && fields ? (
          <div className="cg-panel cg-step4">
            <div className="cg-proof">
              <div className="cg-proof-card">
                <img src={`/covers/${template.id}.jpg`} alt="" />
                <div>
                  <strong>{previewNames}</strong>
                  <span>{previewWhen}</span>
                </div>
              </div>
              <button type="button" className="cg-back" onClick={() => { setLiveCode(""); setStep(3); }}>
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
                          : `One-time ${formatPrice(template)} for this design. Checkout is a demo — nothing is charged.`}
                    </p>
                  </div>
                  <button type="button" className="cg-publish" disabled={busy} onClick={() => void publish()}>
                    {busy ? "Publishing…" : ownsTemplate ? "Publish" : `Get ${template.name}`}
                  </button>
                </div>
              ) : (
                <div className="cg-live">
                  <span className="pop" aria-hidden="true">
                    🎉
                  </span>
                  <h1>Your invitation is live!</h1>
                  <div className="cg-linkbox">{link.replace(/^https?:\/\//, "")}</div>
                  <div className="cg-shares">
                    <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`You're invited: ${link}`)}`, "_blank", "noopener")}>
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(link).then(
                          () => setToast("Link copied."),
                          () => setToast(link),
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
              <strong>{step === 2 ? `${template?.name ?? "Template"} selected` : previewNames}</strong>
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
              <button type="button" className="cg-ghost" onClick={() => (host ? setToast("Draft kept on this device. Publish it to save the invitation to your account.") : openAuth("save"))}>
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
              <small>{authDone ? "You can publish it from this page." : "Log in or create an account with email. The draft stays on this device until you publish."}</small>
            </div>
            <form className="cg-auth" onSubmit={onAuth}>
              <button type="button" className="cg-close" aria-label="Close" onClick={() => setAuthOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              {authDone ? (
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
                    <h2>{authMode === "publish" ? "Log in to publish" : authMode === "save" ? "Save your draft to an account" : "Log in to InvitesReady"}</h2>
                    <p>Use email. Your design stays as it is.</p>
                  </div>
                  <label className="cg-field">
                    Name
                    <input value={authName} onChange={(input) => setAuthName(input.target.value)} autoComplete="name" />
                  </label>
                  <label className="cg-field">
                    Email
                    <input type="email" value={authEmail} onChange={(input) => setAuthEmail(input.target.value)} autoComplete="email" />
                  </label>
                  <label className="cg-field">
                    Password
                    <input type="password" value={authPassword} onChange={(input) => setAuthPassword(input.target.value)} autoComplete="current-password" />
                  </label>
                  {authError ? <p className="cg-error">{authError}</p> : null}
                  <div className="cg-auth-actions">
                    <button type="button" className="fill" disabled={busy} onClick={() => void submitAuth("login")}>
                      Log in
                    </button>
                    <button type="button" className="line" disabled={busy} onClick={() => void submitAuth("signup")}>
                      Create account
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
          onClose={() => setCheckout(false)}
          onPurchased={async () => {
            await library.purchase(template.id);
            setOwned((current) => (current.includes(template.id) ? current : [...current, template.id]));
            await refreshHost();
            setCheckout(false);
            await publishNow();
          }}
        />
      ) : null}

      {toast ? (
        <div className="cg-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>
            OK
          </button>
        </div>
      ) : null}
    </div>
  );
}
