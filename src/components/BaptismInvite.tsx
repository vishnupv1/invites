import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Baby, Bird, Heart, Milk, Smile, Sparkle, type LucideIcon } from "lucide-react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import catalogMeta from "../data/template-meta.json";
import { calendarUrl, formatTime } from "../lib/dates";
import { InstagramLink } from "./InstagramLink";
import "./baptism.css";

export type BaptismTheme = "sky" | "blush" | "sage";
type Theme = BaptismTheme;

const THEMES: Record<Theme, { sky: string; deep: string; water: string }> = {
  sky: { sky: "linear-gradient(180deg, #CFE4F5 0%, #EAF3FB 55%, #FDF9F1 100%)", deep: "#2F5E8A", water: "linear-gradient(160deg, #4F86B8 0%, #2F5E8A 100%)" },
  blush: { sky: "linear-gradient(180deg, #F6DCE2 0%, #FBEEF1 55%, #FDF9F1 100%)", deep: "#9B4A5E", water: "linear-gradient(160deg, #C27588 0%, #9B4A5E 100%)" },
  sage: { sky: "linear-gradient(180deg, #DCE8D9 0%, #EFF5EC 55%, #FDF9F1 100%)", deep: "#4E6B4A", water: "linear-gradient(160deg, #7A9774 0%, #4E6B4A 100%)" },
};

const INTRO_M = [[40, 150], [320, 120], [70, 330], [330, 300], [30, 520], [350, 480], [110, 700], [280, 690], [190, 90], [200, 760]];
const INTRO_D = [[80, 140], [1340, 110], [200, 420], [1280, 380], [60, 700], [1360, 660], [520, 80], [900, 60], [700, 820], [1100, 800], [380, 250], [1180, 220], [420, 740], [980, 470]];
const HERO_M = [[30, 90], [340, 70], [60, 420], [320, 440], [180, 30], [12, 300], [360, 200], [200, 520]];
const HERO_D = [[60, 150], [1360, 130], [560, 110], [880, 90], [40, 480], [1390, 420], [620, 600], [760, 250], [1020, 640], [300, 640], [1200, 700], [460, 300]];
const DARK_M = [[24, 30], [350, 50], [40, 200], [340, 260], [180, 14], [300, 140]];
const DARK_D = [[40, 40], [1380, 60], [80, 420], [1360, 460], [700, 24], [560, 500], [1000, 30], [300, 200], [1200, 250], [900, 520]];

const FACT_ICONS: LucideIcon[] = [Baby, Milk, Smile, Heart];

