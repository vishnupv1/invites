import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem } from "../data/custom";
import { calendarUrl } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./villa.css";

export type VillaTheme = "olive";

type Reply = { name: string; note: string; attending: boolean };

const SWATCHES = [
  ["#8C9A6B", "Sage"],
  ["#C67F5E", "Terracotta"],
  ["#E8B9A6", "Blush"],
  ["#D9C27A", "Lemon"],
  ["#7E8FA8", "Dusk"],
] as const;

const PHONE_BULBS: [number, number, string, string][] = [
  [23, 29, "1.10s", "2.2s"], [51, 84, "1.21s", "2.7s"], [79, 53, "1.32s", "3.2s"],
  [107, 80, "1.43s", "3.7s"], [135, 45, "1.53s", "4.2s"], [163, 44, "1.64s", "2.2s"],
  [218, 29, "1.75s", "2.7s"], [246, 84, "1.86s", "3.2s"], [274, 53, "1.97s", "3.7s"],
  [302, 80, "2.08s", "4.2s"], [330, 45, "2.18s", "2.2s"], [358, 44, "2.29s", "2.7s"],
];

const DESK_BULBS: [number, number, string, string][] = [
  [49, 23, "1.10s", "2.2s"], [102, 85, "1.15s", "2.7s"], [156, 47, "1.21s", "3.2s"],
  [209, 87, "1.26s", "3.7s"], [262, 52, "1.32s", "4.2s"], [316, 70, "1.37s", "2.2s"],
  [369, 38, "1.43s", "2.7s"], [422, 70, "1.48s", "3.2s"], [529, 23, "1.53s", "3.7s"],
  [582, 85, "1.59s", "4.2s"], [636, 47, "1.64s", "2.2s"], [689, 87, "1.70s", "2.7s"],
  [742, 52, "1.75s", "3.2s"], [796, 70, "1.80s", "3.7s"], [849, 38, "1.86s", "4.2s"],
  [902, 70, "1.91s", "2.2s"], [1009, 23, "1.97s", "2.7s"], [1062, 85, "2.02s", "3.2s"],
  [1116, 47, "2.08s", "3.7s"], [1169, 87, "2.13s", "4.2s"], [1222, 52, "2.18s", "2.2s"],
  [1276, 70, "2.24s", "2.7s"], [1329, 38, "2.29s", "3.2s"], [1382, 70, "2.35s", "3.7s"],
];

const PHONE_WIRE = "M0 4 Q98 104 195 4 M56 45 L56 87 M111 53 L111 83 M167 28 L167 46 M195 4 Q292 104 390 4 M251 45 L251 87 M306 53 L306 83 M362 28 L362 46";
const DESK_WIRE = "M0 4 Q240 100 480 4 M107 37 L107 87 M213 51 L213 89 M320 47 L320 73 M427 23 L427 73 M480 4 Q720 100 960 4 M587 37 L587 87 M693 51 L693 89 M800 47 L800 73 M907 23 L907 73 M960 4 Q1200 100 1440 4 M1067 37 L1067 87 M1173 51 L1173 89 M1280 47 L1280 73 M1387 23 L1387 73";

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function when(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function heroDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${weekday} · ${day.getDate()} ${month} · ${day.getFullYear()}`;
}

function replyDate(iso: string) {
  const day = when(iso);
  if (!day) return iso;
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${day.getDate()} ${month} ${day.getFullYear()}`;
}

