import { useEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./siyaram.css";

const ART = "/siyaram";

const FRAMES = [
  { src: `${ART}/bloom.webp`, text: "A Divine Awakening" },
  { src: `${ART}/bow.webp`, text: "The Sacred Bow" },
  { src: `${ART}/palace.webp`, text: "Welcome to Mithila" },
  { src: `${ART}/vivah.webp`, text: "A Love Blessed for Eternity" },
];

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "playing" | "open";

function coupleOf(names: string) {
  const [left, right] = names.split(/\s*&\s*/);
  return { left: (left || names).trim(), right: (right || "").trim() };
}

function heroDate(iso: string) {
  const date = new Date(`${iso || "2027-12-12"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SiyaramInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Cormorant Garamond", "DM Sans");
  const pack = packOf("siyaram", fields.lines);
  const couple = coupleOf(fields.names || "Aarav & Meera");
  const longDate = formatLongDate(fields.date);
  const stamp = heroDate(fields.date);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const lotusRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [frame, setFrame] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [openPhoto, setOpenPhoto] = useState(false);

  const programme = pack.programme?.length
    ? pack.programme
    : [
        { title: "The Sacred Vivah", time: formatTime(fields.time), text: [fields.venue, fields.address].filter(Boolean).join(", "), note: fields.dress, kick: longDate },
      ];
  const [picked, setPicked] = useState<string[]>(() => programme.map((item) => item.title));
  const photos = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : "")).filter(Boolean);
  const mapsQuery = [fields.venue, fields.address].filter(Boolean).join(", ");
  const maps = mapsQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}` : "";
  const calendar = calendarUrl(fields);
  const target = new Date(`${fields.date || "2027-12-12"}T${fields.time || "18:00"}:00+05:30`).getTime();
  const remaining = Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const units = [
    Math.floor(remaining / 86400000),
    Math.floor(remaining / 3600000) % 24,
    Math.floor(remaining / 60000) % 60,
    Math.floor(remaining / 1000) % 60,
  ];

  useEffect(() => {
    if (quiet) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quiet]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(".sr-reveal")];
    if (quiet || prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { root, threshold: 0.22 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [quiet, photos.length, programme.length]);

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (!openPhoto) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPhoto(false);
      if (event.key === "ArrowLeft") setPhoto((current) => (current + photos.length - 1) % photos.length);
      if (event.key === "ArrowRight") setPhoto((current) => (current + 1) % photos.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPhoto, photos.length]);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function begin() {
    if (phase !== "closed") return;
    if (quiet || prefersReducedMotion()) {
      setPhase("open");
      return;
    }
    setPhase("playing");
    setFrame(0);
    timers.current = [
      window.setTimeout(() => setFrame(1), 700),
      window.setTimeout(() => setFrame(2), 1400),
      window.setTimeout(() => setFrame(3), 2100),
      window.setTimeout(() => {
        timers.current = [];
        setPhase("open");
      }, 2800),
    ];
  }

  function replay() {
    clearTimers();
    setPhase("closed");
    setFrame(0);
    scrollRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    lotusRef.current?.focus({ preventScroll: true });
  }

  function toggleEvent(title: string) {
    setPicked((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    const yes = attend === "yes";
    if (yes && !picked.length) {
      setError("Please choose at least one celebration.");
      return;
    }
    const message = [
      note.trim(),
      yes ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
      yes ? picked.join(", ") : "",
    ].filter(Boolean).join(" · ");
    try {
      await onReply?.({ name: name.trim(), note: message, attending: yes });
    } catch {
      setError("Could not send that reply. Try again.");
      return;
    }
    setError("");
    setSent(true);
  }

  const names = (
    <>
      {couple.left}
      {couple.right ? <> <em>&</em> {couple.right}</> : null}
    </>
  );

  return (
    <div className={`sr${quiet ? " is-quiet" : ""}`}>
      <div className="sr-scroll" ref={scrollRef}>
        <section className="sr-hero" aria-labelledby="sr-title">
          <img className="sr-hero-art" src={`${ART}/vivah.webp`} alt="" />
          <div className="sr-hero-copy">
            <p className="sr-dev">॥ मंगलं भगवान् विष्णुः ॥</p>
            <p className="sr-kicker">{fields.hosts || "Together with our families"}</p>
            <h1 id="sr-title">{names}</h1>
            <p className="sr-italic">{fields.title || "Invite you to celebrate their sacred union"}</p>
            <p className="sr-date">{stamp}</p>
            <button className="sr-pill" type="button" onClick={() => storyRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" })}>
              Explore our invitation ↓
            </button>
          </div>
        </section>

        <section className="sr-section" id="sr-blessings" ref={storyRef} tabIndex={-1}>
          <div className="sr-split sr-reveal">
            <div>
              <p className="sr-kicker">Divine blessings</p>
              <h2>With the grace of Siya Ram</h2>
              <p className="sr-dev">॥ श्री सीतारामचन्द्राभ्यां नमः ॥</p>
              <p>{fields.message || "With hearts full of gratitude and blessings from our families, we begin a new journey of love, faith, and togetherness."}</p>
              <p className="sr-muted">We would be honored to have you celebrate this beautiful beginning with us.</p>
            </div>
            <img className="sr-portrait" src={`${ART}/portrait.webp`} alt="Devotional portrait of Shri Ram and Mata Sita" />
          </div>
        </section>

        <img className="sr-mandap" src={`${ART}/mandap.webp`} alt="" />

        <section className="sr-section is-tint">
          <div className="sr-reveal">
            <p className="sr-kicker">Our celebrations</p>
            <h2>Moments of joy</h2>
            <p className="sr-lead">Three beautiful occasions, one unforgettable celebration.</p>
            <div className="sr-cards">
              {programme.map((item, index) => (
                <article className="sr-card" key={`${item.title}-${index}`}>
                  <p className="sr-kicker">{item.kick}</p>
                  <h3>{item.title}</h3>
                  {item.time ? <p>{item.time}</p> : null}
                  {item.text ? <p>{item.text}</p> : null}
                  {item.note ? <p className="sr-fine">{item.note}</p> : null}
                </article>
              ))}
            </div>
            <img className="sr-divider" src={`${ART}/divider.webp`} alt="" />
          </div>
        </section>

        {photos.length ? (
          <section className="sr-section">
            <div className="sr-reveal">
              <p className="sr-kicker">Our story</p>
              <h2>Cherished moments</h2>
              <div className="sr-viewer">
                <button type="button" aria-label="Previous image" onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}>‹</button>
                <button type="button" className="sr-shot" onClick={() => setOpenPhoto(true)} aria-label={`View photo ${photo + 1}`}>
                  <img src={photos[photo]} alt="" />
                </button>
                <button type="button" aria-label="Next image" onClick={() => setPhoto((photo + 1) % photos.length)}>›</button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="sr-section is-tint">
          <div className="sr-reveal">
            <p className="sr-kicker">The awaited day</p>
            <h2>Until our sacred day</h2>
            <div className="sr-clock">
              <img src={`${ART}/medallion.webp`} alt="" />
              <div className="sr-digits" role="timer" aria-label="Countdown to the wedding">
                {["Days", "Hours", "Min", "Sec"].map((label, index) => (
                  <div key={label}>
                    <strong>{String(units[index]).padStart(2, "0")}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="sr-fine">{remaining <= 0 ? "Our celebration has begun." : "Counting the days until we celebrate."}</p>
          </div>
        </section>

        <section className="sr-section">
          <div className="sr-reveal">
            <p className="sr-kicker">The sacred destination</p>
            <h2>Where we say forever</h2>
            <img className="sr-venue" src={`${ART}/palace.webp`} alt="" />
            <h3>{fields.venue || "The wedding venue"}</h3>
            {fields.address ? <p>{fields.address}</p> : null}
            <p>{[longDate, formatTime(fields.time)].filter(Boolean).join(" · ")}</p>
            {fields.dress ? <p className="sr-fine">{fields.dress}</p> : null}
            <div className="sr-actions">
              {maps ? <a className="sr-pill" href={maps} target="_blank" rel="noopener noreferrer">Directions</a> : null}
              {calendar ? <a className="sr-pill" href={calendar} target="_blank" rel="noopener noreferrer">Add to calendar</a> : null}
            </div>
          </div>
        </section>

        <section className="sr-section is-tint">
          <div className="sr-reveal">
            <img className="sr-emblem" src={`${ART}/emblem.webp`} alt="" />
            <p className="sr-kicker">Your presence is our blessing</p>
            <h2>Kindly RSVP</h2>
            <p className="sr-lead">We would love to celebrate with you.</p>
            <div className="sr-rsvp">
              {sent ? (
                <div className="sr-thanks">
                  <h3>{attend === "yes" ? `With joy, ${name.trim()}.` : `Thank you, ${name.trim()}.`}</h3>
                  <p>{attend === "yes" ? "We look forward to celebrating with you." : "Thank you for letting us know."}</p>
                  <button className="sr-pill" type="button" onClick={() => setSent(false)}>Edit response</button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <label className="sr-field" htmlFor="sr-name">
                    <span>Your full name</span>
                    <input id="sr-name" value={name} maxLength={90} required autoComplete="name" placeholder="Full name" onChange={(event) => setName(event.target.value)} />
                  </label>
                  <fieldset>
                    <legend>Will you attend?</legend>
                    <div className="sr-choice">
                      <label className={attend === "yes" ? "is-on" : ""}>
                        <input type="radio" name="sr-attend" checked={attend === "yes"} onChange={() => setAttend("yes")} />
                        <span>Joyfully accepts</span>
                      </label>
                      <label className={attend === "no" ? "is-on" : ""}>
                        <input type="radio" name="sr-attend" checked={attend === "no"} onChange={() => setAttend("no")} />
                        <span>Regretfully declines</span>
                      </label>
                    </div>
                  </fieldset>
                  {attend === "yes" ? (
                    <>
                      <label className="sr-field" htmlFor="sr-guests">
                        <span>Number of guests</span>
                        <select id="sr-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                            <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                          ))}
                        </select>
                      </label>
                      <fieldset>
                        <legend>Celebrations you will attend</legend>
                        <div className="sr-picks">
                          {programme.map((item) => (
                            <label className={picked.includes(item.title) ? "is-on" : ""} key={item.title}>
                              <input type="checkbox" checked={picked.includes(item.title)} onChange={() => toggleEvent(item.title)} />
                              <span>{item.title}</span>
                              <small>{[item.kick, item.time].filter(Boolean).join(" · ")}</small>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  ) : null}
                  <label className="sr-field" htmlFor="sr-note">
                    <span>A message for the couple</span>
                    <textarea id="sr-note" rows={4} maxLength={500} placeholder="Your blessings and wishes..." value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <p className="sr-error" role="alert">{error}</p>
                  <button className="sr-send" type="submit">Send my response</button>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="sr-foot">
          <p className="sr-kicker">With divine blessings</p>
          <img src={`${ART}/emblem.webp`} alt="" />
          <h2>{names}</h2>
          <p className="sr-dev">॥ श्री सीतारामचन्द्राभ्यां नमः ॥</p>
          <p>May love, devotion and joy illuminate every new beginning.</p>
          <button className="sr-pill" type="button" onClick={replay}>Replay the invitation ↺</button>
          <a className="sr-made" href={madeWithHref("siyaram")}>Made with InvitesReady</a>
        </footer>
      </div>

      {phase !== "open" ? (
        <div className={`sr-intro is-${phase}`}>
          <img className="sr-intro-bg" src={`${ART}/palace.webp`} alt="" />
          {phase === "playing" ? (
            <>
              <img className="sr-stage" key={FRAMES[frame].src} src={FRAMES[frame].src} alt="" />
              <p className="sr-caption">{FRAMES[frame].text}</p>
            </>
          ) : (
            <div className="sr-intro-copy">
              <p className="sr-dev">॥ श्री सीतारामचन्द्राभ्यां नमः ॥</p>
              <h2>A sacred beginning</h2>
              <p>Where love blossoms with divine blessings</p>
              <button ref={lotusRef} className="sr-lotus" type="button" aria-label="Tap the lotus to open the invitation" onClick={begin}>
                <img src={`${ART}/lotus.webp`} alt="" />
              </button>
              <p className="sr-kicker">Tap the lotus to begin</p>
            </div>
          )}
        </div>
      ) : null}

      {openPhoto && photos[photo] ? (
        <div className="sr-lightbox" role="dialog" aria-modal="true" aria-label="Gallery photograph" onClick={(event) => { if (event.target === event.currentTarget) setOpenPhoto(false); }}>
          <button type="button" aria-label="Close photo" onClick={() => setOpenPhoto(false)}>✕</button>
          <img src={photos[photo]} alt="" />
        </div>
      ) : null}
    </div>
  );
}
