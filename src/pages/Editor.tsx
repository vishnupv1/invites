import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { AnnaInvite, type AnnaTheme } from "../components/AnnaInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { BaptismInvite, type BaptismTheme } from "../components/BaptismInvite";
import { BeachInvite, type BeachTheme } from "../components/BeachInvite";
import { HomeInvite, type HomeTheme } from "../components/HomeInvite";
import { VivahInvite, type VivahTheme } from "../components/VivahInvite";
import { GazalInvite } from "../components/GazalInvite";
import { ShaadiInvite, type ShaadiTheme } from "../components/ShaadiInvite";
import { ThiruvizhaInvite, type ThiruvizhaLang, type ThiruvizhaTheme } from "../components/ThiruvizhaInvite";
import { PeaceInvite, type PeaceTheme } from "../components/PeaceInvite";
import { SHAADI_SHOTS, SHAADI_STORY_COUNT, festivitiesOf, shaadiPhotoShots, type ShaadiFunction } from "../components/shaadi";
import { notesJson, photoNotes, spliceNotes, type PhotoNote } from "../data/photos";
import { InviteView } from "../components/InviteView";
import { getEvent } from "../data/events";
import { eventName, withEventName } from "../data/custom";
import { PackFields } from "./PackFields";
import { getTemplate, hasComponent, sampleFor, usesField } from "../data/templates";
import { assetUrl, createInvite, ensureSession, getToken, uploadMedia } from "../api";
import { searchPlaces, type PlaceHit } from "../lib/media";
import { useLibrary } from "../state";
import { useSession } from "../session";
import { AppMenu } from "../components/AppMenu";
import { Breadcrumbs } from "../components/Breadcrumbs";
import type { EventId, InviteFields, Template } from "../types";
import "./editor.css";

type Tab = "Details" | "Functions" | "Design" | "Sections" | "RSVP" | "Music";
type FnKind = "main" | "reception";

type Section = { id: string; label: string; help: string; on: boolean; configurable: boolean };

type Model = {
  draft: InviteFields;
  receptionOn: boolean;
  swatch: string;
  sections: Section[];
};

const HIDEABLE = new Set(["dress", "gallery", "music", "message", "reception"]);

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
  { id: "rani", name: "Rani", cover: "#4A0D1F", dot: "#F5D77A" },
  { id: "ivory", name: "Ivory", cover: "#F6EFE4", dot: "#7A1633" },
  { id: "blush", name: "Blush", cover: "#F8E6E4", dot: "#C27A78" },
  { id: "noir", name: "Noir", cover: "#1C1718", dot: "#E8C987" },
  { id: "sage", name: "Sage", cover: "#E4EBE3", dot: "#6E8A72" },
];

function ceremonyLabel(template: Template, draft: InviteFields) {
  if ((draft.lines ?? "").trim().startsWith("[")) return template.meta.ceremony;
  const fallback = template.id === "aurelia" ? draft.title || "Wedding ceremony" : template.meta.ceremony;
  return eventName(draft.lines, "ceremonyName", fallback);
}

function receptionLabel(template: Template, draft: InviteFields) {
  if ((draft.lines ?? "").trim().startsWith("[")) return template.meta.reception ?? "";
  const fallback = template.id === "anna"
    ? "Reception & dinner"
    : template.id === "gazal"
      ? "Walima reception"
      : template.id === "baptism"
        ? "Lunch & cake"
        : template.meta.reception ?? "";
  return eventName(draft.lines, "receptionName", fallback);
}

function splitNames(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0] ?? "", second: parts.slice(1).join(" & ") };
}

function joinNames(first: string, second: string, couple: boolean) {
  if (!couple || !second) return first;
  return `${first} & ${second}`;
}

function annaThemeOf(swatch: string): AnnaTheme {
  if (swatch === "emerald") return "sage";
  if (swatch === "midnight") return "dusk";
  return "terracotta";
}

function homeThemeOf(swatch: string): HomeTheme {
  if (swatch === "rose") return "sunset";
  if (swatch === "midnight") return "night";
  return "day";
}

function beachThemeOf(swatch: string): BeachTheme {
  if (swatch === "sky") return "tropical";
  if (swatch === "plum") return "dusk";
  return "sunset";
}

