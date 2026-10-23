import { useCallback, useEffect, useRef, useState, type FormEvent, type TouchEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./blockbuster.css";

const ART = "/blockbuster";
const CHAPTERS = ["The Poster", "Our Story", "The Invitation", "Blockbuster Events", "The Venue", "Travel Info", "Our Moments", "RSVP", "See You There"];
const STORY_ART = [`${ART}/story-1.webp`, `${ART}/story-2.webp`, `${ART}/story-3.webp`];
const EVENT_ART = [`${ART}/haldi.webp`, `${ART}/mehendi.webp`, `${ART}/wedding.webp`, `${ART}/reception.webp`];
const WAY_ICONS = [
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  "M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z",
];
const MOMENTS = [
  { caption: "first look", rotate: "-2.5deg", src: `${ART}/photo-1.webp` },
  { caption: "coffee dates", rotate: "2deg", src: `${ART}/photo-2.webp` },
  { caption: "the road trip", rotate: "-1.5deg", src: `${ART}/photo-3.webp` },
  { caption: "the proposal", rotate: "2.5deg", src: `${ART}/photo-4.webp` },
  { caption: "family blessings", rotate: "-2deg", src: `${ART}/photo-5.webp` },
  { caption: "forever begins", rotate: "1.5deg", src: `${ART}/photo-6.webp` },
];
const VENUE_LABELS = new Set(["Address", "Gates open", "Parking"]);
const STARS: [number, number, number, number, number][] = [
  [0, 1.1, 2, 2.5, 0], [53, 4.3, 3, 3.3, 0.7], [6, 7.6, 4, 4.1, 1.4], [59, 10.8, 2, 4.9, 2.1],
  [12, 14, 3, 2.5, 2.8], [65, 17.2, 4, 3.3, 0.5], [18, 20.4, 2, 4.1, 1.2], [71, 23.7, 3, 4.9, 1.9],
  [24, 26.9, 4, 2.5, 2.6], [77, 30.1, 2, 3.3, 0.3], [30, 33.3, 3, 4.1, 1], [83, 36.6, 4, 4.9, 1.7],
  [36, 39.8, 2, 2.5, 2.4], [89, 43, 3, 3.3, 0.1], [42, 46.2, 4, 4.1, 0.8], [95, 49.4, 2, 4.9, 1.5],
  [48, 52.7, 3, 2.5, 2.2], [1, 55.9, 4, 3.3, 2.9], [54, 59.1, 2, 4.1, 0.6], [7, 62.3, 3, 4.9, 1.3],
  [60, 65.6, 4, 2.5, 2], [13, 68.8, 2, 3.3, 2.7], [66, 72, 3, 4.1, 0.4], [19, 75.2, 4, 4.9, 1.1],
  [72, 78.4, 2, 2.5, 1.8], [25, 81.7, 3, 3.3, 2.5], [78, 84.9, 4, 4.1, 0.2], [31, 88.1, 2, 4.9, 0.9],
  [84, 91.3, 3, 2.5, 1.6], [37, 94.6, 4, 3.3, 2.3], [90, 2.2, 2, 4.1, 0], [43, 5.4, 3, 4.9, 0.7],
  [96, 8.7, 4, 2.5, 1.4], [49, 11.9, 2, 3.3, 2.1], [2, 15.1, 3, 4.1, 2.8], [55, 18.3, 4, 4.9, 0.5],
  [8, 21.6, 2, 2.5, 1.2], [61, 24.8, 3, 3.3, 1.9], [14, 28, 4, 4.1, 2.6], [67, 31.2, 2, 4.9, 0.3],
  [20, 34.4, 3, 2.5, 1], [73, 37.7, 4, 3.3, 1.7], [26, 40.9, 2, 4.1, 2.4], [79, 44.1, 3, 4.9, 0.1],
  [32, 47.3, 4, 2.5, 0.8], [85, 50.6, 2, 3.3, 1.5], [38, 53.8, 3, 4.1, 2.2], [91, 57, 4, 4.9, 2.9],
  [44, 60.2, 2, 2.5, 0.6], [97, 63.4, 3, 3.3, 1.3],
];

type Reply = { name: string; note: string; attending: boolean };

function pairOf(names: string) {
  const parts = names.split("&").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { first: names.trim(), second: "" };
  return { first: parts.slice(0, -1).join(" & "), second: parts[parts.length - 1] };
}

function whenOf(iso: string) {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    mon: date.toLocaleDateString("en-US", { month: "short" }),
    monthName: date.toLocaleDateString("en-US", { month: "long" }),
    year: String(date.getFullYear()),
  };
}

