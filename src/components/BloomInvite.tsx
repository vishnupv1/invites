import { useEffect, useId, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./bloom.css";

type Phase = "closed" | "opening" | "open";
type Reply = { name: string; note: string; attending: boolean };

const FLOWER = Array.from({ length: 18 }, (_, index) => `/bloom/f${index}.webp`);
const PETAL = Array.from({ length: 6 }, (_, index) => `/bloom/p${index}.webp`);
const SWATCHES = ["#EFB7AE", "#F3D58A", "#A9C1DE", "#B9C7A4", "#E58C80"];
const STOPS = [
  { x: 17, y: 13, icon: "/bloom/plane.webp", name: "Jaipur Airport", meta: "Arrivals · Day 1" },
  { x: 80, y: 36, icon: "/bloom/hotel.webp", name: "The Garden Hotel", meta: "Guest stay" },
  { x: 25, y: 63, icon: "/bloom/temple.webp", name: "Govind Dev Ji", meta: "Morning blessing" },
  { x: 72, y: 86, icon: "/bloom/mandap.webp", name: "The Rose Pavilion", meta: "Wedding · 7 Mar" },
];
const FALL = Array.from({ length: 14 }, (_, index) => {
  const petal = index % 3 === 0;
  return {
    src: petal ? PETAL[index % PETAL.length] : FLOWER[(index * 5) % FLOWER.length],
    left: ((index * 0.137 + 0.04) % 0.94) * 100,
    size: petal ? 28 : 40 + (index % 3) * 8,
    x: (index % 2 ? 1 : -1) * (30 + index * 5),
    spin: index % 2 ? 260 : -220,
    dur: 11 + (index % 5) * 2.4,
    delay: 2 + index * 1.1,
  };
});

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Diya", second: parts[1] || "Aryan" };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function headlineDate(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${weekday} · ${day.getDate()} ${month} · ${day.getFullYear()}`;
}

