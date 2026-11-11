import { useEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./raas.css";

const ART = "/raas";

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "painting" | "open";

function coupleOf(names: string) {
  const [left, right] = names.split(/\s*&\s*/);
  return { left: (left || names).trim(), right: (right || "").trim() };
}

function dateParts(iso: string) {
  const date = new Date(`${iso || "2027-12-12"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "", day: "", year: "" };
  return {
    month: date.toLocaleDateString("en-US", { month: "long" }),
    day: String(date.getDate()),
    year: `${date.getFullYear()} · ${date.toLocaleDateString("en-US", { weekday: "long" })}`,
  };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RaasInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Cormorant Garamond", "DM Sans");
  const pack = packOf("raas", fields.lines);
  const couple = coupleOf(fields.names || "Aarav & Meera");
  const when = dateParts(fields.date);
  const longDate = formatLongDate(fields.date);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const featherRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);
  const [status, setStatus] = useState("A divine love story awaits");

  const programme = pack.programme?.length
    ? pack.programme
    : [
        { title: "Wedding ceremony", time: formatTime(fields.time), text: [fields.venue, fields.address].filter(Boolean).join(", "), note: fields.dress, kick: longDate },
      ];
  const [picked, setPicked] = useState<string[]>(() => programme.map((item) => item.title));
  const photos = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : "")).filter(Boolean);
  const fan = photos.slice(0, 3);
  const mapsQuery = [fields.venue, fields.address].filter(Boolean).join(", ");
  const maps = mapsQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}` : "";
  const calendar = calendarUrl(fields);
  const target = new Date(`${fields.date || "2027-12-12"}T${fields.time || "18:30"}:00+05:30`).getTime();
  const remaining = Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const units = [
    Math.floor(remaining / 86400000),
    Math.floor(remaining / 3600000) % 24,
    Math.floor(remaining / 60000) % 60,
    Math.floor(remaining / 1000) % 60,
  ];
  const place = [fields.address, fields.venue].filter(Boolean).join(" · ");

  useEffect(() => {
    if (quiet) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quiet]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(".er-reveal")];
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
    }, { root, threshold: 0.28 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [quiet, photos.length, programme.length]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    if (photo === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPhoto(null);
      if (event.key === "ArrowLeft") setPhoto((current) => (current === null ? current : (current + photos.length - 1) % photos.length));
      if (event.key === "ArrowRight") setPhoto((current) => (current === null ? current : (current + 1) % photos.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, photos.length]);

  function open() {
    if (phase !== "closed") return;
    if (quiet || prefersReducedMotion()) {
      setPhase("open");
      setStatus("The invitation is open");
      return;
    }
    setPhase("painting");
    setStatus("The canvas awakens");
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPhase("open");
      setStatus("The invitation is open");
    }, 7000);
  }

  function replay() {
    if (timer.current) window.clearTimeout(timer.current);
    setPhase("closed");
    setStatus("A divine love story awaits");
    scrollRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    featherRef.current?.focus({ preventScroll: true });
  }

  function toggleEvent(title: string) {
    setPicked((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    const yes = attend === "yes";
    if (yes && (guests < 1 || guests > 10)) {
      setError("Please enter a guest count between 1 and 10.");
      return;
    }
    if (yes && !picked.length) {
      setError("Please select at least one celebration.");
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
    <div className={`er${quiet ? " is-quiet" : ""}`}>
      <div className="er-scroll" ref={scrollRef}>
        <section className={`er-hero is-${phase}`} aria-labelledby="er-title">
          <div className="er-grain" />
          <div className="er-art" aria-hidden="true">
            <img className="er-stroke is-blue" src={`${ART}/stroke-blue.webp`} alt="" />
            <img className="er-stroke is-pink" src={`${ART}/stroke-pink.webp`} alt="" />
            <img className="er-master" src={`${ART}/masterpiece.webp`} alt="" />
          </div>
          <div className="er-hero-title">
            <p className="er-eyebrow">With love & blessings</p>
            <h1 id="er-title">{couple.left}{couple.right ? <> <span>&</span> {couple.right}</> : null}</h1>
            <p>{[longDate, fields.address || fields.venue].filter(Boolean).join(" · ")}</p>
            <button className="er-scroll-link" type="button" onClick={() => storyRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" })}>
              Discover our story ↓
            </button>
          </div>
          <div className="er-open">
            <p className="er-eyebrow">A love painted in eternity</p>
            <button ref={featherRef} className="er-feather" type="button" aria-label="Touch the peacock feather to open the invitation" disabled={phase !== "closed"} onClick={open}>
              <img src={`${ART}/feather.webp`} alt="" />
              <span>Touch the feather to begin</span>
            </button>
            <p className="er-status" aria-live="polite">{status}</p>
          </div>
        </section>

        <section className="er-section is-ivory" id="er-story" ref={storyRef}>
          <div className="er-split">
            <div className="er-reveal">
              <p className="er-eyebrow is-dark">A love beyond time</p>
              <h2>Two hearts.<br /><em>One beautiful forever.</em></h2>
              {fields.hosts ? <p className="er-hosts">{fields.hosts}</p> : null}
              <p>{fields.message || "With the blessings of our families and the grace of Radha and Krishna, we invite you to celebrate the beginning of our forever."}</p>
              <div className="er-date">
                <span>{when.month}</span>
                <strong>{when.day}</strong>
                <span>{when.year}</span>
              </div>
              <p className="er-muted">{[fields.names, place].filter(Boolean).join(" · ")}</p>
            </div>
            <img className="er-flute er-reveal" src={`${ART}/flute.webp`} alt="" />
          </div>
        </section>

        <section className="er-section is-night er-center">
          <div className="er-reveal">
            <p className="er-eyebrow">Celebrate with us</p>
            <h2>Days of <em>color & joy</em></h2>
            <p className="er-intro">Every celebration is another brushstroke in our story.</p>
            <div className="er-events">
              {programme.map((item, index) => (
                <article className="er-card" key={`${item.title}-${index}`}>
                  <img src={`${ART}/${index % 2 ? "floral.webp" : "divider.webp"}`} alt="" />
                  <p className="er-eyebrow">Celebration {String(index + 1).padStart(2, "0")}</p>
                  <h3>{item.title}</h3>
                  <p>{[item.kick, item.time, item.text].filter(Boolean).join(" · ")}</p>
                  {item.note ? <small>{item.note}</small> : null}
                </article>
              ))}
            </div>
            <img className="er-divider" src={`${ART}/divider.webp`} alt="" />
          </div>
        </section>

        <section className="er-section is-ivory er-center">
          <img className="er-corner" src={`${ART}/corner.webp`} alt="" />
          <div className="er-reveal">
            <p className="er-eyebrow is-dark">Little moments</p>
            <h2>Our story, <em>in colors</em></h2>
            <p className="er-intro">A few favorite frames from the journey that brought us here.</p>
            <div className="er-fan" aria-label="Couple photo gallery">
              {(fan.length ? fan : ["", "", ""]).map((src, index) => (
                <button
                  key={src || `empty-${index}`}
                  className="er-polaroid"
                  type="button"
                  style={{ ["--rot" as string]: `${[-8, 2, 8][index] ?? 0}deg` }}
                  disabled={!src}
                  aria-label={src ? `View photo ${index + 1}` : "Photo placeholder"}
                  onClick={() => src && setPhoto(index)}
                >
                  {src ? <img src={src} alt="" /> : <span>✦</span>}
                </button>
              ))}
            </div>
            <p className="er-muted">{photos.length ? "Tap a photograph to see it larger." : "Photographs are added by the couple."}</p>
          </div>
        </section>

        <section className="er-section is-night er-center">
          <div className="er-reveal">
            <p className="er-eyebrow">Until our forever</p>
            <h2>Every moment <em>brings us closer</em></h2>
            <div className="er-ring">
              <img src={`${ART}/ring.webp`} alt="" />
              <div className="er-clock" role="timer" aria-label="Countdown to the wedding">
                {["Days", "Hours", "Min", "Sec"].map((label, index) => (
                  <div key={label}>
                    <strong>{String(units[index]).padStart(2, "0")}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </div>
            <p className="er-clock-label">{remaining <= 0 ? "The celebration is here." : "Counting down to the celebration"}</p>
          </div>
        </section>

        <section className="er-section is-ivory">
          <div className="er-split">
            <div className="er-reveal">
              <p className="er-eyebrow is-dark">Where our journeys meet</p>
              <h2>Find us <em>there</em></h2>
              <h3>{fields.venue || "The wedding venue"}</h3>
              {fields.address ? <p>{fields.address}</p> : null}
              <p>{[longDate, formatTime(fields.time)].filter(Boolean).join(" · ")}</p>
              <div className="er-actions">
                {maps ? <a className="er-btn is-fill" href={maps} target="_blank" rel="noopener noreferrer">Get directions ↗</a> : null}
                {calendar ? <a className="er-btn" href={calendar} target="_blank" rel="noopener noreferrer">Add to calendar ↓</a> : null}
              </div>
            </div>
            <img className="er-flute er-reveal" src={`${ART}/flute.webp`} alt="" />
          </div>
        </section>

        <section className="er-section is-sand er-center er-reply">
          <img className="er-reply-feather" src={`${ART}/corner.webp`} alt="" />
          <div className="er-reveal">
            <img className="er-reply-mark" src={`${ART}/emblem.webp`} alt="" />
            <p className="er-eyebrow is-dark">A place at our celebration</p>
            <h2>Be part of <em>our story</em></h2>
            <p className="er-intro">Kindly let us know if you will celebrate with us.</p>
            <div className="er-rsvp">
              {sent ? (
                <div className="er-thanks">
                  <img src={`${ART}/emblem.webp`} alt="" />
                  <h3>{attend === "yes" ? `We cannot wait to see you, ${name.trim()}.` : `Thank you for letting us know, ${name.trim()}.`}</h3>
                  <p>Your reply is with {couple.left}{couple.right ? ` and ${couple.right}` : ""}.</p>
                  <button className="er-btn" type="button" onClick={() => setSent(false)}>Edit response</button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <label className="er-field" htmlFor="er-name">
                    <span>Your full name</span>
                    <input id="er-name" value={name} maxLength={100} required placeholder="Write your name" autoComplete="name" onChange={(event) => setName(event.target.value)} />
                  </label>
                  <fieldset>
                    <legend>Will you be attending?</legend>
                    <div className="er-choice">
                      <label className={attend === "yes" ? "is-on" : ""}>
                        <input type="radio" name="er-attend" checked={attend === "yes"} onChange={() => setAttend("yes")} />
                        <span>Joyfully accepts</span>
                      </label>
                      <label className={attend === "no" ? "is-on" : ""}>
                        <input type="radio" name="er-attend" checked={attend === "no"} onChange={() => setAttend("no")} />
                        <span>Regretfully declines</span>
                      </label>
                    </div>
                  </fieldset>
                  {attend === "yes" ? (
                    <>
                      <label className="er-field" htmlFor="er-guests">
                        <span>Guests, including you</span>
                        <select id="er-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                            <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                          ))}
                        </select>
                      </label>
                      <fieldset>
                        <legend>Celebrations you will attend</legend>
                        <div className="er-events-pick">
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
                  <label className="er-field" htmlFor="er-note">
                    <span>A note for the couple</span>
                    <textarea id="er-note" rows={3} maxLength={1000} placeholder="Share a wish..." value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <p className="er-error" role="alert">{error}</p>
                  <button className="er-send" type="submit">Confirm response</button>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="er-foot er-center">
          <img src={`${ART}/emblem.webp`} alt="" />
          <p className="er-eyebrow">Forever in every color</p>
          <h2>{couple.left}{couple.right ? <> <em>&</em> {couple.right}</> : null}</h2>
          <p>With love, gratitude, and the blessings of our families.</p>
          <button className="er-btn is-light" type="button" onClick={replay}>Replay our story ↺</button>
          <a className="er-made" href={madeWithHref("raas")}>Made with InvitesReady</a>
        </footer>
      </div>

      {photo !== null && photos[photo] ? (
        <div className="er-lightbox" role="dialog" aria-modal="true" aria-label="Gallery photograph" onClick={(event) => { if (event.target === event.currentTarget) setPhoto(null); }}>
          <button className="er-lightbox-close" type="button" aria-label="Close photo" onClick={() => setPhoto(null)}>✕</button>
          <button type="button" aria-label="Previous photo" onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}>←</button>
          <img src={photos[photo]} alt="" />
          <button type="button" aria-label="Next photo" onClick={() => setPhoto((photo + 1) % photos.length)}>→</button>
        </div>
      ) : null}
    </div>
  );
}
