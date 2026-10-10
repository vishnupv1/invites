import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { madeWithHref } from "../lib/share";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem, type StoryBeat } from "../data/custom";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./grandoor.css";

type Phase = "pre" | "door" | "open" | "hero";
type Step = "intro" | "form" | "yes" | "no" | "wish" | "wished";
type Reply = { name: string; note: string; attending: boolean };

const ART = {
  closed: "/grandoor/closed.jpg",
  closedWide: "/grandoor/closed-wide.jpg",
  world: "/grandoor/world.jpg",
  worldWide: "/grandoor/world-wide.jpg",
  venue: "/grandoor/venue.jpg",
  rsvp: "/grandoor/rsvp.jpg",
  rsvpWide: "/grandoor/rsvp-wide.jpg",
  frame: "/grandoor/frame.png",
  mandap: "/grandoor/mandap.png",
  arch: "/grandoor/arch.png",
  doorL: "/grandoor/door-l.png",
  doorR: "/grandoor/door-r.png",
  story: ["/grandoor/story-1.jpg", "/grandoor/story-2.jpg", "/grandoor/story-3.jpg"],
};

const FRAME_RATIO = 1536 / 1024;
const SLOTS: { box: [number, number, number, number]; turn: number; arch?: boolean }[] = [
  { box: [0.461, 0.195, 0.756, 0.519], turn: 0, arch: true },
  { box: [0.104, 0.517, 0.504, 0.731], turn: -10 },
  { box: [0.495, 0.56, 0.842, 0.789], turn: 5.5 },
];

