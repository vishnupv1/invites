import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { packOf } from "../data/custom";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./lotus.css";

type Phase = "closed" | "opening" | "open";
type Reply = { name: string; note: string; attending: boolean };

const ART = {
  corner: "/lotus/corner.webp",
  spray: "/lotus/spray.webp",
  wreath: "/lotus/wreath.webp",
  hands: "/lotus/hands.webp",
  frame: "/lotus/frame.webp",
  shutter: "/lotus/shutter.webp",
  shutterL: "/lotus/shutter-l.webp",
  shutterR: "/lotus/shutter-r.webp",
  room: "/lotus/room.webp",
  roomD: "/lotus/room-d.webp",
  dove: "/lotus/dove.webp",
  garland: "/lotus/garland.webp",
};

const PHOTOS = ["/lotus/photo-1.webp", "/lotus/photo-2.webp", "/lotus/photo-3.webp"];
const PETALS = ["/lotus/petal-1.webp", "/lotus/petal-2.webp", "/lotus/petal-3.webp"];
const FALLS = [
  { left: "5%", size: 22, x: 40, r: 220, dur: 9, delay: 0 },
  { left: "34%", size: 30, x: -46, r: -245, dur: 11.2, delay: 0.9 },
  { left: "63%", size: 38, x: 52, r: 270, dur: 13.4, delay: 1.8 },
  { left: "92%", size: 22, x: -58, r: -295, dur: 15.6, delay: 2.7 },
  { left: "26%", size: 30, x: 64, r: 320, dur: 9, delay: 3.6 },
  { left: "55%", size: 38, x: -70, r: -345, dur: 11.2, delay: 4.5 },
  { left: "84%", size: 22, x: 76, r: 370, dur: 13.4, delay: 5.4 },
  { left: "18%", size: 30, x: -82, r: -395, dur: 15.6, delay: 6.3 },
  { left: "47%", size: 38, x: 88, r: 420, dur: 9, delay: 7.2 },
  { left: "76%", size: 22, x: -94, r: -445, dur: 11.2, delay: 8.1 },
  { left: "10%", size: 30, x: 100, r: 470, dur: 13.4, delay: 9 },
  { left: "39%", size: 38, x: -106, r: -495, dur: 15.6, delay: 9.9 },
  { left: "68%", size: 22, x: 112, r: 520, dur: 9, delay: 10.8 },
  { left: "2%", size: 30, x: -118, r: -545, dur: 11.2, delay: 11.7 },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const SAMPLE_DATE = "2027-11-29";
const SAMPLE_RSVP = "2027-09-30";

function whenOf(iso: string) {
  const day = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(day.getTime())) return { d: "", m: "", y: "", mon: "" };
  return {
    d: String(day.getDate()).padStart(2, "0"),
    m: String(day.getMonth() + 1).padStart(2, "0"),
    y: String(day.getFullYear()),
    mon: MONTHS[day.getMonth()],
  };
}

