import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Heart, Music2 } from "lucide-react";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem, type StoryBeat } from "../data/custom";
import type { InviteFields } from "../types";
import { InstagramLink } from "./InstagramLink";
import { Spinner } from "./Loader";
import "./botanica.css";

export type BotanicaTheme = "blush" | "sage" | "midnight";

type Reply = { name: string; note: string; attending: boolean };

const PETAL = ["#EDB8B3", "#F6EEE4", "#E9B892", "#F3D1CB", "#E8C987"];
const WINGS = [
  ["#F2B8B0", "#E9C987"],
  ["#BFD3C2", "#F6EEE4"],
  ["#E9C987", "#F2B8B0"],
] as const;
const LOAD = ["Polishing the rings…", "Arranging the flowers…", "Stringing the fairy lights…", "Setting a seat for you…"];
const FRAMES = {
  arch: "/botanica/frame-arch.png",
  wreath: "/botanica/frame-wreath.png",
  polaroid: "/botanica/frame-polaroid.png",
  oval: "/botanica/frame-oval.png",
  laurel: "/botanica/frame-laurel.png",
  deco: "/botanica/frame-deco.png",
  border: "/botanica/frame-border.png",
};

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  const first = parts[0] || "Nila";
  const second = parts[1] || (parts[0] ? "" : "Kiran");
  const mark = second ? `${first[0] ?? ""} & ${second[0] ?? ""}` : (first[0] ?? "");
  return { first, second, mark, tag: `${first}${second}`.replace(/\s+/g, "") };
}

function when(date: string) {
  const day = new Date(`${date}T12:00:00`);
  if (Number.isNaN(day.getTime())) return null;
  return day;
}

function longDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${weekday} · ${day.getDate()} ${month} ${day.getFullYear()}`;
}

function numericDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(day.getDate())} · ${pad(day.getMonth() + 1)} · ${day.getFullYear()}`;
}

function replyDate(date: string) {
  const day = when(date);
  if (!day) return date;
  return day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function targetOf(date: string, time: string) {
  const stamp = new Date(`${date}T${time || "17:00"}:00`);
  return Number.isNaN(stamp.getTime()) ? Date.now() : stamp.getTime();
}

function Atmosphere({ tall }: { tall?: boolean }) {
  const bulbs = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const x = (index + 0.5) / 12;
        const y = 8 + Math.sin(x * Math.PI * 2 - 0.3) * -10 + x * 8;
        return { left: `${(x * 100).toFixed(2)}%`, top: `${Math.round(y)}px`, delay: `${index * 0.17}s`, duration: `${1.4 + (index % 4) * 0.4}s` };
      }),
    [],
  );
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        left: `${(index * 71) % 100}%`,
        size: 12 + (index % 3) * 5,
        color: PETAL[index % 5],
        fall: `${10 + (index % 5) * 2}s`,
        delay: `-${index * 1.1}s`,
        drift: `${3 + (index % 3)}s`,
        fy: tall ? "120%" : "110%",
      })),
    [tall],
  );
  return (
    <>
      <div className="bf-lights" aria-hidden="true">
        <svg viewBox="0 0 1000 70" preserveAspectRatio="none">
          <path d="M0 6 Q250 64 500 18 T1000 8" stroke="#6E5A48" strokeWidth="2" fill="none" />
        </svg>
        {bulbs.map((bulb) => (
          <span key={bulb.left} className="bf-bulb" style={{ left: bulb.left, top: bulb.top, animationDelay: bulb.delay, animationDuration: bulb.duration }} />
        ))}
      </div>
      {petals.map((petal) => (
        <span key={petal.left + petal.delay} className="bf-petal" style={{ left: petal.left, animationDuration: petal.fall, animationDelay: petal.delay, ["--fy" as string]: petal.fy }} aria-hidden="true">
          <span style={{ animationDuration: petal.drift }}>
            <svg width={petal.size} height={petal.size} viewBox="0 0 20 20">
              <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={petal.color} />
            </svg>
          </span>
        </span>
      ))}
      {WINGS.map((wing, index) => (
        <div key={wing[0] + index} className="bf-fly" style={{ top: `${[18, 46, 72][index]}%`, animationDuration: `${14 + index * 5}s`, animationDelay: `-${index * 5}s` }} aria-hidden="true">
          <svg width={30 + index * 6} height={30 + index * 6} viewBox="0 0 40 32">
            <g className="bf-wing">
              <path d="M20 16C14 4 4 2 3 9c-1 6 7 9 17 7z" fill={wing[0]} />
              <path d="M20 16C12 18 6 24 9 28c3 3 9-4 11-12z" fill={wing[1]} />
            </g>
            <g className="bf-wing">
              <path d="M20 16C26 4 36 2 37 9c1 6-7 9-17 7z" fill={wing[0]} />
              <path d="M20 16C28 18 34 24 31 28c-3 3-9-4-11-12z" fill={wing[1]} />
            </g>
            <rect x="19" y="8" width="2" height="16" rx="1" fill="#5A4636" />
          </svg>
        </div>
      ))}
    </>
  );
}

