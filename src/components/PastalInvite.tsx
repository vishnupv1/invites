import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import { CornerMark, LotusBloom, Palace, PaperFilters, PaperScene } from "./pastal-art";
import "./pastal.css";

export type PastalTheme = "ivory" | "blush" | "sage";

type Reply = { name: string; note: string; attending: boolean };

const ICONS: Record<string, string> = {
  haldi: "M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  mehendi: "M5 19C5 10 11 4 20 4c0 9-6 15-15 15zM5 19l10-10M9 15h4M12 12V8",
  sangeet: "M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  wedding: "M8.5 15a4.5 4.5 0 1 0 0-.01M15.5 15a4.5 4.5 0 1 0 0-.01M12 4l2 3h-4z",
  reception: "M7 3l1 6a2.5 2.5 0 0 1-5 0l1-6zM20 3l1 6a2.5 2.5 0 0 1-5 0l1-6zM5.5 11.5v8M18.5 11.5v8M3 20h5M16 20h5",
};

function iconFor(title: string) {
  const key = title.toLowerCase();
  if (key.includes("haldi")) return ICONS.haldi;
  if (key.includes("mehendi") || key.includes("mehndi")) return ICONS.mehendi;
  if (key.includes("sangeet")) return ICONS.sangeet;
  if (key.includes("reception")) return ICONS.reception;
  return ICONS.wedding;
}

function when(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function dottedDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${day.getDate()} · ${month} · ${day.getFullYear()}`;
}

function shortDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(day.getDate())} · ${pad(day.getMonth() + 1)} · ${day.getFullYear()}`;
}

function cityOf(address: string, venue: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0] || venue;
}

function monogram(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { a: (parts[0]?.[0] ?? "A").toUpperCase(), b: (parts[1]?.[0] ?? "").toUpperCase() };
}

function NameLine({ names }: { names: string }) {
  const parts = names.split(/\s+&\s+/);
  if (parts.length < 2) return <>{names || "The couple"}</>;
  return (
    <>
      {parts[0]} <span className="pt-amp-inline">&amp;</span> {parts.slice(1).join(" & ")}
    </>
  );
}

function Seal({ names }: { names: string }) {
  const mark = monogram(names);
  return (
    <>
      <span className="pt-ring-dash" />
      <span className="pt-mono">
        {mark.a}
        {mark.b ? <i>&amp;</i> : null}
        {mark.b}
      </span>
    </>
  );
}