function pretty(iso: string) {
  const day = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(day.getTime())) return iso;
  return day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function parseKick(kick: string, year: number) {
  const match = kick.toUpperCase().match(/(\d{1,2})\s+([A-Z]{3,})(?:\s+(\d{4}))?/);
  if (!match) return null;
  const month = MONTHS.indexOf(match[2].slice(0, 3));
  const day = Number(match[1]);
  if (month < 0 || !day) return null;
  const parsedYear = match[3] ? Number(match[3]) : year;
  const date = new Date(parsedYear, month, day, 12);
  if (date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoOf(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function rsvpFor(date: string, rsvpBy: string) {
  if (rsvpBy !== SAMPLE_RSVP || date === SAMPLE_DATE) return rsvpBy;
  const wedding = new Date(`${date}T12:00:00`);
  const sample = new Date(`${SAMPLE_DATE}T12:00:00`);
  const deadline = new Date(`${SAMPLE_RSVP}T12:00:00`);
  if (Number.isNaN(wedding.getTime())) return rsvpBy;
  const delta = Math.round((wedding.getTime() - sample.getTime()) / 86400000);
  return isoOf(addDays(deadline, delta));
}

function cityOf(address: string) {
  const bits = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (bits.length > 1) return bits[bits.length - 2];
  return bits[0] || "";
}

function Frame({ src, alt, mark, lazy = false }: { src?: string; alt?: string; mark?: string; lazy?: boolean }) {
  const loading = lazy ? "lazy" as const : undefined;
  return (
    <div className="ll-pol">
      {src ? (
        <img className="ll-in" src={src} alt={alt || ""} loading={loading} />
      ) : (
        <div className="ll-mono">
          <img src={ART.wreath} alt="" loading={loading} />
          <span>{mark}</span>
        </div>
      )}
      <img className="ll-fr" src={ART.frame} alt="" loading={loading} />
    </div>
  );
}

export function LotusInvite({
  fields,
  onReply,
  quiet = false,
}: {
  fields: InviteFields;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
  quiet?: boolean;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const stdRef = useRef<HTMLElement>(null);
  const timer = useRef(0);
  const nameId = useId();
  const noteId = useId();
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [seen, setSeen] = useState(quiet);
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [off, setOff] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const pack = packOf("lotus", fields.lines);
  const when = whenOf(fields.date);
  const wedding = new Date(`${fields.date}T12:00:00`);
  const weddingOk = !Number.isNaN(wedding.getTime());
  const source = pack.programme?.length
    ? pack.programme
    : [
        { kick: "28 NOV", title: "Haldi & Mehendi", time: "11:00 AM onwards", text: "The Lotus Garden" },
        { kick: "28 NOV", title: "Sangeet", time: "7:30 PM onwards", text: "The Lakeside Terrace" },
        { kick: "29 NOV", title: "The Wedding", time: "6:00 PM · Pheras at dusk", text: "The Lotus Courtyard" },
        { kick: "30 NOV", title: "Reception", time: "8:00 PM onwards", text: "The Palace Lawns" },
      ];
  const year = weddingOk ? wedding.getFullYear() : 2027;
  const parsed = source.map((item) => ({
    n: item.title,
    t: item.time,
    v: item.text,
    at: parseKick(item.kick || "", year),
  }));
  const anchor = parsed.find((item) => /wedding/i.test(item.n) && item.at) ?? parsed.find((item) => item.at);
  const delta = weddingOk && anchor?.at ? Math.round((wedding.getTime() - anchor.at.getTime()) / 86400000) : 0;
  const shown = parsed.map((item) => {
    const at = item.at ? addDays(item.at, delta) : weddingOk ? wedding : null;
    return {
      d: at ? String(at.getDate()).padStart(2, "0") : when.d,
      m: at ? MONTHS[at.getMonth()] : when.mon,
      n: item.n,
      t: item.t,
      v: item.v,
    };
  });
  const replyBy = rsvpFor(fields.date, fields.rsvpBy);
  const sameMonth = shown.length > 0 && shown.every((item) => item.m === shown[0].m);
  const dayNums = shown.map((item) => Number.parseInt(item.d, 10)).filter((day) => !Number.isNaN(day));
  const span = !sameMonth && shown.length > 1
    ? `${Number(shown[0].d)} ${shown[0].m} – ${Number(shown[shown.length - 1].d)} ${shown[shown.length - 1].m}`
    : dayNums.length > 1
      ? `${Math.min(...dayNums)} – ${Math.max(...dayNums)}`
      : shown[0]?.d || when.d;
  const spanMonth = sameMonth ? (shown[0]?.m || when.mon) : "";
  const couple = fields.names.split("&").map((part) => part.trim());
  const first = couple[0] || "Aarohi";
  const second = couple[1] || "Vihaan";
  const mark = `${first.charAt(0)}&${second.charAt(0)}`;
  const shots = [0, 1, 2].map((index) => fields.photos[index] || PHOTOS[index]);
  const place = [fields.venue, cityOf(fields.address)].filter(Boolean).join(" · ").toUpperCase();
  const left = Math.max(0, new Date(`${fields.date}T${fields.time || "18:00"}:00+05:30`).getTime() - now);
  const countdown = {
    days: Math.floor(left / 86400000),
    hours: Math.floor(left / 3600000) % 24,
    minutes: Math.floor(left / 60000) % 60,
    seconds: Math.floor(left / 1000) % 60,
  };

  useEffect(() => {
    if (phase === "closed") return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [phase]);

  useEffect(() => {
    const node = stdRef.current;
    if (!node || phase !== "open") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setSeen(true);
    }, { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [phase]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const board = boardRef.current;
    if (!root || !stage || !board) return;
    const apply = () => {
      const width = stage.clientWidth || root.clientWidth || 390;
      const embedded = Boolean(root.closest(".ir-preview, .ir-play"));
      const wide = !embedded && width >= 900;
      const designW = wide ? 1440 : 390;
      const designH = wide ? 900 : 844;
      const windowH = window.visualViewport?.height ?? window.innerHeight;
      let frame = windowH;
      if (embedded) {
        frame = root.closest(".ir-preview-stage")?.clientHeight || 844;
      } else {
        let box = root.parentElement;
        while (box) {
          const overflowY = getComputedStyle(box).overflowY;
          const clips = overflowY === "hidden" || overflowY === "clip" || overflowY === "auto" || overflowY === "scroll";
          if (clips && box.clientHeight > 80 && box.clientHeight < windowH - 4) {
            frame = box.clientHeight;
            break;
          }
          box = box.parentElement;
        }
      }
      const scale = width / designW;
      const scaled = designH * scale;
      const closed = !root.classList.contains("is-open");
      const height = closed ? frame : scaled;
      const focusTop = scaled * (wide ? 0.08 : 0.14);
      const focusBottom = scaled * (wide ? 0.78 : 0.72);
      let shift = 0;
      if (closed && scaled > frame + 1) {
        const focus = focusBottom - focusTop;
        const aimed = focus <= frame ? -(focusTop - (frame - focus) / 2) : -focusTop;
        shift = Math.max(frame - scaled, Math.min(0, aimed));
      } else if (closed && frame > scaled + 1) {
        shift = frame - scaled;
      }
      board.style.width = `${designW}px`;
      board.style.height = `${designH}px`;
      board.style.transform = `translateY(${shift}px) scale(${scale})`;
      stage.style.height = `${height}px`;
      root.style.height = closed ? `${height}px` : "";
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(root);
    window.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [phase]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function open() {
    if (phase !== "closed") return;
    if (reduce) {
      setPhase("open");
      return;
    }
    setPhase("opening");
    timer.current = window.setTimeout(() => setPhase("open"), 6500);
  }

  function replay() {
    window.clearTimeout(timer.current);
    setPhase("closed");
    setSeen(false);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function directions() {
    const query = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : `${fields.venue} ${fields.address}`.trim();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function addCal() {
    const start = new Date(`${fields.date}T${fields.time || "18:00"}:00+05:30`);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const stamp = (day: Date) => day.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${first} & ${second}`)}&dates=${stamp(start)}/${stamp(end)}&location=${encodeURIComponent(`${fields.venue}, ${fields.address}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const joining = shown.filter((item) => !off.includes(item.n)).map((item) => item.n);
    setSending(true);
    try {
      await onReply?.({
        name: name.trim(),
        attending: attend === "yes",
        note: attend === "yes"
          ? `${guests} ${guests === 1 ? "guest" : "guests"}${joining.length ? ` · ${joining.join(", ")}` : ""}${note.trim() ? ` · ${note.trim()}` : ""}`
          : note.trim(),
      });
      setDone(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`ll${phase !== "closed" ? " is-go" : ""}${phase === "open" ? " is-open" : ""}`}
      data-motion={reduce ? "off" : "on"}
    >
      <section className="ll-stage" ref={stageRef} aria-label="Opening">
        <div className="ll-board" ref={boardRef}>
          <div className="ll-a2">
            <div className="ll-view" />
            <div className="ll-win">
              <div className="ll-leaf ll-left">
                <img className="ll-shutter-m" src={ART.shutter} alt="" />
                <img className="ll-shutter-d" src={ART.shutterL} alt="" />
              </div>
              <div className="ll-leaf ll-right">
                <img className="ll-shutter-m ll-mirror" src={ART.shutter} alt="" />
                <img className="ll-shutter-d" src={ART.shutterR} alt="" />
              </div>
            </div>
            <img className="ll-room ll-room-m" src={ART.room} alt="" />
            <img className="ll-room ll-room-d" src={ART.roomD} alt="" />
            {shots.map((src, index) => (
              <div key={index} className={`ll-drop ll-drop-${index + 1}`}>
                <Frame src={src} alt={`${first} and ${second}`} />
              </div>
            ))}
          </div>
          <div className="ll-a1">
            <img className="ll-corner tl" src={ART.corner} alt="" />
            <img className="ll-corner tr ll-mirror" src={ART.corner} alt="" />
            <img className="ll-spray" src={ART.spray} alt="" />
            <img className="ll-spray side-r ll-mirror" src={ART.spray} alt="" />
            <div className="ll-intro">
              <span className="ll-sub">A LITTLE MOMENT FOR YOU</span>
              <span className="ll-names">{first} &amp; {second}</span>
              <span className="ll-sub ll-stamp">SAVE THE DATE · {when.d} · {when.m} · {when.y}</span>
            </div>
            <span className="ll-tap">TAP TO CLICK A PHOTO</span>
            <div className="ll-ph">
              <Frame mark={mark} />
            </div>
            <img className="ll-hands" src={ART.hands} alt="" />
            <img className="ll-spray front" src={ART.spray} alt="" />
            <span className="ll-flash" />
          </div>
        </div>
        {phase === "closed" ? (
          <button type="button" className="ll-hit" onClick={open} aria-label="Click the camera to open the invitation" />
        ) : null}
        {phase === "open" ? <a className="ll-scroll" href="#ll-std">SCROLL ↓</a> : null}
      </section>

      <section className={`ll-std${seen ? " is-in" : ""}`} id="ll-std" ref={stdRef}>
        <img loading="lazy" className="ll-garland" src={ART.garland} alt="" />
        <img loading="lazy" className="ll-garland r ll-mirror" src={ART.garland} alt="" />
        <img loading="lazy" className="ll-garden ll-garden-m" src="/lotus/garden.webp" alt="" />
        <img loading="lazy" className="ll-garden ll-garden-d" src="/lotus/garden-d.webp" alt="" />
        <img loading="lazy" className="ll-dove" src={ART.dove} alt="" />
        {FALLS.map((petal, index) => (
          <img loading="lazy"
            key={`${petal.left}-${petal.delay}`}
            className={index >= 9 ? "ll-fall extra" : "ll-fall"}
            src={PETALS[index % 3]}
            alt=""
            style={{
              left: petal.left,
              width: petal.size,
              ["--x" as string]: `${petal.x}px`,
              ["--r" as string]: `${petal.r}deg`,
              animationDuration: `${petal.dur}s`,
              animationDelay: `${petal.delay}s`,
            }}
          />
        ))}
        <div className="ll-txt">
          <span className="ll-k" style={{ color: "#6B3F4A" }}>{fields.hosts || "Together with their families"}</span>
          <span className="ll-big">Save the Date</span>
          <span className="ll-couple">{first} <i>&amp;</i> {second}</span>
          <span className="ll-dates"><span>{spanMonth}</span><b>{span}</b><span>{when.y}</span></span>
          <span className="ll-place">{place}</span>
        </div>
      </section>

      <section className="ll-sec" style={{ background: "#FBF3EC" }}>
        <img loading="lazy" className="ll-cor tl" src={ART.corner} alt="" />
        <img loading="lazy" className="ll-cor br" src={ART.corner} alt="" />
        <span className="ll-k">The celebrations</span>
        <h2>Three days of joy</h2>
        <p className="ll-lead" style={{ position: "relative", zIndex: 2 }}>{fields.message}</p>
        <div className="ll-evs">
          {shown.map((item) => (
            <div className="ll-ev" key={`${item.d}-${item.n}`}>
              <div className="ll-dd"><b>{item.d}</b><span>{item.m}</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="ll-name">{item.n}</span>
                <span className="ll-time">{item.t}</span>
                <span className="ll-where">{item.v}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ll-sec ll-gal">
        <span className="ll-k">Little moments</span>
        <h2>Us, so far</h2>
        <div className="ll-fan">
          {shots.map((src) => <Frame key={src} src={src} alt={`${first} and ${second}`} lazy />)}
        </div>
      </section>

      <section className="ll-sec" style={{ background: "linear-gradient(180deg,#FBF3EC,#F7E6E4)" }}>
        <span className="ll-k">Counting down</span>
        <h2>Until our forever</h2>
        <div className="ll-clock">
          <img loading="lazy" src={ART.wreath} alt="" />
          <div className="ll-clock-face"><b>{countdown.days}</b><span>DAYS TO GO</span></div>
        </div>
        <div className="ll-row">
          {([[countdown.hours, "HOURS"], [countdown.minutes, "MINUTES"], [countdown.seconds, "SECONDS"]] as const).map(([value, label]) => (
            <div className="ll-box" key={label}><b>{String(value).padStart(2, "0")}</b><span>{label}</span></div>
          ))}
        </div>
        <div className="ll-venue">
          <div className="ll-venue-photo" />
          <div className="ll-venue-copy">
            <span className="ll-k">The venue</span>
            <b>{fields.venue}</b>
            <span className="ll-lead" style={{ fontSize: 17, fontStyle: "italic" }}>{fields.address}</span>
            <div className="ll-actions" style={{ marginTop: 10 }}>
              <button type="button" className="ll-btn" onClick={directions}>OPEN IN MAPS</button>
              <button type="button" className="ll-btn line" onClick={addCal}>ADD TO CALENDAR</button>
            </div>
          </div>
        </div>
      </section>

      <section className="ll-sec" id="ll-rsvp" style={{ background: "#FBF3EC" }}>
        <img loading="lazy" className="ll-cor tl" src={ART.corner} alt="" />
        <span className="ll-k">RSVP</span>
        <h2>Will you be there?</h2>
        {replyBy ? <span className="ll-k" style={{ color: "#8C6F6A" }}>Kindly let us know by {pretty(replyBy)}</span> : null}
        <form className="ll-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          {done ? (
            <div className="ll-done">
              <div className="ll-mark" style={{ width: 120, height: 120 }}>
                <img loading="lazy" src={ART.wreath} alt="" />
                <span style={{ fontSize: 30 }}>{first.charAt(0)} &amp; {second.charAt(0)}</span>
              </div>
              <span className="ll-script" style={{ fontSize: 42 }}>{attend === "yes" ? `See you there, ${name.trim().split(" ")[0] || "friend"}` : "We’ll miss you"}</span>
              <p className="ll-lead" style={{ fontSize: 18 }}>
                {attend === "yes"
                  ? `${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you.`
                  : "Thank you for letting us know — your blessings mean the world to us."}
              </p>
              <button type="button" className="ll-link" onClick={() => setDone(false)}>CHANGE MY REPLY</button>
            </div>
          ) : (
            <>
              <div>
                <label className="ll-lab" htmlFor={nameId}>FULL NAME</label>
                <input id={nameId} className="ll-field" value={name} onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                {nameError ? <span className="ll-err">PLEASE ENTER YOUR NAME</span> : null}
              </div>
              <div className="ll-seg">
                <button type="button" className="ll-opt" aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                <button type="button" className="ll-opt" aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="ll-step">
                    <span className="ll-lab">GUESTS</span>
                    <div>
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                      <b aria-live="polite">{guests}</b>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span className="ll-lab">JOINING US FOR</span>
                    <div className="ll-chips">
                      {shown.map((item) => (
                        <button
                          key={item.n}
                          type="button"
                          aria-pressed={!off.includes(item.n)}
                          onClick={() => setOff((current) => current.includes(item.n) ? current.filter((title) => title !== item.n) : [...current, item.n])}
                        >
                          {item.n}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              <div>
                <label className="ll-lab" htmlFor={noteId}>A NOTE FOR THE COUPLE</label>
                <textarea id={noteId} className="ll-field" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              <button type="submit" className="ll-btn" style={{ minHeight: 52 }} disabled={sending}>{sending ? "SENDING…" : "SEND MY REPLY"}</button>
            </>
          )}
        </form>
      </section>

      <footer className="ll-foot">
        <div className="ll-mark">
          <img loading="lazy" src={ART.wreath} alt="" />
          <span>{first.charAt(0)} &amp; {second.charAt(0)}</span>
        </div>
        <span className="ll-script" style={{ fontSize: 48 }}>{first} &amp; {second}</span>
        <span className="ll-k" style={{ color: "#8C6F6A" }}>{span} · {when.m} · {when.y}{cityOf(fields.address) ? ` · ${cityOf(fields.address).toUpperCase()}` : ""}</span>
        <button type="button" className="ll-link" onClick={replay}>↺ CLICK THE PHOTO AGAIN</button>
        <a className="ll-k ll-made" href={madeWithHref("lotus")}>MADE WITH INVITESREADY</a>
      </footer>
    </div>
  );
}
