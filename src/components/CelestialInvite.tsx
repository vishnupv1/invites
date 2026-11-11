import { useEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./celestial.css";

const ART = "/celestial";

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "go" | "open";

function coupleOf(names: string) {
  const [left, right] = names.split(/\s*&\s*/);
  return { left: (left || names).trim(), right: (right || "").trim() };
}

function shortDate(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "Save the date";
  return `${day} · ${month} · ${year}`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CelestialInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Cormorant Garamond", "DM Sans");
  const pack = packOf("celestial", fields.lines);
  const couple = coupleOf(fields.names || "Avery & Rowan");
  const longDate = formatLongDate(fields.date);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const starRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [picked, setPicked] = useState<string[]>(["Wedding ceremony"]);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState<number | null>(null);

  const programme = pack.programme?.length
    ? pack.programme
    : [
        { title: "Wedding ceremony", time: formatTime(fields.time), text: [fields.venue, fields.address].filter(Boolean).join(", "), note: fields.dress, kick: longDate },
        { title: "Reception", time: formatTime(fields.receptionTime), text: [fields.receptionVenue || fields.venue, fields.receptionAddress || fields.address].filter(Boolean).join(", "), note: "", kick: longDate },
      ].filter((item) => item.title);
  const photos = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : "")).filter(Boolean);
  const fan = photos.length ? photos.slice(0, 3) : [];
  const mapsQuery = [fields.venue, fields.address].filter(Boolean).join(", ");
  const maps = mapsQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}` : "";
  const calendar = calendarUrl(fields);
  const target = new Date(`${fields.date || "2026-12-12"}T${fields.time || "17:00"}:00+05:30`).getTime();
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
    const nodes = [...root.querySelectorAll<HTMLElement>(".cv-reveal")];
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
      return;
    }
    setPhase("go");
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPhase("open");
    }, 6500);
  }

  function replay() {
    if (timer.current) window.clearTimeout(timer.current);
    setPhase("closed");
    scrollRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    starRef.current?.focus({ preventScroll: true });
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
      setError("Please select at least one event.");
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
    <div className={`cv${quiet ? " is-quiet" : ""}`} ref={rootRef}>
      <div className="cv-scroll" ref={scrollRef}>
        <section className={`cv-hero phase-${phase}`} aria-label="Celestial wedding invitation opening">
          <div className="cv-sky" />
          <div className="cv-hero-inner">
            <p className="cv-eyebrow cv-hero-top">A love written in the stars</p>
            <div className="cv-orbit" />
            <img className="cv-constellation is-a" src={`${ART}/constellation-a.webp`} alt="" />
            <img className="cv-constellation is-b" src={`${ART}/constellation-b.webp`} alt="" />
            <svg className="cv-infinity" viewBox="0 0 1000 700" aria-hidden="true">
              <path d="M 220 350 C 280 160 430 160 500 350 C 570 540 720 540 780 350 C 720 160 570 160 500 350 C 430 540 280 540 220 350" />
            </svg>
            <img className="cv-eclipse" src={`${ART}/moon.webp`} alt="" />
            <img className="cv-frame" src={`${ART}/frame.webp`} alt="" />
            <button
              ref={starRef}
              className="cv-star"
              type="button"
              aria-label="Tap the North Star to open the invitation"
              disabled={phase !== "closed"}
              onClick={open}
            >
              <img src={`${ART}/star.webp`} alt="" />
            </button>
            <p className="cv-tap">Tap the North Star ✦</p>
            <div className="cv-names">
              <p className="cv-eyebrow">Together under one sky</p>
              <h1>{couple.left}{couple.right ? <> <span className="cv-gold">&</span> {couple.right}</> : null}</h1>
              <p className="cv-date">{shortDate(fields.date)}</p>
              <p className="cv-lead">{fields.title || "Our forever begins here"}</p>
            </div>
            <button className="cv-cue" type="button" tabIndex={phase === "open" ? 0 : -1} onClick={() => storyRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" })}>
              Discover our story <span aria-hidden="true">↓</span>
            </button>
          </div>
        </section>

        <section className="cv-section" id="cv-story" ref={storyRef}>
          <div className="cv-split">
            <div className="cv-reveal">
              <p className="cv-eyebrow">Written in the stars</p>
              <h2>Some stories are<br /><span className="cv-gold">meant to align.</span></h2>
              {fields.hosts ? <p className="cv-hosts">{fields.hosts}</p> : null}
              <p className="cv-lead">{fields.message || "Across all the skies and all the seasons, we found our way to each other."}</p>
              <p className="cv-copy">With full hearts and the people we love beside us, we invite you to celebrate the beginning of our forever.</p>
              {longDate ? <p className="cv-eyebrow">{longDate}</p> : null}
            </div>
            <div className="cv-reveal">
              <img className="cv-moon" src={`${ART}/moon.webp`} alt="" />
            </div>
          </div>
        </section>

        <section className="cv-section cv-center">
          <div className="cv-reveal">
            <p className="cv-eyebrow">Our days of celebration</p>
            <h2>Under one beautiful sky</h2>
            <p className="cv-intro">A few extraordinary moments, shared with our favorite people.</p>
            <div className="cv-events">
              {programme.map((item, index) => (
                <article className="cv-card" key={`${item.title}-${index}`}>
                  <div className="cv-number">{String(index + 1).padStart(2, "0")}</div>
                  <h3>{item.title}</h3>
                  <p>{[item.kick, item.time, item.text, item.note].filter(Boolean).join(" · ")}</p>
                </article>
              ))}
            </div>
            <img className="cv-divider" src={`${ART}/divider.webp`} alt="" />
          </div>
        </section>

        <section className="cv-section cv-center cv-gallery">
          <div className="cv-reveal">
            <p className="cv-eyebrow">Little moments, infinite love</p>
            <h2>Us, so far</h2>
            <p className="cv-intro">Every photograph holds a little piece of our universe.</p>
            <div className="cv-fan" aria-label="Our photo gallery">
              {(fan.length ? fan : [ "", "", "" ]).map((src, index) => (
                <button
                  key={src || `empty-${index}`}
                  className="cv-polaroid"
                  type="button"
                  disabled={!src}
                  aria-label={src ? `View photo ${index + 1}` : "Photo placeholder"}
                  onClick={() => src && setPhoto(index)}
                >
                  {src ? <img src={src} alt="" /> : <span className="cv-placeholder">Your moment here ✦</span>}
                </button>
              ))}
            </div>
            <p className="cv-note">{photos.length ? "Tap a photograph to see it larger." : "Photographs are added by the couple."}</p>
          </div>
        </section>

        <section className="cv-section cv-center">
          <div className="cv-reveal">
            <p className="cv-eyebrow">Until our stars align</p>
            <h2>The moments until forever</h2>
            <div className="cv-dial-wrap">
              <img className="cv-dial" src={`${ART}/dial.webp`} alt="" />
              <div className="cv-counter" role="timer" aria-label="Time until the wedding">
                {["Days", "Hours", "Minutes", "Seconds"].map((label, index) => (
                  <div key={label}>
                    <strong>{String(units[index]).padStart(2, "0")}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </div>
            <p className="cv-lead">{remaining <= 0 ? "The day we have been waiting for is here." : "Every second brings us closer."}</p>
          </div>
        </section>

        <section className="cv-section cv-center">
          <div className="cv-reveal">
            <p className="cv-eyebrow">Where our worlds meet</p>
            <h2>Find your way to us</h2>
            <div className="cv-venue">
              <p className="cv-eyebrow">The wedding ceremony</p>
              <h3>{fields.venue || "The wedding venue"}</h3>
              {fields.address ? <p>{fields.address}</p> : null}
              <p>{[longDate, formatTime(fields.time)].filter(Boolean).join(" · ")}</p>
              <div className="cv-actions">
                {maps ? <a className="cv-btn is-fill" href={maps} target="_blank" rel="noopener noreferrer">Get directions ↗</a> : null}
                {calendar ? <a className="cv-btn" href={calendar} target="_blank" rel="noopener noreferrer">Add to calendar ↓</a> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="cv-section cv-center">
          <img className="cv-corner" src={`${ART}/corner.webp`} alt="" />
          <div className="cv-reveal">
            <p className="cv-eyebrow">A place among our stars</p>
            <h2>Will you join our universe?</h2>
            <p className="cv-intro">We would be honored to celebrate with you.</p>
            <div className="cv-rsvp">
              {sent ? (
                <div className="cv-success">
                  <h3>{attend === "yes" ? `We cannot wait to see you, ${name.trim()}.` : `Thank you for letting us know, ${name.trim()}.`}</h3>
                  <p>Your reply is with {couple.left}{couple.right ? ` and ${couple.right}` : ""}.</p>
                  <button className="cv-btn" type="button" onClick={() => setSent(false)}>Edit response</button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="cv-field">
                    <label htmlFor="cv-name">Your name *</label>
                    <input id="cv-name" value={name} maxLength={100} required placeholder="Full name" autoComplete="name" onChange={(event) => setName(event.target.value)} />
                  </div>
                  <fieldset className="cv-field">
                    <legend>Will you attend? *</legend>
                    <div className="cv-chips">
                      <label className="cv-chip"><input type="radio" name="cv-attend" checked={attend === "yes"} onChange={() => setAttend("yes")} /><span>Joyfully accepts</span></label>
                      <label className="cv-chip"><input type="radio" name="cv-attend" checked={attend === "no"} onChange={() => setAttend("no")} /><span>Regretfully declines</span></label>
                    </div>
                  </fieldset>
                  {attend === "yes" ? (
                    <>
                      <div className="cv-field">
                        <label htmlFor="cv-guests">Number of guests (1–10)</label>
                        <input id="cv-guests" type="number" min={1} max={10} value={guests} inputMode="numeric" onChange={(event) => setGuests(Number(event.target.value))} />
                      </div>
                      <fieldset className="cv-field">
                        <legend>Events you will attend</legend>
                        <div className="cv-chips">
                          {programme.map((item) => (
                            <label className="cv-chip" key={item.title}>
                              <input type="checkbox" checked={picked.includes(item.title)} onChange={() => toggleEvent(item.title)} />
                              <span>{item.title}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  ) : null}
                  <div className="cv-field">
                    <label htmlFor="cv-note">A note for the couple</label>
                    <textarea id="cv-note" maxLength={600} placeholder="Share a little love..." value={note} onChange={(event) => setNote(event.target.value)} />
                  </div>
                  <p className="cv-form-note" role="status">{error}</p>
                  <button className="cv-btn is-fill" type="submit">Confirm my response ✦</button>
                </form>
              )}
            </div>
          </div>
        </section>

        <footer className="cv-section cv-center cv-foot">
          <div className="cv-reveal is-in">
            <img className="cv-emblem" src={`${ART}/emblem.webp`} alt="" />
            <p className="cv-eyebrow">Forever, among the stars</p>
            <h2>{couple.left}{couple.right ? <> <span className="cv-gold">&</span> {couple.right}</> : null}</h2>
            <p className="cv-lead">Thank you for being part of our universe.</p>
            <button className="cv-btn" type="button" onClick={replay}>Replay our story ↻</button>
            <a className="cv-made" href={madeWithHref("celestial")}>Made with InvitesReady</a>
          </div>
        </footer>
      </div>

      {photo !== null && photos[photo] ? (
        <div className="cv-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={(event) => { if (event.target === event.currentTarget) setPhoto(null); }}>
          <button className="cv-lightbox-close" type="button" aria-label="Close photo viewer" onClick={() => setPhoto(null)}>×</button>
          <button className="cv-lightbox-nav" type="button" aria-label="Previous photo" onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}>‹</button>
          <img src={photos[photo]} alt="" />
          <button className="cv-lightbox-nav" type="button" aria-label="Next photo" onClick={() => setPhoto((photo + 1) % photos.length)}>›</button>
        </div>
      ) : null}
    </div>
  );
}
