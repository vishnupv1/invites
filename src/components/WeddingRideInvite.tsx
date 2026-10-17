import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./weddingride.css";

export type WeddingRideTheme = "sunlit" | "rose" | "dusk";

type Phase = "play" | "snip" | "cut" | "open";
type Reply = { name: string; note: string; attending: boolean };

const ART = "/weddingride";
const MOMENTS = [
  ["Walking through the garden", `${ART}/moment-garden.webp`, `${ART}/mask-a.webp`],
  ["Steps of the old palace", `${ART}/moment-palace.webp`, `${ART}/mask-b.webp`],
  ["Hands, henna and haldi", `${ART}/moment-haldi.webp`, `${ART}/mask-c.webp`],
  ["Our pink ride", `${ART}/moment-ride.webp`, `${ART}/mask-a.webp`],
  ["First twirl", `${ART}/moment-twirl.webp`, `${ART}/mask-b.webp`],
  ["Into the sunset, together", `${ART}/moment-sunset.webp`, `${ART}/mask-c.webp`],
] as const;
const COLORS = ["#2F5A3A", "#F2A33A", "#E05A8A", "#7A1E2C"];
const PUFFS = [
  ["-30px", "-90px", "1", "2.2s", "3.4s"],
  ["40px", "-150px", "1.3", "2.4s", "3.68s"],
  ["-80px", "-60px", "1.5", "2.6s", "3.96s"],
  ["70px", "-220px", "1.7", "2.8s", "4.24s"],
  ["-20px", "-300px", "2", "3s", "4.52s"],
  ["110px", "-120px", "1.8", "3.2s", "4.8s"],
] as const;
const FOGS = ["4.6s", "4.78s", "4.96s", "5.14s", "5.32s", "5.5s", "5.68s"];
const FOG_SHIFT = [
  ["-82px", "19px"],
  ["54px", "272px"],
  ["-160px", "180px"],
  ["74px", "-107px"],
  ["-43px", "188px"],
  ["-140px", "-80px"],
  ["35px", "240px"],
] as const;
const BIRDS = [
  { src: `${ART}/dove.webp`, left: "8%", top: "12%", width: 40, r: "-20deg", a1: "-47px", b1: "64px", a2: "-81px", b2: "38px", a3: "-55px", b3: "72px", dur: "14s", delay: "0s", flap: "0.35s" },
  { src: `${ART}/butterfly.webp`, left: "78%", top: "20%", width: 32, r: "25deg", a1: "60px", b1: "-77px", a2: "34px", b2: "-51px", a3: "68px", b3: "-85px", dur: "17s", delay: "-2s", flap: "0.43s" },
  { src: `${ART}/dove.webp`, left: "15%", top: "62%", width: 24, r: "-10deg", a1: "-73px", b1: "30px", a2: "-47px", b2: "64px", a3: "-81px", b3: "38px", dur: "20s", delay: "-4s", flap: "0.51s" },
] as const;
const PETALS = [
  ["a", "4%", 20, "-40px", "300deg", "9s", "0s"],
  ["b", "22%", 27, "13px", "360deg", "12s", "-1.4s"],
  ["a", "40%", 32, "-24px", "420deg", "9s", "-2.8s"],
  ["b", "58%", 24, "29px", "480deg", "12s", "-4.2s"],
  ["a", "74%", 30, "-8px", "340deg", "9s", "-5.6s"],
  ["b", "90%", 22, "18px", "400deg", "12s", "-7s"],
] as const;

const FILTERS: Record<WeddingRideTheme, string> = {
  sunlit: "none",
  rose: "hue-rotate(-12deg) saturate(1.15)",
  dusk: "brightness(0.82) saturate(0.9) hue-rotate(-20deg)",
};

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Aarav", second: parts[1] || "Meher" };
}

function rideStamp(date: string) {
  const day = new Date(`${date}T12:00:00`);
  if (Number.isNaN(day.getTime())) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  return `${weekday} · ${dd} · ${mm} · ${day.getFullYear()}`;
}