export function PastalInvite({
  fields,
  theme = "ivory",
  onReply,
}: {
  fields: InviteFields;
  theme?: PastalTheme;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond", "Jost");
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nameId = useId();
  const noteId = useId();
  const raw = useId().replace(/:/g, "");
  const emboss = `pt-emboss-${raw}`;
  const deboss = `pt-deboss-${raw}`;
  const grain = `pt-grain-${raw}`;
  const [desk, setDesk] = useState(false);
  const [live, setLive] = useState(false);
  const [cover, setCover] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");

  const pack = packOf("pastal", fields.lines);
  const photos = (fields.photos ?? []).filter(Boolean);
  const events: ProgrammeItem[] = pack.programme?.length
    ? pack.programme
    : [{ kick: dottedDate(fields.date), title: "The wedding", time: formatTime(fields.time), text: fields.venue, note: fields.dress }];
  const story = pack.story ?? [];
  const parents = pack.people ?? [];
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const mapQuery = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : place;
  const petals = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        left: `${(index * 12 + 6) % 92}%`,
        size: 12 + (index % 3) * 5,
        duration: `${14 + (index % 4) * 3}s`,
        delay: `-${index * 2.1}s`,
      })),
    [],
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => setDesk((node.clientWidth || window.innerWidth) >= 860);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function openSeal() {
    if (live) return;
    if (reduced()) {
      setLive(true);
      setCover(false);
      return;
    }
    setLive(true);
    timers.current.push(window.setTimeout(() => setCover(false), 2600));
  }

  function replay() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setLive(false);
    setCover(true);
    rootRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }

  function directions(label: string) {
    const query = label ? `${label} ${fields.address}` : mapQuery;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
  }

  async function submit() {
    if (!name.trim()) {
      setNameErr(true);
      return;
    }
    const yes = attend === "yes";
    const chosen = events.filter((_, index) => picked[index] !== false).map((item) => item.title);
    const note = [
      msg.trim(),
      yes ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
      yes && chosen.length ? `Joining: ${chosen.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    try {
      await onReply?.({ name: name.trim(), note, attending: yes });
      setDone(true);
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : "Could not send your reply.");
    }
  }

  const target = new Date(`${fields.date || "2027-01-23"}T${fields.time || "18:00"}:00+05:30`).getTime();
  let left = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(left / 86400);
  left %= 86400;
  const count = [days, Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60];
  const first = name.trim().split(" ")[0];
  const corner = desk ? 70 : 46;

  return (
    <div
      ref={rootRef}
      className={desk ? `pt is-desk${live ? " is-live" : ""}` : `pt${live ? " is-live" : ""}`}
      data-theme={theme}
      data-motion={reduced() ? "off" : "on"}
      style={{ ["--emboss" as string]: `url(#${emboss})`, ["--deboss" as string]: `url(#${deboss})` }}
    >
      <PaperFilters emboss={emboss} deboss={deboss} grain={grain} />
      <section className="pt-stage">
        <div className="pt-scene-wrap">
          <PaperScene desk={desk} grain={grain} />
        </div>
        {petals.map((petal) => (
          <span key={petal.left + petal.delay} className="pt-petal" style={{ left: petal.left, animationDuration: petal.duration, animationDelay: petal.delay, ["--fy" as string]: "920px" }} aria-hidden="true">
            <svg width={petal.size} height={petal.size} viewBox="0 0 20 20">
              <path className="r" d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" />
            </svg>
          </span>
        ))}
        <div className="pt-hero">
          <span className="pt-kick pt-fu1">{fields.hosts || "Together with their families"}</span>
          <h1 className="pt-names">
            <NameLine names={fields.names} />
          </h1>
          <span className="pt-date pt-fu3">{dottedDate(fields.date)}</span>
          <span className="pt-venue-line pt-fu4">{place}</span>
        </div>
        {!cover ? (
          <a className="pt-scroll" href="#celebrations">
            SCROLL TO CONTINUE
            <br />↓
          </a>
        ) : null}
        {cover ? (
          <div className="pt-cover">
            {(["l", "r"] as const).map((side) => (
              <div key={side} className={`pt-half ${side}`}>
                <div className={`pt-frame ${side}`} />
                <span className={`pt-corner ${side === "l" ? "tl" : "tr"}`}>
                  <CornerMark size={corner} />
                </span>
                <span className={`pt-corner ${side === "l" ? "bl" : "br"}`}>
                  <CornerMark size={corner} />
                </span>
                <span className="pt-shade" />
              </div>
            ))}
            <div className="pt-ribbon" />
            <div className="pt-tag-wrap">
              <span className="pt-loop" />
              <div className="pt-tag">
                <Seal names={fields.names} />
              </div>
            </div>
            {!live ? (
              <>
                <span className="pt-pulse" aria-hidden="true" />
                <span className="pt-hint">
                  SOMETHING BEAUTIFUL IS WRAPPED INSIDE
                  <br />
                  <strong>TAP THE SEAL</strong>
                </span>
              </>
            ) : null}
          </div>
        ) : null}
        {cover && !live ? <button type="button" className="pt-hit" aria-label="Untie the ribbon and open the invitation" onClick={openSeal} /> : null}
      </section>

      <section className="pt-sec">
        <svg className="pt-lotus" width="64" height="40" viewBox="0 0 64 40" aria-hidden="true">
          <g transform="translate(32 34)">
            <LotusBloom />
          </g>
        </svg>
        {fields.message ? <p className="pt-lead">{fields.message}</p> : null}
        {parents.length ? (
          <div className="pt-parents">
            {parents.map((person, index) => (
              <div key={person.name + index} style={{ display: "contents" }}>
                {index > 0 ? <span className="pt-amp">&amp;</span> : null}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="pt-small">{person.role}</span>
                  <span className="pt-pname">{person.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="pt-sec-alt" id="celebrations">
        <span className="pt-kick">The celebrations</span>
        <h2 className="pt-h2">Three days of joy</h2>
        <div className="pt-timeline">
          <span className="pt-line" aria-hidden="true" />
          {events.map((event, index) => (
            <div className="pt-row" key={event.title + index}>
              <span className="pt-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={iconFor(event.title)} />
                </svg>
              </span>
              <div className="pt-card">
                {event.kick ? <span className="pt-small">{event.kick}</span> : null}
                <span className="pt-ev-name">{event.title}</span>
                {event.time ? <span className="pt-ev-time">{event.time}</span> : null}
                {event.text ? <span className="pt-ev-ven">{event.text}</span> : null}
                <div className="pt-card-foot">
                  {event.note ? <span className="pt-dress">Dress · {event.note}</span> : <span />}
                  <button type="button" className="pt-link" onClick={() => directions(event.text)}>
                    Directions →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {story.length ? (
        <section className="pt-sec">
          <span className="pt-kick">Our story</span>
          <h2 className="pt-h2">How it all began</h2>
          <div className="pt-story">
            {story.map((beat, index) => (
              <article className="pt-chapter" key={beat.title + index}>
                <div className="pt-frame-photo">
                  {photos[index] ? (
                    <img src={assetUrl(photos[index])} alt="" />
                  ) : (
                    <>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                      </svg>
                      <span className="pt-small">Add photo</span>
                    </>
                  )}
                </div>
                <span className="pt-year">{beat.year}</span>
                <span className="pt-story-t">{beat.title}</span>
                <span className="pt-story-d">{beat.text}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pt-sec-alt">
        <div className="pt-venue">
          <svg className="pt-venue-art" viewBox="0 0 400 305" aria-hidden="true">
            <Palace />
          </svg>
          <span className="pt-kick">The venue</span>
          <h2 className="pt-h2">{fields.venue || "The venue"}</h2>
          {fields.address ? <span className="pt-ev-ven">{fields.address}</span> : null}
          {pack.venueNote ? <span className="pt-small">{pack.venueNote}</span> : null}
          <div className="pt-actions">
            <button type="button" className="pt-btn ink" onClick={() => directions("")}>
              Get directions
            </button>
            {calendarUrl(fields) ? (
              <a className="pt-btn paper" href={calendarUrl(fields)} target="_blank" rel="noreferrer">
                Add to calendar
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="pt-sec">
        <span className="pt-kick">Counting down to forever</span>
        <div className="pt-count">
          {count.map((value, index) => (
            <div key={["Days", "Hours", "Mins", "Secs"][index]}>
              <strong>{String(value).padStart(2, "0")}</strong>
              <span className="pt-small">{["Days", "Hours", "Mins", "Secs"][index]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-sec-alt" id="rsvp">
        <span className="pt-kick">{fields.rsvpBy ? `Kindly reply by ${formatLongDate(fields.rsvpBy)}` : "Kindly reply"}</span>
        <h2 className="pt-h2">Will you join us?</h2>
        <div className="pt-form">
          {done ? (
            <div className="pt-done">
              {Array.from({ length: 12 }, (_, index) => (
                <span
                  key={index}
                  className="pt-fall"
                  style={{
                    left: `${8 + ((index * 37) % 84)}%`,
                    ["--x" as string]: `${(index % 2 ? 1 : -1) * (20 + index * 4)}px`,
                    ["--r" as string]: `${index * 70}deg`,
                    animationDuration: `${2.2 + (index % 4) * 0.4}s`,
                    animationDelay: `${(index % 5) * 0.12}s`,
                  }}
                  aria-hidden="true"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20">
                    <path className="r" d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" />
                  </svg>
                </span>
              ))}
              <div className="pt-done-seal">
                <Seal names={fields.names} />
              </div>
              <span className="pt-h2">{attend === "yes" ? `Thank you, ${first}` : "We’ll miss you"}</span>
              <p className="pt-lead">
                {attend === "yes"
                  ? `Your reply is sealed. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you${cityOf(fields.address, fields.venue) ? ` in ${cityOf(fields.address, fields.venue)}` : ""}.`
                  : "Thank you for letting us know — your blessings mean the world to us."}
              </p>
              <button type="button" className="pt-link" onClick={() => setDone(false)}>
                Change my reply
              </button>
            </div>
          ) : (
            <>
              <label htmlFor={nameId}>
                <span className="pt-lab">Your name</span>
                <input id={nameId} className="pt-field" value={name} placeholder="Full name" onChange={(event) => { setName(event.target.value); setNameErr(false); }} />
                {nameErr ? <span className="pt-err">Please enter your name.</span> : null}
              </label>
              <div className="pt-yesno">
                <button type="button" className={attend === "yes" ? "pt-pill on" : "pt-pill"} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>
                  Joyfully accept
                </button>
                <button type="button" className={attend === "no" ? "pt-pill on" : "pt-pill"} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>
                  Regretfully decline
                </button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="pt-step">
                    <span className="pt-lab">Guests</span>
                    <div className="pt-step-btns">
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                      <b>{guests}</b>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                    </div>
                  </div>
                  <div>
                    <span className="pt-lab">Joining us for</span>
                    <div className="pt-chips">
                      {events.map((event, index) => (
                        <button
                          key={event.title + index}
                          type="button"
                          className={picked[index] === false ? "pt-pill" : "pt-pill on"}
                          aria-pressed={picked[index] !== false}
                          onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}
                        >
                          {event.title.replace(/^The /, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              <label htmlFor={noteId}>
                <span className="pt-lab">A note for the couple</span>
                <textarea id={noteId} rows={3} value={msg} placeholder="Your wishes (optional)" onChange={(event) => setMsg(event.target.value)} />
              </label>
              <button type="button" className="pt-btn ink pt-send" onClick={() => void submit()}>
                Seal my reply
              </button>
            </>
          )}
        </div>
      </section>

      <footer className="pt-foot">
        <div className="pt-foot-seal">
          <Seal names={fields.names} />
        </div>
        <span className="pt-foot-names">{fields.names}</span>
        <span className="pt-small">
          {shortDate(fields.date)}
          {cityOf(fields.address, fields.venue) ? ` · ${cityOf(fields.address, fields.venue)}` : ""}
        </span>
        <button type="button" className="pt-link" onClick={replay}>
          ↺ Open the invitation again
        </button>
        <Link className="pt-made" to="/create">
          MADE WITH INVITESREADY
        </Link>
      </footer>

      {toast ? (
        <div className="pt-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