function shortTime(time: string) {
  return formatTime(time).replace(":00", "");
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!date) return null;
  const target = new Date(`${date}T${time || "16:00"}:00+05:30`).getTime();
  if (Number.isNaN(target)) return null;
  let diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff - mins * 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    [String(days), "days"],
    [pad(hours), "hours"],
    [pad(mins), "mins"],
    [pad(secs), "secs"],
  ] as const;
}

function Glyph({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={d} fill="#FBE7B0" />
    </svg>
  );
}

function Count({ parts }: { parts: ReturnType<typeof useCountdown> }) {
  if (!parts) return null;
  return (
    <div className="bb-count">
      {parts.map(([value, label]) => (
        <div key={label}>
          <strong className={label === "secs" ? "is-tick" : undefined}>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function BlockbusterInvite({
  fields,
  quiet = false,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  useFonts("Rozha One", "Yesteryear", "Jost", "EB Garamond");
  const pack = packOf("blockbuster", fields.lines);
  const couple = pairOf(fields.names);
  const parents = fields.hosts.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const when = whenOf(fields.date);
  const by = whenOf(fields.rsvpBy);
  const countdown = useCountdown(fields.date, fields.time);
  const live = Boolean(onReply);
  const guest = fields.detail.replace(/^dear\s+/i, "").replace(/,+\s*$/, "").trim() || "friend";
  const beats = (pack.story ?? []).slice(0, 3);
  const events = pack.programme ?? [];
  const facts = pack.facts ?? [];
  const venueFacts = facts.filter((fact) => VENUE_LABELS.has(fact.label));
  const ways = facts.filter((fact) => !VENUE_LABELS.has(fact.label));
  const shots = MOMENTS.map((item, index) => {
    const uploaded = fields.photos[index];
    return { ...item, src: uploaded ? assetUrl(uploaded) : live ? "" : item.src };
  }).filter((item) => item.src);
  const clock = formatTime(fields.time);
  const place = [fields.venue, fields.address.split(",")[0]?.trim()].filter(Boolean).join(", ");
  const city = (fields.address.split(",")[0] || fields.venue || "Jaipur").trim();
  const phone = (pack.venuePhone || "").replace(/[^\d+]/g, "");

  const track = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [begun, setBegun] = useState(false);
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState("");
  const [event, setEvent] = useState<number | null>(null);
  const [light, setLight] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const go = useCallback((index: number) => {
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, index));
    const node = track.current;
    if (!node) return;
    node.scrollTo({ left: next * node.clientWidth, behavior: "smooth" });
    setPage(next);
  }, []);

  useEffect(() => {
    function onKey(keyEvent: KeyboardEvent) {
      const tag = (keyEvent.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!begun) {
        if (keyEvent.key === "ArrowRight" || keyEvent.key === "Enter") setBegun(true);
        return;
      }
      if (event != null) {
        if (keyEvent.key === "Escape") setEvent(null);
        return;
      }
      if (light != null) {
        if (keyEvent.key === "Escape") setLight(null);
        if (keyEvent.key === "ArrowRight") setLight((index) => (index == null ? index : (index + 1) % shots.length));
        if (keyEvent.key === "ArrowLeft") setLight((index) => (index == null ? index : (index + shots.length - 1) % shots.length));
        return;
      }
      if (keyEvent.key === "ArrowRight") go(page + 1);
      if (keyEvent.key === "ArrowLeft") go(page - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [begun, event, go, light, page, shots.length]);

  function onTrackScroll() {
    const node = track.current;
    if (!node || !node.clientWidth) return;
    setPage(Math.round(node.scrollLeft / node.clientWidth));
  }

  function onTouchStart(touchEvent: TouchEvent) {
    touch.current = { x: touchEvent.touches[0].clientX, y: touchEvent.touches[0].clientY };
  }

  function onTouchEnd(touchEvent: TouchEvent) {
    if (!touch.current) return;
    const dx = touchEvent.changedTouches[0].clientX - touch.current.x;
    const dy = touchEvent.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (dx < -50 || dy < -70) setBegun(true);
  }

  function toggleMusic() {
    const next = !playing;
    setPlaying(next);
    setToast(next ? "Now playing: our title track." : "Music paused.");
    if (!fields.audio || !audio.current) return;
    if (next) void audio.current.play();
    else audio.current.pause();
  }

  function addCalendar() {
    const url = calendarUrl(fields);
    if (url) window.open(url, "_blank", "noopener");
    const stamp = when ? `${when.day} ${when.mon}${clock ? `, ${shortTime(fields.time)}` : ""}` : "";
    setToast(stamp ? `Wedding added to your calendar — ${stamp}.` : "Wedding added to your calendar.");
  }

  function share() {
    const text = window.location.href;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(
        () => setToast("Invite link copied — share it with the family!"),
        () => setToast("Invite link copied — share it with the family!"),
      );
      return;
    }
    setToast("Invite link copied — share it with the family!");
  }

  function maps(query: string) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
  }

  async function submit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!name.trim()) {
      setError("Please add your name so we can save your seat.");
      return;
    }
    setError("");
    await onReply?.({
      name: name.trim(),
      attending,
      note: attending ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
    });
    setDone(true);
  }

  const showing = event != null ? events[event] : null;
  const photo = light != null ? shots[light] : null;
  const motion = quiet || reduced ? "off" : "on";
  const cinema = when ? `${when.day} · ${when.month} · ${when.year}` : "";
  const finaleWhen = when ? `${when.weekday} · ${when.day} ${when.monthName} ${when.year}${fields.time ? ` · ${shortTime(fields.time)}` : ""}` : "";

  return (
    <article className={`bb${begun && page === 8 ? " is-night" : ""}`} data-motion={motion}>
      {fields.audio ? <audio ref={audio} src={assetUrl(fields.audio)} loop preload="none" /> : null}
      {!begun ? (
        <section className="bb-cover" aria-label="Opening" data-on="1" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="bb-cover-photo" />
          <div className="bb-dim" />
          <div className="bb-beam" aria-hidden="true"><i /></div>
          <div className="bb-glow" />
          <div className="bb-marquee">
            <span className="brand">INVITESREADY</span>
            <span className="presents">PRESENTS</span>
            <span className="only">for ever</span>
            <h2 className="title">A Love<br />Story</h2>
            <span className="bb-soon"><s /><b>COMING SOON</b><s /></span>
            <span className="seat">RESERVED FOR {guest.toUpperCase()}</span>
          </div>
          <img className="bb-drape is-l" src={`${ART}/drape.webp`} alt="" />
          <img className="bb-drape is-r" src={`${ART}/drape.webp`} alt="" />
          <img className="bb-projector" src={`${ART}/projector.webp`} alt="" />
          <div className="bb-cur" aria-hidden="true">
            <div className="leaf is-l"><i className="hem" /><i className="rod" /></div>
            <div className="leaf is-r"><i className="hem" /><i className="rod" /></div>
            <div className="valance" />
          </div>
          <div className="bb-cover-foot">
            <span className="bb-stay">Stay tuned…</span>
            <button type="button" className="bb-go" onClick={() => setBegun(true)}>
              <span>Start the show</span>
              <i><b>→</b></i>
            </button>
            <span className="bb-hint">swipe left or tap ⌄</span>
            <span className="bb-keys">or press → on your keyboard</span>
          </div>
          <div className="bb-grain" /><div className="bb-scratch" /><div className="bb-vig" />
        </section>
      ) : (
        <>
          <div className="bb-track" ref={track} onScroll={onTrackScroll}>
            <section className="bb-page bb-poster" aria-label="Reel 2 of 10: The Poster" data-on={page === 0 ? "1" : "0"}>
              <div className="bb-rays" /><div className="bb-wash" />
              <div className="bb-panel"><div className="bb-kb" /><div className="fade" /></div>
              <div className="bb-shade-top" /><div className="bb-shade-bot" />
              <div className="bb-scroll">
                <div className="bb-fit">
                  <div className="bb-cast">
                    <div className="bb-a bb-role" style={{ ["--d" as string]: "0.2s" }}>
                      <b>{couple.first}</b><em>as</em><strong>The Hero</strong>
                    </div>
                    <div className="bb-a bb-role" style={{ ["--d" as string]: "0.35s" }}>
                      <b>{couple.second}</b><em>as</em><strong>The Heroine</strong>
                    </div>
                  </div>
                  <div className="bb-poster-copy">
                    <div className="bb-a bb-poster-title" style={{ ["--d" as string]: "0.5s" }}>
                      <span className="the">The</span>
                      <span className="great">GREATEST</span>
                      <span className="love">LOVE STORY <i>♥</i></span>
                    </div>
                    <span className="bb-a life" style={{ ["--d" as string]: "0.7s" }}>A LIFETIME TOGETHER</span>
                    <span className="bb-a credit" style={{ ["--d" as string]: "0.85s" }}><span>DIRECTED BY DESTINY</span><span>|</span><span>PRODUCED BY OUR FAMILIES</span></span>
                    {cinema ? <span className="bb-a when" style={{ ["--d" as string]: "1s" }}>IN CINEMAS · {cinema}</span> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="bb-page bb-paper" aria-label="Reel 3 of 10: Our Story" data-on={page === 1 ? "1" : "0"}>
              <div className="bb-frame" />
              <img className="bb-corner" src={`${ART}/corner.webp`} alt="" style={{ right: -40, bottom: -50, transform: "scaleX(-1)" }} />
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ left: -30, bottom: -40, width: 300 }} />
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ right: -30, top: -40, width: 260, transform: "rotate(180deg)" }} />
              <img className="bb-reel" src={`${ART}/reel.webp`} alt="" />
              <div className="bb-scroll">
                <div className="bb-fit">
                  <div className="bb-story">
                    <div className="bb-a" style={{ ["--d" as string]: "0.15s" }}>
                      <h2>Our Story</h2>
                      <span className="bb-kicker" style={{ color: "var(--deep)" }}>A journey of two hearts</span>
                      <p className="lead">Three scenes. One love story. Roll the film.</p>
                    </div>
                    <div className="bb-pair">
                      <div className="bb-a bb-film is-roll" style={{ ["--d" as string]: "0.35s" }}>
                        {beats.map((beat, index) => (
                          <div key={beat.title} className="shot bb-a is-sepia" style={{ ["--d" as string]: `${0.4 + index * 0.15}s`, backgroundImage: STORY_ART[index] ? `url(${STORY_ART[index]})` : undefined }} />
                        ))}
                        <img src={`${ART}/film.webp`} alt="" />
                      </div>
                      <div className="bb-scenes">
                        {beats.map((beat, index) => (
                          <div key={beat.title} className="bb-a bb-scene is-left" style={{ ["--d" as string]: `${0.5 + index * 0.15}s` }}>
                            <small>{beat.year}</small>
                            <strong>{beat.title}</strong>
                            <span>{beat.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bb-page bb-invite" aria-label="Reel 4 of 10: The Invitation" data-on={page === 2 ? "1" : "0"}>
              <div className="bb-rays" /><div className="bb-wash" />
              <div className="bb-panel"><div className="bb-kb" /><div className="fade" /><div className="veil" /></div>
              <div className="bb-scroll">
                <div className="bb-invite-names">
                  <span className="bb-a who" style={{ ["--d" as string]: "0.15s" }}>{fields.title || "You're invited to the wedding of"}</span>
                  <div className="bb-a bb-names" style={{ ["--d" as string]: "0.35s" }}>
                    <b>{couple.first}</b> {couple.second ? <i>&amp;</i> : null} {couple.second ? <b>{couple.second}</b> : null}
                  </div>
                </div>
                <div className="bb-a bb-ticket" style={{ ["--d" as string]: "0.6s" }}>
                  {when ? <div className="bb-date">{when.day}<s />{when.mon.toUpperCase()}<s />{when.year}</div> : null}
                  {clock ? <span className="at">at {clock}</span> : null}
                  {place ? <span className="place">{place}</span> : null}
                </div>
                <div className="bb-fit">
                  <div className="bb-invite-desk">
                    <div className="bb-arch">
                      <div className="paper" />
                      <img src={`${ART}/ticket.webp`} alt="" />
                      <div className="ink">
                        <span className="bb-a who" style={{ ["--d" as string]: "0.15s" }}>{fields.title || "You're invited to the wedding of"}</span>
                        <div className="bb-a bb-names" style={{ ["--d" as string]: "0.3s" }}>
                          <b>{couple.first}</b>{couple.second ? <><br /><i>&amp;</i><br /><b>{couple.second}</b></> : null}
                        </div>
                        {parents.length ? <p className="bb-a bb-parents" style={{ ["--d" as string]: "0.5s" }}>{parents.map((line) => <span key={line}>{line}<br /></span>)}</p> : null}
                        {when ? <div className="bb-a bb-date" style={{ ["--d" as string]: "0.65s" }}>{when.day}<s />{when.mon.toUpperCase()}<s />{when.year}</div> : null}
                        {clock ? <span className="bb-a at" style={{ ["--d" as string]: "0.8s" }}>at {clock}</span> : null}
                        {fields.venue ? <span className="bb-a place" style={{ ["--d" as string]: "0.9s" }}>{fields.venue}{fields.address ? `, ${fields.address}` : ""}</span> : null}
                        <Count parts={countdown} />
                        <button type="button" className="bb-pill" onClick={addCalendar}>Add to calendar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bb-page bb-paper" aria-label="Reel 5 of 10: Blockbuster Events" data-on={page === 3 ? "1" : "0"}>
              <div className="bb-frame" />
              <img className="bb-corner" src={`${ART}/corner.webp`} alt="" style={{ left: -40, bottom: -50, width: 150 }} />
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ left: -30, bottom: -40, width: 260 }} />
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ right: -30, bottom: -40, width: 260, transform: "scaleX(-1)" }} />
              <div className="bb-scroll">
                <div className="bb-fit">
                  <h2 className="bb-a bb-head" style={{ ["--d" as string]: "0.15s" }}><span className="a">BLOCKBUSTER</span><br /><span className="b">EVENTS</span></h2>
                  <span className="bb-a bb-kicker" style={{ ["--d" as string]: "0.3s", color: "var(--deep)" }}>Four shows. One family. Tap a show for details.</span>
                  <div className="bb-events">
                    {events.map((item, index) => (
                      <button key={`${item.title}-${index}`} type="button" className="bb-a bb-show" style={{ ["--d" as string]: `${0.4 + index * 0.08}s` }} onClick={() => setEvent(index)}>
                        <i className="still" style={{ backgroundImage: EVENT_ART[index] ? `url(${EVENT_ART[index]})` : undefined }} />
                        <span className="meta">
                          <strong>{item.title}</strong>
                          {item.kick ? <small>{item.kick}</small> : null}
                          {item.time ? <small>{item.time}</small> : null}
                          <em>{item.text}</em>
                        </span>
                        <span className="chev">›</span>
                      </button>
                    ))}
                  </div>
                  <div className="bb-posters">
                    {events.map((item, index) => (
                      <button key={`poster-${item.title}-${index}`} type="button" className="bb-a bb-poster-card" style={{ ["--d" as string]: `${0.4 + index * 0.08}s` }} onClick={() => setEvent(index)}>
                        <span className="pad bb-bulbs">
                          <span className="sheet">
                            <i className="still" style={{ backgroundImage: EVENT_ART[index] ? `url(${EVENT_ART[index]})` : undefined }} />
                            <strong>{item.title}</strong>
                            <small>{[item.kick, item.time].filter(Boolean).join(" · ")}</small>
                            <em>{item.text}</em>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="bb-a bb-pill" style={{ ["--d" as string]: "1s" }} onClick={() => setToast(events.length === 4 ? "All four shows added to your calendar." : `All ${events.length} shows added to your calendar.`)}>Add all shows to my calendar</button>
                </div>
              </div>
            </section>

            <section className="bb-page bb-venue" aria-label="Reel 6 of 10: The Venue" data-on={page === 4 ? "1" : "0"}>
              <div className="bb-panel"><div className="bb-kb" /><div className="fade" /><div className="veil" /></div>
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ right: -30, bottom: -40, width: 240, transform: "scaleX(-1)" }} />
              <div className="bb-scroll">
                <div className="bb-fit">
                  <div className="bb-venue-copy">
                    <h2 className="bb-a" style={{ ["--d" as string]: "0.15s" }}>THE VENUE</h2>
                    <span className="bb-a sub" style={{ ["--d" as string]: "0.35s" }}>A royal setting for our big day</span>
                    <strong className="bb-a palace" style={{ ["--d" as string]: "0.5s" }}>{fields.venue}</strong>
                    <span className="bb-a where" style={{ ["--d" as string]: "0.5s" }}>{place}</span>
                    {venueFacts.length ? (
                      <div className="bb-venue-facts">
                        {venueFacts.map((fact) => (
                          <div key={fact.label} className="bb-a" style={{ ["--d" as string]: "0.65s" }}>
                            <small>{fact.label}</small>
                            <span>{fact.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="bb-maps">
                      <button type="button" className="bb-solid" onClick={() => maps([fields.venue, fields.address].filter(Boolean).join(" "))}>
                        <Glyph d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" size={20} />
                        View on Google Maps
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bb-page bb-paper" aria-label="Reel 7 of 10: Travel Info" data-on={page === 5 ? "1" : "0"}>
              <div className="bb-frame" />
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ left: -30, bottom: -40, width: 260 }} />
              <div className="bb-a bb-travel-photo is-in" style={{ ["--d" as string]: "0.2s" }} />
              <div className="bb-a bb-stamp is-pop" style={{ ["--d" as string]: "0.4s" }}>
                <Glyph d={WAY_ICONS[0]} size={22} />
                <span>{city.toUpperCase()} '{when?.year.slice(2) || "26"}</span>
              </div>
              <div className="bb-scroll">
                <div className="bb-fit is-travel">
                  <h2 className="bb-a bb-head" style={{ ["--d" as string]: "0.15s" }}><span className="a">TRAVEL</span><br /><span className="b">INFORMATION</span></h2>
                  <div className="bb-travel-row">
                    <div className="bb-ways">
                      {ways.map((way, index) => (
                        <div key={way.label} className="bb-a bb-way is-left" style={{ ["--d" as string]: `${0.4 + index * 0.1}s` }}>
                          <i><Glyph d={WAY_ICONS[index] || WAY_ICONS[0]} /></i>
                          <span><strong>{way.label}</strong><span>{way.value}</span></span>
                        </div>
                      ))}
                    </div>
                    <div className="bb-pass" aria-hidden="true">
                      <div className="paper" />
                      <img src={`${ART}/ticket.webp`} alt="" />
                    </div>
                  </div>
                  {phone ? <a className="bb-a bb-pill" style={{ ["--d" as string]: "0.9s" }} href={`tel:${phone}`}>Call our travel desk</a> : null}
                </div>
              </div>
            </section>

            <section className="bb-page bb-paper bb-moments" aria-label="Reel 8 of 10: Our Moments" data-on={page === 6 ? "1" : "0"}>
              <div className="bb-frame" />
              <img className="bb-corner" src={`${ART}/corner.webp`} alt="" style={{ right: -40, bottom: -50, width: 150, transform: "scaleX(-1)" }} />
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ right: -30, bottom: -40, width: 260, transform: "scaleX(-1)" }} />
              <img className="bb-corner is-desk" src={`${ART}/corner.webp`} alt="" style={{ left: -30, top: -40, width: 240, transform: "rotate(180deg)" }} />
              <div className="bb-scroll">
                <div className="bb-fit">
                  <h2 className="bb-a" style={{ ["--d" as string]: "0.15s" }}>Our Moments</h2>
                  <span className="bb-a bb-kicker" style={{ ["--d" as string]: "0.3s", color: "var(--deep)" }}>A few frames from our story · tap to look closer</span>
                  <div className="bb-mem">
                    {shots.map((shot, index) => (
                      <button key={shot.caption} type="button" className="bb-a bb-shot" style={{ ["--d" as string]: `${0.4 + index * 0.06}s` }} onClick={() => setLight(index)}>
                        <b style={{ backgroundImage: `url(${shot.src})`, transform: `rotate(${shot.rotate})` }} />
                        <span>{shot.caption}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bb-page bb-paper bb-rsvp" aria-label="Reel 9 of 10: RSVP" data-on={page === 7 ? "1" : "0"}>
              <div className="bb-frame" />
              <img className="bb-drape is-l" src={`${ART}/drape.webp`} alt="" style={{ left: "-4%" }} />
              <img className="bb-drape is-r" src={`${ART}/drape.webp`} alt="" style={{ right: "-4%" }} />
              <img className="bb-spin" src={`${ART}/reel.webp`} alt="" />
              <img className="bb-rsvp-prop" src={`${ART}/projector.webp`} alt="" />
              <div className="bb-scroll">
                <div className="bb-fit">
                  <h2 className="bb-a" style={{ ["--d" as string]: "0.15s" }}>Will You Be Part<br />Of Our Story?</h2>
                  {by ? <span className="bb-a by" style={{ ["--d" as string]: "0.3s" }}>Kindly RSVP by {by.day} {by.mon} {by.year}</span> : null}
                  <div className="bb-a bb-form" style={{ ["--d" as string]: "0.45s" }}>
                    {done ? (
                      <div className="bb-done">
                        <img src={`${ART}/clap.webp`} alt="" />
                        <strong>{attending ? "Your seat is booked!" : "We will miss you"}</strong>
                        <p>{attending ? `Thank you, ${name.trim()}. ${guests} ticket${guests === 1 ? " is" : "s are"} reserved for the premiere.` : `Thank you for letting us know, ${name.trim()}. We will send you the highlights reel!`}</p>
                        <button type="button" className="bb-pill" onClick={() => setDone(false)}>Change my reply</button>
                      </div>
                    ) : (
                      <form className="bb-field" onSubmit={submit}>
                        <label htmlFor="bb-name">Your name</label>
                        <input id="bb-name" className={error ? "is-bad" : undefined} value={name} placeholder="Meera aunty" onChange={(input) => setName(input.target.value)} />
                        {error ? <span className="err">{error}</span> : null}
                        <div className="bb-choice">
                          <button type="button" className={attending ? "is-on" : undefined} onClick={() => setAttending(true)}><i />Attending</button>
                          <button type="button" className={!attending ? "is-on" : undefined} onClick={() => setAttending(false)}><i />Not attending</button>
                        </div>
                        {attending ? (
                          <div className="bb-guests">
                            <span className="lbl">Guests</span>
                            <div className="bb-step">
                              <button type="button" onClick={() => setGuests((value) => Math.max(1, value - 1))} aria-label="Fewer guests">−</button>
                              <strong>{guests}</strong>
                              <button type="button" onClick={() => setGuests((value) => Math.min(10, value + 1))} aria-label="More guests">+</button>
                            </div>
                          </div>
                        ) : null}
                        <button type="submit" className="bb-send">
                          <i />
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 10h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10zm0-1.5 1.2-4.3a1 1 0 0 1 1.2-.7L20 7.3 19.5 9H3z" fill="#F6D27E" /></svg>
                          <span>Confirm RSVP</span>
                        </button>
                      </form>
                    )}
                  </div>
                  <span className="bb-a bb-cheer" style={{ ["--d" as string]: "1.2s" }}>Can&apos;t wait to celebrate with you! <i>♥</i></span>
                </div>
              </div>
            </section>

            <section className="bb-page bb-finale" aria-label="Reel 10 of 10: See You There" data-on={page === 8 ? "1" : "0"}>
              <div className="bb-stars" aria-hidden="true">
                {STARS.map(([left, top, size, duration, delay]) => (
                  <i key={`${left}-${top}`} className="bb-star" style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, animationDuration: `${duration}s`, animationDelay: `-${delay}s` }} />
                ))}
              </div>
              <div className="bb-panel"><div className="bb-kb" /><div className="fade" /><div className="veil" /></div>
              <div className="bb-scroll">
                <div className="bb-fit">
                  <div className="bb-finale-copy">
                    <h2 className="bb-a" style={{ ["--d" as string]: "0.15s" }}>See You There!</h2>
                    <span className="bb-a sub" style={{ ["--d" as string]: "0.35s" }}>SAME PEOPLE · BIGGER STORY</span>
                    {finaleWhen ? <span className="bb-a when" style={{ ["--d" as string]: "0.5s" }}>{finaleWhen.toUpperCase()}</span> : null}
                    <Count parts={countdown} />
                    <div className="bb-finale-actions">
                      <button type="button" className="bb-gold" onClick={addCalendar}>Add to calendar</button>
                      <button type="button" className="bb-ghost" onClick={share}>Share invite</button>
                    </div>
                  </div>
                  <div className="bb-a bb-clap is-clap" style={{ ["--d" as string]: "0.8s" }}>
                    <div className="board">
                      <img src={`${ART}/clap.webp`} alt="" />
                      <div className="ink"><strong>THE END</strong><span>…or just the beginning <i>♥</i></span></div>
                    </div>
                    <a className="bb-made" href={madeWithHref("blockbuster")}>Made with InvitesReady</a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="bb-chrome">
            <div className="bb-bars">{CHAPTERS.map((chapter, index) => <i key={chapter} className={index <= page ? "is-on" : undefined}><b /></i>)}</div>
            <div className="bb-chap">
              <span>Reel {String(page + 2).padStart(2, "0")} / 10 · {CHAPTERS[page]}</span>
              <button type="button" className="bb-disc" aria-label={playing ? "Pause music" : "Play music"} onClick={toggleMusic}>
                <img className={playing ? "is-on" : undefined} src={`${ART}/reel.webp`} alt="" />
              </button>
            </div>
          </div>
          <button type="button" className={`bb-side is-prev${page === 0 ? " is-off" : ""}`} aria-label="Previous reel" onClick={() => go(page - 1)}>←</button>
          <button type="button" className={`bb-side is-next${page === CHAPTERS.length - 1 ? " is-off" : ""}`} aria-label="Next reel" onClick={() => go(page + 1)}>→</button>
          <div className="bb-nav">
            <button type="button" className={`round${page === 0 ? " is-off" : ""}`} aria-label="Previous reel" onClick={() => go(page - 1)}>←</button>
            <button type="button" className="bb-next" onClick={() => go(page === CHAPTERS.length - 1 ? 0 : page + 1)}>
              <span>{page === CHAPTERS.length - 1 ? "Watch it again" : `Next · ${CHAPTERS[page + 1]}`}</span>
              <i>{page === 0 ? <b className="is-nudge">→</b> : page === CHAPTERS.length - 1 ? "↺" : "→"}</i>
            </button>
          </div>

          {showing ? (
            <div className="bb-modal" role="dialog" aria-modal="true" aria-label={`${showing.title} details`}>
              <div className="bb-card bb-bulbs">
                <div className="sheet">
                  <button type="button" className="x" aria-label="Close" onClick={() => setEvent(null)}>×</button>
                  <div className="still" style={{ backgroundImage: EVENT_ART[event ?? 0] ? `url(${EVENT_ART[event ?? 0]})` : undefined }} />
                  <span className="now">NOW SHOWING</span>
                  <h3>{showing.title}</h3>
                  <span className="when">{[showing.kick, showing.time].filter(Boolean).join(" · ")}</span>
                  <span className="where">{showing.text}</span>
                  {showing.note ? <span className="wear">{showing.note}</span> : null}
                  <div className="row">
                    <button type="button" className="bb-solid" onClick={() => setToast(`${showing.title} added to your calendar.`)}>Add to calendar</button>
                    <button type="button" className="bb-pill" onClick={() => { maps([showing.text, fields.address].filter(Boolean).join(" ")); setToast(`Opening directions to ${showing.text}…`); }}>Directions</button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {photo ? (
            <div className="bb-light" role="dialog" aria-modal="true" aria-label={photo.caption}>
              <button type="button" className="x" aria-label="Close" onClick={() => setLight(null)}>×</button>
              <div className="frame" style={{ backgroundImage: `url(${photo.src})` }} />
              <span className="cap">{photo.caption}</span>
              <div className="row">
                <button type="button" aria-label="Previous photo" onClick={() => setLight((index) => (index == null ? index : (index + shots.length - 1) % shots.length))}>←</button>
                <button type="button" aria-label="Next photo" onClick={() => setLight((index) => (index == null ? index : (index + 1) % shots.length))}>→</button>
              </div>
            </div>
          ) : null}

          {toast ? (
            <div className="bb-toast" role="status">
              <span>{toast}</span>
              <button type="button" onClick={() => setToast("")}>OK</button>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
