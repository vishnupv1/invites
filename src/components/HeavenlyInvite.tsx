import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem, type StoryBeat } from "../data/custom";
import type { InviteFields } from "../types";
import { useFonts } from "../lib/fonts";
import { InstagramLink } from "./InstagramLink";
import { Spinner } from "./Loader";
import "./heavenly.css";

type Reply = { name: string; note: string; attending: boolean };
type Wish = { name: string; note: string; attending?: boolean };
type Phase = "closed" | "opening" | "world" | "invite";

const ART = {
  doors: "/heavenly/doors.jpg",
  glow: "/heavenly/doors-glow.jpg",
  world: "/heavenly/world.jpg",
  gate: "/heavenly/gate.jpg",
  portal: "/heavenly/portal.jpg",
};
const SAMPLE_PHOTOS = ["/heavenly/sample-1.jpg", "/heavenly/sample-2.jpg", "/heavenly/sample-3.jpg", "/heavenly/sample-4.jpg", ART.world, ART.portal];
const STORY_SLOTS = [2, 1, 3];
const PETALS = ["#F7A8B8", "#F3C2C9", "#E8789A", "#FFD9C2"];
const AVATARS = ["#A97B33", "#B8586A", "#6E8B74", "#8A6A9A"];
const MEALS = [
  ["veg", "Vegetarian"],
  ["nonveg", "Non-veg"],
  ["vegan", "Vegan"],
] as const;
const EVENT_ICONS = [
  "M3 11h18M5 11V7a7 7 0 0 1 14 0v4M8 21h8M12 15v6",
  "M8 14a5 5 0 1 0 0-.01M16 14a5 5 0 1 0 0-.01M12 4l2 3h-4z",
  "M8 2l1 7a3 3 0 0 1-6 0l1-7zM20 2l1 7a3 3 0 0 1-6 0l1-7zM6 12v8M18 12v8M3 20h6M15 20h6",
];
const SAMPLE_REPLIES: Row[] = [
  { key: "s1", name: "Meera & Karthik", attending: true, guests: 2, msg: "We have been waiting for this day forever! See you in Munnar.", when: "2 days ago" },
  { key: "s2", name: "Sanjana Iyer", attending: true, guests: 1, msg: "The doors gave me goosebumps. Cannot wait to dance at the reception!", when: "3 days ago" },
  { key: "s3", name: "The Menon family", attending: true, guests: 4, msg: "Wishing you a lifetime of love and laughter.", when: "4 days ago" },
  { key: "s4", name: "Rahul Varma", attending: false, guests: 0, msg: "So sorry to miss it — sending all my love from Toronto.", when: "5 days ago" },
];
const OPENING_MS = 3200;
const WORLD_MS = 4400;
const DESK_MIN = 760;

