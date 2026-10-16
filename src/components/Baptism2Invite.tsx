import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import catalogMeta from "../data/template-meta.json";
import { calendarUrl, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import { InstagramLink } from "./InstagramLink";
import "./baptism2.css";

export type Baptism2Theme = "sky" | "blush" | "sage";

const ART = {
  cloudA: "/baptism2/cloud-a.webp",
  cloudB: "/baptism2/cloud-b.webp",
  bank: "/baptism2/bank.webp",
  dove: "/baptism2/dove.webp",
  cross: "/baptism2/cross.webp",
  card: "/baptism2/card-front.webp",
  divider: "/baptism2/divider.webp",
  church: "/baptism2/church.webp",
  font: "/baptism2/font.webp",
  bible: "/baptism2/bible.webp",
  cake: "/baptism2/cake.webp",
  wreath: "/baptism2/wreath.webp",
};

const FACT_ART = ["/baptism2/fact-born.webp", "/baptism2/fact-loves.webp", "/baptism2/fact-smile.webp", "/baptism2/fact-bear.webp"];
const SPARKS = [[8, 16], [86, 12], [10, 42], [88, 46], [6, 68], [90, 64], [28, 8], [70, 6], [18, 82], [78, 80]];
const BUBBLES = [8, 18, 30, 42, 55, 66, 78, 90];
const CONFETTI = ["#d9b26a", "#2f5e8a", "#ffffff", "#f2b8c6", "#9fc7e8", "#b7d3a8"];
const SAMPLE_WISHES = [
  { name: "Grandma Annamma", text: "May God hold you close always, my little angel." },
  { name: "Uncle Tony", text: "Welcome to the family of faith, champ!" },
  { name: "The Kurian family", text: "Praying for a life full of love, light and laughter." },
  { name: "Sister Rose", text: "God bless you abundantly, dear one." },
];

function firstName(names: string) {
  return names.trim().split(/\s+/)[0] || names;
}

function whenOf(iso: string) {
  const date = iso ? new Date(`${iso}T12:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return { long: "", chip: "", line: "" };
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const shortMonth = date.toLocaleDateString("en-GB", { month: "short" });
  const year = date.getFullYear();
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const shortWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  return {
    long: `${weekday}, ${day} ${month} ${year}`,
    chip: `${shortWeek}, ${day} ${shortMonth} ${year}`,
    line: `${weekday} · ${day} ${month} ${year}`,
  };
}

function replyBy(iso: string) {
  const date = iso ? new Date(`${iso}T12:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function initialsOf(name: string) {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function mapsHref(venue: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} ${address}`.trim())}`;
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
  return [
    { label: "Days", value: String(days) },
    { label: "Hours", value: String(hours).padStart(2, "0") },
    { label: "Mins", value: String(mins).padStart(2, "0") },
    { label: "Secs", value: String(secs).padStart(2, "0") },
  ];
}

function Sky() {
  return (
    <div className="bap2-scene" aria-hidden="true">
      <div className="bap2-sky" />
      <div className="bap2-rays" />
      <img className="bap2-cloud c1" src={ART.cloudA} alt="" />
      <img className="bap2-cloud c2" src={ART.cloudB} alt="" />
      <img className="bap2-cloud c3" src={ART.cloudA} alt="" />
      {SPARKS.map(([x, y], index) => (
        <span key={index} className="bap2-spark" style={{ left: `${x}%`, top: `${y}%`, fontSize: 10 + (index % 3) * 5, animationDuration: `${2 + (index % 4) * 0.6}s`, animationDelay: `${index * 0.35}s` }}>✦</span>
      ))}
      <div className="bap2-bank">
        <div className="bap2-bank-row">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => <img key={index} src={ART.bank} alt="" />)}
        </div>
      </div>
    </div>
  );
}

export function Baptism2Invite({
  fields,
  theme = "sky",
  quiet = false,
  motion = true,
  wishes = [],
  onReply,
  demo = false,
}: {
  fields: InviteFields;
  theme?: Baptism2Theme;
  quiet?: boolean;
  motion?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
  demo?: boolean;
}) {
  useFonts("Great Vibes", "Lora", "Nunito Sans");
  const nameId = useId();
  const wishId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<"card" | "page">("card");
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(3);
  const [wish, setWish] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [sent, setSent] = useState<{ name: string; text: string }[]>([]);

  const child = firstName(fields.names);
  const when = whenOf(fields.date);
  const count = useCountdown(fields.date, fields.time);
  const pack = packOf("baptism2", fields.lines);
  const ceremony = eventName(fields.lines, "ceremonyName", "Holy Baptism");
  const reception = eventName(fields.lines, "receptionName", "Lunch & cake");
  const godparents = (pack.people ?? []).filter((person) => person.name.trim()).map((person) => ({ ...person, initials: initialsOf(person.name) }));
  const facts = (pack.facts ?? []).filter((fact) => fact.label.trim() || fact.value.trim());
  const photos = (fields.photos ?? []).map(assetUrl);
  const captions = photoNotes(fields.notes, catalogMeta.baptism2.shots);
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const hall = [fields.receptionVenue, fields.receptionAddress].filter(Boolean).join(", ");
  const live = wishes.filter((item) => item.note.trim()).map((item) => ({ name: item.name, text: item.note }));
  const blessings = [...sent, ...live, ...(demo ? SAMPLE_WISHES.map((item) => item.name === "Sister Rose" ? { ...item, text: `God bless you abundantly, dear ${child}.` } : item) : [])];
  const loop = blessings.length ? [...blessings, ...blessings] : [];
  const calendar = calendarUrl(fields);

  function reveal() {
    if (!quiet) setOpen(true);
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
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
    <div className={`bap2 ${theme}${stage === "page" ? " is-page" : ""}`} data-motion={motion ? "on" : "off"}>
      {stage === "card" ? (
        <section className="bap2-open" aria-label="Sealed baptism invitation">
          <Sky />
          <div className="bap2-dove" aria-hidden="true">
            <div className="bap2-dove-glide"><img src={ART.dove} alt="" /></div>
          </div>
          <div className="bap2-stage">
            <div className="bap2-card-float">
              <div className={open ? "bap2-card is-open" : "bap2-card"}>
                <button type="button" className="bap2-face bap2-front" aria-label="Tap the seal to open" onClick={reveal}>
                  <img src={ART.card} alt="" />
                </button>
                <div className="bap2-face bap2-back">
                  <span className="bap2-dear">Dear friend</span>
                  <span className="bap2-sub">you're invited to the baptism of</span>
                  <span className="bap2-script">{child}</span>
                  <img className="bap2-cross" src={ART.cross} alt="" />
                  {when.line ? <span className="bap2-date">{when.line}</span> : null}
                  {fields.venue ? <span className="bap2-place">{[fields.venue, fields.address].filter(Boolean).join(", ")}</span> : null}
                  <button type="button" className="bap2-enter" onClick={() => setStage("page")}>Open invitation</button>
                </div>
              </div>
            </div>
            {open ? null : <button type="button" className="bap2-hint" onClick={reveal}>Tap the seal to open</button>}
          </div>
        </section>
      ) : (
        <article className="bap2-page">
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} onEnded={() => setPlaying(false)} /> : null}
          {fields.audio ? (
            <button type="button" className={playing ? "bap2-disc on" : "bap2-disc"} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"} onClick={toggleMusic}>
              <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14" fill="#1F2D3D" /><circle cx="15" cy="15" r="10" fill="none" stroke="#3E4C5C" strokeWidth="1" /><circle cx="15" cy="15" r="5" fill="#D9B26A" /><circle cx="15" cy="15" r="1.5" fill="#FFFFFF" /></svg>
            </button>
          ) : null}
          <nav className="bap2-nav" aria-label="Invitation">
            <em>{child}</em>
            <div>
              <a href="#celebration">Celebration</a>
              <a href="#godparents">Godparents</a>
              <a href="#blessings">Blessings</a>
              <a href="#rsvp">RSVP</a>
            </div>
          </nav>

          <section className="bap2-hero">
            <Sky />
            <div className="bap2-hero-dove" aria-hidden="true"><img src={ART.dove} alt="" /></div>
            <div className="bap2-hero-inner">
              <div className="bap2-wreath">
                <div className="bap2-photo">
                  {photos[0] ? <img src={photos[0]} alt="" /> : captions[0]?.title || "Baby photo"}
                </div>
                <img src={ART.wreath} alt="" />
              </div>
              <div className="bap2-hero-text">
                <img className="bap2-hero-cross" src={ART.cross} alt="" />
                <span className="bap2-trinity">In the name of the Father, the Son & the Holy Spirit</span>
                <span className="bap2-join">{fields.title || "Please join us for the Holy Baptism of"}</span>
                <span className="bap2-script bap2-hero-name">{fields.names}</span>
                {fields.hosts ? <span className="bap2-parents">{fields.detail || "beloved son of"} <strong>{fields.hosts}</strong></span> : null}
                <div className="bap2-pills">
                  {when.chip ? <span className="bap2-pill phone">{when.chip}</span> : null}
                  {when.long ? <span className="bap2-pill desk">{when.long}</span> : null}
                  {fields.time ? <span className="bap2-pill">{formatTime(fields.time)}</span> : null}
                </div>
              </div>
            </div>
          </section>

          <section className="bap2-sec bap2-paper">
            <img loading="lazy" className="bap2-divider" src={ART.divider} alt="" />
            <span className="bap2-kicker">Counting the days</span>
            <div className="bap2-count" aria-label="Countdown">
              {count.map((item, index) => (
                <div key={item.label} style={{ animationDelay: `${0.2 + index * 0.12}s` }}>
                  <b className={index === 3 ? "sec" : undefined}>{item.value}</b>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bap2-verse">
            <div className="bap2-verse-frame">
              <div className="bap2-verse-card">
                <img loading="lazy" className="bap2-bible" src={ART.bible} alt="" />
                <p>“{fields.message || "Suffer the little children to come unto me, and forbid them not: for of such is the kingdom of God."}”</p>
                <em>MARK 10:14</em>
              </div>
            </div>
          </section>

          <section id="celebration" className="bap2-events">
            <h2 className="bap2-h2">The celebration</h2>
            <img loading="lazy" className="bap2-church" src={ART.church} alt="" />
            <div className="bap2-event-grid">
              <article className="bap2-water">
                {BUBBLES.map((x, index) => (
                  <span key={x} className="bap2-bubble" style={{ left: `${x}%`, width: 8 + (index % 3) * 6, height: 8 + (index % 3) * 6, animationDuration: `${4 + (index % 4) * 0.8}s`, animationDelay: `${index * 0.6}s` }} />
                ))}
                <div className="bap2-icon">
                  <span className="bap2-ripple" />
                  <span className="bap2-ripple late" />
                  <img loading="lazy" src={ART.font} alt="" />
                </div>
                <div className="bap2-k">The sacrament</div>
                <div className="bap2-event-title">{ceremony}</div>
                <div className="bap2-event-when"><strong>{[when.long, fields.time ? formatTime(fields.time) : ""].filter(Boolean).join(" · ")}</strong><br />{place}</div>
                <div className="bap2-actions">
                  <a className="fill" href={mapsHref(fields.venue, fields.address)} target="_blank" rel="noreferrer">Directions</a>
                  {calendar ? <a className="ghost" href={calendar} target="_blank" rel="noreferrer">Add to calendar</a> : null}
                </div>
              </article>
              <article className="bap2-lunch">
                <div className="bap2-icon"><img loading="lazy" src={ART.cake} alt="" /></div>
                <div className="bap2-k">Followed by</div>
                <div className="bap2-event-title">{reception}</div>
                <div className="bap2-event-when"><strong>{fields.receptionTime ? `${formatTime(fields.receptionTime)} onwards` : "Afterwards"}</strong><br />{hall}</div>
                <a className="bap2-hall" href={mapsHref(fields.receptionVenue, fields.receptionAddress)} target="_blank" rel="noreferrer">Directions to the hall</a>
              </article>
            </div>
          </section>

          {godparents.length ? (
            <section id="godparents" className="bap2-people">
              <h2 className="bap2-h2">Godparents</h2>
              <img loading="lazy" className="bap2-divider sm" src={ART.divider} alt="" />
              <div className="bap2-people-grid">
                {godparents.map((person, index) => (
                  <article key={person.name} className="bap2-person" style={{ animationDelay: `${0.2 + index * 0.25}s` }}>
                    <div className="bap2-avatar">{person.initials}</div>
                    <b>{person.name}</b>
                    <span>{person.role}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {facts.length ? (
            <section className="bap2-facts">
              <h2 className="bap2-h2">All about {child}</h2>
              <div className="bap2-fact-grid">
                {facts.map((fact, index) => (
                  <article key={fact.label} className="bap2-fact" style={{ animationDelay: `${0.2 + index * 0.12}s` }}>
                    <img loading="lazy" src={FACT_ART[index] ?? FACT_ART[0]} alt="" style={{ animationDelay: `${-index * 0.7}s` }} />
                    <span>{fact.label}</span>
                    <b>{fact.value}</b>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="bap2-gallery" aria-label="Photographs">
            {[0, 1, 2].map((index) => (
              <div key={index} className={index === 0 ? "bap2-shot big" : "bap2-shot"}>
                {photos[index + 1] || (index === 0 && photos[0]) ? <img loading="lazy" src={photos[index + 1] || photos[0]} alt="" style={{ animationDuration: `${12 - index * 2}s`, animationDelay: `${-index * 4}s` }} /> : captions[index]?.title || ["Family photo", "Tiny feet", "First smile"][index]}
              </div>
            ))}
          </section>

          <section id="rsvp" className="bap2-rsvp">
            <div className="bap2-rsvp-intro">
              <img loading="lazy" src={ART.dove} alt="" />
              <h2>Will you be there?</h2>
              {fields.rsvpBy ? <p>Please reply by {replyBy(fields.rsvpBy)}</p> : null}
            </div>
            {done ? (
              <div className="bap2-done">
                {CONFETTI.map((color, index) => (
                  <span key={index} className="bap2-confetti" style={{ left: `${(index * 37) % 100}%`, width: 6 + (index % 3) * 3, height: 10 + (index % 2) * 6, borderRadius: index % 4 === 0 ? "50%" : 2, background: color, animationDuration: `${2.2 + (index % 5) * 0.4}s`, animationDelay: `${(index % 7) * 0.12}s` }} />
                ))}
                <span className="bap2-fly" aria-hidden="true"><img loading="lazy" src={ART.dove} alt="" /></span>
                <img loading="lazy" className="bap2-cross" src={ART.cross} alt="" />
                <h3>{attending ? "Thank you!" : "You’ll be missed"}</h3>
                <p>{attending ? `We can’t wait to celebrate with you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you.` : `Thank you for letting us know, ${name.trim()}. Please keep ${child} in your prayers.`}</p>
                <button type="button" className="bap2-change" onClick={() => setDone(false)}>Change my reply</button>
              </div>
            ) : (
              <form className="bap2-form" onSubmit={submit}>
                <div className="bap2-field">
                  <label htmlFor={nameId}>Your name</label>
                  <input id={nameId} className={error ? "bad" : undefined} value={name} placeholder="Family or guest name" onChange={(event) => { setName(event.target.value); setError(false); }} />
                  {error ? <small>Please enter your name.</small> : null}
                </div>
                <div className="bap2-yesno">
                  <button type="button" className={attending ? "on" : undefined} aria-pressed={attending} onClick={() => setAttending(true)}>🕊️ Happily yes</button>
                  <button type="button" className={attending ? undefined : "on"} aria-pressed={!attending} onClick={() => setAttending(false)}>Can't make it</button>
                </div>
                {attending ? (
                  <div className="bap2-step">
                    <b>Adults & kids</b>
                    <span>
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                      <em>{guests}</em>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(12, value + 1))}>+</button>
                    </span>
                  </div>
                ) : null}
                <div className="bap2-field">
                  <label htmlFor={wishId}>A blessing for {child} <span>(optional)</span></label>
                  <input id={wishId} value={wish} placeholder="Write a short wish" onChange={(event) => setWish(event.target.value)} />
                </div>
                <button type="submit" className="bap2-send"><i aria-hidden="true" /><span>Send RSVP</span></button>
              </form>
            )}
          </section>

          {loop.length ? (
            <section id="blessings" className="bap2-wishes">
              <h2 className="bap2-h2">Blessings for {child}</h2>
              <div className="bap2-marq-clip">
                <div className="bap2-marq">
                  {loop.map((item, index) => (
                    <article key={`${item.name}-${index}`} className="bap2-wish">
                      <img loading="lazy" src={ART.dove} alt="" />
                      <p>{item.text}</p>
                      <span>— {item.name}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <footer className="bap2-foot">
            <em>{fields.names}</em>
            {fields.hosts ? <p>With love, {fields.hosts} <i>♥</i></p> : null}
            <Link to={madeWithHref("baptism2")}>Made with InvitesReady</Link>
            <InstagramLink />
          </footer>
        </article>
      )}
    </div>
  );
}
