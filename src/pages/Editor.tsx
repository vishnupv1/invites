import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnnaInvite, type AnnaTheme } from "../components/AnnaInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { BaptismInvite } from "../components/BaptismInvite";
import { BeachInvite } from "../components/BeachInvite";
import { BotanicaInvite } from "../components/BotanicaInvite";
import { GrandDoorInvite } from "../components/GrandDoorInvite";
import { GrandEnvelopeInvite } from "../components/GrandEnvelopeInvite";
import { HeavenlyInvite } from "../components/HeavenlyInvite";
import { PullInvite } from "../components/PullInvite";
import { InlandInvite } from "../components/InlandInvite";
import { HomeInvite } from "../components/HomeInvite";
import { VivahInvite } from "../components/VivahInvite";
import { GazalInvite } from "../components/GazalInvite";
import { ShaadiInvite } from "../components/ShaadiInvite";
import { ThiruvizhaInvite, type ThiruvizhaLang } from "../components/ThiruvizhaInvite";
import { PastalInvite } from "../components/PastalInvite";
import { PalaceInvite } from "../components/PalaceInvite";
import { MoonlitInvite } from "../components/MoonlitInvite";
import { PeaceInvite } from "../components/PeaceInvite";
import { SHAADI_SHOTS, SHAADI_STORY_COUNT, festivitiesOf, shaadiPhotoShots, type ShaadiFunction } from "../components/shaadi";
import { notesJson, photoNotes, spliceNotes, type PhotoNote } from "../data/photos";
import { InviteView } from "../components/InviteView";
import { Checkout } from "../components/Checkout";
import { GuestAuthDialog } from "../components/GuestAuthDialog";
import { CatalogDemo } from "./AllTemplates";
import { getEvent } from "../data/events";
import { eventName, withEventName } from "../data/custom";
import { DateField, TimeField } from "../components/WhenFields";
import { PackFields } from "./PackFields";
import { formatPrice, getTemplate, hasComponent, sampleFor, usesField } from "../data/templates";
import { assetUrl, ensureSession, getInviteRecord, getToken, publishSaved, saveDraft, updateInvite, uploadMedia, type EditorState } from "../api";
import { searchPlaces, type PlaceHit } from "../lib/media";
import { annaThemeOf, baptismThemeOf, beachThemeOf, botanicaThemeOf, homeThemeOf, moonlitThemeOf, palaceThemeOf, pastalThemeOf, peaceThemeOf, pullThemeOf, shaadiThemeOf, thiruThemeOf, vivahThemeOf } from "../lib/themes";
import { useLibrary } from "../state";
import { useSession } from "../session";
import { AppMenu } from "../components/AppMenu";
import { hold, SmartButton, Spinner } from "../components/Loader";
import { Notice, type NoticeTone } from "../components/Notice";
import { Breadcrumbs } from "../components/Breadcrumbs";
import type { EventId, InviteFields, Template } from "../types";
import { formatShortDate } from "../lib/dates";
import { trackPublish, trackShareWhatsApp, trackStartDesign } from "../lib/analytics";
import { guestInviteUrl, whatsAppShareHref } from "../lib/share";
import { useFonts } from "../lib/fonts";
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
  { id: "burgundy", name: "Burgundy & gold", cover: "#4A0716", dot: "#F3DDA8" },
  { id: "post", name: "Inland post", cover: "#CFE2F2", dot: "#C8342B" },
  { id: "wine", name: "Wine & gold", cover: "#1A0C0A", dot: "#E8C987" },
  { id: "paper", name: "Blush paper", cover: "#F3E2D8", dot: "#6E4A42" },
  { id: "night", name: "Moonlit gold", cover: "#0B1226", dot: "#E9BE6A" },
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

function editorState(model: Model): EditorState {
  return {
    swatch: model.swatch,
    receptionOn: model.receptionOn,
    sections: model.sections.map((item) => ({ id: item.id, on: item.on })),
  };
}