type Row = { key: string; name: string; msg: string; when: string; attending: boolean; guests: number; fresh?: boolean };

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  const first = parts[0] || "Aarav";
  const second = parts[1] || (parts[0] ? "" : "Riya");
  return { first, second, a: (first[0] ?? "").toUpperCase(), b: (second[0] ?? "").toUpperCase() };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function numericDate(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(day.getDate())} · ${pad(day.getMonth() + 1)} · ${day.getFullYear()}`;
}

function longDate(date: string) {
  const day = dayOf(date);
  return day ? day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : date;
}

function targetOf(date: string, time: string) {
  const stamp = new Date(`${date}T${time || "17:00"}:00+05:30`);
  return Number.isNaN(stamp.getTime()) ? 0 : stamp.getTime();
}

/** Reads "Sat, 13 Feb · 7:30 PM" style programme times; falls back to the wedding day. */
function whenOf(text: string, date: string, time: string) {
  const base = dayOf(date) ?? new Date();
  const dayMatch = text.match(/(\d{1,2})\s+([A-Za-z]{3,})/);
  const month = dayMatch ? new Date(`${dayMatch[2].slice(0, 3)} 1, 2000`).getMonth() : NaN;
  const day = dayMatch && !Number.isNaN(month) ? new Date(base.getFullYear(), month, Number(dayMatch[1])) : base;
  const clock = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  let hour = Number((time || "17:00").split(":")[0]);
  let minute = Number((time || "17:00").split(":")[1] ?? 0);
  if (clock) {
    hour = (Number(clock[1]) % 12) + (clock[3].toUpperCase() === "PM" ? 12 : 0);
    minute = Number(clock[2] ?? 0);
  }
  day.setHours(hour, minute, 0, 0);
  return day;
}

function calendarLink(title: string, start: Date, location: string) {
  const stamp = (value: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}T${pad(value.getHours())}${pad(value.getMinutes())}00`;
  };
  const end = new Date(start.getTime() + 2 * 3600000);
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${stamp(start)}/${stamp(end)}`, location });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function rowFromWish(wish: Wish, index: number): Row {
  const match = wish.note.match(/^([\s\S]*?)\s·\s(\d+)\sguests?\b/);
  const attending = wish.attending ?? true;
  return {
    key: `w-${index}-${wish.name}`,
    name: wish.name,
    msg: (match ? match[1] : wish.note).trim(),
    when: "",
    attending,
    guests: attending ? Number(match?.[2] ?? 1) : 0,
  };
}

function scrollHost(element: HTMLElement) {
  let parent = element.parentElement;
  while (parent) {
    const overflow = getComputedStyle(parent).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && parent.scrollHeight > parent.clientHeight) return parent;
    parent = parent.parentElement;
  }
  return null;
}

function lantern(x: number, y: number, size: number): CSSProperties {
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    margin: `-${size / 2}px 0 0 -${size / 2}px`,
    animationDuration: `${1.2 + (x % 5) * 0.2}s`,
  };
}

/**
 * Lays the doorway over the photographed doors. The door outline is stored as
 * fractions of each source image, then mapped through the same cover-fit the
 * background uses, so the swinging leaves line up with the painted doors at any
 * frame size.
 */
function geometry(W: number, H: number) {
  const D = W >= DESK_MIN;
  const G = D
    ? { closed: ART.gate, glow: ART.gate, IW: 1672, IH: 941, f: [0.3915, 0.613, 0.5024, 0.138, 0.2795, 0.766], lan: [[0.338, 0.409], [0.664, 0.409], [0.084, 0.627], [0.179, 0.685], [0.34, 0.696], [0.66, 0.696], [0.816, 0.685], [0.924, 0.627], [0.789, 0.33]], CE: 3.7 }
    : { closed: ART.doors, glow: ART.glow, IW: 760, IH: 1350, f: [0.227, 0.787, 0.4995, 0.153, 0.261, 0.757], lan: [[0.1, 0.415], [0.9, 0.415], [0.095, 0.71], [0.9, 0.71]], CE: 2.75 };
  const sc = Math.max(W / G.IW, H / G.IH);
  const dW = G.IW * sc;
  const dH = G.IH * sc;
  const oX = (W - dW) / 2;
  const oY = (H - dH) / 2;
  const fx = (f: number) => oX + f * dW;
  const fy = (f: number) => oY + f * dH;
  const [L, R, C, T, Sh, B] = [fx(G.f[0]), fx(G.f[1]), fx(G.f[2]), fy(G.f[3]), fy(G.f[4]), fy(G.f[5])];
  const curve: [number, number][] = [];
  for (let k = 0; k <= 12; k += 1) {
    const u = k / 12;
    curve.push([L + u * (C - L), Sh - (Sh - T) * (1 - Math.pow(1 - u, 1.7))]);
  }
  const mirror = (points: [number, number][]) => points.map(([x, y]) => [2 * C - x, y] as [number, number]);
  const full: [number, number][] = [[L, B], ...curve, ...mirror(curve.slice(0, -1).reverse()), [R, B]];
  const leftPts: [number, number][] = [[L, B], ...curve, [C, B]];
  const rightPts: [number, number][] = [[C, B], ...mirror(curve.slice().reverse()), [R, B]];
  const poly = (points: [number, number][], dx: number, dy: number) =>
    `polygon(${points.map(([x, y]) => `${(x - dx).toFixed(1)}px ${(y - dy).toFixed(1)}px`).join(", ")})`;
  const cx = C;
  const cy = (T + B) / 2;
  const origin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
  // The world picture is framed by another doorway. The phone design (390×844)
  // finishes at scale 1.72, which leaves that frame outside the screen so the
  // card sits in the garden. Match that crop at every window size, or a wide
  // screen stops at the second doorway.
  const worldCover = Math.max(W / 760, H / 1350);
  const phoneCover = Math.max(390 / 760, 844 / 1350);
  const arrivedWidth = 390 / phoneCover / 1.72;
  const WT = W / worldCover / arrivedWidth;
  const WS = WT / (1.72 / 1.32);
  const leafBg = (x0: number): CSSProperties => ({
    backgroundImage: `url(${G.glow})`,
    backgroundSize: `${dW.toFixed(1)}px ${dH.toFixed(1)}px`,
    backgroundPosition: `${(oX - x0).toFixed(1)}px ${(oY - T).toFixed(1)}px`,
  });
  const wsc = Math.max(W / 760, H / 1350);
  const wdW = 760 * wsc;
  const wdH = 1350 * wsc;
  const woX = (W - wdW) / 2;
  const woY = (H - wdH) / 2;
  const flash = `radial-gradient(circle at ${origin}, #FFFBEF 0%, #FFE6B0 45%, #F5C77A 100%)`;
  return {
    D,
    G,
    origin,
    cardWidth: D ? 400 : Math.min(330, W - 40),
    world: { transformOrigin: origin, ["--ws" as string]: WS.toFixed(4), ["--wt" as string]: WT.toFixed(4) } as CSSProperties,
    flash,
    cam: { transformOrigin: origin, ["--ce" as string]: String(G.CE) } as CSSProperties,
    doorWorld: { clipPath: poly(full, 0, 0) } as CSSProperties,
    doorWorldImg: { backgroundImage: `url(${ART.world})`, transformOrigin: origin, ["--we" as string]: (WS / G.CE).toFixed(3) } as CSSProperties,
    doorLight: {
      clipPath: poly(full, 0, 0),
      background: `radial-gradient(ellipse at ${origin}, #FFFFFF 0%, #FFF3D0 30%, rgba(255,214,140,0.85) 65%, rgba(255,190,110,0.6) 100%)`,
    } as CSSProperties,
    leaves: { perspective: `${Math.round((R - L) * 3.2)}px`, perspectiveOrigin: origin } as CSSProperties,
    leafL: { left: L, top: T, width: C - L, height: B - T, clipPath: poly(leftPts, L, T), ...leafBg(L) } as CSSProperties,
    leafR: { left: C, top: T, width: R - C, height: B - T, clipPath: poly(rightPts, C, T), ...leafBg(C) } as CSSProperties,
    rays: { left: Math.round(cx - H), top: Math.round(cy - H), width: H * 2, height: H * 2 } as CSSProperties,
    floor: { left: Math.round(cx - W * 0.6), top: Math.round(B - 40), width: Math.round(W * 1.2), height: Math.round(H - B + 80) } as CSSProperties,
    glowLine: { left: C - 4, top: T, height: B - T } as CSSProperties,
    doorLanterns: G.lan.map(([x, y]) => lantern((fx(x) / W) * 100, (fy(y) / H) * 100, D ? 70 : 80)),
    worldLanterns: [[0.08, 0.68], [0.18, 0.62], [0.35, 0.57], [0.68, 0.57], [0.87, 0.63], [0.08, 0.88]].map(([x, y]) =>
      lantern(((woX + x * wdW) / W) * 100, ((woY + y * wdH) / H) * 100, D ? 110 : 60),
    ),
    glints: Array.from({ length: 8 }, (_, i) => ({
      left: `${32 + ((i * 7) % 38)}%`,
      top: `${67 + (i % 4) * 1.6}%`,
      width: 18 + (i % 3) * 10,
      animationDuration: `${1.8 + (i % 3) * 0.5}s`,
      animationDelay: `${i * 0.3}s`,
    })),
    petals: Array.from({ length: D ? 14 : 12 }, (_, i) => ({
      size: 10 + (i % 3) * 6,
      color: PETALS[i % 4],
      outer: {
        left: (i * 67) % W,
        ["--px" as string]: `${(i % 2 ? 1 : -1) * 40}px`,
        ["--py" as string]: `${H + 60}px`,
        animationDuration: `${9 + (i % 4) * 2}s`,
        animationDelay: `-${i * 1.1}s`,
      } as CSSProperties,
      inner: { animationDuration: `${3 + (i % 3)}s` } as CSSProperties,
    })),
    motes: Array.from({ length: 14 }, (_, i) => ({
      left: (i * 53) % W,
      top: Math.round(H * 0.45 + ((i * 41) % (H * 0.5))),
      animationDuration: `${4 + (i % 4)}s`,
      animationDelay: `${i * 0.4}s`,
    })),
    flyers: Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      return {
        color: PETALS[i % 4],
        style: {
          ["--fx" as string]: `${Math.round(Math.cos(angle) * W * 0.8)}px`,
          ["--fy" as string]: `${Math.round(Math.sin(angle) * H * 0.6)}px`,
          animationDelay: `${0.2 + (i % 5) * 0.08}s`,
        } as CSSProperties,
      };
    }),
    bokeh: [[4, 82, 120], [92, 76, 150], [10, 12, 90], [88, 18, 110], [50, 96, 160], [-4, 50, 130]].map(([x, y, r], i) => ({
      left: `${x}%`,
      top: `${y}%`,
      width: r,
      height: r,
      margin: `-${r / 2}px 0 0 -${r / 2}px`,
      background: `radial-gradient(circle, ${["rgba(247,168,184,0.55)", "rgba(255,214,160,0.5)"][i % 2]}, rgba(255,255,255,0) 70%)`,
    })),
  };
}

