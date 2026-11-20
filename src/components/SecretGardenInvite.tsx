import { useEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { InstagramLink } from "./InstagramLink";
import { madeWithHref } from "../lib/share";
import "./secret-garden.css";

const ART = "/secret-garden";
const SAMPLES = [`${ART}/photo-1.webp`, `${ART}/photo-2.webp`, `${ART}/photo-3.webp`];

type Reply = { name: string; note: string; attending: boolean };

function coupleOf(names: string) {
  const [left, right] = names.split(/\s*[&]\s*/);
  return { left: (left || names).trim(), right: (right || "").trim() };
}

function momentOf(fields: InviteFields) {
  const date = new Date(`${fields.date || "2027-10-16"}T${fields.time || "16:00"}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function longDate(value: Date | null) {
  if (!value) return "";
  return value.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function replyDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function clockParts(when: Date | null, now: number) {
  const remaining = when ? Math.max(0, Math.floor((when.getTime() - now) / 1000)) : 0;
  return [
    [Math.floor(remaining / 86400), "Days"],
    [Math.floor(remaining / 3600) % 24, "Hours"],
    [Math.floor(remaining / 60) % 60, "Mins"],
    [remaining % 60, "Secs"],
  ] as const;
}

function downloadCalendar(when: Date, names: string, place: string) {
  const end = new Date(when.getTime() + 7 * 60 * 60 * 1000);
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const data = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//InvitesReady//Secret Garden//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(when)}@invitesready.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(when)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${names} wedding`,
    `LOCATION:${place.replace(/,/g, "\\,")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([data], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding.ics";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SecretGardenInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  const couple = coupleOf(fields.names || "Amelia & Oliver");
  const names = [couple.left, couple.right].filter(Boolean).join(" & ");
  const when = momentOf(fields);
  const place = [fields.venue, fields.address].filter(Boolean).join(", ") || "Royal Botanic Gardens, Kew, London";
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
  const pack = packOf("secretgarden", fields.lines);
  const programme = pack.programme ?? [];
  const faqs = (pack.faqs ?? []).map((item) =>
    /wear/i.test(item.q) && fields.dress ? { ...item, a: `${fields.dress}. Comfortable shoes are encouraged.` } : item,
  );
  const uploaded = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : "")).filter(Boolean);
  const photos = uploaded.length ? uploaded : SAMPLES;
  const [phase, setPhase] = useState<"closed" | "opening" | "open">(quiet ? "open" : "closed");
  const [still, setStill] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const vineRef = useRef<SVGPathElement>(null);
  const blossomRef = useRef<SVGGElement>(null);
  const vineSvgRef = useRef<SVGSVGElement>(null);
  const carRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "opening") return;
    const reduced = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setPhase("open"), reduced ? 0 : 2000);
    return () => window.clearTimeout(id);
  }, [phase, still]);

  useEffect(() => {
    const root = rootRef.current;
    const main = mainRef.current;
    const path = vineRef.current;
    const blossom = blossomRef.current;
    const svg = vineSvgRef.current;
    if (!root || !main || !path || !blossom || !svg || phase !== "open") return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let length = 0;

    function trace() {
      const width = main?.clientWidth ?? 0;
      const height = main?.scrollHeight ?? 0;
      if (!path || !svg || width < 1 || height < 1) return 0;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const left = Math.max(18, width * 0.08);
      const sway = Math.min(42, width * 0.1);
      const wave = 260;
      const steps = Math.max(2, Math.ceil(height / wave));
      let d = "";
      for (let index = 0; index <= steps; index += 1) {
        const y = (height * index) / steps;
        const x = left + sway + Math.sin((index * Math.PI) / 2) * sway;
        if (index === 0) {
          d = `M ${x} ${y}`;
          continue;
        }
        const y0 = (height * (index - 1)) / steps;
        const x0 = left + sway + Math.sin(((index - 1) * Math.PI) / 2) * sway;
        const mid = (y0 + y) / 2;
        d += ` C ${x0} ${mid}, ${x} ${mid}, ${x} ${y}`;
      }
      path.setAttribute("d", d);
      length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      return length;
    }

    function grow() {
      if (!root || !path || !blossom || !length) return;
      const full = still || quiet || motion.matches;
      const room = Math.max(1, root.scrollHeight - root.clientHeight);
      const progress = full ? 1 : Math.max(0, Math.min(1, root.scrollTop / room));
      const drawn = length * progress;
      path.style.strokeDashoffset = `${length - drawn}`;
      const point = path.getPointAtLength(Math.max(0, drawn));
      blossom.setAttribute("transform", `translate(${point.x} ${point.y})`);
      blossom.style.opacity = drawn < 2 ? "0" : "1";
    }

    function onResize() {
      trace();
      grow();
    }

    trace();
    grow();
    root.addEventListener("scroll", grow, { passive: true });
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(main);
    return () => {
      root.removeEventListener("scroll", grow);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [phase, quiet, still]);

  useEffect(() => {
    const root = rootRef.current;
    const track = carRef.current;
    if (!root || !track || phase !== "open" || quiet || still) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pending = false;
    function update() {
      pending = false;
      if (!root || !track || motion.matches) return;
      const view = root.getBoundingClientRect();
      const rect = track.getBoundingClientRect();
      const height = view.height || 1;
      const top = rect.top - view.top;
      const progress = Math.max(0, Math.min(1, (height - top) / (height * 0.86 + rect.height * 0.25)));
      track.style.setProperty("--car-y", `${(1 - progress) * (rect.height * 0.69) - progress * 35}px`);
      track.style.setProperty("--car-scale", String(1.05 - progress * 0.55));
      track.style.setProperty("--car-opacity", String(Math.min(1, (1 - progress) * 5 + 0.15)));
    }
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(update);
    }
    schedule();
    root.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      root.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [phase, quiet, still]);

  useEffect(() => {
    if (phase !== "open" || quiet) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase, quiet]);

  function openInvite() {
    if (phase !== "closed") return;
    setPhase("opening");
  }

  function replay() {
    setPhase("closed");
    setSent(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const guest = name.trim();
    if (guest.length < 2) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onReply?.({ name: guest, note: note.trim(), attending: attend === "yes" });
    } catch {
      setError("Unable to save your reply. Please try again.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setSent(true);
  }

  const parts = clockParts(when, now);

  return (
    <div ref={rootRef} className={`sg${phase === "opening" ? " is-opening" : ""}${phase === "open" ? " is-open" : ""}${quiet ? " is-quiet" : ""}${still ? " is-still" : ""}`}>
      {phase !== "open" ? (
        <div className="sg-cover">
          <div className="sg-envelope">
            <div className="sg-fold" />
            <div className="sg-lid">
              <div className="sg-flap" />
            </div>
            <button className="sg-seal" type="button" aria-label="Break the seal" onClick={openInvite}>
              <img src={`${ART}/wax-seal.webp`} alt="" />
            </button>
            <small>An invitation · Tap the seal</small>
          </div>
        </div>
      ) : null}

      <main ref={mainRef}>
        <svg ref={vineSvgRef} className="sg-vine" aria-hidden="true" preserveAspectRatio="none">
          <path ref={vineRef} />
          <g ref={blossomRef} className="sg-blossom">
            <circle cx="0" cy="-3.4" r="2.2" />
            <circle cx="3.2" cy="-1" r="2.2" />
            <circle cx="2" cy="2.8" r="2.2" />
            <circle cx="-2" cy="2.8" r="2.2" />
            <circle cx="-3.2" cy="-1" r="2.2" />
            <circle className="sg-blossom-heart" r="1.7" />
          </g>
        </svg>
        <section className="sg-hero">
          <img className="sg-canopy" src={`${ART}/jasmine-vine.png`} alt="" />
          <img className="sg-chandelier" src={`${ART}/chandelier.webp`} alt="" />
          <img className="sg-curtain is-left" src={`${ART}/curtain-left.webp`} alt="" />
          <img className="sg-curtain is-right" src={`${ART}/curtain-right.webp`} alt="" />
          <div className="sg-hero-inner">
            <div className="sg-eyebrow">{fields.hosts || "Together with their families"}</div>
            <h1>
              {couple.left}
              {couple.right ? <span>&</span> : null}
              {couple.right}
            </h1>
            <p>
              {fields.title || "Invite you to celebrate their wedding"}
              <br />
              {longDate(when)}
            </p>
            <div className="sg-eyebrow">{fields.detail || "A garden celebration"}{fields.address ? ` · ${fields.address}` : ""}</div>
            <a className="sg-scroll" href="#sg-countdown">Scroll to discover ↓</a>
          </div>
        </section>

        <section className="sg-section sg-next" id="sg-countdown">
          <img className="sg-arch" src={`${ART}/archway.webp`} alt="" />
          <div className="sg-wrap">
            <div className="sg-eyebrow">Every moment closer</div>
            <h2>Until our forever</h2>
            <div className="sg-count">
              {parts.map(([value, label]) => (
                <div key={label}>
                  <b>{String(value).padStart(2, "0")}</b>
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <p>{longDate(when)}{when ? ` · ${when.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}` : ""}</p>
          </div>
        </section>

        <section className="sg-section sg-dark">
          <div className="sg-wrap">
            <div className="sg-eyebrow">Where we say I do</div>
            <h2>The venue</h2>
            <div className="sg-venue">
              <img className="sg-urn" src={`${ART}/urn-floral.webp`} alt="" />
              <h3>{fields.venue || "Royal Botanic Gardens, Kew"}</h3>
              <p>{fields.address || "Richmond, London"}</p>
              <a className="sg-action is-primary" href={maps} target="_blank" rel="noopener noreferrer">Get directions</a>
              <button className="sg-action" type="button" onClick={() => when && downloadCalendar(when, names, place)}>Add to calendar</button>
            </div>
          </div>
        </section>

        <img className="sg-floral" src={`${ART}/floral-divider.webp`} alt="" />

        <section className="sg-section">
          <div className="sg-wrap">
            <div className="sg-eyebrow">{longDate(when) || "The wedding day"}</div>
            <h2>Order of the day</h2>
            <div className="sg-timeline">
              {programme.map((item) => (
                <div className="sg-event" key={`${item.time}-${item.title}`}>
                  <small>{item.time}</small>
                  <h3>{item.title}</h3>
                  {item.text ? <p>{item.text}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {photos.length ? (
          <section className="sg-section" style={{ background: "#e9e8dc" }}>
            <div className="sg-wrap">
              <div className="sg-eyebrow">Little moments</div>
              <h2>Us, so far</h2>
              <div className="sg-fan">
                {photos.slice(0, 3).map((src) => (
                  <div className="sg-pol" key={src}>
                    <img src={src} alt="" />
                  </div>
                ))}
              </div>
              <p>{fields.message || "Every little moment led us here."}</p>
            </div>
          </section>
        ) : null}

        <section className="sg-section sg-dark">
          <div className="sg-wrap">
            <div className="sg-eyebrow">Good to know</div>
            <h2>Questions & answers</h2>
            <div className="sg-faq">
              {(faqs.length ? faqs : [{ q: "What should I wear?", a: fields.dress || "Garden formal. Comfortable shoes are encouraged." }]).map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="sg-section">
          <div className="sg-wrap">
            <div className="sg-eyebrow">Kindly reply{fields.rsvpBy ? ` by ${replyDate(fields.rsvpBy)}` : ""}</div>
            <div className="sg-journey" ref={carRef}>
              <img className="sg-car" src={`${ART}/wedding-car.webp`} alt="" />
            </div>
            <h2>Will you join us?</h2>
            {sent ? (
              <>
                <h3>Thank you, {name.trim()}.</h3>
                <p>{attend === "yes" ? "Your reply has been saved." : "We will miss you."}</p>
                <button className="sg-action" type="button" onClick={() => setSent(false)}>Edit my reply</button>
              </>
            ) : (
              <form className="sg-form" onSubmit={(event) => void submit(event)}>
                <label>
                  Full name
                  <input name="name" required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
                </label>
                <div className="sg-attend">
                  <span>Attendance</span>
                  <button type="button" className={attend === "yes" ? "is-on" : ""} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                  <button type="button" className={attend === "no" ? "is-on" : ""} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
                </div>
                <label>
                  A note for the couple
                  <textarea name="message" rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
                </label>
                {error ? <p className="sg-status" role="alert">{error}</p> : null}
                <button className="sg-action is-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save my reply"}</button>
              </form>
            )}
          </div>
        </section>

        <footer className="sg-foot">
          <div className="sg-eyebrow">With love</div>
          <h2>{names}</h2>
          <p>We cannot wait to celebrate with you.</p>
          <button className="sg-action" type="button" onClick={replay}>Replay the invitation</button>
          <button className="sg-action" type="button" aria-pressed={still} onClick={() => setStill((value) => !value)}>Reduce motion</button>
          <a className="sg-eyebrow" href={madeWithHref("secretgarden")} style={{ display: "block", marginTop: 24 }}>Made with InvitesReady</a>
          <InstagramLink />
          <div className="sg-eyebrow">The Secret Garden</div>
        </footer>
      </main>
    </div>
  );
}
