import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem } from "../data/custom";
import { calendarUrl, formatLongDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./palace.css";

export type PalaceTheme = "blush";

type Reply = { name: string; note: string; attending: boolean };

const ICONS = {
  rings: "/palace/icon-rings.webp",
  music: "/palace/icon-music.webp",
  mandap: "/palace/icon-mandap.webp",
  glasses: "/palace/icon-glasses.webp",
  cake: "/palace/icon-cake.webp",
};

const GLINTS: [number, number][] = [
  [0.5, 0.1], [0.24, 0.33], [0.77, 0.3], [0.14, 0.55], [0.86, 0.52], [0.5, 0.56], [0.33, 0.74],
  [0.68, 0.7], [0.08, 0.82], [0.92, 0.8], [0.42, 0.2], [0.6, 0.44], [0.2, 0.95], [0.8, 0.93],
];

function iconFor(title: string) {
  const key = title.toLowerCase();
  if (key.includes("ring")) return ICONS.rings;
  if (key.includes("sangeet") || key.includes("music")) return ICONS.music;
  if (key.includes("cocktail") || key.includes("glass")) return ICONS.glasses;
  if (key.includes("reception") || key.includes("cake")) return ICONS.cake;
  return ICONS.mandap;
}

function when(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function dottedDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${day.getDate()} · ${month} · ${day.getFullYear()}`;
}

function shortDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(day.getDate())} · ${pad(day.getMonth() + 1)} · ${day.getFullYear()}`;
}

function cityOf(address: string, venue: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] || venue;
}

function pairOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Isha", second: parts[1] || "" };
}

function monogram(names: string) {
  const { first, second } = pairOf(names);
  return { a: first[0]?.toUpperCase() ?? "A", b: second[0]?.toUpperCase() ?? "" };
}

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Camera() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8E5F57" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  );
}

