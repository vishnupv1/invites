import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./starryfairytale.css";

type Reply = { name: string; note: string; attending: boolean };

const ART = "/starryfairytale";
const EVENT_ART = [`${ART}/church.webp`, `${ART}/glasses.webp`, `${ART}/cake.webp`];
const CHIPS = ["Ceremony", "Reception", "Dinner"];
const HOURS = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
const STARS = [
  [6, 10, 9, "2.2s", "0s"],
  [18, 22, 7, "2.8s", "-0.6s"],
  [31, 8, 11, "3.1s", "-1.2s"],
  [44, 18, 8, "2.4s", "-0.3s"],
  [57, 6, 10, "3.4s", "-1.8s"],
  [70, 16, 7, "2.6s", "-0.9s"],
  [82, 9, 12, "3s", "-1.5s"],
  [91, 24, 8, "2.3s", "-0.2s"],
  [14, 34, 6, "3.6s", "-2s"],
  [38, 30, 9, "2.7s", "-1.1s"],
  [63, 28, 7, "3.2s", "-0.7s"],
  [86, 36, 10, "2.5s", "-1.6s"],
] as const;

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Nathan", second: parts[1] || "Grace" };
}

function dotStamp(iso: string) {
  const day = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(day.getTime())) return iso;
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${day.getFullYear()}`;
}

function longStamp(iso: string) {
  const day = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(day.getTime())) return iso;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const rest = day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
  return `${weekday} · ${rest}`;
}

function clockLine(time: string) {
  const [hourText, minuteText] = (time || "16:00").split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  if (minute !== 0) {
    const suffix = hour >= 12 ? "PM" : "AM";
    return `at ${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
  }
  const part = hour < 12 ? "in the morning" : hour < 17 ? "in the afternoon" : hour < 21 ? "in the evening" : "at night";
  return `at ${HOURS[hour % 12]} o'clock ${part}`;
}

function to24(label: string, fallback: string) {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return fallback;
  let hour = Number(match[1]);
  const suffix = match[3]?.toUpperCase();
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function tagOf(names: string) {
  const tag = names.replace(/&/g, "").replace(/\s+/g, "");
  return tag ? `#${tag}` : "";
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = new Date(`${date}T${time || "16:00"}:00+05:30`).getTime();
  let diff = Number.isNaN(target) ? 0 : Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    [String(days), "Days"],
    [pad(hours), "Hours"],
    [pad(minutes), "Mins"],
    [pad(seconds), "Secs"],
  ] as const;
}

function scrollParent(node: HTMLElement) {
  let el = node.parentElement;
  while (el && el !== document.documentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === "auto" || overflow === "scroll" || overflow === "overlay") && el.scrollHeight > el.clientHeight + 4) return el;
    el = el.parentElement;
  }
  return null;
}

function useStory(rootRef: RefObject<HTMLElement | null>, trackRef: RefObject<HTMLElement | null>, quiet: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (value: number) => Math.max(0, Math.min(1, value));
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
    const setP = (p: number) => {
      const seg = (start: number, end: number) => ease(clamp((p - start) / (end - start)));
      root.style.setProperty("--p", p.toFixed(3));
      root.style.setProperty("--a", seg(0.02, 0.28).toFixed(3));
      root.style.setProperty("--b", seg(0.2, 0.55).toFixed(3));
      root.style.setProperty("--c", seg(0.56, 0.95).toFixed(3));
    };
    if (reduce) {
      setP(1);
      return;
    }
    if (quiet) {
      setP(0);
      return;
    }
    let frame = 0;
    let loop = 0;
    let scroller: HTMLElement | null = null;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const read = () => {
      frame = 0;
      const span = scroller ? track.offsetHeight - scroller.clientHeight : track.offsetHeight - window.innerHeight;
      if (span < 8) return;
      const top = scroller
        ? scroller.getBoundingClientRect().top - track.getBoundingClientRect().top
        : -track.getBoundingClientRect().top;
      setP(clamp(top / span));
    };
    const start = () => {
      scroller = scrollParent(track);
      const doc = document.scrollingElement ?? document.documentElement;
      const canScroll = scroller ? scroller.scrollHeight > scroller.clientHeight + 8 : doc.scrollHeight > doc.clientHeight + 8;
      if (!canScroll) {
        const t0 = performance.now();
        const play = (time: number) => {
          const k = ((time - t0) / 1000) % 13;
          const p = k < 1.5 ? 0 : k < 9 ? (k - 1.5) / 7.5 : k < 12 ? 1 : 1 - (k - 12);
          setP(clamp(p));
          loop = requestAnimationFrame(play);
        };
        loop = requestAnimationFrame(play);
        return;
      }
      scroller?.addEventListener("scroll", onScroll, { passive: true });
      if (!scroller) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
      }
      read();
    };
    const wait = window.setTimeout(start, 80);
    return () => {
      window.clearTimeout(wait);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(loop);
      scroller?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [quiet, rootRef, trackRef]);
}

