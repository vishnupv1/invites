import { useEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./marble.css";

const ART = "/marble";

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "awakening" | "reveal" | "open";

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

export function MarbleInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Cormorant Garamond", "DM Sans");
  const pack = packOf("marble", fields.lines);
  const couple = coupleOf(fields.names || "Aarav & Meera");
  const longDate = formatLongDate(fields.date);
  const stamp = heroDate(fields.date);
  const scrollRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const lotusRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
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
        { title: "Wedding ceremony", time: formatTime(fields.time), text: [fields.venue, fields.address].filter(Boolean).join(", "), note: fields.dress, kick: longDate },
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
    const nodes = [...root.querySelectorAll<HTMLElement>(".mp-reveal")];
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

  function finish() {
    clearTimers();
    setPhase("open");
  }

  function begin() {
    if (phase !== "closed") return;
    if (quiet || prefersReducedMotion()) {
      finish();
      return;
    }
    setPhase("awakening");
    timers.current = [
      window.setTimeout(() => setPhase("reveal"), 1800),
      window.setTimeout(() => {
        timers.current = [];
        setPhase("open");
      }, 5800),
    ];
  }

  function replay() {
    clearTimers();
    setPhase("closed");
    scrollRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    lotusRef.current?.focus({ preventScroll: true });
  }

  function enterInvite() {
    introRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
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
    if (yes && (guests < 1 || guests > 10)) {
      setError("Please enter a guest count between 1 and 10.");
      return;
    }
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

  return (
    <div className={`mp${quiet ? " is-quiet" : ""}`}>
      <div className="mp-scroll" ref={scrollRef}>
        <section className={`mp-hero is-${phase}`} aria-labelledby="mp-title">
          <div className="mp-grain" />
          <p className="mp-kicker mp-hero-brand">The Marble Promise</p>
          <p className="mp-sub">A love written in marble</p>
          <button
            ref={lotusRef}
            className="mp-lotus"
            type="button"
            aria-label="Touch the marble lotus to open the wedding invitation"
            disabled={phase !== "closed"}
            onClick={begin}
          >
            <img className="mp-lotus-closed" src={`${ART}/lotus-closed.webp`} alt="" />
            <img className="mp-lotus-open" src={`${ART}/lotus-open.webp`} alt="" />
          </button>
          <p className="mp-touch">Touch the lotus to begin</p>
          <div className="mp-palace" aria-hidden="true">
            <img src={`${ART}/taj-palace.webp`} alt="" />
          </div>
          <div className="mp-royal" aria-hidden="true">
            <img src={`${ART}/royal-wedding.webp`} alt="" />
          </div>
          <div className="mp-hero-title" aria-hidden={phase !== "open"}>
            <p className="mp-kicker">{fields.hosts || "Together with their families"}</p>
            <h1 id="mp-title">
              {couple.left}
              {couple.right ? <> <em>&</em> {couple.right}</> : null}
            </h1>
            <p className="mp-hero-date">{stamp}</p>
            <button className="mp-text" type="button" disabled={phase !== "open"} onClick={enterInvite}>Explore our invitation ↓</button>
          </div>
          {phase === "awakening" || phase === "reveal" ? (
            <button className="mp-skip" type="button" onClick={finish}>Skip animation</button>
          ) : null}
        </section>

        <section className="mp-section mp-intro" id="mp-welcome" ref={introRef} tabIndex={-1}>
          <div className="mp-reveal">
            <p className="mp-kicker">An invitation to forever</p>
            <img className="mp-divider" src={`${ART}/floral-divider.webp`} alt="" />
            <h2>{fields.title || "Two hearts, one timeless promise."}</h2>
            <p className="mp-lead">{fields.message || "With the blessings of our families, we invite you to celebrate our wedding."}</p>
            <p className="mp-names">
              {couple.left}
              {couple.right ? <> <em>&</em> {couple.right}</> : null}
            </p>
            <p className="mp-kicker">{stamp}</p>
          </div>
          <img className="mp-corner" src={`${ART}/floral-corner.webp`} alt="" />
        </section>

        <section className="mp-section mp-story">
          <img className="mp-portrait mp-reveal" src={`${ART}/royal-portrait.webp`} alt="An artistic interpretation of a royal couple beneath a marble arch" />
          <div className="mp-reveal">
            <p className="mp-kicker">A love that inspired eternity</p>
            <h2>A story remembered in stone.</h2>
            <p>Inspired by the enduring story of Shah Jahan and Mumtaz Mahal, and by the marble artistry of the Taj Mahal, we celebrate a love of our own.</p>
            <p className="mp-fine">The royal artwork is an imaginative historical interpretation.</p>
          </div>
        </section>

        <section className="mp-section mp-events">
          <div className="mp-reveal">
            <p className="mp-kicker">The royal celebrations</p>
            <h2>Days to cherish, moments to remember.</h2>
            <div className="mp-cards">
              {programme.map((item, index) => (
                <article className="mp-card" key={`${item.title}-${index}`}>
                  <p className="mp-kicker">{item.kick}</p>
                  <h3>{item.title}</h3>
                  {item.time ? <p>{item.time}</p> : null}
                  {item.text ? <p>{item.text}</p> : null}
                  {item.note ? <p className="mp-fine">{item.note}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        {photos.length ? (
          <section className="mp-section mp-gallery">
            <div className="mp-reveal">
              <p className="mp-kicker">Portraits of love</p>
              <h2>Our story, in frames.</h2>
              <div className="mp-viewer">
                <button type="button" aria-label="Previous image" onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}>‹</button>
                <figure>
                  <button type="button" className="mp-shot" onClick={() => setOpenPhoto(true)} aria-label={`View photo ${photo + 1}`}>
                    <img src={photos[photo]} alt="" />
                  </button>
                </figure>
                <button type="button" aria-label="Next image" onClick={() => setPhoto((photo + 1) % photos.length)}>›</button>
              </div>
              <div className="mp-thumbs">
                {photos.map((src, index) => (
                  <button key={src} type="button" aria-label={`Show image ${index + 1}`} aria-current={index === photo} onClick={() => setPhoto(index)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mp-section mp-count">
          <div className="mp-reveal">
            <p className="mp-kicker">Until our forever</p>
            <h2>Every moment brings us closer.</h2>
            <div className="mp-clock">
              <img src={`${ART}/countdown-medallion.webp`} alt="" />
              <div className="mp-digits" role="timer" aria-label="Countdown to the wedding">
                {["Days", "Hours", "Min", "Sec"].map((label, index) => (
                  <div key={label}>
                    <strong>{String(units[index]).padStart(2, "0")}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mp-fine">{remaining <= 0 ? "Our celebration has begun." : "Counting the days until we celebrate."}</p>
          </div>
        </section>

        <section className="mp-section mp-venue">
          <div className="mp-reveal">
            <p className="mp-kicker">The royal destination</p>
            <h2>Where forever begins.</h2>
            <img className="mp-destination" src={`${ART}/taj-silhouette.webp`} alt="" />
            <div className="mp-panel">
              <p className="mp-kicker">We await your presence at</p>
              <h3>{fields.venue || "The wedding venue"}</h3>
              {fields.address ? <p>{fields.address}</p> : null}
              <p>{[longDate, formatTime(fields.time)].filter(Boolean).join(" · ")}</p>
              {fields.dress ? <p className="mp-fine">{fields.dress}</p> : null}
              <div className="mp-actions">
                {maps ? <a className="mp-btn is-fill" href={maps} target="_blank" rel="noopener noreferrer">Get directions ↗</a> : null}
                {calendar ? <a className="mp-btn" href={calendar} target="_blank" rel="noopener noreferrer">Add to calendar ↓</a> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mp-section mp-reply">
          <div className="mp-reveal">
            <img className="mp-emblem" src={`${ART}/eternal-emblem.webp`} alt="" />
            <p className="mp-kicker">Your presence, our joy</p>
            <h2>Kindly grace our celebration.</h2>
            <div className="mp-rsvp">
              {sent ? (
                <div className="mp-thanks">
                  <img src={`${ART}/eternal-emblem.webp`} alt="" />
                  <h3>{attend === "yes" ? `With joy, ${name.trim()}.` : `Thank you, ${name.trim()}.`}</h3>
                  <p>{attend === "yes" ? `We look forward to celebrating with you.` : `Thank you for letting us know.`}</p>
                  <button className="mp-btn" type="button" onClick={() => setSent(false)}>Edit response</button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <label className="mp-field" htmlFor="mp-name">
                    <span>Your full name</span>
                    <input id="mp-name" value={name} maxLength={100} required autoComplete="name" placeholder="Your full name" onChange={(event) => setName(event.target.value)} />
                  </label>
                  <fieldset>
                    <legend>Will you attend?</legend>
                    <div className="mp-choice">
                      <label className={attend === "yes" ? "is-on" : ""}>
                        <input type="radio" name="mp-attend" checked={attend === "yes"} onChange={() => setAttend("yes")} />
                        <span>Joyfully accept</span>
                      </label>
                      <label className={attend === "no" ? "is-on" : ""}>
                        <input type="radio" name="mp-attend" checked={attend === "no"} onChange={() => setAttend("no")} />
                        <span>Regretfully decline</span>
                      </label>
                    </div>
                  </fieldset>
                  {attend === "yes" ? (
                    <>
                      <label className="mp-field" htmlFor="mp-guests">
                        <span>Number of guests</span>
                        <select id="mp-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                            <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                          ))}
                        </select>
                      </label>
                      <fieldset>
                        <legend>Celebrations you will attend</legend>
                        <div className="mp-picks">
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
                  <label className="mp-field" htmlFor="mp-note">
                    <span>A message for the couple</span>
                    <textarea id="mp-note" rows={4} maxLength={600} placeholder="Your warm wishes..." value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <p className="mp-error" role="alert">{error}</p>
                  <button className="mp-send" type="submit">Send my response</button>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="mp-foot">
          <img src={`${ART}/eternal-emblem.webp`} alt="" />
          <p className="mp-kicker">An eternal promise</p>
          <h2>
            {couple.left}
            {couple.right ? <> <em>&</em> {couple.right}</> : null}
          </h2>
          <p>With love, gratitude, and a lifetime of memories ahead.</p>
          <button className="mp-btn" type="button" onClick={replay}>Replay the marble lotus ↺</button>
          <a className="mp-made" href={madeWithHref("marble")}>Made with InvitesReady</a>
        </footer>
      </div>

      {openPhoto && photos[photo] ? (
        <div className="mp-lightbox" role="dialog" aria-modal="true" aria-label="Gallery photograph" onClick={(event) => { if (event.target === event.currentTarget) setOpenPhoto(false); }}>
          <button className="mp-lightbox-close" type="button" aria-label="Close photo" onClick={() => setOpenPhoto(false)}>✕</button>
          <button type="button" aria-label="Previous photo" onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}>←</button>
          <img src={photos[photo]} alt="" />
          <button type="button" aria-label="Next photo" onClick={() => setPhoto((photo + 1) % photos.length)}>→</button>
        </div>
      ) : null}
    </div>
  );
}
