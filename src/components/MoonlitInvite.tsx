import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem } from "../data/custom";
import { calendarUrl, formatLongDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./moonlit.css";

export type MoonlitTheme = "night";

type Reply = { name: string; note: string; attending: boolean };

const ICONS = {
  haldi: "/moonlit/icon-haldi.webp",
  mehendi: "/moonlit/icon-mehendi.webp",
  music: "/moonlit/icon-music.webp",
  mandap: "/moonlit/icon-mandap.webp",
  glasses: "/moonlit/icon-glasses.webp",
};

const STARS: [number, number][] = [
  [0.08, 0.06], [0.3, 0.1], [0.62, 0.05], [0.9, 0.12], [0.18, 0.24], [0.78, 0.3], [0.5, 0.2],
  [0.05, 0.42], [0.95, 0.45], [0.36, 0.36], [0.7, 0.4], [0.14, 0.58], [0.86, 0.6], [0.58, 0.52],
];

function iconFor(title: string) {
  const key = title.toLowerCase();
  if (key.includes("haldi")) return ICONS.haldi;
  if (key.includes("mehendi") || key.includes("mehndi")) return ICONS.mehendi;
  if (key.includes("sangeet") || key.includes("music")) return ICONS.music;
  if (key.includes("reception") || key.includes("cocktail") || key.includes("glass")) return ICONS.glasses;
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

function replyDate(iso: string) {
  const day = when(iso);
  if (!day) return formatLongDate(iso).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${day.getDate()} ${month} ${day.getFullYear()}`;
}

function cityOf(address: string, venue: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] || venue;
}

function pairOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Meera", second: parts[1] || "" };
}

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MoonlitInvite({
  fields,
  onReply,
}: {
  fields: InviteFields;
  theme?: MoonlitTheme;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Great Vibes", "Cinzel", "Cormorant Garamond", "Jost");
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

  const pack = packOf("moonlit", fields.lines);
  const photos = (fields.photos ?? []).map((photo) => photo || "");
  const events: ProgrammeItem[] = pack.programme?.length
    ? pack.programme
    : [{ kick: dottedDate(fields.date), title: "The wedding", time: "", text: fields.venue, note: fields.dress }];
  const story = pack.story ?? [];
  const parents = pack.people ?? [];
  const wishes = [...extraWishes, ...(pack.wishes ?? [])].slice(0, 3);
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const addressParts = fields.address.split(",").map((part) => part.trim()).filter(Boolean);
  const locality = addressParts.length > 2 ? addressParts.slice(0, -1).join(", ") : addressParts.join(", ");
  const heroPlace = [fields.venue, locality].filter(Boolean).join(", ");
  const mapQuery = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : place;
  const names = pairOf(fields.names);
  const tag = (pack.caption || "#MeeraArjunUnderTheMoon").replace(/\s+/g, "");
  const lanterns = useMemo(
    () => Array.from({ length: desk ? 9 : 7 }, (_, index) => ({
      left: `${((index * 0.137 + 0.06) % 0.9) * 100}%`,
      top: `${62 + (index % 3) * 8}%`,
      size: `${(desk ? 30 : 24) + (index % 3) * (desk ? 12 : 9)}px`,
      dx: `${(index % 2 ? 1 : -1) * (20 + index * 6)}px`,
      delay: `${2.6 + index * 1.7}s`,
      duration: `${16 + (index % 4) * 4}s`,
    })),
    [desk],
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

  function openWindow() {
    if (live) return;
    if (reduced()) {
      setLive(true);
      setCover(false);
      return;
    }
    setLive(true);
    timers.current.push(window.setTimeout(() => setCover(false), 3600));
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

  const target = new Date(`${fields.date || "2026-12-12"}T${fields.time || "19:00"}:00+05:30`).getTime();
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
  const diyas = desk
    ? [{ left: "36%", top: "94.2%", size: "40px" }, { left: "60%", top: "95.6%", size: "34px" }, { left: "70%", top: "92.7%", size: "30px" }]
    : [{ left: "30%", top: "91.2%", size: "34px" }, { left: "55%", top: "93.4%", size: "30px" }, { left: "72%", top: "90%", size: "26px" }];

  return (
    <div ref={rootRef} className={`mj${desk ? " is-desk" : ""}${live ? " is-live" : ""}`} data-motion={live && reduced() ? "off" : undefined} data-theme="night">
      <section className="mj-stage">
        <div className="mj-fit">
        <div className="mj-scene">
          <span className="mj-moon-glow" aria-hidden="true" />
          <img className="mj-moon" src="/moonlit/moon.webp" alt="" />
          {STARS.map(([x, y], index) => (
            <span
              key={`${x}-${y}`}
              className="mj-star"
              style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: index % 3 ? 3 : 4, height: index % 3 ? 3 : 4, ["--dur" as string]: `${2.4 + (index % 4) * 0.8}s`, ["--delay" as string]: `${-index * 0.5}s` }}
              aria-hidden="true"
            />
          ))}
          {lanterns.map((lantern) => (
            <img
              key={lantern.left + lantern.delay}
              className="mj-lantern"
              src="/moonlit/lantern.webp"
              alt=""
              style={{ ["--left" as string]: lantern.left, ["--top" as string]: lantern.top, ["--size" as string]: lantern.size, ["--dx" as string]: lantern.dx, ["--dy" as string]: "-62cqh", ["--dur" as string]: lantern.duration, ["--delay" as string]: lantern.delay }}
            />
          ))}
          <span className="mj-water" aria-hidden="true" />
          <div className="mj-palace">
            <img className="mj-palace-img" src="/moonlit/palace.webp" alt="" />
            <img className="mj-palace-ref" src="/moonlit/palace.webp" alt="" />
          </div>
          <span className="mj-shimmer" aria-hidden="true" />
          <img className="mj-boat" src="/moonlit/boat.webp" alt="" />
          {diyas.map((diya, index) => (
            <img key={diya.left} className="mj-diya" src="/moonlit/diya.webp" alt="" style={{ ["--left" as string]: diya.left, ["--top" as string]: diya.top, ["--size" as string]: diya.size, ["--dur" as string]: `${3 + index * 0.6}s` }} />
          ))}
          <span className="mj-lot l"><img src="/moonlit/lotus.webp" alt="" /></span>
          <span className="mj-lot r"><img src="/moonlit/lotus.webp" alt="" /></span>
          <img className="mj-garland" src="/moonlit/garland.webp" alt="" />
          <div className="mj-hero">
            <span className="mj-kick mj-fu mj-fu1">UNDER THE SAME MOON</span>
            <h1 className="mj-names mj-gold">
              <span>{names.first}</span>
              {names.second ? <span className="mj-amp">&amp;</span> : null}
              {names.second ? <span>{names.second}</span> : null}
            </h1>
            <span className="mj-date mj-fu mj-fu3">{dottedDate(fields.date)}</span>
            <span className="mj-venue-line mj-fu mj-fu4">{heroPlace}</span>
          </div>
        </div>
        {live && !cover ? <a className="mj-scroll" href="#mj-welcome">SCROLL TO CONTINUE ↓</a> : null}
        {cover ? (
          <div className="mj-win">
            <div className="mj-framebox">
              <span className="mj-wall" aria-hidden="true" />
              <div className="mj-shutters">
                <img className="mj-shutter l" src="/moonlit/shutter-l.webp" alt="" />
                <img className="mj-shutter r" src="/moonlit/shutter-r.webp" alt="" />
              </div>
              <img className="mj-frame" src="/moonlit/frame.webp" alt="" />
            </div>
            <div className="mj-hang phone"><img src="/moonlit/lantern.webp" alt="" /></div>
            <div className="mj-hang side l"><img src="/moonlit/lantern.webp" alt="" /></div>
            <div className="mj-hang side r"><img src="/moonlit/lantern.webp" alt="" /></div>
            {!live ? <span className="mj-ring" aria-hidden="true" /> : null}
            {!live ? (
              <span className="mj-hint">
                A WINDOW TO OUR FOREVER
                <br />
                <strong>TAP THE LANTERN</strong>
              </span>
            ) : null}
            {!live ? <button type="button" className="mj-hit" aria-label="Light the lantern and open the window" onClick={openWindow} /> : null}
          </div>
        ) : null}
        </div>
      </section>

      <section className="mj-sec" id="mj-welcome">
        <div className="mj-arch">
          <img src="/moonlit/arch.webp" alt="" />
          <div className="mj-arch-in">
            <span className="mj-small">{(fields.hosts || "With the blessings of").toUpperCase()}</span>
            {parents.map((person, index) => (
              <span key={person.name} style={{ display: "contents" }}>
                {index > 0 ? <span className="mj-amp-script mj-gold">&amp;</span> : null}
                <span className="mj-pname">{person.name}</span>
              </span>
            ))}
            <span className="mj-rule" />
            <span className="mj-lead">{fields.message}</span>
          </div>
        </div>
      </section>

      <section className="mj-sec alt">
        <span className="mj-kick">OUR STORY</span>
        <h2 className="mj-h2 mj-gold">Written in the stars</h2>
        <div className="mj-story">
          <div className="mj-jh">
            <button type="button" className="mj-jh-slot" aria-label="Add a couple photo" onClick={() => setToast("Couples add their own photos here in the editor.")}>
              {storyPhoto ? <img src={storyPhoto} alt="" /> : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E9BE6A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
                  <span className="mj-small">ADD PHOTO</span>
                </>
              )}
            </button>
            <img src="/moonlit/frame.webp" alt="" />
          </div>
          <div className="mj-beats">
            {story.map((beat) => (
              <div className="mj-beat" key={beat.year + beat.title}>
                <span className="mj-year">{beat.year}</span>
                <span className="mj-beat-t mj-gold">{beat.title}</span>
                <span className="mj-beat-d">{beat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mj-sec">
        <span className="mj-kick">THE CELEBRATIONS</span>
        <h2 className="mj-h2 mj-gold">Three nights of joy</h2>
        <div className="mj-events">
          {events.map((event) => (
            <div className="mj-ev" key={event.title + event.time}>
              <img src={iconFor(event.title)} alt="" />
              <span className="mj-small">{event.kick}</span>
              <span className="mj-ev-name mj-gold">{event.title}</span>
              <span className="mj-ev-time">{event.time}</span>
              <span className="mj-ev-ven">{event.text}</span>
              {event.note ? <span className="mj-dress">Dress · {event.note}</span> : null}
              <button type="button" className="mj-link" onClick={() => directions(event.text)}>Directions →</button>
            </div>
          ))}
        </div>
      </section>

      <section className="mj-sec alt">
        <div className="mj-venue">
          <img className="mj-venue-img" src="/moonlit/boat.webp" alt="" />
          <div className="mj-venue-txt">
            <span className="mj-kick">THE VENUE</span>
            <h2 className="mj-h2 mj-gold">{fields.venue || "The Moonlit Ghats"}</h2>
            <span className="mj-ev-ven">{fields.address}</span>
            {pack.venueNote ? <span className="mj-small" style={{ lineHeight: 1.9 }}>{pack.venueNote}</span> : null}
            <div className="mj-actions">
              <button type="button" className="mj-btn gold" onClick={() => directions("")}>Get directions</button>
              <a className="mj-btn line" href={calendar}>Add to calendar</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mj-sec">
        <span className="mj-kick">UNTIL THE MOON RISES ON US</span>
        <div className="mj-count">
          <img src="/moonlit/moon.webp" alt="" />
          <div className="mj-count-row">
            {count.map(([value, label]) => (
              <span key={label}><strong>{String(value).padStart(2, "0")}</strong><em>{label.toUpperCase()}</em></span>
            ))}
          </div>
        </div>
      </section>

      <section className="mj-sec alt">
        <span className="mj-kick">MOMENTS</span>
        <h2 className="mj-h2 mj-gold">Our gallery</h2>
        <div className="mj-gal">
          {gallery.map((photo, index) => (
            <button key={index} type="button" className={index % 2 ? "mj-slot" : "mj-slot arch"} aria-label={`Add gallery photo ${index + 1}`} onClick={() => setToast("Couples add their own photos here in the editor.")}>
              {photo ? <img src={photo} alt="" /> : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              )}
            </button>
          ))}
        </div>
        <span className="mj-small">ADD YOUR PHOTOS IN THE EDITOR</span>
      </section>

      <section className="mj-sec">
        <span className="mj-kick">BLESSINGS &amp; WISHES</span>
        <h2 className="mj-h2 mj-gold">Words from loved ones</h2>
        <div className="mj-wishes">
          {wishes.map((item) => (
            <div className="mj-wish" key={item.by + item.text}>
              <span className="mj-wish-q">“</span>
              <p>{item.text}</p>
              <cite>— {item.by}</cite>
            </div>
          ))}
        </div>
        <form className="mj-wish-form" onSubmit={(event) => { event.preventDefault(); sendWish(); }}>
          <input className="mj-field" aria-label="Your wish for the couple" value={wish} placeholder={`Leave a wish for ${fields.names || "the couple"}…`} onChange={(event) => setWish(event.target.value)} />
          <button type="submit" className="mj-btn gold">Send</button>
        </form>
      </section>

      <section className="mj-sec alt" id="mj-rsvp">
        <img className="mj-env" src="/moonlit/envelope.webp" alt="" />
        <span className="mj-kick">{fields.rsvpBy ? `KINDLY REPLY BY ${replyDate(fields.rsvpBy)}` : "KINDLY REPLY"}</span>
        <h2 className="mj-h2 mj-gold">Will you join us?</h2>
        <div className="mj-form">
          {done ? (
            <div className="mj-done">
              {Array.from({ length: 5 }, (_, index) => (
                <img key={index} className="mj-done-lantern" src="/moonlit/lantern.webp" alt="" style={{ ["--left" as string]: `${10 + index * 19}%`, ["--size" as string]: `${22 + (index % 3) * 8}px`, ["--dx" as string]: `${(index % 2 ? 1 : -1) * 14}px`, ["--dy" as string]: "-220px", ["--dur" as string]: `${4 + (index % 3)}s`, ["--delay" as string]: `${0.4 + index * 0.25}s` }} />
              ))}
              <img className="mj-stamp" src="/moonlit/diya.webp" alt="" />
              <span className="mj-done-t mj-gold">{attend === "yes" ? `Thank you, ${first}` : "We’ll miss you"}</span>
              <span className="mj-lead">
                {attend === "yes"
                  ? `Your diya is lit. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you by the lake in ${cityOf(fields.address, "Udaipur")}.`
                  : "Thank you for letting us know — your blessings mean the world to us."}
              </span>
              <button type="button" className="mj-link" onClick={() => setDone(false)}>Change my reply</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="mj-lab" htmlFor={nameId}>Your name</label>
                <input id={nameId} className="mj-field" value={name} placeholder="Full name" onChange={(event) => { setName(event.target.value); setNameErr(false); }} />
                {nameErr ? <span className="mj-err">Please enter your name.</span> : null}
              </div>
              <div className="mj-choice">
                <button type="button" className={attend === "yes" ? "mj-pill on" : "mj-pill"} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                <button type="button" className={attend === "no" ? "mj-pill on" : "mj-pill"} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="mj-guests">
                    <span className="mj-lab">Guests</span>
                    <div className="mj-step">
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                      <strong aria-live="polite">{guests}</strong>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span className="mj-lab">Joining us for</span>
                    <div className="mj-chips">
                      {events.map((event, index) => {
                        const on = picked[index] !== false;
                        return (
                          <button key={event.title} type="button" className={on ? "mj-pill on" : "mj-pill"} aria-pressed={on} onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}>
                            {event.title.replace(/^The /, "")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label className="mj-lab" htmlFor={noteId}>A note for the couple</label>
                <textarea id={noteId} className="mj-field mj-area" rows={3} value={msg} placeholder="Your wishes (optional)" onChange={(event) => setMsg(event.target.value)} />
              </div>
              <button type="button" className="mj-btn gold mj-send" onClick={submit}>Light a diya &amp; send</button>
            </>
          )}
        </div>
      </section>

      <section className="mj-sec">
        <span className="mj-kick">SHARE THE LOVE</span>
        <span className="mj-tag mj-gold">{tag}</span>
        <span className="mj-lead">Tag your photos so we can relive every moment with you.</span>
        <button type="button" className="mj-btn line" onClick={openInstagram}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" style={{ marginRight: 8 }}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
          Open on Instagram
        </button>
      </section>

      <footer className="mj-foot">
        <img className="mj-foot-lot" src="/moonlit/lotus.webp" alt="" />
        <div className="mj-foot-diyas">
          <img src="/moonlit/diya.webp" alt="" />
          <img src="/moonlit/diya.webp" alt="" />
          <img src="/moonlit/diya.webp" alt="" />
        </div>
        <span className="mj-foot-names mj-gold">{fields.names}</span>
        <span className="mj-small" style={{ position: "relative" }}>{shortDate(fields.date)} · {cityOf(fields.address, fields.venue).toUpperCase()}</span>
        <button type="button" className="mj-link" style={{ position: "relative" }} onClick={replay}>↺ Open the window again</button>
        <Link className="mj-made" to="/create">MADE WITH INVITESREADY</Link>
      </footer>

      {toast ? (
        <div className="mj-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
