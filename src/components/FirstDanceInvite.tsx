import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./firstdance.css";

export type FirstDanceTheme = "ivory" | "rose" | "twilight";

type Phase = "closed" | "entered";
type Reply = { name: string; note: string; attending: boolean };

const ART = "/firstdance";
const ICONS = [`${ART}/cocktail.webp`, `${ART}/dance.webp`, `${ART}/dinner.webp`];
const DRESS = [
  [`${ART}/tie.webp`, "Black tie"],
  [`${ART}/clutch.webp`, "Evening clutch"],
  [`${ART}/shoes.webp`, "Dancing shoes"],
  [`${ART}/jewels.webp`, "Festive jewels"],
] as const;
const SWATCHES = ["#1E1410", "#FBF6EE", "#E9D8B8", "#E8C3BE", "#B8893B"];
const GALLERY = ["Engagement", "Haldi", "Sangeet", "Mehendi", "Us"];
const STORY_PHOTO = GALLERY.length;
const STORY_TONES = ["#eadbc4", "#e8c3be", "#e9d8b8"];
const GALLERY_TONES = ["#eadbc4", "#f1e2cf", "#e8c3be", "#e9d8b8", "#f3e6d6"];
const PETALS = [
  ["a", "4%", 18, "-30px", "280deg", "9s", "0s"],
  ["b", "18%", 26, "20px", "360deg", "11s", "1.4s"],
  ["a", "33%", 20, "-18px", "420deg", "8s", "3s"],
  ["b", "48%", 30, "36px", "240deg", "12s", "0.6s"],
  ["a", "62%", 22, "8px", "500deg", "9s", "4.2s"],
  ["b", "76%", 28, "-22px", "320deg", "10s", "2.1s"],
  ["a", "88%", 18, "14px", "450deg", "8s", "5s"],
  ["b", "96%", 24, "-10px", "390deg", "11s", "1s"],
] as const;

const FILTERS: Record<FirstDanceTheme, string> = {
  ivory: "none",
  rose: "hue-rotate(-14deg) saturate(1.2)",
  twilight: "brightness(0.8) saturate(0.85) hue-rotate(-24deg)",
};

export function firstDanceThemeOf(swatch: string): FirstDanceTheme {
  if (swatch === "rose" || swatch === "twilight") return swatch;
  return "ivory";
}

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Kabir", second: parts[1] || "Ananya" };
}

function stamp(date: string) {
  const day = new Date(`${date}T12:00:00`);
  if (Number.isNaN(day.getTime())) return date;
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${day.getFullYear()}`;
}

function weekdayStamp(date: string) {
  const day = new Date(`${date}T12:00:00`);
  if (Number.isNaN(day.getTime())) return stamp(date);
  const weekday = day.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
  return `${weekday} · ${stamp(date)}`;
}

function tagOf(names: string) {
  const clean = names.replace(/[^A-Za-z& ]/g, "").split(/\s+&\s+/).map((part) => part.replace(/\s+/g, "")).filter(Boolean);
  return `#${clean.join("And") || "First"}Dance`;
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
  const target = new Date(`${date || "2027-02-13"}T${time || "19:00"}:00`).getTime();
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

function CoupleFilm({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !active) return;
    const width = 360;
    const height = 640;
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height * 2;
    const offscreen = off.getContext("2d", { willReadFrequently: true });
    let frame = 0;
    let last = -1;
    let image: ImageData | null = null;
    const draw = () => {
      const surface = canvasRef.current;
      if (surface && offscreen && video.readyState >= 2 && video.currentTime !== last) {
        if (surface.width !== width) {
          surface.width = width;
          surface.height = height;
        }
        const context = surface.getContext("2d");
        if (context) {
          image ??= context.createImageData(width, height);
          last = video.currentTime;
          offscreen.drawImage(video, 0, 0, width, height * 2);
          const pixels = offscreen.getImageData(0, 0, width, height * 2).data;
          const output = image.data;
          const count = width * height * 4;
          for (let index = 0; index < count; index += 4) {
            output[index] = pixels[index];
            output[index + 1] = pixels[index + 1];
            output[index + 2] = pixels[index + 2];
            output[index + 3] = pixels[count + index];
          }
          context.putImageData(image, 0, 0);
        }
      }
      frame = requestAnimationFrame(draw);
    };
    const play = () => {
      video.play().catch(() => undefined);
    };
    play();
    video.addEventListener("canplay", play);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("canplay", play);
      video.pause();
    };
  }, [active]);

  return (
    <>
      <video
        ref={videoRef}
        className="fd-film"
        src={`${ART}/couple.mp4`}
        muted
        playsInline
        loop
        autoPlay
        onError={(event) => {
          const video = event.currentTarget;
          if (!video.src.endsWith(".webm")) video.src = `${ART}/couple.webm`;
        }}
      />
      <canvas ref={canvasRef} width={360} height={640} aria-label="Animation of the couple dancing" />
    </>
  );
}