function modelFromSaved(template: Template, fields: InviteFields, editor?: EditorState | null): Model {
  const merged = { ...sampleFor(template, fields.event), ...fields };
  if (template.id === "peace" && merged.detail === "Priya & Vivek") merged.detail = "Our guest";
  const base = sectionsFor(template, merged);
  const saved = new Map((editor?.sections ?? []).map((item) => [item.id, item.on]));
  return {
    draft: merged,
    receptionOn: editor?.receptionOn ?? Boolean(merged.receptionVenue || merged.receptionTime),
    swatch: editor?.swatch || template.meta.defaultTheme,
    sections: base.map((item) => (saved.has(item.id) ? { ...item, on: Boolean(saved.get(item.id)) } : item)),
  };
}

function localDraftKey(templateId: string) {
  return `invitesready.editor-draft.v1.${templateId}`;
}

function readLocal(templateId: string) {
  try {
    const raw = localStorage.getItem(localDraftKey(templateId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { fields?: InviteFields; editor?: EditorState | null };
    if (!parsed.fields) return null;
    return parsed;
  } catch {
    return null;
  }
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

export function Editor({
  embedded = false,
  templateId: templateIdProp,
  eventId: eventIdProp,
  onInvite,
  onSummary,
}: {
  embedded?: boolean;
  templateId?: string;
  eventId?: string;
  onInvite?: (id: string) => void;
  onSummary?: (summary: { names: string; date: string; time: string; venue: string }) => void;
} = {}) {
  useFonts("Cormorant Garamond", "Pinyon Script");
  const { id: routeId } = useParams();
  const id = templateIdProp || routeId;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const template = getTemplate(id);
  const inviteQuery = embedded ? "" : (params.get("invite") ?? "");
  const eventQuery = eventIdProp || params.get("event") || undefined;
  const { owns, purchase, remember, invites, ready: libraryReady } = useLibrary();
  useEffect(() => {
    if (embedded || !template) return;
    trackStartDesign(template);
  }, [embedded, template]);
  const onInviteRef = useRef(onInvite);
  const onSummaryRef = useRef(onSummary);
  onInviteRef.current = onInvite;
  onSummaryRef.current = onSummary;
  const { signedIn, host } = useSession();
  const hostName = host?.name ?? "";
  const [model, setModel] = useState<Model | null>(() => {
    if (!template || inviteQuery) return null;
    const local = readLocal(template.id);
    if (local?.fields) return modelFromSaved(template, local.fields, local.editor);
    return modelFor(template, eventQuery);
  });
  const [past, setPast] = useState<Model[]>([]);
  const [future, setFuture] = useState<Model[]>([]);
  const [saveLabel, setSaveLabel] = useState(inviteQuery ? "Opening your invitation…" : template && readLocal(template.id) ? "Saved on this device" : "Draft");
  const [tab, setTab] = useState<Tab>("Details");
  const [sheet, setSheet] = useState(true);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [expanded, setExpanded] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [pubPhase, setPubPhase] = useState<"idle" | "loading" | "done">("idle");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<NoticeTone>("ok");
  const [showQr, setShowQr] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<"save" | "publish">("publish");
  const [playing, setPlaying] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteLang, setInviteLang] = useState<ThiruvizhaLang>("both");
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(1600);
  const modelRef = useRef(model);
  const inviteIdRef = useRef(inviteQuery);
  const statusRef = useRef<"draft" | "live">("draft");
  const codeRef = useRef("");
  const dirtyRef = useRef(false);
  const creatingRef = useRef<Promise<void> | null>(null);
  const resumedRef = useRef(false);
  const persistRef = useRef<() => Promise<void>>(async () => undefined);
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const photoSlot = useRef(0);
  const audioPickRef = useRef<HTMLInputElement>(null);
  modelRef.current = model;

  useEffect(() => {
    if (!template || !inviteQuery) return;
    if (inviteIdRef.current === inviteQuery && modelRef.current) return;
    let cancel = false;
    setSaveLabel("Opening your invitation…");
    getInviteRecord(inviteQuery)
      .then((record) => {
        if (cancel) return;
        if (record.templateId !== template.id) {
          if (!embedded) navigate(`/create/${record.templateId}?invite=${record.id}`, { replace: true });
          return;
        }
        inviteIdRef.current = record.id;
        statusRef.current = record.status === "live" ? "live" : "draft";
        codeRef.current = record.code;
        dirtyRef.current = false;
        setModel(modelFromSaved(template, record.fields, record.editor));
        setSaveLabel(statusRef.current === "live" ? "Saved" : "Draft saved");
        if (statusRef.current === "live") setLink(guestInviteUrl(record.code, template.id));
      })
      .catch(() => {
        if (cancel) return;
        setSaveLabel("Could not open that invitation");
        if (!modelRef.current) setModel(modelFor(template, eventQuery));
      });
    return () => {
      cancel = true;
    };
  }, [template, inviteQuery, navigate, params]);

  useEffect(() => {
    if (resumedRef.current || !template || !signedIn || !libraryReady || inviteQuery || params.get("fresh") === "1") return;
    resumedRef.current = true;
    const local = readLocal(template.id);
    const existing = invites.find((item) => item.templateId === template.id && item.status === "draft");
    if (existing) {
      inviteIdRef.current = existing.id;
      codeRef.current = existing.code;
      statusRef.current = "draft";
      onInviteRef.current?.(existing.id);
      if (dirtyRef.current || local?.fields) {
        dirtyRef.current = true;
        void persistRef.current();
      } else if (embedded) {
        getInviteRecord(existing.id)
          .then((record) => {
            if (record.templateId !== template.id) return;
            setModel(modelFromSaved(template, record.fields, record.editor));
            setSaveLabel("Draft saved");
          })
          .catch(() => undefined);
      } else {
        navigate(`/create/${template.id}?invite=${existing.id}`, { replace: true });
      }
      return;
    }
    if (local?.fields) {
      dirtyRef.current = true;
      void persistRef.current();
    }
  }, [template, signedIn, libraryReady, inviteQuery, invites, navigate, params, remember]);

  useEffect(() => {
    if (!model) return;
    if (signedIn && !inviteQuery && !inviteIdRef.current) dirtyRef.current = true;
    if (!dirtyRef.current) return;
    const timer = window.setTimeout(() => {
      void persistRef.current();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [model, signedIn, inviteQuery]);

  useEffect(() => {
    const flush = () => {
      if (dirtyRef.current) void persistRef.current();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  useEffect(() => {
    if (!embedded || !model) return;
    onSummaryRef.current?.({
      names: model.draft.names,
      date: model.draft.date,
      time: model.draft.time,
      venue: model.draft.venue,
    });
  }, [embedded, model]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

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

  persistRef.current = async () => {
    const current = modelRef.current;
    if (!current || !template || !dirtyRef.current) return;
    dirtyRef.current = false;
    const fields = shownFields(current);
    const editor = editorState(current);
    if (!getToken()) {
      localStorage.setItem(localDraftKey(template.id), JSON.stringify({ fields, editor, at: Date.now() }));
      setSaveLabel("Saved on this device");
      return;
    }
    setSaveLabel("Saving…");
    try {
      if (!inviteIdRef.current) {
        if (!creatingRef.current) {
          creatingRef.current = saveDraft(template.id, fields, editor).then((saved) => {
            inviteIdRef.current = saved.id;
            codeRef.current = saved.code;
            statusRef.current = saved.status === "live" ? "live" : "draft";
            remember(saved);
            localStorage.removeItem(localDraftKey(template.id));
            onInviteRef.current?.(saved.id);
            if (!embedded) navigate(`/create/${template.id}?invite=${saved.id}`, { replace: true });
          });
        }
        await creatingRef.current;
        creatingRef.current = null;
      }
      const latest = modelRef.current;
      if (inviteIdRef.current && latest) {
        const nextFields = shownFields(latest);
        const nextEditor = editorState(latest);
        try {
          const saved = await updateInvite(inviteIdRef.current, template.id, nextFields, nextEditor);
          remember(saved);
          localStorage.removeItem(localDraftKey(template.id));
        } catch (reason) {
          if (!(reason instanceof Error) || reason.message !== "Invitation not found.") throw reason;
          inviteIdRef.current = "";
          const saved = await saveDraft(template.id, nextFields, nextEditor);
          inviteIdRef.current = saved.id;
          codeRef.current = saved.code;
          statusRef.current = saved.status === "live" ? "live" : "draft";
          remember(saved);
          localStorage.removeItem(localDraftKey(template.id));
          onInviteRef.current?.(saved.id);
        }
      }
      setSaveLabel(statusRef.current === "live" ? "Saved" : "Draft saved");
    } catch (reason) {
      creatingRef.current = null;
      dirtyRef.current = true;
      setSaveLabel("Could not save");
      setToastTone("bad");
      setToast(reason instanceof Error ? reason.message : "Could not save this invitation.");
    }
  };

  if (!template) return embedded ? null : <Navigate to="/" replace />;
  if (!model) return <div className="ed-root"><p className="ed-save wait-line"><Spinner /> Opening your invitation…</p></div>;

  const needsPay = !owns(template.id, template.free);
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

  function notify(message: string, tone: NoticeTone = "ok") {
    setToastTone(tone);
    setToast(message);
  }

  function update(patch: Partial<Model>) {
    const current = modelRef.current;
    if (!current) return;
    setPast((items) => [...items.slice(-40), current]);
    setFuture([]);
    setModel({ ...current, ...patch });
    dirtyRef.current = true;
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
    notify(`${name} removed. Use undo to bring it back.`, "warn");
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
      dirtyRef.current = true;
      return items.slice(0, -1);
    });
  }

  function redo() {
    setFuture((items) => {
      if (!items.length || !modelRef.current) return items;
      const next = items[0];
      setPast((history) => [...history.slice(-40), modelRef.current as Model]);
      setModel(next);
      dirtyRef.current = true;
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
    const email = current.hostEmail.includes("@") ? current.hostEmail : `host-${crypto.randomUUID()}@invitesready.local`;
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
      notify("Add a song file first. These invitations don't include a recording.", "warn");
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
      notify(section?.configurable ? "Edit this piece in the other tabs. It stays on the invitation." : "This piece stays with the design.", "warn");
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
    notify("This invitation keeps its own colours.", "warn");
  }

  async function publish() {
    const current = modelRef.current;
    if (!current || !template) return;
    if (!getToken()) {
      setAuthIntent("publish");
      setAuthOpen(true);
      return;
    }
    const fields = shownFields(current);
    if (!fields.names.trim() || !fields.date) {
      setError("Add the names and a date before publishing.");
      return;
    }
    setPubPhase("loading");
    try {
      dirtyRef.current = true;
      await persistRef.current();
      if (!inviteIdRef.current) {
        setError("Could not save this invitation.");
        return;
      }
      if (statusRef.current === "live") {
        setError("");
        setLink(guestInviteUrl(codeRef.current, template.id));
        setShowQr(false);
        return;
      }
      const saved = await publishSaved(inviteIdRef.current);
      statusRef.current = "live";
      codeRef.current = saved.code;
      remember(saved);
      setError("");
      setSaveLabel("Saved");
      setPubPhase("done");
      await hold();
      setLink(guestInviteUrl(saved.code, template.id));
      setShowQr(false);
      setSaveLabel("Saved");
      trackPublish(template);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish.");
    } finally {
      setPubPhase("idle");
    }
  }

  function askToSignIn(intent: "save" | "publish") {
    setAuthIntent(intent);
    setAuthOpen(true);
  }

  function onSignedIn() {
    setAuthOpen(false);
    dirtyRef.current = true;
    void persistRef.current();
    if (authIntent === "publish") {
      setPublishOpen(true);
    }
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    notify("Link copied.");
  }

  const editor = (
    <div className={`ed-root${embedded ? " ed-embedded" : ""}${sheet ? " ed-sheet" : ""}${!embedded && !signedIn ? " ed-as-guest" : ""}${expanded ? " is-expanded" : ""}`}>
      <header className="ed-top">
        <div className="ed-brand">
          {embedded ? null : (
          <Link className="ed-back" to={signedIn ? "/templates" : "/browse"} aria-label="Back to templates">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </Link>
          )}
          <div>
            <div className="ed-title">{title}</div>
            <div className="ed-save">
              {saveLabel === "Saving…" || saveLabel.startsWith("Opening") ? <Spinner /> : <span className="ed-dot" />}
              {saveLabel}
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
          {signedIn || embedded ? null : (
            <>
              <span className="ed-guest">Guest view</span>
              <button type="button" className="ed-iconbtn" onClick={() => askToSignIn("save")}>
                Save
              </button>
            </>
          )}
          {embedded ? null : (
          <button type="button" className="ed-publish" onClick={() => {
            setError("");
            dirtyRef.current = true;
            void persistRef.current();
            if (!getToken()) {
              askToSignIn("publish");
              return;
            }
            if (statusRef.current === "live" && codeRef.current) setLink(guestInviteUrl(codeRef.current, template.id));
            setPublishOpen(true);
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" />
            </svg>
            {statusRef.current === "live" ? (
              <span>Share</span>
            ) : (
              <>
                <span className="ed-pub-long">Publish & share</span>
                <span className="ed-pub-short">Publish</span>
              </>
            )}
          </button>
          )}
        </div>
      </header>
      {embedded ? null : (
        <>
          <Breadcrumbs
            className="ed-crumbs"
            items={signedIn
              ? [
                  { label: "Dashboard", to: "/studio" },
                  { label: "Templates", to: "/templates" },
                  { label: template.name },
                ]
              : [
                  { label: "Home", to: "/" },
                  { label: "Templates", to: "/browse" },
                  { label: template.name },
                ]}
          />
          {signedIn ? null : <div className="ed-guest-strip">Designing as a guest · {saveLabel === "Draft" ? "your changes save on this phone" : saveLabel.toLowerCase()}</div>}
        </>
      )}

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
              <Icon d={item.icon} stroke={sheet && tab === item.id ? "#D81B60" : "#6B5A62"} />
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
                    <DateField id="ed-date" label="Date" value={draft.date} onChange={(date) => patchDraft({ date })} />
                  </div>
                  <div className="ed-field">
                    <label className="ed-label" htmlFor="ed-time">Time</label>
                    <TimeField id="ed-time" label="Time" value={draft.time} onChange={(time) => patchDraft({ time })} />
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
                      <button type="button" className="ed-chip" aria-pressed="false" onClick={() => notify("Malayalam and bilingual wording aren't available on this design.", "warn")}>മലയാളം</button>
                      <button type="button" className="ed-chip" aria-pressed="false" onClick={() => notify("Malayalam and bilingual wording aren't available on this design.", "warn")}>Bilingual</button>
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
                            notify(`${template.meta.reception} removed. Use undo to bring it back.`, "warn");
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C45B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="ed-grid-2">
                      <DateField label="Date" value={draft.date} onChange={(date) => patchDraft({ date })} />
                      <TimeField
                        label="Time"
                        value={isMain ? draft.time : draft.receptionTime}
                        onChange={(time) => patchDraft(isMain ? { time } : { receptionTime: time })}
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
                      notify(`This invitation has ${template.meta.ceremony} and ${template.meta.reception}.`, "warn");
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
                      aria-busy={searching || undefined}
                      onClick={async () => {
                        if (!placeQuery.trim()) return;
                        setSearching(true);
                        try {
                          setPlaces(await searchPlaces(placeQuery.trim()));
                        } catch (reason) {
                          notify(reason instanceof Error ? reason.message : "Could not search places.", "bad");
                        } finally {
                          setSearching(false);
                        }
                      }}
                    >
                      {searching ? <Spinner /> : "Search"}
                      {searching ? <span className="spin-sr">Searching</span> : null}
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
                <DateField id="ed-dl" label="Reply by" value={draft.rsvpBy} onChange={(rsvpBy) => patchDraft({ rsvpBy })} />
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
              <button
                type="button"
                className="ed-expand"
                aria-pressed={expanded}
                aria-label={expanded ? "Leave full screen" : "View full screen"}
                onClick={() => setExpanded((open) => !open)}
              >
                {expanded ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                )}
              </button>
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
                  ) : template.style === "botanica" ? (
                    <BotanicaInvite fields={previewFields} theme={botanicaThemeOf(model.swatch)} />
                  ) : template.style === "heavenly" ? (
                    <HeavenlyInvite fields={previewFields} />
                  ) : template.style === "grandoor" ? (
                    <GrandDoorInvite fields={previewFields} />
                  ) : template.style === "grandenvelope" ? (
                    <GrandEnvelopeInvite fields={previewFields} />
                  ) : template.style === "pull" ? (
                    <PullInvite fields={previewFields} theme={pullThemeOf(model.swatch)} />
                  ) : template.style === "inland" ? (
                    <InlandInvite fields={previewFields} />
                  ) : template.style === "pastal" ? (
                    <PastalInvite fields={previewFields} theme={pastalThemeOf(model.swatch)} />
                  ) : template.style === "palace" ? (
                    <PalaceInvite fields={previewFields} theme={palaceThemeOf(model.swatch)} />
                  ) : template.style === "moonlit" ? (
                    <MoonlitInvite fields={previewFields} theme={moonlitThemeOf(model.swatch)} />
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
                <h2>{link ? "Your invitation is live" : needsPay ? "Pay and publish" : "Publish your invitation"}</h2>
                <p className="ed-lead">{link ? "Share it with your guests now." : needsPay ? "Your draft is saved in My drafts. Watch it as a guest, then pay once to publish." : "Publish when the preview looks right."}</p>
              </div>
              <button type="button" className="ed-x" aria-label="Close" onClick={() => { setPublishOpen(false); setPubPhase("idle"); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
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
                  <button type="button" onClick={() => {
                    trackShareWhatsApp(template.name);
                    window.open(whatsAppShareHref(link), "_blank", "noopener");
                  }}>
                    <img src="/whatsapp.png" alt="" width={22} height={22} />
                    WhatsApp
                  </button>
                  <button type="button" onClick={() => void copyLink()}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D81B60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 9h12v12H9zM5 15V5a2 2 0 0 1 2-2h10" /></svg>
                    Copy link
                  </button>
                  <button type="button" onClick={() => setShowQr(true)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM17 17h4v4h-4" /></svg>
                    QR code
                  </button>
                </div>
                {showQr ? <img className="ed-qr" alt="QR code for the invitation" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`} /> : null}
                <Link className="ed-studio" to={signedIn ? "/guests" : "/browse"}>{signedIn ? "Go to guest list" : "Browse templates"}</Link>
              </div>
            ) : (
              needsPay ? (
                <div className="ed-stack">
                  <button type="button" className="ed-go quiet" onClick={() => { setPublishOpen(false); setDemoOpen(true); }}>See your demo</button>
                  <button type="button" className="ed-go" onClick={() => setPayOpen(true)}>Pay {formatPrice(template)} and publish</button>
                </div>
              ) : (
                <SmartButton className="ed-go" phase={pubPhase} idle="Publish invite" onClick={() => void publish()} />
              )
            )}
          </div>
        </div>
      ) : null}

      {toast ? <Notice message={toast} tone={toastTone} onClose={() => setToast("")} /> : null}
      {demoOpen ? <CatalogDemo template={template} fields={previewFields} onClose={() => { setDemoOpen(false); setPublishOpen(true); }} /> : null}
      {authOpen ? (
        <GuestAuthDialog
          heading="Sign in to save your invitation"
          onClose={() => setAuthOpen(false)}
          onDone={onSignedIn}
        />
      ) : null}
      {payOpen ? (
        <Checkout
          template={template}
          detail={[draft.names.trim(), event.label, draft.date ? formatShortDate(draft.date) : ""].filter(Boolean).join(" · ")}
          onClose={() => setPayOpen(false)}
          onPurchased={async (coupon, payment) => {
            await purchase(template.id, coupon, payment);
            setPayOpen(false);
            await publish();
          }}
        />
      ) : null}
    </div>
  );
  if (embedded || !signedIn) return editor;
  return (
    <div className="board ed-board">
      <AppMenu current="/templates" name={hostName} signedIn />
      {editor}
    </div>
  );
}