function Petal({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={color} />
    </svg>
  );
}

function PagePetals({ width, height, count }: { width: number; height: number; count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="hv-p-petal"
          aria-hidden="true"
          style={{ left: `${(((i * 73) % width) / width) * 100}%`, ["--fy" as string]: `${height + 60}px`, animationDuration: `${9 + (i % 4) * 2}s`, animationDelay: `-${i * 1.1}s` }}
        >
          <span style={{ animationDuration: `${3 + (i % 3)}s` }}>
            <Petal size={10 + (i % 3) * 6} color={PETALS[i % 4]} />
          </span>
        </span>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={`m${i}`}
          className="hv-p-mote"
          aria-hidden="true"
          style={{
            left: `${(((i * 97) % width) / width) * 100}%`,
            top: Math.round(height * 0.45 + ((i * 41) % (height * 0.5))),
            animationDuration: `${4 + (i % 4)}s`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </>
  );
}

export function HeavenlyInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: Wish[];
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond", "Jost");
  const nameId = useId();
  const msgId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<"opening" | "page">("opening");
  const [phase, setPhase] = useState<Phase>(quiet ? "invite" : "closed");
  const [size, setSize] = useState({ W: 390, H: 844 });
  const [jump, setJump] = useState<"top" | "rsvp" | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [music, setMusic] = useState(false);
  const [toast, setToast] = useState("");
  const [tagCopied, setTagCopied] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [guests, setGuests] = useState(2);
  const [meal, setMeal] = useState<(typeof MEALS)[number][0]>("veg");
  const [msg, setMsg] = useState("");
  const [nameError, setNameError] = useState(false);
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState<Row | null>(null);

  const couple = coupleOf(fields.names);
  const pack = packOf("heavenly", fields.lines);
  const story = (pack.story ?? []) as StoryBeat[];
  const events = (pack.programme ?? []) as ProgrammeItem[];
  const hashtag = (pack.caption || `#${couple.first}Weds${couple.second}`).replace(/\s+/g, "");
  const handle = (pack.instagram ?? "").trim();
  const handleId = handle.replace(/^@/, "");
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : ""));
  const hosts = fields.hosts || "Together with their families";
  const where = [fields.venue, fields.address].filter(Boolean);
  const live = Boolean(onReply);
  const yes = attend === "yes";

  useLayoutEffect(() => {
    const element = openRef.current;
    if (!element) return;
    const measure = () => {
      if (element.offsetWidth && element.offsetHeight) setSize({ W: element.offsetWidth, H: element.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [stage]);

  useEffect(() => {
    if (phase !== "opening" && phase !== "world") return;
    const timer = window.setTimeout(() => setPhase(phase === "opening" ? "world" : "invite"), phase === "opening" ? OPENING_MS : WORLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (stage !== "page") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (!jump || !rootRef.current) return;
    const root = rootRef.current;
    if (jump === "rsvp") root.querySelector("#hv-rsvp")?.scrollIntoView({ block: "start" });
    else {
      const host = scrollHost(root);
      if (host) host.scrollTop = 0;
      else window.scrollTo(0, Math.max(0, root.getBoundingClientRect().top + window.scrollY));
    }
    setJump(null);
  }, [jump, stage]);

  const g = useMemo(() => geometry(size.W, size.H), [size.W, size.H]);

  function open() {
    if (phase !== "closed") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPhase("invite");
    else setPhase("opening");
  }

  function enter(target: "top" | "rsvp") {
    setStage("page");
    setJump(target);
  }

  function replay() {
    setStage("opening");
    setPhase("closed");
    setJump("top");
  }

  function directions(place: string) {
    const query = fields.lat && fields.lng && place === fields.venue ? `${fields.lat},${fields.lng}` : [place, place === fields.venue ? fields.address : fields.venue, place === fields.venue ? "" : fields.address].filter(Boolean).join(", ");
    setToast(`Opening directions to ${place}…`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function addToCalendar(item: ProgrammeItem) {
    const start = whenOf(item.time, fields.date, fields.time);
    const place = [item.text, fields.venue, fields.address].filter(Boolean).join(", ");
    setToast(`Opening your calendar for ${item.title}…`);
    window.open(calendarLink(`${couple.first}${couple.second ? ` & ${couple.second}` : ""} — ${item.title}`, start, place), "_blank", "noopener,noreferrer");
  }

  async function toggleMusic() {
    const next = !music;
    setMusic(next);
    if (fields.audio && audioRef.current) {
      if (next) await audioRef.current.play().catch(() => setMusic(false));
      else audioRef.current.pause();
      return;
    }
    setToast(next ? "Your song plays here once you add one." : "Music paused.");
  }

  async function copyTag() {
    try {
      await navigator.clipboard.writeText(hashtag);
    } catch {
      /* clipboard can be blocked inside previews; the toast still shows the tag */
    }
    setTagCopied(true);
    setToast(`${hashtag} copied — add it to your posts!`);
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const picked = events.map((item) => item.title).filter((title) => title && !skipped.includes(title));
    const message = msg.trim() || (yes ? "Can’t wait to celebrate with you!" : "Sending love and blessings.");
    const note = [
      message,
      yes ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "",
      yes ? MEALS.find(([id]) => id === meal)?.[1] ?? "" : "",
      yes && picked.length ? picked.join(", ") : "",
    ]
      .filter(Boolean)
      .join(" · ");
    setSending(true);
    try {
      await onReply?.({ name: name.trim(), note, attending: yes });
      setMine({ key: "mine", name: name.trim(), msg: message, when: "Just now", attending: yes, guests: yes ? guests : 0, fresh: true });
    } catch {
      setToast("We couldn’t send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const left = Math.max(0, Math.floor((targetOf(fields.date, fields.time) - now) / 1000));
  const countdown = [
    [Math.floor(left / 86400), "DAYS"],
    [Math.floor(left / 3600) % 24, "HOURS"],
    [Math.floor(left / 60) % 60, "MINUTES"],
    [left % 60, "SECONDS"],
  ] as const;

  const others = live ? wishes.map(rowFromWish) : SAMPLE_REPLIES;
  const rows = mine ? [mine, ...others.filter((row) => row.name !== mine.name)] : others;
  const stats = [
    [rows.filter((row) => row.attending).reduce((sum, row) => sum + row.guests, 0), "GUESTS ATTENDING"],
    [rows.length, "REPLIES"],
    [rows.filter((row) => !row.attending).length, "SENT REGRETS"],
  ] as const;

  const slots = Array.from({ length: 6 }, (_, index) => photos[index] || (live ? "" : SAMPLE_PHOTOS[index]));
  const storyPhoto = (index: number) => slots[STORY_SLOTS[index] ?? index] ?? "";
  const shown = slots.map((src, index) => ({ src, index })).filter((item) => item.src);
  const igOrder = [3, 0, 1, 2, 5, 4];
  const viewerAt = viewer === null ? null : shown[viewer];

  function openPhoto(index: number) {
    const at = shown.findIndex((item) => item.index === index);
    if (at >= 0) setViewer(at);
  }

  function photoOrPlaceholder(src: string, label: string, tile = false) {
    if (src) return <img className={tile ? "hv-fill hv-tile" : "hv-fill"} src={src} alt="" />;
    return <span className="hv-ph">{label}</span>;
  }

  return (
    <div ref={rootRef} className="hv" data-motion="on">
      {stage === "opening" ? (
        <div ref={openRef} className={g.D ? "hv-open is-desk" : "hv-open"}>
          {phase === "world" || phase === "invite" ? (
            <>
              <div className="hv-world" style={g.world}>
                <div className="hv-cover" style={{ backgroundImage: `url(${ART.world})` }} />
                <div className="hv-world-pin" aria-hidden="true">
                  <div className="hv-world-rays" />
                </div>
                {g.worldLanterns.map((style, index) => (
                  <span key={index} className="hv-lantern" style={style} aria-hidden="true" />
                ))}
                {g.glints.map((style, index) => (
                  <span key={index} className="hv-glint" style={style} aria-hidden="true" />
                ))}
              </div>
              <span className="hv-flash-out" style={{ background: g.flash }} aria-hidden="true" />
            </>
          ) : null}

          {phase === "closed" ? (
            <div className="hv-layer">
              <div className="hv-push" style={{ transformOrigin: g.origin }}>
                <div className="hv-cover" style={{ backgroundImage: `url(${g.G.closed})` }} />
                <div className="hv-cover hv-glow-img" style={{ backgroundImage: `url(${g.G.glow})` }} />
                {g.doorLanterns.map((style, index) => (
                  <span key={index} className="hv-lantern" style={style} aria-hidden="true" />
                ))}
                <span className="hv-glow-line" style={g.glowLine} aria-hidden="true" />
              </div>
            </div>
          ) : null}

          {phase === "opening" ? (
            <div className="hv-layer">
              <div className="hv-cam" style={g.cam}>
                <div className="hv-cover" style={{ backgroundImage: `url(${g.G.glow})` }} />
                {g.doorLanterns.map((style, index) => (
                  <span key={index} className="hv-lantern" style={style} aria-hidden="true" />
                ))}
                <div className="hv-door-world" style={g.doorWorld}>
                  <div className="hv-cover" style={g.doorWorldImg} />
                </div>
                <div className="hv-door-light" style={g.doorLight} />
                <div className="hv-leaves" style={g.leaves}>
                  <div className="hv-leaf left" style={g.leafL}>
                    <div className="hv-leaf-shade" />
                    <div className="hv-leaf-edge" />
                  </div>
                  <div className="hv-leaf right" style={g.leafR}>
                    <div className="hv-leaf-shade" />
                    <div className="hv-leaf-edge" />
                  </div>
                </div>
              </div>
              <div className="hv-rays-in" style={g.rays} aria-hidden="true" />
              <div className="hv-floor" style={g.floor} aria-hidden="true" />
              <div className="hv-flash-in" style={{ background: g.flash }} aria-hidden="true" />
            </div>
          ) : null}

          <div className={phase === "world" || phase === "invite" ? "hv-fg on" : "hv-fg"} style={{ transformOrigin: g.origin }} aria-hidden="true">
            {g.bokeh.map((style, index) => (
              <span key={index} className="hv-bokeh" style={style} />
            ))}
          </div>
          {g.petals.map((petal, index) => (
            <span key={index} className="hv-petal" style={petal.outer} aria-hidden="true">
              <span style={petal.inner}>
                <Petal size={petal.size} color={petal.color} />
              </span>
            </span>
          ))}
          {g.motes.map((style, index) => (
            <span key={index} className="hv-mote" style={style} aria-hidden="true" />
          ))}
          {phase === "opening"
            ? g.flyers.map((flyer, index) => (
                <span key={index} className="hv-flyer" style={flyer.style} aria-hidden="true">
                  <Petal size={18} color={flyer.color} />
                </span>
              ))
            : null}

          {phase === "closed" ? (
            <button type="button" className="hv-tap" aria-label="Open the doors" onClick={open}>
              <span className="hv-ring one" aria-hidden="true" />
              <span className="hv-ring two" aria-hidden="true" />
              <span className="hv-hint">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF1D6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 11V5a2 2 0 0 1 4 0v6M13 10a2 2 0 0 1 4 0v2M17 11a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3-2l2 2" />
                </svg>
                {g.D ? "Click the doors to step inside" : "Tap the doors to step inside"}
              </span>
            </button>
          ) : null}

          {phase === "invite" ? (
            <>
              <div className="hv-dim" aria-hidden="true" />
              <div className="hv-card-wrap">
                <div className="hv-card" style={{ width: g.cardWidth, borderRadius: `${g.cardWidth / 2}px ${g.cardWidth / 2}px 14px 14px` }}>
                  <div className="hv-card-in" style={{ borderRadius: `${g.cardWidth / 2 - 10}px ${g.cardWidth / 2 - 10}px 8px 8px` }}>
                    <span className="hv-c-mono">
                      {couple.a}
                      {couple.b ? (
                        <>
                          {" "}
                          <small>&amp;</small> {couple.b}
                        </>
                      ) : null}
                    </span>
                    <span className="hv-c-kick">{hosts}</span>
                    <span className="hv-c-name">{couple.first}</span>
                    {couple.second ? <span className="hv-c-amp">&amp;</span> : null}
                    {couple.second ? <span className="hv-c-name two">{couple.second}</span> : null}
                    <span className="hv-c-line">{fields.title || "invite you to celebrate their wedding"}</span>
                    <span className="hv-c-rule" />
                    <span className="hv-c-date">{numericDate(fields.date)}</span>
                    {where.length ? (
                      <span className="hv-c-venue">
                        {fields.venue}
                        {fields.venue && fields.address ? <br /> : null}
                        {fields.address}
                      </span>
                    ) : null}
                    <div className="hv-c-actions">
                      <button type="button" className="hv-c-gold" onClick={() => enter("top")}>View invitation</button>
                      <button type="button" className="hv-c-ghost" onClick={() => enter("rsvp")}>RSVP</button>
                    </div>
                    <span className="hv-c-note">Events · Gallery · Replies inside</span>
                  </div>
                </div>
                <div className="hv-c-cta">
                  <button type="button" className="hv-replay" onClick={replay}>↺ Replay</button>
                  <a className="hv-made" href="/">Create your invitation · InvitesReady</a>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="hv-page">
          {fields.audio || !live ? (
            <button type="button" className="hv-music" aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={() => void toggleMusic()}>
              {[0, 1, 2, 3].map((index) => (
                <span key={index} className={music ? "hv-eq on" : "hv-eq"} style={music ? { animationDuration: `${0.6 + index * 0.15}s`, animationDelay: `${index * 0.1}s` } : undefined} />
              ))}
            </button>
          ) : null}
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop onEnded={() => setMusic(false)} /> : null}

          <nav className="hv-nav" aria-label="Invitation">
            <span className="hv-nav-brand">
              {couple.a}
              {couple.b ? ` & ${couple.b}` : ""}
            </span>
            <div className="hv-nav-links">
              {events.length ? <a href="#hv-events">EVENTS</a> : null}
              <a href="#hv-gallery">GALLERY</a>
              <a href="#hv-rsvp">RSVP</a>
              <a href="#hv-wishes">WISHES</a>
            </div>
          </nav>

          <section className="hv-hero">
            <div className="hv-layer">
              <div className="hv-hero-img" style={{ backgroundImage: `url(${ART.world})` }} />
            </div>
            <div className="hv-hero-shade" />
            <span className="hv-only-phone">
              <PagePetals width={390} height={760} count={12} />
            </span>
            <span className="hv-only-desk">
              <PagePetals width={1440} height={900} count={16} />
            </span>
            <div className="hv-hero-text">
              <span className="hv-hero-kick">{hosts}</span>
              <span className="hv-hero-names">
                {couple.first}
                {couple.second ? (
                  <>
                    {" "}
                    <em>&amp;</em> {couple.second}
                  </>
                ) : null}
              </span>
              <span className="hv-hero-date">{numericDate(fields.date)}</span>
              {where.length ? <span className="hv-hero-venue">{where.join(" · ")}</span> : null}
              <a className="hv-cta" href="#hv-rsvp">
                <span className="hv-shine" aria-hidden="true" />
                <span className="hv-lift">RSVP now</span>
              </a>
            </div>
          </section>

          <section className="hv-sec alt" aria-label="Countdown">
            <span className="hv-cd-kick">Until forever begins</span>
            <div className="hv-cd-row">
              {countdown.map(([value, label]) => (
                <div key={label} className="hv-cd-item">
                  <div className="hv-cd-box">
                    <span className={value % 2 ? "hv-cd-num a" : "hv-cd-num b"}>{label === "DAYS" ? String(value) : String(value).padStart(2, "0")}</span>
                  </div>
                  <span className="hv-cd-label">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {events.length ? (
            <section id="hv-events" className="hv-sec">
              <h2 className="hv-h">The celebrations</h2>
              <div className="hv-ev-grid">
                {events.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="hv-ev" style={{ animationDelay: `${index * 0.15}s` }}>
                    <span className="hv-ev-icon" aria-hidden="true">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#E6C27A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d={EVENT_ICONS[index % 3]} />
                      </svg>
                    </span>
                    {item.kick ? <span className="hv-ev-kick">{item.kick}</span> : null}
                    <span className="hv-ev-name">{item.title}</span>
                    <span className="hv-ev-when">
                      {item.time}
                      {item.time && item.text ? <br /> : null}
                      {item.text ? <em>{item.text}</em> : null}
                    </span>
                    {item.note ? <span className="hv-ev-dress">Dress: {item.note}</span> : null}
                    <div className="hv-ev-actions">
                      <button type="button" className="hv-ghost" onClick={() => directions(item.text || fields.venue)}>Directions</button>
                      <button type="button" className="hv-ghost" onClick={() => addToCalendar(item)}>Add to calendar</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {story.length ? (
            <section className="hv-sec alt">
              <h2 className="hv-h">Our story</h2>
              <div className="hv-story-row">
                {story.map((beat, index) => (
                  <div key={`${beat.title}-${index}`} className="hv-story" style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="hv-story-ph">{photoOrPlaceholder(storyPhoto(index), beat.title || `Photo ${index + 1}`)}</div>
                    <span className="hv-story-year">{beat.year}</span>
                    <span className="hv-story-title">{beat.title}</span>
                    <span className="hv-story-text">{beat.text}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section id="hv-gallery" className="hv-sec">
            <h2 className="hv-h">Gallery</h2>
            <span className="hv-sub">{shown.length ? "Tap any photo to view it larger" : "Your favourite photographs appear here"}</span>
            <div className="hv-gal">
              {slots.map((src, index) => (
                <button key={index} type="button" className={`hv-gal-tile t${index}`} aria-label={src ? `Open photo ${index + 1}` : `Photo ${index + 1}`} disabled={!src} onClick={() => openPhoto(index)}>
                  {photoOrPlaceholder(src, `Photo ${index + 1}`, true)}
                </button>
              ))}
            </div>
          </section>

          {handle || hashtag ? (
            <section className="hv-sec alt">
              <div className="hv-ig-head">
                <div className="hv-ig-id">
                  <span className="hv-ig-ring">
                    <span>
                      {couple.a}
                      {couple.b ? `&${couple.b}` : ""}
                    </span>
                  </span>
                  <div className="hv-ig-copy">
                    <span className="hv-ig-kick">SHARE THE LOVE ON INSTAGRAM</span>
                    <span className="hv-ig-handle">{handle || hashtag}</span>
                  </div>
                </div>
                <div className="hv-ig-btns">
                  <button type="button" className="hv-ghost" onClick={() => void copyTag()}>{tagCopied ? "Copied ✓" : `Copy ${hashtag}`}</button>
                  {handleId ? (
                    <a className="hv-gold" href={`https://www.instagram.com/${encodeURIComponent(handleId)}/`} target="_blank" rel="noopener noreferrer">
                      Follow on Instagram
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="hv-ig-grid">
                {igOrder.map((index) => (
                  <button key={index} type="button" className="hv-ig-tile" aria-label={slots[index] ? `Open photo ${index + 1}` : `Photo ${index + 1}`} disabled={!slots[index]} onClick={() => openPhoto(index)}>
                    {photoOrPlaceholder(slots[index], `Photo ${index + 1}`, true)}
                    {slots[index] && handle ? <span className="hv-ig-by">{handle}</span> : null}
                  </button>
                ))}
              </div>
              <span className="hv-sub">
                Tag your photos with <strong style={{ color: "#F3D9A0" }}>{hashtag}</strong> so we can relive the day with you.
              </span>
            </section>
          ) : null}

          {where.length ? (
            <section className="hv-sec">
              <div className="hv-venue">
                <div className="hv-venue-img">
                  <img className="hv-fill" src={ART.portal} alt={fields.venue || "The venue"} />
                </div>
                <div className="hv-venue-copy">
                  <span className="hv-venue-kick">THE VENUE</span>
                  <span className="hv-venue-title">{fields.venue || fields.address}</span>
                  <span className="hv-venue-note">{pack.venueNote || fields.address}</span>
                  <div className="hv-venue-btns">
                    <button type="button" className="hv-gold" onClick={() => directions(fields.venue || fields.address)}>Get directions</button>
                    {pack.venuePhone ? (
                      <a className="hv-ghost" href={`tel:${pack.venuePhone.replace(/[^\d+]/g, "")}`}>Call the venue</a>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section id="hv-rsvp" className="hv-sec alt">
            <h2 className="hv-h">Kindly reply</h2>
            {fields.rsvpBy ? <span className="hv-sub">Please respond by {longDate(fields.rsvpBy)}</span> : null}
            <div className="hv-form-wrap">
              {mine ? (
                <div className="hv-done">
                  {Array.from({ length: 14 }, (_, i) => (
                    <span key={i} className="hv-shower" style={{ left: `${(i * 37) % 92}%`, animationDuration: `${2.2 + (i % 4) * 0.4}s`, animationDelay: `${(i % 6) * 0.1}s` }} aria-hidden="true">
                      <Petal size={12 + (i % 3) * 5} color={PETALS[i % 4]} />
                    </span>
                  ))}
                  <span className="hv-done-title">{mine.attending ? "Thank you!" : "You’ll be missed"}</span>
                  <span className="hv-done-text">
                    {mine.attending
                      ? `Your reply is in, ${mine.name}. ${mine.guests} ${mine.guests === 1 ? "seat is" : "seats are"} saved for you.`
                      : `Thank you for letting us know, ${mine.name}.`}
                  </span>
                  <div className="hv-done-btns">
                    <a className="hv-gold" href="#hv-wishes">See all replies</a>
                    <button type="button" className="hv-ghost" onClick={() => setMine(null)}>Change my reply</button>
                  </div>
                </div>
              ) : (
                <form
                  className="hv-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                  }}
                >
                  <div className="hv-field">
                    <label className="hv-lab" htmlFor={nameId}>Your name</label>
                    <input
                      id={nameId}
                      className={nameError ? "hv-input bad" : "hv-input"}
                      type="text"
                      value={name}
                      placeholder="Guest or family name"
                      onChange={(event) => {
                        setName(event.target.value);
                        setNameError(false);
                      }}
                    />
                    {nameError ? <span className="hv-err">Please enter your name.</span> : null}
                  </div>
                  <div className="hv-choice">
                    <button type="button" className={yes ? "hv-opt on" : "hv-opt"} aria-pressed={yes} onClick={() => setAttend("yes")}>Joyfully accept</button>
                    <button type="button" className={yes ? "hv-opt" : "hv-opt on"} aria-pressed={!yes} onClick={() => setAttend("no")}>Regretfully decline</button>
                  </div>
                  {yes ? (
                    <>
                      {events.length ? (
                        <div className="hv-field roomy">
                          <span className="hv-lab">Joining us for</span>
                          <div className="hv-chips">
                            {events.map((item, index) => {
                              const on = !skipped.includes(item.title);
                              return (
                                <button
                                  key={`${item.title}-${index}`}
                                  type="button"
                                  className={on ? "hv-chip on" : "hv-chip"}
                                  aria-pressed={on}
                                  onClick={() => setSkipped((current) => (current.includes(item.title) ? current.filter((title) => title !== item.title) : [...current, item.title]))}
                                >
                                  {item.title.charAt(0).toUpperCase() + item.title.slice(1)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      <div className="hv-guests">
                        <span className="hv-lab">Guests</span>
                        <div className="hv-stepper">
                          <button type="button" className="hv-step" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                          <span className="hv-count" aria-live="polite">{guests}</span>
                          <button type="button" className="hv-step" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                        </div>
                      </div>
                      <div className="hv-field roomy">
                        <span className="hv-lab">Dinner</span>
                        <div className="hv-meals">
                          {MEALS.map(([id, label]) => (
                            <button key={id} type="button" className={meal === id ? "hv-meal on" : "hv-meal"} aria-pressed={meal === id} onClick={() => setMeal(id)}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div className="hv-field">
                    <label className="hv-lab" htmlFor={msgId}>A message for the couple</label>
                    <textarea id={msgId} className="hv-input" rows={3} value={msg} placeholder="Your wishes (optional)" onChange={(event) => setMsg(event.target.value)} />
                  </div>
                  <button type="submit" className="hv-send" disabled={sending} aria-busy={sending || undefined}>
                    <span className="hv-shine" aria-hidden="true" />
                    <span className="hv-lift">{sending ? <Spinner tone="paper" /> : "SEND MY REPLY"}</span>
                    {sending ? <span className="spin-sr">Sending</span> : null}
                  </button>
                </form>
              )}
            </div>
          </section>

          <section id="hv-wishes" className="hv-sec">
            <h2 className="hv-h">Replies &amp; wishes</h2>
            {rows.length ? (
              <>
                <div className="hv-stats">
                  {stats.map(([value, label]) => (
                    <div key={label} className="hv-stat">
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="hv-rep-grid">
                  {rows.map((row, index) => (
                    <div key={row.key} className={row.fresh ? "hv-rep new" : "hv-rep"}>
                      <div className="hv-rep-head">
                        <span className="hv-avatar" style={{ background: AVATARS[index % 4] }}>{initials(row.name)}</span>
                        <div className="hv-rep-who">
                          <span className="hv-rep-name">{row.name}</span>
                          {row.when ? <span className="hv-rep-when">{row.when}</span> : null}
                        </div>
                        <span className={row.attending ? "hv-pill yes" : "hv-pill no"}>
                          {row.attending ? `Attending${row.guests > 1 ? ` · ${row.guests}` : ""}` : "Sends regrets"}
                        </span>
                      </div>
                      {row.msg ? <span className="hv-rep-msg">“{row.msg}”</span> : null}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="hv-empty">Be the first to send your wishes.</p>
            )}
          </section>

          <footer className="hv-foot">
            <span className="hv-foot-names">{fields.names || `${couple.first} & ${couple.second}`}</span>
            <span className="hv-foot-line">
              {numericDate(fields.date)} · {hashtag.toUpperCase()}
            </span>
            <button type="button" className="hv-foot-replay" onClick={replay}>↺ Watch the doors open again</button>
            <a className="hv-foot-made" href="/">Made with InvitesReady</a>
            <InstagramLink />
          </footer>

          {viewerAt ? (
            <div className="hv-lb" role="dialog" aria-label="Photo viewer">
              <button type="button" className="hv-lb-close" aria-label="Close" onClick={() => setViewer(null)}>×</button>
              <img src={viewerAt.src} alt="Gallery photo" />
              <div className="hv-lb-row">
                <button type="button" className="hv-lb-nav" aria-label="Previous photo" onClick={() => setViewer(((viewer ?? 0) + shown.length - 1) % shown.length)}>‹</button>
                <span>
                  {(viewer ?? 0) + 1} / {shown.length}
                </span>
                <button type="button" className="hv-lb-nav" aria-label="Next photo" onClick={() => setViewer(((viewer ?? 0) + 1) % shown.length)}>›</button>
              </div>
            </div>
          ) : null}

          {toast ? (
            <div className="hv-toast" role="status">
              <span>{toast}</span>
              <button type="button" onClick={() => setToast("")}>OK</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