function initialsOf(name: string) {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

const SAMPLE_WISHES = [
  { name: "Grandma Annamma", text: "May God hold you close always, my little angel." },
  { name: "Uncle Tony", text: "Welcome to the family of faith, champ!" },
  { name: "The Kurian family", text: "Praying for a life full of love, light and laughter." },
  { name: "Sister Rose", text: "God bless you abundantly, dear one." },
  { name: "Neethu & Arun", text: "So much love for our little sunshine." },
];

const BUBBLES = [20, 60, 110, 170, 220, 260, 300, 330, 380, 440, 500, 540];
const CONFETTI = ["#D9B26A", "#2F5E8A", "#FFFFFF", "#F2B8C6", "#9FC7E8", "#B7D3A8"];

function firstName(names: string) {
  return names.split(/\s+/)[0] || names;
}

function whenOf(iso: string) {
  const date = iso ? new Date(`${iso}T12:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return { long: "", chip: "", line: "" };
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const shortMonth = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();
  const shortWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  return {
    long: `${weekday}, ${day} ${month} ${year}`,
    chip: `${shortWeek}, ${day} ${shortMonth} ${year}`,
    line: `${weekday} · ${day} ${month} ${year}`,
  };
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = date ? new Date(`${date}T${time || "00:00"}:00`).getTime() : now;
  let diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff - mins * 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    { v: String(days), l: "Days" },
    { v: pad(hours), l: "Hours" },
    { v: pad(mins), l: "Mins" },
    { v: pad(secs), l: "Secs" },
  ];
}

function mapsHref(venue: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} ${address}`.trim())}`;
}

function toneOf(theme: Theme) {
  const ink = THEMES[theme];
  return { ["--sky" as string]: ink.sky, ["--deep" as string]: ink.deep, ["--water" as string]: ink.water };
}

function Cloud() {
  return (
    <svg viewBox="0 0 150 60" aria-hidden="true">
      <path d="M30 55a22 22 0 0 1 4-43 30 30 0 0 1 56-2 24 24 0 0 1 36 23 16 16 0 0 1-6 22z" fill="#FFFFFF" />
    </svg>
  );
}

function Dove() {
  return (
    <svg viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <g className="bp-wing">
        <path d="M58 44C46 20 24 8 4 10c14 10 22 26 30 40z" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.5" />
      </g>
      <path d="M30 56c10-10 30-16 48-12 12 3 20 0 28-6-2 10-8 18-18 22l8 14c-10-2-18-6-24-12-14 6-30 4-42-6z" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.5" />
      <g className="bp-wing bp-wing-r">
        <path d="M62 44c6-22 24-38 46-40-8 14-14 30-24 44z" fill="#F4F8FC" stroke="currentColor" strokeWidth="1.5" />
      </g>
      <circle cx="98" cy="42" r="1.8" fill="currentColor" />
      <path d="M106 40l8 2-8 3" stroke="#B8893B" strokeWidth="1.5" fill="#E6C893" />
      <path d="M84 54c6 4 12 6 18 4" stroke="#8FB36B" strokeWidth="2" strokeLinecap="round" />
      <path d="M92 57c1-4 4-6 7-6M98 58c2-3 5-4 7-3" stroke="#8FB36B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Rays() {
  return (
    <svg className="bp-rays" viewBox="0 0 760 760" fill="none" aria-hidden="true">
      <g fill="#FFFFFF" fillOpacity="0.35">
        <path d="M380 380L360 0h40z" />
        <path d="M380 380L760 360v40z" />
        <path d="M380 380L400 760h-40z" />
        <path d="M380 380L0 400v-40z" />
        <path d="M380 380L630 90l28 28z" />
        <path d="M380 380L670 630l-28 28z" />
        <path d="M380 380L130 670l-28-28z" />
        <path d="M380 380L90 130l28-28z" />
      </g>
    </svg>
  );
}

function Sparks({ points, variant, size }: { points: number[][]; variant: "m" | "d"; size: "intro" | "dark" }) {
  return points.map(([x, y], index) => (
    <span
      key={`${variant}-${index}`}
      className={`bp-spark bp-spark-${variant}`}
      style={{
        left: x,
        top: y,
        fontSize: (size === "dark" ? 10 : 10) + (index % 3) * (variant === "d" ? 6 : 5),
        animationDuration: `${2 + (index % 4) * 0.6}s`,
        animationDelay: `${index * (variant === "d" ? 0.3 : 0.35)}s`,
        color: size === "dark" ? "#F1DDB0" : undefined,
      }}
      aria-hidden="true"
    >
      <Sparkle className="glyph" />
    </span>
  ));
}

function CountdownBoxes({ items }: { items: { v: string; l: string }[] }) {
  return (
    <>
      {items.map((item, index) => (
        <div key={item.l} className="bp-count-box" style={{ animationDelay: `${1.4 + index * 0.12}s` }}>
          <strong className={index === 3 ? "tick" : undefined}>{item.v}</strong>
          <small>{item.l}</small>
        </div>
      ))}
    </>
  );
}

export function BaptismInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
  theme: themeProp,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
  theme?: Theme;
}) {
  const child = firstName(fields.names);
  const pack = packOf("baptism", fields.lines);
  const ceremony = eventName(fields.lines, "ceremonyName", "Holy Baptism");
  const reception = eventName(fields.lines, "receptionName", "Lunch & cake");
  const godparents = (pack.people ?? []).filter((person) => person.name.trim()).map((person) => ({ ...person, initials: initialsOf(person.name) }));
  const facts = (pack.facts ?? []).filter((fact) => fact.label.trim() || fact.value.trim()).map((fact, index) => ({ ...fact, icon: FACT_ICONS[index] ?? Sparkle }));
  const when = whenOf(fields.date);
  const count = useCountdown(fields.date, fields.time);
  const photos = (fields.photos ?? []).map(assetUrl);
  const captions = photoNotes(fields.notes, catalogMeta.baptism.shots);
  const audioRef = useRef<HTMLAudioElement>(null);
  const theme: Theme = themeProp ?? "sky";
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState(false);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(3);
  const [wish, setWish] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [sent, setSent] = useState<{ name: string; text: string }[]>([]);
  const ink = toneOf(theme);
  const live = wishes.filter((item) => item.note.trim()).map((item) => ({ name: item.name, text: item.note }));
  const blessings = [...sent, ...live, ...SAMPLE_WISHES.map((item) => item.name === "Sister Rose" ? { ...item, text: `God bless you abundantly, dear ${child}.` } : item)];
  const loop = [...blessings, ...blessings];
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (music) {
      audio.pause();
      setMusic(false);
      return;
    }
    try {
      await audio.play();
      setMusic(true);
    } catch {
      setMusic(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(true);
      return;
    }
    const note = [attending ? `Guests: ${guests}` : "", wish.trim()].filter(Boolean).join(". ");
    await onReply?.({ name: name.trim(), note, attending });
    if (wish.trim()) setSent((current) => [{ name: name.trim(), text: wish.trim() }, ...current]);
    setWish("");
    setDone(true);
  }

  return (
    <div className="bp-frame">
      {!open ? (
        <div className={`bp-open${quiet ? " is-quiet" : ""}`} style={ink}>
          {quiet ? null : <Rays />}
          {quiet ? null : (
            <>
              <div className="bp-cloud bp-cloud-a"><Cloud /></div>
              <div className="bp-cloud bp-cloud-b"><Cloud /></div>
              <div className="bp-cloud bp-cloud-c"><Cloud /></div>
              <Sparks points={INTRO_M} variant="m" size="intro" />
              <Sparks points={INTRO_D} variant="d" size="intro" />
            </>
          )}
          <div className="bp-dove">
            <div className="bp-dove-float"><Dove /></div>
          </div>
          <div className="bp-intro">
            <span className="bp-dear">Dear the Varghese family</span>
            <span className="bp-line">you're invited to the baptism of</span>
            <span className="bp-shine">{child}</span>
            <span className="bp-when">
              {when.line}
              {fields.venue ? <span className="bp-when-venue"> · {fields.venue}</span> : null}
            </span>
            {quiet ? null : (
              <button type="button" className="bp-open-btn" onClick={() => setOpen(true)}>Open invitation</button>
            )}
          </div>
          {quiet ? null : (
            <div className="bp-pool" aria-hidden="true">
              <i /><i /><i />
            </div>
          )}
        </div>
      ) : (
        <article className="bp" style={ink}>
          {fields.audio ? (
            <>
              <audio ref={audioRef} src={assetUrl(fields.audio)} onEnded={() => setMusic(false)} />
              <button type="button" className={`bp-disc${music ? " on" : ""}`} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={toggleMusic}>
                <Disc />
              </button>
            </>
          ) : null}
          <header className="bp-nav">
            <em>{child}</em>
            <nav aria-label="Invitation">
              <a href="#celebration">Celebration</a>
              <a href="#godparents">Godparents</a>
              <a href="#blessings">Blessings</a>
            </nav>
            <div>
              {fields.audio ? (
                <button type="button" className={`bp-disc${music ? " on" : ""}`} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={toggleMusic}>
                  <Disc />
                </button>
              ) : null}
              <a className="bp-rsvp-link" href="#rsvp">RSVP</a>
            </div>
          </header>

          <section className="bp-hero">
            <div className="bp-hero-clouds">
              <div className="bp-cloud bp-cloud-a"><Cloud /></div>
              <div className="bp-cloud bp-cloud-b"><Cloud /></div>
            </div>
            <Sparks points={HERO_M} variant="m" size="intro" />
            <Sparks points={HERO_D} variant="d" size="intro" />
            <div className="bp-hero-copy">
              <span className="bp-kicker">In the name of the Father, the Son & the Holy Spirit</span>
              <span className="bp-invite-line">{fields.title || "Please join us for the Holy Baptism of"}</span>
              <span className="bp-shine">{fields.names}</span>
              {fields.hosts ? <span className="bp-parents">{fields.detail || "beloved son of"} <strong>{fields.hosts}</strong></span> : null}
              <div className="bp-chips">
                <span>{when.chip}</span>
                {fields.time ? <span>{formatTime(fields.time)}</span> : null}
                {place ? <span className="bp-chip-venue">{place}</span> : null}
              </div>
              <div className="bp-count-inline"><CountdownBoxes items={count} /></div>
            </div>
            <div className="bp-halo">
              <Halo />
              <div className="bp-portrait">
                {photos[0] ? <img src={photos[0]} alt="" /> : captions[0]?.title || "Baby photo"}
                {captions[0]?.text ? <small className="bp-portrait-note">{captions[0].text}</small> : null}
              </div>
              <div className="bp-float-dove"><Dove /></div>
              <div className="bp-float-dove alt"><Dove /></div>
            </div>
          </section>

          <section className="bp-count">
            <span>Counting the days</span>
            <div className="bp-count-grid"><CountdownBoxes items={count} /></div>
          </section>

          <section className="bp-verse">
            <div className="bp-verse-frame">
              <div className="bp-verse-in">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B8893B" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 3v18M7 8h10" /></svg>
                <p>“{fields.message || "Suffer the little children to come unto me, and forbid them not: for of such is the kingdom of God."}”</p>
                <span>MARK 10:14</span>
              </div>
            </div>
          </section>

          <section id="celebration" className="bp-day">
            <h2>The celebration</h2>
            <div className="bp-events">
              <div className="bp-water">
                {BUBBLES.map((x, index) => (
                  <span key={x} className="bp-bubble" style={{ left: x, width: 8 + (index % 3) * 6, height: 8 + (index % 3) * 6, animationDuration: `${3.5 + (index % 4) * 0.8}s`, animationDelay: `${index * 0.6}s` }} />
                ))}
                <div className="bp-row">
                  <div className="bp-drop">
                    <i /><i />
                    <b>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3c3 4.5 5.5 7.6 5.5 10.5a5.5 5.5 0 0 1-11 0C6.5 10.6 9 7.5 12 3z" /></svg>
                    </b>
                  </div>
                  <div>
                    <div className="bp-event-kicker">The sacrament</div>
                    <div className="bp-event-title">{ceremony}</div>
                  </div>
                </div>
                <p><strong>{when.long}{fields.time ? ` · ${formatTime(fields.time)}` : ""}</strong><br />{place}</p>
                <div className="bp-actions">
                  <a href={mapsHref(fields.venue, fields.address)} target="_blank" rel="noreferrer">Directions</a>
                  {calendarUrl(fields) ? <a href={calendarUrl(fields)} target="_blank" rel="noreferrer">Add to calendar</a> : null}
                </div>
              </div>
              {fields.receptionVenue ? (
                <div className="bp-lunch">
                  <div className="bp-row">
                    <div className="bp-cake">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8893B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21h16M6 21V11h12v10M12 11V7M9 4c1 1 1 2 0 3M12 3c1 1 1 2 0 3M15 4c1 1 1 2 0 3" /></svg>
                    </div>
                    <div>
                      <div className="bp-event-kicker">Followed by</div>
                      <div className="bp-event-title">{reception}</div>
                    </div>
                  </div>
                  <p><strong>{fields.receptionTime ? `${formatTime(fields.receptionTime)} onwards` : "Afterwards"}</strong><br />{fields.receptionVenue}{fields.receptionAddress ? `, ${fields.receptionAddress}` : ""}</p>
                  <a className="bp-hall" href={mapsHref(fields.receptionVenue, fields.receptionAddress)} target="_blank" rel="noreferrer">Directions to the hall</a>
                </div>
              ) : null}
            </div>
          </section>

          {godparents.length || facts.length ? <div className="bp-split">
            {godparents.length ? <section id="godparents" className="bp-people">
              <h2>Godparents</h2>
              <div className="bp-cards">
                {godparents.map((person, index) => (
                  <div key={person.name} className="bp-person" style={{ animationDelay: `${0.2 + index * 0.25}s` }}>
                    <i>{person.initials}</i>
                    <strong>{person.name}</strong>
                    <span>{person.role}</span>
                  </div>
                ))}
              </div>
            </section> : null}
            {facts.length ? <section className="bp-facts">
              <h2>All about {child}</h2>
              <div className="bp-facts-grid">
                {facts.map((fact, index) => (
                  <div key={fact.label} className="bp-fact" style={{ animationDelay: `${0.2 + index * 0.12}s` }}>
                    <em><fact.icon className="glyph" aria-hidden="true" /></em>
                    <small>{fact.label}</small>
                    <strong>{fact.value}</strong>
                  </div>
                ))}
              </div>
            </section> : null}
          </div> : null}

          <section className="bp-gallery">
            <Shot className="tall" label={captions[1]?.title || "Family photo"} text={captions[1]?.text} src={photos[1]} />
            <div className="bp-pair">
              <Shot className="short sand arch" label={captions[2]?.title || "Tiny feet"} text={captions[2]?.text} src={photos[2]} delay="-4s" duration="10s" />
              <Shot className="short sand" label={captions[3]?.title || "First smile"} text={captions[3]?.text} src={photos[3]} delay="-7s" duration="14s" />
            </div>
          </section>

          <section id="rsvp" className="bp-rsvp">
            <Sparks points={DARK_M} variant="m" size="dark" />
            <Sparks points={DARK_D} variant="d" size="dark" />
            <div className="bp-rsvp-copy">
              <div>
                <h2>Will you be there?</h2>
                <p className="bp-rsvp-lead">Please reply{fields.rsvpBy ? ` by ${whenOf(fields.rsvpBy).long}` : ""}</p>
              </div>
              <div className="bp-rsvp-dove" aria-hidden="true"><Dove /></div>
            </div>
            <div className="bp-rsvp-form">
              {done ? (
                <div className="bp-done">
                  {CONFETTI.flatMap((color, colorIndex) => [0, 1, 2, 3, 4, 5].map((step) => {
                    const index = colorIndex * 6 + step;
                    return (
                      <span
                        key={index}
                        className="bp-confetti"
                        style={{
                          left: `${(index * 37) % 100}%`,
                          width: 6 + (index % 3) * 3,
                          height: 10 + (index % 2) * 6,
                          borderRadius: index % 4 === 0 ? "50%" : 2,
                          background: color,
                          animationDuration: `${2.2 + (index % 5) * 0.4}s`,
                          animationDelay: `${(index % 7) * 0.12}s`,
                        }}
                      />
                    );
                  }))}
                  <div className="bp-fly" aria-hidden="true"><Dove /></div>
                  <div className="bp-check">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4E6853" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 7" /></svg>
                  </div>
                  <h3>{attending ? "Thank you!" : "You'll be missed"}</h3>
                  <p>
                    {attending
                      ? `We can't wait to celebrate with you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you.`
                      : `Thank you for letting us know, ${name.trim()}. Please keep ${child} in your prayers.`}
                  </p>
                  <button type="button" onClick={() => setDone(false)}>Change my reply</button>
                </div>
              ) : (
                <form className="bp-form" onSubmit={submit}>
                  <div className="bp-form-row">
                    <label>
                      Your name
                      <input value={name} onChange={(event) => { setName(event.target.value); setError(false); }} placeholder="Family or guest name" aria-invalid={error} />
                    </label>
                    <div className="bp-field">
                      <span>Attending?</span>
                      <div className="bp-yesno">
                        <button type="button" className={attending ? "on" : ""} onClick={() => setAttending(true)}><Bird className="glyph" aria-hidden="true" /> Happily yes</button>
                        <button type="button" className={!attending ? "on" : ""} onClick={() => setAttending(false)}>Can't make it</button>
                      </div>
                    </div>
                  </div>
                  {error ? <small>Please enter your name.</small> : null}
                  <div className="bp-form-row">
                    {attending ? (
                      <div className="bp-field">
                        <span>Adults & kids</span>
                        <div className="bp-stepper">
                          <div>
                            <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                            <strong>{guests}</strong>
                            <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(12, value + 1))}>+</button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <label>
                      A blessing for {child} <em>(optional)</em>
                      <input value={wish} onChange={(event) => setWish(event.target.value)} placeholder="Write a short wish" />
                    </label>
                  </div>
                  <button className="bp-send" type="submit"><i aria-hidden="true" /><span>Send RSVP</span></button>
                </form>
              )}
            </div>
          </section>

          <section id="blessings" className="bp-bless">
            <h2>Blessings for {child}</h2>
            <div className="bp-marquee">
              <div className="bp-track">
                {loop.map((item, index) => (
                  <div className="bp-wish" key={`${item.name}-${index}`}>
                    <p>{item.text}</p>
                    <span>— {item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="bp-foot">
            <em>{fields.names}</em>
            <span>With love, {fields.hosts || "the family"} <span className="bp-heart"><Heart className="glyph" fill="currentColor" aria-hidden="true" /></span></span>
            <Link to="/">Made with InvitesReady</Link>
            <InstagramLink />
          </footer>
        </article>
      )}
    </div>
  );
}