function shortStamp(date: string) {
  const day = new Date(`${date}T12:00:00`);
  if (Number.isNaN(day.getTime())) return date;
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${day.getFullYear()}`;
}

function replyBy(iso: string) {
  const day = new Date(`${iso}T12:00:00`);
  if (!iso || Number.isNaN(day.getTime())) return "";
  return day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function tagOf(names: string) {
  const clean = names.replace(/[^A-Za-z& ]/g, "").split(/\s+&\s+/).map((part) => part.replace(/\s+/g, "")).filter(Boolean);
  return `#${clean.join("") || "Wedding"}Ride`;
}

function chipLabel(title: string) {
  const word = title.replace(/^the\s+/i, "").split(/[\s&]/)[0] || title;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function photoAt(photos: string[] | undefined, index: number, fallback: string) {
  const own = photos?.[index];
  return own ? assetUrl(own) : fallback;
}

function maps(venue: string, address: string) {
  const query = [venue, address].filter(Boolean).join(" ");
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = new Date(`${date || "2027-02-06"}T${time || "19:00"}:00`).getTime();
  let diff = Number.isNaN(target) ? 0 : Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff - mins * 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    [String(days), "Days"],
    [pad(hours), "Hours"],
    [pad(mins), "Mins"],
    [pad(secs), "Secs"],
  ] as const;
}