function EventIcon({ index }: { index: number }) {
  const kind = index % 3;
  if (kind === 0) {
    return (
      <svg className="bf-icon-rings" width="64" height="50" viewBox="0 0 64 50" aria-hidden="true">
        <g className="left"><circle cx="24" cy="28" r="14" /></g>
        <g className="right">
          <circle cx="40" cy="28" r="14" />
          <path d="M40 10l4-5h-8z" />
        </g>
      </svg>
    );
  }
  if (kind === 1) {
    return (
      <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden="true">
        <g className="bf-glass left">
          <path d="M12 6h20l-3 18a7 7 0 0 1-14 0z" />
          <path d="M22 31v17M15 50h14" fill="none" />
        </g>
        <g className="bf-glass right">
          <path d="M32 6h20l-3 18a7 7 0 0 1-14 0z" />
          <path d="M42 31v17M35 50h14" fill="none" />
        </g>
      </svg>
    );
  }
  return (
    <div className="bf-bars" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((bar) => (
        <i key={bar} style={{ animationDuration: `${0.6 + bar * 0.12}s` }} />
      ))}
      <span className="bf-note-float"><Music2 className="glyph" aria-hidden="true" /></span>
    </div>
  );
}

export function BotanicaInvite({
  fields,
  theme = "blush",
  quiet = false,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  theme?: BotanicaTheme;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  const nameId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<"load" | "fade" | "open" | "page">(quiet ? "open" : "load");
  const [progress, setProgress] = useState(quiet ? 100 : 0);
  const [now, setNow] = useState(() => Date.now());
  const [music, setMusic] = useState(false);
  const [toast, setToast] = useState("");
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const names = coupleOf(fields.names);
  const pack = packOf("botanica", fields.lines);
  const story = (pack.story ?? []) as StoryBeat[];
  const events = (pack.programme ?? []) as ProgrammeItem[];
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : ""));
  const day = when(fields.date);
  const messageIndex = Math.min(3, Math.floor(progress / 25));
  const ready = progress >= 100;

  useEffect(() => {
    if (stage !== "load") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage("open");
      return;
    }
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(100, current + 1.4);
        if (next >= 100) window.clearInterval(timer);
        return next;
      });
    }, 45);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (!ready || stage !== "load") return;
    const fade = window.setTimeout(() => setStage("fade"), 700);
    return () => window.clearTimeout(fade);
  }, [ready, stage]);

  useEffect(() => {
    if (stage !== "fade") return;
    const open = window.setTimeout(() => setStage("open"), 800);
    return () => window.clearTimeout(open);
  }, [stage]);

  useEffect(() => {
    if (stage !== "page") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const left = Math.max(0, targetOf(fields.date, fields.time) - now);
  const parts = [
    [Math.floor(left / 86400000), "Days"],
    [Math.floor(left / 3600000) % 24, "Hours"],
    [Math.floor(left / 60000) % 60, "Minutes"],
    [Math.floor(left / 1000) % 60, "Seconds"],
  ] as const;

  function photoAt(index: number) {
    return photos[index] || "";
  }

  function directions(place: string) {
    const query = fields.lat && fields.lng && place === events[0]?.text ? `${fields.lat},${fields.lng}` : place;
    setToast(`Opening directions to ${place}…`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  async function play() {
    const next = !music;
    setMusic(next);
    if (fields.audio && audioRef.current) {
      if (next) await audioRef.current.play().catch(() => setMusic(false));
      else audioRef.current.pause();
      return;
    }
    setToast(next ? "Now playing: acoustic love songs." : "Music paused.");
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setSending(true);
    try {
      await onReply?.({
        name: name.trim(),
        note: attend === "yes" ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "",
        attending: attend === "yes",
      });
      setDone(true);
    } finally {
      setSending(false);
    }
  }

  const burst = Array.from({ length: 14 }, (_, index) => {
    const angle = (index / 14) * Math.PI * 2;
    return {
      color: PETAL[index % 5],
      bx: `${Math.round(Math.cos(angle) * 130)}px`,
      by: `${Math.round(Math.sin(angle) * 110)}px`,
      br: `${index * 50}deg`,
    };
  });

  return (
    <div className={`bf-root ${theme} is-${stage}`} data-motion="on">
      {stage !== "page" ? <Atmosphere /> : null}
      {stage === "load" || stage === "fade" ? (
        <div className={stage === "fade" ? "bf-loader is-fade" : "bf-loader"} role="status" aria-live="polite">
          <div className="bf-rings">
            <svg width="200" height="130" viewBox="0 0 200 130" aria-hidden="true">
              <g className="bf-ring-l" style={{ transform: `translateX(${(-(1 - progress / 100) * 26).toFixed(1)}px)` }}>
                <circle cx="78" cy="72" r="34" fill="none" stroke="#B8893F" strokeWidth="5" strokeDasharray="214" style={{ animation: "bf-draw 1.4s ease-out both" }} />
              </g>
              <g className="bf-ring-r" style={{ transform: `translateX(${((1 - progress / 100) * 26).toFixed(1)}px)` }}>
                <circle cx="122" cy="72" r="34" fill="none" stroke="#D8B574" strokeWidth="5" strokeDasharray="214" style={{ animation: "bf-draw 1.4s ease-out 0.3s both" }} />
                <path className={ready ? "bf-gem on" : "bf-gem"} d="M122 30l7-9h-14z" fill="#F3F0FF" stroke="#B8893F" strokeWidth="1.5" />
              </g>
            </svg>
            {ready
              ? burst.map((piece) => (
                  <span key={piece.br} className="bf-burst" style={{ ["--bx" as string]: piece.bx, ["--by" as string]: piece.by, ["--br" as string]: piece.br }}>
                    <svg width="14" height="14" viewBox="0 0 20 20">
                      <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={piece.color} />
                    </svg>
                  </span>
                ))
              : null}
          </div>
          <div className="bf-bar" aria-hidden="true">
            <span style={{ width: `${Math.round(progress)}%` }} />
          </div>
          <span className="bf-pct">{Math.round(progress)}%</span>
          <span className="bf-msg" key={ready ? "ready" : messageIndex}>
            {ready ? "Your invitation is ready" : LOAD[messageIndex]}
          </span>
        </div>
      ) : null}

      {stage === "open" || stage === "fade" ? (
        <div className="bf-open">
          <div className="bf-wreath-box">
            <img src={FRAMES.wreath} alt="" />
            <div className="bf-wreath-copy">
              <span className="bf-dear">Dear guest</span>
              <span className="bf-kicker">{fields.hosts || "Together with their families"}</span>
              <span className="bf-script bf-foil bf-open-name one">{names.first}</span>
              {names.second ? <span className="bf-amp">&amp;</span> : null}
              {names.second ? <span className="bf-script bf-foil bf-open-name two">{names.second}</span> : null}
              <span className="bf-wed">{fields.title || "are getting married"}</span>
              <span className="bf-date-line">{day ? longDate(fields.date) : fields.date}</span>
            </div>
          </div>
          <button type="button" className="bf-cta" onClick={() => setStage("page")}>
            <span className="bf-shimmer" aria-hidden="true" />
            <span style={{ position: "relative" }}>Open invitation</span>
          </button>
        </div>
      ) : null}

      {stage === "page" ? (
        <>
          <button type="button" className={music ? "bf-music on" : "bf-music"} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={() => void play()}>
            <span className="bf-eq" />
            <span className="bf-eq" />
            <span className="bf-eq" />
            <span className="bf-eq" />
          </button>
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop onEnded={() => setMusic(false)} /> : null}

          <section className="bf-hero">
            <Atmosphere tall />
            <div className="bf-hero-inner">
              <div className="bf-arch">
                <div className="bf-arch-photo">
                  {photoAt(0) ? <img src={photoAt(0)} alt={`${names.first} and ${names.second}`} /> : null}
                </div>
                <img src={FRAMES.arch} alt="" />
              </div>
              <div className="bf-hero-copy">
                <span className="bf-kicker">{fields.hosts || "Together with their families"}</span>
                <span className="bf-script bf-foil bf-hero-name one">{names.first}</span>
                {names.second ? <span className="bf-amp">&amp;</span> : null}
                {names.second ? <span className="bf-script bf-foil bf-hero-name two">{names.second}</span> : null}
                <span className="bf-wed">{fields.title || "invite you to celebrate their wedding"}</span>
                <div className="bf-rule">
                  <i />
                  <span className="bf-num">{numericDate(fields.date)}</span>
                  <i />
                </div>
                <span className="bf-venue">{[fields.venue, fields.address].filter(Boolean).join(" · ")}</span>
                {fields.message ? <p className="bf-note">{fields.message}</p> : null}
              </div>
            </div>
          </section>

          <section className="bf-section alt">
            <div className="bf-deco">
              <img src={FRAMES.deco} alt="" />
              <div className="bf-deco-copy">
                <span className="bf-script bf-cd-kick">Counting down to “I do”</span>
                <div className="bf-cd">
                  {parts.map(([value, label]) => (
                    <div key={label}>
                      <strong>{label === "Days" ? value : String(value).padStart(2, "0")}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {story.length ? (
            <section className="bf-section">
              <h2 className="bf-script bf-h">Our story</h2>
              <div className="bf-row">
                {story.map((chapter, index) => (
                  <article className="bf-pol" key={`${chapter.title}-${index}`} style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="bf-pol-card" style={{ ["--r0" as string]: `${[-4, 3, -2][index % 3]}deg`, ["--r1" as string]: `${[2, -3, 3][index % 3]}deg`, animationDuration: `${4 + index}s` }}>
                      <div className="bf-shot">{photoAt(index) ? <img src={photoAt(index)} alt={chapter.title} /> : null}</div>
                      <img className="frame" src={FRAMES.polaroid} alt="" />
                      <span className="bf-script bf-cap">{chapter.title}</span>
                    </div>
                    <span className="bf-year">{chapter.year}</span>
                    <span className="bf-story">{chapter.text}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {events.length ? (
            <section className="bf-section alt">
              <h2 className="bf-script bf-h">The celebration</h2>
              {fields.dress ? <p className="bf-dress">{fields.dress}</p> : null}
              <div className="bf-row">
                {events.map((item, index) => (
                  <article className="bf-oval" key={`${item.title}-${index}`} style={{ animationDelay: `${index * 0.2}s` }}>
                    <img src={FRAMES.oval} alt="" />
                    <div className="bf-oval-copy">
                      <EventIcon index={index} />
                      <span className="bf-kick">{item.kick}</span>
                      <span className="bf-ename">{item.title}</span>
                      <span className="bf-ewhen">
                        {item.time}
                        <br />
                        {item.text}
                      </span>
                      {item.text ? (
                        <button type="button" className="bf-dir" onClick={() => directions(item.text)}>
                          Directions
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="bf-section">
            <h2 className="bf-script bf-h">Moments in bloom</h2>
            <div className="bf-row">
              {["Bridal bouquet", "A toast", "Golden hour"].map((label, index) => (
                <figure className="bf-bloom" key={label} style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="bf-shot">{photoAt(index + 3) || photoAt(index) ? <img src={photoAt(index + 3) || photoAt(index)} alt={label} /> : null}</div>
                  <img className="frame" src={FRAMES.wreath} alt="" />
                </figure>
              ))}
            </div>
          </section>

          <section className="bf-section alt">
            <div className="bf-border">
              <img src={FRAMES.border} alt="" />
              <div className="bf-border-copy">
                {done ? (
                  <div className="bf-done">
                    {PETAL.map((color, index) => (
                      <span key={color + index} className="bf-confetti" style={{ left: `${(index * 18) % 90}%`, animationDelay: `${index * 0.12}s` }} aria-hidden="true">
                        <svg width={12 + (index % 3) * 5} height={12 + (index % 3) * 5} viewBox="0 0 20 20">
                          <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={color} />
                        </svg>
                      </span>
                    ))}
                    {["#E9A8A2", "#D8B574", "#EDB8B3"].map((color, index) => (
                      <span key={color} className="bf-heart" style={{ left: `${18 + index * 22}%`, color, animationDelay: `${index * 0.35}s` }} aria-hidden="true">
                        <Heart className="glyph" fill="currentColor" />
                      </span>
                    ))}
                    <span className="bf-script bf-foil bf-thanks">{attend === "yes" ? "Thank you!" : "You’ll be missed"}</span>
                    <p>
                      {attend === "yes"
                        ? `We can’t wait to celebrate with you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved.`
                        : `Thank you for letting us know, ${name.trim()}.`}
                    </p>
                    <button type="button" className="bf-dir" onClick={() => setDone(false)}>
                      Change my reply
                    </button>
                  </div>
                ) : (
                  <form
                    className="bf-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submit();
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div className="bf-script bf-rsvp-title">Kindly reply</div>
                      {fields.rsvpBy ? <div className="bf-by">by {replyDate(fields.rsvpBy)}</div> : null}
                    </div>
                    <div className="bf-field">
                      <label className="bf-lab" htmlFor={nameId}>Your name</label>
                      <input
                        id={nameId}
                        className={nameError ? "bad" : undefined}
                        value={name}
                        placeholder="Guest or family name"
                        onChange={(event) => {
                          setName(event.target.value);
                          setNameError(false);
                        }}
                      />
                      {nameError ? <span className="bf-err">Please enter your name.</span> : null}
                    </div>
                    <div className="bf-choice">
                      <button type="button" className={attend === "yes" ? "on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>
                        Joyfully accept
                      </button>
                      <button type="button" className={attend === "no" ? "on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>
                        Regretfully decline
                      </button>
                    </div>
                    {attend === "yes" ? (
                      <div className="bf-guests">
                        <span className="bf-lab">Guests</span>
                        <div className="bf-stepper">
                          <button type="button" className="bf-step" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                          <span className="bf-count" aria-live="polite">{guests}</span>
                          <button type="button" className="bf-step" aria-label="More guests" onClick={() => setGuests((count) => Math.min(8, count + 1))}>+</button>
                        </div>
                      </div>
                    ) : null}
                      <span className="bf-shimmer" aria-hidden="true" />
                      <span style={{ position: "relative" }}>{sending ? "Sending…" : "Send RSVP"}</span>
                    </button>
                    {wishes.length ? (
                      <ul className="bf-wish-list">
                        {wishes.map((wish) => (
                          <li key={`${wish.name}-${wish.note}`}>
                            <strong>{wish.name}</strong>
                            {wish.note ? ` — ${wish.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </form>
                )}
              </div>
            </div>
          </section>

          <footer className="bf-foot">
            <div className="bf-laurel">
              <img src={FRAMES.laurel} alt="" />
              <span className="bf-script bf-mono">{names.mark}</span>
            </div>
            <span className="bf-love">With love, {fields.names || `${names.first} & ${names.second}`}</span>
            <span className="bf-hash">{numericDate(fields.date)} · #{names.tag}</span>
            <a className="bf-credit" href="/">Made with InvitesReady</a>
            <InstagramLink />
          </footer>

          {toast ? (
            <div className="bf-toast" role="status">
              <span style={{ flexGrow: 1 }}>{toast}</span>
              <button type="button" onClick={() => setToast("")}>OK</button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
