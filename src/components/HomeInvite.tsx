import { useEffect, useId, useMemo, useRef, useState } from "react";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { formatLongDate, formatTime } from "../lib/dates";
import type { InviteFields } from "../types";
import "./home.css";

export type HomeTheme = "day" | "sunset" | "night";

type Reply = { name: string; note: string; attending: boolean };

const FLAGS = ["#C8553D", "#F2B544", "#4F7A4B", "#8FB7C9", "#F28BA8"];
const NOTE_COLORS = ["#FFF3A6", "#FDD5C8", "#D4ECD0", "#D6E6F5", "#F9E0F0", "#FFE4B3"];
const ROTATIONS = [-4, 3, -2, 5, -3, 2];

const PROGRAMME_LOOK = [
  { key: "diya", bg: "#FDEFD9" },
  { key: "milk", bg: "#FFFFFF" },
  { key: "food", bg: "#E4F0DD" },
  { key: "lights", bg: "#2E2A25" },
];

const ROOM_LOOK = [
  { icons: ["🛋️", "🪴", "🖼️", "🪑"], bg: "#FDEFD9" },
  { icons: ["☕", "🍳", "🥥", "🫖"], bg: "#E4F0DD" },
  { icons: ["🧸", "🚂", "⭐", "📚"], bg: "#E3EEF6" },
  { icons: ["🌿", "🌼", "🪺", "☀️"], bg: "#FCE3CC" },
];

const SAMPLE_NOTES = [
  { name: "Ammachi", text: "May this home always be full of laughter!" },
  { name: "Jithin", text: "Finally a place big enough for game nights 🎲" },
  { name: "Sneha", text: "Save me the corner seat on the balcony." },
  { name: "The Nairs next door", text: "Welcome to the neighbourhood!" },
];

