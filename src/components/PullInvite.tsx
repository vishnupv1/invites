import { useEffect, useId, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem, type StoryBeat } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./pull.css";

export type PullTheme = "burgundy" | "navy" | "emerald" | "plum";

type Reply = { name: string; note: string; attending: boolean };
type Wish = { name: string; note: string; attending?: boolean };
type Row = { key: string; name: string; msg: string; when: string; attending: boolean; guests: number; fresh?: boolean };

const SAMPLES = ["/heavenly/sample-1.jpg", "/heavenly/sample-2.jpg", "/heavenly/sample-3.jpg", "/heavenly/sample-4.jpg", "/heavenly/portal.jpg", "/heavenly/world.jpg"];
const PETAL = ["#F3D9A0", "#E8C987", "#F7A8B8", "#FFF1CC"];
const AVATARS = ["#A97B33", "#B8586A", "#6E8B74", "#8A6A9A"];
const ICONS = [
  "M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11zM12 10v8M9 13l3 2 3-2",
  "M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
  "M8 14a5 5 0 1 0 0-.01M16 14a5 5 0 1 0 0-.01M12 4l2 3h-4z",
  "M8 2l1 7a3 3 0 0 1-6 0l1-7zM20 2l1 7a3 3 0 0 1-6 0l1-7zM6 12v8M18 12v8M3 20h6M15 20h6",
];
const MEALS = [
  ["veg", "Vegetarian"],
  ["nonveg", "Non-veg"],
  ["vegan", "Vegan"],
] as const;
const SAMPLE_REPLIES: Row[] = [
  { key: "s1", name: "Meera & Karthik", attending: true, guests: 2, msg: "We have been waiting for this day forever! See you in Jaipur.", when: "2 days ago" },
  { key: "s2", name: "Sanjana Iyer", attending: true, guests: 1, msg: "That curtain reveal gave me goosebumps. Saving my best moves for the sangeet!", when: "3 days ago" },
  { key: "s3", name: "The Kumars family", attending: true, guests: 4, msg: "Wishing you a lifetime of love and laughter.", when: "4 days ago" },
  { key: "s4", name: "Rahul Varma", attending: false, guests: 0, msg: "So sorry to miss it — sending all my love from Toronto.", when: "5 days ago" },
];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  const first = parts[0] || "Vihaan";
  const second = parts[1] || "Meera";
  const initial = (value: string) => (value[0] ?? "").toUpperCase();
  return { first, second, mark: `${initial(first)}&${initial(second)}`, crest: `${initial(first)} & ${initial(second)}` };
}

function bannerDate(iso: string) {
  const day = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(day.getTime())) return iso;
  const weekday = day.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const rest = day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
  return `${weekday} · ${rest}`;
}

