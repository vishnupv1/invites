import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import catalogMeta from "../data/template-meta.json";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import "./anna.css";

export type AnnaTheme = "terracotta" | "sage" | "dusk";
type Theme = AnnaTheme;

const THEMES: Record<Theme, { accent: string; text: string; leaf: string; soft: string }> = {
  terracotta: { accent: "#A44B32", text: "#9C4630", leaf: "#8A9A7B", soft: "#EFD9C8" },
  sage: { accent: "#56684C", text: "#4E5F45", leaf: "#C48A6A", soft: "#DCE3D3" },
  dusk: { accent: "#3F5670", text: "#3A506A", leaf: "#C9A27E", soft: "#D8E0E8" },
};


const PALETTE = [
  ["#A44B32", "Rust"],
  ["#C48A6A", "Clay"],
  ["#8A9A7B", "Sage"],
  ["#D9B98C", "Sand"],
  ["#5B4A3F", "Cocoa"],
];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0] ?? names, second: parts[1] ?? "" };
}

function dateParts(iso: string) {
  const date = iso ? new Date(`${iso}T12:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return { day: "", month: "", year: "", weekday: "", stamp: "" };
  const [year, month, day] = iso.split("-");
  return {
    day,
    month: date.toLocaleDateString("en-US", { month: "long" }),
    year,
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    stamp: `${day}.${month}`,
  };
}

function compactTime(value: string) {
  return formatTime(value).replace(":00", "");
}

function placeName(detail: string, address: string) {
  return (detail || address).split(",")[0]?.trim() ?? "";
}

function meetTag(first: string, second: string) {
  const word = (value: string) => value.replace(/[^A-Za-z0-9]/g, "");
  const a = word(first);
  const b = word(second);
  if (a && b) return `#${a}Meets${b}`;
  return a ? `#${a}` : "";
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
    { v: String(Math.floor(diff / 86400000)), l: "Days", long: "Days" },
    { v: pad(Math.floor(diff / 3600000) % 24), l: "Hrs", long: "Hours" },
    { v: pad(Math.floor(diff / 60000) % 60), l: "Min", long: "Minutes" },
    { v: pad(Math.floor(diff / 1000) % 60), l: "Sec", long: "Seconds", extra: "anna-secs" },
  ];
}

function mapsHref(venue: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} ${address}`.trim())}`;
}

function Leaf({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg className={`anna-leaf ${className}`} viewBox="0 0 200 240" fill="none" aria-hidden="true">
      <path d="M20 230C40 160 70 100 150 20" stroke={color} strokeWidth="1.2" />
      <path d="M60 150c-30-4-46-22-48-44 26 2 44 18 48 44zM90 100c-8-28 2-50 22-62 8 24 0 46-22 62zM110 70c26-12 50-6 64 12-24 12-48 8-64-12zM45 190c-28 8-50-2-60-22 24-6 46 4 60 22z" stroke={color} strokeWidth="1" />
    </svg>
  );
}

