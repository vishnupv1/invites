import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import { calendarUrl, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields, TemplateShot } from "../types";
import { InstagramLink } from "./InstagramLink";
import "./journal.css";

type Reply = { name: string; note: string; attending: boolean };

const ART = "/journal";
const SHOTS: TemplateShot[] = [
  { label: "first chai" },
  { label: "she said yes" },
  { label: "forever" },
];
const SAMPLE = [`${ART}/photo-1.webp`, `${ART}/photo-2.webp`, `${ART}/photo-3.webp`];
const SPRIGS = [
  { src: 1, style: { left: "8%", top: "18%", width: 48, ["--r" as string]: "-12deg" } },
  { src: 2, style: { right: "10%", top: "22%", width: 42, ["--r" as string]: "8deg", animationDelay: "-1.2s" } },
  { src: 3, style: { left: "14%", bottom: "18%", width: 36, ["--r" as string]: "16deg", animationDelay: "-2s" } },
  { src: 4, style: { right: "16%", bottom: "22%", width: 50, ["--r" as string]: "-8deg", animationDelay: "-0.6s" } },
] as const;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function initials(names: string) {
  const letters = names.split("&").map((part) => part.trim().charAt(0).toUpperCase()).filter(Boolean);
  return letters.join("") || "";
}

function tagOf(names: string) {
  const parts = names.split("&").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
  return parts.length >= 2 ? `#${parts[0]}Weds${parts[1]}` : "";
}

function journalDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday} · ${date.getDate()} ${month} ${date.getFullYear()}`;
}

function stamp(iso: string) {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day} · ${month} · ${year}` : "";
}

function monthOf(iso: string) {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: start }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  return {
    label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    day: date.getDate(),
    cells,
  };
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!date) return null;
  const target = new Date(`${date}T${time || "09:00"}:00+05:30`).getTime();
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