function Stage({
  lit,
  theme,
  showFilm,
  children,
}: {
  lit: boolean;
  theme: FirstDanceTheme;
  showFilm: boolean;
  children?: ReactNode;
}) {
  const filter = FILTERS[theme] === "none" ? "brightness(1)" : `${FILTERS[theme]} brightness(1)`;
  const dim = FILTERS[theme] === "none" ? "brightness(0.72)" : `${FILTERS[theme]} brightness(0.72)`;
  return (
    <section className="fd-stage" style={{ ["--scene-filter" as string]: filter, ["--scene-dim" as string]: dim }}>
      <div className="fd-scene" />
      <div className="fd-glow" aria-hidden="true" />
      <div className="fd-chandelier" aria-hidden="true"><img src={`${ART}/chandelier.webp`} alt="" /></div>
      <div className="fd-couple" aria-hidden="true">
        <span className="fd-couple-shadow" />
        <span className="fd-couple-halo" />
        {showFilm ? <CoupleFilm active={lit} /> : null}
      </div>
      <div className="fd-curtain l" aria-hidden="true">
        <span><img src={`${ART}/curtain.webp`} alt="" /><img className="fd-extra fd-flip" src={`${ART}/curtain.webp`} alt="" /><img className="fd-extra" src={`${ART}/curtain.webp`} alt="" /></span>
      </div>
      <div className="fd-curtain r" aria-hidden="true">
        <span><img className="fd-flip" src={`${ART}/curtain.webp`} alt="" /><img className="fd-extra" src={`${ART}/curtain.webp`} alt="" /><img className="fd-extra fd-flip" src={`${ART}/curtain.webp`} alt="" /></span>
      </div>
      <div className="fd-frame" aria-hidden="true"><img src={`${ART}/frame.webp`} alt="" /><img className="fd-extra" src={`${ART}/frame.webp`} alt="" /></div>
      {lit ? (
        <div className="fd-petals" aria-hidden="true">
          {PETALS.map(([kind, left, size, dx, rot, dur, delay]) => (
            <img
              key={`${left}-${delay}`}
              src={`${ART}/petal-${kind}.webp`}
              alt=""
              style={{ left, width: size, ["--dx" as string]: dx, ["--rot" as string]: rot, animationDuration: dur, animationDelay: delay }}
            />
          ))}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function FirstDanceInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
  theme = "ivory",
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
  theme?: FirstDanceTheme;
}) {
  useFonts("Mrs Saint Delafield", "Cormorant Garamond", "Cinzel", "Jost");
  const pack = packOf("firstdance", fields.lines);
  const couple = coupleOf(fields.names);
  const [phase, setPhase] = useState<Phase>(quiet ? "entered" : "closed");
  const lit = phase !== "closed";
  const countdown = useCountdown(fields.date, fields.time);
  const nameId = useId();
  const wishId = useId();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [picked, setPicked] = useState<Record<string, boolean>>({ Cocktails: true, "First dance": true, Dinner: true });
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [music, setMusic] = useState(false);

  function openSeal() {
    if (phase !== "closed") return;
    setPhase("entered");
  }

  function continueDown() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("fd-welcome")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
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

  const saved = attend === "yes"
    ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "place is" : "places are"} saved${Object.values(picked).some(Boolean) ? ` for ${Object.entries(picked).filter(([, on]) => on).map(([label]) => label.toLowerCase()).join(", ")}` : ""}.`
    : `Thank you for letting us know, ${name.trim()}. We will save you a slice of cake.`;

  const cards = (pack.wishes ?? []).map((item) => ({ name: item.by, text: item.text }));
  const guestWishes = wishes.filter((item) => item.note?.trim()).map((item) => ({ name: item.name, text: item.note }));
  const loop = [...guestWishes, ...cards, ...guestWishes, ...cards];
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : ""));

  const opened = phase === "entered";

  return (
    <article className={`fd${lit ? " is-lit" : ""}${opened ? " fd-page" : ""}${quiet ? " is-quiet" : ""}`} data-theme={theme}>
      {opened ? (
        <button type="button" className={`fd-music${music ? " is-on" : ""}`} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={() => { setMusic((on) => !on); notify(music ? "Music paused." : "Now playing: our first-dance song."); }}>
          <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14" fill="#1E1410" /><circle cx="15" cy="15" r="10" fill="none" stroke="#4A3A30" strokeWidth="1" /><circle cx="15" cy="15" r="5" fill="#B8893B" /><circle cx="15" cy="15" r="1.5" fill="#FBF6EE" /></svg>
        </button>
      ) : null}
      <Stage lit={lit} theme={theme} showFilm={lit}>
        {opened ? (
          <button type="button" className="fd-scroll" onClick={continueDown}>
            Scroll
            <span aria-hidden="true">↓</span>
          </button>
        ) : (
          <div className="fd-seal">
            <button type="button" className="fd-medal" onClick={openSeal} aria-label="Open the invitation">
              <span className="fd-medal-glow" aria-hidden="true" />
              <img src={`${ART}/seal.webp`} alt="" />
              <span className="fd-monogram">{couple.first[0]}<i>&</i>{couple.second[0]}</span>
            </button>
            <span className="fd-hint">Tap the seal to begin</span>
          </div>
        )}
      </Stage>
      {opened ? (
      <>
      <section className="fd-section fd-welcome" id="fd-welcome">
        <img className="fd-flourish" src={`${ART}/flourish.webp`} alt="" />
        <span className="fd-kicker">{fields.hosts || "Together with their families"}</span>
        <span className="fd-names"><span>{couple.first}</span><span>&</span><span>{couple.second}</span></span>
        <span className="fd-invite">{fields.title || "invite you to celebrate their wedding"}</span>
        <span className="fd-date">{weekdayStamp(fields.date)}</span>
        <span className="fd-place">{fields.venue}</span>
      </section>

      <section className="fd-section fd-count">
        <img src={`${ART}/flourish.webp`} alt="" />
        <span className="fd-label">Counting down to our first dance</span>
        <div className="fd-count-row">
          {countdown.map(([value, label], index) => (
            <div className={`fd-count-box${index === 3 ? " is-secs" : ""}`} key={label} style={{ animationDelay: `${0.2 + index * 0.12}s` }}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fd-section">
        <span className="fd-label">Our story</span>
        <h2>A love in three steps</h2>
        <div className="fd-story-row">
          {(pack.story ?? []).map((beat, index) => (
            <article className="fd-story" key={beat.title} style={{ animationDelay: `${0.2 + index * 0.2}s` }}>
              {photos[STORY_PHOTO + index] ? <img className="fd-arch" src={photos[STORY_PHOTO + index]} alt="" /> : <span className="fd-arch" style={{ background: STORY_TONES[index % STORY_TONES.length] }}>Photo</span>}
              <b>{beat.year}</b>
              <strong>{beat.title}</strong>
              <p>{beat.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fd-section fd-band" id="events">
        <span className="fd-label">The celebrations</span>
        <h2>One magical evening</h2>
        <div className="fd-events">
          {(pack.programme ?? []).map((item, index) => (
            <article className="fd-event" key={item.title}>
              <div className={`fd-event-art is-${["cocktails", "dance", "dinner"][index] ?? "cocktails"}`}>
                <img src={ICONS[index % ICONS.length]} alt="" />
              </div>
              <span className="fd-label">{item.time}</span>
              <h3>{item.title}</h3>
              <p><strong>{item.kick || formatLongDate(fields.date)}</strong><br />{item.text}</p>
              <div className="fd-actions">
                <button type="button" onClick={() => { maps(item.text, fields.address); notify(`Opening directions to ${item.text}…`); }}>Directions</button>
                <button type="button" onClick={() => { const href = calendarUrl(fields); if (href) window.open(href, "_blank", "noopener"); notify(`${item.title} added to your calendar.`); }}>Calendar</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fd-section fd-venue">
        <div className="fd-venue-photo"><img src={`${ART}/venue.webp`} alt={fields.venue || "The venue"} /></div>
        <div className="fd-venue-copy">
          <span className="fd-label">The venue</span>
          <h2>{fields.venue || "The Leela Palace"}</h2>
          <p className="fd-prose">{fields.address}</p>
          {pack.stay ? <p className="fd-prose">{pack.stay.replaceAll("{{names}}", fields.names || `${couple.first} & ${couple.second}`)}</p> : null}
          <button type="button" className="fd-dir" onClick={() => { maps(fields.venue, fields.address); notify(`Opening directions to ${fields.venue}…`); }}>Get directions</button>
        </div>
      </section>

      <section className="fd-section fd-band">
        <span className="fd-label">Dress code</span>
        <h2>{fields.dress || "Black tie & festive glam"}</h2>
        {pack.caption ? <p className="fd-prose">{pack.caption}</p> : null}
        <div className="fd-dress-row">
          {DRESS.map(([src, label], index) => (
            <div className="fd-dress" key={label} style={{ animationDelay: `${index * 0.1}s` }}>
              <img src={src} alt="" style={{ animationDelay: `${-index * 0.6}s` }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="fd-swatches">{SWATCHES.map((color) => <i key={color} style={{ background: color }} />)}</div>
      </section>

      <section className="fd-section">
        <span className="fd-label">Moments</span>
        <h2>Before the big night</h2>
        <div className="fd-gallery">
          {GALLERY.map((label, index) => (
            <div className="fd-shot" key={label} style={photos[index] ? undefined : { background: GALLERY_TONES[index] }}>
              {photos[index] ? <img src={photos[index]} alt={label} /> : <span>{label}</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="fd-section fd-rsvp" id="rsvp">
        <img className="fd-corner l" src={`${ART}/corner.webp`} alt="" />
        <img className="fd-corner r" src={`${ART}/corner.webp`} alt="" />
        <span className="fd-label">Kindly respond</span>
        <h2>Save us a dance?</h2>
        <p className="fd-prose">{fields.rsvpBy ? `Please reply by ${formatLongDate(fields.rsvpBy)}` : "Please reply"}</p>
        {done ? (
          <div className="fd-done">
            <img src={`${ART}/seal.webp`} alt="" />
            <h3>{attend === "yes" ? "See you on the dance floor!" : "We will miss you"}</h3>
            <p className="fd-prose">{saved}</p>
            <button type="button" className="fd-edit" onClick={() => setDone(false)}>Change my reply</button>
          </div>
        ) : (
          <form className="fd-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <div>
              <label htmlFor={nameId}>Your name</label>
              <input id={nameId} className={nameError ? "is-bad" : undefined} value={name} placeholder="Family or guest name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
              {nameError ? <span className="fd-error">Please enter your name.</span> : null}
            </div>
            <div className="fd-choice">
              <button type="button" className={attend === "yes" ? "is-on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
              <button type="button" className={attend === "no" ? "is-on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
            </div>
            {attend === "yes" ? (
              <>
                <div>
                  <span>I'll be at</span>
                  <div className="fd-chips">
                    {Object.keys(picked).map((label) => (
                      <button type="button" key={label} className={picked[label] ? "is-on" : undefined} aria-pressed={picked[label]} onClick={() => setPicked((current) => ({ ...current, [label]: !current[label] }))}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="fd-guests">
                  <span>Guests</span>
                  <div className="fd-step">
                    <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                    <span aria-live="polite">{guests}</span>
                    <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                  </div>
                </div>
              </>
            ) : null}
            <div>
              <label htmlFor={wishId}>A wish for the couple <span>(optional)</span></label>
              <input id={wishId} value={wish} placeholder="Write a short wish" onChange={(event) => setWish(event.target.value)} />
            </div>
            <button type="submit" className="fd-send">Send RSVP</button>
          </form>
        )}
      </section>

      {loop.length ? (
        <section className="fd-section fd-wishes">
          <img src={`${ART}/flourish.webp`} alt="" />
          <h2>Wishes for the couple</h2>
          <div className="fd-marquee">
            {loop.map((item, index) => (
              <article className="fd-wish" key={`${item.name}-${index}`}>
                <span>“</span>
                <p>{item.text}</p>
                <span>— {item.name}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="fd-footer">
        {Array.from({ length: 10 }, (_, index) => (
          <span className="fd-spark" key={index} style={{ left: `${(index * 37) % 96 + 2}%`, top: `${(index * 23) % 70 + 8}%`, fontSize: 8 + (index % 3) * 5, animationDelay: `${index * 0.35}s` }}>✦</span>
        ))}
        <span className="fd-names">{fields.names}</span>
        <span>{stamp(fields.date)} · {tagOf(fields.names)}</span>
        <a className="fd-made" href={madeWithHref("firstdance")}>Made with InvitesReady</a>
      </footer>
      {toast ? <div className="fd-toast" role="status"><span>{toast}</span><button type="button" onClick={() => setToast("")}>OK</button></div> : null}
      </>
      ) : null}
    </article>
  );
}