function slotStyle(box: [number, number, number, number], turn: number): CSSProperties {
  const [x0, y0, x1, y1] = box;
  const bw = x1 - x0;
  const bh = y1 - y0;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  if (!turn) {
    return { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${bw * 100}%`, height: `${bh * 100}%` };
  }
  const rad = (Math.abs(turn) * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const pw = bw;
  const ph = bh * FRAME_RATIO;
  const denom = c * c - s * s;
  const width = ((pw * c - ph * s) / denom) * 0.94;
  const height = ((ph * c - pw * s) / denom / FRAME_RATIO) * 0.94;
  return {
    left: `${(cx - width / 2) * 100}%`,
    top: `${(cy - height / 2) * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
    transform: `rotate(${turn}deg)`,
  };
}
const PETALS = ["#F7A8B8", "#F3C2C9", "#E8789A", "#FFE3C2"];
const MEALS = [
  ["veg", "Veg"],
  ["nonveg", "Non-veg"],
  ["vegan", "Vegan"],
] as const;
const ICONS = [
  "M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Anjali", second: parts[1] || "" };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00+05:30`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function momentOf(date: string, time: string) {
  return new Date(`${date}T${time || "17:00"}:00+05:30`);
}

function upperDate(date: string) {
  const day = dayOf(date);
  return day ? day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase() : date.toUpperCase();
}

function shortDate(date: string) {
  const day = dayOf(date);
  return day ? day.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase() : date.toUpperCase();
}

function weekday(date: string) {
  const day = dayOf(date);
  return day ? day.toLocaleDateString("en-GB", { weekday: "long" }) : "";
}

function clock(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  if (!hour && hour !== 0) return time;
  const mark = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${String(minute || 0).padStart(2, "0")} ${mark}`;
}

function geometry(W: number, H: number) {
  const wide = W / Math.max(H, 1) >= 1;
  const G = wide
    ? { IW: 1672, IH: 941, f: [0.3995, 0.601, 0.4994, 0.1297, 0.308, 0.7705], lan: [[0.32, 0.42], [0.675, 0.42], [0.21, 0.78], [0.79, 0.78]], CE: 3.6, closed: ART.closedWide, world: ART.worldWide, rsvp: ART.rsvpWide, cf: [0.33, 0.12, 0.676, 0.85] }
    : { IW: 940, IH: 1672, f: [0.282, 0.734, 0.5, 0.209, 0.336, 0.7], lan: [[0.113, 0.35], [0.89, 0.35], [0.5, 0.17], [0.16, 0.76]], CE: 2.9, closed: ART.closed, world: ART.world, rsvp: ART.rsvp, cf: [0.255, 0.205, 0.745, 0.79] };
  const sc = Math.max(W / G.IW, H / G.IH);
  const dW = G.IW * sc;
  const dH = G.IH * sc;
  const oX = (W - dW) / 2;
  const oY = (H - dH) / 2;
  const fx = (f: number) => oX + f * dW;
  const fy = (f: number) => oY + f * dH;
  const [L, R, C, T, Sh, B] = [fx(G.f[0]), fx(G.f[1]), fx(G.f[2]), fy(G.f[3]), fy(G.f[4]), fy(G.f[5])];
  const worldSize = wide ? { IW: 1200, IH: 675 } : { IW: 941, IH: 1672 };
  const wsc = Math.max(W / worldSize.IW, H / worldSize.IH);
  const wdW = worldSize.IW * wsc;
  const wdH = worldSize.IH * wsc;
  const woX = (W - wdW) / 2;
  const woY = (H - wdH) / 2;
  const we = 1.15 / G.CE;
  const midY = (T + B) / 2;
  const boxLeft = C + (0 - C) / we;
  const boxTop = midY + (0 - midY) / we;
  const curve: [number, number][] = [];
  for (let k = 0; k <= 14; k += 1) {
    const u = k / 14;
    curve.push([L + u * (C - L), Sh - (Sh - T) * Math.sqrt(1 - (1 - u) * (1 - u))]);
  }
  const mirror = (points: [number, number][]) => points.map(([x, y]) => [2 * C - x, y] as [number, number]);
  const poly = (points: [number, number][], dx: number, dy: number) =>
    `polygon(${points.map(([x, y]) => `${(x - dx).toFixed(1)}px ${(y - dy).toFixed(1)}px`).join(",")})`;
  const full = [[L, B], ...curve, ...mirror(curve.slice(0, -1).reverse()), [R, B]] as [number, number][];
  const origin = `${C.toFixed(1)}px ${((T + B) / 2).toFixed(1)}px`;
  const leaf = (x0: number): CSSProperties => ({
    backgroundImage: `url(${G.closed})`,
    backgroundSize: `${dW.toFixed(1)}px ${dH.toFixed(1)}px`,
    backgroundPosition: `${(oX - x0).toFixed(1)}px ${(oY - T).toFixed(1)}px`,
  });
  const rx = Math.max(W / (wide ? 1672 : 941), H / (wide ? 941 : 1672));
  const rW = (wide ? 1672 : 941) * rx;
  const rH = (wide ? 941 : 1672) * rx;
  const rOX = (W - rW) / 2;
  const rOY = (H - rH) / 2;
  const [a, b, c, d] = G.cf;
  return {
    wide,
    origin,
    closed: G.closed,
    world: G.world,
    rsvp: G.rsvp,
    ce: String(G.CE),
    we: String(we),
    door: { clipPath: poly(full, 0, 0) } as CSSProperties,
    worldImg: {
      left: boxLeft,
      top: boxTop,
      width: W / we,
      height: H / we,
      backgroundImage: `url(${G.world})`,
      backgroundSize: `${wdW.toFixed(1)}px ${wdH.toFixed(1)}px`,
      backgroundPosition: `${(woX - boxLeft).toFixed(1)}px ${(woY - boxTop).toFixed(1)}px`,
      transformOrigin: `${(C - boxLeft).toFixed(1)}px ${(midY - boxTop).toFixed(1)}px`,
    } as CSSProperties,
    light: { clipPath: poly(full, 0, 0), background: `radial-gradient(ellipse at ${origin}, #FFF, #FFF3D0 30%, rgba(255,214,140,.85) 65%, rgba(255,190,110,.6))` } as CSSProperties,
    leaves: { perspective: `${Math.round((R - L) * 3)}px`, perspectiveOrigin: origin } as CSSProperties,
    leafL: { left: L, top: T, width: C - L, height: B - T, clipPath: poly([[L, B], ...curve, [C, B]], L, T), ...leaf(L) } as CSSProperties,
    leafR: { left: C, top: T, width: R - C, height: B - T, clipPath: poly([[C, B], ...mirror(curve.slice().reverse()), [R, B]], C, T), ...leaf(C) } as CSSProperties,
    seam: { left: C - 3, top: T, height: B - T } as CSSProperties,
    lanterns: G.lan.map(([x, y]) => ({ left: fx(x), top: fy(y) })),
    card: { left: rOX + a * rW, top: rOY + b * rH, width: (c - a) * rW, height: (d - b) * rH } as CSSProperties,
    flash: `radial-gradient(circle at ${origin}, #FFFBEF, #FFE6B0 45%, #F5C77A)`,
  };
}

export function GrandDoorInvite({
  fields,
  quiet = false,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string; attending?: boolean }[];
  onReply?: (reply: Reply) => void | Promise<unknown>;
  demo?: boolean;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond", "Jost");
  const nameId = useId();
  const stageRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>(quiet ? "hero" : "pre");
  const [size, setSize] = useState({ W: 390, H: 844 });
  const [now, setNow] = useState(() => Date.now());
  const [map, setMap] = useState(false);
  const [event, setEvent] = useState(1);
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [plus, setPlus] = useState(false);
  const [guest, setGuest] = useState("");
  const [meal, setMeal] = useState<(typeof MEALS)[number][0]>("veg");
  const [msg, setMsg] = useState("");
  const [wish, setWish] = useState("");
  const [nameErr, setNameErr] = useState(false);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);

  const couple = coupleOf(fields.names);
  const pack = packOf("grandoor", fields.lines);
  const story = ((pack.story ?? []) as StoryBeat[]).slice(0, 3);
  const events = ((pack.programme ?? []) as ProgrammeItem[]).slice(0, 3);
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : ""));
  const g = useMemo(() => geometry(size.W, size.H), [size.W, size.H]);
  const where = [fields.venue, fields.address].filter(Boolean).join(", ");

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      if (node.offsetWidth && node.offsetHeight) setSize({ W: node.offsetWidth, H: node.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function begin() {
    clearTimers();
    if (quiet) {
      setPhase("hero");
      return;
    }
    setPhase("pre");
    timers.current.push(window.setTimeout(() => setPhase("door"), 3400));
  }

  useEffect(() => {
    begin();
    return clearTimers;
    // The opening runs once; replay calls begin again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enter() {
    if (phase !== "door") return;
    setPhase("open");
    timers.current.push(window.setTimeout(() => setPhase("hero"), 3200));
  }

  function replay() {
    setStep("intro");
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    begin();
  }

  async function submit() {
    if (!name.trim()) {
      setNameErr(true);
      return;
    }
    const mealLabel = MEALS.find(([id]) => id === meal)?.[1] ?? "";
    const note = [msg.trim(), plus && guest.trim() ? `Guest: ${guest.trim()}` : plus ? "Bringing a guest" : "", mealLabel].filter(Boolean).join(" · ");
    setSending(true);
    try {
      await onReply?.({ name: name.trim(), note, attending: true });
      setStep("yes");
    } catch {
      setToast("We couldn’t send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function decline() {
    if (name.trim()) {
      try {
        await onReply?.({ name: name.trim(), note: msg.trim(), attending: false });
      } catch {
        /* the regret screen still shows; they can try a wish */
      }
    }
    setStep("no");
  }

  function directions() {
    const query = encodeURIComponent(where || fields.venue || "venue");
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener");
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(where);
      setToast("Address copied.");
    } catch {
      setToast(where || "Address unavailable.");
    }
  }

  function addCalendar() {
    const start = momentOf(fields.date, fields.time);
    if (Number.isNaN(start.getTime())) {
      setToast("The date isn’t set yet.");
      return;
    }
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${couple.first}${couple.second ? ` & ${couple.second}` : ""}`)}&dates=${stamp(start)}/${stamp(end)}&location=${encodeURIComponent(where)}`;
    window.open(url, "_blank", "noopener");
  }

  const left = Math.max(0, Math.floor((momentOf(fields.date, fields.time).getTime() - now) / 1000));
  const count = Number.isNaN(left) ? [0, 0, 0, 0] : [Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, left % 60];
  const order = [event, ...events.map((_, index) => index).filter((index) => index !== event)];
  const opening = phase === "open";
  const door = phase === "door" || opening;
  const title = (fields.title || "invite you to celebrate their love").toUpperCase();

  return (
    <div className={quiet ? "gd is-quiet" : "gd"}>
      <section ref={stageRef} className="gd-stage" aria-label="Opening">
        {door ? (
          <div className="gd-cam" style={{ ["--o" as string]: g.origin, ["--ce" as string]: g.ce }}>
            <div className={opening ? "gd-cam is-open" : "gd-cam is-wait"} style={{ position: "absolute", inset: 0, transformOrigin: g.origin }}>
              <div className="gd-cover" style={{ backgroundImage: `url(${g.closed})` }} />
              {g.lanterns.map((lamp, index) => (
                <span key={index} className="gd-lantern" style={{ left: lamp.left, top: lamp.top, animationDuration: `${1.2 + index * 0.3}s` }} />
              ))}
              {opening ? (
                <div className="gd-world" style={g.door}>
                  <div className="gd-world-img is-open" style={{ ...g.worldImg, ["--we" as string]: g.we }} />
                </div>
              ) : null}
              {opening ? <div className="gd-light" style={g.light} /> : null}
              {opening ? (
                <div className="gd-leaves" style={g.leaves}>
                  <div className="gd-leaf left" style={g.leafL}><div className="gd-shade" /></div>
                  <div className="gd-leaf right" style={g.leafR}><div className="gd-shade" /></div>
                </div>
              ) : null}
              {phase === "door" ? <span className="gd-seam" style={g.seam} /> : null}
            </div>
            {opening ? <div className="gd-flash in" style={{ background: g.flash }} /> : null}
          </div>
        ) : null}

        {phase === "hero" ? (
          <>
            <div className="gd-hero-bg" style={{ backgroundImage: `url(${g.world})`, ["--o" as string]: g.origin }} />
            <div className="gd-hero-shade" />
            <div className="gd-flash out" style={{ background: g.flash }} />
            <div className="gd-hero">
              <div className="gd-lam" style={{ width: size.W >= 760 ? 440 : Math.max(240, size.W - 44), animation: quiet ? undefined : "gd-card 1.3s cubic-bezier(.2,.8,.2,1) .6s both" }}>
                <div className="gd-lam-in">
                  <span className="gd-glass" aria-hidden="true" />
                  <span className="gd-kick gd-in" style={{ animationDelay: "1.4s" }}>{fields.hosts || "A story worth celebrating"}</span>
                  <span className="gd-name" style={{ animation: quiet ? undefined : "gd-wipe 1.2s ease-out 1.8s both" }}>{couple.first}</span>
                  {couple.second ? <span className="gd-amp gd-in" style={{ animationDelay: "2.6s" }}>&amp;</span> : null}
                  {couple.second ? <span className="gd-name" style={{ animation: quiet ? undefined : "gd-wipe 1.2s ease-out 2.8s both" }}>{couple.second}</span> : null}
                  <span className="gd-inv gd-in" style={{ animationDelay: "4s" }}>
                    {title.includes(" THEIR ") ? (
                      <>
                        {title.slice(0, title.indexOf(" THEIR "))}
                        <br />
                        {title.slice(title.indexOf(" THEIR ") + 1)}
                      </>
                    ) : (
                      title
                    )}
                  </span>
                  <span className="gd-rule" />
                  <span className="gd-date gd-in" style={{ animationDelay: "5s" }}>{upperDate(fields.date)}</span>
                  {fields.venue ? <span className="gd-venue-line gd-in" style={{ animationDelay: "5.8s" }}>{fields.venue}</span> : null}
                </div>
              </div>
              <button type="button" className="gd-scroll gd-in" style={{ animationDelay: "6.6s" }} onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth" })}>
                Scroll to continue ↓
              </button>
            </div>
          </>
        ) : null}

        {phase !== "pre"
          ? PETALS.map((color, index) => (
              <span key={index} className="gd-petal" style={{ left: (index * 97) % Math.max(size.W, 1), ["--fy" as string]: `${size.H + 60}px`, color, animationDuration: `${9 + (index % 4) * 2}s`, animationDelay: `-${index * 1.3}s` }}>
                <svg width={10 + (index % 3) * 6} height={10 + (index % 3) * 6} viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={color} /></svg>
              </span>
            ))
          : null}
        {Array.from({ length: 14 }, (_, index) => (
          <span key={index} className="gd-mote" style={{ left: (index * 61) % Math.max(size.W, 1), top: Math.round(size.H * 0.4 + ((index * 47) % (size.H * 0.55))), animationDuration: `${4 + (index % 4)}s`, animationDelay: `${index * 0.4}s` }} />
        ))}

        {phase === "door" ? (
          <button type="button" className="gd-door-hit" aria-label="Enter the invitation" onClick={enter}>
            <span className="gd-door-copy gd-in" style={{ animationDelay: "1s" }}>
              <svg width="26" height="24" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21S2 14 2 7.5A5 5 0 0 1 12 5a5 5 0 0 1 10 2.5C22 14 12 21 12 21z" fill="none" stroke="#E8C987" strokeWidth="1.6" /></svg>
              An invitation<br />awaits you
              <span className="gd-enter">↓ Enter</span>
            </span>
          </button>
        ) : null}

        {phase === "pre" ? (
          <div className="gd-pre">
            <div className="gd-brand">
              <svg width="54" height="54" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="132" fill="#D81B60" /><path d="M256 244C256 244 176 182 176 140C176 110 199 90 225 90C242 90 252 101 256 110C260 101 270 90 287 90C313 90 336 110 336 140C336 182 256 244 256 244Z" fill="#FFF" /><path d="M104 236L256 348L408 236" fill="none" stroke="#FFF" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" /></svg>
              InvitesReady
              <em>presents</em>
            </div>
            <span className="gd-chapter">A new chapter<br />begins…</span>
          </div>
        ) : null}
      </section>

      <section ref={detailsRef} className="gd-sec ink" style={{ minHeight: size.W >= 760 ? 760 : 640, justifyContent: "center" }}>
        <div className="gd-blur" style={{ backgroundImage: `url(${ART.world})` }} />
        <div className="gd-lam" style={{ position: "relative", width: size.W >= 760 ? 460 : Math.max(240, size.W - 44) }}>
          <div className="gd-lam-in" style={{ gap: 22 }}>
            <span className="gd-glass" aria-hidden="true" />
            <span className="gd-kick">The details</span>
            {[
              [upperDate(fields.date), weekday(fields.date)],
              [clock(fields.time), "Onwards"],
              [(fields.venue || "The venue").toUpperCase(), fields.address || ""],
            ].map(([main, sub], index) => (
              <div key={main} className="gd-detail">
                <span className="gd-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C7430" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[index]} /></svg></span>
                {main}
                {sub ? <em>{sub}</em> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gd-venue" aria-label="Venue">
        <img src={ART.venue} alt={fields.venue || "The venue"} />
        <div className="gd-venue-shade" />
        <div className="gd-venue-copy">
          <span className="gd-kick light">The venue</span>
          <span className="gd-venue-name">{fields.venue || "The venue"}</span>
          {fields.address ? <span className="gd-place">{fields.address}</span> : null}
          <button type="button" className="gd-btn glass" aria-expanded={map} onClick={() => setMap((open) => !open)}>{map ? "Hide location" : "View location →"}</button>
          {map ? (
            <div className="gd-map">
              <span>{where}</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                <button type="button" className="gd-btn gold" onClick={directions}>Get directions</button>
                <button type="button" className="gd-btn line" onClick={() => void copyAddress()}>Copy address</button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {story.length ? (
        <section className="gd-sec cream">
          <h2 className="gd-h2 wine">Our story</h2>
          <div className="gd-story">
            <div className="gd-frame">
              {SLOTS.map(({ box, turn, arch }, index) => (
                <span key={story[index]?.title || index} className={arch ? "slot-arch" : turn ? "slot-tilt" : "slot-flat"} style={slotStyle(box, turn)}>
                  <img src={photos[index] || ART.story[index]} alt={story[index]?.title || ""} />
                </span>
              ))}
              <img className="ornament" src={ART.frame} alt="" />
            </div>
            <div className="gd-time">
              {story.map((beat, index) => (
                <div key={beat.title} className="gd-beat">
                  <div className="gd-rail">
                    <span className="gd-dot" />
                    {index < story.length - 1 ? <span className="gd-line" /> : null}
                  </div>
                  <div className="gd-beat-copy">
                    <span className="gd-year">{beat.year}</span>
                    <span className="gd-beat-title">{beat.title}</span>
                    <span className="gd-beat-text">{beat.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {events.length ? (
        <section className="gd-sec night">
          <h2 className="gd-h2 gold">The celebration</h2>
          <span className="gd-note">Tap a card to bring it forward</span>
          <div className="gd-cel">
            <img className="gd-mandap" src={ART.mandap} alt="" />
            {events.map((item, index) => {
              const place = order.indexOf(index);
              const shift = [0, -40, 40][place] ?? 0;
              const tilt = [0, -6, 6][place] ?? 0;
              const scale = [1, 0.92, 0.92][place] ?? 0.92;
              return (
                <button
                  key={item.title}
                  type="button"
                  className="gd-card"
                  aria-pressed={place === 0}
                  onClick={() => setEvent(index)}
                  style={{ top: (size.W >= 760 ? 250 : 230) + place * (size.W >= 760 ? 36 : 30), zIndex: 10 - place, transform: `translateX(${shift}px) rotate(${tilt}deg) scale(${scale})` }}
                >
                  <span className="gd-card-in">
                    <span className="gd-when">{item.kick || item.time}</span>
                    <span className="gd-event">{item.title}</span>
                    <span className="gd-event-time">{item.time}</span>
                    <span className="gd-event-place">{item.text}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="gd-sec cream">
        <span className="gd-kick">The moment is getting closer</span>
        <div className="gd-count">
          {count.map((value, index) => (
            <div key={["DAYS", "HOURS", "MINUTES", "SECONDS"][index]} className="gd-box">
              <span className="gd-num">{String(Math.max(0, value)).padStart(2, "0")}</span>
              <span className="gd-unit">{["DAYS", "HOURS", "MINUTES", "SECONDS"][index]}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="rsvp" className="gd-rsvp" style={{ height: size.H }} aria-label="Reply">
        <img className="gd-rsvp-bg" src={g.rsvp} alt="" />
        <div className="gd-rsvp-shade" />
        <div className="gd-rsvp-card" style={g.card}>
          {step === "intro" ? (
            <div className="gd-col">
              <span className="gd-small">We saved<br />a place for you</span>
              <span className="gd-rule" />
              <span className="gd-big">Will you be joining us?</span>
              <button type="button" className="gd-btn yes" onClick={() => setStep("form")}><span className="gd-shine" aria-hidden="true" /><span style={{ position: "relative" }}>✓ Yes, I’ll be there</span></button>
              <button type="button" className="gd-btn no" onClick={() => void decline()}>× Sorry, I can’t make it</button>
            </div>
          ) : null}
          {step === "form" ? (
            <div className="gd-col" style={{ gap: 10, animation: "gd-up .5s ease both" }}>
              <span className="gd-small">Your details</span>
              <label className="gd-lab" htmlFor={nameId}>Your name</label>
              <input id={nameId} className="gd-field" value={name} placeholder="Full name" onChange={(input) => { setName(input.target.value); setNameErr(false); }} />
              {nameErr ? <span className="gd-err">Please enter your name.</span> : null}
              <span className="gd-lab">Bringing a guest?</span>
              <div className="gd-picks">
                {[true, false].map((value) => (
                  <button key={String(value)} type="button" className={plus === value ? "gd-opt on" : "gd-opt"} aria-pressed={plus === value} onClick={() => setPlus(value)}>{value ? "Yes" : "No"}</button>
                ))}
              </div>
              {plus ? <input className="gd-field" aria-label="Guest name" value={guest} placeholder="Guest name" onChange={(input) => setGuest(input.target.value)} /> : null}
              <span className="gd-lab">Meal preference</span>
              <div className="gd-picks">
                {MEALS.map(([id, label]) => (
                  <button key={id} type="button" className={meal === id ? "gd-opt on" : "gd-opt"} aria-pressed={meal === id} onClick={() => setMeal(id)}>{label}</button>
                ))}
              </div>
              <input className="gd-field" aria-label="A message for the couple" value={msg} placeholder="A message for the couple (optional)" onChange={(input) => setMsg(input.target.value)} />
              <button type="button" className="gd-btn yes" disabled={sending} onClick={() => void submit()}>{sending ? "Sending…" : "Send my RSVP"}</button>
              <button type="button" className="gd-link" onClick={() => setStep("intro")}>Back</button>
            </div>
          ) : null}
          {step === "yes" ? (
            <div className="gd-col" style={{ animation: "gd-card .8s ease both" }}>
              {Array.from({ length: 18 }, (_, index) => {
                const angle = (index / 18) * Math.PI * 2;
                return <span key={index} className="gd-burst" style={{ background: ["#F3DDA8", "#E8C987", "#F7A8B8"][index % 3], ["--x" as string]: `${Math.round(Math.cos(angle) * 160)}px`, ["--y" as string]: `${Math.round(Math.sin(angle) * 160)}px` }} />;
              })}
              <span className="gd-check">✓</span>
              <span className="gd-small">Thank you</span>
              <span className="gd-big">We’ll see you there</span>
              <span className="gd-stamp">{couple.first}{couple.second ? ` & ${couple.second}` : ""} · {shortDate(fields.date)}</span>
              <div className="gd-stack">
                <button type="button" className="gd-btn line" onClick={addCalendar}>+ Add to calendar</button>
                <button type="button" className="gd-btn line" onClick={directions}>⌖ Get directions</button>
                <button type="button" className="gd-btn line" onClick={() => setStep("wish")}>♡ Send a wish</button>
              </div>
            </div>
          ) : null}
          {step === "no" ? (
            <div className="gd-col" style={{ animation: "gd-card .8s ease both" }}>
              <span className="gd-small">We’ll miss you</span>
              <span className="gd-big">Thank you for letting us know</span>
              <span className="gd-soft">Your good wishes mean the world to us.</span>
              <button type="button" className="gd-btn yes" onClick={() => setStep("wish")}>♡ Send a wish</button>
              <button type="button" className="gd-link" onClick={() => setStep("intro")}>Change my reply</button>
            </div>
          ) : null}
          {step === "wish" ? (
            <div className="gd-col" style={{ animation: "gd-up .5s ease both" }}>
              <span className="gd-small">Send a wish</span>
              <textarea className="gd-area" rows={4} aria-label="Your wish" value={wish} placeholder="Write something lovely…" onChange={(input) => setWish(input.target.value)} />
              <button type="button" className="gd-btn yes" onClick={() => setStep("wished")}>Send wish</button>
            </div>
          ) : null}
          {step === "wished" ? (
            <div className="gd-col" style={{ animation: "gd-card .6s ease both" }}>
              <span className="gd-heart">♡</span>
              <span className="gd-big">Your wish is on its way</span>
              <span className="gd-soft">{couple.first}{couple.second ? ` & ${couple.second}` : ""} will treasure it.</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="gd-close">
        <div className="gd-close-scene">
          <img className="gd-close-bg" src={g.world} alt="" />
          <img className="gd-door left" src={ART.doorL} alt="" style={{ left: size.W >= 760 ? "calc(50% - 330px)" : "calc(50% - 205px)" }} />
          <img className="gd-door right" src={ART.doorR} alt="" style={{ left: size.W >= 760 ? "calc(50% + 70px)" : "calc(50% + 20px)" }} />
          <img className="gd-arch" src={ART.arch} alt="" />
        </div>
        <div className="gd-close-shade" />
        <div className="gd-close-copy">
          <span className="gd-wait">We can’t wait<br />to celebrate with you</span>
          <span className="gd-close-names">{couple.first}{couple.second ? ` & ${couple.second}` : ""}</span>
          <button type="button" className="gd-replay" onClick={replay}>↺ Watch the doors open again</button>
          <a className="gd-made" href={madeWithHref("grandoor")}>Made with InvitesReady</a>
        </div>
      </section>

      {toast ? (
        <div className="gd-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
