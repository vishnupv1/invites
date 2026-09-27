import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { AnnaInvite, type AnnaTheme } from "../components/AnnaInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { BaptismInvite, type BaptismTheme } from "../components/BaptismInvite";
import { GazalInvite } from "../components/GazalInvite";
import { InviteView } from "../components/InviteView";
import { getEvent } from "../data/events";
import { getTemplate, sampleFor } from "../data/templates";
import { assetUrl, createInvite, ensureSession, getToken, uploadMedia } from "../api";
import { searchPlaces, type PlaceHit } from "../lib/media";
import { useLibrary } from "../state";
import type { EventId, InviteFields, Template } from "../types";
import "./editor.css";

type Tab = "Details" | "Functions" | "Design" | "Sections" | "RSVP" | "Music";
type FnKind = "main" | "reception";

type Section = { id: string; label: string; help: string; on: boolean };

type Model = {
  draft: InviteFields;
  receptionOn: boolean;
  fnNames: Record<FnKind, string>;
  order: FnKind[];
  motion: boolean;
  swatch: string;
  sections: Section[];
  askCount: boolean;
  askMeal: boolean;
  askSong: boolean;
  askMessage: boolean;
  maxGuests: number;
};

const TABS: { id: Tab; icon: string }[] = [
  { id: "Details", icon: "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5" },
  { id: "Functions", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { id: "Design", icon: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.9-.7-1.4-.7-2.3 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5zM7.5 11h.01M10 7h.01M15 7h.01" },
  { id: "Sections", icon: "M4 6h16M4 12h16M4 18h16" },
  { id: "RSVP", icon: "M5 12l4 4L19 7" },
  { id: "Music", icon: "M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
];

const SWATCHES = [
  { id: "terracotta", name: "Terracotta", cover: "#F6F0E6", dot: "#A44B32" },
  { id: "plum", name: "Plum & gold", cover: "#4A263E", dot: "#D9B26A" },
  { id: "emerald", name: "Emerald & gold", cover: "#12352B", dot: "#D9B26A" },
  { id: "sky", name: "Sky blue", cover: "#DCEBF7", dot: "#2F5E8A" },
  { id: "rose", name: "Rose blush", cover: "#F6DCE2", dot: "#9B4A5E" },
  { id: "midnight", name: "Midnight", cover: "#1B2433", dot: "#D9B26A" },
];

const LAYOUTS = [
  { id: "classic", label: "Classic arch", sample: "A&J" },
  { id: "editorial", label: "Editorial", sample: "Anna" },
  { id: "heavenly", label: "Heavenly halo", sample: "◯" },
] as const;

const FONTS = [
  { id: "classic", label: "Classic · Cormorant", family: '"Cormorant Garamond", Georgia, serif' },
  { id: "modern", label: "Editorial · Pinyon Script + Gloock", family: '"Pinyon Script", cursive' },
  { id: "playful", label: "Soft · Great Vibes + Lora", family: '"Great Vibes", cursive' },
] as const;

const INTROs = [
  { id: "envelope", label: "Envelope" },
  { id: "flip", label: "Flip card" },
  { id: "none", label: "None" },
] as const;

function coupleEvent(event: EventId) {
  return event === "marriage" || event === "reception" || event === "engagement" || event === "anniversary";
}

function splitNames(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0] ?? "", second: parts.slice(1).join(" & ") };
}

function joinNames(first: string, second: string, couple: boolean) {
  if (!couple || !second) return first;
  return `${first} & ${second}`;
}

function layoutOf(style: string) {
  if (style === "anna") return "editorial";
  if (style === "baptism") return "heavenly";
  return "classic";
}

function fontOf(style: string) {
  if (style === "anna") return "modern";
  if (style === "baptism") return "playful";
  return "classic";
}

function introOf(style: string) {
  if (style === "anna") return "flip";
  if (style === "gazal" || style === "aurelia") return "envelope";
  return "none";
}

function mainName(style: string) {
  if (style === "gazal") return "Nikah";
  if (style === "baptism") return "Holy Baptism";
  return "Ceremony";
}

function annaThemeOf(swatch: string): AnnaTheme {
  if (swatch === "emerald") return "sage";
  if (swatch === "midnight") return "dusk";
  return "terracotta";
}

function baptismThemeOf(swatch: string): BaptismTheme {
  if (swatch === "rose") return "blush";
  if (swatch === "emerald") return "sage";
  return "sky";
}

function swatchForAnna(theme: AnnaTheme) {
  if (theme === "sage") return "emerald";
  if (theme === "dusk") return "midnight";
  return "terracotta";
}

function sectionsFor(draft: InviteFields): Section[] {
  return [
    { id: "countdown", label: "Countdown", help: "Days until the day", on: true },
    { id: "story", label: "Our story", help: "Kept with this design", on: true },
    { id: "gallery", label: "Photo gallery", help: "Photos you upload", on: true },
    { id: "dress", label: "Dress code", help: "What guests should wear", on: Boolean(draft.dress) },
    { id: "travel", label: "Travel & stay", help: "Kept with this design", on: false },
    { id: "faq", label: "FAQ", help: "Kept with this design", on: false },
    { id: "rsvp", label: "RSVP form", help: "Guests reply on the invitation", on: true },
    { id: "wishes", label: "Wishes wall", help: "Kept with this design", on: true },
  ];
}

function modelFor(template: Template, eventId: string | undefined): Model {
  const draft = sampleFor(template, eventId);
  return {
    draft,
    receptionOn: Boolean(draft.receptionVenue || draft.receptionTime),
    fnNames: { main: mainName(template.style), reception: template.style === "baptism" ? "Lunch & cake" : "Reception" },
    order: ["main", "reception"],
    motion: true,
    swatch: template.style === "baptism" ? "sky" : "terracotta",
    sections: sectionsFor(draft),
    askCount: true,
    askMeal: template.style === "anna",
    askSong: false,
    askMessage: true,
    maxGuests: template.style === "baptism" ? 12 : 4,
  };
}

function Icon({ d, stroke = "currentColor" }: { d: string; stroke?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Editor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const template = getTemplate(id);
  const { owns, remember } = useLibrary();
  const [model, setModel] = useState<Model | null>(() => (template ? modelFor(template, params.get("event") ?? undefined) : null));
  const [past, setPast] = useState<Model[]>([]);
  const [future, setFuture] = useState<Model[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("Details");
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [publishOpen, setPublishOpen] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(1600);
  const modelRef = useRef(model);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const audioPickRef = useRef<HTMLInputElement>(null);
  modelRef.current = model;

  useEffect(() => {
    if (!saving) return;
    const timer = window.setTimeout(() => setSaving(false), 900);
    return () => window.clearTimeout(timer);
  }, [saving, model]);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner || device !== "desktop") return;
    const measure = () => {
      setScale(Math.min(1, frame.clientWidth / 1040));
      setInnerHeight(inner.scrollHeight || 1600);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [device, model, tab]);

  if (!template || !model) return <Navigate to="/" replace />;
  if (!owns(template.id, template.free)) return <Navigate to={`/template/${template.id}`} replace />;

  const draft = model.draft;
  const event = getEvent(draft.event);
  const couple = coupleEvent(draft.event);
  const names = splitNames(draft.names);
  const title = `${draft.names.trim() || template.name} — ${event.label}`;
  const layout = layoutOf(template.style);
  const font = fontOf(template.style);
  const intro = introOf(template.style);
  const dressOn = model.sections.find((item) => item.id === "dress")?.on ?? true;
  const galleryOn = model.sections.find((item) => item.id === "gallery")?.on ?? true;
  const previewFields: InviteFields = {
    ...draft,
    dress: dressOn ? draft.dress : "",
    photos: galleryOn ? draft.photos : [],
  };
  const functions = model.order.filter((kind) => kind === "main" || model.receptionOn);

  function notify(message: string) {
    setToast(message);
  }

  function update(patch: Partial<Model>) {
    const current = modelRef.current;
    if (!current) return;
    setPast((items) => [...items.slice(-40), current]);
    setFuture([]);
    setModel({ ...current, ...patch });
    setSaving(true);
  }

  function patchDraft(partial: Partial<InviteFields>) {
    const current = modelRef.current;
    if (!current) return;
    update({ draft: { ...current.draft, ...partial } });
  }

  function undo() {
    setPast((items) => {
      if (!items.length || !modelRef.current) return items;
      const previous = items[items.length - 1];
      setFuture((next) => [modelRef.current as Model, ...next]);
      setModel(previous);
      setSaving(true);
      return items.slice(0, -1);
    });
  }

  function redo() {
    setFuture((items) => {
      if (!items.length || !modelRef.current) return items;
      const next = items[0];
      setPast((history) => [...history.slice(-40), modelRef.current as Model]);
      setModel(next);
      setSaving(true);
      return items.slice(1);
    });
  }

  function chooseEvent(next: EventId) {
    const current = modelRef.current;
    if (!current || !template) return;
    const fresh = sampleFor(template, next);
    update({
      draft: {
        ...fresh,
        date: current.draft.date,
        time: current.draft.time,
        venue: current.draft.venue,
        address: current.draft.address,
        rsvpBy: current.draft.rsvpBy,
        hostEmail: current.draft.hostEmail,
        lat: current.draft.lat,
        lng: current.draft.lng,
        photos: current.draft.photos,
        audio: current.draft.audio,
      },
      receptionOn: Boolean(fresh.receptionVenue || fresh.receptionTime),
    });
  }

  async function ensureHost() {
    const current = modelRef.current?.draft;
    if (!current || getToken()) return;
    const email = current.hostEmail.includes("@") ? current.hostEmail : `host-${crypto.randomUUID()}@vellum.local`;
    await ensureSession(email, current.hosts || current.names || "Host");
  }

  async function addPhotos(files: File[]) {
    if (!files.length || !modelRef.current || !template) return;
    try {
      await ensureHost();
      const next = [...(modelRef.current.draft.photos ?? [])];
      for (const file of files) {
        if (next.length >= template.asks.photos) break;
        next.push(await uploadMedia(file));
      }
      patchDraft({ photos: next });
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add that photo.");
      setPublishOpen(true);
    }
  }

  async function addAudio(file: File) {
    try {
      await ensureHost();
      const audio = await uploadMedia(file);
      patchDraft({ audio });
      setPlaying(false);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add that audio.");
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !draft.audio) {
      notify("Add a song file first. These invitations don't include a recording.");
      return;
    }
    if (audio.paused) {
      void audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function moveSection(index: number, dir: number) {
    if (!model) return;
    const next = [...model.sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ sections: next });
  }

  function toggleSection(id: string) {
    if (!model) return;
    const locked = id !== "dress" && id !== "gallery";
    if (locked) {
      notify("This design always includes that section.");
      return;
    }
    update({
      sections: model.sections.map((item) => (item.id === id ? { ...item, on: !item.on } : item)),
    });
  }

  function pickSwatch(swatchId: string) {
    if (!template) return;
    const annaOk = template.style === "anna" && (swatchId === "terracotta" || swatchId === "emerald" || swatchId === "midnight");
    const baptismOk = template.style === "baptism" && (swatchId === "sky" || swatchId === "rose" || swatchId === "emerald");
    if (annaOk || baptismOk) {
      update({ swatch: swatchId });
      return;
    }
    notify("This invitation keeps its own colours.");
  }

  async function publish() {
    const current = modelRef.current;
    if (!current || !template) return;
    const fields: InviteFields = {
      ...current.draft,
      dress: current.sections.find((item) => item.id === "dress")?.on ? current.draft.dress : "",
      photos: current.sections.find((item) => item.id === "gallery")?.on ? current.draft.photos : [],
    };
    if (!fields.names.trim() || !fields.date) {
      setError("Add the names and a date before publishing.");
      return;
    }
    try {
      await ensureHost();
      const saved = await createInvite(template.id, fields);
      remember(saved);
      setError("");
      setLink(`${window.location.origin}/i/${saved.code}`);
      setShowQr(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish.");
    }
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    notify("Link copied.");
  }

  function guestView() {
    if (link) {
      window.open(link, "_blank", "noopener");
      return;
    }
    notify("The preview is what guests will see. Publish to open a shareable link.");
  }

  const themeName = SWATCHES.find((item) => item.id === model.swatch)?.name ?? "Terracotta";

  return (
    <div className={`ed-root${model.motion ? "" : " ed-still"}`}>
      <header className="ed-top">
        <div className="ed-brand">
          <Link className="ed-back" to={`/template/${template.id}?event=${draft.event}`} aria-label="Back to template">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <div className="ed-title">{title}</div>
            <div className="ed-save">
              <span className={saving ? "ed-dot busy" : "ed-dot"} />
              {saving ? "Updating…" : "Draft on this page"}
            </div>
          </div>
        </div>
        <div className="ed-tools">
          <button type="button" className="ed-iconbtn" aria-label="Undo" disabled={!past.length} onClick={undo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 14L4 9l5-5" />
              <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
            </svg>
          </button>
          <button type="button" className="ed-iconbtn" aria-label="Redo" disabled={!future.length} onClick={redo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 14l5-5-5-5" />
              <path d="M20 9H9a5 5 0 0 0 0 10h3" />
            </svg>
          </button>
          <div className="ed-device" role="group" aria-label="Preview device">
            <button type="button" aria-pressed={device === "phone"} onClick={() => setDevice("phone")}>
              Mobile
            </button>
            <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
              Desktop
            </button>
          </div>
        </div>
        <div className="ed-actions">
          <button type="button" className="ed-guest" onClick={guestView}>
            Guest view
          </button>
          <button type="button" className="ed-publish" onClick={() => { setError(""); setPublishOpen(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" />
            </svg>
            Publish & share
          </button>
        </div>
      </header>

      <div className="ed-body">
        <nav className="ed-rail" aria-label="Editor sections">
          {TABS.map((item) => (
            <button key={item.id} type="button" className="ed-tab" aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>
              <Icon d={item.icon} stroke={tab === item.id ? "#6B3A5B" : "#716A6D"} />
              <span>{item.id}</span>
            </button>
          ))}
        </nav>

        <aside className="ed-panel">
          {tab === "Details" ? (
            <div className="ed-stack">
              <div>
                <h2>Invitation details</h2>
                <p className="ed-lead">Names, date and the message guests see first.</p>
              </div>
              <div className="ed-field">
                <span className="ed-label">Occasion</span>
                <div className="ed-grid-2">
                  {template.events.map((eventId) => (
                    <button key={eventId} type="button" className="ed-chip" aria-pressed={draft.event === eventId} onClick={() => chooseEvent(eventId)}>
                      {getEvent(eventId).label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={couple ? "ed-grid-2" : "ed-field"}>
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-n1">{couple ? "Your name" : draft.event === "baptism" ? "Child's name" : event.namesLabel}</label>
                  <input id="ed-n1" className="ed-input" value={names.first} onChange={(change) => patchDraft({ names: joinNames(change.target.value, names.second, couple) })} />
                </div>
                {couple ? (
                  <div className="ed-field">
                    <label className="ed-label" htmlFor="ed-n2">Partner's name</label>
                    <input id="ed-n2" className="ed-input" value={names.second} onChange={(change) => patchDraft({ names: joinNames(names.first, change.target.value, true) })} />
                  </div>
                ) : null}
              </div>
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-hosts">Opening line</label>
                <input id="ed-hosts" className="ed-input" value={draft.hosts} onChange={(change) => patchDraft({ hosts: change.target.value })} />
              </div>
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-title">{event.titleLabel}</label>
                <input id="ed-title" className="ed-input" value={draft.title} onChange={(change) => patchDraft({ title: change.target.value })} />
              </div>
              {event.detailLabel ? (
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-detail">{event.detailLabel}</label>
                  <input id="ed-detail" className="ed-input" value={draft.detail} onChange={(change) => patchDraft({ detail: change.target.value })} />
                </div>
              ) : null}
              <div className="ed-grid-2 ed-date">
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-date">Date</label>
                  <input id="ed-date" className="ed-input" type="date" value={draft.date} onChange={(change) => patchDraft({ date: change.target.value })} />
                </div>
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-time">Time</label>
                  <input id="ed-time" className="ed-input" type="time" value={draft.time} onChange={(change) => patchDraft({ time: change.target.value })} />
                </div>
              </div>
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-msg">Welcome message</label>
                <textarea id="ed-msg" rows={3} value={draft.message} onChange={(change) => patchDraft({ message: change.target.value.slice(0, 180) })} />
                <span className="ed-count">{Math.min(draft.message.length, 180)}/180</span>
              </div>
              <div className="ed-field">
                <span className="ed-label">Language</span>
                <div className="ed-grid-3">
                  <button type="button" className="ed-chip" aria-pressed="true">English</button>
                  <button type="button" className="ed-chip" aria-pressed="false" onClick={() => notify("Malayalam and bilingual wording aren't available on this design.")}>മലയാളം</button>
                  <button type="button" className="ed-chip" aria-pressed="false" onClick={() => notify("Malayalam and bilingual wording aren't available on this design.")}>Bilingual</button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Functions" ? (
            <div className="ed-stack">
              <div>
                <h2>Functions</h2>
                <p className="ed-lead">Each function gets its own time, venue and map.</p>
              </div>
              {functions.map((kind, index) => {
                const isMain = kind === "main";
                return (
                  <div className="ed-fn" key={kind}>
                    <div className="ed-fn-head">
                      <input
                        className="ed-input"
                        aria-label="Function name"
                        value={model.fnNames[kind]}
                        onChange={(change) => update({ fnNames: { ...model.fnNames, [kind]: change.target.value } })}
                      />
                      <button type="button" className="ed-move" aria-label={`Move ${model.fnNames[kind]} up`} disabled={index === 0} onClick={() => update({ order: [...model.order].reverse() })}>↑</button>
                      <button type="button" className="ed-move" aria-label={`Move ${model.fnNames[kind]} down`} disabled={index === functions.length - 1} onClick={() => update({ order: [...model.order].reverse() })}>↓</button>
                      <button
                        type="button"
                        className="ed-remove"
                        aria-label={`Remove ${model.fnNames[kind]}`}
                        onClick={() => {
                          if (isMain) {
                            notify("The ceremony stays on the invitation.");
                            return;
                          }
                          update({
                            receptionOn: false,
                            draft: { ...draft, receptionTime: "", receptionVenue: "", receptionAddress: "" },
                          });
                          notify(`${model.fnNames.reception} removed. Use undo to bring it back.`);
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C45B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                    <div className="ed-grid-2">
                      <input className="ed-input" aria-label="Date" type="date" value={draft.date} onChange={(change) => patchDraft({ date: change.target.value })} />
                      <input
                        className="ed-input"
                        aria-label="Time"
                        type="time"
                        value={isMain ? draft.time : draft.receptionTime}
                        onChange={(change) => patchDraft(isMain ? { time: change.target.value } : { receptionTime: change.target.value })}
                      />
                    </div>
                    <input
                      className="ed-input"
                      aria-label="Venue"
                      placeholder="Venue"
                      value={isMain ? draft.venue : draft.receptionVenue}
                      onChange={(change) => patchDraft(isMain ? { venue: change.target.value } : { receptionVenue: change.target.value })}
                    />
                    <input
                      className="ed-input"
                      aria-label="Address"
                      placeholder="Address"
                      value={isMain ? draft.address : draft.receptionAddress}
                      onChange={(change) => patchDraft(isMain ? { address: change.target.value } : { receptionAddress: change.target.value })}
                    />
                  </div>
                );
              })}
              <button
                type="button"
                className="ed-add"
                onClick={() => {
                  if (model.receptionOn) {
                    notify("This invitation has the ceremony and one gathering.");
                    return;
                  }
                  update({ receptionOn: true });
                }}
              >
                + Add a function
              </button>
              {template.asks.location ? (
                <div className="ed-field">
                  <span className="ed-label">Find the ceremony on the map</span>
                  <div className="ed-search">
                    <input className="ed-input" value={placeQuery} placeholder="Search a venue or address" onChange={(change) => setPlaceQuery(change.target.value)} />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!placeQuery.trim()) return;
                        setSearching(true);
                        try {
                          setPlaces(await searchPlaces(placeQuery.trim()));
                        } catch (reason) {
                          notify(reason instanceof Error ? reason.message : "Could not search places.");
                        } finally {
                          setSearching(false);
                        }
                      }}
                    >
                      {searching ? "Searching" : "Search"}
                    </button>
                  </div>
                  <ul className="ed-places">
                    {places.map((place) => (
                      <li key={`${place.lat}-${place.lng}`}>
                        <button
                          type="button"
                          onClick={() => {
                            patchDraft({
                              venue: place.label.split(",")[0]?.trim() || place.label,
                              address: place.label,
                              lat: place.lat,
                              lng: place.lng,
                            });
                            setPlaces([]);
                          }}
                        >
                          {place.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "Design" ? (
            <div className="ed-stack">
              <div>
                <h2>Design</h2>
                <p className="ed-lead">Layout, colours, fonts and motion.</p>
              </div>
              <div className="ed-field">
                <span className="ed-label">Layout style</span>
                <div className="ed-grid-3">
                  {LAYOUTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`ed-layout ${item.id}`}
                      aria-pressed={layout === item.id}
                      onClick={() => layout !== item.id && notify("This invitation keeps its own layout.")}
                    >
                      <div className="ed-thumb">{item.sample}</div>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="ed-field">
                <span className="ed-label">Colour theme · <span style={{ fontWeight: 500, color: "#716A6D" }}>{themeName}</span></span>
                <div className="ed-swatches">
                  {SWATCHES.map((item) => (
                    <button key={item.id} type="button" className="ed-swatch" aria-label={item.name} aria-pressed={model.swatch === item.id} style={{ background: item.cover }} onClick={() => pickSwatch(item.id)}>
                      <i style={{ background: item.dot }} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="ed-field">
                <span className="ed-label">Font pairing</span>
                {FONTS.map((item) => (
                  <button key={item.id} type="button" className="ed-font" aria-pressed={font === item.id} onClick={() => font !== item.id && notify("This invitation keeps its own type.")}>
                    <strong style={{ fontFamily: item.family }}>{draft.names.trim() || template.name}</strong>
                    <small>{item.label}</small>
                  </button>
                ))}
              </div>
              <div className="ed-field">
                <span className="ed-label">Cover photo</span>
                <button type="button" className="ed-upload" onClick={() => photoRef.current?.click()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B3A5B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 16V4M7 9l5-5 5 5" />
                    <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                  </svg>
                  <b>Upload a photo</b>
                  <span>JPG or PNG · up to {template.asks.photos}</span>
                </button>
                <input
                  ref={photoRef}
                  hidden
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(change) => {
                    const files = [...(change.target.files ?? [])];
                    change.target.value = "";
                    void addPhotos(files);
                  }}
                />
                {draft.photos.length ? (
                  <div className="ed-photos">
                    {draft.photos.map((photo, index) => (
                      <button
                        key={`${photo.slice(0, 24)}-${index}`}
                        type="button"
                        onClick={() => patchDraft({ photos: draft.photos.filter((_, item) => item !== index) })}
                      >
                        <img src={assetUrl(photo)} alt="" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="ed-field">
                <span className="ed-label">Opening animation</span>
                <div className="ed-grid-3">
                  {INTROs.map((item) => (
                    <button key={item.id} type="button" className="ed-chip" aria-pressed={intro === item.id} onClick={() => intro !== item.id && notify("This invitation keeps its own opening.")}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="ed-check">
                <span>
                  <b>Animations</b>
                  <small>Shimmer, floating details, confetti</small>
                </span>
                <input type="checkbox" checked={model.motion} onChange={() => update({ motion: !model.motion })} />
              </label>
            </div>
          ) : null}

          {tab === "Sections" ? (
            <div className="ed-stack">
              <div>
                <h2>Page sections</h2>
                <p className="ed-lead">Dress and photos follow these switches. The rest of this design stays in place.</p>
              </div>
              {model.sections.map((section, index) => (
                <div className={section.on ? "ed-row" : "ed-row off"} key={section.id}>
                  <input type="checkbox" checked={section.on} aria-label={`${section.on ? "Hide" : "Show"} ${section.label}`} onChange={() => toggleSection(section.id)} />
                  <div className="grow">
                    <b>{section.label}</b>
                    <small>{section.help}</small>
                  </div>
                  <button type="button" className="ed-move" aria-label={`Move ${section.label} up`} disabled={index === 0} onClick={() => moveSection(index, -1)}>↑</button>
                  <button type="button" className="ed-move" aria-label={`Move ${section.label} down`} disabled={index === model.sections.length - 1} onClick={() => moveSection(index, 1)}>↓</button>
                </div>
              ))}
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-dress">Dress code</label>
                <input id="ed-dress" className="ed-input" value={draft.dress} onChange={(change) => patchDraft({ dress: change.target.value })} />
              </div>
            </div>
          ) : null}

          {tab === "RSVP" ? (
            <div className="ed-stack">
              <div>
                <h2>RSVP form</h2>
                <p className="ed-lead">Reply-by is saved with the invitation. Guests answer the questions on this design.</p>
              </div>
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-dl">Reply by</label>
                <input id="ed-dl" className="ed-input" type="date" value={draft.rsvpBy} onChange={(change) => patchDraft({ rsvpBy: change.target.value })} />
              </div>
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-email">Your email for replies</label>
                <input id="ed-email" className="ed-input" type="email" value={draft.hostEmail} onChange={(change) => patchDraft({ hostEmail: change.target.value })} />
              </div>
              {(
                [
                  ["askCount", "Number of guests", "Guests say how many are coming", model.askCount],
                  ["askMeal", "Meal preference", "Veg, non-veg or kids", model.askMeal],
                  ["askSong", "Song request", "A note with the reply", model.askSong],
                  ["askMessage", "Message to the family", "Wishes sent with the reply", model.askMessage],
                ] as const
              ).map(([key, label, help, on]) => (
                <label className="ed-check" key={key}>
                  <span>
                    <b>{label}</b>
                    <small>{help}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => {
                      update({ [key]: !on });
                      notify("Guests answer the questions built into this invitation.");
                    }}
                  />
                </label>
              ))}
              <div className="ed-check">
                <b>Max guests per invite</b>
                <div className="ed-step">
                  <button type="button" aria-label="Decrease" onClick={() => update({ maxGuests: Math.max(1, model.maxGuests - 1) })}>−</button>
                  <span>{model.maxGuests}</span>
                  <button type="button" aria-label="Increase" onClick={() => update({ maxGuests: Math.min(12, model.maxGuests + 1) })}>+</button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Music" ? (
            <div className="ed-stack">
              <div>
                <h2>Background music</h2>
                <p className="ed-lead">Plays when guests tap the music button. Add your own file.</p>
              </div>
              <div className={draft.audio ? "ed-row ed-track" : "ed-row ed-track on"}>
                <button type="button" className="ed-play" aria-label="No music" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#CDC6C9" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
                </button>
                <div className="grow">
                  <b>No music</b>
                  <small>Silent</small>
                </div>
                <button type="button" className={draft.audio ? "ed-use" : "ed-use on"} onClick={() => { patchDraft({ audio: "" }); setPlaying(false); }}>
                  {draft.audio ? "Use" : "Selected"}
                </button>
              </div>
              <div className={draft.audio ? "ed-row ed-track on" : "ed-row ed-track"}>
                <button type="button" className={playing ? "ed-play on" : "ed-play"} aria-label={playing ? "Pause your song" : "Play your song"} onClick={togglePlay}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={playing ? "M7 5h4v14H7zM13 5h4v14h-4z" : "M8 5l11 7-11 7z"} />
                  </svg>
                </button>
                <div className="grow">
                  <b>Your song</b>
                  <small>{draft.audio ? "Uploaded file" : "MP3 or a link"}</small>
                </div>
                <button type="button" className={draft.audio ? "ed-use on" : "ed-use"} onClick={() => audioPickRef.current?.click()}>
                  {draft.audio ? "Selected" : "Use"}
                </button>
              </div>
              <input
                ref={audioPickRef}
                hidden
                type="file"
                accept="audio/*"
                onChange={(change) => {
                  const file = change.target.files?.[0];
                  change.target.value = "";
                  if (file) void addAudio(file);
                }}
              />
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-audio">Or paste a link to a song</label>
                <input
                  id="ed-audio"
                  className="ed-input"
                  type="url"
                  placeholder="https://"
                  value={draft.audio.startsWith("http") ? draft.audio : ""}
                  onChange={(change) => patchDraft({ audio: change.target.value })}
                />
              </div>
              {draft.audio ? <audio ref={audioRef} src={assetUrl(draft.audio)} onEnded={() => setPlaying(false)} /> : null}
            </div>
          ) : null}
        </aside>

        <main className="ed-canvas">
          <div className="ed-stage">
            <div className={device === "phone" ? "ed-frame ed-phone" : "ed-frame ed-desk"} ref={frameRef}>
              <div className="ed-screen" style={device === "desktop" ? { height: innerHeight * scale } : undefined}>
                <div ref={innerRef} className="ed-zoom" style={device === "desktop" ? { width: 1040, transform: `scale(${scale})` } : undefined}>
                  {template.style === "gazal" ? (
                    <GazalInvite fields={previewFields} />
                  ) : template.style === "aurelia" ? (
                    <AureliaInvite fields={previewFields} />
                  ) : template.style === "anna" ? (
                    <AnnaInvite fields={previewFields} theme={annaThemeOf(model.swatch)} onTheme={(next) => update({ swatch: swatchForAnna(next) })} />
                  ) : template.style === "baptism" ? (
                    <BaptismInvite fields={previewFields} theme={baptismThemeOf(model.swatch)} />
                  ) : (
                    <InviteView template={template} fields={previewFields} />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="ed-caption">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
            Live preview · changes update instantly
          </div>
        </main>
      </div>

      {publishOpen ? (
        <div className="ed-modal">
          <div className="ed-dialog" role="dialog" aria-label="Publish and share">
            <div className="ed-dialog-head">
              <div>
                <h2>{link ? "Your invitation is live" : "Publish your invitation"}</h2>
                <p className="ed-lead">{link ? "Share it with your guests now." : "Publish when the preview looks right."}</p>
              </div>
              <button type="button" className="ed-x" aria-label="Close" onClick={() => setPublishOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {error ? <div className="ed-alert" role="alert">{error}</div> : null}
            {link ? (
              <div className="ed-stack">
                <div className="ed-live">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4E6853" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l4 4L19 7" />
                  </svg>
                  <span>{link.replace(/^https?:\/\//, "")}</span>
                </div>
                <div className="ed-shares">
                  <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`You're invited: ${link}`)}`, "_blank", "noopener")}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4E6853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" /></svg>
                    WhatsApp
                  </button>
                  <button type="button" onClick={() => void copyLink()}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B3A5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 9h12v12H9zM5 15V5a2 2 0 0 1 2-2h10" /></svg>
                    Copy link
                  </button>
                  <button type="button" onClick={() => setShowQr(true)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM17 17h4v4h-4" /></svg>
                    QR code
                  </button>
                </div>
                {showQr ? <img className="ed-qr" alt="QR code for the invitation" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`} /> : null}
                <Link className="ed-studio" to="/studio">Go to guest list</Link>
              </div>
            ) : (
              <button type="button" className="ed-go" onClick={() => void publish()}>Publish</button>
            )}
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="ed-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
