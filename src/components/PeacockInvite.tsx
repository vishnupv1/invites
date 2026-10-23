import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import { calendarUrl } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import { InstagramLink } from "./InstagramLink";
import type { InviteFields, TemplateShot } from "../types";
import "./peacock.css";

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "rain" | "open" | "dance" | "done";

const ART = "/peacock";
const SHOTS: TemplateShot[] = [
  { label: "first glance" },
  { label: "our first dance" },
  { label: "forever begins" },
];
const SAMPLE = [`${ART}/photo-2.webp`, `${ART}/photo-3.webp`, `${ART}/photo-1.webp`];
function ring(count: number, spread: number, inner: boolean) {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1);
    const fan = -spread + t * spread * 2;
    const shut = fan < 0 ? -183 : 183;
    return { fan, shut, inner, lag: `${(0.45 * (1 - Math.abs(t * 2 - 1))).toFixed(2)}s`, delay: `${(-0.35 * (index % 6)).toFixed(2)}s` };
  });
}

const FEATHERS = [...ring(19, 84, false), ...ring(17, 80, true)];
const DANCE = [...ring(11, 78, false), ...ring(9, 70, true)];
const CHARMS = [`${ART}/charm-1.webp`, `${ART}/charm-2.webp`, `${ART}/charm-3.webp`, `${ART}/charm-4.webp`];
const DROPS = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: `${-(index * 0.14)}s`,
  duration: `${0.86 + (index % 5) * 0.11}s`,
  height: 16 + (index % 4) * 12,
}));

function GoldRule({ wide = false }: { wide?: boolean }) {
  return (
    <svg className="pk-rule" width={wide ? 220 : 170} height="14" viewBox="0 0 200 14" aria-hidden="true">
      <path d="M4 7 H78 M122 7 H196" stroke="#C9A24A" strokeWidth="1.2" />
      <ellipse cx="100" cy="7" rx="14" ry="6" fill="none" stroke="#C9A24A" strokeWidth="1.4" />
      <circle cx="100" cy="7" r="3" fill="#C9A24A" />
    </svg>
  );
}

const SWATCHES = ["#0F4C5C", "#1E6B45", "#1D3F9A", "#C9A24A", "#B0306A"];

function peacockDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${date.getDate()} · ${month} · ${date.getFullYear()}`;
}

function stamp(iso: string) {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day} · ${month} · ${year}` : "";
}

function pairOf(names: string) {
  const parts = names.split("&").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { first: names.trim(), second: "" };
  return { first: parts.slice(0, -1).join(" & "), second: parts[parts.length - 1] };
}

function monogram(names: string) {
  const parts = names.split("&").map((part) => part.trim()[0]).filter(Boolean);
  return parts.length >= 2 ? parts : [];
}

function ticketDate(note: string) {
  const [week = "", rest = ""] = note.split("·").map((part) => part.trim());
  const [day = "", ...month] = rest.split(/\s+/);
  return { week, day, month: month.join(" ") };
}

function tagOf(names: string) {
  const parts = names.split("&").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
  return parts.length >= 2 ? `#${parts[0]}Ki${parts[1]}` : "";
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!date) return null;
  const target = new Date(`${date}T${time || "19:00"}:00+05:30`).getTime();
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

