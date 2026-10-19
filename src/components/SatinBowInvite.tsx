import { useEffect, useId, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields, TemplateShot } from "../types";
import "./satinbow.css";

type Phase = "closed" | "untie" | "open" | "done" | "page";
type Reply = { name: string; note: string; attending: boolean };

const ART = "/satinbow";
const SHOTS: TemplateShot[] = [
  { label: "Our first coffee" },
  { label: "The proposal" },
  { label: "Forever begins" },
];
const SAMPLE = [`${ART}/photo-1.webp`, `${ART}/photo-2.webp`, `${ART}/photo-3.webp`];
const SWATCHES = ["#E8C9C0", "#C9938A", "#A7B39A", "#F3E6DA", "#9C6B7E"];
const PETALS = [
  ["0%", 16, "-40px", "300deg", "9s", "0s"],
  ["14%", 23, "13px", "361deg", "12s", "1.4s"],
  ["28%", 16, "-24px", "422deg", "9s", "2.8s"],
  ["42%", 23, "29px", "483deg", "12s", "4.2s"],
  ["56%", 16, "-8px", "544deg", "9s", "5.6s"],
  ["68%", 23, "45px", "605deg", "12s", "7s"],
  ["78%", 16, "8px", "666deg", "9s", "8.4s"],
  ["88%", 23, "-29px", "327deg", "12s", "2.2s"],
  ["94%", 16, "24px", "388deg", "9s", "0.6s"],
  ["97%", 23, "-13px", "449deg", "12s", "3.4s"],
] as const;
const FLIES = [
  { src: "butterfly-a", left: "8%", top: "10%", width: 38, r: "-20deg", a: ["-42px", "-76px", "-55px"], b: ["59px", "38px", "72px"], dur: "15s", delay: "0s", flap: "0.4s" },
  { src: "butterfly-b", left: "78%", top: "22%", width: 31, r: "25deg", a: ["55px", "34px", "68px"], b: ["-72px", "-51px", "-30px"], dur: "18s", delay: "-2s", flap: "0.48s" },
  { src: "butterfly-a", left: "15%", top: "60%", width: 24, r: "-10deg", a: ["-68px", "-47px", "-26px"], b: ["30px", "64px", "43px"], dur: "21s", delay: "-4s", flap: "0.56s" },
] as const;

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Ishaan", second: parts[1] || "Riya" };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function heroDate(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${weekday} · ${day.getDate()} ${month} ${day.getFullYear()}`;
}

function stamp(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${day.getFullYear()}`;
}

function tagOf(names: string) {
  const clean = names.replace(/[^A-Za-z& ]/g, "").split(/\s+&\s+/).map((part) => part.replace(/\s+/g, "")).filter(Boolean);
  return `#${clean.join("Weds") || "IshaanWedsRiya"}`;
}

function maps(venue: string, address: string) {
  const query = [venue, address].filter(Boolean).join(" ");
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const target = new Date(`${date || "2027-02-14"}T${time || "17:00"}:00`).getTime();
  let diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff - mins * 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    [String(days), "Days"],
    [pad(hours), "Hours"],
    [pad(mins), "Mins"],
    [pad(secs), "Secs"],
  ] as const;
}

function Petals({ far }: { far: string }) {
  return (
    <div className="sb-petals" aria-hidden="true">
      {PETALS.map(([left, size, dx, rot, dur, delay]) => (
        <img
          key={`${left}-${delay}`}
          src={`${ART}/petal.webp`}
          alt=""
          style={{ left, width: size, ["--dx" as string]: dx, ["--fy" as string]: far, ["--rot" as string]: rot, animationDuration: dur, animationDelay: delay }}
        />
      ))}
    </div>
  );
}

function Flies() {
  return (
    <>
      {FLIES.map((fly) => (
        <div
          key={`${fly.left}-${fly.top}`}
          className="sb-fly"
          aria-hidden="true"
          style={{
            left: fly.left,
            top: fly.top,
            width: fly.width,
            ["--r" as string]: fly.r,
            ["--a1" as string]: fly.a[0],
            ["--a2" as string]: fly.a[1],
            ["--a3" as string]: fly.a[2],
            ["--b1" as string]: fly.b[0],
            ["--b2" as string]: fly.b[1],
            ["--b3" as string]: fly.b[2],
            animationDuration: fly.dur,
            animationDelay: fly.delay,
          }}
        >
          <img src={`${ART}/${fly.src}.webp`} alt="" style={{ animationDuration: fly.flap }} />
        </div>
      ))}
    </>
  );
}