function footDate(date: string, place: string) {
  const day = when(date);
  if (!day) return place.toUpperCase();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(day.getDate())} · ${pad(day.getMonth() + 1)} · ${day.getFullYear()} · ${place.toUpperCase()}`;
}

function pairOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Aditi", second: parts[1] || "" };
}

function Lights({ bulbs, path, width, height, variant }: { bulbs: [number, number, string, string][]; path: string; width: number; height: number; variant: string }) {
  return (
    <div className={`vs-lights ${variant}`} aria-hidden="true">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={path} fill="none" stroke="#6B6A4E" strokeWidth="1.2" opacity="0.75" />
      </svg>
      {bulbs.map(([left, top, delay, flicker]) => (
        <span key={`${left}-${top}`} className="vs-b" style={{ left, top, ["--d" as string]: delay, ["--f" as string]: flicker }} />
      ))}
    </div>
  );
}

export function VillaInvite({
  fields,
  onReply,
}: {
  fields: InviteFields;
  theme?: VillaTheme;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond", "Jost");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nameId = useId();
  const noteId = useId();
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
  const [wish, setWish] = useState("");
  const [extraWishes, setExtraWishes] = useState<{ text: string; by: string }[]>([]);
  const [bank, setBank] = useState(false);

  const pack = packOf("villa", fields.lines);
  const photos = (fields.photos ?? []).map((photo) => photo || "");
  const events: ProgrammeItem[] = pack.programme?.length
    ? pack.programme
    : [{ kick: heroDate(fields.date), title: "The ceremony", time: "", text: fields.venue, note: fields.dress }];
  const story = pack.story ?? [];
  const parents = pack.people ?? [];
  const wishes = [...extraWishes, ...(pack.wishes ?? [])].slice(0, 3);
  const menu = pack.facts ?? [];
  const stays = pack.rooms ?? [];
  const bankRows = pack.faqs ?? [];
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const mapQuery = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : place;
  const names = pairOf(fields.names);
  const region = fields.address.split(",").map((part) => part.trim()).filter(Boolean).pop() || "Tuscany";
  const tag = (pack.caption || "#AditiVikramInTuscany").replace(/\s+/g, "");
  const storyPhoto = photos[0] ? assetUrl(photos[0]) : "";
  const calendar = calendarUrl(fields);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => setDesk(node.clientWidth >= 860);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const fit = fitRef.current;
    if (!stage || !fit) return;
    const apply = () => {
      const width = stage.clientWidth;
      const wide = width >= 860;
      const visible = window.visualViewport?.height ?? window.innerHeight;
      const designW = wide ? 1440 : 390;
      const designH = wide ? 900 : 844;
      const height = wide ? visible : Math.min(width * (designH / designW), Math.max(visible, 480));
      const scale = Math.min(width / designW, height / designH);
      stage.style.aspectRatio = "auto";
      stage.style.maxHeight = "none";
      stage.style.minHeight = "0";
      stage.style.height = `${height}px`;
      fit.style.width = `${designW}px`;
      fit.style.height = `${designH}px`;
      fit.style.maxWidth = "none";
      fit.style.position = "absolute";
      fit.style.left = "50%";
      fit.style.top = "50%";
      fit.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage);
    window.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)); }, []);

  function openCover() {
    if (live) return;
    if (reduced()) {
      setLive(true);
      setCover(false);
      return;
    }
    setLive(true);
    timers.current.push(window.setTimeout(() => setCover(false), 3600));
  }

  function replay() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setLive(false);
    setCover(true);
    rootRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }

  function directions() {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`, "_blank", "noopener");
  }

  function openInstagram() {
    const handle = (pack.instagram || "").replace(/^@/, "").trim();
    const hash = tag.replace(/^#/, "");
    const url = handle
      ? `https://www.instagram.com/${encodeURIComponent(handle)}/`
      : `https://www.instagram.com/explore/tags/${encodeURIComponent(hash)}/`;
    window.open(url, "_blank", "noopener");
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
    ].filter(Boolean).join(" · ");
    try {
      await onReply?.({ name: name.trim(), note, attending: yes });
      setDone(true);
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : "Could not send your reply.");
    }
  }

  function sendWish() {
    const text = wish.trim();
    if (!text) {
      setToast("Write a few words first.");
      return;
    }
    setExtraWishes((items) => [{ text, by: "You" }, ...items]);
    setWish("");
    setToast("Your wish has been added. Grazie!");
  }

  const target = new Date(`${fields.date}T${fields.time || "16:30"}:00`).getTime();
  let left = Math.max(0, Math.floor(((Number.isNaN(target) ? Date.now() : target) - now) / 1000));
  const days = Math.floor(left / 86400);
  left %= 86400;
  const count = [
    [days, "Days"],
    [Math.floor(left / 3600), "Hours"],
    [Math.floor((left % 3600) / 60), "Min"],
    [left % 60, "Sec"],
  ] as const;
  const first = name.trim().split(" ")[0];

  return (
    <div ref={rootRef} className={`vs${desk ? " is-desk" : ""}${live ? " is-live" : ""}`} data-motion={live && reduced() ? "off" : undefined} data-theme="olive">
      <section className="vs-stage" ref={stageRef}>
        <div className="vs-fit" ref={fitRef}>
          <Lights bulbs={PHONE_BULBS} path={PHONE_WIRE} width={390} height={156} variant="phone" />
          <Lights bulbs={DESK_BULBS} path={DESK_WIRE} width={1440} height={150} variant="desk" />
          <span className="vs-glow" aria-hidden="true" />
          <img className="vs-lem l" src="/villa/lemons.webp" alt="" />
          <img className="vs-lem r" src="/villa/lemons.webp" alt="" />
          <img className="vs-garden" src="/villa/garden.webp" alt="" />
          <p className="vs-head">We’re getting married!</p>
          <img className="vs-badge" src="/villa/badge.webp" alt="" />
          <div className="vs-hero">
            <h1 className="vs-names">
              <span>{names.first}</span>
              {names.second ? <span className="vs-amp"> &amp; </span> : null}
              {names.second ? <span>{names.second}</span> : null}
            </h1>
            <span className="vs-date">{heroDate(fields.date)}</span>
            <span className="vs-place">{place}</span>
          </div>
          {live && !cover ? <a className="vs-scroll" href="#vs-welcome">SCROLL TO CONTINUE ↓</a> : null}
          {cover ? (
            <div className="vs-lid">
              <div className="vs-cover">
                <span className="vs-cover-tex" aria-hidden="true" />
                <img className="vs-oval" src="/villa/oval.webp" alt="" />
                <span className="vs-kicker">A CELEBRATION OF LOVE</span>
                <p className="vs-cover-names">{fields.names}</p>
                <span className="vs-shade" />
              </div>
              {!live ? <span className="vs-ring" aria-hidden="true" /> : null}
              {!live ? <span className="vs-tap">TAP TO OPEN</span> : null}
              {!live ? <button type="button" className="vs-hit" aria-label="Open the invitation" onClick={openCover} /> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="vs-sec" id="vs-welcome">
        <img className="vs-branch" src="/villa/branch.webp" alt="" />
        <span className="vs-kick">{(fields.hosts || "Together with their families").toUpperCase()}</span>
        <div className="vs-parents">
          {parents.map((person, index) => (
            <span key={person.name} style={{ display: "contents" }}>
              {index > 0 ? <span className="vs-amp-script">&amp;</span> : null}
              <span className="vs-person">
                <span className="vs-small">{person.role.toUpperCase()}</span>
                <span className="vs-pname">{person.name}</span>
              </span>
            </span>
          ))}
        </div>
        <p className="vs-lead">{fields.message}</p>
      </section>

      <section className="vs-sec alt">
        <h2 className="vs-h2">Countdown</h2>
        <div className="vs-count">
          {count.map(([value, label]) => (
            <div key={label}>
              <strong>{String(value).padStart(2, "0")}</strong>
              <span className="vs-small">{label.toUpperCase()}</span>
            </div>
          ))}
        </div>
        <span className="vs-lead vs-until">until the big day</span>
      </section>

      <section className="vs-sec">
        <span className="vs-kick">THE CELEBRATION WILL TAKE PLACE AT</span>
        <h2 className="vs-h2">{fields.venue}</h2>
        <span className="vs-addr">{fields.address.toUpperCase().replaceAll(",", " ·")}</span>
        {pack.venueNote ? <span className="vs-lead">{pack.venueNote}</span> : null}
        <img className="vs-villa" src="/villa/villa.webp" alt="" />
        <div className="vs-actions">
          <button type="button" className="vs-btn solid" onClick={directions}>Open in Google Maps</button>
          <a className="vs-btn line" href={calendar}>Add to calendar</a>
        </div>
      </section>

      <section className="vs-sec alt">
        <span className="vs-kick">OUR STORY</span>
        <h2 className="vs-h2">How it all began</h2>
        <div className="vs-story">
          <div className="vs-frame">
            <button type="button" className="vs-slot" aria-label="Add a couple photo" onClick={() => setToast("Couples add their own photos here in the editor.")}>
              {storyPhoto ? <img src={storyPhoto} alt="" /> : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#66703F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
                  <span className="vs-small">ADD YOUR PHOTO</span>
                </>
              )}
            </button>
            <img src="/villa/oval.webp" alt="" />
          </div>
          <div className="vs-beats">
            {story.map((beat) => (
              <div key={beat.year + beat.title} className="vs-beat">
                <span className="vs-year">{beat.year}</span>
                <h3>{beat.title}</h3>
                <p>{beat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="vs-sec">
        <span className="vs-kick">THE WEEKEND</span>
        <h2 className="vs-h2">Three days in Tuscany</h2>
        <div className="vs-events">
          {events.map((event) => (
            <div key={event.kick + event.title} className="vs-event vs-card">
              <span className="vs-small">{event.kick}</span>
              <h3>{event.title}</h3>
              <span className="vs-time">{event.time}</span>
              <span className="vs-where">{event.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-sec alt vs-feast">
        <span className="vs-walk l"><img src="/villa/walk-l.webp" alt="" /></span>
        <span className="vs-walk r"><img src="/villa/walk-r.webp" alt="" /></span>
        <span className="vs-kick">MENU</span>
        <h2 className="vs-h2">The Feast</h2>
        <div className="vs-menu">
          {menu.map((item) => (
            <div key={item.label}>
              <h3>{item.label}</h3>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
        <img className="vs-feast-img" src="/villa/feast.webp" alt="" />
      </section>

      <section className="vs-sec">
        <span className="vs-kick">WHAT TO WEAR</span>
        <h2 className="vs-h2">Dress Code</h2>
        <span className="vs-dress">{fields.dress || "Garden Formal"}</span>
        <p className="vs-lead">Think flowing fabrics, soft florals and comfortable shoes for the gravel paths. Ivory and cream are reserved for the bride.</p>
        <div className="vs-swatches">
          {SWATCHES.map(([color, label]) => (
            <div key={label}>
              <i style={{ background: color }} />
              <span className="vs-small">{label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-sec alt">
        <img className="vs-bouquet" src="/villa/bouquet.webp" alt="" />
        <span className="vs-kick">WEDDING REGISTRY</span>
        <h2 className="vs-h2">Gifts</h2>
        <p className="vs-lead">{pack.gift || "Your presence is the greatest gift."}</p>
        <button type="button" className="vs-bank" aria-expanded={bank} onClick={() => setBank((open) => !open)}>
          {bank ? bankRows.map((row) => (
            <span key={row.q} style={{ display: "contents" }}>
              <span className="vs-small">{row.q.toUpperCase()}</span>
              <strong>{row.a}</strong>
            </span>
          )) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#66703F" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              <span className="vs-small">TAP TO REVEAL BANK DETAILS</span>
            </>
          )}
        </button>
      </section>

      <section className="vs-sec">
        <img className="vs-car" src="/villa/car.webp" alt="" />
        <span className="vs-kick">GETTING AROUND</span>
        <h2 className="vs-h2">Transportation</h2>
        <p className="vs-lead">{pack.travelFrom}</p>
      </section>

      <section className="vs-sec alt">
        <span className="vs-kick">WHERE TO STAY</span>
        <h2 className="vs-h2">Accommodation</h2>
        <div className="vs-stay-row">
          <img className="vs-lemons" src="/villa/lemons.webp" alt="" />
          <div className="vs-stays">
            {stays.map((stay) => (
              <div key={stay.name} className="vs-stay vs-card">
                <h3>{stay.name}</h3>
                <span className="vs-where">{stay.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="vs-sec">
        <span className="vs-kick">BLESSINGS &amp; WISHES</span>
        <h2 className="vs-h2">Words from loved ones</h2>
        <div className="vs-wishes">
          {wishes.map((item) => (
            <div key={item.by + item.text} className="vs-wish vs-card">
              <q>“</q>
              <p>{item.text}</p>
              <cite>— {item.by}</cite>
            </div>
          ))}
        </div>
        <form className="vs-wish-form" onSubmit={(event) => { event.preventDefault(); sendWish(); }}>
          <input className="vs-field" aria-label="Your wish for the couple" value={wish} onChange={(event) => setWish(event.target.value)} placeholder={`Leave a wish for ${fields.names}…`} />
          <button type="submit" className="vs-btn solid">Send</button>
        </form>
      </section>

      <section className="vs-sec alt" id="vs-rsvp">
        <h2 className="vs-h2">Confirm your attendance</h2>
        <span className="vs-addr">KINDLY REPLY BY {replyDate(fields.rsvpBy)}</span>
        <div className="vs-form vs-card">
          {done ? (
            <div className="vs-done">
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} className="vs-leaf" style={{ left: `${6 + (index * 37) % 86}%`, background: index % 3 ? "#7D8A4E" : "#A9B67A", ["--x" as string]: `${(index % 2 ? 1 : -1) * (16 + index * 4)}px`, ["--r" as string]: `${index * 75}deg`, animationDelay: `${(index % 5) * 0.12}s` }} aria-hidden="true" />
              ))}
              <img src="/villa/bouquet.webp" alt="" />
              <h3>{attend === "yes" ? `Grazie, ${first}!` : "We’ll miss you"}</h3>
              <p className="vs-lead">{attend === "yes" ? `Your reply is confirmed. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you in Tuscany.` : "Thank you for letting us know — we’ll raise a glass to you."}</p>
              <button type="button" className="vs-link" onClick={() => setDone(false)}>Change my reply</button>
            </div>
          ) : (
            <>
              <div className="vs-stack">
                <label className="vs-lab" htmlFor={nameId}>Full name *</label>
                <input id={nameId} className="vs-field" value={name} onChange={(event) => { setName(event.target.value); setNameErr(false); }} placeholder="Your name" />
                {nameErr ? <span className="vs-err">Please enter your name.</span> : null}
              </div>
              <div className="vs-stack">
                <span className="vs-lab">Will you attend? *</span>
                <button type="button" className={`vs-choice${attend === "yes" ? " on" : ""}`} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Yes, I’ll be there!</button>
                <button type="button" className={`vs-choice${attend === "no" ? " on" : ""}`} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>No, I can’t make it</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="vs-step">
                    <span className="vs-lab">Guests</span>
                    <div>
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                      <strong aria-live="polite">{guests}</strong>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                    </div>
                  </div>
                  <div className="vs-stack">
                    <span className="vs-lab">Joining us for</span>
                    <div className="vs-chips">
                      {events.map((event, index) => {
                        const on = picked[index] !== false;
                        return (
                          <button key={event.title} type="button" className={`vs-chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}>{event.title}</button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
              <div className="vs-stack">
                <label className="vs-lab" htmlFor={noteId}>Message for the couple (optional)</label>
                <textarea id={noteId} className="vs-area" rows={3} value={msg} onChange={(event) => setMsg(event.target.value)} placeholder="Write us a few words…" />
              </div>
              <button type="button" className="vs-btn solid vs-wide" onClick={submit}>Confirm</button>
            </>
          )}
        </div>
      </section>

      <section className="vs-sec">
        <div className="vs-thanks">
          <div className="vs-thanks-in">
            <span className="vs-grazie">Grazie</span>
            <span className="vs-lead">We can’t wait to celebrate with you under the Tuscan sun.</span>
            <span className="vs-tag">{tag.startsWith("#") ? tag : `#${tag}`}</span>
            <button type="button" className="vs-btn line" onClick={openInstagram}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              Share on Instagram
            </button>
          </div>
        </div>
      </section>

      <footer className="vs-foot">
        <p className="vs-foot-names">{fields.names}</p>
        <span className="vs-small">{footDate(fields.date, region)}</span>
        <button type="button" className="vs-link" onClick={replay}>↺ Open the invitation again</button>
        <Link className="vs-made" to="/">MADE WITH INVITESREADY</Link>
        <img className="vs-foot-garden" src="/villa/garden.webp" alt="" />
      </footer>

      {toast ? (
        <div className="vs-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