function Disc() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="#1F2D3D" />
      <circle cx="15" cy="15" r="10" fill="none" stroke="#3E4C5C" strokeWidth="1" />
      <circle cx="15" cy="15" r="5" fill="#D9B26A" />
      <circle cx="15" cy="15" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

function Halo() {
  return (
    <>
      <svg className="bp-halo-ring" viewBox="0 0 230 230" fill="none" aria-hidden="true">
        <circle cx="115" cy="115" r="110" stroke="#D9B26A" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
      </svg>
      <svg className="bp-halo-ring-2" viewBox="0 0 230 230" fill="none" aria-hidden="true">
        <circle cx="115" cy="115" r="100" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="115" cy="15" r="4" fill="#D9B26A" />
        <circle cx="115" cy="215" r="3" fill="#FFFFFF" />
      </svg>
    </>
  );
}

function Shot({ className, label, text, src, delay = "0s", duration = "12s" }: { className: string; label: string; text?: string; src?: string; delay?: string; duration?: string }) {
  return (
    <div className={`bp-shot ${className}`}>
      {src ? <img src={src} alt="" style={{ animationDelay: delay, animationDuration: duration }} /> : <span style={{ animationDelay: delay, animationDuration: duration }}>{label}</span>}
      {text ? <small className="bp-shot-note">{text}</small> : null}
    </div>
  );
}
