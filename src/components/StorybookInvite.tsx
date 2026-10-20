import { useEffect, useId, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf, type FaqItem, type ProgrammeItem } from "../data/custom";
import { photoNotes } from "../data/photos";
import { calendarUrl, formatLongDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields, TemplateShot } from "../types";
import "./storybook.css";

type Phase = "closed" | "open" | "up" | "done" | "page";
type Reply = { name: string; note: string; attending: boolean };

const ART = "/storybook";
const SHOTS: TemplateShot[] = [
  { label: "The bookshop, 2020" },
  { label: "Our first trip" },
  { label: "She said yes!" },
];
const SAMPLE = [`${ART}/photo-1.webp`, `${ART}/photo-2.webp`, `${ART}/photo-3.webp`];
const POPS = ["popup-haldi", "popup-sangeet", "popup-wedding", "popup-reception"];
const BLOOMS = ["bloom-a", "bloom-b", "bloom-c", "bloom-d", "bloom-e", "bloom-f"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Arjun", second: parts[1] || "Meera", both: names.trim() || "Arjun & Meera" };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function heroDate(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${weekday} · ${day.getDate()} ${month} ${day.getFullYear()}`;
}

function stamp(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const dd = String(day.getDate()).padStart(2, "0");
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${day.getFullYear()}`;
}

function tagOf(caption: string, names: string) {
  if (caption.trim()) return caption.trim().startsWith("#") ? caption.trim() : `#${caption.trim()}`;
  const clean = names.replace(/[^A-Za-z& ]/g, "").split(/\s+&\s+/).map((part) => part.replace(/\s+/g, "")).filter(Boolean);
  return `#${clean.join("") || "OurStory"}`;
}

function wearOf(note: string) {
  const [wear, ...rest] = note.split(" | ");
  return { wear: wear.trim(), line: rest.join(" | ").trim() };
}

function eventDay(kick: string, fallback: string) {
  const match = kick.match(/(\d{1,2})\s+([A-Za-z]+)/);
  const year = dayOf(fallback)?.getFullYear();
  if (!match || !year) return fallback;
  const month = MONTHS.indexOf(match[2].toLowerCase());
  if (month < 0) return fallback;
  const day = String(match[1]).padStart(2, "0");
  return `${year}-${String(month + 1).padStart(2, "0")}-${day}`;
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const target = dayOf(date);
  if (!target) return [] as { value: string; label: string }[];
  const [hour, minute] = (time || "19:30").split(":").map((part) => Number(part) || 0);
  target.setHours(hour, minute, 0, 0);
  let diff = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    { value: String(days), label: "days" },
    { value: pad(hours), label: "hours" },
    { value: pad(minutes), label: "minutes" },
    { value: pad(seconds), label: "seconds" },
  ];
}

function Rule() {
  return (
    <svg className="sbk-rule" viewBox="0 0 160 12" aria-hidden="true">
      <path d="M2 6 H64 M96 6 H158" stroke="#C9A24A" strokeWidth="1.2" />
      <path d="M80 1 L85 6 L80 11 L75 6 Z" fill="#C9A24A" />
      <circle cx="68" cy="6" r="1.8" fill="#C9A24A" />
      <circle cx="92" cy="6" r="1.8" fill="#C9A24A" />
    </svg>
  );
}

function Corners() {
  return (
    <>
      <img className="sbk-corner is-tl" src={`${ART}/corner.webp`} alt="" />
      <img className="sbk-corner is-tr" src={`${ART}/corner.webp`} alt="" />
      <img className="sbk-corner is-bl" src={`${ART}/corner.webp`} alt="" />
      <img className="sbk-corner is-br" src={`${ART}/corner.webp`} alt="" />
    </>
  );
}

function Popup({ src, alt, label, wide = true }: { src: string; alt: string; label?: string; wide?: boolean }) {
  const [spin, setSpin] = useState(0);
  return (
    <div className={wide ? "sbk-pop-wrap sbk-scene" : "sbk-pop-wrap"}>
      <button key={spin} type="button" className="sbk-pop" aria-label={label || "Pop the scene up again"} onClick={() => setSpin((value) => value + 1)}>
        <img src={src} alt={alt} />
      </button>
    </div>
  );
}

function NoteIcon({ index }: { index: number }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "#F6DF9C", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (index % 4 === 1) return <svg {...common}><path d="M2 16l20-6-3-3-6 2-6-5-2 1 4 6-5 2-2-2-1 1z" /></svg>;
  if (index % 4 === 2) return <svg {...common}><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" /></svg>;
  if (index % 4 === 3) return <svg {...common}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>;
  return <svg {...common}><path d="M3 21V10l9-6 9 6v11" /><path d="M9 21v-6h6v6" /></svg>;
}