function ScratchPhoto({ src, active }: { src: string; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gone, setGone] = useState(!active);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active || gone) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const paint = () => {
      const width = Math.round(canvas.offsetWidth * ratio);
      const height = Math.round(canvas.offsetHeight * ratio);
      if (!width || !height || canvas.dataset.ready === "1") return;
      canvas.dataset.ready = "1";
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return;
      const gradient = context.createRadialGradient(width * 0.4, height * 0.35, 4, width / 2, height / 2, height * 0.7);
      gradient.addColorStop(0, "#F8E6DE");
      gradient.addColorStop(0.6, "#E9C6B8");
      gradient.addColorStop(1, "#C99682");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      for (let index = 0; index < 160; index += 1) {
        context.fillStyle = `rgba(255,248,240,${0.25 + Math.random() * 0.6})`;
        context.beginPath();
        context.arc(Math.random() * width, Math.random() * height, (0.6 + Math.random() * 1.6) * ratio, 0, 7);
        context.fill();
      }
      context.fillStyle = "rgba(122,74,62,0.85)";
      context.textAlign = "center";
      context.font = `${Math.round(28 * ratio)}px "Monsieur La Doulaise", cursive`;
      context.fillText("scratch me", width / 2, height / 2);
      context.font = `600 ${Math.round(9 * ratio)}px Jost, sans-serif`;
      context.fillText("✧  TO REVEAL  ✧", width / 2, height / 2 + 22 * ratio);
    };
    paint();
    const frame = window.requestAnimationFrame(paint);
    let down = false;
    let last: [number, number] | null = null;
    let moves = 0;
    const pos = (event: PointerEvent): [number, number] => {
      const box = canvas.getBoundingClientRect();
      return [(event.clientX - box.left) * canvas.width / box.width, (event.clientY - box.top) * canvas.height / box.height];
    };
    const check = () => {
      const context = canvas.getContext("2d");
      if (!context) return;
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      let total = 0;
      for (let index = 3; index < pixels.length; index += 64) {
        total += 1;
        if (pixels[index] < 30) clear += 1;
      }
      if (total && clear / total > 0.45) setGone(true);
    };
    const draw = (point: [number, number]) => {
      const context = canvas.getContext("2d");
      if (!context) return;
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = canvas.width * 0.18;
      context.beginPath();
      context.moveTo((last || point)[0], (last || point)[1]);
      context.lineTo(point[0], point[1]);
      context.stroke();
      last = point;
      moves += 1;
      if (moves % 10 === 0) check();
    };
    const downHandler = (event: PointerEvent) => {
      down = true;
      last = null;
      canvas.setPointerCapture?.(event.pointerId);
      draw(pos(event));
    };
    const moveHandler = (event: PointerEvent) => {
      if (down) draw(pos(event));
    };
    const upHandler = () => {
      down = false;
      last = null;
      check();
    };
    canvas.addEventListener("pointerdown", downHandler);
    canvas.addEventListener("pointermove", moveHandler);
    canvas.addEventListener("pointerup", upHandler);
    canvas.addEventListener("pointercancel", upHandler);
    return () => {
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", downHandler);
      canvas.removeEventListener("pointermove", moveHandler);
      canvas.removeEventListener("pointerup", upHandler);
      canvas.removeEventListener("pointercancel", upHandler);
    };
  }, [active, gone]);

  return (
    <div className="sb-oval-photo" style={{ backgroundImage: `url(${src})` }}>
      {active && !gone ? <canvas ref={canvasRef} aria-label="Scratch to reveal the photo" /> : null}
    </div>
  );
}

function Door({ side }: { side: "l" | "r" }) {
  return (
    <div className={`sb-door ${side}`} aria-hidden="true">
      <div className="sb-door-front">
        <img className="sb-door-m" src={`${ART}/door-m.webp`} alt="" />
        <img className="sb-door-d" src={`${ART}/door-d.webp`} alt="" />
      </div>
      <div className="sb-door-back">
        <div className="face m" />
        <div className="face d" />
      </div>
    </div>
  );
}