function replyBy(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${day.getDate()} ${month} ${day.getFullYear()}`;
}

function shortDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!day) return date;
  return `${day} · ${month} · ${year}`;
}

export function BloomInvite({
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
  useFonts("Great Vibes", "Cormorant Garamond", "Jost");
  const rootRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const noteId = useId();
  const [desk, setDesk] = useState(false);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [wish, setWish] = useState("");
  const [extraWishes, setExtraWishes] = useState<{ text: string; by: string }[]>([]);
  const [picked, setPicked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => setDesk(node.clientWidth >= 960);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    const id = window.setTimeout(() => setPhase("open"), 3300);
    return () => window.clearTimeout(id);
  }, [phase]);

  const couple = coupleOf(fields.names);
  const pack = packOf("bloom", fields.lines);
  const story = pack.story ?? [];
  const programme = pack.programme ?? [];
  const shownWishes = [
    ...extraWishes,
    ...wishes.map((item) => ({ text: item.note, by: item.name })),
    ...(pack.wishes ?? []),
  ].slice(0, 3);
  const photos = (fields.photos ?? []).filter(Boolean);
  const storyPhoto = photos[0] ? assetUrl(photos[0]) : "";
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const tag = pack.instagram || `#${couple.first}${couple.second}InBloom`;
  const party = pack.caption || "Riya · Sanya · Meher · Tara · Isha · Kavya";
  const left = Math.max(0, new Date(`${fields.date}T${fields.time || "18:00"}:00+05:30`).getTime() - now);
  const count = [
    [Math.floor(left / 86400000), "DAYS"],
    [Math.floor(left / 3600000) % 24, "HOURS"],
    [Math.floor(left / 60000) % 60, "MIN"],
    [Math.floor(left / 1000) % 60, "SEC"],
  ] as const;
  const icons = [FLOWER[3], FLOWER[1], FLOWER[5], FLOWER[2], FLOWER[0]];

  function open() {
    if (phase !== "closed") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("open");
      return;
    }
    setPhase("opening");
  }

  function directions() {
    const query = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : place;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function addCal() {
    const start = new Date(`${fields.date}T${fields.time || "18:00"}:00+05:30`);
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    const stamp = (day: Date) => day.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${couple.first} & ${couple.second}`)}&dates=${stamp(start)}/${stamp(end)}&location=${encodeURIComponent(place)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
        note: attend === "yes" ? `${guests} ${guests === 1 ? "guest" : "guests"}${note.trim() ? ` · ${note.trim()}` : ""}` : note.trim(),
        attending: attend === "yes",
      });
      setDone(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div ref={rootRef} className={`bl${desk ? " is-desk" : ""}${phase === "opening" ? " is-opening" : ""}${phase === "open" ? " is-open" : ""}`}>
      <section className="bl-stage" aria-label="Opening">
        <span className="bl-veil" aria-hidden="true" />
        <img className="bl-spray t" src="/bloom/spray-t.webp" alt="" />
        <img className="bl-spray b" src="/bloom/spray-b.webp" alt="" />
        <div className="bl-wreath"><img src="/bloom/wreath.webp" alt="" /></div>
        <div className="bl-hero">
          <span className="bl-kick">WE’RE GETTING MARRIED</span>
          <h1 className="bl-names">
            <span>{couple.first}</span>
            <i>&amp;</i>
            <span>{couple.second}</span>
          </h1>
          <span className="bl-rule" />
          <span className="bl-date">{headlineDate(fields.date)}</span>
          <span className="bl-place">{place}</span>
        </div>
        {phase === "open" ? FALL.map((flake) => (
          <img
            key={`${flake.left}-${flake.delay}`}
            className="bl-fall"
            src={flake.src}
            alt=""
            style={{
              left: `${flake.left}%`,
              width: flake.size,
              ["--x" as string]: `${flake.x}px`,
              ["--r" as string]: `${flake.spin}deg`,
              ["--dur" as string]: `${flake.dur}s`,
              ["--delay" as string]: `${flake.delay}s`,
            }}
          />
        )) : null}
        {phase === "open" ? <a className="bl-scroll" href="#bloom-story">SCROLL TO CONTINUE ↓</a> : null}

        {phase !== "open" ? (
          <div className="bl-env">
            <div className="bl-sheet">
              <img className="fit bl-env-in" src="/bloom/linen.webp" alt="" />
              <div className="bl-card">
                <b>YOU ARE INVITED</b>
                <strong>{couple.first} &amp; {couple.second}</strong>
                <b>{shortDate(fields.date)}</b>
                <img src="/bloom/f2.webp" alt="" />
              </div>
              <img className="fit bl-front" src="/bloom/envelope.webp" alt="" />
              <div className="bl-flap">
                <img src="/bloom/flap.webp" alt="" />
                <span className="bl-flap-back" />
              </div>
              {phase === "closed" ? <span className="bl-ring" aria-hidden="true" /> : null}
              <img className="bl-seal" src="/bloom/seal.webp" alt="" />
              <div className="bl-env-copy">
                <span>A letter for you, with love</span>
                <strong>{couple.first} &amp; {couple.second}</strong>
              </div>
              {phase === "closed" ? <span className="bl-tap">TAP THE SEAL TO OPEN</span> : null}
            </div>
            {phase === "closed" ? <button type="button" className="bl-hit" aria-label="Break the seal and open the invitation" onClick={open} /> : null}
          </div>
        ) : null}
      </section>

      <section className="bl-sec" id="bloom-story">
        <span className="bl-kick">OUR STORY</span>
        <h2>How we bloomed</h2>
        <div className="bl-story">
          <div className="bl-frame">
            <button type="button" className="bl-slot" aria-label="Add a couple photo" onClick={() => setToast("Couples add their own photos here in the editor.")}>
              {storyPhoto ? <img src={storyPhoto} alt="" /> : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B9786E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
                  <span className="bl-small">ADD YOUR PHOTO</span>
                </>
              )}
            </button>
            <img src="/bloom/wreath.webp" alt="" />
          </div>
          <div className="bl-beats">
            {story.map((beat) => (
              <article key={beat.year + beat.title}>
                <b>{beat.year}</b>
                <strong>{beat.title}</strong>
                <p>{beat.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bl-sec alt">
        <img className="bl-flower" src="/bloom/f6.webp" alt="" />
        <h2>Counting the days</h2>
        <div className="bl-count">
          {count.map(([value, label]) => (
            <div key={label}>
              <b>{String(value).padStart(2, "0")}</b>
              <span className="bl-small">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bl-sec">
        <img className="bl-mandap" src="/bloom/mandap.webp" alt="" />
        <span className="bl-kick">THE CELEBRATIONS</span>
        <h2>Schedule</h2>
        <div className="bl-tl">
          <span className="bl-tl-line" aria-hidden="true" />
          {programme.map((event, index) => (
            <article key={event.title + event.time}>
              <time>{event.time}</time>
              <img src={icons[index % icons.length]} alt="" />
              <div>
                <strong>{event.title}</strong>
                <span>{event.kick} · {event.text}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bl-sec alt">
        <span className="bl-kick">THE WEDDING PARTY</span>
        <h2>Our bridesmaids</h2>
        <img className="bl-maids" src="/bloom/maids.webp" alt="" />
        <span className="bl-lead">{party}</span>
      </section>

      <section className="bl-sec">
        <span className="bl-kick">HOW TO GET THERE</span>
        <h2>The way to us</h2>
        <div className="bl-map">
          <svg viewBox="0 0 400 520" preserveAspectRatio="none" aria-hidden="true">
            <path d="M70 70 C 200 60, 330 110, 320 190 S 90 250, 100 330 S 300 380, 290 460" fill="none" stroke="#C98D82" strokeWidth="2.5" strokeDasharray="7 9" strokeLinecap="round" />
          </svg>
          {STOPS.map((stop) => (
            <div key={stop.name} className="bl-stop" style={{ left: `${stop.x}%`, top: `${stop.y}%` }}>
              <img src={stop.name === fields.venue ? "/bloom/mandap.webp" : stop.icon} alt="" />
              <strong>{stop.name === "The Rose Pavilion" ? fields.venue || stop.name : stop.name}</strong>
              <span>{stop.meta}</span>
            </div>
          ))}
        </div>
        <div className="bl-actions">
          <button type="button" className="bl-btn solid" onClick={directions}>Open in Maps</button>
          <button type="button" className="bl-btn line" onClick={addCal}>Add to calendar</button>
        </div>
      </section>

      <section className="bl-sec alt">
        <span className="bl-kick">WHAT TO WEAR</span>
        <h2>Dress code</h2>
        <span className="bl-dress">{fields.dress || "Garden pastels"}</span>
        <p className="bl-lead">Soft florals and spring colours — think blush, butter yellow, powder blue and sage.</p>
        <div className="bl-swatches">
          {SWATCHES.map((color) => <i key={color} style={{ background: color }} />)}
        </div>
      </section>

      <section className="bl-sec">
        <span className="bl-kick">MOMENTS</span>
        <h2>Our gallery</h2>
        <div className="bl-gal">
          {Array.from({ length: 6 }, (_, index) => {
            const photo = photos[index + 1];
            return (
              <button key={index} type="button" className={index % 2 ? "card" : "arch"} aria-label={`Add gallery photo ${index + 1}`} onClick={() => setToast("Couples add their own photos here in the editor.")}>
                {photo ? <img src={assetUrl(photo)} alt="" /> : <img className="mark" src={FLOWER[(index * 3 + 1) % FLOWER.length]} alt="" />}
              </button>
            );
          })}
        </div>
        <span className="bl-small">COUPLES ADD PHOTOGRAPHS IN THE EDITOR</span>
      </section>

      <section className="bl-sec alt">
        <span className="bl-kick">BLESSINGS &amp; WISHES</span>
        <h2>Words from loved ones</h2>
        <div className="bl-wishes">
          {shownWishes.map((item) => (
            <article key={item.by + item.text} className="bl-wish">
              <b>“</b>
              <p>{item.text}</p>
              <span>— {item.by}</span>
            </article>
          ))}
        </div>
        <form className="bl-wish-form" onSubmit={(event) => {
          event.preventDefault();
          if (!wish.trim()) {
            setToast("Write a few words first.");
            return;
          }
          setExtraWishes((current) => [{ text: wish.trim(), by: "You" }, ...current]);
          setWish("");
          setToast("Your wish has been added. Thank you!");
        }}>
          <input className="bl-field" aria-label="Your wish for the couple" value={wish} onChange={(event) => setWish(event.target.value)} placeholder={`Leave a wish for ${couple.first} & ${couple.second}…`} />
          <button type="submit" className="bl-btn solid">Send</button>
        </form>
      </section>

      <section className="bl-sec" id="bloom-rsvp">
        <h2>Will you join us?</h2>
        <span className="bl-gold">KINDLY REPLY BY {replyBy(fields.rsvpBy || fields.date)}</span>
        <div className="bl-form">
          {done ? (
            <div className="bl-done">
              {Array.from({ length: 12 }, (_, index) => {
                const angle = (index / 12) * Math.PI * 2;
                return (
                  <img
                    key={index}
                    className="bl-burst"
                    src={index % 2 ? PETAL[index % PETAL.length] : FLOWER[index % FLOWER.length]}
                    alt=""
                    style={{
                      ["--x" as string]: `${Math.round(Math.cos(angle) * 150)}px`,
                      ["--y" as string]: `${Math.round(Math.sin(angle) * 110 - 20)}px`,
                      ["--r" as string]: `${index * 60}deg`,
                      ["--d" as string]: `${0.15 + (index % 4) * 0.05}s`,
                    }}
                  />
                );
              })}
              <img src="/bloom/seal.webp" alt="" />
              <strong>{attend === "yes" ? `Thank you, ${name.trim().split(" ")[0]}` : "We’ll miss you"}</strong>
              <p className="bl-lead">
                {attend === "yes"
                  ? `Your reply is on its way. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you in Jaipur.`
                  : "Thank you for letting us know — your blessings mean the world to us."}
              </p>
              <button type="button" className="bl-link" onClick={() => setDone(false)}>Change my reply</button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor={nameId}>Full name *</label>
                <input id={nameId} className="bl-field" value={name} onChange={(event) => { setName(event.target.value); setNameError(false); }} placeholder="Your name" />
                {nameError ? <span className="bl-err">Please enter your name.</span> : null}
              </div>
              <div className="bl-choice">
                <button type="button" className={attend === "yes" ? "on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                <button type="button" className={attend === "no" ? "on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="bl-step">
                    <span className="bl-lab">Guests</span>
                    <div>
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                      <strong>{guests}</strong>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                    </div>
                  </div>
                  <div>
                    <span className="bl-lab">Joining us for</span>
                    <div className="bl-chips">
                      {programme.map((event, index) => (
                        <button key={event.title} type="button" className={picked[index] !== false ? "on" : undefined} aria-pressed={picked[index] !== false} onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}>
                          {event.title.replace(/^The /, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              <div>
                <label htmlFor={noteId}>Message for the couple (optional)</label>
                <textarea id={noteId} className="bl-area" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write us a few words…" />
              </div>
              <button type="button" className="bl-btn solid bl-wide" onClick={submit} disabled={sending}>{sending ? "Sending…" : "Send my reply"}</button>
            </>
          )}
        </div>
      </section>

      <section className="bl-sec alt">
        <span className="bl-kick">SHARE THE LOVE</span>
        <span className="bl-tag">{tag}</span>
        <button type="button" className="bl-btn line" onClick={() => setToast(`Opening ${tag} on Instagram…`)}>Open on Instagram</button>
      </section>

      <footer className="bl-foot">
        <img className="spray" src="/bloom/spray-b.webp" alt="" />
        <strong>{couple.first} &amp; {couple.second}</strong>
        <span className="bl-small">{shortDate(fields.date)} · {(fields.address || "Jaipur").toUpperCase()}</span>
        <button type="button" className="bl-link" onClick={() => setPhase("closed")}>↺ Open the letter again</button>
        <a className="bl-made" href="/">MADE WITH INVITESREADY</a>
      </footer>

      {toast ? (
        <div className="bl-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
