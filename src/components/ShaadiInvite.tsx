import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { calendarUrl, formatLongDate } from "../lib/dates";
import { EVENT_LOOK, SHAADI_SHOTS, SHAADI_STORY_COUNT, SHAADI_VOWS, eventKind, festivitiesOf, shaadiDays, type ShaadiTheme } from "./shaadi";
import { Arch, Diyas, Elephant, EventMark, Flourish, Havan, Mandala, Palace, Petals, Rangoli, Stars, Toran } from "./shaadi-art";
import "./shaadi.css";

export type { ShaadiTheme };

type Wish = { name: string; note: string };
type Person = { given: string; full: string };

const FRAME_COLORS = ["#6D1B30", "#7A3A10", "#1E4E5E", "#5A1A4A", "#2F4A1A"];
const SHOWER = ["#F4A300", "#FFB800", "#E86A10", "#C2185B", "#F5D77A"];

function peopleOf(names: string): Person[] {
  return names.split(/\s+&\s+/).filter(Boolean).map((part) => {
    const full = part.trim();
    return { given: full.split(/\s+/)[0] ?? full, full };
  });
}

function lettersOf(people: Person[]) {
  return people.map((person) => (person.given[0] ?? "").toUpperCase()).filter(Boolean);
}

function familiesOf(hosts: string) {
  return hosts.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
}

function parentsOf(detail: string) {
  return detail.split(" · ").map((part) => part.trim()).filter(Boolean);
}