export function SatinBowInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  useFonts("Monsieur La Doulaise", "Cormorant Garamond", "Cinzel Decorative", "Jost");
  const pack = packOf("satinbow", fields.lines);
  const couple = coupleOf(fields.names);
  const [phase, setPhase] = useState<Phase>(quiet ? "page" : "closed");
  const countdown = useCountdown(fields.date, fields.time);
  const nameId = useId();
  const wishId = useId();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [music, setMusic] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function untie() {
    if (phase !== "closed") return;
    setPhase("untie");
    timers.current.push(window.setTimeout(() => setPhase("open"), 950));
    timers.current.push(window.setTimeout(() => setPhase("done"), 2900));
  }

  function showInvite() {
    setPhase("page");
    window.setTimeout(() => {
      document.getElementById("sb-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    try {
      await onReply?.({ name: name.trim(), note: wish.trim(), attending: attend === "yes" });
      setDone(true);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not send that reply.");
    }
  }

  const events = pack.programme ?? [];
  const chips = events.map((item) => item.title).filter(Boolean);
  const chosen = chips.filter((label) => picked[label] !== false);
  const saved = attend === "yes"
    ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved${chosen.length ? ` for the ${chosen.join(" and ").toLowerCase()}` : ""}.`
    : `Thank you for letting us know, ${name.trim()}. We will share the photos with you!`;
  const notes = photoNotes(fields.notes, SHOTS);
  const photos = SHOTS.map((_, index) => (fields.photos?.[index] ? assetUrl(fields.photos[index]) : SAMPLE[index]));
  const cards = (pack.wishes ?? []).map((item) => ({ name: item.by, text: item.text }));
  const guestWishes = wishes.filter((item) => item.note?.trim()).map((item) => ({ name: item.name, text: item.note }));
  const mine = done && wish.trim() ? [{ name: name.trim(), text: wish.trim() }] : [];
  const notesLoop = [...mine, ...guestWishes, ...cards];
  const loop = [...notesLoop, ...notesLoop];
  const showPage = quiet || phase === "page";
  const monogram = `${couple.first[0] || "I"}`;
  const monogram2 = `${couple.second[0] || "R"}`;

  return (
    <article className={`sb is-${phase}${quiet ? " is-quiet" : ""}`}>
      {!showPage ? (
        <section className="sb-stage">
          <div className="sb-wash" />
          <div className="sb-scene">
            <div className="sb-card">
              <img className="sb-card-corner tl" src={`${ART}/corner.webp`} alt="" />
              <img className="sb-card-corner br" src={`${ART}/corner.webp`} alt="" />
              <span className="sb-dear sb-reveal a1">Dear guest</span>
              <span className="sb-serif sb-joy sb-reveal a2">with joy in our hearts,<br />we invite you to celebrate</span>
              <div className="sb-locket sb-reveal a3">
                <img src={`${ART}/wreath.webp`} alt="" />
                <span className="one">{couple.first}</span>
                <span className="amp">&</span>
                <span className="two">{couple.second}</span>
              </div>
              <img className="sb-card-flourish sb-reveal a4" src={`${ART}/flourish.webp`} alt="" />
              <span className="sb-serif sb-card-date sb-reveal a4">{stamp(fields.date)}</span>
              <span className="sb-serif sb-card-place sb-reveal a4">{fields.venue}</span>
              <button type="button" className="sb-open-btn sb-reveal a5" onClick={showInvite}>Open the invitation</button>
              <Flies />
            </div>
            <Door side="l" />
            <Door side="r" />
            <div className="sb-rib l" aria-hidden="true"><span /></div>
            <div className="sb-rib r" aria-hidden="true"><span /></div>
            {phase !== "done" ? (
              <>
                <button type="button" className="sb-bow" onClick={untie} aria-label="Untie the bow to open the invitation">
                  <img className="sb-lift" src={`${ART}/bow.webp`} alt="" />
                  <span className="sb-seal">
                    <img src={`${ART}/seal.webp`} alt="" />
                    <span className="sb-mono">{monogram}<i>&</i>{monogram2}</span>
                  </span>
                </button>
              </>
            ) : null}
          </div>
          {phase === "closed" ? <span className="sb-hint">Tap the bow to open</span> : null}
        </section>
      ) : (
        <>
          <button
            type="button"
            className={`sb-music${music ? " is-on" : ""}`}
            aria-pressed={music}
            aria-label={music ? "Pause music" : "Play music"}
            onClick={() => {
              setMusic((on) => !on);
              notify(music ? "Music paused." : "Now playing: our song.");
            }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14" fill="#5A3F3A" /><circle cx="15" cy="15" r="10" fill="none" stroke="#7A5A52" strokeWidth="1" /><circle cx="15" cy="15" r="5" fill="#F0D2C2" /><circle cx="15" cy="15" r="1.5" fill="#FBF2EC" /></svg>
          </button>

          <section className="sb-hero" id="sb-hero">
            <Petals far="904px" />
            <img className="sb-hero-corner tl" src={`${ART}/corner.webp`} alt="" />
            <img className="sb-hero-corner br" src={`${ART}/corner.webp`} alt="" />
            <Flies />
            <span className="sb-kicker">{fields.hosts || "Together with their families"}</span>
            <div className="sb-names">
              <img src={`${ART}/wreath.webp`} alt="" />
              <strong>{couple.first}</strong>
              <em>&</em>
              <strong>{couple.second}</strong>
            </div>
            <span className="sb-serif sb-invite">
              {fields.title || "request the pleasure of your company"}
              <br />
              {fields.message || "as they begin their forever"}
            </span>
            <img className="sb-flourish" src={`${ART}/flourish.webp`} alt="" />
            <span className="sb-serif sb-date">{heroDate(fields.date)}</span>
            <span className="sb-serif sb-place">{[fields.venue, fields.address].filter(Boolean).join(", ")}</span>
          </section>

          <section className="sb-section sb-band">
            <img className="sb-lift sb-count-bow" src={`${ART}/bow-mark.webp`} alt="" />
            <span className="sb-kicker">Until we say I do</span>
            <div className="sb-count">
              {countdown.map(([value, label], index) => (
                <div key={label} className={index === 3 ? "is-secs" : undefined}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="sb-section">
            <Flies />
            <span className="sb-kicker sb-rv">Our story</span>
            <h2 className="sb-h sb-rv">How it all began</h2>
            <div className="sb-story">
              <span className="sb-story-line" aria-hidden="true" />
              {(pack.story ?? []).map((beat, index) => (
                <article className="sb-beat sb-rv" key={beat.title}>
                  <img className="sb-beat-bug" src={`${ART}/${index % 2 ? "butterfly-b" : "butterfly-a"}.webp`} alt="" />
                  <div className="sb-card-copy">
                    <b>{beat.year}</b>
                    <strong>{beat.title}</strong>
                    <p>{beat.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="sb-section sb-band">
            <img className="sb-corner-float" src={`${ART}/corner.webp`} alt="" />
            <span className="sb-kicker sb-rv">Our moments</span>
            <h2 className="sb-h sb-rv">Through the looking glass</h2>
            <div className="sb-moments">
              {SHOTS.map((shot, index) => (
                <figure className="sb-moment sb-rv" key={shot.label}>
                  <div className="sb-oval">
                    <ScratchPhoto src={photos[index]} active={!quiet && !revealed[index]} />
                    <img className="sb-lift" src={`${ART}/frame.webp`} alt="" />
                  </div>
                  <figcaption>{notes[index]?.title || shot.label}</figcaption>
                  {!quiet && !revealed[index] ? (
                    <button type="button" className="sb-reveal-btn" onClick={() => setRevealed((current) => ({ ...current, [index]: true }))}>or tap to reveal</button>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>

          <section className="sb-section" id="venue">
            <span className="sb-kicker sb-rv">The celebration</span>
            <h2 className="sb-h sb-rv">Where & when</h2>
            <div className="sb-gazebo sb-rv">
              <img className="sb-lift" src={`${ART}/gazebo.webp`} alt={fields.venue || "Floral garden gazebo"} />
              <div>
                <strong>I do</strong>
                <span>{formatTime(fields.time) || "5:00 PM"}</span>
              </div>
            </div>
            <div className="sb-events">
              {events.map((item) => (
                <article className="sb-event sb-rv" key={item.title}>
                  <span>{[item.time, item.kick].filter(Boolean).join(" · ")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <div className="sb-actions">
                    <button type="button" onClick={() => { maps(item.text, fields.address); notify(`Opening directions to ${item.text}…`); }}>Directions</button>
                    <button type="button" onClick={() => { const href = calendarUrl(fields); if (href) window.open(href, "_blank", "noopener"); notify(`${item.title} added to your calendar.`); }}>Calendar</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="sb-section sb-band">
            <span className="sb-kicker sb-rv">Dress code</span>
            <h2 className="sb-h sb-rv">{fields.dress || "Garden romance"}</h2>
            {pack.caption ? <p className="sb-prose sb-rv">{pack.caption}</p> : null}
            <div className="sb-dress">
              <figure className="sb-rv"><img src={`${ART}/ladies.webp`} alt="Illustration of bridesmaids in pastel gowns" /><span className="sb-kicker">For the ladies</span></figure>
              <figure className="sb-rv"><img src={`${ART}/gentlemen.webp`} alt="Illustration of groomsmen in pastel suits" /><span className="sb-kicker">For the gentlemen</span></figure>
            </div>
            <div className="sb-swatches" aria-hidden="true">{SWATCHES.map((color) => <i key={color} style={{ background: color }} />)}</div>
          </section>

          <section className="sb-rsvp" id="rsvp">
            <img className="sb-rsvp-corner tl" src={`${ART}/corner.webp`} alt="" />
            <img className="sb-rsvp-corner br" src={`${ART}/corner.webp`} alt="" />
            <div className="sb-rsvp-head">
              <span>Kindly reply</span>
              <h2>Will you join us?</h2>
              <p>{fields.rsvpBy ? `Please reply by ${formatLongDate(fields.rsvpBy)}` : "Please reply"}</p>
            </div>
            {done ? (
              <div className="sb-done">
                <Petals far="420px" />
                <img src={`${ART}/wreath.webp`} alt="" />
                <h3 className="sb-h">{attend === "yes" ? "We can’t wait!" : "You’ll be missed"}</h3>
                <p>{saved}</p>
                <button type="button" className="sb-edit" onClick={() => setDone(false)}>Change my reply</button>
              </div>
            ) : (
              <form className="sb-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                <div className="sb-field">
                  <label htmlFor={nameId}>Your name</label>
                  <input id={nameId} className={nameError ? "is-bad" : undefined} value={name} placeholder="Family or guest name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                  {nameError ? <span className="sb-error">Please enter your name.</span> : null}
                </div>
                <div className="sb-choice">
                  <button type="button" className={attend === "yes" ? "is-on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                  <button type="button" className={attend === "no" ? "is-on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
                </div>
                {attend === "yes" ? (
                  <>
                    {chips.length ? (
                      <div className="sb-field">
                        <span>I'll be at</span>
                        <div className="sb-chips">
                          {chips.map((label) => (
                            <button type="button" key={label} className={picked[label] === false ? undefined : "is-on"} aria-pressed={picked[label] !== false} onClick={() => setPicked((current) => ({ ...current, [label]: current[label] === false }))}>{label}</button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="sb-guests">
                      <span>Guests</span>
                      <div className="sb-step">
                        <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                        <span aria-live="polite">{guests}</span>
                        <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                      </div>
                    </div>
                  </>
                ) : null}
                <div className="sb-field">
                  <label htmlFor={wishId}>A wish for us <span>(optional)</span></label>
                  <input id={wishId} value={wish} placeholder="Write a short wish" onChange={(event) => setWish(event.target.value)} />
                </div>
                <button type="submit" className="sb-send"><i aria-hidden="true" /><span>Send RSVP</span></button>
              </form>
            )}
          </section>

          {loop.length ? (
            <section className="sb-section sb-wishes">
              <div>
                <img className="sb-flourish" src={`${ART}/flourish.webp`} alt="" />
                <h2 className="sb-h">Love notes</h2>
              </div>
              <div className="sb-marquee">
                <div className="sb-track">
                  {loop.map((item, index) => (
                    <article className="sb-wish" key={`${item.name}-${index}`}>
                      <img src={`${ART}/butterfly-b.webp`} alt="" />
                      <p>{item.text}</p>
                      <span>— {item.name}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <footer className="sb-footer">
            <Petals far="780px" />
            <img className="sb-hero-corner tl" src={`${ART}/corner.webp`} alt="" />
            <span className="sb-kicker">Thank you</span>
            <span className="sb-script sb-h">{fields.names || `${couple.first} & ${couple.second}`}</span>
            <span className="sb-serif">{stamp(fields.date)} · {tagOf(fields.names)}</span>
            <a className="sb-made" href={madeWithHref("satinbow")}>Made with InvitesReady</a>
            <img className="sb-couple" src={`${ART}/couple.webp`} alt="Illustration of the couple walking away hand in hand" />
          </footer>
        </>
      )}
      {toast ? <div className="sb-toast" role="status"><span>{toast}</span><button type="button" onClick={() => setToast("")}>OK</button></div> : null}
    </article>
  );
}
