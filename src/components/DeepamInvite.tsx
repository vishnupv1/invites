import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { calendarUrl, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import { InstagramLink } from "./InstagramLink";
import "./deepam.css";

/** Wick cups on each dish, top tier first, as a percent of the lamp. */
const WICKS = [
  [[23.9, 18.4], [29.3, 17.7], [38.6, 17.4], [61.0, 17.4], [69.9, 17.6], [75.3, 18.2]],
  [[20.8, 27.3], [25.5, 26.9], [34.4, 26.5], [66.8, 26.5], [74.9, 26.9], [79.5, 27.2]],
  [[18.1, 35.8], [23.9, 35.3], [35.1, 35.1], [66.4, 35.1], [76.4, 35.3], [81.9, 35.7]],
  [[15.1, 44.4], [21.6, 44.1], [33.6, 43.9], [68.0, 44.0], [78.8, 44.1], [84.9, 44.4]],
  [[12.4, 53.6], [19.3, 53.4], [31.7, 53.3], [69.5, 53.3], [81.1, 53.4], [87.6, 53.6]],
  [[10.8, 63.0], [18.5, 62.9], [31.7, 62.9], [69.5, 62.9], [81.9, 62.9], [89.2, 63.0]],
  [[7.3, 72.5], [15.8, 72.5], [30.1, 72.5], [70.7, 72.5], [84.9, 72.5], [92.7, 72.5]],
];

const FLAMES = WICKS.flatMap((tier, tierIndex) =>
  tier.map(([x, y], index) => ({
    x,
    y: y + 0.45,
    w: 3.2,
    delay: (WICKS.length - 1 - tierIndex) * 0.36 + index * 0.045,
  })),
);

function partsOf(iso: string) {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    day: String(date.getDate()),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    year: String(date.getFullYear()),
  };
}

function useLeft(iso: string, time: string) {
  const target = useMemo(() => {
    if (!iso) return 0;
    const [hour, minute] = (time || "09:30").split(":");
    return new Date(`${iso}T${hour || "09"}:${minute || "30"}:00`).getTime();
  }, [iso, time]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, target - now);
  return {
    days: Math.floor(left / 86400000),
    hours: Math.floor(left / 3600000) % 24,
    minutes: Math.floor(left / 60000) % 60,
    seconds: Math.floor(left / 1000) % 60,
  };
}