export function JournalInvite({
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
  useFonts("Sacramento", "Lora", "Jost");
  const pack = packOf("journal", fields.lines);
  const parents = fields.hosts.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const notes = photoNotes(fields.notes, SHOTS);
  const calendar = monthOf(fields.date);
  const countdown = useCountdown(fields.date, fields.time);
  const live = Boolean(onReply);
  const photos = SHOTS.map((_, index) => (fields.photos?.[index] ? assetUrl(fields.photos[index]) : live ? "" : SAMPLE[index]));
  const events = pack.programme ?? [];
  const [page, setPage] = useState(quiet);
  const [ready, setReady] = useState(quiet);
  const [music, setMusic] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const nameId = useId();
  const wishId = useId();

  useEffect(() => {
    if (quiet) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setReady(true), reduce ? 0 : 4200);
    return () => window.clearTimeout(id);
  }, [quiet]);

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
  const dress = fields.dress.trim() || pack.caption || "";
  const replyBy = journalDate(fields.rsvpBy);

  return (
    <article className={`wj${page ? " is-page" : ""}${ready ? " is-ready" : ""}`}>
      {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop preload="none" /> : null}
      <section className="wj-open" aria-label="Opening">
        <img className="wj-paper" src={`${ART}/paper-m.webp`} alt="" />
        <img className="wj-paper-d" src={`${ART}/paper-d.webp`} alt="" />
        <img className="wj-leaf a" src={`${ART}/leaves.webp`} alt="" />
        <img className="wj-leaf b" src={`${ART}/leaves.webp`} alt="" />
        {SPRIGS.map((sprig) => (
          <img key={sprig.src} className="wj-sprig" src={`${ART}/sprig-${sprig.src}.webp`} alt="" style={sprig.style} />
        ))}
        <div className="wj-copy">
          <p className="wj-dear wj-write" style={{ animationDelay: "0.15s" }}>{greeting}</p>
          <div className="wj-wash">
            <img src={`${ART}/wash.webp`} alt="" />
            <p className="wj-line wj-write" style={{ animationDelay: "0.55s" }}>When two souls become one</p>
          </div>
          <p className="wj-names wj-write" style={{ animationDelay: "2.1s" }}>{fields.names}</p>
          <p className="wj-when" style={{ animation: "wj-up 0.8s ease 3.2s both" }}>{journalDate(fields.date)}</p>
          <button type="button" className="wj-open-btn" onClick={() => setPage(true)}>Open our journal</button>
        </div>
        <div className="wj-portrait wj-paint" style={{ animationDelay: "0.9s" }}>
          <img src={`${ART}/couple.webp`} alt="Watercolour illustration of the couple" />
        </div>
      </section>

      {page ? (
        <div className="wj-page">
          {fields.audio ? (
            <button type="button" className={`wj-music${music ? " is-on" : ""}`} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={toggleMusic} />
          ) : null}

          <header className="wj-hero">
            <div>
              <div className="wj-wreath">
                <img src={`${ART}/wreath.webp`} alt="" />
                {initials(fields.names) ? <span>{initials(fields.names)}</span> : null}
              </div>
            </div>
            <div>
              {fields.title ? <span className="wj-kicker">{fields.title}</span> : null}
              {parents.map((line) => <p className="wj-parents" key={line}>{line}</p>)}
              <h1>{fields.names}</h1>
              <p className="wj-meta">
                {journalDate(fields.date)}
                {fields.time ? <><br />Muhurtham {formatTime(fields.time)}</> : null}
                {(fields.venue || fields.address) ? <><br />{[fields.venue, fields.address].filter(Boolean).join(", ")}</> : null}
              </p>
              {countdown ? (
                <div className="wj-count" aria-label="Countdown">
                  {countdown.map(([value, label]) => (
                    <div key={label}><strong>{value}</strong><span>{label}</span></div>
                  ))}
                </div>
              ) : null}
            </div>
          </header>

          <section className="wj-story">
            <span className="wj-kicker">Our story</span>
            <h2>Two hearts, one story</h2>
            <div className="wj-story-art">
              <img src={`${ART}/couple.webp`} alt="" />
            </div>
            {fields.message ? <p>{fields.message}</p> : null}
            <div className="wj-frames">
              {SHOTS.map((shot, index) => photos[index] ? (
                <figure className="rv" key={shot.label}>
                  <div className="shot" style={{ backgroundImage: `url(${photos[index]})` }} role="img" aria-label={notes[index]?.title || shot.label} />
                  <figcaption>{notes[index]?.title || shot.label}</figcaption>
                </figure>
              ) : null)}
            </div>
          </section>

          {calendar ? (
            <section className="wj-save" aria-label="Save the date">
              <span className="wj-kicker">Save the date</span>
              <h2>{calendar.label}</h2>
              <img className="wj-temple" src={`${ART}/temple.webp`} alt="" />
              <div className="wj-cal">
                <ol>
                  {WEEKDAYS.map((day, index) => <li className="dow" key={`${day}-${index}`}>{day}</li>)}
                  {calendar.cells.map((day, index) => (
                    <li key={index} className={day === calendar.day ? "mark" : undefined}>{day ?? ""}</li>
                  ))}
                </ol>
              </div>
              {events.length ? (
                <ul className="wj-legend">
                  {events.map((item) => (
                    <li key={item.title}>♥ {[item.note, item.title, item.time].filter(Boolean).join(" · ")}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {events.length ? (
            <section className="wj-events">
              <h2>The celebrations</h2>
              <div className="wj-cards">
                {events.map((item) => (
                  <article className="wj-card rv" key={item.title}>
                    {item.note ? <p className="day">{item.note}</p> : null}
                    <h3>{item.title}</h3>
                    {item.time ? <p>{item.time}</p> : null}
                    {item.text ? <p>{item.text}</p> : null}
                    <div className="acts">
                      <button type="button" onClick={() => openMap(item.text)}>Directions</button>
                      <button type="button" onClick={() => openCalendar(item.title, item.text)}>Add to calendar</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {dress ? (
            <section className="wj-dress">
              <span className="wj-kicker">A note for our guests</span>
              <h2>Come as you are, in colour</h2>
              <img src={`${ART}/basket.webp`} alt="" />
              <p>{dress}</p>
            </section>
          ) : null}

          <section className="wj-rsvp">
            <span className="wj-kicker">{replyBy ? `Kindly reply by ${replyBy}` : "Kindly reply"}</span>
            <h2>Will you be there?</h2>
            {done ? (
              <div className="wj-done">
                <h3>{attend === "yes" ? "See you there!" : "We will miss you"}</h3>
                <p>
                  {attend === "yes"
                    ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved${saved.length ? ` for ${saved.join(" and ")}` : ""}.`
                    : `Thank you for letting us know, ${name.trim()}. We will send you photos and sweets.`}
                </p>
                <button type="button" onClick={() => setDone(false)}>Edit reply</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="wj-field">
                  <label htmlFor={nameId}>Your name</label>
                  <input id={nameId} className={nameError ? "is-bad" : ""} value={name} autoComplete="name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                  {nameError ? <span>Please write your name.</span> : null}
                </div>
                <div className="wj-choice">
                  <button type="button" className={attend === "yes" ? "is-on" : ""} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully, yes</button>
                  <button type="button" className={attend === "no" ? "is-on" : ""} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>With regrets</button>
                </div>
                {attend === "yes" ? (
                  <>
                    {events.length ? (
                      <div className="wj-chips">
                        {events.map((item) => {
                          const on = picked[item.title] !== false;
                          return (
                            <button type="button" className={`wj-chip${on ? " is-on" : ""}`} key={item.title} aria-pressed={on} onClick={() => setPicked((current) => ({ ...current, [item.title]: !on }))}>{item.title}</button>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className="wj-stepper">
                      <span>Guests</span>
                      <div>
                        <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                        <span aria-live="polite">{guests}</span>
                        <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                      </div>
                    </div>
                  </>
                ) : null}
                <div className="wj-field">
                  <label htmlFor={wishId}>A line for our journal</label>
                  <input id={wishId} value={wish} onChange={(event) => setWish(event.target.value)} />
                </div>
                <button type="submit" className="wj-send">Send my reply</button>
              </form>
            )}
          </section>

          {loop.length ? (
            <section className="wj-wishes" aria-label="Notes from our people">
              <h2>Notes from our people</h2>
              <div className="wj-marq">
                <div className="wj-track">
                  {loop.map((item, index) => (
                    <article className="wj-wish" key={`${item.name}-${index}`}>
                      <p>{item.text}</p>
                      {item.name ? <span>{item.name}</span> : null}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <footer className="wj-foot">
            <img className="walk" src={`${ART}/walk.webp`} alt="" />
            <span className="love">with love, {fields.names}</span>
            <span className="stamp">{[stamp(fields.date), tagOf(fields.names)].filter(Boolean).join(" · ")}</span>
            <a href={madeWithHref("journal")}>Made with InvitesReady</a>
            <InstagramLink />
            <img className="wj-border" src={`${ART}/border.webp`} alt="" />
          </footer>
        </div>
      ) : null}

      {toast ? (
        <div className="wj-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </article>
  );
}