function numericDate(iso: string) {
  const day = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(day.getTime())) return iso;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(day.getDate())} · ${pad(day.getMonth() + 1)} · ${day.getFullYear()}`;
}

function targetOf(date: string, time: string) {
  const stamp = new Date(`${date}T${time || "19:00"}:00+05:30`);
  return Number.isNaN(stamp.getTime()) ? 0 : stamp.getTime();
}

function photoAt(photos: string[] | undefined, index: number) {
  const own = photos?.filter(Boolean) ?? [];
  return assetUrl(own[index] || SAMPLES[index % SAMPLES.length]);
}

function Pelmet({ mark, uid }: { mark: string; uid: string }) {
  const w = 1440;
  const h = 180;
  const n = 6;
  const step = w / n;
  const y = 63;
  let edge = "";
  let fill = `M0 0 H${w} V${y}`;
  for (let i = n; i >= 1; i -= 1) {
    const right = i * step;
    const left = (i - 1) * step;
    const mid = (left + right) / 2;
    edge += `M${left} ${y} Q${mid} ${y + 109.5} ${right} ${y} `;
    fill += ` Q${mid} ${y + 109.5} ${left} ${y}`;
  }
  fill += " Z";
  return (
    <div className="pl-pelmet" aria-hidden="true">
      <svg viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id={`${uid}-v`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--pelmet-0)" />
            <stop offset="0.55" stopColor="var(--pelmet-1)" />
            <stop offset="1" stopColor="var(--pelmet-2)" />
          </linearGradient>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--gold-deep)" />
            <stop offset="0.35" stopColor="var(--gold-light)" />
            <stop offset="0.6" stopColor="var(--gold-mid)" />
            <stop offset="1" stopColor="var(--gold-shine)" />
          </linearGradient>
        </defs>
        <path d={fill} fill={`url(#${uid}-v)`} />
        <path d={edge} fill="none" stroke={`url(#${uid}-g)`} strokeWidth="5" />
        <path d={edge} fill="none" stroke="var(--gold)" strokeWidth="14" strokeDasharray="1.6 3.4" transform="translate(0 8)" opacity="0.9" />
        {Array.from({ length: n + 1 }, (_, index) => {
          const x = index * step;
          return (
            <g key={x}>
              <path d={`M${x - 14} 45 L${x + 14} 45 L${x + 9} 142.5 L${x} 157.5 L${x - 9} 142.5 Z`} fill={`url(#${uid}-v)`} />
              <circle cx={x} cy="45" r="11" fill={`url(#${uid}-g)`} />
            </g>
          );
        })}
        <rect x="0" y="0" width={w} height="27" fill={`url(#${uid}-g)`} />
        <rect x="0" y="27" width={w} height="4" fill="#5A3A12" opacity="0.5" />
        <g transform="translate(720 54)">
          <circle r="45" fill="var(--pelmet-0)" stroke={`url(#${uid}-g)`} strokeWidth="4" />
          <circle r="36" fill="none" stroke={`url(#${uid}-g)`} strokeWidth="1.5" />
          <text y="12" textAnchor="middle" fontFamily="Great Vibes, cursive" fontSize="39" fill="var(--gold-light)">{mark}</text>
        </g>
      </svg>
    </div>
  );
}

function Tassel({ uid }: { uid: string }) {
  return (
    <svg width="60" height="120" viewBox="0 0 60 120" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--gold-deep)" />
          <stop offset="0.45" stopColor="var(--gold-light)" />
          <stop offset="0.7" stopColor="var(--gold-mid)" />
          <stop offset="1" stopColor="var(--gold-dark)" />
        </linearGradient>
      </defs>
      <rect x="26" y="0" width="8" height="14" fill={`url(#${uid}-t)`} />
      <ellipse cx="30" cy="22" rx="13" ry="10" fill={`url(#${uid}-t)`} />
      <rect x="20" y="30" width="20" height="8" rx="3" fill={`url(#${uid}-t)`} />
      <path d="M18 38 H42 L52 108 Q30 118 8 108 Z" fill={`url(#${uid}-t)`} />
      <path d="M14 52 V110 M20 50 V113 M26 50 V115 M30 50 V116 M34 50 V115 M40 50 V113 M46 52 V110" stroke="var(--gold-dark)" strokeWidth="1.2" opacity="0.7" />
      <rect x="16" y="44" width="28" height="5" rx="2" fill="var(--gold-dark)" opacity="0.5" />
    </svg>
  );
}

function Tie() {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden="true">
      <path d="M8 30 C30 18 60 18 82 32" fill="none" stroke="var(--gold)" strokeWidth="7" strokeLinecap="round" />
      <path d="M8 30 C30 18 60 18 82 32" fill="none" stroke="var(--gold-light)" strokeWidth="2" strokeDasharray="3 5" />
      <ellipse cx="78" cy="38" rx="8" ry="7" fill="var(--gold-shine)" />
      <path d="M72 44 H84 L88 82 Q78 88 68 82 Z" fill="var(--gold)" />
      <path d="M72 50 V84 M76 50 V86 M80 50 V86 M84 50 V84" stroke="var(--gold-dark)" strokeWidth="1" />
    </svg>
  );
}