function dotted(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]} · ${match[2]} · ${match[1]}` : formatLongDate(date);
}

function dayBits(label: string) {
  const [title, date] = label.split(" · ");
  return { title: title || label, date: date || "" };
}

function emphasis(text: string, marks: string[]): ReactNode {
  const unique = [...marks].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!unique.length || !text) return text;
  const pattern = new RegExp(`(${unique.map((mark) => mark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(pattern).map((part, index) => (unique.includes(part) ? <strong key={index}>{part}</strong> : part));
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = date ? new Date(`${date}T${time || "00:00"}:00`).getTime() : now;
  const diff = Math.max(0, target - now);
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    { value: String(Math.floor(diff / 86400000)), label: "Days" },
    { value: pad(Math.floor(diff / 3600000) % 24), label: "Hours" },
    { value: pad(Math.floor(diff / 60000) % 60), label: "Minutes" },
    { value: pad(Math.floor(diff / 1000) % 60), label: "Seconds" },
  ];
}

function mapsHref(venue: string, address: string, lat: string, lng: string) {
  if (lat && lng) return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  const query = [venue, address].filter(Boolean).join(", ");
  return query ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}` : "";
}

function Names({ people }: { people: Person[] }) {
  return (
    <h1 className="sh-names">
      {people.map((person, index) => (
        <Fragment key={person.full}>
          {index ? <span className="sh-weds">weds</span> : null}
          <b className={`sh-foil ${index ? "is-second" : "is-first"}`}>{person.given}</b>
        </Fragment>
      ))}
    </h1>
  );
}

function Frame({ src, label, tint }: { src: string; label: string; tint: string }) {
  return (
    <div className="sh-frame">
      <div className="sh-frame-in" style={{ background: tint }}>
        {src ? <img src={src} alt="" /> : null}
        <span>{label}</span>
      </div>
    </div>
  );
}

export function ShaadiInvite({
  fields,
  theme = "rani",
  motion = true,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  theme?: ShaadiTheme;
  motion?: boolean;
  wishes?: Wish[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
}) {
  const people = peopleOf(fields.names);
  const letters = lettersOf(people);
  const families = familiesOf(fields.hosts);
  const parents = parentsOf(fields.detail);
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : ""));
  const story = SHAADI_SHOTS.slice(0, SHAADI_STORY_COUNT).map((label, index) => ({ src: photos[index] ?? "", label }));
  const festivities = festivitiesOf(fields.lines);
  const days = shaadiDays(festivities);
  const celebrations = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [day, setDay] = useState(0);
  const [vow, setVow] = useState(0);
  const [attending, setAttending] = useState(true);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [count, setCount] = useState(2);
  const [picked, setPicked] = useState<string[]>(() => festivities.map((item) => item.name));
  const [sent, setSent] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const clock = useCountdown(fields.date, fields.time);
  const place = [fields.venue, fields.address].filter(Boolean).join(" · ");
  const directions = mapsHref(fields.venue, fields.address, fields.lat, fields.lng);
  const calendar = calendarUrl(fields);
  const activeDay = days[Math.min(day, Math.max(days.length - 1, 0))];
  const storyLoop = [...story, ...story];
  const wishLoop = wishes.length ? [...wishes, ...wishes] : [];
  const blessing = fields.message
    || `With the divine blessings of Lord Ganesha and the love of our elders${families.length ? `, ${families.join(" and ")}` : ""} joyfully invite you to celebrate the marriage of their children.`;
  const hash = people.length >= 2
    ? `#${people[0].given.replace(/[^A-Za-z]/g, "")}Ki${people[1].given.replace(/[^A-Za-z]/g, "")}`
    : people[0] ? `#${people[0].given.replace(/[^A-Za-z]/g, "")}` : "";

  useEffect(() => {
    if (!motion || !entered) return;
    const id = window.setInterval(() => setVow((current) => (current + 1) % SHAADI_VOWS.length), 3000);
    return () => window.clearInterval(id);
  }, [motion, entered]);

  function enter() {
    setEntered(true);
    window.setTimeout(() => celebrations.current?.scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" }), 40);
  }

  async function reply(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const extra = [
      note.trim(),
      attending && count > 0 ? `${count} ${count === 1 ? "guest" : "guests"}` : "",
      attending && picked.length ? picked.join(", ") : "",
    ].filter(Boolean).join(" · ");
    await onReply?.({ name: name.trim(), note: extra, attending });
    setSent(true);
  }

  function togglePick(label: string) {
    setPicked((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  }

  return (
    <article className="sh" data-theme={theme} data-motion={motion ? "on" : "off"}>
      <section className="sh-open">
        <Stars />
        <Mandala className="sh-mandala" />
        <Toran />
        {open ? (
          <div className="sh-stage">
            <div className="sh-stack">
              <p className="sh-ganesh sh-foil">॥ श्री गणेशाय नमः ॥</p>
              <p className="sh-sub">Together with their families</p>
              <Names people={people} />
              {fields.title ? <p className="sh-hindi">{fields.title}</p> : null}
              <Flourish />
              <p className="sh-date">{[formatLongDate(fields.date), fields.venue].filter(Boolean).join(" · ")}</p>
              <button type="button" className="sh-gold" onClick={enter}>
                <i aria-hidden="true" />
                <span>Enter the celebrations</span>
              </button>
            </div>
          </div>
        ) : null}
        <Petals />
        <Diyas />
        <button
          type="button"
          className={open ? "sh-veil is-up" : "sh-veil"}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label={open ? "Veil lifted" : "Lift the veil to reveal the invitation"}
          tabIndex={open ? -1 : 0}
        >
          <span className="sh-veil-back" />
          <span className="sh-veil-front">
            <Mandala className="sh-veil-mandala" />
            <span className="sh-hem" />
            <span className="sh-tassels">
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} className="sh-tassel" style={{ animationDuration: `${1.8 + (index % 3) * 0.4}s` }} />
              ))}
            </span>
            <span className="sh-veil-copy">
              <span className="sh-mono sh-foil">
                {letters.map((letter, index) => (
                  <Fragment key={letter}>
                    {index ? <em> &amp; </em> : null}
                    {letter}
                  </Fragment>
                ))}
              </span>
              <span className="sh-veil-sub">You are cordially invited</span>
              <span className="sh-veil-cta">Tap to lift the veil</span>
            </span>
          </span>
        </button>
      </section>

      {entered ? (
        <div ref={celebrations}>
          <section className="sh-hero">
            <Stars count={16} />
            <Toran />
            <Mandala className="sh-mandala" />
            <div className="sh-arch">
              <Arch />
              <div className="sh-arch-inner">
                <p className="sh-ganesh sh-foil">॥ श्री गणेशाय नमः ॥</p>
                <p className="sh-sub">Together with their families</p>
                <Names people={people} />
                {fields.title ? <p className="sh-hindi">{fields.title}</p> : null}
                <Flourish />
                {fields.date ? <p className="sh-date">{dotted(fields.date)}</p> : null}
                {place ? <p className="sh-place">{place}</p> : null}
              </div>
            </div>
            <Petals />
            <div className="sh-procession" aria-hidden="true">
              <span className="sh-elephant"><Elephant /></span>
              <span className="sh-elephant"><Elephant /></span>
            </div>
            <div className="sh-ground" />
            {fields.audio ? (
              <button type="button" className="sh-music" aria-pressed={playing} aria-label={playing ? "Pause shehnai music" : "Play shehnai music"} onClick={() => setPlaying((value) => !value)}>
                <span className="sh-eq" />
                <span className="sh-eq" />
                <span className="sh-eq" />
                <span className="sh-eq" />
              </button>
            ) : null}
          </section>

          <section className="sh-section sh-panel">
            <Mandala className="sh-side-mandala left" />
            <p className="sh-hindi sh-foil sh-bless">॥ शुभ विवाह ॥</p>
            <p className="sh-message">{emphasis(blessing, families)}</p>
            <div className="sh-couple">
              {people.map((person, index) => (
                <Fragment key={person.full}>
                  {index ? (
                    <span className="sh-knot" aria-hidden="true">
                      <svg width="54" height="54" viewBox="0 0 54 54">
                        <circle cx="20" cy="27" r="14" stroke="#F5D77A" strokeWidth="2" fill="none" />
                        <circle cx="34" cy="27" r="14" stroke="#F4A300" strokeWidth="2" fill="none" />
                      </svg>
                    </span>
                  ) : null}
                  <div className="sh-person">
                    <b className="sh-foil">{person.full}</b>
                    {parents[index] ? <span>{parents[index]}</span> : null}
                  </div>
                </Fragment>
              ))}
            </div>
          </section>

          {fields.date ? (
            <section className="sh-section">
              <p className="sh-kicker">Counting down to the pheras</p>
              <div className="sh-clock">
                {clock.map((item, index) => (
                  <div key={item.label} className="sh-medal" style={{ animationDelay: `${index * 0.15}s` }}>
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="46" stroke="#F5D77A" strokeWidth="1" strokeDasharray="3 5" fill="none" />
                    </svg>
                    <b className="sh-foil">{item.value}</b>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {days.length ? <section className="sh-section sh-panel">
            <h2 className="sh-foil">The Festivities</h2>
            <div className="sh-days" role="tablist" aria-label="Wedding days">
              {days.map((item, index) => {
                const bits = dayBits(item.label);
                return (
                  <button key={item.label} type="button" role="tab" aria-selected={index === day} onClick={() => setDay(index)}>
                    <b>{bits.title}</b>
                    {bits.date ? <span>{bits.date}</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="sh-cards">
              {activeDay?.items.map(({ item, index }) => {
                const kind = eventKind(item.name);
                const look = EVENT_LOOK[kind];
                const href = mapsHref(item.venue, fields.address, "", "");
                const photo = photos[SHAADI_STORY_COUNT + index] ?? "";
                return (
                  <article key={`${item.name}-${index}`} className="sh-event" style={{ ["--c1" as string]: look.c1, ["--c2" as string]: look.c2, ["--pill" as string]: look.ink, animationDelay: `0s, ${index * 0.15}s` }}>
                    <div className="sh-event-in">
                      {photo ? <img className="sh-event-photo" src={photo} alt="" /> : null}
                      <div className="sh-icon"><EventMark kind={kind} /></div>
                      <h3 className="sh-foil">{item.name}</h3>
                      {item.hindi ? <p className="sh-hindi">{item.hindi}</p> : null}
                      {item.when ? <p className="sh-when">{item.when}</p> : null}
                      {item.venue ? <p className="sh-venue-line">{item.venue}</p> : null}
                      {item.dress ? <span className="sh-pill">Dress: {item.dress}</span> : null}
                      {href ? <a className="sh-ghost" href={href} target="_blank" rel="noreferrer">Directions</a> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section> : null}

          <section className="sh-section sh-vows">
            <h2 className="sh-foil">Saat Phere · The Seven Vows</h2>
            <div className="sh-vow">
              <div className="sh-ring">
                <svg className="sh-ring-line" viewBox="0 0 300 300" aria-hidden="true">
                  <circle cx="150" cy="150" r="120" stroke="#F5D77A" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4 6" fill="none" />
                </svg>
                <div className="sh-orbit-ring" aria-hidden="true"><span className="sh-orbit-dot" /></div>
                {SHAADI_VOWS.map((item, index) => {
                  const angle = (index / SHAADI_VOWS.length) * Math.PI * 2 - Math.PI / 2;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      className="sh-phera"
                      aria-label={`Phera ${index + 1}: ${item.title}`}
                      aria-pressed={index === vow}
                      style={{ left: `${50 + Math.cos(angle) * 41}%`, top: `${50 + Math.sin(angle) * 41}%` }}
                      onClick={() => setVow(index)}
                    >
                      {index + 1}
                    </button>
                  );
                })}
                <span className="sh-fire"><Havan size={56} /></span>
              </div>
              <div className="sh-vow-copy" key={vow}>
                <span>PHERA {vow + 1}</span>
                <h3 className="sh-foil">{SHAADI_VOWS[vow]?.title}</h3>
                <p>{SHAADI_VOWS[vow]?.text}</p>
              </div>
            </div>
          </section>

          <section className="sh-section sh-panel">
            <h2 className="sh-foil">Our Story in Frames</h2>
            <div className="sh-marquee">
              <div>
                {storyLoop.map((frame, index) => (
                  <Frame key={`${frame.label}-${index}`} src={frame.src} label={frame.label} tint={FRAME_COLORS[index % FRAME_COLORS.length]} />
                ))}
              </div>
            </div>
          </section>

          <section className="sh-section sh-venue">
            <div className="sh-palace">
              {photos[SHAADI_STORY_COUNT + festivities.length] ? <img src={photos[SHAADI_STORY_COUNT + festivities.length]} alt="" /> : <Palace />}
            </div>
            <div className="sh-venue-copy">
              <p className="sh-kicker">The venue</p>
              <h2 className="sh-foil">{fields.venue || "The palace"}</h2>
              {fields.address ? <p>{fields.address}</p> : null}
              <div className="sh-links">
                {directions ? <a className="sh-gold" href={directions} target="_blank" rel="noreferrer"><span>Get directions</span></a> : null}
                {calendar ? <a className="sh-ghost" href={calendar} target="_blank" rel="noreferrer">Add to calendar</a> : null}
              </div>
            </div>
          </section>

          <section className="sh-section sh-rsvp">
            <Mandala className="sh-side-mandala right" />
            <div className="sh-stack">
              <h2 className="sh-foil">Will you grace us?</h2>
              {fields.rsvpBy ? <p className="sh-venue-line">Kindly reply by {formatLongDate(fields.rsvpBy)}</p> : null}
            </div>
            <div className="sh-form-frame">
              {sent ? (
                <div className="sh-done">
                  {SHOWER.map((color, index) => (
                    <span key={color + index} className="sh-shower" style={{ left: `${(index * 37) % 95}%`, animationDelay: `${(index % 7) * 0.12}s` }} aria-hidden="true">
                      <svg width={14 + (index % 3) * 6} height={14 + (index % 3) * 6} viewBox="0 0 20 20">
                        <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={color} />
                      </svg>
                    </span>
                  ))}
                  <Rangoli />
                  <h3>{attending ? "Dhanyavaad!" : "You'll be missed"}</h3>
                  <p>
                    {attending
                      ? `We are honoured, ${name.trim()}. ${count} ${count === 1 ? "seat is" : "seats are"} reserved${picked.length ? ` for the ${picked.join(", ")}` : ""}.`
                      : `Thank you, ${name.trim()}. Your blessings mean the world to us.`}
                  </p>
                  <button type="button" className="sh-ghost" onClick={() => setSent(false)}>Change my reply</button>
                </div>
              ) : (
                <form className="sh-form" onSubmit={reply}>
                  <label>
                    Your name
                    <input value={name} placeholder="Guest or family name" onChange={(event) => { setName(event.target.value); setNameError(false); }} aria-invalid={nameError} />
                    {nameError ? <span className="sh-error">Please enter your name.</span> : null}
                  </label>
                  <div className="sh-choice">
                    <button type="button" aria-pressed={attending} onClick={() => setAttending(true)}>Joyfully accept</button>
                    <button type="button" aria-pressed={!attending} onClick={() => setAttending(false)}>Regretfully decline</button>
                  </div>
                  {attending ? (
                    <>
                      <div>
                        <span className="sh-kicker">Joining us for</span>
                        <div className="sh-picks">
                          {festivities.filter((item) => item.name.trim()).map((item) => {
                            const look = EVENT_LOOK[eventKind(item.name)];
                            return (
                              <button
                                key={item.name}
                                type="button"
                                aria-pressed={picked.includes(item.name)}
                                style={{ ["--c1" as string]: look.c1, ["--pill" as string]: look.ink }}
                                onClick={() => togglePick(item.name)}
                              >
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="sh-stepper">
                        Guests
                        <div>
                          <button type="button" aria-label="Fewer guests" onClick={() => setCount((value) => Math.max(1, value - 1))}>−</button>
                          <b>{count}</b>
                          <button type="button" aria-label="More guests" onClick={() => setCount((value) => Math.min(10, value + 1))}>+</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <label>
                    Your blessings
                    <input value={note} placeholder="Optional" onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <button type="submit" className="sh-send">
                    <i aria-hidden="true" />
                    <span>Send RSVP</span>
                  </button>
                </form>
              )}
            </div>
          </section>

          {wishLoop.length ? (
            <section className="sh-section">
              <h2 className="sh-foil">Blessings &amp; Wishes</h2>
              <div className="sh-wishes">
                <div>
                  {wishLoop.map((wish, index) => (
                    <article key={`${wish.name}-${index}`} className="sh-wish">
                      <p>“{wish.note}”</p>
                      <span>— {wish.name}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <footer className="sh-foot">
            <div className="sh-foot-mark">
              <Mandala className="sh-spin" />
              <span className="sh-mono sh-foil">{letters.join(" | ") || "A | I"}</span>
            </div>
            <p className="sh-hindi">आपकी उपस्थिति हमारा सौभाग्य</p>
            <p className="sh-tag">{[hash, fields.date ? dotted(fields.date) : ""].filter(Boolean).join(" · ")}</p>
            <a href="/">Made with InvitesReady</a>
          </footer>
          {playing && fields.audio ? <audio src={assetUrl(fields.audio)} autoPlay loop /> : null}
        </div>
      ) : null}
    </article>
  );
}