function vivahThemeOf(swatch: string): VivahTheme {
  if (swatch === "emerald") return "emerald";
  if (swatch === "plum") return "royal";
  return "midnight";
}

function shaadiThemeOf(swatch: string): ShaadiTheme {
  if (swatch === "emerald") return "emerald";
  if (swatch === "ivory") return "ivory";
  return "rani";
}

function peaceThemeOf(swatch: string): PeaceTheme {
  if (swatch === "noir") return "noir";
  if (swatch === "sage") return "sage";
  return "blush";
}

function thiruThemeOf(swatch: string): ThiruvizhaTheme {
  if (swatch === "ivory") return "ivory";
  if (swatch === "emerald") return "emerald";
  return "rani";
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

function sectionHelp(id: string, configurable: boolean) {
  if (!configurable) return "Stays with this design.";
  if (HIDEABLE.has(id)) return "Turn off to leave it off the invitation.";
  if (id === "rsvp") return "Set the reply date under RSVP.";
  if (id === "ceremony" || id === "when") return "Edit the time and place under Functions.";
  if (id === "programme" || id === "story" || id === "house" || id === "travel") return "Edit this copy under Functions. Photographs, when this design has them, are under Design.";
  return "Edit the wording under Details.";
}

function sectionsFor(template: Template, draft: InviteFields): Section[] {
  return template.meta.components.map((component) => ({
    id: component.id,
    label: component.label,
    help: sectionHelp(component.id, component.configurable),
    configurable: component.configurable,
    on:
      component.id === "dress"
        ? Boolean(draft.dress)
        : component.id === "reception"
          ? Boolean(draft.receptionVenue || draft.receptionTime)
          : component.id === "message"
            ? Boolean(draft.message)
            : true,
  }));
}

function shownFields(model: Model): InviteFields {
  const on = (id: string) => model.sections.find((item) => item.id === id)?.on !== false;
  const draft = model.draft;
  return {
    ...draft,
    dress: on("dress") ? draft.dress : "",
    photos: on("gallery") ? draft.photos : [],
    message: on("message") ? draft.message : "",
    audio: on("music") ? draft.audio : "",
    receptionTime: on("reception") && model.receptionOn ? draft.receptionTime : "",
    receptionVenue: on("reception") && model.receptionOn ? draft.receptionVenue : "",
    receptionAddress: on("reception") && model.receptionOn ? draft.receptionAddress : "",
  };
}

function modelFor(template: Template, eventId: string | undefined): Model {
  const draft = sampleFor(template, eventId);
  return {
    draft,
    receptionOn: Boolean(template.meta.reception && (draft.receptionVenue || draft.receptionTime)),
    swatch: template.meta.defaultTheme,
    sections: sectionsFor(template, draft),
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
  const { signedIn, host } = useSession();
  const hostName = host?.name ?? "";
  const [model, setModel] = useState<Model | null>(() => (template ? modelFor(template, params.get("event") ?? undefined) : null));
  const [past, setPast] = useState<Model[]>([]);
  const [future, setFuture] = useState<Model[]>([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("Details");
  const [sheet, setSheet] = useState(true);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [publishOpen, setPublishOpen] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<"ok" | "bad">("ok");
  const [showQr, setShowQr] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteLang, setInviteLang] = useState<ThiruvizhaLang>("both");
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(1600);
  const modelRef = useRef(model);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const photoSlot = useRef(0);
  const audioPickRef = useRef<HTMLInputElement>(null);
  modelRef.current = model;

  useEffect(() => {
    if (!saving) return;
    const timer = window.setTimeout(() => setSaving(false), 900);
    return () => window.clearTimeout(timer);
  }, [saving, model]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
  const couple = template.meta.names === "couple";
  const names = splitNames(draft.names);
  const title = `${draft.names.trim() || template.name} — ${event.label}`;
  const previewFields = shownFields(model);
  const functions: FnKind[] = template.meta.reception && model.receptionOn ? ["main", "reception"] : ["main"];
  const namedLines = template.id !== "shaadi" && !(draft.lines ?? "").trim().startsWith("[");
  const photoShots = template.id === "shaadi" ? shaadiPhotoShots(draft.lines, template.meta.shots) : template.meta.shots;
  const captions = photoNotes(draft.notes, photoShots);
  const themeName = template.meta.themes.find((item) => item.id === model.swatch)?.name ?? "This design";
  const nameLabel = template.meta.names === "child" ? "Child's name" : template.meta.names === "family" ? "Family name" : "Your name";
  const tabs = TABS.filter((item) => {
    if (item.id === "Music") return hasComponent(template, "music");
    if (item.id === "Functions") return hasComponent(template, "ceremony");
    if (item.id === "RSVP") return hasComponent(template, "rsvp");
    return true;
  });

  function notify(message: string, tone: "ok" | "bad" = "ok") {
    setToastTone(tone);
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

  function shotLimit(lines: string | undefined) {
    if (!template) return 0;
    if (template.id !== "shaadi") return template.meta.shots.length;
    return SHAADI_STORY_COUNT + festivitiesOf(lines).length + 1;
  }

  function patchFestivity(index: number, patch: Partial<ShaadiFunction>) {
    const next = festivitiesOf(draft.lines).map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    patchDraft({ lines: JSON.stringify(next) });
  }

  function removeFestivity(index: number) {
    const current = modelRef.current;
    if (!current || !template) return;
    const items = festivitiesOf(current.draft.lines).filter((_, itemIndex) => itemIndex !== index);
    const photos = [...(current.draft.photos ?? [])];
    const photoIndex = SHAADI_STORY_COUNT + index;
    if (photoIndex < photos.length) photos.splice(photoIndex, 1);
    const name = festivitiesOf(current.draft.lines)[index]?.name || "celebration";
    const notes = spliceNotes(current.draft.notes, shaadiPhotoShots(current.draft.lines, template.meta.shots), photoIndex, 1);
    patchDraft({ lines: JSON.stringify(items), photos, notes });
    notify(`${name} removed. Use undo to bring it back.`);
  }

  function addFestivity() {
    const current = modelRef.current;
    if (!current || !template) return;
    const items = festivitiesOf(current.draft.lines);
    const photos = [...(current.draft.photos ?? [])];
    const insertAt = SHAADI_STORY_COUNT + items.length;
    if (photos.length > insertAt) photos.splice(insertAt, 0, "");
    const notes = spliceNotes(current.draft.notes, shaadiPhotoShots(current.draft.lines, template.meta.shots), insertAt, 0, { title: "New celebration", text: "" });
    patchDraft({
      lines: JSON.stringify([...items, { day: "", name: "New celebration", hindi: "", when: "", venue: "", dress: "" }]),
      photos,
      notes,
    });
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
        notes: current.draft.notes,
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

  async function setPhoto(index: number, file: File) {
    if (!modelRef.current || !template) return;
    try {
      await ensureHost();
      const url = await uploadMedia(file);
      const current = modelRef.current;
      if (!current) return;
      const next = [...(current.draft.photos ?? [])];
      const limit = shotLimit(current.draft.lines);
      while (next.length < limit) next.push("");
      next[index] = url;
      patchDraft({ photos: next.slice(0, limit) });
      setError("");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Could not add that photo.", "bad");
    }
  }

  function patchNote(index: number, patch: Partial<PhotoNote>) {
    const current = modelRef.current;
    if (!current || !template) return;
    const shots = template.id === "shaadi" ? shaadiPhotoShots(current.draft.lines, template.meta.shots) : template.meta.shots;
    const next = photoNotes(current.draft.notes, shots).map((item, itemIndex) =>
      itemIndex === index ? { title: patch.title ?? item.title, text: patch.text ?? item.text } : { title: item.title, text: item.text },
    );
    patchDraft({ notes: notesJson(next) });
  }

  function clearPhoto(index: number) {
    const next = [...(modelRef.current?.draft.photos ?? [])];
    while (next.length <= index) next.push("");
    next[index] = "";
    patchDraft({ photos: next });
  }

  async function addAudio(file: File) {
    try {
      await ensureHost();
      const audio = await uploadMedia(file);
      patchDraft({ audio });
      setPlaying(false);
      setError("");
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "Could not add that audio.", "bad");
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

  function toggleSection(id: string) {
    if (!model) return;
    const section = model.sections.find((item) => item.id === id);
    if (!section?.configurable || !HIDEABLE.has(id)) {
      notify(section?.configurable ? "Edit this piece in the other tabs. It stays on the invitation." : "This piece stays with the design.");
      return;
    }
    const on = !section.on;
    update({
      sections: model.sections.map((item) => (item.id === id ? { ...item, on } : item)),
      receptionOn: id === "reception" ? on : model.receptionOn,
    });
  }

  function pickSwatch(swatchId: string) {
    if (!template) return;
    if (template.meta.themes.some((item) => item.id === swatchId)) {
      update({ swatch: swatchId });
      return;
    }
    notify("This invitation keeps its own colours.");
  }

  async function publish() {
    const current = modelRef.current;
    if (!current || !template) return;
    const fields = shownFields(current);
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

  const editor = (
    <div className={`ed-root${sheet ? " ed-sheet" : ""}${signedIn ? "" : " ed-as-guest"}`}>
      <header className="ed-top">
        <div className="ed-brand">
          <Link className="ed-back" to="/templates" aria-label="Back to templates">
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
          <button type="button" className="ed-iconbtn ed-redo" aria-label="Redo" disabled={!future.length} onClick={redo}>
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
          {signedIn ? null : <span className="ed-guest">Guest view</span>}
          <button type="button" className="ed-publish" onClick={() => { setError(""); setPublishOpen(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" />
            </svg>
            <span className="ed-pub-long">Publish & share</span>
            <span className="ed-pub-short">Publish</span>
          </button>
        </div>
      </header>
      <Breadcrumbs
        className="ed-crumbs"
        items={[
          { label: "Dashboard", to: "/studio" },
          { label: "Templates", to: "/templates" },
          { label: template.name },
        ]}
      />
      {signedIn ? null : <div className="ed-guest-strip">Designing as a guest · draft saved on this phone</div>}

      <div className="ed-body">
        <nav className="ed-rail" aria-label="Editor sections">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ed-tab"
              aria-current={tab === item.id ? "page" : undefined}
              aria-pressed={sheet && tab === item.id}
              onClick={() => {
                if (window.matchMedia("(max-width: 860px)").matches) setSheet((open) => (tab === item.id ? !open : true));
                setTab(item.id);
              }}
            >
              <Icon d={item.icon} stroke={sheet && tab === item.id ? "#6B3A5B" : "#716A6D"} />
              <span>{item.id}</span>
            </button>
          ))}
        </nav>

        <aside className="ed-panel" inert={sheet ? undefined : true}>
          <div className="ed-sheet-head">
            <span className="ed-grab" aria-hidden="true" />
            <div>
              <h2>{tab}</h2>
              <button type="button" className="ed-done" onClick={() => setSheet(false)}>
                Done
              </button>
            </div>
          </div>
          {tab === "Details" ? (
            <div className="ed-stack">
              <div className="ed-intro">
                <h2>Invitation details</h2>
                <p className="ed-lead">Only the wording this design actually prints.</p>
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
              {usesField(template, "names") ? (
                <div className={couple ? "ed-grid-2" : "ed-field"}>
                  <div className="ed-field">
                    <label className="ed-label" htmlFor="ed-n1">{nameLabel}</label>
                    <input id="ed-n1" className="ed-input" value={names.first} onChange={(change) => patchDraft({ names: joinNames(change.target.value, names.second, couple) })} />
                  </div>
                  {couple ? (
                    <div className="ed-field">
                      <label className="ed-label" htmlFor="ed-n2">Partner's name</label>
                      <input id="ed-n2" className="ed-input" value={names.second} onChange={(change) => patchDraft({ names: joinNames(names.first, change.target.value, true) })} />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {usesField(template, "hosts") ? (
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-hosts">{template.meta.components.find((item) => item.id === "hosts")?.label ?? "Opening line"}</label>
                  <input id="ed-hosts" className="ed-input" value={draft.hosts} onChange={(change) => patchDraft({ hosts: change.target.value })} />
                </div>
              ) : null}
              {usesField(template, "title") ? (
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-title">{template.meta.components.find((item) => item.id === "line")?.label ?? event.titleLabel}</label>
                  <input id="ed-title" className="ed-input" value={draft.title} onChange={(change) => patchDraft({ title: change.target.value })} />
                </div>
              ) : null}
              {usesField(template, "detail") ? (
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-detail">{template.meta.components.find((item) => item.id === "detail")?.label ?? "Detail"}</label>
                  <textarea id="ed-detail" className="ed-input" rows={3} value={draft.detail} onChange={(change) => patchDraft({ detail: change.target.value.slice(0, 500) })} />
                </div>
              ) : null}
              {usesField(template, "date") ? (
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
              ) : null}
              {usesField(template, "message") ? (
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-msg">{template.meta.components.find((item) => item.fields.includes("message"))?.label ?? "Welcome message"}</label>
                  <textarea id="ed-msg" rows={3} value={draft.message} onChange={(change) => patchDraft({ message: change.target.value.slice(0, 500) })} />
                  <span className="ed-count">{Math.min(draft.message.length, 500)}/500</span>
                </div>
              ) : null}
              <div className="ed-field">
                <span className="ed-label">Language</span>
                <div className="ed-grid-3">
                  {template.id === "thiruvizha" ? (
                    <>
                      <button type="button" className="ed-chip" aria-pressed={inviteLang === "en"} onClick={() => setInviteLang("en")}>English</button>
                      <button type="button" className="ed-chip" aria-pressed={inviteLang === "ta"} onClick={() => setInviteLang("ta")}>தமிழ்</button>
                      <button type="button" className="ed-chip" aria-pressed={inviteLang === "both"} onClick={() => setInviteLang("both")}>Bilingual</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="ed-chip" aria-pressed="true">English</button>
                      <button type="button" className="ed-chip" aria-pressed="false" onClick={() => notify("Malayalam and bilingual wording aren't available on this design.")}>മലയാളം</button>
                      <button type="button" className="ed-chip" aria-pressed="false" onClick={() => notify("Malayalam and bilingual wording aren't available on this design.")}>Bilingual</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Functions" ? (
            <div className="ed-stack">
              <div className="ed-intro">
                <h2>Functions</h2>
                <p className="ed-lead">Time and place for each gathering on this design.</p>
              </div>
              {functions.map((kind) => {
                const isMain = kind === "main";
                return (
                  <div className="ed-fn" key={kind}>
                    <div className="ed-fn-head">
                      <input
                        className="ed-input"
                        aria-label="Function name"
                        readOnly={!namedLines}
                        value={isMain ? ceremonyLabel(template, draft) : receptionLabel(template, draft)}
                        onChange={(change) => {
                          if (!namedLines) return;
                          patchDraft({ lines: withEventName(draft.lines, isMain ? "ceremonyName" : "receptionName", change.target.value) });
                        }}
                      />
                      {isMain ? null : (
                        <button
                          type="button"
                          className="ed-remove"
                          aria-label={`Remove ${template.meta.reception}`}
                          onClick={() => {
                            update({
                              receptionOn: false,
                              sections: model.sections.map((item) => (item.id === "reception" ? { ...item, on: false } : item)),
                              draft: { ...draft, receptionTime: "", receptionVenue: "", receptionAddress: "" },
                            });
                            notify(`${template.meta.reception} removed. Use undo to bring it back.`);
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C45B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                          </svg>
                        </button>
                      )}
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
              {usesField(template, "lines") && template.id !== "shaadi" ? <PackFields id={template.id} lines={draft.lines} onChange={(lines) => patchDraft({ lines })} /> : null}
              {template.id === "shaadi" && usesField(template, "lines")
                ? festivitiesOf(draft.lines).map((item, index) => (
                    <div className="ed-fn" key={`${SHAADI_SHOTS[SHAADI_STORY_COUNT + index] ?? "festivity"}-${index}`}>
                      <div className="ed-fn-head">
                        <input className="ed-input" aria-label="Festivity name" value={item.name} onChange={(change) => patchFestivity(index, { name: change.target.value })} />
                        <button type="button" className="ed-remove" aria-label={`Remove ${item.name || "celebration"}`} onClick={() => removeFestivity(index)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C45B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                          </svg>
                        </button>
                      </div>
                      <input className="ed-input" aria-label="Hindi name" placeholder="Hindi name" value={item.hindi} onChange={(change) => patchFestivity(index, { hindi: change.target.value })} />
                      <input className="ed-input" aria-label="Day" placeholder="Day" value={item.day} onChange={(change) => patchFestivity(index, { day: change.target.value })} />
                      <div className="ed-grid-2">
                        <input className="ed-input" aria-label="When" placeholder="When" value={item.when} onChange={(change) => patchFestivity(index, { when: change.target.value })} />
                        <input className="ed-input" aria-label="Dress" placeholder="Dress" value={item.dress} onChange={(change) => patchFestivity(index, { dress: change.target.value })} />
                      </div>
                      <input className="ed-input" aria-label="Venue" placeholder="Venue" value={item.venue} onChange={(change) => patchFestivity(index, { venue: change.target.value })} />
                      <p className="ed-lead">Photograph · {item.name || "this celebration"}, under Design</p>
                    </div>
                  ))
                : null}
              {template.id === "shaadi" && usesField(template, "lines") ? (
                <button type="button" className="ed-add" onClick={addFestivity}>+ Add a celebration</button>
              ) : null}
              {template.meta.reception ? (
                <button
                  type="button"
                  className="ed-add"
                  onClick={() => {
                    if (model.receptionOn) {
                      notify(`This invitation has ${template.meta.ceremony} and ${template.meta.reception}.`);
                      return;
                    }
                    update({
                      receptionOn: true,
                      sections: model.sections.map((item) => (item.id === "reception" ? { ...item, on: true } : item)),
                    });
                  }}
                >
                  + Add {template.meta.reception}
                </button>
              ) : null}
              {usesField(template, "lat") ? (
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
              <div className="ed-intro">
                <h2>Design</h2>
                <p className="ed-lead">Colours this design can change. Layout, type, motion and the opening stay with it.</p>
              </div>
              {template.meta.themes.length ? (
                <div className="ed-field">
                  <span className="ed-label">Colour theme · <span style={{ fontWeight: 500, color: "#716A6D" }}>{themeName}</span></span>
                  <div className="ed-swatches">
                    {template.meta.themes.map((theme) => {
                      const tone = SWATCHES.find((item) => item.id === theme.id);
                      return (
                        <button key={theme.id} type="button" className="ed-swatch" aria-label={theme.name} aria-pressed={model.swatch === theme.id} style={{ background: tone?.cover ?? "#F6F0E6" }} onClick={() => pickSwatch(theme.id)}>
                          <i style={{ background: tone?.dot ?? "#A44B32" }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="ed-lead">This invitation keeps its own colours.</p>
              )}
              {photoShots.length ? (
              <div className="ed-field">
                <span className="ed-label">Photographs</span>
                <div className="ed-shots">
                  {photoShots.map((shot, index) => {
                    const photo = draft.photos[index];
                    const caption = captions[index] ?? { title: shot.label, text: "" };
                    return (
                      <div className="ed-shot" key={`${shot.label}-${index}`}>
                        {photo ? <img src={assetUrl(photo)} alt="" /> : <span className="ed-shot-empty" aria-hidden="true" />}
                        <div className="ed-shot-copy">
                          <label>
                            <span>Title</span>
                            <input className="ed-input" aria-label={`Title for ${shot.label}`} value={caption.title} onChange={(event) => patchNote(index, { title: event.target.value })} />
                          </label>
                          <label>
                            <span>Description</span>
                            <input className="ed-input" aria-label={`Description for ${shot.label}`} value={caption.text} placeholder="A line about this photograph" onChange={(event) => patchNote(index, { text: event.target.value })} />
                          </label>
                          <div className="ed-shot-actions">
                            <button
                              type="button"
                              aria-label={`${photo ? "Replace" : "Upload"} ${shot.label}`}
                              onClick={() => {
                                photoSlot.current = index;
                                photoRef.current?.click();
                              }}
                            >
                              {photo ? "Replace" : "Upload"}
                            </button>
                            {photo ? (
                              <button type="button" aria-label={`Remove ${shot.label}`} onClick={() => clearPhoto(index)}>
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <input
                  ref={photoRef}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(change) => {
                    const file = change.target.files?.[0];
                    change.target.value = "";
                    if (file) void setPhoto(photoSlot.current, file);
                  }}
                />
              </div>
              ) : null}
            </div>
          ) : null}

          {tab === "Sections" ? (
            <div className="ed-stack">
              <div className="ed-intro">
                <h2>Components</h2>
                <p className="ed-lead">Every piece on this design. Switches only hide pieces you can leave out.</p>
              </div>
              {model.sections.map((section) => {
                const hideable = section.configurable && HIDEABLE.has(section.id);
                return (
                  <div className={section.on ? "ed-row" : "ed-row off"} key={section.id}>
                    {hideable ? (
                      <input type="checkbox" checked={section.on} aria-label={`${section.on ? "Hide" : "Show"} ${section.label}`} onChange={() => toggleSection(section.id)} />
                    ) : null}
                    <div className="grow">
                      <b>{section.label}</b>
                      <small>{section.help}</small>
                    </div>
                  </div>
                );
              })}
              {usesField(template, "dress") ? (
                <div className="ed-field">
                  <label className="ed-label" htmlFor="ed-dress">Dress code</label>
                  <input id="ed-dress" className="ed-input" value={draft.dress} onChange={(change) => patchDraft({ dress: change.target.value })} />
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "RSVP" ? (
            <div className="ed-stack">
              <div className="ed-intro">
                <h2>RSVP form</h2>
                <p className="ed-lead">Guests reply on this invitation. The reply date is saved with it.</p>
              </div>
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-dl">Reply by</label>
                <input id="ed-dl" className="ed-input" type="date" value={draft.rsvpBy} onChange={(change) => patchDraft({ rsvpBy: change.target.value })} />
              </div>
              <div className="ed-field">
                <label className="ed-label" htmlFor="ed-email">Your email for replies</label>
                <input id="ed-email" className="ed-input" type="email" value={draft.hostEmail} onChange={(change) => patchDraft({ hostEmail: change.target.value })} />
              </div>
              <div className="ed-row">
                <div className="grow">
                  <b>Reply on the page</b>
                  <small>
                    Guests reply on the page.
                    {template.meta.rsvp.meal ? " They can note a meal." : ""}
                    {template.meta.rsvp.song ? " They can request a song." : ""}
                    {template.meta.rsvp.maxGuests > 0 ? ` The form allows up to ${template.meta.rsvp.maxGuests}.` : ""}
                  </small>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Music" ? (
            <div className="ed-stack">
              <div className="ed-intro">
                <h2>Background music</h2>
                <p className="ed-lead">{template.id === "thiruvizha" ? "One nadaswaram plays when guests tap the music button. Upload a file only to replace it." : "Plays when guests tap the music button. Add your own file."}</p>
              </div>
              <div className={draft.audio ? "ed-row ed-track" : "ed-row ed-track on"}>
                <button type="button" className="ed-play" aria-label="No music" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#CDC6C9" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
                </button>
                <div className="grow">
                  <b>{template.id === "thiruvizha" && !draft.audio ? "Nadaswaram" : "No music"}</b>
                  <small>{template.id === "thiruvizha" && !draft.audio ? "Included with this design" : "Silent"}</small>
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
                  ) : template.style === "vivah" ? (
                    <VivahInvite fields={previewFields} theme={vivahThemeOf(model.swatch)} />
                  ) : template.style === "beach" ? (
                    <BeachInvite fields={previewFields} theme={beachThemeOf(model.swatch)} />
                  ) : template.style === "home" ? (
                    <HomeInvite fields={previewFields} theme={homeThemeOf(model.swatch)} />
                  ) : template.style === "shaadi" ? (
                    <ShaadiInvite fields={previewFields} theme={shaadiThemeOf(model.swatch)} />
                  ) : template.style === "thiruvizha" ? (
                    <ThiruvizhaInvite fields={previewFields} theme={thiruThemeOf(model.swatch)} lang={inviteLang} allowMusic={model.sections.find((item) => item.id === "music")?.on !== false} />
                  ) : template.style === "peace" ? (
                    <PeaceInvite fields={previewFields} theme={peaceThemeOf(model.swatch)} allowMusic={model.sections.find((item) => item.id === "music")?.on !== false} />
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
                <Link className="ed-studio" to="/guests">Go to guest list</Link>
              </div>
            ) : (
              <button type="button" className="ed-go" onClick={() => void publish()}>Publish</button>
            )}
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={toastTone === "bad" ? "ed-toast bad" : "ed-toast"} role={toastTone === "bad" ? "alert" : "status"}>
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
  if (!signedIn) return editor;
  return (
    <div className="board ed-board">
      <AppMenu current="/templates" name={hostName} signedIn />
      {editor}
    </div>
  );
}