export function DeepamInvite({
  fields,
  onReply,
  quiet = false,
}: {
  fields: InviteFields;
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void;
  quiet?: boolean;
}) {
  useFonts("Great Vibes", "Cormorant Garamond", "Caveat");
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [phase, setPhase] = useState<"dusk" | "lighting" | "lit" | "open">(quiet || reduced ? "open" : "dusk");
  const [rsvp, setRsvp] = useState({ name: "", note: "", attending: true, sent: false });
  const [photo, setPhoto] = useState<string | null>(null);
  const settled = quiet || reduced;
  const [pull, setPull] = useState(settled ? 1 : 0);
  const pullRef = useRef(settled ? 1 : 0);
  const dragY = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripHeight, setStripHeight] = useState(0);
  const left = useLeft(fields.date, fields.time);
  const when = partsOf(fields.date);
  const names = (fields.names || "Saranya & Sharathraj").split(/\s*&\s*/);
  const photos = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : ""));
  const shots = photos.filter(Boolean);
  const prints = ["/deepam/print-1.webp", "/deepam/print-2.webp", "/deepam/print-3.webp"].map(
    (fallback, index) => photos[index] || fallback,
  );
  const revealed = phase === "open";
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [fields.venue, fields.address].filter(Boolean).join(", ") || "Guruvayur Temple",
  )}`;

  useEffect(() => {
    if (phase !== "lighting") return;
    const id = window.setTimeout(() => setPhase("lit"), 3000);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "lit") return;
    const id = window.setTimeout(() => setPhase("open"), 1400);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    const node = stripRef.current;
    if (!node) return;
    const measure = () => setStripHeight(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed, prints[0], prints[1], prints[2]]);

  function beginPull(event: ReactPointerEvent<HTMLDivElement>) {
    if (settled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragY.current = event.clientY;
  }

  function movePull(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragY.current == null) return;
    const travel = Math.max(stripHeight - 36, 1);
    const next = Math.min(1, Math.max(0, pullRef.current + (event.clientY - dragY.current) / travel));
    dragY.current = event.clientY;
    pullRef.current = next;
    setPull(next);
  }

  function endPull() {
    dragY.current = null;
  }

  useEffect(() => {
    if (!photo) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPhoto(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo]);

  function light() {
    if (phase !== "dusk") return;
    setPhase("lighting");
  }

  function send(event: FormEvent) {
    event.preventDefault();
    if (!rsvp.name.trim()) return;
    onReply?.({ name: rsvp.name.trim(), note: rsvp.note.trim(), attending: rsvp.attending });
    setRsvp((current) => ({ ...current, sent: true }));
  }

  return (
    <div
      className={`dp${phase === "lighting" ? " is-lighting" : ""}${phase === "lit" ? " is-lit" : ""}${revealed ? " is-open" : ""}${quiet ? " is-quiet" : ""}`}
    >
      {!revealed ? (
        <div className="dp-dusk">
          <img className="dp-temple" src="/deepam/temple.webp" alt="" />
          <div className="dp-warm" />
          <div className="dp-pool" />
          <div className="dp-lamp">
            {WICKS.map((tier, tierIndex) => (
              <i
                key={tierIndex}
                className="dp-halo"
                style={{
                  top: `${tier[2][1]}%`,
                  width: `${100 + tierIndex * 14}%`,
                  animationDelay: `${(WICKS.length - 1 - tierIndex) * 0.36}s`,
                }}
              />
            ))}
            <img src="/deepam/lamp.webp" alt="" />
            {FLAMES.map((flame, index) => (
              <img
                key={index}
                className="dp-flame"
                src="/deepam/flame.webp"
                alt=""
                style={{
                  left: `${flame.x}%`,
                  top: `${flame.y}%`,
                  width: `${flame.w}%`,
                  animationDelay: `${flame.delay}s`,
                }}
              />
            ))}
          </div>
          {phase === "dusk" ? (
            <button className="dp-tap" type="button" aria-label="Open invitation" onClick={light}>
              <span>Tap</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {revealed ? (
        <div className="dp-scroll">
          <section className="dp-page dp-invite">
            <img className="dp-mantra" src="/deepam/mantra.webp" alt="ഗുരുവായൂരപ്പൻ തമ്പുരാൻ" />
            <h1>
              <span>{names[0]}</span>
              <i>&amp;</i>
              <span>{names[1] || ""}</span>
            </h1>
            {when ? (
              <div className="dp-when">
                <span>{when.weekday}</span>
                <b>{when.day}</b>
                <span>
                  {when.month}
                  <small>{when.year}</small>
                </span>
              </div>
            ) : null}
            {fields.time ? <p className="dp-muhurtham">Muhurtham: {formatTime(fields.time)}</p> : null}
            <p className="dp-place">{[fields.venue, fields.address].filter(Boolean).join(", ")}</p>
            <figure className="dp-couple">
              <img src="/deepam/couple.webp" alt="" />
            </figure>
            <span className="dp-blooms" aria-hidden="true">
              <img className="dp-bloom dp-bloom-1" src="/deepam/hibiscus-purple.webp" alt="" />
              <img className="dp-bloom dp-bloom-2" src="/deepam/jasmine.webp" alt="" />
              <img className="dp-bloom dp-bloom-3" src="/deepam/hibiscus-red.webp" alt="" />
            </span>
          </section>

          <section
            className={`dp-page dp-reel${settled ? " is-settled" : ""}`}
            aria-label="Printed photographs"
          >
            <div className="dp-printer">
              <img className="dp-slot" src="/sage/gold-slot.webp" alt="" />
              <div
                className="dp-mouth"
                style={settled ? undefined : { "--pull": pull, "--strip": `${stripHeight}px` } as React.CSSProperties}
                onPointerDown={beginPull}
                onPointerMove={movePull}
                onPointerUp={endPull}
                onPointerCancel={endPull}
                aria-label="Pull the photographs"
              >
                <div className="dp-strip" ref={stripRef}>
                  <figure className="dp-print">
                    <img src={prints[2]} alt="" />
                  </figure>
                  <figure className="dp-print">
                    <img src={prints[1]} alt="" />
                  </figure>
                  <figure className="dp-print">
                    <img src={prints[0]} alt="" />
                  </figure>
                </div>
              </div>
              {settled || pull > 0.98 ? null : (
                <p className="dp-pull" style={{ opacity: 1 - pull }}>Pull down</p>
              )}
            </div>
          </section>

          <section className="dp-page dp-journey" aria-label="Our journey">
            <h2>Our Journey</h2>
            <p className="dp-kicker">A story of friendship, love and togetherness</p>
            <figure className="dp-feet">
              <img src="/deepam/feet.webp" alt="" />
            </figure>
            {shots.length ? (
              <div className={`dp-story${shots.length === 1 ? " is-one" : ""}`}>
                {shots.map((src, index) => (
                  <button key={src} className="dp-shot" type="button" onClick={() => setPhoto(src)}>
                    <img src={src} alt="" />
                    <i>{String(index + 1).padStart(2, "0")}</i>
                  </button>
                ))}
              </div>
            ) : (
              <p className="dp-empty">Photographs will be added here.</p>
            )}
          </section>

          <section className="dp-page dp-count">
            <h2>Until Our Forever</h2>
            <p className="dp-kicker">The countdown to our wedding begins</p>
            {when ? (
              <div className="dp-when">
                <span>{when.weekday}</span>
                <b>{when.day}</b>
                <span>
                  {when.month}
                  <small>{when.year}</small>
                </span>
              </div>
            ) : null}
            {fields.time ? <p className="dp-muhurtham">{formatTime(fields.time)}</p> : null}
            <div className="dp-ticks">
              <div className="dp-days">
                <b>{left.days}</b>
                <span>Days</span>
              </div>
              <div className="dp-rest">
                {[
                  [left.hours, "Hours"],
                  [left.minutes, "Minutes"],
                  [left.seconds, "Seconds"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <b>{String(value).padStart(2, "0")}</b>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="dp-place">{[fields.venue, fields.address].filter(Boolean).join(", ")}</p>
            <div className="dp-links">
              <a href={maps} target="_blank" rel="noreferrer">
                View on Maps
              </a>
              {calendarUrl(fields) ? (
                <a href={calendarUrl(fields)} target="_blank" rel="noreferrer">
                  Add to Calendar
                </a>
              ) : null}
            </div>
          </section>

          <section className="dp-page dp-reply">
            <h2>Will you be there?</h2>
            <p className="dp-kicker">Kindly let us know</p>
            {rsvp.sent ? (
              <p className="dp-thanks-note">Thank you. Your reply is with us.</p>
            ) : (
              <form className="dp-rsvp" onSubmit={send}>
                <label className="dp-field">
                  <span>Your name</span>
                  <input
                    placeholder="Write it here"
                    value={rsvp.name}
                    onChange={(event) => setRsvp({ ...rsvp, name: event.target.value })}
                    required
                  />
                </label>
                <div className="dp-choice" role="group" aria-label="Will you attend">
                  <button
                    type="button"
                    className={rsvp.attending ? "is-on" : ""}
                    onClick={() => setRsvp({ ...rsvp, attending: true })}
                  >
                    Joyfully, yes
                  </button>
                  <button
                    type="button"
                    className={!rsvp.attending ? "is-on" : ""}
                    onClick={() => setRsvp({ ...rsvp, attending: false })}
                  >
                    With regrets
                  </button>
                </div>
                <label className="dp-field">
                  <span>A blessing</span>
                  <textarea
                    placeholder="A few words for the couple"
                    value={rsvp.note}
                    onChange={(event) => setRsvp({ ...rsvp, note: event.target.value })}
                  />
                </label>
                <button className="dp-send" type="submit">
                  Send your reply
                </button>
              </form>
            )}
          </section>

          <section className="dp-page dp-close">
            <h2>Thank you</h2>
            <p className="dp-kicker">We look forward to celebrating with you</p>
            <p className="dp-close-names">
              <span>{names[0]}</span>
              <i>&amp;</i>
              <span>{names[1] || ""}</span>
            </p>
            {when ? (
              <div className="dp-when">
                <span>{when.weekday}</span>
                <b>{when.day}</b>
                <span>
                  {when.month}
                  <small>{when.year}</small>
                </span>
              </div>
            ) : null}
            <p className="dp-place">{[fields.venue, fields.address].filter(Boolean).join(", ")}</p>
            {!quiet ? (
              <button className="dp-replay" type="button" onClick={() => setPhase("dusk")}>
                Replay
              </button>
            ) : null}
            <p className="dp-made">
              <a href={madeWithHref("deepam")}>Made with InvitesReady</a>
            </p>
            <InstagramLink />
          </section>
        </div>
      ) : null}

      {photo ? (
        <div className="dp-lightbox" role="dialog" aria-modal="true" aria-label="Photograph" onClick={() => setPhoto(null)}>
          <img src={photo} alt="" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
}