export function AnnaInvite({
  fields,
  quiet = false,
  onReply,
  theme: themeProp,
  onTheme,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
  theme?: Theme;
  onTheme?: (theme: Theme) => void;
}) {
  const { first, second } = coupleOf(fields.names);
  const when = dateParts(fields.date);
  const count = useCountdown(fields.date, fields.time);
  const photos = (fields.photos ?? []).map(assetUrl);
  const captions = photoNotes(fields.notes, catalogMeta.anna.shots);
  const pack = packOf("anna", fields.lines);
  const ceremony = eventName(fields.lines, "ceremonyName", "Ceremony");
  const reception = eventName(fields.lines, "receptionName", "Reception & dinner");
  const story = (pack.story ?? []).filter((item) => item.title.trim() || item.text.trim());
  const faqs = (pack.faqs ?? []).filter((item) => item.q.trim() || item.a.trim());
  const place = placeName(fields.detail, fields.address);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [picked, setPicked] = useState<Theme>(themeProp ?? "terracotta");
  const theme = themeProp ?? picked;
  function chooseTheme(next: Theme) {
    setPicked(next);
    onTheme?.(next);
  }
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState(false);
  const [venueTab, setVenueTab] = useState(0);
  const [faq, setFaq] = useState(-1);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [meal, setMeal] = useState("Veg");
  const [song, setSong] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const ink = THEMES[theme];
  const venues = [
    { label: ceremony, name: fields.venue, address: fields.address, time: `${formatLongDate(fields.date)} · ${formatTime(fields.time)}` },
    ...(fields.receptionVenue
      ? [{ label: reception, name: fields.receptionVenue, address: fields.receptionAddress, time: `${formatLongDate(fields.date)} · ${formatTime(fields.receptionTime)}` }]
      : []),
  ];
  const venue = venues[venueTab] ?? venues[0];
  const venuePhoto = photos[venueTab + 1] ?? "";
  const tone = {
    ["--accent" as string]: ink.accent,
    ["--accent-text" as string]: ink.text,
    ["--leaf" as string]: ink.leaf,
    ["--soft" as string]: ink.soft,
  };

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
    const note = attending ? [`Dinner: ${meal}`, song.trim() ? `Song: ${song.trim()}` : ""].filter(Boolean).join(". ") : "";
    await onReply?.({ name: name.trim(), note, attending });
    setDone(true);
  }

  return (
    <div className="anna-frame">
      {!open ? (
        <div className={`anna-open${quiet ? " is-quiet" : ""}`} style={tone}>
          <Leaf color={ink.leaf} className="anna-leaf-a" />
          <Leaf color={ink.leaf} className="anna-leaf-b" />
          {quiet ? null : (
            <div className="anna-intro">
              <span>Hello</span>
              <h1>Something wonderful<br />is waiting for you.</h1>
              <p>Tap the card to reveal the date, then open the invitation for everything you need to know.</p>
              <button type="button" className="anna-enter" onClick={() => setOpen(true)}>View invitation</button>
            </div>
          )}
          {quiet ? (
            <div className="anna-card front">
              <Names first={first} second={second} />
            </div>
          ) : (
            <button type="button" className={`anna-card ${flipped ? "back" : "front"}`} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? "Show names" : "Reveal the date"}>
              {flipped ? (
                <>
                  <span>Save the date</span>
                  <strong>{when.day}</strong>
                  <em>{when.month}</em>
                  <b>{when.year}</b>
                  <i className="anna-rule" />
                  <small>{fields.detail || fields.address}</small>
                </>
              ) : (
                <Names first={first} second={second} />
              )}
            </button>
          )}
          {quiet ? null : (
            <button type="button" className="anna-enter anna-enter-mobile" onClick={() => setOpen(true)}>
              View invitation
            </button>
          )}
        </div>
      ) : (
        <article className="anna" style={tone}>
          <header className="anna-bar">
            <span className="anna-mark">{first[0] ?? ""} <i>&</i> {second[0] ?? ""}</span>
            <nav className="anna-links" aria-label="Invitation">
              <a href="#story">Story</a>
              <a href="#day">The day</a>
              <a href="#venues">Venues</a>
              <a href="#wear">Attire</a>
              <a href="#faq">FAQ</a>
            </nav>
            <div>
              <div className="anna-themes" role="group" aria-label="Colour">
                {(Object.keys(THEMES) as Theme[]).map((item) => (
                  <button key={item} type="button" aria-pressed={theme === item} style={{ background: THEMES[item].accent }} onClick={() => chooseTheme(item)} />
                ))}
              </div>
              {fields.audio ? (
                <>
                  <audio ref={audioRef} className="anna-audio" controls src={assetUrl(fields.audio)} onEnded={() => setMusic(false)} />
                  <button type="button" className={`anna-music${music ? " on" : ""}`} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={toggleMusic}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </button>
                </>
              ) : null}
              <a className="anna-rsvp-link" href="#anna-rsvp">RSVP</a>
            </div>
          </header>

          <section className="anna-hero">
            <Leaf color={ink.leaf} />
            <div className="anna-hero-copy">
              <span className="anna-kicker">{fields.hosts || "Together with their families"}</span>
              <h1>
                <em>{first}</em>
                {second ? <small>&</small> : null}
                {second ? <em>{second}</em> : null}
              </h1>
              <p>{fields.title}</p>
              <div className="anna-facts">
                <div><small>{when.weekday}</small><strong>{when.stamp}</strong></div>
                <div><small>Year</small><strong>{when.year}</strong></div>
                <div><small>From</small><strong>{compactTime(fields.time)}</strong></div>
                {place ? <div className="anna-place"><small>In</small><strong>{place}</strong></div> : null}
              </div>
            </div>
            <div className="anna-portrait">
              {photos[0] ? <img src={photos[0]} alt="" /> : null}
              {captions[0]?.title || captions[0]?.text ? (
                <figcaption>
                  {captions[0]?.title ? <strong>{captions[0].title}</strong> : null}
                  {captions[0]?.text ? <span>{captions[0].text}</span> : null}
                </figcaption>
              ) : null}
            </div>
          </section>

          <section className="anna-count">
            <span>Until we say “I do”</span>
            <div>
              {count.map((item) => (
                <div key={item.l} className={item.extra}>
                  <strong>{item.v}</strong>
                  <small className="anna-short">{item.l}</small>
                  <small className="anna-long">{item.long}</small>
                </div>
              ))}
            </div>
          </section>

          <section id="story" className="anna-block anna-story-block">
            <span>01 — Our story</span>
            <h2>{fields.message || "From classmates to forever."}</h2>
            <div className="anna-stories">
              {story.map((item) => (
                <div key={item.year} className="anna-story">
                  <i />
                  <div>
                    <strong>{item.year}</strong>
                    <b>{item.title}</b>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="anna-mid">
            <section id="day" className="anna-day">
              <span>02 — The day</span>
              <h2>Order of the day</h2>
              <div>
                <b>{formatTime(fields.time)}</b>
                <div><strong>{ceremony}</strong><small>{fields.venue}</small></div>
              </div>
              {fields.receptionVenue ? (
                <div>
                  <b>{formatTime(fields.receptionTime)}</b>
                  <div><strong>{reception}</strong><small>{fields.receptionVenue}</small></div>
                </div>
              ) : null}
            </section>

            {venue ? (
              <section id="venues" className="anna-block anna-where">
                <span>03 — Where</span>
                <h2>The venues</h2>
                <div className="anna-tabs" role="tablist">
                  {venues.map((item, index) => (
                    <button key={item.label} type="button" role="tab" aria-selected={venueTab === index} className={venueTab === index ? "on" : ""} onClick={() => setVenueTab(index)}>
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="anna-venue">
                  <div className="anna-venue-shot">
                    {venuePhoto ? <img src={venuePhoto} alt="" /> : null}
                    {captions[venueTab + 1]?.title || captions[venueTab + 1]?.text ? (
                      <figcaption>
                        {captions[venueTab + 1]?.title ? <strong>{captions[venueTab + 1].title}</strong> : null}
                        {captions[venueTab + 1]?.text ? <span>{captions[venueTab + 1].text}</span> : null}
                      </figcaption>
                    ) : null}
                  </div>
                  <div className="anna-venue-body">
                    <strong>{venue.name}</strong>
                    {venue.address ? <p>{venue.address}</p> : null}
                    <p className="anna-when">{venue.time}</p>
                    <div>
                      <a href={mapsHref(venue.name, venue.address)} target="_blank" rel="noreferrer">Directions</a>
                      {calendarUrl(fields) ? <a href={calendarUrl(fields)} target="_blank" rel="noreferrer">Calendar</a> : null}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <div className="anna-pair">
            {fields.dress ? (
              <section id="wear" className="anna-wear">
                <span>04 — What to wear</span>
                <h2>Garden formal</h2>
                <p>{fields.dress}</p>
                <div>
                  {PALETTE.map(([color, label]) => (
                    <span key={label}><i style={{ background: color }} />{label}</span>
                  ))}
                </div>
              </section>
            ) : null}
            <section className="anna-block anna-stay">
              <span>05 — Travel & stay</span>
              <h2>Coming from afar?</h2>
              <div className="anna-note"><strong>Nearest airport</strong><p>{pack.airport}</p></div>
              <div className="anna-note"><strong>Where to stay</strong><p>{pack.stay}</p></div>
            </section>
          </div>

          {faqs.length ? <section id="faq" className="anna-faq">
            <h2>Questions, answered</h2>
            <div className="anna-faq-list">
              {faqs.map((item, index) => (
                <div key={item.q}>
                  <button type="button" aria-expanded={faq === index} onClick={() => setFaq(faq === index ? -1 : index)}>
                    {item.q}<span className={faq === index ? "open" : ""}>+</span>
                  </button>
                  {faq === index ? <p>{item.a}</p> : null}
                </div>
              ))}
            </div>
          </section> : null}

          <section id="anna-rsvp" className="anna-rsvp">
            <div className="anna-rsvp-copy">
              <span>06 — RSVP</span>
              <h2>Kindly reply{fields.rsvpBy ? <> by<br />{formatLongDate(fields.rsvpBy)}</> : null}</h2>
            </div>
            <div className="anna-rsvp-form">
              {done ? (
                <div className="anna-done">
                  <em>{attending ? "See you there!" : "We'll miss you"}</em>
                  <p>
                    {attending
                      ? `Thank you, ${name.trim()}. We've noted a ${meal.toLowerCase()} dinner${song.trim() ? ` and added “${song.trim()}” to the playlist.` : "."}`
                      : `Thank you for letting us know, ${name.trim()}. You'll be in our thoughts on the day.`}
                  </p>
                  <button type="button" onClick={() => setDone(false)}>Change my reply</button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <label>Name(s)<input value={name} onChange={(event) => { setName(event.target.value); setError(false); }} placeholder="Who's replying?" aria-invalid={error} /></label>
                  {error ? <small>Please add your name.</small> : null}
                  <div className="anna-attend-row">
                    <div className="anna-field">
                      <span>Attending?</span>
                      <div className="anna-choice">
                        <button type="button" className={attending ? "on" : ""} onClick={() => setAttending(true)}>Joyfully accept</button>
                        <button type="button" className={!attending ? "on" : ""} onClick={() => setAttending(false)}>Regretfully decline</button>
                      </div>
                    </div>
                    {attending ? (
                      <div className="anna-field">
                        <span>Dinner preference</span>
                        <div className="anna-meals">
                          {["Veg", "Non-veg", "Kids"].map((item) => (
                            <button key={item} type="button" className={meal === item ? "on" : ""} onClick={() => setMeal(item)}>{item}</button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {attending ? (
                    <label>A song that'll get you dancing<input value={song} onChange={(event) => setSong(event.target.value)} placeholder="Song request (optional)" /></label>
                  ) : null}
                  <button type="submit">Send RSVP</button>
                </form>
              )}
            </div>
            <div className="anna-gifts">
              <strong>A note on gifts</strong>
              <p>{pack.gift}</p>
            </div>
          </section>
          <footer className="anna-foot">
            <em>{first}{second ? " & " : ""}{second}</em>
            <span className="anna-hash">{meetTag(first, second)}</span>
            <Link to="/">Made with InvitesReady</Link>
          </footer>
        </article>
      )}
    </div>
  );
}

function Names({ first, second }: { first: string; second: string }) {
  return (
    <>
      <span>You're invited</span>
      <em>{first}</em>
      {second ? <b>&</b> : null}
      {second ? <em>{second}</em> : null}
      <small className="anna-tap">Tap the card to reveal the date</small>
      <small className="anna-click">Click the card to reveal the date</small>
    </>
  );
}