export function WeddingRideInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
  theme = "sunlit",
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
  theme?: WeddingRideTheme;
}) {
  useFonts("Great Vibes", "Cormorant Garamond", "Cinzel", "Jost");
  const pack = packOf("weddingride", fields.lines);
  const couple = coupleOf(fields.names);
  const countdown = useCountdown(fields.date, fields.time);
  const [phase, setPhase] = useState<Phase>("play");
  const timers = useRef<number[]>([]);
  const nameId = useId();
  const wishId = useId();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [going, setGoing] = useState<boolean[]>([true, true, true, true]);
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [music, setMusic] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  function cut() {
    if (phase !== "play") return;
    setPhase("snip");
    timers.current.push(window.setTimeout(() => setPhase("cut"), 650));
    timers.current.push(window.setTimeout(() => setPhase("open"), 1500));
  }

  const moments = MOMENTS.map(([fallback, photo, mask], index) => ({
    title: pack.story?.[index]?.title || fallback,
    photo: photoAt(fields.photos, index, photo),
    mask,
  }));
  const events = (pack.programme ?? []).map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    dress: index === 2 && fields.dress ? fields.dress : item.note,
  }));
  const board = [
    ...wishes.filter((item) => item.note.trim()).map((item) => ({ name: item.name, text: item.note })),
    ...(pack.wishes ?? []).map((item) => ({ name: item.by, text: item.text })),
  ];
  const loop = [...board, ...board];
  const when = [formatTime(fields.time), "onwards"].filter(Boolean).join(" ");
  const where = [fields.venue, fields.address].filter(Boolean).join(", ");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const picked = events.filter((_, index) => going[index]).map((item) => item.title);
    const note = [
      wish.trim(),
      attend === "yes" && picked.length ? `I'll be at ${picked.join(", ")}` : "",
      attend === "yes" ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
    ].filter(Boolean).join(". ");
    await onReply?.({ name: name.trim(), note, attending: attend === "yes" });
    setDone(true);
  }

  return (
    <article className={`wr${quiet ? " is-quiet" : ""} is-${phase}`} style={{ ["--theme" as string]: FILTERS[theme] }}>
      <div className="wr-reel">
      <section className="wr-stage" aria-label="Opening">
        <div className="wr-car" aria-hidden="true">
          <span />
          <img src={`${ART}/car.webp`} alt="" />
        </div>
        <div className="wr-fog" aria-hidden="true">
          {PUFFS.map(([px, py, ps, dur, delay]) => (
            <img key={delay} className="wr-puff" src={`${ART}/puff.webp`} alt="" style={{ ["--px" as string]: px, ["--py" as string]: py, ["--ps" as string]: ps, ["--dur" as string]: dur, ["--delay" as string]: delay }} />
          ))}
          {FOGS.map((delay, index) => (
            <img key={delay} className="wr-cloud" src={`${ART}/fog.webp`} alt="" style={{ ["--fx" as string]: FOG_SHIFT[index][0], ["--fy" as string]: FOG_SHIFT[index][1], ["--delay" as string]: delay }} />
          ))}
        </div>
        <div className="wr-details">
          <div className="wr-card">
            <div className="wr-card-paper" />
            <img className="wr-frame" src={`${ART}/frame.webp`} alt="" />
            <div className="wr-card-copy">
              <span className="wr-dear">Dear {fields.detail || "the Sharma family"}</span>
              <span className="wr-bless">{fields.hosts || "with the blessings of our families"}<br />{fields.title || "we invite you to the wedding of"}</span>
              <span className="wr-script">{couple.first}</span>
              <span className="wr-amp">&amp;</span>
              <span className="wr-script">{couple.second}</span>
              <span className="wr-when">{rideStamp(fields.date)}</span>
              <span className="wr-where">{when}<br />{where}</span>
            </div>
          </div>
          <div className="wr-ribbon" aria-hidden="true">
            <div className="wr-rib wr-rib-top"><img src={`${ART}/ribbon.webp`} alt="" /></div>
            <div className="wr-rib wr-rib-bot"><img src={`${ART}/ribbon.webp`} alt="" /></div>
          </div>
          {BIRDS.map((bird) => (
            <div key={bird.top} className="wr-bird" aria-hidden="true" style={{ left: bird.left, top: bird.top, width: bird.width, ["--r" as string]: bird.r, ["--a1" as string]: bird.a1, ["--b1" as string]: bird.b1, ["--a2" as string]: bird.a2, ["--b2" as string]: bird.b2, ["--a3" as string]: bird.a3, ["--b3" as string]: bird.b3, ["--dur" as string]: bird.dur, ["--delay" as string]: bird.delay, ["--flap" as string]: bird.flap }}>
              <img src={bird.src} alt="" />
            </div>
          ))}
        </div>
        {phase === "play" || phase === "snip" ? (
          <button type="button" className="wr-sci" onClick={cut} aria-label="Open the invitation">
            <img src={`${ART}/scissors.webp`} alt="" />
          </button>
        ) : null}
        {phase === "play" ? <span className="wr-hint">Tap the scissors ✂</span> : null}
        {phase === "open" ? (
          <button type="button" className="wr-go" onClick={() => document.getElementById("wr-moments")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            See our moments
          </button>
        ) : null}
      </section>

      <div className="wr-body">
        <section className="wr-gallery wr-slide" id="wr-moments">
          <div className="wr-petals" aria-hidden="true">
            {PETALS.map(([kind, left, size, dx, rot, dur, delay]) => (
              <img key={`${left}${delay}`} src={`${ART}/petal-${kind}.webp`} alt="" style={{ left, width: size, ["--dx" as string]: dx, ["--rot" as string]: rot, ["--dur" as string]: dur, ["--delay" as string]: delay }} />
            ))}
          </div>
          <img className="wr-spray wr-spray-l" src={`${ART}/spray.webp`} alt="" />
          <img className="wr-spray wr-spray-r" src={`${ART}/spray.webp`} alt="" />
          <button type="button" className="wr-music" aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={() => setMusic((on) => !on)}>
            <svg className={music ? "is-on" : undefined} width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="15" cy="15" r="14" fill="#2A1014" />
              <circle cx="15" cy="15" r="10" fill="none" stroke="#5A2A30" strokeWidth="1" />
              <circle cx="15" cy="15" r="5" fill="#F2A33A" />
              <circle cx="15" cy="15" r="1.5" fill="#FBF3E4" />
            </svg>
          </button>
          <span className="wr-kicker">{fields.names || "Aarav & Meher"}</span>
          <h2 className="wr-title">Moments before forever</h2>
          <p className="wr-lead">{fields.message || "Scroll across and walk with us through the little moments that led to the big one."}</p>
          <div className="wr-shots">
            {moments.map((moment, index) => (
              <figure key={moment.title} className="wr-shot rv">
                <div className="wr-shot-photo" style={{ ["--photo" as string]: `url("${moment.photo}")`, ["--mask" as string]: `url("${moment.mask}")` }} role="img" aria-label={moment.title} />
                {index === moments.length - 1 ? (
                  <div className="wr-shot-birds" aria-hidden="true">
                    <img src={`${ART}/dove.webp`} alt="" />
                    <img src={`${ART}/butterfly.webp`} alt="" />
                  </div>
                ) : null}
                <figcaption>{moment.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="wr-block wr-slide">
          <h2>Counting down</h2>
          <div className="wr-count">
            {countdown.map(([value, label], index) => (
              <div key={label} style={{ ["--c" as string]: COLORS[index] }}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="wr-block wr-slide">
          <h2>The celebrations</h2>
          <p className="wr-sub">Three days of joy</p>
          <div className="wr-events">
            {events.map((item) => (
              <article key={item.title} className="wr-event" style={{ ["--c" as string]: item.color }}>
                <span className="wr-dot" />
                <div>
                  <p>{item.kick}</p>
                  <h3>{item.title}</h3>
                  <p>{item.time} · {item.text}</p>
                  {item.dress ? <p className="wr-dress">Dress: {item.dress}</p> : null}
                  <div className="wr-actions">
                    <button type="button" onClick={() => { maps(item.text, fields.address); setToast(`Opening directions to ${item.text}…`); }}>Directions</button>
                    <button type="button" onClick={() => { const url = calendarUrl({ ...fields, venue: item.text, title: item.title, time: fields.time }); if (url) window.open(url, "_blank", "noopener"); setToast(`${item.title} added to your calendar.`); }}>Calendar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="wr-block wr-slide" id="wr-rsvp">
          <img className="wr-car-deco" src={`${ART}/car.webp`} alt="" />
          <h2>Kindly respond</h2>
          <p className="wr-sub">Hop in, join the ride?</p>
          {fields.rsvpBy ? <p className="wr-sub">Please reply by {replyBy(fields.rsvpBy)}</p> : null}
          {done ? (
            <div className="wr-done">
              <h3>{attend === "yes" ? "See you there" : "We will miss you"}</h3>
              <p>{attend === "yes" ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved.` : `Thank you for letting us know, ${name.trim()}.`}</p>
              <button type="button" className="wr-edit" onClick={() => setDone(false)}>Change my reply</button>
            </div>
          ) : (
            <form className="wr-rsvp" onSubmit={submit}>
              <label htmlFor={nameId}>Your name
                <input id={nameId} value={name} onChange={(event) => { setName(event.target.value); setNameError(false); }} style={nameError ? { borderColor: "#C45B63" } : undefined} />
              </label>
              {nameError ? <span className="wr-error">Please enter your name.</span> : null}
              <div className="wr-choice">
                <button type="button" className={attend === "yes" ? "is-on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Count me in</button>
                <button type="button" className={attend === "no" ? "is-on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Can&apos;t make it</button>
              </div>
              {attend === "yes" ? (
                <>
                  <span>I&apos;ll be at</span>
                  <div className="wr-chips">
                    {events.map((item, index) => (
                      <button key={item.title} type="button" className={going[index] ? "is-on" : undefined} aria-pressed={Boolean(going[index])} onClick={() => setGoing((current) => current.map((on, i) => i === index ? !on : on))}>{chipLabel(item.title)}</button>
                    ))}
                  </div>
                  <div className="wr-guests">
                    <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                    <strong>{guests}</strong>
                    <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                  </div>
                </>
              ) : null}
              <label htmlFor={wishId}>A wish for the couple
                <textarea id={wishId} value={wish} onChange={(event) => setWish(event.target.value)} placeholder="(optional)" />
              </label>
              <button className="wr-send" type="submit">Send RSVP</button>
            </form>
          )}
        </section>

        {loop.length ? (
          <section className="wr-block wr-slide" aria-label="Wishes on the way">
            <h2>Wishes on the way</h2>
            <div className="wr-wishes">
              <div className="wr-marq">
                {loop.map((item, index) => (
                  <blockquote key={`${item.name}-${index}`} className="wr-wish">
                    <p>{item.text}</p>
                    <span>— {item.name}</span>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <footer className="wr-thanks wr-slide">
          <span className="wr-kicker">Thank you</span>
          <h2 className="wr-title">{fields.names || `${couple.first} & ${couple.second}`}</h2>
          <p className="wr-sub">for being part of our journey</p>
          <span className="wr-when">{shortStamp(fields.date)} · {tagOf(fields.names)}</span>
          <a className="wr-made" href={madeWithHref("weddingride")}>Made with InvitesReady</a>
          <div className="wr-drive" aria-hidden="true"><img src={`${ART}/car.webp`} alt="" /></div>
        </footer>
      </div>
      </div>

      {toast ? (
        <div className="wr-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </article>
  );
}