export function PeacockInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  useFonts("Cormorant Garamond", "Playfair Display", "Marcellus SC", "Cinzel");
  const pack = packOf("peacock", fields.lines);
  const parents = fields.hosts.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const notes = photoNotes(fields.notes, SHOTS);
  const countdown = useCountdown(fields.date, fields.time);
  const live = Boolean(onReply);
  const photos = SHOTS.map((_, index) => (fields.photos?.[index] ? assetUrl(fields.photos[index]) : live ? "" : SAMPLE[index]));
  const events = pack.programme ?? [];
  const [phase, setPhase] = useState<Phase>(quiet ? "done" : "closed");
  const [page, setPage] = useState(quiet);
  const [shakes, setShakes] = useState(0);
  const [hop, setHop] = useState(0);
  const [dancing, setDancing] = useState(false);
  const [loose, setLoose] = useState<{ id: number; left: string; dx: string; rot: string }[]>([]);
  const [music, setMusic] = useState(false);
  const danceTimer = useRef(0);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const timers = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nameId = useId();
  const wishId = useId();

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    window.clearTimeout(danceTimer.current);
  }, []);

  function begin() {
    if (phase !== "closed") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("done");
      return;
    }
    setPhase("rain");
    timers.current.push(window.setTimeout(() => setPhase("open"), 800));
    timers.current.push(window.setTimeout(() => setPhase("dance"), 2600));
    timers.current.push(window.setTimeout(() => setPhase("done"), 4000));
  }

  function toggleMusic() {
    const node = audioRef.current;
    if (!node) return;
    if (music) {
      node.pause();
      setMusic(false);
      return;
    }
    void node.play().then(() => setMusic(true)).catch(() => setMusic(false));
  }

  function openMap(where: string) {
    const query = where || [fields.venue, fields.address].filter(Boolean).join(", ");
    if (!query) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function openCalendar(title: string, where: string) {
    const url = calendarUrl({ ...fields, names: title || fields.names, venue: where || fields.venue, message: title });
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    try {
      await onReply?.({ name: name.trim(), note: wish.trim(), attending: attend === "yes" });
      setDone(true);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not send that reply.");
    }
  }

  const saved = events.filter((item) => picked[item.title] !== false).map((item) => item.title);
  const cards = [
    ...wishes.map((item) => ({ name: item.name, text: item.note })),
    ...(pack.wishes ?? []).map((item) => ({ name: item.by, text: item.text })),
  ].filter((item) => item.text);
  const loop = [...cards, ...cards];
  const greeting = fields.detail.trim() || "Dear friend,";
  const couple = pairOf(fields.names);
  const marks = monogram(fields.names);
  const dress = fields.dress.trim() || pack.caption || "";
  const replyBy = peacockDate(fields.rsvpBy);

  return (
    <article className={`pk${page ? " is-page" : ""} is-${phase}`}>
      {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop preload="none" /> : null}
      <section className="pk-open" aria-label="Opening">
        <img className="pk-paper" src={`${ART}/paper-m.webp`} alt="" />
        <img className="pk-paper-d" src={`${ART}/paper-d.webp`} alt="" />
        <div className="pk-rain" aria-hidden="true">
          {DROPS.map((drop) => (
            <span key={drop.left + drop.delay} className="pk-drop" style={{ left: drop.left, height: drop.height, animationDelay: drop.delay, animationDuration: drop.duration }} />
          ))}
        </div>
        <img className="pk-clouds" src={`${ART}/clouds.webp`} alt="" />
        <div className="pk-stage">
          <div className="pk-flock">
            <div className="pk-fan" aria-hidden="true">
              {FEATHERS.map((feather, index) => (
                <div key={`${feather.inner}-${index}`} className={`pk-feather${feather.inner ? " is-inner" : ""}`} style={{ ["--fan" as string]: `${feather.fan}deg`, ["--shut" as string]: `${feather.shut}deg`, ["--lag" as string]: feather.lag }}>
                  <img src={`${ART}/feather.webp`} alt="" style={{ animationDelay: feather.delay }} />
                </div>
              ))}
            </div>
            <img className="pk-bird" src={`${ART}/peacock.webp`} alt="" />
          </div>
          <div className="pk-medal">
            <img src={`${ART}/medallion.webp`} alt="" />
            {marks.length ? <span><b>{marks[0]}<small>&</small>{marks[1]}</b></span> : null}
          </div>
        </div>
        <div className="pk-intro">
          <p className="pk-kicker">When the monsoon clouds gather</p>
          <p className="pk-line">the peacock dances…</p>
        </div>
        <div className="pk-invite">
          <p className="pk-greet pk-when">{greeting} celebrate with</p>
          <p className="pk-names">{fields.names}</p>
          <p className="pk-finale pk-when">{[stamp(fields.date), fields.address || fields.venue].filter(Boolean).join(" · ")}</p>
          <button type="button" className="pk-enter" onClick={() => setPage(true)}>Enter the celebration</button>
        </div>
        <button type="button" className="pk-hit" aria-label="Tap to see him dance" onClick={begin} />
        <span className="pk-hint">Tap to see him dance</span>
      </section>

      {page ? (
        <div className="pk-page">
          {fields.audio ? (
            <button type="button" className="pk-hint" style={{ position: "absolute", top: 16, right: 16, bottom: "auto", left: "auto", transform: "none", display: "block" }} aria-pressed={music} onClick={toggleMusic}>{music ? "Pause" : "Music"}</button>
          ) : null}
          <header className="pk-hero">
            <img className="pk-hero-clouds" src={`${ART}/clouds.webp`} alt="" />
            <span className="pk-side pk-side-a" aria-hidden="true"><img src={`${ART}/feather.webp`} alt="" /></span>
            <span className="pk-side pk-side-b" aria-hidden="true"><img src={`${ART}/feather.webp`} alt="" /></span>
            <span className="pk-side pk-side-c" aria-hidden="true"><img src={`${ART}/feather.webp`} alt="" /></span>
            <span className="pk-side pk-side-d" aria-hidden="true"><img src={`${ART}/feather.webp`} alt="" /></span>
            <div className="pk-crest">
              <div className="pk-panel" />
              <img className="pk-arch" src={`${ART}/arch.webp`} alt="" />
              <div className="pk-crest-copy">
                {fields.title ? <span className="pk-eyebrow">{fields.title}</span> : null}
                <strong>{couple.first}</strong>
                {couple.second ? <em>&</em> : null}
                {couple.second ? <strong>{couple.second}</strong> : null}
                <GoldRule />
                {fields.date ? <span className="when">{peacockDate(fields.date)}</span> : null}
              </div>
            </div>
            <h1 className="pk-sr">{fields.names}</h1>
            <p className="pk-meta">
              {parents.map((line) => <span key={line}>{line}<br /></span>)}
            </p>
            <p className="pk-place">{[fields.venue, fields.address].filter(Boolean).join(" · ")}</p>
            {countdown ? (
              <div className="pk-count" aria-label="Countdown">
                {countdown.map(([value, label]) => (
                  <div key={label}><strong>{value}</strong><span>{label}</span></div>
                ))}
              </div>
            ) : null}
          </header>

          <section className="pk-story">
            <img className="pk-story-art" src={`${ART}/couple.webp`} alt="" />
            <div className="pk-story-copy">
              <span className="pk-eyebrow">Our story</span>
              <h2>A love that dances</h2>
              {fields.message ? <p>{fields.message}</p> : null}
              <div className="pk-frames">
                {SHOTS.map((shot, index) => photos[index] ? (
                  <figure className={`pk-shot pk-shot-${index + 1}`} key={shot.label}>
                    <div className="shot" role="img" aria-label={notes[index]?.title || shot.label} style={{ backgroundImage: `url(${photos[index]})` }} />
                    <figcaption>{notes[index]?.title || shot.label}</figcaption>
                  </figure>
                ) : null)}
              </div>
            </div>
          </section>

          {events.length ? (
            <section className="pk-events">
              <span className="pk-eyebrow">The celebrations</span>
              <h2>Three days of colour</h2>
              <div className="pk-cards">
                {events.map((item) => {
                  const when = ticketDate(item.note || "");
                  return (
                    <article className="pk-card rv" key={item.title}>
                      <div className="pk-ticket-wrap">
                      <img className="pk-ticket pk-ticket-m" src={`${ART}/ticket-m.webp`} alt="" />
                      <img className="pk-ticket pk-ticket-d" src={`${ART}/ticket-d.webp`} alt="" />
                      <div className="pk-ticket-face">
                        <div className="pk-stub">
                          <img src={`${ART}/feather.webp`} alt="" />
                          {when.week ? <span>{when.week}</span> : null}
                          {when.day ? <strong>{when.day}</strong> : null}
                          {when.month ? <span>{when.month}</span> : null}
                        </div>
                        <div className="pk-ticket-copy">
                          {item.kick ? <p className="kick">{item.kick}</p> : null}
                          <h3>{item.title}</h3>
                          {item.time ? <p>{item.time}</p> : null}
                          {item.text ? <p className="where">{item.text}</p> : null}
                        </div>
                      </div>
                      </div>
                      <div className="acts">
                        <button type="button" onClick={() => openMap(item.text)}>Directions</button>
                        <button type="button" onClick={() => openCalendar(item.title, item.text)}>Calendar</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="pk-dance">
            <span className="pk-eyebrow">A little monsoon magic</span>
            <h2>Make the peacock dance</h2>
            <button
              type="button"
              className="pk-dancer"
              onClick={() => {
                setDancing(true);
                setShakes((value) => value + 1);
                setHop((value) => value + 1);
                const next = Array.from({ length: 3 }, (_, index) => ({
                  id: Date.now() + index,
                  left: `${22 + Math.round(Math.random() * 56)}%`,
                  dx: `${(index - 1) * 50}px`,
                  rot: `${index * 60 - 30}deg`,
                }));
                setLoose((current) => [...current, ...next].slice(-15));
                window.clearTimeout(danceTimer.current);
                danceTimer.current = window.setTimeout(() => setDancing(false), 4200);
              }}
            >
              <span className={`pk-mini${dancing ? " is-on" : ""}`}>
                <span className="pk-mini-fan" aria-hidden="true">
                  {DANCE.map((feather, index) => (
                    <span key={`${feather.inner}-${index}`} className={`pk-plume${feather.inner ? " is-inner" : ""}`} style={{ ["--fan" as string]: `${feather.fan}deg`, ["--shut" as string]: `${feather.shut}deg`, ["--lag" as string]: feather.lag }}>
                      <img src={`${ART}/feather.webp`} alt="" style={{ animationDelay: feather.delay }} />
                    </span>
                  ))}
                </span>
                <img className="pk-mini-bird" key={hop} src={`${ART}/peacock.webp`} alt="Peacock" />
              </span>
              {loose.map((feather) => (
                <img key={feather.id} className="pk-fly" src={`${ART}/feather.webp`} alt="" style={{ left: feather.left, ["--dx" as string]: feather.dx, ["--rot" as string]: feather.rot }} />
              ))}
            </button>
            <p className="pk-note">{shakes ? `${shakes * 3} feathers set free for good luck` : "Tap the peacock to see him dance"}</p>
          </section>

          {dress ? (
            <section className="pk-dress">
              <span className="pk-eyebrow">Dress code</span>
              <h2>Wear the peacock</h2>
              <GoldRule wide />
              <p>{dress}</p>
              <div className="pk-swatches" aria-hidden="true">
                {SWATCHES.map((color) => <span key={color} style={{ background: color }} />)}
              </div>
            </section>
          ) : null}

          <section className="pk-rsvp">
            <span className="pk-eyebrow">{replyBy ? `Kindly reply by ${replyBy}` : "Kindly reply"}</span>
            <h2>Will you join the dance?</h2>
            {done ? (
              <div className="pk-done">
                <h3>{attend === "yes" ? "See you there" : "We will miss you"}</h3>
                <p>
                  {attend === "yes"
                    ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved${saved.length ? ` for ${saved.join(" and ")}` : ""}.`
                    : `Thank you for letting us know, ${name.trim()}.`}
                </p>
                <button type="button" onClick={() => setDone(false)}>Change my reply</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="pk-field">
                  <label htmlFor={nameId}>Your name</label>
                  <input id={nameId} className={nameError ? "is-bad" : ""} value={name} autoComplete="name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                  {nameError ? <span>Please enter your name.</span> : null}
                </div>
                <div className="pk-choice">
                  <button type="button" className={attend === "yes" ? "is-on" : ""} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully attending</button>
                  <button type="button" className={attend === "no" ? "is-on" : ""} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Unable to attend</button>
                </div>
                {attend === "yes" ? (
                  <>
                    {events.length ? (
                      <div className="pk-chips">
                        {events.map((item) => {
                          const on = picked[item.title] !== false;
                          return (
                            <button type="button" className={`pk-chip${on ? " is-on" : ""}`} key={item.title} aria-pressed={on} onClick={() => setPicked((current) => ({ ...current, [item.title]: !on }))}>{item.title}</button>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className="pk-stepper">
                      <span>Guests</span>
                      <div>
                        <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                        <span aria-live="polite">{guests}</span>
                        <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                      </div>
                    </div>
                  </>
                ) : null}
                <div className="pk-field">
                  <label htmlFor={wishId}>A wish for us</label>
                  <input id={wishId} value={wish} onChange={(event) => setWish(event.target.value)} />
                </div>
                <button type="submit" className="pk-send">Send my reply</button>
              </form>
            )}
          </section>

          {loop.length ? (
            <section className="pk-wishes" aria-label="Blessings">
              <span className="pk-eyebrow">Blessings</span>
              <h2>Words from our loved ones</h2>
              <div className="pk-marq">
                <div className="pk-track">
                  {loop.map((item, index) => (
                    <article className={`pk-wish${index >= cards.length ? " is-copy" : ""}`} key={`${item.name}-${index}`}>
                      <img className="charm" src={CHARMS[index % CHARMS.length]} alt="" />
                      <p>{item.text}</p>
                      {item.name ? <span>— {item.name}</span> : null}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <footer className="pk-foot">
            <img className="branch" src={`${ART}/branch.webp`} alt="" />
            <span className="love">With love & gratitude</span>
            <span className="who">{fields.names}</span>
            <span className="rule" aria-hidden="true" />
            <span className="stamp">{[stamp(fields.date), tagOf(fields.names)].filter(Boolean).join(" · ")}</span>
            <a href={madeWithHref("peacock")}>Made with InvitesReady</a>
            <InstagramLink />
          </footer>
        </div>
      ) : null}

      {toast ? (
        <div className="pk-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </article>
  );
}
