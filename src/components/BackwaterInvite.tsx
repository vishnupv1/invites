import { useEffect, useRef, useState, type FormEvent, type TouchEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./backwater.css";

const ART = "/backwater";
const CHAPTERS = ["Our Story", "The Invitation", "Wedding Events", "The Venue", "Travel & Stay", "Our Memories", "RSVP", "A Note from Us", "See You There"];
const STORY_ART = [`${ART}/story-1.webp`, `${ART}/story-2.webp`, `${ART}/story-3.webp`];
const EVENT_ART = [`${ART}/haldi.webp`, `${ART}/mehendi.webp`, `${ART}/wedding.webp`, `${ART}/reception.webp`];
const STAY_ART = [`${ART}/stay.webp`, `${ART}/boat.webp`];
const WAY_ICONS = [
  "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  "M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z",
];
const MEMORIES = [
  { src: "photo-1.webp", label: "first glance", mask: "arch", turn: -2.5 },
  { src: "photo-2.webp", label: "coffee dates", mask: "wide", turn: 2 },
  { src: "photo-3.webp", label: "Munnar mornings", mask: "round", turn: -1.5 },
  { src: "photo-4.webp", label: "the proposal", mask: "round", turn: 2.5 },
  { src: "photo-5.webp", label: "family blessings", mask: "arch", turn: -2 },
  { src: "photo-6.webp", label: "forever begins", mask: "wide", turn: 1.5 },
];
const PETAL_COLORS = ["#F4A7B5", "#EE8FA3", "#F7C6CF", "#FFFFFF", "#F2B6A0"];
const PETALS = Array.from({ length: 12 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  width: 10 + (index % 4) * 2,
  height: 7 + (index % 3),
  color: PETAL_COLORS[index % PETAL_COLORS.length],
  dx: `${((index % 5) - 2) * 24}px`,
  rot: `${240 + index * 37}deg`,
  delay: `${-(index * 0.7)}s`,
}));
const STARS = Array.from({ length: 26 }, (_, index) => ({
  left: `${(index * 53) % 100}%`,
  top: 60 + (index % 16) * 29,
  size: 2 + (index % 3),
  delay: `${-((index * 0.7) % 3)}s`,
  duration: `${2.5 + (index % 4) * 0.8}s`,
}));
const FLIES = Array.from({ length: 10 }, (_, index) => ({
  left: `${6 + (index * 31) % 78}%`,
  top: 600 + (index % 4) * 47,
  delay: `${-index}s`,
  duration: `${6 + (index % 5)}s`,
}));

type Reply = { name: string; note: string; attending: boolean };

function pairOf(names: string) {
  const parts = names.split("&").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { first: names.trim(), second: "" };
  return { first: parts.slice(0, -1).join(" & "), second: parts[parts.length - 1] };
}