function whenLine(iso: string, place: string, ceremony: string) {
  const title = ceremony || "Griha Pravesh";
  const date = new Date(`${iso || "2027-01-17"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return `${title} · ${place}`;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${title} · ${weekday}, ${day} ${month} ${date.getFullYear()}${place ? ` · ${place}` : ""}`;
}

function signDate(iso: string) {
  const date = new Date(`${iso || "2027-01-17"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { weekday: "SUNDAY", mid: "17 Jan 2027" };
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
    mid: `${date.getDate()} ${date.toLocaleDateString("en-US", { month: "short" })} ${date.getFullYear()}`,
  };
}

function targetTime(iso: string, time: string) {
  const [hour = "06", minute = "30"] = (time || "06:30").split(":");
  return new Date(`${iso || "2027-01-17"}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+05:30`).getTime();
}

function mapsUrl(place: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

function Sun() {
  return (
    <div className="hw-sun" aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <g stroke="#F2B544" strokeWidth="4" strokeLinecap="round">
          <path d="M50 4v12M50 84v12M4 50h12M84 50h12M17 17l9 9M74 74l9 9M17 83l9-9M74 26l9-9" />
        </g>
        <circle cx="50" cy="50" r="22" fill="#F2B544" />
      </svg>
    </div>
  );
}

function Sky() {
  return (
    <div className="hw-sky-bits" aria-hidden="true">
      <Sun />
      <div className="hw-moon" />
      {Array.from({ length: 12 }, (_, index) => (
        <span
          key={index}
          className="hw-star"
          style={{
            left: `${((index * 17) % 90) + 4}%`,
            top: `${((index * 11) % 40) + 2}%`,
            animationDuration: `${1.8 + (index % 4) * 0.5}s`,
            animationDelay: `${index * 0.3}s`,
          }}
        />
      ))}
      {[0, 1, 2].map((index) => (
        <div key={index} className={`hw-cloud c${index}`}>
          <svg width="100%" height="100%" viewBox="0 0 150 60">
            <path d="M30 55a22 22 0 0 1 4-43 30 30 0 0 1 56-2 24 24 0 0 1 36 23 16 16 0 0 1-6 22z" fill="#FFFFFF" fillOpacity="0.9" />
          </svg>
        </div>
      ))}
      {[0, 1, 2].map((index) => (
        <div key={index} className={`hw-bird b${index}`}>
          <svg width="26" height="14" viewBox="0 0 40 20">
            <g>
              <path d="M2 12C8 4 14 4 20 12C26 4 32 4 38 12" stroke="#2E2A25" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}

function IntroHouse({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <div className="hw-house">
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className="hw-smoke" style={{ ["--sx" as string]: index % 2 ? "14px" : "-10px", animationDelay: `${2.4 + index * 0.8}s` }} aria-hidden="true" />
      ))}
      <svg viewBox="0 0 300 260" fill="none" aria-hidden="true">
        <g className="hw-draw" stroke="#2E2A25" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M20 240H280" fill="none" />
          <rect className="hw-fill" x="60" y="110" width="180" height="130" fill="var(--wall)" />
          <rect className="hw-fill" x="198" y="52" width="24" height="46" fill="#9E4A3A" />
          <path className="hw-fill" d="M36 118L150 38L264 118Z" fill="var(--roof)" />
          <rect className="hw-win a" x="80" y="136" width="38" height="32" rx="3" fill="#8FB7C9" />
          <rect className="hw-win b" x="182" y="136" width="38" height="32" rx="3" fill="#8FB7C9" />
          <circle className="hw-win c" cx="150" cy="88" r="13" fill="#8FB7C9" />
          <rect className="hw-fill" x="132" y="168" width="36" height="72" rx="3" fill="#6B3E2E" />
          <path d="M99 136v32M80 152h38M201 136v32M182 152h38" strokeWidth="1.6" />
          <path className="hw-fill" d="M22 240c0-18 8-26 16-26s16 8 16 26" fill="#4F7A4B" />
          <path className="hw-fill" d="M246 240c0-22 9-32 18-32s18 10 18 32" fill="#4F7A4B" />
          <rect className="hw-fill" x="120" y="240" width="60" height="8" rx="2" fill="#F2B544" />
        </g>
      </svg>
      <div className={open ? "hw-spill on" : "hw-spill"} aria-hidden="true" />
      <div className={open ? "hw-door open" : "hw-door"}>
        <button type="button" aria-label={open ? "Door opened" : "Open the door"} aria-expanded={open} onClick={onOpen}>
          <span className="hw-panel">
            <span className="hw-knob" />
          </span>
        </button>
      </div>
      {open ? null : <span className="hw-key" aria-hidden="true">🔑</span>}
    </div>
  );
}

function HeroHouse() {
  return (
    <div className="hw-house">
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className="hw-smoke" style={{ ["--sx" as string]: index % 2 ? "14px" : "-10px", animationDelay: `${2 + index * 0.8}s` }} aria-hidden="true" />
      ))}
      <svg viewBox="0 0 300 260" fill="none" aria-hidden="true">
        <g stroke="#2E2A25" strokeWidth="2" strokeLinejoin="round">
          <g className="hw-rise">
            <rect x="60" y="110" width="180" height="130" fill="var(--wall)" />
            <path d="M99 136v32M80 152h38M201 136v32M182 152h38" strokeWidth="1.4" />
          </g>
          <rect className="hw-chimney" x="198" y="52" width="24" height="46" fill="#9E4A3A" />
          <path className="hw-roof" d="M36 118L150 38L264 118Z" fill="var(--roof)" />
          <rect className="hw-popwin a" x="80" y="136" width="38" height="32" rx="3" />
          <rect className="hw-popwin b" x="182" y="136" width="38" height="32" rx="3" />
          <circle className="hw-popround" cx="150" cy="88" r="13" />
          <rect className="hw-door-gold" x="132" y="168" width="36" height="72" rx="3" fill="#FFD66B" />
          <path className="hw-door-gold" d="M132 168h20v72h-20z" fill="#6B3E2E" />
          <g className="hw-bush a">
            <path d="M22 240c0-18 8-26 16-26s16 8 16 26" fill="#4F7A4B" />
          </g>
          <g className="hw-bush b">
            <path d="M246 240c0-22 9-32 18-32s18 10 18 32" fill="#4F7A4B" />
          </g>
          <circle className="hw-dot" cx="30" cy="222" r="4" fill="#F28BA8" style={{ animationDelay: "3s" }} />
          <circle className="hw-dot" cx="270" cy="216" r="4" fill="#F2B544" style={{ animationDelay: "3.2s" }} />
          <rect className="hw-mat" x="120" y="240" width="60" height="8" rx="2" fill="#F2B544" />
          <path d="M20 240H280" strokeWidth="2.2" />
        </g>
      </svg>
    </div>
  );
}

export function HomeInvite({
  fields,
  theme = "day",
  quiet = false,
  motion = true,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  theme?: HomeTheme;
  quiet?: boolean;
  motion?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void;
}) {
  const nameId = useId();
  const wishId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<"door" | "welcome" | "page">("door");
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [room, setRoom] = useState(0);
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [guests, setGuests] = useState(3);
  const [wish, setWish] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [added, setAdded] = useState<{ name: string; text: string }[]>([]);

  useEffect(() => {
    if (stage !== "page") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const family = fields.names || "Arun, Deepa & little Aadi";
  const place = fields.address || "Kakkanad";
  const venue = [fields.venue || "Flat 4B, Green Meadows Villas", place].filter(Boolean).join(", ");
  const sign = signDate(fields.date);
  const tag = family.includes("Aadi") ? "#HomeSweetKakkanad" : `#${family.split(",")[0]?.replace(/\s/g, "") || "Home"}`;
  const home = packOf("hearth", fields.lines);
  const ceremony = eventName(fields.lines, "ceremonyName", "Griha Pravesh");
  const milkTitle = typeof home.milkTitle === "string" ? home.milkTitle.trim() : "";
  const programme = (home.programme ?? []).filter((item) => item.title.trim()).map((item, index) => ({ ...PROGRAMME_LOOK[index], ...item, key: PROGRAMME_LOOK[index]?.key ?? `item-${index}` }));
  const rooms = (home.rooms ?? []).filter((item) => item.name.trim() || item.label.trim()).map((item, index) => ({ ...ROOM_LOOK[index], ...item, icons: ROOM_LOOK[index]?.icons ?? [], bg: ROOM_LOOK[index]?.bg ?? "#FDEFD9" }));
  const current = rooms[room] ?? rooms[0] ?? { icons: [] as string[], bg: "#FDEFD9", label: "", name: "", text: "", note: "" };

  const countdown = useMemo(() => {
    let diff = Math.max(0, Math.floor((targetTime(fields.date, fields.time) - now) / 1000));
    const days = Math.floor(diff / 86400);
    diff -= days * 86400;
    const hours = Math.floor(diff / 3600);
    diff -= hours * 3600;
    const mins = Math.floor(diff / 60);
    const secs = diff - mins * 60;
    return [
      { label: "Days", value: String(days), fill: "#F2B544" },
      { label: "Hours", value: String(hours).padStart(2, "0"), fill: "#FDEFD9" },
      { label: "Mins", value: String(mins).padStart(2, "0"), fill: "#DDEFE8" },
      { label: "Secs", value: String(secs).padStart(2, "0"), fill: "#F9D3C8" },
    ];
  }, [fields.date, fields.time, now]);

  const notes = [...added, ...wishes.map((item) => ({ name: item.name, text: item.note })), ...SAMPLE_NOTES];
  const picked = programme.map((item) => item.title).filter((title) => !skipped.includes(title)).map((title) => title.toLowerCase());

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || !fields.audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const attending = attend === "yes";
    const note = [attending ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "", attending ? picked.join(", ") : "", wish.trim()].filter(Boolean).join(" · ");
    onReply?.({ name: name.trim(), attending, note });
    if (wish.trim()) setAdded((currentNotes) => [{ name: name.trim(), text: wish.trim() }, ...currentNotes]);
    setWish("");
    setDone(true);
  }

  return (
    <div className={`home ${theme}`} data-motion={motion ? "on" : "off"}>
      {stage !== "page" ? (
        <section className="hw-open" aria-label="A new home">
          <Sky />
          <div className="hw-ground" />
          <div className="hw-stage">
            <span className="hw-kicker">Dear friend</span>
            <IntroHouse open={stage === "welcome"} onOpen={() => { if (!quiet) setStage("welcome"); }} />
            {stage === "door" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <span className="hw-teaser">Something new is waiting for you…</span>
                <button type="button" className="hw-hint" onClick={() => { if (!quiet) setStage("welcome"); }}>
                  Tap the door to step inside
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div className="hw-welcome">Welcome to our new home!</div>
                <div className="hw-family">{family}</div>
                <div className="hw-date">{whenLine(fields.date, place, ceremony)}</div>
                <button type="button" className="hw-cta" onClick={() => setStage("page")}>
                  Come on in
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <article className="hw-page">
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} onEnded={() => setPlaying(false)} /> : null}
          <button type="button" className={playing ? "hw-music on" : "hw-music"} aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing} onClick={toggleMusic}>
            {[0, 1, 2, 3].map((index) => (
              <i key={index} style={playing ? { animationDuration: `${0.6 + index * 0.15}s`, animationDelay: `${index * 0.1}s` } : undefined} />
            ))}
          </button>
          <nav className="hw-nav" aria-label="Invitation">
            <em>Our new home</em>
            <div>
              <a href="#programme">Programme</a>
              <a href="#tour">House tour</a>
              <a href="#find">Find us</a>
              <a href="#rsvp">RSVP</a>
            </div>
          </nav>

          <section className="hw-hero">
            <Sky />
            <div className="hw-bunting" aria-hidden="true">
              {Array.from({ length: 22 }, (_, index) => (
                <span key={index} className={index >= 9 ? "hw-flag wide" : "hw-flag"} style={{ borderTopColor: FLAGS[index % 5], animationDuration: `${2 + (index % 3) * 0.4}s`, animationDelay: `${index * 0.1}s` }} />
              ))}
            </div>
            <div className="hw-ground" />
            <div className="hw-hero-inner">
              <div className="hw-hero-text">
                <span className="hw-kicker" style={{ animationDelay: "0.3s" }}>{ceremony} &amp; Housewarming</span>
                <h1 className="hw-title">We've found our<br />happy place!</h1>
                <span className="hw-family">{family}</span>
                <span className="hw-sub">{fields.title || "invite you to bless our new home"}</span>
              </div>
              <HeroHouse />
              <div className="hw-sign-wrap">
                <svg width="200" height="30" viewBox="0 0 200 30" aria-hidden="true">
                  <path d="M40 28L100 2L160 28" stroke="#6B3E2E" strokeWidth="2" fill="none" />
                  <circle cx="100" cy="3" r="3" fill="#6B3E2E" />
                </svg>
                <div className="hw-sign">
                  <span>{sign.weekday}</span>
                  <b>{sign.mid}</b>
                  <small>{formatTime(fields.time || "06:30")} onwards</small>
                </div>
              </div>
            </div>
          </section>

          <section className="hw-count" aria-label="Countdown">
            <span className="hw-section-kicker">Moving-in day in</span>
            <div className="hw-count-row">
              {countdown.map((item, index) => (
                <div key={item.label} className="hw-house-num" style={{ animationDelay: `${index * 0.12}s` }}>
                  <svg viewBox="0 0 100 110" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M4 44L50 4L96 44V106H4Z" fill={item.fill} stroke="#2E2A25" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  <strong className={item.label === "Secs" ? "tick" : undefined}>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {milkTitle ? <section className="hw-milk">
            <div className="hw-pot" aria-hidden="true">
              <div className="hw-pot-in">
                <div style={{ position: "absolute", left: 25, top: 20, width: 100, height: 40, overflow: "hidden" }}>
                  <div className="hw-milk-rise" />
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span key={index} className="hw-bubble" style={{ left: 12 + index * 18, animationDelay: `${index * 0.25}s` }} />
                  ))}
                </div>
                <div className="hw-pour l" />
                <div className="hw-pour r" />
                <svg style={{ position: "absolute", left: 0, top: 20 }} width="150" height="110" viewBox="0 0 150 110">
                  <path d="M20 20h110c0 50-20 80-55 80S20 70 20 20z" fill="#C9772F" stroke="#2E2A25" strokeWidth="2" />
                  <ellipse cx="75" cy="20" rx="55" ry="8" fill="#E08E43" stroke="#2E2A25" strokeWidth="2" />
                  <path d="M34 44h82" stroke="#F2B544" strokeWidth="4" />
                </svg>
                <svg style={{ position: "absolute", left: 35, top: 128 }} width="80" height="40" viewBox="0 0 80 40">
                  <g className="hw-flame">
                    <path d="M20 40c0-12 8-16 10-26 4 8 10 10 10 26z" fill="#F2B544" />
                    <path d="M38 40c0-14 8-20 10-30 4 10 12 14 12 30z" fill="#F28B3B" />
                  </g>
                </svg>
              </div>
            </div>
            <div className="hw-milk-text">
              <span className="hw-section-kicker">The first moment in our home</span>
              <h2 className="hw-h2 left">{milkTitle}</h2>
              {fields.detail ? <p>{fields.detail}</p> : null}
            </div>
          </section> : null}

          {programme.length ? <section className="hw-prog" id="programme">
            <h2 className="hw-h2">The day's programme</h2>
            <div className="hw-prog-grid">
              {programme.map((item, index) => (
                <article key={item.key} className="hw-prog-card" style={{ animationDelay: `${index * 0.15}s` }}>
                  <div className="hw-icon" style={{ background: item.bg }} aria-hidden="true">
                    {item.key === "diya" ? (
                      <svg width="44" height="40" viewBox="0 0 44 40">
                        <g style={{ transformOrigin: "22px 20px", animation: "hw-flame 0.6s ease-in-out infinite" }}>
                          <path d="M22 2c4 6 6 10 6 13a6 6 0 0 1-12 0c0-3 2-7 6-13z" fill="#F28B3B" />
                        </g>
                        <path d="M4 24h36c-2 8-8 12-18 12S6 32 4 24z" fill="#C9772F" stroke="#2E2A25" strokeWidth="1.5" />
                      </svg>
                    ) : null}
                    {item.key === "milk" ? <span className="hw-swing">🥛</span> : null}
                    {item.key === "food" ? <span className="hw-bob">🍛</span> : null}
                    {item.key === "lights" ? (
                      <div style={{ display: "flex", gap: 5 }}>
                        {["#F2B544", "#F28BA8", "#8FB7C9", "#9FD18B"].map((color, bulb) => (
                          <span key={color} className="hw-bulb" style={{ background: color, boxShadow: `0 0 8px ${color}`, animationDelay: `${bulb * 0.3}s` }} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <strong>{item.time}</strong>
                    <b>{item.title}</b>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section> : null}

          {rooms.length ? <section className="hw-tour" id="tour">
            <h2 className="hw-h2">A little house tour</h2>
            <div className="hw-tabs" role="tablist" aria-label="Rooms">
              {rooms.map((item, index) => (
                <button key={item.label} type="button" role="tab" className={room === index ? "on" : undefined} aria-selected={room === index} onClick={() => setRoom(index)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className={room % 2 ? "hw-room slide" : "hw-room slideb"} style={{ background: current.bg }} key={current.name}>
              <div className="hw-room-art">
                {current.icons.map((icon, index) => (
                  <span key={icon} style={{ animationDelay: `${index * 0.1}s, ${0.6 + index * 0.2}s`, animationDuration: `0.5s, ${2 + index * 0.3}s` }}>{icon}</span>
                ))}
              </div>
              <div>
                <h3>{current.name}</h3>
                <p>{current.text}</p>
                <em>{current.note}</em>
              </div>
            </div>
          </section> : null}

          <section className="hw-find" id="find">
            <div>
              <h2 className="hw-h2 left">Finding us</h2>
              <p>
                {venue}. <strong>Look for the yellow gate and the mango tree!</strong> Parking is available inside the compound.
              </p>
              <a className="hw-dir" href={mapsUrl(venue)} target="_blank" rel="noreferrer">Get directions</a>
            </div>
            <div className="hw-map">
              <svg className="hw-map-m" viewBox="0 0 350 200" fill="none" aria-hidden="true">
                <path d="M16 175C90 175 90 110 170 110S270 40 330 40" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                <path d="M16 175C90 175 90 110 170 110S270 40 330 40" stroke="#D9CBB2" strokeWidth="2" strokeDasharray="8 8" />
              </svg>
              <svg className="hw-map-d" viewBox="0 0 560 300" fill="none" aria-hidden="true">
                <path d="M20 260C140 260 140 150 260 150S420 60 520 60" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                <path d="M20 260C140 260 140 150 260 150S420 60 520 60" stroke="#D9CBB2" strokeWidth="2" strokeDasharray="8 8" />
              </svg>
              <span className="hw-tree a" aria-hidden="true">🌳</span>
              <span className="hw-tree b" aria-hidden="true">🌴</span>
              <span className="hw-car" aria-hidden="true">🚗</span>
              <span className="hw-pin" aria-hidden="true">🏡</span>
            </div>
          </section>

          <section className="hw-gift">
            <div style={{ position: "relative", width: 80, height: 90 }} aria-hidden="true">
              <svg style={{ position: "absolute", left: 0, bottom: 0 }} width="80" height="50" viewBox="0 0 80 50">
                <path d="M10 6h60l-8 42H18z" fill="#C8553D" stroke="#2E2A25" strokeWidth="2" />
                <rect x="6" y="2" width="68" height="10" rx="3" fill="#E0735A" stroke="#2E2A25" strokeWidth="2" />
              </svg>
              <svg className="hw-plant" width="40" height="50" viewBox="0 0 40 50">
                <path d="M20 50V16" stroke="#4F7A4B" strokeWidth="3" />
                <path d="M20 26C10 26 4 18 4 8c10 0 16 8 16 18zM20 20c8 0 14-6 14-16-8 0-14 6-14 16z" fill="#6FA062" stroke="#2E2A25" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <strong>Your presence is our present</strong>
              <p>{fields.message || "No gifts please — just bring your blessings, your appetite and your best stories."}</p>
            </div>
          </section>

          <section className="hw-rsvp" id="rsvp">
            <div className="hw-rsvp-intro">
              <h2 className="hw-h2 light">Will you drop by?</h2>
              <p>Let us know by {fields.rsvpBy ? formatLongDate(fields.rsvpBy) : "10 January"} so we cook enough payasam!</p>
            </div>
            {done ? (
              <div className="hw-done">
                {Array.from({ length: 20 }, (_, index) => (
                  <span key={index} className="hw-confetti" style={{ top: 0, left: `${(index * 37) % 95}%`, fontSize: 16 + (index % 3) * 6, animation: `hw-confetti ${2.4 + (index % 4) * 0.4}s ease-in both`, animationDelay: `${(index % 6) * 0.15}s` }} aria-hidden="true">
                    {["🏠", "🔑", "💛", "✨", "🌼"][index % 5]}
                  </span>
                ))}
                {[0, 1, 2, 3, 4].map((index) => (
                  <span key={index} className="hw-balloon" style={{ bottom: -40, left: `${8 + index * 20}%`, fontSize: 30 + (index % 2) * 10, animation: `hw-balloon ${4 + index * 0.5}s ease-out infinite`, animationDelay: `${index * 0.4}s` }} aria-hidden="true">🎈</span>
                ))}
                <span style={{ position: "relative", fontSize: 56 }} aria-hidden="true">🗝️</span>
                <h3>{attend === "yes" ? "Yay! See you soon" : "We’ll miss you!"}</h3>
                <p>
                  {attend === "yes"
                    ? `Thanks, ${name.trim()}! We’ve set ${guests} plates${picked.length ? ` for the ${picked.join(" & ")}` : ""}. The door is always open.`
                    : `Thanks for letting us know, ${name.trim()}. Drop by whenever you’re nearby!`}
                </p>
                <button type="button" className="hw-change" onClick={() => setDone(false)}>Change my reply</button>
              </div>
            ) : (
              <form className="hw-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
                <label htmlFor={nameId}>Your name</label>
                <input id={nameId} className={nameError ? "bad" : undefined} value={name} placeholder="Guest or family name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                {nameError ? <span className="err">Please enter your name.</span> : null}
                <div className="hw-yesno">
                  <button type="button" className={attend === "yes" ? "on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>🏡 We'll be there</button>
                  <button type="button" className={attend === "no" ? "on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Can't make it</button>
                </div>
                {attend === "yes" ? (
                  <>
                    <span className="lab">Joining for</span>
                    <div className="hw-chips">
                      {programme.map((item) => (
                        <button key={item.title} type="button" className={skipped.includes(item.title) ? undefined : "on"} aria-pressed={!skipped.includes(item.title)} onClick={() => setSkipped((current) => (current.includes(item.title) ? current.filter((title) => title !== item.title) : [...current, item.title]))}>{item.title}</button>
                      ))}
                    </div>
                    <div className="hw-step">
                      <span className="lab">How many of you?</span>
                      <div>
                        <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                        <span aria-live="polite">{guests}</span>
                        <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(12, count + 1))}>+</button>
                      </div>
                    </div>
                  </>
                ) : null}
                <label htmlFor={wishId}>Leave a note for our fridge</label>
                <input id={wishId} value={wish} placeholder="Optional" onChange={(event) => setWish(event.target.value)} />
                <button type="submit" className="hw-send">Send RSVP</button>
              </form>
            )}
          </section>

          <section className="hw-wishes">
            <h2 className="hw-h2">Notes on our fridge</h2>
            <div className="hw-fridge">
              {notes.map((item, index) => (
                <article key={`${item.name}-${index}`} className="hw-note" style={{ background: NOTE_COLORS[index % 6], ["--r" as string]: `${ROTATIONS[index % 6]}deg`, animationDuration: `${3 + (index % 3)}s` }}>
                  <span className="hw-magnet" style={{ background: FLAGS[index % 5] }} aria-hidden="true" />
                  <p>{item.text}</p>
                  <span>— {item.name}</span>
                </article>
              ))}
            </div>
          </section>

          <footer className="hw-foot">
            <svg width="120" height="104" viewBox="0 0 300 260" aria-hidden="true">
              <path d="M36 118L150 38L264 118Z" fill="#C8553D" stroke="#FFF7EC" strokeWidth="6" strokeLinejoin="round" />
              <rect x="60" y="110" width="180" height="130" fill="#3A3A5A" stroke="#FFF7EC" strokeWidth="6" />
              <rect className="hw-tw" x="80" y="136" width="38" height="32" fill="#FFD66B" style={{ animationDuration: "2s" }} />
              <rect className="hw-tw" x="182" y="136" width="38" height="32" fill="#FFD66B" style={{ animationDuration: "2.6s", animationDelay: "0.8s" }} />
              <rect x="132" y="168" width="36" height="72" fill="#FFD66B" />
            </svg>
            <em>See you at home!</em>
            <small>With love, {family} · {tag}</small>
            <a href="/">Made with InvitesReady</a>
          </footer>
        </article>
      )}
    </div>
  );
}
