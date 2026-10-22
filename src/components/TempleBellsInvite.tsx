import { useEffect, useId, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import { formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields, TemplateShot } from "../types";
import "./templebells.css";

type Phase = "closed" | "push" | "crest" | "done" | "page";
type Reply = { name: string; note: string; attending: boolean };

const ART = "/templebells";
const SHOTS: TemplateShot[] = [
  { label: "First meeting" },
  { label: "The yes" },
  { label: "Us" },
];
const SAMPLE = [`${ART}/photo-1.webp`, `${ART}/photo-2.webp`, `${ART}/photo-3.webp`];
const PETALS = [
  ["0%", 18, "-40px", "300deg", "9s", "0s", 1],
  ["97%", 25, "13px", "361deg", "12s", "1.4s", 2],
  ["94%", 18, "-24px", "422deg", "9s", "2.8s", 3],
  ["91%", 25, "29px", "483deg", "12s", "4.2s", 4],
  ["88%", 18, "-8px", "544deg", "9s", "5.6s", 5],
  ["85%", 25, "45px", "605deg", "12s", "7s", 1],
  ["82%", 18, "8px", "666deg", "9s", "8.4s", 2],
  ["79%", 25, "-29px", "327deg", "12s", "9.8s", 3],
  ["76%", 18, "24px", "388deg", "9s", "2.2s", 4],
  ["73%", 25, "-13px", "449deg", "12s", "0.6s", 5],
] as const;
const BIRDS = [
  { left: "35%", top: "51%", bx: "80px", by: "-160px", w: 18, delay: "0.2s" },
  { left: "44%", top: "54%", bx: "-127px", by: "-221px", w: 22, delay: "0.32s" },
  { left: "54%", top: "57%", bx: "174px", by: "-282px", w: 26, delay: "0.44s" },
  { left: "63%", top: "52%", bx: "-221px", by: "-343px", w: 18, delay: "0.56s" },
  { left: "42%", top: "55%", bx: "108px", by: "-204px", w: 22, delay: "0.68s" },
  { left: "51%", top: "58%", bx: "-155px", by: "-265px", w: 26, delay: "0.8s" },
  { left: "61%", top: "53%", bx: "202px", by: "-326px", w: 18, delay: "0.92s" },
] as const;
const WICKS = [
  ["26.7%", "22%", "0.9s"],
  ["38.2%", "22.2%", "1.03s"],
  ["49.1%", "18.4%", "1.16s"],
  ["59.8%", "21.2%", "1.29s"],
  ["70.3%", "22%", "1.42s"],
] as const;
const DOTS = ["#7A1E2C", "#C8A24A", "#F6EEDC", "#3E7B3A", "#E88AA6"];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Karthik", second: parts[1] || "Meenakshi" };
}

function initialOf(name: string) {
  return (name.trim()[0] || "").toUpperCase();
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function heroDate(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" });
  const month = day.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday} · ${day.getDate()} ${month} ${day.getFullYear()}`;
}

function stamp(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${day.getFullYear()}`;
}

function replyBy(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" });
  return `${day.getDate()} ${month} ${day.getFullYear()}`;
}

function tagOf(names: string) {
  const clean = names.replace(/[^A-Za-z& ]/g, "").split(/\s+&\s+/).map((part) => part.replace(/\s+/g, "")).filter(Boolean);
  return `#${clean.join("Weds") || "KarthikWedsMeenakshi"}`;
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const target = new Date(`${date || "2027-02-10"}T${time || "07:30"}:00`).getTime();
  let diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const mins = Math.floor(diff / 60);
  const secs = diff - mins * 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    [String(days), "Days"],
    [pad(hours), "Hours"],
    [pad(mins), "Mins"],
    [pad(secs), "Secs"],
  ] as const;
}

function Rule({ width = 170 }: { width?: number }) {
  return (
    <svg width={width} height="16" viewBox="0 0 200 16" aria-hidden="true">
      <path d="M4 8 H80 M120 8 H196" stroke="#C8A24A" strokeWidth="1.2" />
      <circle cx="88" cy="8" r="2" fill="#C8A24A" />
      <circle cx="112" cy="8" r="2" fill="#C8A24A" />
      <path d="M100 1 L107 8 L100 15 L93 8 Z" fill="none" stroke="#7A1E2C" strokeWidth="1.4" />
      <circle cx="100" cy="8" r="2" fill="#7A1E2C" />
    </svg>
  );
}

