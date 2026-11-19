import { useEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./estate.css";

const ART = "/estate";
const DEMOS = [`${ART}/photo-1.webp`, `${ART}/photo-2.webp`, `${ART}/photo-3.webp`];

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "go" | "open";

function coupleOf(names: string) {
  const [left, right] = names.split(/\s*&\s*/);
  return { left: (left || names).trim(), right: (right || "").trim() };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function longDate(iso: string) {
  const date = new Date(`${iso || "2027-07-27"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function weddingMoment(fields: InviteFields) {
  const date = new Date(`${fields.date || "2027-07-27"}T${fields.time || "16:00"}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function downloadCalendar(fields: InviteFields, names: string) {
  const start = weddingMoment(fields);
  if (!start) return;
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&");
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const payload = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Painted Estate//Wedding//EN",
    `UID:painted-estate-${start.getTime()}@invitation.local`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${names} Wedding`)}`,
    `LOCATION:${esc(place)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  payload.splice(3, 0, "BEGIN:VEVENT");
  const url = URL.createObjectURL(new Blob([payload.join("\r\n")], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "wedding.ics";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function EstateInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Cormorant Garamond", "DM Sans");
  const pack = packOf("estate", fields.lines);
  const couple = coupleOf(fields.names || "Sophia & Alexander");
  const names = [couple.left, couple.right].filter(Boolean).join(" & ");
  const events = pack.programme?.length
    ? pack.programme
    : [
        { time: "16:00", title: "Welcome drinks", text: "Terrace · Garden attire" },
        { time: "17:00", title: "The ceremony", text: "Estate garden" },
        { time: "19:00", title: "Dinner & dancing", text: "Villa courtyard" },
      ];
  const supplied = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : "")).filter(Boolean);
  const photos = (supplied.length ? supplied : DEMOS).slice(0, 3);
  const moment = weddingMoment(fields);
  const day = moment ? moment.getDate() : 0;
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const maps = place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}` : "";

  const scrollRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLElement>(null);
  const bowRef = useRef<HTMLButtonElement>(null);
  const cueRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [picked, setPicked] = useState<string[]>(() => events.map((item) => item.title));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const open = phase === "open";
  const yes = attend === "yes";
  const remaining = moment ? Math.max(0, Math.floor((moment.getTime() - now) / 1000)) : 0;
  const clock = [
    [Math.floor(remaining / 86400), "Days"],
    [Math.floor(remaining / 3600) % 24, "Hours"],
    [Math.floor(remaining / 60) % 60, "Minutes"],
    [remaining % 60, "Seconds"],
  ] as const;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open || quiet) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open, quiet]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !open) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(".pe-reveal")];
    if (quiet || prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    nodes.forEach((node) => node.classList.add("is-pending"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-pending");
        observer.unobserve(entry.target);
      });
    }, { root, threshold: 0.15 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [open, quiet, events.length, photos.length]);

  function finish() {
    window.clearTimeout(timer.current);
    setPhase("open");
    if (!quiet) window.setTimeout(() => cueRef.current?.focus({ preventScroll: true }), 0);
  }

  function untie() {
    if (phase !== "closed") return;
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    setPhase("go");
    timer.current = window.setTimeout(finish, 3650);
  }

  function replay() {
    window.clearTimeout(timer.current);
    setPhase("closed");
    scrollRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    window.setTimeout(() => bowRef.current?.focus({ preventScroll: true }), 0);
  }

  function discover() {
    const root = scrollRef.current;
    const target = countRef.current;
    if (!root || !target) return;
    const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function toggleEvent(title: string) {
    setPicked((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const guest = name.trim();
    if (guest.length < 2) {
      setError("Please enter your name and select at least one event if attending.");
      return;
    }
    if (yes && !picked.length) {
      setError("Please enter your name and select at least one event if attending.");
      return;
    }
    const message = [note.trim(), yes ? `${guests} guest${guests === 1 ? "" : "s"}` : "", yes ? picked.join(", ") : ""].filter(Boolean).join(" · ");
    try {
      await onReply?.({ name: guest, note: message, attending: yes });
    } catch {
      setError("Unable to send. Please try again.");
      return;
    }
    setError("");
    setSent(true);
    window.setTimeout(() => editRef.current?.focus(), 0);
  }

  return (
    <div className={`pe${phase === "go" ? " is-go" : ""}${open ? " is-open" : ""}${quiet ? " is-quiet" : ""}`}>
      <div className="pe-scroll" ref={scrollRef}>
        <header className="pe-hero">
          <div className="pe-art">
            <img className="pe-branch" src={`${ART}/branches.webp`} alt="" />
            <div className="pe-identity" inert={!open}>
              <p className="pe-eyebrow">{fields.hosts || "Together with their families"}</p>
              <h1>
                <span>{couple.left}</span>
                {couple.right ? <i>&amp;</i> : null}
                {couple.right ? <span>{couple.right}</span> : null}
              </h1>
              <p className="pe-eyebrow">{fields.title || "Invite you to celebrate their wedding"}</p>
              <p className="pe-date">{longDate(fields.date)}</p>
              <p>{fields.venue || "Villa del Mare"}</p>
              <button ref={cueRef} className="pe-scrollcue" type="button" onClick={discover}>Discover our day ↓</button>
            </div>
          </div>
          {open ? null : (
            <div className="pe-envelope">
              <div className="pe-flap is-lower" />
              <div className="pe-flap is-upper" />
              <div className="pe-ribbon" />
              <button ref={bowRef} className="pe-bow" type="button" aria-label="Untie the ribbon to open invitation" disabled={phase === "go"} onClick={untie}>
                <img src={`${ART}/bow.webp`} alt="" />
                <span>Untie to open</span>
              </button>
            </div>
          )}
          {open ? null : <button className="pe-skip" type="button" onClick={finish}>Skip animation</button>}
        </header>

        {open ? (
          <main>
            <section className="pe-section" id="pe-count" ref={countRef}>
              <div className="pe-count pe-reveal">
                <p className="pe-eyebrow">Until our forever</p>
                <h2>{String(clock[0][0])}</h2>
                <p>Days</p>
                <div className="pe-clock">
                  {clock.slice(1).map(([value, label]) => (
                    <div key={label}>
                      <b>{String(value).padStart(2, "0")}</b>
                      <small>{label}</small>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="pe-section pe-reveal">
              <p className="pe-eyebrow">Once upon a time</p>
              <h2>Our story</h2>
              <p className="pe-copy">{fields.message || "Somewhere between the quiet mornings and the unexpected adventures, we found our favourite place: beside each other."}</p>
              <p className="pe-sign">{names}</p>
              <h3>Us, so far</h3>
              <div className="pe-fan">
                {photos.map((src, index) => (
                  <div className="pe-pol" key={`${src}-${index}`}>
                    {broken[index] ? <span>A little moment</span> : <img src={src} alt="A moment from our story" onError={() => setBroken((current) => ({ ...current, [index]: true }))} />}
                  </div>
                ))}
              </div>
              <p className="pe-note">Little moments, a lifetime of memories.</p>
            </section>

            <section className="pe-garden">
              <img className="pe-garden-art" src={`${ART}/garden-extended.webp`} alt="Painted Mediterranean garden and sunlit stone terrace" />
              <div className="pe-plaque pe-reveal">
                <p className="pe-eyebrow">Ceremony &amp; dinner</p>
                <h2>The celebration</h2>
                <h3>{fields.venue || "Villa del Mare"}</h3>
                {fields.address ? <p>{fields.address}</p> : null}
                {maps ? <a className="pe-btn" href={maps} target="_blank" rel="noopener noreferrer">Open in maps</a> : null}
              </div>
            </section>

            <section className="pe-day">
              <img className="pe-villa" src={`${ART}/villa.webp`} alt="Painted Mediterranean villa" />
              <div className="pe-reveal">
                <p className="pe-eyebrow">From sunset drinks to the last dance</p>
                <h2>The day</h2>
                {day ? (
                  <div className="pe-dates">
                    {[-2, -1, 0, 1, 2].map((offset) => offset === 0 ? <strong key={offset}>{day}</strong> : <span key={offset}>{day + offset}</span>)}
                  </div>
                ) : null}
                <ol className="pe-timeline">
                  {events.map((item) => (
                    <li key={item.title}>
                      <time>{formatTime(item.time) || item.time}</time>
                      <h3>{item.title}</h3>
                      {item.text ? <p>{item.text}</p> : null}
                    </li>
                  ))}
                </ol>
                <button className="pe-cal" type="button" onClick={() => downloadCalendar(fields, names)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="5" width="16" height="15" rx="2" />
                    <path d="M8 3.5v3M16 3.5v3M4 10h16" />
                  </svg>
                  Add to calendar
                </button>
              </div>
            </section>

            <section className="pe-section pe-reply pe-reveal">
              <p className="pe-eyebrow">Kindly respond</p>
              <h2>Your presence</h2>
              {sent ? (
                <div className="pe-thanks">
                  <p className="pe-sign">{name.trim()}</p>
                  <p>{yes ? "We look forward to celebrating together." : "You will be missed, and you will be loved from afar."}</p>
                  <button ref={editRef} type="button" onClick={() => { setSent(false); window.setTimeout(() => nameRef.current?.focus(), 0); }}>Edit response</button>
                </div>
              ) : (
                <form className="pe-form" onSubmit={submit}>
                  <label>
                    <span>Your name</span>
                    <input ref={nameRef} value={name} maxLength={100} required autoComplete="name" placeholder="Full name" onChange={(event) => setName(event.target.value)} />
                  </label>
                  <fieldset>
                    <legend>Will you join us?</legend>
                    <label className={yes ? "pe-choice is-on" : "pe-choice"}>
                      <input type="radio" name="attendance" value="yes" checked={yes} onChange={() => setAttend("yes")} />
                      <i />
                      Joyfully accept
                    </label>
                    <label className={!yes ? "pe-choice is-on" : "pe-choice"}>
                      <input type="radio" name="attendance" value="no" checked={!yes} onChange={() => setAttend("no")} />
                      <i />
                      Regretfully decline
                    </label>
                  </fieldset>
                  {yes ? (
                    <>
                      <label>
                        <span>Guests, including you</span>
                        <input type="number" min={1} max={10} value={guests} required onChange={(event) => setGuests(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} />
                      </label>
                      <fieldset>
                        <legend>Which parts of the day?</legend>
                        {events.map((item) => {
                          const on = picked.includes(item.title);
                          return (
                            <label className={on ? "pe-choice is-tick is-on" : "pe-choice is-tick"} key={item.title}>
                              <input type="checkbox" checked={on} onChange={() => toggleEvent(item.title)} />
                              <i />
                              <span>
                                <strong>{item.title}</strong>
                                {item.time ? <small>{formatTime(item.time) || item.time}</small> : null}
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>
                    </>
                  ) : null}
                  <label>
                    <span>A note, if you wish</span>
                    <textarea maxLength={1000} rows={3} value={note} placeholder="A wish for the couple" onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <p className="pe-error" role="alert">{error}</p>
                  <button className="pe-send" type="submit">Send reply</button>
                </form>
              )}
            </section>

            <footer className="pe-foot">
              <p className="pe-sign">{names}</p>
              <p>With love, always.</p>
              <button type="button" onClick={replay}>Replay invitation</button>
              <p className="pe-note">The Painted Estate</p>
              <a className="pe-made" href={madeWithHref("estate")}>Made with InvitesReady</a>
            </footer>
          </main>
        ) : null}
      </div>
    </div>
  );
}