export function StorybookInvite({
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
  useFonts("Pinyon Script", "EB Garamond", "Cinzel", "Cinzel Decorative");
  const pack = packOf("storybook", fields.lines);
  const couple = coupleOf(fields.names);
  const [phase, setPhase] = useState<Phase>(quiet ? "page" : "closed");
  const countdown = useCountdown(fields.date, fields.time);
  const nameId = useId();
  const wishId = useId();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const pages = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => {
    timers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    const root = pages.current;
    if (!root || phase !== "page") return;
    const chapters = [...root.querySelectorAll<HTMLElement>(".sbk-chapter")];
    if (typeof IntersectionObserver === "undefined") {
      chapters.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    chapters.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [phase]);

  function openBook() {
    if (phase !== "closed") return;
    setPhase("open");
    timers.current.push(window.setTimeout(() => setPhase("up"), 1100));
    timers.current.push(window.setTimeout(() => setPhase("done"), 2500));
  }

  function showPages() {
    setPhase("page");
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
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
      notify(error instanceof Error ? error.message : "Could not send that reply.");
    }
  }

  const events = pack.programme ?? [];
  const chips = events.map((item) => item.title).filter(Boolean);
  const chosen = chips.filter((label) => picked[label] !== false).map((label) => label.replace(/^the\s+/i, "").toLowerCase());
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const saved = attend === "yes"
    ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved${chosen.length ? ` for the ${chosen.join(", ")}` : ""}.`
    : `Thank you for letting us know, ${name.trim()}. We will save you a slice of cake and every photo.`;
  const live = Boolean(onReply);
  const photos = SHOTS.map((shot, index) => ({
    shot,
    src: fields.photos?.[index] ? assetUrl(fields.photos[index]) : live ? "" : SAMPLE[index],
    title: photoNotes(fields.notes, SHOTS)[index]?.title || shot.label,
  })).filter((item) => item.src);
  const story = (pack.story ?? []).filter((item) => item.text.trim() || item.title.trim());
  const notes = (pack.faqs ?? []).filter((item) => item.q.trim() || item.a.trim());
  const cards = (pack.wishes ?? []).map((item) => ({ name: item.by, text: item.text }));
  const guestWishes = wishes.filter((item) => item.note?.trim()).map((item) => ({ name: item.name, text: item.note }));
  const mine = done && wish.trim() ? [{ name: name.trim(), text: wish.trim() }] : [];
  const loop = [...mine, ...guestWishes, ...cards, ...mine, ...guestWishes, ...cards];
  const showPage = quiet || phase === "page";
  const dedication = fields.hosts.trim() || "our dearest guests";
  const hashtag = tagOf(pack.caption ?? "", fields.names);
  const replyBy = fields.rsvpBy ? formatLongDate(fields.rsvpBy) : "";

  function directions(item: ProgrammeItem) {
    const query = item.text || place;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
  }

  function calendar(item: ProgrammeItem) {
    const when = eventDay(item.kick ?? "", fields.date);
    const url = calendarUrl({ ...fields, date: when, title: item.title, venue: item.text, message: wearOf(item.note ?? "").line || fields.message });
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <article className={`sbk is-${phase}${quiet ? " is-quiet" : ""}`}>
      {!showPage ? (
        <section className="sbk-stage">
          {BLOOMS.slice(0, 4).map((src, index) => (
            <img
              key={src}
              className="sbk-bloom"
              src={`${ART}/${src}.webp`}
              alt=""
              style={{
                width: index % 2 ? 96 : 110,
                left: index < 2 ? -18 : undefined,
                right: index >= 2 ? -16 : undefined,
                bottom: index % 2 ? 70 : undefined,
                top: index % 2 ? undefined : 110,
                animationDelay: `${-index}s`,
                ["--r" as string]: `${index % 2 ? 18 : -16}deg`,
                transform: `rotate(${index % 2 ? 18 : -16}deg)`,
              }}
            />
          ))}
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className="sbk-mote" style={{ left: `${8 + index * 18}%`, top: `${30 + (index % 3) * 16}%`, width: 3 + (index % 3), height: 3 + (index % 3), animationDelay: `${-index * 1.4}s` }} />
          ))}
          <div className="sbk-head">
            <div className="sbk-head-once">
              <span className="sbk-kicker">A tale told in paper</span>
              <span className="sbk-script sbk-foil">Once upon a time…</span>
            </div>
            <div className="sbk-head-for">
              <span className="sbk-kicker">This book is for</span>
              <span className="sbk-script sbk-foil">{dedication}</span>
            </div>
          </div>
          <div className="sbk-book">
            <div className="sbk-book-shadow" aria-hidden="true" />
            <div className="sbk-leaf">
              <img className="sbk-garland" src={`${ART}/garland.webp`} alt="" />
              <div className="sbk-inside">
                <Popup wide={false} src={`${ART}/popup-couple.webp`} alt="Paper pop-up of the bride and groom under a flower arch" label="Open the pop-up again" />
                <span className="sbk-script sbk-line a1">{couple.both}</span>
                <p className="sbk-line a2">are getting married</p>
                <span className="sbk-when sbk-line a3">{heroDate(fields.date)}</span>
                <p className="sbk-line a3">{place}</p>
              </div>
            </div>
            <div className="sbk-cover">
              <div className="sbk-face">
                <img src={`${ART}/cover.webp`} alt="" />
                <div className="sbk-cover-copy">
                  <span className="sbk-kicker sbk-foil">The story of</span>
                  <span className="sbk-script sbk-foil">{couple.first}</span>
                  <span className="amp sbk-foil">&amp;</span>
                  <span className="sbk-script sbk-foil">{couple.second}</span>
                  <Rule />
                  <span className="sbk-kicker sbk-foil">{stamp(fields.date)}</span>
                </div>
                <button type="button" className="sbk-cover-hit" aria-label="Open the storybook" onClick={openBook} />
              </div>
              <div className="sbk-face sbk-face-back" />
            </div>
          </div>
          {phase === "closed" ? <span className="sbk-hint">Tap the book to open</span> : null}
          <div className="sbk-cta">
            <p>Every love story deserves its dearest readers.</p>
            <button type="button" className="sbk-turn" onClick={showPages}>Turn the page <span aria-hidden="true">→</span></button>
          </div>
        </section>
      ) : (
        <div className="sbk-pages" ref={pages}>
          <section className="sbk-hero">
            <img className="sbk-garland-page" src={`${ART}/garland.webp`} alt="" />
            <article className="sbk-page sbk-chapter">
              <Corners />
              <div className="sbk-spread">
                <div className="sbk-col">
                  <span className="sbk-kicker">A love story in paper</span>
                  <span className="sbk-script">{couple.first}</span>
                  <span className="sbk-amp">&amp;</span>
                  <span className="sbk-script">{couple.second}</span>
                  <p className="sbk-lead">{fields.title}<br />{fields.message}</p>
                  <Rule />
                  <span className="sbk-date">{heroDate(fields.date)}</span>
                  <span className="sbk-place">{place}</span>
                  {countdown.length ? (
                    <div className="sbk-count">
                      {countdown.map((item) => (
                        <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Popup src={`${ART}/popup-couple.webp`} alt="Paper pop-up of the bride and groom under a flower arch" />
              </div>
            </article>
            <img className="sbk-foliage" src={`${ART}/foliage.webp`} alt="" />
          </section>

          {story.length ? (
            <section className="sbk-block">
              <article className="sbk-page sbk-chapter">
                <Corners />
                <span className="sbk-kicker">Chapter I</span>
                <h2 className="sbk-script">{story[0]?.title || "How it all began"}</h2>
                <Rule />
                <Popup src={`${ART}/popup-bench.webp`} alt="Paper pop-up of the couple on a bench under a blossom tree" />
                {story.map((item, index) => (
                  <p className="sbk-story" key={`${item.title}-${index}`}>
                    {index === 0 ? <span className="sbk-drop">{item.text.trim().charAt(0)}</span> : null}
                    {index === 0 ? item.text.trim().slice(1) : item.text}
                  </p>
                ))}
              </article>
            </section>
          ) : null}

          {photos.length ? (
            <section className="sbk-block">
              <article className="sbk-page sbk-chapter">
                <Corners />
                <span className="sbk-kicker">Chapter II</span>
                <h2 className="sbk-script">Pressed between pages</h2>
                <Rule />
                <p className="sbk-lead">A few moments we have pressed and kept, like flowers in a favourite book.</p>
                <div className="sbk-shots">
                  {photos.map((photo, index) => (
                    <figure className={`sbk-shot ${"abc"[index] || "a"}`} key={photo.src}>
                      <img src={photo.src} alt={photo.title} />
                      <figcaption>{photo.title}</figcaption>
                    </figure>
                  ))}
                  <img className="sbk-pressed" src={`${ART}/bloom-f.webp`} alt="" />
                </div>
              </article>
            </section>
          ) : null}

          {events.map((item, index) => {
            const detail = wearOf(item.note ?? "");
            const chapter = ["III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][index] || String(index + 3);
            return (
              <section className="sbk-block" key={`${item.title}-${index}`}>
                <article className="sbk-page sbk-chapter">
                  <Corners />
                  <div className="sbk-spread">
                    <Popup src={`${ART}/${POPS[index % POPS.length]}.webp`} alt="" />
                    <div className="sbk-col">
                      <span className="sbk-kicker">Chapter {chapter}</span>
                      <h2 className="sbk-script">{item.title}</h2>
                      {detail.line ? <p className="sbk-lead">{detail.line}</p> : null}
                      <Rule />
                      {item.kick ? <span className="sbk-date">{item.kick}</span> : null}
                      {item.time ? <span className="sbk-place">{item.time}</span> : null}
                      {item.text ? <span className="sbk-place">{item.text}</span> : null}
                      {detail.wear ? <span className="sbk-wear">Wear: {detail.wear}</span> : null}
                      <div className="sbk-actions">
                        <button type="button" className="go" onClick={() => directions(item)}>Directions</button>
                        <button type="button" className="cal" onClick={() => calendar(item)}>Calendar</button>
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            );
          })}

          {notes.length ? (
            <section className="sbk-block">
              <article className="sbk-page sbk-chapter">
                <Corners />
                <span className="sbk-kicker">Chapter VII</span>
                <h2 className="sbk-script">Little notes for our guests</h2>
                <Rule />
                <div className="sbk-notes">
                  {notes.map((item: FaqItem, index) => (
                    <div className="sbk-note" key={item.q}>
                      <i aria-hidden="true"><NoteIcon index={index} /></i>
                      <div>
                        <strong>{item.q}</strong>
                        <p>{item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          <section className="sbk-block" id="rsvp">
            <article className="sbk-page sbk-chapter">
              <Corners />
              <span className="sbk-kicker">Chapter VIII</span>
              <h2 className="sbk-script">Will you be in our story?</h2>
              {replyBy ? <p className="sbk-lead">Kindly reply by {replyBy}</p> : null}
              <Popup src={`${ART}/popup-elephant.webp`} alt="Paper pop-up elephant carrying an envelope" />
              <Rule />
              {done ? (
                <div className="sbk-done">
                  <img src={`${ART}/bloom-a.webp`} alt="" />
                  <h3 className="sbk-script">{attend === "yes" ? "See you there!" : "You will be missed"}</h3>
                  <p className="sbk-lead">{saved}</p>
                  <button type="button" className="sbk-change" onClick={() => setDone(false)}>Change my reply</button>
                </div>
              ) : (
                <form className="sbk-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                  <div>
                    <label htmlFor={nameId}>Your name</label>
                    <input id={nameId} value={name} placeholder="Family or guest name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                    {nameError ? <p className="sbk-err">Please write your name.</p> : null}
                  </div>
                  <div className="sbk-choice">
                    <button type="button" aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                    <button type="button" aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
                  </div>
                  {attend === "yes" ? (
                    <>
                      <div>
                        <span className="sbk-date">I'll be at</span>
                        <div className="sbk-chips">
                          {chips.map((label) => (
                            <button key={label} type="button" aria-pressed={picked[label] !== false} onClick={() => setPicked((current) => ({ ...current, [label]: current[label] === false }))}>{label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="sbk-guests">
                        <span>Guests</span>
                        <div className="sbk-step">
                          <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                          <b>{guests}</b>
                          <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div>
                    <label htmlFor={wishId}>A line for our story</label>
                    <input id={wishId} value={wish} placeholder="Write a short wish" onChange={(event) => setWish(event.target.value)} />
                  </div>
                  <button className="sbk-send" type="submit">Send my reply</button>
                </form>
              )}
            </article>
          </section>

          {loop.length ? (
            <section className="sbk-margin">
              <span className="sbk-kicker">Notes in the margins</span>
              <h2 className="sbk-script sbk-foil">Love from our readers</h2>
              <div className="sbk-marquee">
                <div className="sbk-track">
                  {loop.map((item, index) => (
                    <div className="sbk-wish" key={`${item.name}-${index}`} style={{ transform: `rotate(${[-2.5, 2, -1, 3][index % 4]}deg)` }}>
                      <img src={`${ART}/${BLOOMS[index % BLOOMS.length]}.webp`} alt="" />
                      <p>{item.text}</p>
                      <span>— {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <footer className="sbk-foot">
            <article className="sbk-page sbk-chapter sbk-end">
              <Corners />
              <Popup src={`${ART}/popup-sunset.webp`} alt="Paper pop-up of the couple walking toward the sunset" />
              <span className="sbk-kicker">The last page</span>
              <span className="sbk-script sbk-foil">The End</span>
              <p className="sbk-lead">…or rather, the beginning<br />of happily ever after</p>
              <Rule />
              <span className="sbk-script" style={{ fontSize: 36 }}>{couple.both}</span>
              <span className="sbk-date">{stamp(fields.date)} · {hashtag}</span>
              <a className="sbk-made" href={madeWithHref("storybook")}>Made with InvitesReady</a>
            </article>
            <img className="sbk-foliage" src={`${ART}/foliage.webp`} alt="" />
          </footer>
        </div>
      )}
      {toast ? <p className="sbk-toast" role="status">{toast}</p> : null}
    </article>
  );
}