export function PullInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
  demo = false,
  theme = "burgundy",
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: Wish[];
  onReply?: (reply: Reply) => void | Promise<unknown>;
  demo?: boolean;
  theme?: PullTheme;
}) {
  useFonts("Great Vibes", "Cinzel", "Cormorant Garamond", "Jost");
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const y0 = useRef(0);
  const pullRef = useRef(0);
  const phaseRef = useRef<"closed" | "open">(quiet ? "open" : "closed");
  const dragged = useRef(false);
  const dragRef = useRef(false);
  const [desk, setDesk] = useState(false);
  const [stageH, setStageH] = useState(760);
  const [screen, setScreen] = useState<"curtain" | "page">(quiet ? "page" : "curtain");
  const [phase, setPhase] = useState<"closed" | "open">(quiet ? "open" : "closed");
  const [pull, setPull] = useState(0);
  const [drag, setDrag] = useState(false);
  const [run, setRun] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [music, setMusic] = useState(false);
  const [toast, setToast] = useState("");
  const [viewer, setViewer] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [meal, setMeal] = useState("veg");
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [sent, setSent] = useState<Row | null>(null);
  const [copied, setCopied] = useState(false);

  const couple = coupleOf(fields.names);
  const pack = packOf("pull", fields.lines);
  const events = (pack.programme ?? []) as ProgrammeItem[];
  const story = (pack.story ?? []) as StoryBeat[];
  const photos = (fields.photos ?? []).filter(Boolean);
  const gallery = (photos.length ? photos : SAMPLES).slice(0, 6);
  const opened = phase === "open";
  const baseLen = Math.round(stageH * (desk ? 0.42 : 0.4));
  const ropeLeft = desk ? "86%" : "84%";
  const delay = (step: number) => ({ animationDelay: `${2 + 1.8 + step}s` });

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => {
      const width = node.clientWidth || window.innerWidth;
      const wide = width >= 860;
      setDesk(wide);
      setStageH(wide ? 900 : 844);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (screen !== "page") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openCurtain() {
    if (phaseRef.current !== "closed") return;
    phaseRef.current = "open";
    setPhase("open");
    pullRef.current = 0;
    setPull(0);
    setDrag(false);
  }

  function replay() {
    phaseRef.current = "closed";
    pullRef.current = 0;
    setScreen("curtain");
    setPhase("closed");
    setPull(0);
    setDrag(false);
    setRun((value) => value + 1);
  }

  function showPage(hash?: string) {
    setScreen("page");
    if (!hash) return;
    window.setTimeout(() => rootRef.current?.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }

  const diff = Math.max(0, Math.floor((targetOf(fields.date, fields.time) - now) / 1000));
  const parts = [Math.floor(diff / 86400), Math.floor(diff / 3600) % 24, Math.floor(diff / 60) % 60, diff % 60];
  const labels = ["DAYS", "HOURS", "MINUTES", "SECONDS"];
  const live = Boolean(onReply);
  const rows: Row[] = sent ? [sent, ...(demo || !live ? SAMPLE_REPLIES : [])] : demo || !live ? SAMPLE_REPLIES : wishes.map((wish, index) => ({
    key: `w${index}`,
    name: wish.name,
    msg: wish.note,
    when: "",
    attending: wish.attending !== false,
    guests: wish.attending === false ? 0 : 1,
  }));
  const attending = rows.filter((row) => row.attending);
  const tag = pack.caption || `#${couple.first}Weds${couple.second}`.replace(/\s/g, "");
  const handle = pack.instagram || "";

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const yes = attend === "yes";
    const note = msg.trim() || (yes ? "Can’t wait to celebrate with you!" : "Sending love and blessings.");
    try {
      await onReply?.({ name: name.trim(), note, attending: yes });
      setSent({ key: "new", name: name.trim(), msg: note, when: "Just now", attending: yes, guests: yes ? guests : 0, fresh: true });
      setDone(true);
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : "Could not send your reply.");
    }
  }

  const page = screen === "page";

  return (
    <div ref={rootRef} className={desk ? "pl is-desk" : "pl"} data-theme={theme}>
      {page ? (
        <div className="pl-page">
          <button
            type="button"
            className="pl-music"
            aria-pressed={music}
            aria-label={music ? "Pause music" : "Play music"}
            onClick={() => {
              const next = !music;
              setMusic(next);
              const audio = audioRef.current;
              if (audio && fields.audio) {
                if (next) void audio.play().catch(() => undefined);
                else audio.pause();
              }
              setToast(next ? "Now playing." : "Music paused.");
            }}
          >
            {[0, 1, 2, 3].map((bar) => (
              <span key={bar} className={music ? "pl-eq on" : "pl-eq"} style={music ? { animationDuration: `${0.6 + bar * 0.15}s`, animationDelay: `${bar * 0.1}s` } : undefined} />
            ))}
          </button>
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop /> : null}
          <nav className="pl-nav" aria-label="Invitation">
            <a href="#events">EVENTS</a>
            <a href="#gallery">GALLERY</a>
            <a href="#rsvp">RSVP</a>
            <a href="#wishes">WISHES</a>
          </nav>
          <section className="pl-hero">
            <div className="pl-wall" />
            <div className="pl-floor" />
            <div className="pl-hero-beam l" />
            <div className="pl-hero-beam r" />
            <div className="pl-side l"><div className="pl-velvet" style={{ ["--dir" as string]: "270deg" }} /><div className="pl-fringe" /></div>
            <div className="pl-side r"><div className="pl-velvet" style={{ ["--dir" as string]: "90deg" }} /><div className="pl-fringe" /></div>
            <div className="pl-tie" style={{ left: desk ? 28 : 8 }}><Tie /></div>
            <div className="pl-tie r" style={{ right: desk ? 28 : 8 }}><Tie /></div>
            <Pelmet mark={couple.mark} uid={`${uid}h`} />
            {PETAL.map((color, index) => (
              <span key={color + index} className="pl-petal" style={{ left: `${(index * 13) % 92}%`, ["--fy" as string]: "820px", animationDuration: `${9 + (index % 4) * 2}s`, animationDelay: `-${index * 1.1}s` }}>
                <i style={{ animationDuration: `${3 + (index % 3)}s` }}>
                  <svg width={10 + (index % 3) * 6} height={10 + (index % 3) * 6} viewBox="0 0 20 20"><path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={color} /></svg>
                </i>
              </span>
            ))}
            <div className="pl-hero-copy">
              <span className="pl-kicker" style={{ animation: "ep-up .8s ease .3s both" }}>THE CURTAIN RISES ON</span>
              <span className="pl-script">{couple.first} <span className="amp">&amp;</span> {couple.second}</span>
              <span className="pl-sub">{numericDate(fields.date)}</span>
              <span className="pl-where">{fields.venue}{fields.address ? ` · ${fields.address}` : ""}</span>
              <a className="pl-cta" href="#rsvp"><span className="pl-shine" aria-hidden="true" /><span style={{ position: "relative" }}>RSVP now</span></a>
            </div>
          </section>

          <section className="pl-sec">
            <span className="pl-lead">The show begins in</span>
            <div className="pl-cd">
              {parts.map((value, index) => (
                <div key={labels[index]}>
                  <div className="pl-orb"><span style={{ animation: `${index % 2 ? "ep-flipB" : "ep-flipA"} .5s ease-out` }}>{labels[index] === "DAYS" ? value : String(value).padStart(2, "0")}</span></div>
                  <small>{labels[index]}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="pl-sec" id="events">
            <h2 className="pl-h2">The functions</h2>
            <div className={events.length > 3 ? "pl-grid four" : "pl-grid"}>
              {events.map((item, index) => (
                <article className="pl-card" key={`${item.title}-${index}`} style={{ animationDelay: `${index * 0.15}s` }}>
                  <span className="pl-icon" aria-hidden="true">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--gold-shine)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[index % ICONS.length]} /></svg>
                  </span>
                  {item.kick ? <span className="pl-lead">{item.kick}</span> : null}
                  <span className="title">{item.title}</span>
                  <p>{item.time}{item.text ? <><br /><em>{item.text}</em></> : null}</p>
                  {item.note ? <span className="dress">Dress: {item.note}</span> : null}
                  <div className="row">
                    <button type="button" className="pl-mini" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.text || fields.venue)}`, "_blank", "noopener")}>Directions</button>
                    <a className="pl-mini" href={calendarUrl(fields) || "#events"}>Add to calendar</a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {story.length ? (
            <section className="pl-sec-alt">
              <h2 className="pl-h2">Our story</h2>
              <div className="pl-story">
                {story.map((beat, index) => (
                  <article className="pl-beat" key={`${beat.title}-${index}`} style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="pl-arch"><img src={photoAt(photos, index)} alt="" /></div>
                    <span className="pl-year">{beat.year}</span>
                    <strong>{beat.title}</strong>
                    <span>{beat.text}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="pl-sec" id="gallery">
            <h2 className="pl-h2">Gallery</h2>
            <span className="pl-where">Tap any photo to view it larger</span>
            <div className="pl-gal">
              {gallery.map((src, index) => (
                <button key={src + index} type="button" className={!desk && (index === 0 || index === gallery.length - 1) ? "wide" : desk && index === 0 ? "tall" : desk && index === 4 ? "wide" : ""} aria-label={`Open photo ${index + 1}`} onClick={() => setViewer(index)}>
                  <img src={assetUrl(src)} alt="" />
                </button>
              ))}
            </div>
          </section>

          <section className="pl-sec-alt">
            <div className="pl-ig-head">
              <div className="pl-ig-id">
                <span className="pl-ring"><span>{couple.mark.replace("&", " & ")}</span></span>
                <div>
                  <span className="pl-lead">SHARE THE LOVE ON INSTAGRAM</span>
                  <strong style={{ display: "block", fontFamily: "Jost, sans-serif", fontSize: 18 }}>{handle || tag}</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="pl-mini" onClick={() => { void navigator.clipboard.writeText(tag).then(() => setCopied(true)).catch(() => setToast(tag)); }}>{copied ? "Copied" : "Copy tag"}</button>
                {handle ? <a className="pl-cta" style={{ animation: "none", minHeight: 44 }} href={`https://instagram.com/${handle.replace(/^@/, "")}`} target="_blank" rel="noreferrer">Follow on Instagram</a> : null}
              </div>
            </div>
            <div className="pl-ig">
              {gallery.map((src, index) => (
                <button key={`ig-${src}-${index}`} type="button" onClick={() => setViewer(index)}>
                  <img src={assetUrl(src)} alt="" />
                  <span className="pl-by">{handle || "guest"}</span>
                </button>
              ))}
            </div>
            <span className="pl-where">Tag your photos with <strong style={{ color: "var(--hint)" }}>{tag}</strong> and they’ll appear here on the day.</span>
          </section>

          <section className="pl-sec">
            <div className="pl-venue">
              <div className="pl-shot"><img src={photoAt(photos, 4)} alt="" /></div>
              <div className="pl-venue-copy">
                <span className="pl-lead">THE VENUE</span>
                <span className="pl-script">{fields.venue}</span>
                <span style={{ fontSize: 19, lineHeight: 1.6, color: "var(--cream-2)" }}>{pack.venueNote || fields.address}</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="pl-cta" style={{ animation: "none" }} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${fields.venue} ${fields.address}`)}`, "_blank", "noopener")}>Get directions</button>
                  {pack.venuePhone ? <a className="pl-mini" href={`tel:${pack.venuePhone}`}>Call the venue</a> : null}
                </div>
              </div>
            </div>
          </section>

          <section className="pl-sec-alt" id="rsvp">
            <h2 className="pl-h2">Kindly reply</h2>
            {fields.rsvpBy ? <span className="pl-where">Please respond by {formatLongDate(fields.rsvpBy)}</span> : null}
            <div className="pl-form">
              {done ? (
                <div className="pl-done">
                  <span className="pl-script">{attend === "yes" ? "See you at the show!" : "You’ll be missed"}</span>
                  <span style={{ fontSize: 19, lineHeight: 1.6, color: "var(--cream-2)" }}>{attend === "yes" ? "Your seat is saved. We cannot wait to celebrate with you." : "Thank you for letting us know. You will be in our thoughts."}</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                    <a className="pl-cta" style={{ animation: "none" }} href="#wishes">See all replies</a>
                    <button type="button" className="pl-mini" onClick={() => setDone(false)}>Change my reply</button>
                  </div>
                </div>
              ) : (
                <>
                  <label>
                    <span className="pl-lab">Your name</span>
                    <input className={nameError ? "bad" : undefined} value={name} placeholder="Guest or family name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                    {nameError ? <small style={{ color: "#ffb4b4", fontFamily: "Jost, sans-serif" }}>Please enter your name.</small> : null}
                  </label>
                  <div className="pl-yesno">
                    <button type="button" className={attend === "yes" ? "on" : "off"} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                    <button type="button" className={attend === "no" ? "on" : "off"} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
                  </div>
                  {attend === "yes" ? (
                    <>
                      <div>
                        <span className="pl-lab">Joining us for</span>
                        <div className="pl-chips">
                          {events.map((item, index) => (
                            <button key={item.title + index} type="button" className={picked[index] !== false ? "on" : ""} aria-pressed={picked[index] !== false} onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}>{item.title}</button>
                          ))}
                        </div>
                      </div>
                      <div className="pl-step">
                        <span className="pl-lab">Guests</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                          <span style={{ minWidth: 28, textAlign: "center", fontFamily: "Cinzel, serif", fontSize: 22 }}>{guests}</span>
                          <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                        </div>
                      </div>
                      <div>
                        <span className="pl-lab">Dinner</span>
                        <div className="pl-meals">
                          {MEALS.map(([id, label]) => (
                            <button key={id} type="button" className={meal === id ? "on" : ""} aria-pressed={meal === id} onClick={() => setMeal(id)}>{label}</button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                  <label>
                    <span className="pl-lab">A message for the couple</span>
                    <textarea rows={3} value={msg} placeholder="Your wishes (optional)" onChange={(event) => setMsg(event.target.value)} />
                  </label>
                  <button type="button" className="pl-send" onClick={() => void submit()}><span className="pl-shine" /><span style={{ position: "relative" }}>SEND MY REPLY</span></button>
                </>
              )}
            </div>
          </section>

          <section className="pl-sec" id="wishes">
            <h2 className="pl-h2">Replies & wishes</h2>
            <div className="pl-stats">
              <div className="pl-stat"><b>{attending.reduce((sum, row) => sum + Math.max(row.guests, row.attending ? 1 : 0), 0)}</b><span>GUESTS ATTENDING</span></div>
              <div className="pl-stat"><b>{rows.length}</b><span>REPLIES</span></div>
              <div className="pl-stat"><b>{rows.filter((row) => !row.attending).length}</b><span>SENT REGRETS</span></div>
            </div>
            <div className="pl-replies">
              {rows.map((row, index) => (
                <article className={row.fresh ? "pl-reply fresh" : "pl-reply"} key={row.key}>
                  <div className="pl-who">
                    <span className="pl-av" style={{ background: AVATARS[index % AVATARS.length] }}>{row.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</span>
                    <strong>{row.name}</strong>
                    <span className={row.attending ? "pl-pill yes" : "pl-pill no"}>{row.attending ? `Attending${row.guests > 1 ? ` · ${row.guests}` : ""}` : "Sends regrets"}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>{row.msg}</p>
                  {row.when ? <small style={{ color: "#d9c29a" }}>{row.when}</small> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="pl-stage" style={{ height: stageH }} key={run}>
          <div className="pl-wall" />
          <div className="pl-floor" />
          {Array.from({ length: 10 }, (_, index) => (
            <span key={index} className="pl-bokeh" style={{ left: `${10 + (index * 37) % 80}%`, top: `${25 + (index * 23) % 50}%`, width: 6 + (index % 3) * 5, height: 6 + (index % 3) * 5, animationDuration: `${2 + (index % 4)}s`, animationDelay: `${index * 0.3}s` }} />
          ))}
          {opened ? (
            <>
              <div className="pl-beam l" />
              <div className="pl-beam r" />
              {Array.from({ length: 16 }, (_, index) => (
                <span key={index} className="pl-dust" style={{ left: `${25 + (index * 29) % 50}%`, top: `${8 + (index % 5) * 4}%`, ["--dy" as string]: `${Math.round(stageH * 0.7)}px`, animationDuration: `${5 + (index % 4)}s`, animationDelay: `${2.5 + index * 0.35}s` }} />
              ))}
              <div className="pl-scroll" style={{ top: 142 }}>
                <div className="pl-hang" style={{ height: 142, top: -142, animationDelay: "1.4s" }}><i className="l" /><i className="r" /></div>
                <div className="pl-rod top" style={{ top: 0, animationDelay: "1.4s" }}><b className="l" /><b className="r" /></div>
                <div className="pl-paper" style={{ height: desk ? 640 : 560, animationDelay: "2s" }}>
                  <svg style={{ position: "absolute", inset: 10, width: "calc(100% - 20px)", height: "calc(100% - 20px)" }} viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
                    <rect x="1" y="1" width="98" height="138" fill="none" stroke="#B8893F" strokeWidth="0.6" />
                    <rect x="3" y="3" width="94" height="134" fill="none" stroke="#D9B66E" strokeWidth="0.3" />
                  </svg>
                  <div className="pl-paper-in">
                    <span className="pl-crest pl-up" style={delay(0)}>{couple.crest}</span>
                    <span className="pl-small pl-up" style={delay(0.3)}>{fields.hosts || "Together with their families"}</span>
                    <span className="pl-name" style={{ animationDelay: "4.4s" }}>{couple.first}</span>
                    <span className="pl-amp pl-up" style={delay(1.3)}>&amp;</span>
                    <span className="pl-name" style={{ animationDelay: "5.3s" }}>{couple.second}</span>
                    <span className="pl-line pl-up" style={delay(2.5)}>{fields.title || "request the pleasure of your company at the celebration of their marriage"}</span>
                    <span className="pl-rule pl-up" style={delay(2.8)} />
                    <span className="pl-date pl-up" style={delay(3.1)}>{bannerDate(fields.date)}</span>
                    <span className="pl-time pl-up" style={delay(3.3)}>{formatTime(fields.time)}</span>
                    <span className="pl-venue pl-up" style={delay(3.6)}>{fields.venue}{fields.address ? <><br />{fields.address}</> : null}</span>
                    <div className="pl-actions pl-up" style={delay(4.1)}>
                      <button type="button" className="pl-gold" onClick={() => showPage("#events")}><span className="pl-shine" /><span style={{ position: "relative" }}>View invitation</span></button>
                      <button type="button" className="pl-ghost" onClick={() => showPage("#rsvp")}>RSVP</button>
                    </div>
                    <span className="pl-note pl-up" style={delay(4.4)}>Functions · Gallery · Messages inside</span>
                  </div>
                </div>
                <div className="pl-rod bot" style={{ ["--ph" as string]: `${desk ? 640 : 560}px`, animationDelay: "2s, 2s" }}><b className="l" /><b className="r" /></div>
              </div>
              <div className="pl-foot pl-up" style={delay(4.6)}>
                <button type="button" className="pl-replay" onClick={replay}>↺ Replay</button>
              </div>
            </>
          ) : null}
          <div className={opened ? "pl-curt l is-open" : "pl-curt l"}>
            <div className="pl-velvet" style={{ ["--dir" as string]: "270deg" }} />
            <div className="pl-fringe" />
          </div>
          <div className={opened ? "pl-curt r is-open" : "pl-curt r"}>
            <div className="pl-velvet" style={{ ["--dir" as string]: "90deg" }} />
            <div className="pl-fringe" />
          </div>
          {opened ? (
            <>
              <div className="pl-tie" style={{ left: desk ? "8%" : "6%" }}><Tie /></div>
              <div className="pl-tie r" style={{ right: desk ? "8%" : "6%" }}><Tie /></div>
            </>
          ) : null}
          <Pelmet mark={couple.mark} uid={uid} />
          <div className={opened ? "pl-rope is-open" : "pl-rope"} style={{ left: ropeLeft }}>
            <div className={!opened && !drag ? "pl-sway is-live" : "pl-sway"}>
              <div className={opened ? "pl-tug is-open" : "pl-tug"}>
                <div className={drag ? "pl-cord is-drag" : "pl-cord"} style={{ height: baseLen + (opened ? 0 : pull) }} />
                <button
                  type="button"
                  className={drag ? "pl-tassel is-drag" : "pl-tassel"}
                  style={{ top: baseLen + (opened ? 0 : pull) - 4 }}
                  aria-label="Pull the rope to open the curtains"
                  onClick={() => {
                    if (dragged.current) {
                      dragged.current = false;
                      return;
                    }
                    openCurtain();
                  }}
                  onPointerDown={(event) => {
                    y0.current = event.clientY;
                    dragged.current = false;
                    dragRef.current = true;
                    setDrag(true);
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (!dragRef.current || phaseRef.current !== "closed") return;
                    const next = Math.max(0, Math.min(140, event.clientY - y0.current));
                    if (next > 4) dragged.current = true;
                    pullRef.current = next;
                    setPull(next);
                  }}
                  onPointerUp={() => {
                    dragRef.current = false;
                    if (pullRef.current > 70) openCurtain();
                    else {
                      pullRef.current = 0;
                      setDrag(false);
                      setPull(0);
                    }
                  }}
                >
                  <Tassel uid={`${uid}t`} />
                </button>
              </div>
            </div>
            {!opened ? (
              <span className="pl-hint" style={{ top: baseLen + (desk ? 130 : 104), left: desk ? -70 : -118, width: desk ? 140 : 150, justifyContent: desk ? "center" : "flex-end" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--hint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v16M6 14l6 6 6-6" /></svg>
                PULL THE ROPE
              </span>
            ) : null}
          </div>
          {!opened ? (
            <div className="pl-intro" style={{ top: Math.round(stageH * (desk ? 0.4 : 0.36)) }}>
              <span className="pl-kicker">TONIGHT, THE CURTAIN RISES ON</span>
              <span className="pl-script">{couple.first} &amp; {couple.second}</span>
              <span className="pl-dear">You are invited</span>
            </div>
          ) : null}
        </section>
      )}
      {viewer !== null ? (
        <div className="pl-lb" role="dialog" aria-label="Photo">
          <button type="button" aria-label="Close" onClick={() => setViewer(null)}>×</button>
          <img src={assetUrl(gallery[viewer] || gallery[0])} alt="" />
        </div>
      ) : null}
      {toast ? <div className="pl-toast" role="status">{toast}</div> : null}
    </div>
  );
}