export function StarryFairytaleInvite({
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
  useFonts("Parisienne", "IM Fell English", "Cinzel Decorative", "Jost");
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  useStory(rootRef, trackRef, quiet);
  const pack = packOf("starryfairytale", fields.lines);
  const couple = coupleOf(fields.names);
  const names = fields.names || `${couple.first} & ${couple.second}`;
  const countdown = useCountdown(fields.date, fields.time);
  const nameId = useId();
  const wishId = useId();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [going, setGoing] = useState<boolean[]>([true, true, true]);
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [music, setMusic] = useState(false);
  const [toast, setToast] = useState("");

  const story = (pack.story?.[0]?.text || "It began in a little chapel,\nunder a sky full of stars.").split("\n").filter(Boolean);
  const yesLine = pack.story?.[1]?.text || "…he asked, and she said yes.";
  const hosts = (fields.hosts || "Mr. & Mrs. Thomas George\nand\nMr. & Mrs. Joseph Mathew").split("\n");
  const title = (fields.title || "request the honour of your presence\nat the marriage of their children").split("\n");
  const where = [fields.venue, fields.address].filter(Boolean).join(", ") || "St. Mary's Basilica, Bengaluru";
  const events = (pack.programme ?? []).map((item, index) => ({
    ...item,
    art: EVENT_ART[index % EVENT_ART.length],
    chip: CHIPS[index] || item.title.split(" ")[0],
  }));
  const board = [
    ...wishes.filter((item) => item.note.trim()).map((item) => ({ name: item.name, text: item.note })),
    ...(pack.wishes ?? []).map((item) => ({ name: item.by, text: item.text })),
  ];
  const loop = board.length ? [...board, ...board] : [];
  const picked = events.filter((_, index) => going[index] !== false).map((item) => item.chip.toLowerCase());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const note = [
      wish.trim(),
      attend === "yes" && picked.length ? `I'll be at the ${picked.join(", ")}` : "",
      attend === "yes" ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
    ].filter(Boolean).join(". ");
    await onReply?.({ name: name.trim(), note, attending: attend === "yes" });
    setDone(true);
  }

  function directions(place: string) {
    const query = encodeURIComponent([place, fields.address].filter(Boolean).join(", "));
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener");
    setToast(`Opening directions to ${place}…`);
  }

  function calendar(titleText: string, when: string, place: string) {
    const url = calendarUrl({ ...fields, venue: place, title: titleText, time: to24(when, fields.time) });
    if (url) window.open(url, "_blank", "noopener");
    setToast(`${titleText} added to your calendar.`);
  }

  return (
    <article ref={rootRef} className="sf" style={{ ["--p" as string]: 0, ["--a" as string]: 0, ["--b" as string]: 0, ["--c" as string]: 0 }}>
      <button
        type="button"
        className="sf-music"
        aria-label={music ? "Pause music" : "Play music"}
        onClick={() => {
          setMusic((on) => !on);
          setToast(music ? "Music paused." : "Now playing: our song.");
        }}
      >
        <svg className={music ? "is-on" : undefined} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
          <circle cx="14" cy="14" r="12" fill="none" stroke="#F3D98A" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="4.5" fill="#F3D98A" />
          <circle cx="14" cy="14" r="1.4" fill="#0F2350" />
        </svg>
      </button>

      <section ref={trackRef} className="sf-track" aria-label="Our story">
        <div className="sf-pin">
          <div className="sf-sky" />
          <div className="sf-glow-sky" />
          {STARS.map(([left, top, size, dur, delay]) => (
            <span key={`${left}-${top}`} className="sf-star" style={{ left: `${left}%`, top: `${top}%`, fontSize: size, ["--dur" as string]: dur, ["--delay" as string]: delay }} aria-hidden="true">✦</span>
          ))}
          <div className="sf-moon">
            <span className="sf-halo" />
            <img src={`${ART}/moon.webp`} alt="" />
          </div>
          <div className="sf-names">
            <span className="sf-kicker">Together with their families</span>
            <div className="sf-couple">
              <span className="sf-script sf-gold">{couple.first}</span>
              <span className="sf-weds">&amp;</span>
              <span className="sf-script sf-gold">{couple.second}</span>
            </div>
            <span className="sf-stamp">{dotStamp(fields.date)}</span>
          </div>
          <div className="sf-balloon sf-lift"><img src={`${ART}/balloon.webp`} alt="" /></div>
          <div className="sf-cloud sf-cloud-a"><img src={`${ART}/cloud.webp`} alt="" /></div>
          <div className="sf-cloud sf-cloud-b"><img src={`${ART}/cloud.webp`} alt="" /></div>
          <div className="sf-portal sf-portal-l"><img src={`${ART}/portal.webp`} alt="" /></div>
          <div className="sf-portal sf-portal-r"><img src={`${ART}/portal.webp`} alt="" /></div>
          <div className="sf-band" />
          <div className="sf-chapel sf-lift">
            <span className="sf-halo" />
            <img src={`${ART}/chapel.webp`} alt="" />
          </div>
          <div className="sf-story">
            <span className="sf-kicker">Our story</span>
            {story.map((line) => <p key={line}>{line}</p>)}
          </div>
          <p className="sf-yes">{yesLine}</p>
          <div className="sf-ring sf-lift">
            <span className="sf-halo" />
            <img src={`${ART}/ring.webp`} alt="" />
          </div>
          <div className="sf-cherub sf-cherub-l sf-lift"><img src={`${ART}/cherub.webp`} alt="" /></div>
          <div className="sf-cherub sf-cherub-r sf-lift"><img src={`${ART}/cherub.webp`} alt="" /></div>
          <div className="sf-hill"><img src={`${ART}/hill.webp`} alt="" /></div>
          <div className="sf-col" />
          <div className="sf-col sf-col-r" />
          <div className="sf-cue">
            <span>Scroll to begin</span>
            <span className="sf-mouse" aria-hidden="true"><i /></span>
          </div>
        </div>
      </section>

      <div className="sf-seam" aria-hidden="true"><div /></div>

      <section className="sf-invite" aria-label="Invitation">
        <div className="sf-side sf-side-l" />
        <div className="sf-side sf-side-r" />
        <div className="sf-card">
          <img className="sf-flourish" src={`${ART}/flourish.webp`} alt="" />
          <span className="sf-hosts">
            {hosts.map((line) => (
              <span key={line}>
                {line.trim().toLowerCase() === "and" ? <span className="sf-and">{line}</span> : line}
                <br />
              </span>
            ))}
          </span>
          {title.map((line) => <span key={line} className="sf-line">{line}</span>)}
          <span className="sf-script sf-gold">{names}</span>
          <span className="sf-stamp">{longStamp(fields.date)}</span>
          <span className="sf-line">{clockLine(fields.time)}</span>
          <span className="sf-where">{where}</span>
          <img className="sf-flourish" src={`${ART}/flourish.webp`} alt="" />
        </div>
      </section>

      <section className="sf-count" aria-label="Countdown">
        <span className="sf-kicker">Counting the nights</span>
        <div className="sf-boxes">
          {countdown.map(([value, label]) => (
            <div key={label} className="sf-box">
              <strong className="sf-gold">{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sf-events" aria-label="The celebrations">
        <span className="sf-kicker">The celebrations</span>
        <h2 className="sf-gold">An evening of stars</h2>
        <div className="sf-grid">
          {events.map((item, index) => (
            <article key={item.title} className="sf-event">
              <div className="sf-event-art">
                <span className="sf-halo" />
                <img src={item.art} alt="" style={{ animationDuration: `${4 + index * 0.6}s` }} />
              </div>
              <span className="sf-kicker">{item.kick || item.time}</span>
              <h3>{item.title}</h3>
              <p>{item.note || formatLongDate(fields.date)}</p>
              <p><strong>{item.text}</strong></p>
              <div className="sf-actions">
                <button type="button" onClick={() => directions(item.text)}>Directions</button>
                <button type="button" onClick={() => calendar(item.title, item.kick || item.time, item.text)}>Calendar</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sf-rsvp" aria-label="Kindly respond">
        <div className="sf-rsvp-lead">
          <img src={`${ART}/balloon.webp`} alt="" />
          <h2 className="sf-gold">Kindly respond</h2>
          <p>Will you be there?</p>
          {fields.rsvpBy ? <p>Please reply by {formatLongDate(fields.rsvpBy)}</p> : null}
        </div>
        {done ? (
          <div className="sf-done">
            <img src={`${ART}/ring.webp`} alt="" />
            <h3 className="sf-gold">{attend === "yes" ? "See you under the stars!" : "You will be missed"}</h3>
            <p>
              {attend === "yes"
                ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved${picked.length ? ` for the ${picked.join(", ")}` : ""}.`
                : `Thank you for letting us know, ${name.trim()}. Please keep us in your prayers.`}
            </p>
            <button type="button" className="sf-edit" onClick={() => setDone(false)}>Change my reply</button>
          </div>
        ) : (
          <form className="sf-form" onSubmit={submit}>
            <label htmlFor={nameId}>
              Your name
              <input id={nameId} value={name} placeholder="Your name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
              {nameError ? <span className="sf-error">Please enter your name.</span> : null}
            </label>
            <div className="sf-choice">
              <button type="button" className={attend === "yes" ? "is-on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
              <button type="button" className={attend === "no" ? "is-on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
            </div>
            {attend === "yes" ? (
              <>
                <div>
                  <span>I&apos;ll be at</span>
                  <div className="sf-chips">
                    {events.map((item, index) => (
                      <button key={item.title} type="button" className={going[index] !== false ? "is-on" : undefined} aria-pressed={going[index] !== false} onClick={() => setGoing((current) => events.map((_, i) => (i === index ? current[i] === false : current[i] !== false)))}>
                        {item.chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sf-guests">
                  <span>Guests</span>
                  <div>
                    <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                    <strong>{guests}</strong>
                    <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                  </div>
                </div>
              </>
            ) : null}
            <label htmlFor={wishId}>
              A blessing for the couple <span style={{ fontWeight: 400, color: "#8a8270" }}>(optional)</span>
              <input id={wishId} value={wish} placeholder="Write a short wish" onChange={(event) => setWish(event.target.value)} />
            </label>
            <button className="sf-send" type="submit"><i /><span>Send RSVP</span></button>
          </form>
        )}
      </section>

      {loop.length ? (
        <section className="sf-wishes" aria-label="Blessings and wishes">
          <div className="sf-wish-head">
            <img className="sf-flourish" src={`${ART}/flourish.webp`} alt="" />
            <h2 className="sf-gold">Blessings &amp; wishes</h2>
          </div>
          <div className="sf-marq-clip">
            <div className="sf-marq">
              {loop.map((item, index) => (
                <article key={`${item.name}-${index}`} className="sf-wish">
                  <b>“</b>
                  <p>{item.text}</p>
                  <span>— {item.name}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="sf-foot">
        <span className="sf-kicker">With love &amp; gratitude</span>
        <span className="sf-script sf-gold">{names}</span>
        <span className="sf-stamp">{dotStamp(fields.date)} · {tagOf(names)}</span>
        <a className="sf-made" href={madeWithHref("starryfairytale")}>Made with InvitesReady</a>
      </footer>

      {toast ? (
        <div className="sf-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </article>
  );
}