export function PalaceInvite({
  fields,
  onReply,
}: {
  fields: InviteFields;
  theme?: PalaceTheme;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond", "Jost");
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nameId = useId();
  const noteId = useId();
  const [desk, setDesk] = useState(false);
  const [live, setLive] = useState(false);
  const [cover, setCover] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [wish, setWish] = useState("");
  const [extraWishes, setExtraWishes] = useState<{ text: string; by: string }[]>([]);

  const pack = packOf("palace", fields.lines);
  const photos = (fields.photos ?? []).map((photo) => photo || "");
  const events: ProgrammeItem[] = pack.programme?.length
    ? pack.programme
    : [{ kick: dottedDate(fields.date), title: "The wedding", time: "", text: fields.venue, note: fields.dress }];
  const story = pack.story ?? [];
  const parents = pack.people ?? [];
  const wishes = [...extraWishes, ...(pack.wishes ?? [])].slice(0, 3);
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const heroPlace = [fields.venue, cityOf(fields.address, fields.venue)].filter(Boolean).join(", ");
  const mapQuery = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : place;
  const names = pairOf(fields.names);
  const mark = monogram(fields.names);
  const tag = (pack.caption || "#IshaWedsKabir").replace(/\s+/g, "");
  const petals = useMemo(
    () => Array.from({ length: 8 }, (_, index) => ({
      left: `${(index * 13 + 4) % 92}%`,
      size: 9 + (index % 3) * 3,
      delay: `${2.8 + index * 1.6}s`,
      duration: `${13 + (index % 4) * 3}s`,
      dx: `${(index % 2 ? 1 : -1) * 60}px`,
    })),
    [],
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => setDesk(node.clientWidth >= 860);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)); }, []);

  function openSeal() {
    if (live) return;
    if (reduced()) {
      setLive(true);
      setCover(false);
      return;
    }
    setLive(true);
    timers.current.push(window.setTimeout(() => setCover(false), 3000));
  }

  function replay() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setLive(false);
    setCover(true);
    rootRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }

  function directions(label: string) {
    const query = label ? `${label}, ${fields.address}` : mapQuery;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
  }

  function openInstagram() {
    const handle = (pack.instagram || "").replace(/^@/, "").trim();
    const hash = tag.replace(/^#/, "");
    const url = handle
      ? `https://www.instagram.com/${encodeURIComponent(handle)}/`
      : `https://www.instagram.com/explore/tags/${encodeURIComponent(hash)}/`;
    window.open(url, "_blank", "noopener");
  }

  async function submit() {
    if (!name.trim()) {
      setNameErr(true);
      return;
    }
    const yes = attend === "yes";
    const chosen = events.filter((_, index) => picked[index] !== false).map((item) => item.title);
    const note = [
      msg.trim(),
      yes ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
      yes && chosen.length ? `Joining: ${chosen.join(", ")}.` : "",
    ].filter(Boolean).join(" · ");
    try {
      await onReply?.({ name: name.trim(), note, attending: yes });
      setDone(true);
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : "Could not send your reply.");
    }
  }

  function sendWish() {
    const text = wish.trim();
    if (!text) {
      setToast("Write a few words first.");
      return;
    }
    setExtraWishes((current) => [{ text, by: "You" }, ...current]);
    setWish("");
    setToast("Your wish has been added. Thank you!");
  }

  const target = new Date(`${fields.date || "2027-01-23"}T${fields.time || "18:00"}:00+05:30`).getTime();
  let left = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(left / 86400);
  left %= 86400;
  const count = [
    [days, "Days"],
    [Math.floor(left / 3600), "Hrs"],
    [Math.floor((left % 3600) / 60), "Min"],
    [left % 60, "Sec"],
  ] as const;
  const first = name.trim().split(" ")[0];
  const storyPhoto = photos[0] ? assetUrl(photos[0]) : "";
  const gallery = Array.from({ length: 6 }, (_, index) => photos[index + 1] ? assetUrl(photos[index + 1]) : "");
  const calendar = calendarUrl(fields);

  return (
    <div ref={rootRef} className={`pq${desk ? " is-desk" : ""}${live ? " is-live" : ""}`} data-motion={live && reduced() ? "off" : undefined} data-theme="blush">
      <section className="pq-stage">
        <img className="pq-palace" src="/palace/palace.webp" alt="" />
        <img className="pq-flowers l" src="/palace/flowers.webp" alt="" />
        <img className="pq-flowers r" src="/palace/flowers.webp" alt="" />
        <div className="pq-drape l"><img src="/palace/drape-l.webp" alt="" /></div>
        <div className="pq-drape r"><img src="/palace/drape-r.webp" alt="" /></div>
        <img className="pq-valance" src="/palace/valance.webp" alt="" />
        <img className="pq-roses l" src="/palace/roses-l.webp" alt="" />
        <img className="pq-roses r" src="/palace/roses-r.webp" alt="" />
        {GLINTS.map(([x, y], index) => (
          <span
            key={x + y}
            className="pq-glint"
            style={{ left: `${x * 100}%`, top: `${y * 100}%`, ["--dur" as string]: `${2.6 + (index % 4) * 0.7}s`, ["--delay" as string]: `${3 + index * 0.37}s` }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 20 20" width={8 + (index % 3) * 4} height={8 + (index % 3) * 4}>
              <path d="M10 0C11 7 13 9 20 10 13 11 11 13 10 20 9 13 7 11 0 10 7 9 9 7 10 0z" fill="#FFF8F0" />
            </svg>
          </span>
        ))}
        {petals.map((petal) => (
          <span
            key={petal.left + petal.delay}
            className="pq-petal"
            style={{ left: petal.left, width: petal.size, height: petal.size + 3, ["--fy" as string]: "110vh", ["--dx" as string]: petal.dx, ["--dur" as string]: petal.duration, ["--delay" as string]: petal.delay }}
            aria-hidden="true"
          />
        ))}
        <div className="pq-hero">
          <span className="pq-kick pq-fu pq-fu1">THE WEDDING OF</span>
          <h1 className="pq-names">
            <span>{names.first}</span>
            {names.second ? <span className="pq-amp">&amp;</span> : null}
            {names.second ? <span>{names.second}</span> : null}
          </h1>
          <span className="pq-date pq-fu pq-fu3">{dottedDate(fields.date)}</span>
          <span className="pq-venue-line pq-fu pq-fu4">{heroPlace}</span>
        </div>
        {live && !cover ? <a className="pq-scroll" href="#pq-welcome">SCROLL TO CONTINUE ↓</a> : null}
        {cover ? (
          <div className="pq-cover">
            <div className="pq-half l">
              <span className="pq-frame l" />
              <span className="pq-eng">{names.first.toUpperCase()}</span>
              <span className="pq-shade" />
            </div>
            <div className="pq-half r">
              <span className="pq-frame r" />
              <span className="pq-eng">{(names.second || names.first).toUpperCase()}</span>
              <span className="pq-shade" />
            </div>
            <img className="pq-ribbon" src="/palace/ribbon.webp" alt="" />
            {!live ? <span className="pq-ring" aria-hidden="true" /> : null}
            <div className="pq-plq">
              <img src="/palace/plaque.webp" alt="" style={{ width: "100%" }} />
              <span className="pq-mono">{mark.a}{mark.b ? <i>&amp;</i> : null}{mark.b}</span>
            </div>
            {!live ? (
              <span className="pq-hint">
                AN INVITATION AWAITS
                <br />
                <strong>TAP TO OPEN</strong>
              </span>
            ) : null}
          </div>
        ) : null}
        {cover && !live ? <button type="button" className="pq-hit" aria-label="Open the invitation" onClick={openSeal} /> : null}
      </section>

      <section className="pq-sec" id="pq-welcome">
        <div className="pq-crest">
          <img src="/palace/crest.webp" alt="" />
          <div className="pq-crest-in">
            <span className="pq-small">{(fields.hosts || "With the blessings of").toUpperCase()}</span>
            {parents.map((person, index) => (
              <span key={person.name} style={{ display: "contents" }}>
                {index > 0 ? <span className="pq-amp-script">&amp;</span> : null}
                <span className="pq-pname">{person.name}</span>
              </span>
            ))}
            <span className="pq-rule" />
            {fields.message ? <span className="pq-lead">{fields.message}</span> : null}
          </div>
        </div>
      </section>

      <section className="pq-sec alt">
        <span className="pq-kick">OUR STORY</span>
        <h2 className="pq-h2">How it all began</h2>
        <div className="pq-story">
          <div className="pq-arch">
            <button type="button" className="pq-arch-slot" aria-label="Add a couple photo" onClick={() => setToast("Couples add their own photos here in the editor.")}>
              {storyPhoto ? <img src={storyPhoto} alt="" /> : <><Camera /><span className="pq-small">ADD YOUR PHOTO</span></>}
            </button>
            <img className="pq-arch-frame" src="/palace/arch.webp" alt="" />
          </div>
          <div className="pq-story-list">
            {story.map((beat) => (
              <div className="pq-beat" key={beat.year + beat.title}>
                <span className="pq-year">{beat.year}</span>
                <span className="pq-story-t">{beat.title}</span>
                <span className="pq-story-d">{beat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pq-sec">
        <span className="pq-kick">THE CELEBRATIONS</span>
        <h2 className="pq-h2">Three days of joy</h2>
        <div className="pq-events">
          {events.map((event) => (
            <div className="pq-ev" key={event.title + event.time}>
              <img src={iconFor(event.title)} alt="" />
              {event.kick ? <span className="pq-small">{event.kick}</span> : null}
              <span className="pq-ev-name">{event.title}</span>
              {event.time ? <span className="pq-ev-time">{event.time}</span> : null}
              {event.text ? <span className="pq-ev-ven">{event.text}</span> : null}
              {event.note ? <span className="pq-dress">Dress · {event.note}</span> : null}
              <button type="button" className="pq-link" onClick={() => directions(event.text)}>Directions →</button>
            </div>
          ))}
        </div>
      </section>

      <section className="pq-sec alt">
        <div className="pq-venue">
          <img className="pq-venue-img" src="/palace/flowers.webp" alt="" />
          <div className="pq-venue-txt">
            <span className="pq-kick">THE VENUE</span>
            <h2 className="pq-h2">{fields.venue || "The venue"}</h2>
            {fields.address ? <span className="pq-ev-ven">{fields.address}</span> : null}
            {pack.venueNote ? <span className="pq-small" style={{ marginTop: 4, lineHeight: 1.8 }}>{pack.venueNote}</span> : null}
            <div className="pq-actions">
              <button type="button" className="pq-btn ink" onClick={() => directions("")}>Get directions</button>
              {calendar ? <a className="pq-btn paper" href={calendar} target="_blank" rel="noreferrer">Add to calendar</a> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="pq-sec">
        <span className="pq-kick">COUNTING DOWN TO FOREVER</span>
        <div className="pq-count">
          <img src="/palace/plaque.webp" alt="" />
          <div className="pq-count-row">
            {count.map(([value, label]) => (
              <div key={label}>
                <strong>{String(value).padStart(2, "0")}</strong>
                <span>{label.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pq-sec alt">
        <span className="pq-kick">MOMENTS</span>
        <h2 className="pq-h2">Our gallery</h2>
        <div className="pq-gal">
          {gallery.map((photo, index) => (
            <button
              key={index}
              type="button"
              className={index % 2 ? "pq-slot sq" : "pq-slot arch"}
              aria-label={photo ? `Gallery photo ${index + 1}` : `Add gallery photo ${index + 1}`}
              onClick={() => { if (!photo) setToast("Couples add their own photos here in the editor."); }}
            >
              {photo ? <img src={photo} alt="" /> : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <span className="pq-small">ADD YOUR PHOTOS IN THE EDITOR</span>
      </section>

      <section className="pq-sec">
        <span className="pq-kick">BLESSINGS &amp; WISHES</span>
        <h2 className="pq-h2">Words from loved ones</h2>
        <div className="pq-wishes">
          {wishes.map((item) => (
            <div className="pq-wish" key={item.by + item.text}>
              <span className="pq-quote">“</span>
              <p>{item.text}</p>
              <span className="pq-by">— {item.by}</span>
            </div>
          ))}
        </div>
        <form className="pq-wish-form" onSubmit={(event) => { event.preventDefault(); sendWish(); }}>
          <input aria-label="Your wish for the couple" value={wish} onChange={(event) => setWish(event.target.value)} placeholder={`Leave a wish for ${fields.names || "the couple"}…`} />
          <button type="submit" className="pq-btn ink">Send</button>
        </form>
      </section>

      <section className="pq-sec alt" id="pq-rsvp">
        <img className="pq-env" src="/palace/icon-envelope.webp" alt="" />
        <span className="pq-kick">{fields.rsvpBy ? `KINDLY REPLY BY ${formatLongDate(fields.rsvpBy).toUpperCase()}` : "KINDLY REPLY"}</span>
        <h2 className="pq-h2">Will you join us?</h2>
        <div className="pq-form">
          {done ? (
            <div className="pq-done">
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className="pq-heart"
                  style={{ left: `${12 + index * 11}%`, fontSize: 12 + (index % 3) * 5, animationDuration: `${1.8 + (index % 3) * 0.4}s`, animationDelay: `${0.3 + (index % 4) * 0.15}s` }}
                  aria-hidden="true"
                >
                  ♥
                </span>
              ))}
              <img src="/palace/icon-envelope.webp" alt="" />
              <span className="pq-h2">{attend === "yes" ? `Thank you, ${first}` : "We’ll miss you"}</span>
              <p className="pq-copy">
                {attend === "yes"
                  ? `Your reply is sealed. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you${cityOf(fields.address, fields.venue) ? ` in ${cityOf(fields.address, fields.venue)}` : ""}.`
                  : "Thank you for letting us know — your blessings mean the world to us."}
              </p>
              <button type="button" className="pq-link" onClick={() => setDone(false)}>Change my reply</button>
            </div>
          ) : (
            <>
              <label htmlFor={nameId}>
                <span className="pq-lab">Your name</span>
                <input id={nameId} className="pq-field" value={name} placeholder="Full name" onChange={(event) => { setName(event.target.value); setNameErr(false); }} />
                {nameErr ? <span className="pq-err">Please enter your name.</span> : null}
              </label>
              <div className="pq-yesno">
                <button type="button" className={attend === "yes" ? "pq-pill on" : "pq-pill"} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                <button type="button" className={attend === "no" ? "pq-pill on" : "pq-pill"} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="pq-step">
                    <span className="pq-lab">Guests</span>
                    <div className="pq-step-btns">
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                      <b>{guests}</b>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                    </div>
                  </div>
                  <div>
                    <span className="pq-lab">Joining us for</span>
                    <div className="pq-chips">
                      {events.map((event, index) => (
                        <button
                          key={event.title + index}
                          type="button"
                          className={picked[index] === false ? "pq-pill" : "pq-pill on"}
                          aria-pressed={picked[index] !== false}
                          onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}
                        >
                          {event.title.replace(/^The /, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              <label htmlFor={noteId}>
                <span className="pq-lab">A note for the couple</span>
                <textarea id={noteId} rows={3} value={msg} placeholder="Your wishes (optional)" onChange={(event) => setMsg(event.target.value)} />
              </label>
              <button type="button" className="pq-btn ink pq-send" onClick={submit}>Seal my reply</button>
            </>
          )}
        </div>
      </section>

      <section className="pq-sec">
        <span className="pq-kick">SHARE THE LOVE</span>
        <span className="pq-tag">{tag.startsWith("#") ? tag : `#${tag}`}</span>
        <p className="pq-copy">Tag your photos so we can relive every moment with you.</p>
        <button type="button" className="pq-btn paper" onClick={openInstagram}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={{ marginRight: 8 }}>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
          </svg>
          Open on Instagram
        </button>
      </section>

      <footer className="pq-foot">
        <img className="pq-foot-rose l" src="/palace/roses-l.webp" alt="" />
        <img className="pq-foot-rose r" src="/palace/roses-r.webp" alt="" />
        <div className="pq-foot-plq">
          <img src="/palace/plaque.webp" alt="" style={{ width: "100%" }} />
          <span className="pq-mono">{mark.a}{mark.b ? <i>&amp;</i> : null}{mark.b}</span>
        </div>
        <span className="pq-foot-names">{fields.names}</span>
        <span className="pq-small">{shortDate(fields.date)} · {cityOf(fields.address, fields.venue).toUpperCase()}</span>
        <button type="button" className="pq-link" style={{ position: "relative" }} onClick={replay}>↺ Open the invitation again</button>
        <Link className="pq-made" to="/create">MADE WITH INVITESREADY</Link>
      </footer>

      {toast ? (
        <div className="pq-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