function Petals({ far }: { far: string }) {
  return (
    <div className="tb-petals" aria-hidden="true">
      {PETALS.map(([left, size, dx, rot, dur, delay, src]) => (
        <img
          key={`${left}-${delay}`}
          className="tb-petal"
          src={`${ART}/petal-${src}.webp`}
          alt=""
          style={{ left, width: size, ["--dx" as string]: dx, ["--fy" as string]: far, ["--rot" as string]: rot, animationDuration: dur, animationDelay: delay }}
        />
      ))}
    </div>
  );
}

function Bird({ left, top, bx, by, w, delay }: (typeof BIRDS)[number]) {
  return (
    <div className="tb-bird" style={{ left, top, ["--bx" as string]: bx, ["--by" as string]: by, animationDelay: delay }} aria-hidden="true">
      <svg width={w} height="12" viewBox="0 0 24 12">
        <path d="M1 8 Q6 1 12 7 Q18 1 23 8" fill="none" stroke="#5E4632" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function TempleBellsInvite({
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
  useFonts("Rozha One", "Marcellus SC", "Cormorant Garamond");
  const pack = packOf("templebells", fields.lines);
  const couple = coupleOf(fields.names);
  const parents = fields.hosts.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const [phase, setPhase] = useState<Phase>(quiet ? "page" : "closed");
  const timers = useRef<number[]>([]);
  const countdown = useCountdown(fields.date, fields.time);
  const nameId = useId();
  const wishId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [music, setMusic] = useState(false);
  const [ring, setRing] = useState(0);
  const [lit, setLit] = useState(0);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  function enter() {
    if (phase !== "closed") return;
    setPhase("push");
    timers.current.push(window.setTimeout(() => setPhase("crest"), 2300));
    timers.current.push(window.setTimeout(() => setPhase("done"), 3800));
  }

  function toggleMusic() {
    const node = audioRef.current;
    if (!node) {
      setMusic((on) => !on);
      return;
    }
    if (music) {
      node.pause();
      setMusic(false);
      return;
    }
    void node.play().then(() => setMusic(true)).catch(() => setMusic(false));
  }

  function light() {
    if (lit > 0) {
      setToast(`Your blessing is already glowing. Thank you!`);
      return;
    }
    for (let step = 1; step <= WICKS.length; step += 1) {
      timers.current.push(window.setTimeout(() => setLit(step), step * 260));
    }
    timers.current.push(window.setTimeout(() => {
      setToast(`Thank you for lighting the lamp for ${couple.first} & ${couple.second}.`);
    }, 1800));
  }

  async function submit() {
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

  function openMap(where: string) {
    const query = where || [fields.venue, fields.address].filter(Boolean).join(" ");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
  }

  function openCalendar(title: string, where: string) {
    if (!fields.date) return;
    const [hourText, minuteText] = (fields.time || "07:30").split(":");
    const hour = String(hourText).padStart(2, "0");
    const minute = String(minuteText || "0").padStart(2, "0");
    const start = `${fields.date.replaceAll("-", "")}T${hour}${minute}00`;
    const endHour = String((Number(hour) + 2) % 24).padStart(2, "0");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${title} · ${fields.names}`,
      dates: `${start}/${fields.date.replaceAll("-", "")}T${endHour}${minute}00`,
      location: where,
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener");
  }

  const events = pack.programme ?? [];
  const chips = events.map((item) => item.title).filter(Boolean);
  const chosen = chips.filter((label) => picked[label] !== false);
  const saved = attend === "yes"
    ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved${chosen.length ? ` for the ${chosen.join(" and ")}` : ""}.`
    : `Thank you for letting us know, ${name.trim()}. We will share the photographs with you.`;
  const notes = photoNotes(fields.notes, SHOTS);
  const live = Boolean(onReply);
  const photos = SHOTS.map((_, index) => (fields.photos?.[index] ? assetUrl(fields.photos[index]) : live ? "" : SAMPLE[index]));
  const cards = (pack.wishes ?? []).map((item) => ({ name: item.by, text: item.text }));
  const guestWishes = wishes.filter((item) => item.note?.trim()).map((item) => ({ name: item.name, text: item.note }));
  const mine = done && wish.trim() ? [{ name: name.trim(), text: wish.trim() }] : [];
  const loop = [...mine, ...guestWishes, ...cards];
  const wishLoop = loop.length ? [...loop, ...loop] : [];
  const showPage = quiet || phase === "page";
  const showPetals = phase === "crest" || phase === "done";
  const when = events[1]?.time || (fields.time ? formatTime(fields.time) : "");
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");

  return (
    <article className={`tb${showPage ? " is-page" : ""} is-${phase}${quiet ? " is-quiet" : ""}`}>
      {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop preload="none" /> : null}
      {!showPage ? (
        <div className="tb-intro">
          <img className="tb-sky tb-sky-m" src={`${ART}/sky-m.webp`} alt="" />
          <img className="tb-sky tb-sky-d" src={`${ART}/sky-d.webp`} alt="" />
          <div className="tb-haze" aria-hidden="true" />
          {BIRDS.map((bird) => <Bird key={`${bird.left}-${bird.delay}`} {...bird} />)}
          <div className="tb-gop">
            <img src={`${ART}/gopuram.webp`} alt="Temple gopuram" />
          </div>
          <div className="tb-crest">
            <img src={`${ART}/crest.webp`} alt="" />
            <span className="tb-mark">{initialOf(couple.first)}<i>&amp;</i>{initialOf(couple.second)}</span>
          </div>
          <img className="tb-jasmine" src={`${ART}/jasmine.webp`} alt="" />
          {showPetals ? <Petals far="110vh" /> : null}
          <img className="tb-leaf l" src={`${ART}/leaves-l.webp`} alt="" />
          <img className="tb-leaf r" src={`${ART}/leaves-r.webp`} alt="" />
          <div className="tb-bell" style={{ left: "14%", top: -60, width: 40 }}><img src={`${ART}/bell.webp`} alt="" /></div>
          <div className="tb-bell b" style={{ left: "76%", top: -90, width: 36, animationDelay: "-1.2s" }}><img src={`${ART}/bell.webp`} alt="" /></div>
          <div className="tb-names">
            <span className="kicker">With the blessings of the Almighty</span>
            <strong>{couple.first}</strong>
            <span className="tb-gold">&amp;</span>
            <strong>{couple.second}</strong>
          </div>
          <div className="tb-card">
            <div className="tb-when">
              <b>{heroDate(fields.date)}</b>
              <span>{[when && `Muhurtham ${when}`, place].filter(Boolean).join(" · ")}</span>
            </div>
            <button type="button" className="tb-cta" onClick={() => setPhase("page")}>Enter the celebration <span aria-hidden="true">→</span></button>
          </div>
          {phase === "closed" ? (
            <>
              <button type="button" className="tb-hit" onClick={enter} aria-label="Step inside the temple to open the invitation" />
              <span className="tb-hint">Tap to step inside</span>
              <span className="tb-await">An invitation awaits beyond the leaves</span>
            </>
          ) : null}
        </div>
      ) : (
        <div className="tb-page">
          <button type="button" className={`tb-disc${music ? " is-on" : ""}`} onClick={toggleMusic} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"}>
            <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="15" cy="15" r="14" fill="#3A0E14" />
              <circle cx="15" cy="15" r="10" fill="none" stroke="#6A1A24" strokeWidth="1" />
              <circle cx="15" cy="15" r="5" fill="#C8A24A" />
              <circle cx="15" cy="15" r="1.5" fill="#FBF6EC" />
            </svg>
          </button>
          <section className="tb-hero">
            <Petals far="1160px" />
            <img className="tb-leaf l" src={`${ART}/leaves-l.webp`} alt="" />
            <img className="tb-leaf r" src={`${ART}/leaves-r.webp`} alt="" />
            <img className="tb-garland" src={`${ART}/jasmine.webp`} alt="" />
            <img className="tb-arches" src={`${ART}/arches.webp`} alt="" />
            <img className="tb-pillar l" src={`${ART}/pillar.webp`} alt="" />
            <img className="tb-pillar r" src={`${ART}/pillar.webp`} alt="" />
            <div className="tb-hang" style={{ left: "16%", top: 91, width: 30 }}><img src={`${ART}/bell.webp`} alt="" style={{ animation: ring ? "tb-ring 1.6s ease-out both" : undefined }} /></div>
            <div className="tb-hang" style={{ left: "47%", top: 101, width: 28, animationDelay: "-0.8s" }}><img src={`${ART}/bell.webp`} alt="" /></div>
            <div className="tb-hang" style={{ left: "77%", top: 91, width: 30, animationDelay: "-1.6s" }}><img src={`${ART}/bell.webp`} alt="" /></div>
            <button type="button" className="tb-ringhit" aria-label="Ring the temple bells" onClick={() => setRing((value) => value + 1)} />
            <div className="tb-crest-page">
              <img src={`${ART}/crest.webp`} alt="" />
              <span className="tb-mark">{initialOf(couple.first)}<i>&amp;</i>{initialOf(couple.second)}</span>
            </div>
            <span className="tb-kicker">Sri Ganeshaya Namah</span>
            <span className="tb-invite">{fields.title || "With the blessings of our elders, we joyfully invite you to the wedding of"}</span>
            <span className="tb-person">{couple.first}</span>
            {parents[0] ? <span className="tb-parent">{parents.length > 1 ? `son of ${parents[0]}` : parents[0]}</span> : null}
            <span className="tb-gold">&amp;</span>
            <span className="tb-person">{couple.second}</span>
            {parents[1] ? <span className="tb-parent">daughter of {parents[1]}</span> : null}
            <Rule width={180} />
            <span className="tb-day">{heroDate(fields.date)}</span>
            <span className="tb-place">{[when && `Muhurtham ${when}`, place].filter(Boolean).join("\n").split("\n").map((line) => <span key={line} style={{ display: "block" }}>{line}</span>)}</span>
            <div className="tb-count">
              {countdown.map(([value, label]) => (
                <div key={label}><b>{value}</b><span>{label}</span></div>
              ))}
            </div>
          </section>

          <section className="tb-block tb-story">
            <Petals far="1260px" />
            <span className="tb-eyebrow">Our story</span>
            <h2>Two hearts, one journey</h2>
            <Rule />
            <div className="tb-couple"><img src={`${ART}/couple.webp`} alt={`${couple.first} and ${couple.second}`} /></div>
            {fields.message ? <p className="tb-lead">{fields.message}</p> : null}
            {photos.some(Boolean) ? (
              <div className="tb-frames">
                {SHOTS.map((shot, index) => photos[index] ? (
                  <figure key={shot.label}>
                    <div className="tb-arch"><i style={{ backgroundImage: `url("${photos[index]}")` }} /></div>
                    <figcaption>{notes[index]?.title || shot.label}</figcaption>
                  </figure>
                ) : null)}
              </div>
            ) : null}
          </section>

          {events.length ? (
            <section className="tb-block tb-events-wrap">
              <img className="tb-ghost" src={`${ART}/gopuram.webp`} alt="" />
              <span className="tb-eyebrow">The celebrations</span>
              <h2>{events.length === 1 ? "The celebration" : `${["", "One", "Two", "Three", "Four"][events.length] || events.length} auspicious days`}</h2>
              <Rule />
              <div className="tb-events">
                {events.map((event) => (
                  <article className="tb-event" key={`${event.title}-${event.time}`}>
                    <div className="tb-event-in">
                      <img src={`${ART}/bell.webp`} alt="" />
                      {event.kick ? <span className="sub">{event.kick}</span> : null}
                      <h3>{event.title}</h3>
                      <Rule width={140} />
                      {event.note ? <span className="when">{event.note}</span> : null}
                      {event.time ? <span className="time">{event.time}</span> : null}
                      {event.text ? <span className="where">{event.text}</span> : null}
                      <div className="tb-actions">
                        <button type="button" className="go" onClick={() => openMap(event.text)}>Directions</button>
                        <button type="button" className="cal" onClick={() => openCalendar(event.title, event.text)}>Calendar</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className={`tb-block tb-flame-wrap${lit > 0 ? " is-lit" : ""}`}>
            <div className="tb-glow" aria-hidden="true" />
            <span className="tb-eyebrow">A sacred flame</span>
            <h2>Light the lamp for their blessings</h2>
            <p>Every flame is a wish for a long and happy life together.</p>
            <div className="tb-lamp">
              <img src={`${ART}/lamp.webp`} alt="Brass kuthuvilakku lamp" />
              {WICKS.map(([left, top, duration], index) => (
                <span key={left} className={`tb-wick${lit > index ? " on" : ""}`} style={{ left, top }} aria-hidden="true">
                  <span style={{ animationDuration: duration }} />
                </span>
              ))}
            </div>
            <button type="button" className={`tb-light${lit > 0 ? " is-lit" : ""}`} onClick={light} aria-pressed={lit > 0}>
              {lit > 0 ? "Blessing glowing" : "Light the lamp"}
            </button>
            <span className="tb-bless" aria-live="polite">{lit > 0 ? "A lamp is lit for them" : ""}</span>
          </section>

          <section className="tb-block tb-dress">
            <span className="tb-eyebrow">Dress code</span>
            <h2>{fields.dress || "Temple traditional"}</h2>
            <Rule />
            {pack.caption ? <p>{pack.caption}</p> : null}
            <div className="tb-dots" aria-hidden="true">
              {DOTS.map((color) => <i key={color} style={{ background: color }} />)}
            </div>
          </section>

          <section className="tb-block tb-rsvp" id="rsvp">
            <span className="tb-eyebrow">Kindly reply</span>
            <h2>Will you bless us with your presence?</h2>
            {fields.rsvpBy ? <p>Kindly reply by {replyBy(fields.rsvpBy)}</p> : null}
            <div className="tb-form-shell">
              {done ? (
                <div className="tb-thanks">
                  <Petals far="380px" />
                  <img src={`${ART}/bell.webp`} alt="" />
                  <h3>{attend === "yes" ? "We will look for you" : "You will be missed"}</h3>
                  <p>{saved}</p>
                  <button type="button" onClick={() => setDone(false)}>Change my reply</button>
                </div>
              ) : (
                <form className="tb-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                  <div className="tb-field">
                    <label htmlFor={nameId}>Your name</label>
                    <input id={nameId} value={name} placeholder="Family or guest name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                    {nameError ? <span className="tb-error">Please enter your name.</span> : null}
                  </div>
                  <div className="tb-choice">
                    <button type="button" className={attend === "yes" ? "is-on" : ""} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully attending</button>
                    <button type="button" className={attend === "no" ? "is-on" : ""} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Unable to attend</button>
                  </div>
                  {attend === "yes" ? (
                    <>
                      {chips.length ? (
                        <div className="tb-field">
                          <span className="lab">I will attend</span>
                          <div className="tb-chips">
                            {chips.map((label) => {
                              const on = picked[label] !== false;
                              return (
                                <button type="button" key={label} className={`tb-chip${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => setPicked((current) => ({ ...current, [label]: !on }))}>{label}</button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      <div className="tb-stepper">
                        <span className="lab">Guests</span>
                        <div>
                          <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                          <span aria-live="polite">{guests}</span>
                          <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div className="tb-field">
                    <label htmlFor={wishId}>Your blessings <span style={{ letterSpacing: 0, color: "#9A8670" }}>(optional)</span></label>
                    <input id={wishId} value={wish} placeholder="Write a short wish" onChange={(event) => setWish(event.target.value)} />
                  </div>
                  <button type="submit" className="tb-send"><i aria-hidden="true" /><span>Send my reply</span></button>
                </form>
              )}
            </div>
          </section>

          {wishLoop.length ? (
            <section className="tb-wishes">
              <header>
                <span className="tb-eyebrow">Blessings</span>
                <h2>Words from our loved ones</h2>
              </header>
              <div className="tb-marq">
                <div className="tb-track">
                  {wishLoop.map((item, index) => (
                    <article className="tb-wish" key={`${item.name}-${index}`}>
                      <p>{item.text}</p>
                      <span>— {item.name}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <footer className="tb-foot">
            <Petals far="700px" />
            <img className="gop" src={`${ART}/gopuram.webp`} alt="" />
            <div className="tb-bell" style={{ left: "6%", top: -40, width: 30 }}><img src={`${ART}/bell.webp`} alt="" /></div>
            <div className="tb-bell b" style={{ left: "84%", top: -60, width: 28, animationDelay: "-1.1s" }}><img src={`${ART}/bell.webp`} alt="" /></div>
            <span className="thanks">Nandri · Thank you</span>
            <span className="who">{fields.names || `${couple.first} & ${couple.second}`}</span>
            <Rule width={180} />
            <span className="stamp">{[stamp(fields.date), tagOf(fields.names)].filter(Boolean).join(" · ")}</span>
            <a href={madeWithHref("templebells")}>Made with InvitesReady</a>
            <div className="lotus" aria-hidden="true">
              <img src={`${ART}/lotus.webp`} alt="" />
              <span className="glow" />
            </div>
          </footer>
        </div>
      )}
      {toast ? (
        <div className="tb-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </article>
  );
}