function tagOf(names: string) {
  const parts = names.split("&").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
  return parts.length >= 2 ? `#${parts[0]}Weds${parts[1]}` : "";
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

function replyBy(iso: string) {
  const when = whenOf(iso);
  return when ? `${when.day} ${when.monthName}` : "";
}

function spokenTime(time: string) {
  if (!time || time.startsWith("16:")) return "four in the evening";
  return formatTime(time);
}

function shortTime(time: string) {
  return formatTime(time).replace(":00", "");
}

function placeOf(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) return { city: parts[parts.length - 2], region: parts[parts.length - 1], full: parts.join(" · ") };
  if (parts.length === 2) return { city: parts[0], region: parts[1], full: parts.join(" · ") };
  return { city: parts[0] ?? "", region: "", full: parts[0] ?? "" };
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

function Petals() {
  return (
    <div className="bw-petals" aria-hidden="true">
      {PETALS.map((petal) => (
        <span
          key={`${petal.left}-${petal.delay}`}
          className="bw-petal"
          style={{
            left: petal.left,
            width: petal.width,
            height: petal.height,
            background: `linear-gradient(135deg, ${petal.color}, #E57A93)`,
            ["--dx" as string]: petal.dx,
            ["--fy" as string]: "960px",
            ["--rot" as string]: petal.rot,
            animationDelay: petal.delay,
          }}
        />
      ))}
    </div>
  );
}

function Count({ parts, night = false }: { parts: ReturnType<typeof useCountdown>; night?: boolean }) {
  if (!parts) return null;
  return (
    <div className="bw-count">
      {parts.map(([value, label], index) => (
        <div key={label}>
          <strong className={night && index === 3 ? "is-tick" : ""}>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function BackwaterInvite({
  fields,
  quiet = false,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  useFonts("Cormorant Garamond", "Great Vibes", "Jost");
  const pack = packOf("backwater", fields.lines);
  const couple = pairOf(fields.names);
  const parents = fields.hosts.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const when = whenOf(fields.date);
  const countdown = useCountdown(fields.date, fields.time);
  const live = Boolean(onReply);
  const guest = fields.detail.replace(/^dear\s+/i, "").replace(/,+\s*$/, "").trim() || "friend";
  const place = placeOf(fields.address);
  const letter = (fields.message || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const beats = pack.story ?? [];
  const events = pack.programme ?? [];
  const ways = pack.facts ?? [];
  const stays = pack.rooms ?? [];
  const photos = MEMORIES.map((shot, index) => ({
    ...shot,
    url: fields.photos?.[index] ? assetUrl(fields.photos[index]) : live ? "" : `${ART}/${shot.src}`,
  })).filter((shot) => shot.url);

  const trackRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [begun, setBegun] = useState(false);
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<Record<number, boolean>>({});
  const [cruise, setCruise] = useState(false);
  const [music, setMusic] = useState(false);
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [light, setLight] = useState(-1);

  function go(next: number) {
    const index = Math.max(0, Math.min(CHAPTERS.length - 1, next));
    const track = trackRef.current;
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: quiet ? "auto" : "smooth" });
    setPage(index);
  }

  useEffect(() => {
    if (!begun) return;
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      setPage((current) => (current === index ? current : index));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [begun]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (light >= 0) {
        if (event.key === "Escape") setLight(-1);
        if (event.key === "ArrowRight") setLight((value) => (value + 1) % photos.length);
        if (event.key === "ArrowLeft") setLight((value) => (value + photos.length - 1) % photos.length);
        return;
      }
      if (!begun) {
        if (event.key === "ArrowRight" || event.key === "Enter") setBegun(true);
        return;
      }
      if (event.key === "ArrowRight") go(page >= CHAPTERS.length - 1 ? 0 : page + 1);
      if (event.key === "ArrowLeft") go(page - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function beginFromSwipe(event: TouchEvent) {
    const point = event.changedTouches[0];
    const start = touch.current;
    touch.current = null;
    if (!point || !start) return;
    if (point.clientX - start.x < -50 || point.clientY - start.y < -70) setBegun(true);
  }

  async function toggleMusic() {
    const node = audioRef.current;
    if (!node) {
      setToast(music ? "Music paused." : "Now playing: our song.");
      setMusic((value) => !value);
      return;
    }
    try {
      if (music) {
        node.pause();
        setMusic(false);
        setToast("Music paused.");
      } else {
        await node.play();
        setMusic(true);
        setToast("Now playing: our song.");
      }
    } catch {
      setToast("Music could not play in this browser.");
    }
  }

  function openCalendar(all = false) {
    const url = calendarUrl(fields);
    if (url && !all) window.open(url, "_blank", "noopener,noreferrer");
    const whenLabel = when ? `${when.day} ${when.mon}` : "the wedding day";
    setToast(all ? "All four celebrations added to your calendar." : `Wedding added to your calendar — ${whenLabel}, ${shortTime(fields.time) || "4 PM"}.`);
  }

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* the toast still confirms the gesture */
    }
    setToast("Invite link copied — share it with family!");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const yes = attend === "yes";
    try {
      await onReply?.({
        name: name.trim(),
        note: yes ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "",
        attending: yes,
      });
      setDone(true);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not send that reply.");
    }
  }

  const night = page === CHAPTERS.length - 1;
  const mapQuery = encodeURIComponent([fields.venue, fields.address].filter(Boolean).join(" ") || "Punnamada Lake Alleppey Kerala");

  return (
    <article className={`bw${begun && night ? " is-night" : ""}`} data-motion={quiet ? "off" : "on"}>
      {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop preload="none" /> : null}
      {begun ? (
        <>
          <div className="bw-track" ref={trackRef}>
            <section className="bw-page bw-paper" data-on={page === 0 ? "1" : "0"} aria-label="Page 2 of 10: Our Story">
              <img className="bw-garland" src={`${ART}/garland.webp`} alt="" />
              <img className="bw-corner is-story" src={`${ART}/corner.webp`} alt="" />
              <Petals />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.1s" }}>Chapter one</span>
                  <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.25s" }}>Our Story</h2>
                  <p className="bw-a bw-lead" style={{ ["--d" as string]: "0.5s" }}>Every love story is beautiful, but ours is our favourite.</p>
                  <div className="bw-story">
                    {beats.map((beat, index) => (
                      <figure key={beat.title} className={`bw-a bw-beat${index % 2 ? " is-flip" : ""}`} style={{ ["--d" as string]: `${0.7 + index * 0.35}s` }}>
                        {STORY_ART[index] ? <img src={STORY_ART[index]} alt="" /> : null}
                        <figcaption>
                          <strong>{beat.title}</strong>
                          {beat.year ? <em>{beat.year}</em> : null}
                          {beat.text ? <span>{beat.text}</span> : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bw-page bw-paper bw-invite" data-on={page === 1 ? "1" : "0"} aria-label="Page 3 of 10: The Invitation">
              <div className="bw-panel"><div className="bw-kb" style={{ backgroundImage: `url(${ART}/invite.webp)` }} /></div>
              <div className="bw-veil" />
              <img className="bw-garland is-desk" src={`${ART}/garland.webp`} alt="" />
              <img className="bw-corner is-desk is-r" src={`${ART}/corner.webp`} alt="" />
              <Petals />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.15s" }}>{fields.title || "Together with their families"}</span>
                  <span className="bw-script bw-write name" style={{ ["--d" as string]: "0.4s" }}>{couple.first}</span>
                  {parents[0] ? <span className="bw-a parent" style={{ ["--d" as string]: "0.9s" }}>{parents[0]}</span> : null}
                  {couple.second ? <span className="bw-a bw-script amp is-pop" style={{ ["--d" as string]: "1.1s" }}>&</span> : null}
                  {couple.second ? <span className="bw-script bw-write name" style={{ ["--d" as string]: "1.3s" }}>{couple.second}</span> : null}
                  {parents[1] ? <span className="bw-a parent" style={{ ["--d" as string]: "1.8s" }}>{parents[1]}</span> : null}
                  <span className="bw-a ask" style={{ ["--d" as string]: "2s" }}>request the pleasure of your company<br />to celebrate their wedding</span>
                  {when ? (
                    <span className="bw-a bw-date" style={{ ["--d" as string]: "2.3s" }}>
                      <b>{when.weekday}</b>
                      <strong>{when.day}</strong>
                      <b>{when.mon} {when.year}</b>
                    </span>
                  ) : null}
                  <span className="bw-a bw-when" style={{ ["--d" as string]: "2.45s" }}>{spokenTime(fields.time)}</span>
                  {fields.venue || place.city ? (
                    <span className="bw-a bw-kicker" style={{ ["--d" as string]: "2.6s" }}>
                      {fields.venue}{place.city ? ` · ${place.city}` : ""}{place.region ? <span className="is-more"> · {place.region}</span> : null}
                    </span>
                  ) : null}
                  <div className="bw-a bw-invite-extra" style={{ ["--d" as string]: "2.9s" }}>
                    <Count parts={countdown} />
                    <button type="button" className="bw-pill" onClick={() => openCalendar()}>Add to calendar</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bw-page bw-paper bw-events-page" data-on={page === 2 ? "1" : "0"} aria-label="Page 4 of 10: Wedding Events">
              <img className="bw-garland" src={`${ART}/garland.webp`} alt="" style={{ opacity: 0.9 }} />
              <img className="bw-corner is-desk is-l" src={`${ART}/corner.webp`} alt="" />
              <img className="bw-corner is-desk is-r" src={`${ART}/corner.webp`} alt="" />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.1s" }}>Chapter three</span>
                  <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.25s" }}>Wedding Events</h2>
                  <p className="bw-a bw-lead" style={{ ["--d" as string]: "0.5s" }}>Two days of colour, music & love — tap a card to peek inside.</p>
                  <div className="bw-events">
                    {events.map((item, index) => {
                      const on = Boolean(flip[index]);
                      return (
                        <button
                          key={`${item.title}-${index}`}
                          type="button"
                          className={`bw-a bw-card${on ? " is-on" : ""}`}
                          style={{ ["--d" as string]: `${0.6 + index * 0.15}s` }}
                          aria-pressed={on}
                          aria-label={`${item.title}, ${item.kick ?? ""}, ${item.time}. ${on ? "Showing details, tap to flip back" : "Tap for venue and dress code"}`}
                          onClick={() => setFlip((current) => ({ ...current, [index]: !current[index] }))}
                        >
                          <i>
                            <span className="bw-face is-front">
                              {EVENT_ART[index] ? <img src={EVENT_ART[index]} alt="" /> : null}
                              <strong>{item.title}</strong>
                              {item.kick ? <small>{item.kick}</small> : null}
                              {item.time ? <em>{item.time}</em> : null}
                            </span>
                            <span className="bw-face is-back">
                              <strong>{item.title}</strong>
                              <small>Where</small>
                              <b>{item.text}</b>
                              <small>Wear</small>
                              <em>{item.note}</em>
                              <span className="hint">tap to flip back ↺</span>
                            </span>
                          </i>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" className="bw-a bw-pill" style={{ ["--d" as string]: "1.9s" }} onClick={() => openCalendar(true)}>Add all to my calendar</button>
                </div>
              </div>
            </section>

            <section className="bw-page bw-paper bw-venue" data-on={page === 3 ? "1" : "0"} aria-label="Page 5 of 10: The Venue">
              <img className="bw-corner is-desk is-l" src={`${ART}/corner.webp`} alt="" />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <div className="bw-venue-body">
                    <div className="bw-a bw-venue-photo is-fade" style={{ ["--d" as string]: "0s" }}><div className="bw-kb" /></div>
                    <div className="bw-venue-copy">
                      <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.2s" }}>The Venue</h2>
                      <span className="bw-a bw-venue-name" style={{ ["--d" as string]: "0.4s" }}>{fields.venue}</span>
                      {place.full ? <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.5s" }}>{place.full}</span> : null}
                    </div>
                    <div className="bw-a bw-map is-pop" style={{ ["--d" as string]: "0.6s" }}>
                      <div className="ground" />
                      <svg className="route-svg" viewBox="0 0 1400 901" preserveAspectRatio="none" aria-hidden="true">
                        <path className="bw-route" d="M157 788 C 220 700, 330 640, 440 628 S 575 600, 575 505 S 590 380, 680 322 S 880 262, 965 246" pathLength={400} fill="none" stroke="#C2677A" strokeWidth="10" strokeLinecap="round" strokeDasharray="400" style={{ ["--d" as string]: "1.2s", ["--len" as string]: 400 }} />
                        <circle r="16" fill="#FFFFFF" stroke="#C2677A" strokeWidth="6">
                          <animateMotion dur="6s" repeatCount="indefinite" path="M157 788 C 220 700, 330 640, 440 628 S 575 600, 575 505 S 590 380, 680 322 S 880 262, 965 246" rotate="auto" />
                        </circle>
                      </svg>
                      <span className="bw-chip is-from">From Kochi</span>
                      <div className="bw-pin" style={{ ["--d" as string]: "0.9s" }}>
                        <span className="ripple" />
                        <svg viewBox="0 0 34 44" aria-hidden="true">
                          <path d="M17 43 C 17 43, 2 26, 2 16 A 15 15 0 0 1 32 16 C 32 26, 17 43, 17 43 Z" fill="#C2677A" stroke="#FFFFFF" strokeWidth="2" />
                          <path d="M17 23 C 12 19, 10.5 16.5, 12 14.2 C 13.5 12.2, 16 12.8, 17 14.8 C 18 12.8, 20.5 12.2, 22 14.2 C 23.5 16.5, 22 19, 17 23 Z" fill="#FFFFFF" />
                        </svg>
                      </div>
                      <span className="bw-chip is-here">{fields.venue || "Lakeview Resort"}</span>
                    </div>
                    <div className="bw-a bw-venue-go" style={{ ["--d" as string]: "1s" }}>
                      <span className="bw-kicker" style={{ color: "var(--gold)" }}>Getting there</span>
                      <div className="bw-ways">
                        {ways.map((item, index) => (
                          <div key={item.label}>
                            <i><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={WAY_ICONS[index] ?? WAY_ICONS[2]} fill="#9C4A5E" /></svg></i>
                            <b>{item.label}</b>
                            <span>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <a className="bw-a bw-pill is-solid bw-venue-link" style={{ ["--d" as string]: "1.6s" }} href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor" /></svg>
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="bw-page bw-paper" data-on={page === 4 ? "1" : "0"} aria-label="Page 6 of 10: Travel & Stay">
              <img className="bw-garland" src={`${ART}/garland.webp`} alt="" style={{ opacity: 0.9 }} />
              <img className="bw-corner is-desk is-l" src={`${ART}/corner.webp`} alt="" />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.1s" }}>Chapter five</span>
                  <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.25s" }}>Travel & Stay</h2>
                  <p className="bw-a bw-lead" style={{ ["--d" as string]: "0.45s" }}>Stay a little longer and let the backwaters slow you down.</p>
                  <div className="bw-stay">
                    {stays.map((item, index) => (
                      <figure key={item.name} className="bw-a" style={{ ["--d" as string]: `${0.7 + index * 0.3}s` }}>
                        {STAY_ART[index] ? <img src={STAY_ART[index]} alt="" /> : null}
                        <figcaption>
                          <strong>{item.name}</strong>
                          <p>{item.text}</p>
                          {item.note.startsWith("tel:") ? (
                            <a className="bw-pill" href={item.note}>Call the resort</a>
                          ) : (
                            <button
                              type="button"
                              className={`bw-pill${cruise ? " is-on" : ""}`}
                              aria-pressed={cruise}
                              onClick={() => {
                                setCruise((value) => !value);
                                setToast(cruise ? "" : "Lovely! We have saved you a seat on the houseboat.");
                              }}
                            >
                              {cruise ? "♥ You are on board" : "Count me in"}
                            </button>
                          )}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bw-page bw-paper" data-on={page === 5 ? "1" : "0"} aria-label="Page 7 of 10: Our Memories">
              <img className="bw-garland" src={`${ART}/garland.webp`} alt="" style={{ opacity: 0.85 }} />
              <img className="bw-corner is-desk is-l" src={`${ART}/corner.webp`} alt="" />
              <img className="bw-corner is-desk is-r" src={`${ART}/corner.webp`} alt="" />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.1s" }}>Chapter six</span>
                  <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.25s" }}>Our Memories</h2>
                  <p className="bw-a bw-lead" style={{ ["--d" as string]: "0.45s" }}>A few favourite frames from our journey — tap one to look closer.</p>
                  <div className="bw-mem">
                    {photos.map((shot, index) => (
                      <button
                        key={shot.label}
                        type="button"
                        className={`bw-a bw-shot is-pop is-${shot.mask}`}
                        style={{ ["--d" as string]: `${0.5 + index * 0.15}s`, transform: `rotate(${shot.turn}deg)` }}
                        aria-label={`Open photo: ${shot.label}`}
                        onClick={() => setLight(index)}
                      >
                        <b style={{ backgroundImage: `url(${shot.url})` }} />
                        <span>{shot.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bw-page bw-paper bw-rsvp" data-on={page === 6 ? "1" : "0"} aria-label="Page 8 of 10: RSVP">
              <div className="bw-panel"><div className="bw-kb" style={{ backgroundImage: `url(${ART}/rsvp.webp)` }} /></div>
              <div className="bw-veil" />
              <img className="bw-garland is-desk" src={`${ART}/garland.webp`} alt="" />
              <img className="bw-corner is-desk is-l" src={`${ART}/corner.webp`} alt="" />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.1s" }}>{replyBy(fields.rsvpBy) ? `Kindly reply by ${replyBy(fields.rsvpBy)}` : "Kindly reply"}</span>
                  <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.25s" }}>Will You Be There?</h2>
                  <p className="bw-a bw-lead" style={{ ["--d" as string]: "0.45s" }}>Your presence would make our day complete.</p>
                  <div className="bw-a bw-form" style={{ ["--d" as string]: "0.6s" }}>
                    {done ? (
                      <div className="bw-done">
                        <span className="bw-heart" aria-hidden="true">♥</span>
                        <strong>{attend === "yes" ? "See you in Alleppey!" : "We will miss you"}</strong>
                        <p>
                          {attend === "yes"
                            ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you by the lake.`
                            : `Thank you for letting us know, ${name.trim()}. We will send you photos and sweets!`}
                        </p>
                        <button type="button" className="bw-pill" onClick={() => setDone(false)}>Change my reply</button>
                      </div>
                    ) : (
                      <form className="bw-field" onSubmit={submit}>
                        <label htmlFor="bw-name">Your name</label>
                        <input id="bw-name" className={nameError ? "is-bad" : ""} value={name} placeholder="Family or guest name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                        {nameError ? <span className="err">Please write your name so we know who's coming.</span> : null}
                        <div className="bw-choice">
                          <button type="button" className={attend === "yes" ? "is-on" : ""} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                          <button type="button" className={attend === "no" ? "is-on" : ""} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
                        </div>
                        {attend === "yes" ? (
                          <div className="bw-guests">
                            <span className="lbl">Guests</span>
                            <div className="bw-step">
                              <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                              <strong>{guests}</strong>
                              <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                            </div>
                          </div>
                        ) : null}
                        <button type="submit" className="bw-send"><i /><span>Send my RSVP</span></button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="bw-page bw-paper bw-note" data-on={page === 7 ? "1" : "0"} aria-label="Page 9 of 10: A Note from Us">
              <Petals />
              <img className="bw-garland is-desk" src={`${ART}/garland.webp`} alt="" style={{ opacity: 0.8 }} />
              <img className="bw-corner is-note" src={`${ART}/corner.webp`} alt="" />
              <img className="bw-corner is-desk is-l" src={`${ART}/corner.webp`} alt="" />
              <img className="bw-corner is-desk is-r" src={`${ART}/corner.webp`} alt="" />
              <div className="bw-scroll">
                <div className="bw-fit">
                  <div className="bw-note-row">
                    <div className="bw-note-intro">
                      <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.1s" }}>Chapter eight</span>
                      <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.25s" }}>A Note from Us</h2>
                      <p className="bw-a bw-lead" style={{ ["--d" as string]: "0.5s" }}>Read it slowly — every word comes straight from our hearts.</p>
                    </div>
                    <div className="bw-a bw-letter is-unfold" style={{ ["--d" as string]: "0.35s" }}>
                      <div className="sheet" />
                      <div className="ink">
                        <span className="bw-script bw-write dear" style={{ ["--d" as string]: "1s" }}>Dear family & friends,</span>
                        {letter.map((paragraph, index) => (
                          <p key={paragraph} className={`bw-a${letter.length >= 3 && index === letter.length - 1 ? " is-close" : ""}`} style={{ ["--d" as string]: `${1.8 + index * 0.5}s` }}>{paragraph}</p>
                        ))}
                        <span>
                          <span className="bw-a" style={{ ["--d" as string]: "3.3s", fontStyle: "italic", color: "var(--muted)" }}>With love,</span>
                          <span className="bw-script bw-write sign" style={{ ["--d" as string]: "3.6s" }}>{fields.names}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bw-page bw-finale" data-on={page === 8 ? "1" : "0"} aria-label="Page 10 of 10: See You There">
              <div className="bw-panel"><div className="bw-kb" /></div>
              <div className="bw-night-sky" aria-hidden="true">
                {STARS.map((star) => (
                  <span key={`${star.left}-${star.top}`} className="bw-star" style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDuration: star.duration, animationDelay: star.delay }} />
                ))}
                {FLIES.map((fly) => (
                  <span key={`${fly.left}-${fly.top}`} className="bw-fly" style={{ left: fly.left, top: fly.top, animationDuration: fly.duration, animationDelay: fly.delay }} />
                ))}
              </div>
              <div className="bw-stars" aria-hidden="true">
                {STARS.map((star) => (
                  <span key={`m-${star.left}-${star.top}`} className="bw-star" style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDuration: star.duration, animationDelay: star.delay }} />
                ))}
                {FLIES.map((fly) => (
                  <span key={`m-${fly.left}-${fly.top}`} className="bw-fly" style={{ left: fly.left, top: fly.top, animationDuration: fly.duration, animationDelay: fly.delay }} />
                ))}
              </div>
              <span className="bw-glow is-a" />
              <span className="bw-glow is-b" />
              <div className="shade" />
              <div className="bw-lanterns" aria-hidden="true">
                <img className="a" src={`${ART}/lantern.webp`} alt="" />
                <img className="b" src={`${ART}/lantern.webp`} alt="" />
                <img className="c" src={`${ART}/lantern.webp`} alt="" />
              </div>
              <div className="bw-scroll">
                <div className="bw-fit">
                  <h2 className="bw-h bw-write" style={{ ["--d" as string]: "0.2s" }}>See You There!</h2>
                  <p className="bw-a bw-lead" style={{ ["--d" as string]: "0.5s" }}>We can’t wait to celebrate with you under the lanterns.</p>
                  {when ? <span className="bw-a bw-tag" style={{ ["--d" as string]: "0.7s" }}>{when.weekday} · {when.day} {when.monthName} {when.year} · {shortTime(fields.time) || "4 PM"}</span> : null}
                  <div className="bw-a" style={{ ["--d" as string]: "0.9s" }}><Count parts={countdown} night /></div>
                  <div className="bw-a bw-finale-actions" style={{ ["--d" as string]: "1.2s" }}>
                    <button type="button" className="bw-gold" onClick={() => openCalendar()}>Add to calendar</button>
                    <button type="button" className="bw-ghost" onClick={share}>Share invite</button>
                  </div>
                  <span className="bw-a bw-love" style={{ ["--d" as string]: "1.5s" }}>with love,</span>
                  <span className="bw-script bw-write names" style={{ ["--d" as string]: "1.7s" }}>{fields.names}</span>
                  {tagOf(fields.names) ? <span className="bw-a bw-tag" style={{ ["--d" as string]: "2.2s" }}>{tagOf(fields.names)}</span> : null}
                  <a className="bw-a bw-made" style={{ ["--d" as string]: "2.4s" }} href={madeWithHref("backwater")}>Made with InvitesReady</a>
                </div>
              </div>
            </section>
          </div>

          <div className="bw-chrome">
            <div className="bw-bars">
              {CHAPTERS.map((label, index) => (
                <i key={label} className={index <= page ? "is-on" : ""}><b /></i>
              ))}
            </div>
            <div className="bw-chap">
              <span>{String(page + 2).padStart(2, "0")} / 10 · {CHAPTERS[page]}</span>
              <button type="button" className="bw-disc" aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={toggleMusic}>
                <svg className={music ? "is-on" : ""} width="26" height="26" viewBox="0 0 30 30" aria-hidden="true">
                  <circle cx="15" cy="15" r="14" fill="#9C4A5E" />
                  <circle cx="15" cy="15" r="10" fill="none" stroke="#F2CFC8" strokeWidth="1" />
                  <circle cx="15" cy="15" r="5" fill="#F1D9A0" />
                  <circle cx="15" cy="15" r="1.5" fill="#FFFFFF" />
                </svg>
              </button>
            </div>
          </div>
          <button type="button" className={`bw-side is-prev${page === 0 ? " is-off" : ""}`} aria-label="Previous page" onClick={() => go(page - 1)}>←</button>
          <button type="button" className={`bw-side is-next${page >= CHAPTERS.length - 1 ? " is-off" : ""}`} aria-label="Next page" onClick={() => go(page >= CHAPTERS.length - 1 ? 0 : page + 1)}>→</button>
          <nav className="bw-nav" aria-label="Story pages">
            <button type="button" className={`round${page === 0 ? " is-off" : ""}`} aria-label="Previous page" onClick={() => go(page - 1)}>←</button>
            <button type="button" className="bw-next" onClick={() => go(page >= CHAPTERS.length - 1 ? 0 : page + 1)}>
              <span>{page >= CHAPTERS.length - 1 ? "Read it again" : `Next · ${CHAPTERS[page + 1]}`}</span>
              <i><b className={page === 0 ? "is-nudge" : ""}>{page >= CHAPTERS.length - 1 ? "↺" : "→"}</b></i>
            </button>
          </nav>
          {light >= 0 && photos[light] ? (
            <div className="bw-light" role="dialog" aria-modal="true" aria-label="Photo viewer">
              <button type="button" className="x" aria-label="Close photo" onClick={() => setLight(-1)}>×</button>
              <div className="frame" style={{ backgroundImage: `url(${photos[light].url})` }} />
              <span className="cap">{photos[light].label}</span>
              <div className="row">
                <button type="button" aria-label="Previous photo" onClick={() => setLight((value) => (value + photos.length - 1) % photos.length)}>←</button>
                <span>{light + 1} / {photos.length}</span>
                <button type="button" aria-label="Next photo" onClick={() => setLight((value) => (value + 1) % photos.length)}>→</button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div
          className="bw-cover"
          data-on="1"
          onTouchStart={(event) => {
            const point = event.touches[0];
            if (point) touch.current = { x: point.clientX, y: point.clientY };
          }}
          onTouchEnd={beginFromSwipe}
        >
          <div className="bw-cover-photo">
            <div className="bw-kb" />
            <div className="bw-cover-fade" />
          </div>
          <div className="bw-cover-glow" />
          <img className="bw-garland" src={`${ART}/garland.webp`} alt="" />
          <img className="bw-corner" src={`${ART}/corner.webp`} alt="" />
          <Petals />
          <div className="bw-cover-copy">
            <span className="bw-a dear is-fade" style={{ ["--d" as string]: "0.3s" }}>Dear {guest},</span>
            <span className="bw-a bw-kicker" style={{ ["--d" as string]: "0.6s" }}>our story is about to begin</span>
            <span className="bw-script bw-write line" style={{ ["--d" as string]: "1s" }}>We're Getting</span>
            <span className="bw-script bw-write line is-big" style={{ ["--d" as string]: "2.1s" }}>Married!</span>
            <span className="bw-a bw-rule" style={{ ["--d" as string]: "3s" }} aria-hidden="true"><s /><span className="bw-heart">♥</span><s /></span>
            <span className="bw-a who" style={{ ["--d" as string]: "3.2s" }}>{fields.names}</span>
            {when ? <span className="bw-a bw-kicker" style={{ ["--d" as string]: "3.4s" }}>{when.day} · {when.month} · {when.year}{place.city ? ` · ${place.city}` : ""}</span> : null}
          </div>
          <div className="bw-cover-foot">
            <div className="bw-finger" aria-hidden="true"><span>☝</span></div>
            <button type="button" className="bw-go" aria-label="Swipe or tap to begin our story" onClick={() => setBegun(true)}>
              <span>Swipe to begin</span>
              <i><b>→</b></i>
            </button>
            <span className="bw-keys">or press → on your keyboard</span>
          </div>
        </div>
      )}
      {toast ? (
        <div className="bw-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </article>
  );
}
