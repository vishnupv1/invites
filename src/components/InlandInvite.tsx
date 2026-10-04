import { useEffect, useId, useRef, useState } from "react";
import { Scissors } from "lucide-react";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem } from "../data/custom";
import { calendarUrl, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./inland.css";

type Reply = { name: string; note: string; attending: boolean };
type Wish = { name: string; note: string; attending?: boolean };

const INK = ["#C8342B", "#F2B33D", "#4E9AD6", "#6FBF73", "#E87AA0"];
const PLAN_ICONS = [
  "M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z",
  "M3 21l12-12M15 3v4M13 5h4M19 9v2M18 10h2",
  "M4 21h16M5 21v-7h14v7M8 14V9M12 14V9M16 14V9M8 6v1M12 6v1M16 6v1",
  "M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0M19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  "M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7C9 7 7 3 9 2s3 5 3 5 1-6 3-5-0 5-3 5",
];
const PLAN_TILT = [-1.5, 1, -1, 1.5, -0.5];
const ALBUM = [
  ["Turning 4", "M4 21h16M5 21v-7h14v7M12 14V9M12 6v1"],
  ["First bicycle", "M4.2 15.5a2.3 2.3 0 0 1 4.6 0 2.3 2.3 0 0 1-4.6 0M15.2 15.5a2.3 2.3 0 0 1 4.6 0 2.3 2.3 0 0 1-4.6 0M6.5 15.5l3.4-6h4.2l2.4 6M9.9 9.5l2.2-3.4h2.6"],
  ["Beach day", "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v9M8 21h8"],
  ["Best friends", "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 21c0-4 3-6 6-6s6 2 6 6M10 21c0-4 3-6 6-6s6 2 6 6"],
];
const ALBUM_TILT = [-4, 3, -2, 4];
const COUNT_TILT = [-3, 2, -2, 3];
const DEMO_WISHES: Wish[] = [
  { name: "Meera aunty", note: "Happy 5th, little champ! Can’t wait for the magic show." },
  { name: "Kabir (age 6)", note: "Save me the biggest slice of cake!" },
  { name: "Grandpa & Grandma", note: "Five is the best age. Big hugs!" },
];

function partyDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday}, ${date.getDate()} ${month} ${date.getFullYear()}`;
}

function replyBy(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getDate()} ${date.toLocaleDateString("en-US", { month: "long" })}`;
}

function postmark(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}·${month}·${year.slice(2)}`;
}

function cityOf(address: string) {
  const city = address.split(",").pop()?.trim();
  return city || "Kochi";
}

export function InlandInvite({ fields, quiet = false, wishes, onReply, demo = false }: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: Wish[];
  onReply?: (reply: Reply) => void | Promise<unknown>;
  demo?: boolean;
}) {
  useFonts("Caveat", "Fredoka", "Special Elite");
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [desk, setDesk] = useState(false);
  const [open, setOpen] = useState(quiet);
  const [run, setRun] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [kids, setKids] = useState(1);
  const [adults, setAdults] = useState(2);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [sent, setSent] = useState<Wish | null>(null);
  const [toast, setToast] = useState("");

  const pack = packOf("inland", fields.lines);
  const child = fields.names.trim() || "Aadi";
  const age = fields.detail.trim() || "5";
  const hosts = fields.hosts.trim() || "Aadi’s family";
  const city = cityOf(fields.address || "Kochi");
  const start = formatTime(fields.time);
  const end = formatTime(fields.receptionTime);
  const whenTime = start && end ? `${start} – ${end}` : start || "4:00 PM";
  const plan = ((pack.programme ?? []) as ProgrammeItem[]).slice(0, 5);
  const photos = (fields.photos ?? []).filter(Boolean);
  const live = Boolean(onReply);
  const rows = live
    ? [...(sent ? [sent] : []), ...(wishes ?? []).map((wish) => ({ name: wish.name, note: wish.note }))]
    : DEMO_WISHES;

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
    if (!open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  const target = new Date(`${fields.date || "2027-12-12"}T${fields.time || "16:00"}:00+05:30`).getTime();
  let left = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(left / 86400);
  left %= 86400;
  const hours = Math.floor(left / 3600);
  left %= 3600;
  const count = [days, hours, Math.floor(left / 60), left % 60].map((value) => String(value).padStart(2, "0"));
  const stageH = desk ? 900 : 844;

  function replay() {
    setOpen(false);
    setDone(false);
    setRun((value) => value + 1);
    rootRef.current?.scrollIntoView({ block: "start" });
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const yes = attend === "yes";
    const note = msg.trim() || (yes ? "Can’t wait to celebrate!" : "Happy birthday from afar!");
    if (onReply) await onReply({ name: name.trim(), note, attending: yes });
    setSent({ name: name.trim(), note });
    setDone(true);
  }

  function directions() {
    const query = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : `${fields.venue} ${fields.address}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener");
    setToast(`Opening directions to ${fields.venue || "the party"}…`);
  }

  return (
    <div ref={rootRef} className={desk ? `il is-desk${open ? " is-open" : ""}${quiet ? " is-still" : ""}` : `il${open ? " is-open" : ""}${quiet ? " is-still" : ""}`}>
      <section className="il-stage" key={run}>
        {[6, 18, 78, 90, 50].map((x, index) => (
          <span
            key={index}
            className="il-balloon"
            style={{
              left: `${x}%`,
              bottom: open ? "-100%" : `${index % 2 ? 4 : 10}%`,
              ["--h" as string]: `${stageH + 200}px`,
              animationDuration: open ? `${6 + index}s` : undefined,
              animationDelay: open ? `${1 + index * 0.3}s` : undefined,
            }}
            aria-hidden="true"
          >
            <i style={{ animationDuration: `${3 + (index % 3)}s, ${4 + (index % 2)}s` }}>
              <svg width={desk ? 48 : 32} height={desk ? 84 : 56} viewBox="0 0 40 70">
                <path d="M20 2C9 2 3 11 3 21c0 12 9 21 17 23 8-2 17-11 17-23C37 11 31 2 20 2z" fill={INK[index]} />
                <path d="M17 44h6l-3 4z" fill={INK[index]} />
                <path d="M20 48c-3 6 3 10 0 20" stroke="#5A6B80" strokeWidth="1" fill="none" />
                <ellipse cx="13" cy="15" rx="3" ry="6" fill="#FFFFFF" opacity="0.45" />
              </svg>
            </i>
          </span>
        ))}
        {open ? null : <span className="il-kicker">You’ve got mail!</span>}
        <div className="il-letter">
          <div className="il-panel il-top">
            <span className="il-post">BIRTHDAY POST</span>
            <span className="il-dear">Dear friend,</span>
            <span className="il-big">You’re invited!</span>
            <span className="il-sub">{child} is turning</span>
            <span className="il-age">{age}</span>
          </div>
          <div className="il-panel il-bot">
            <span className="il-line">{fields.title || "Come celebrate with cake, games & a magic show!"}</span>
            <div className="il-facts">
              {[
                ["WHEN", partyDate(fields.date)],
                ["TIME", whenTime],
                ["WHERE", `${fields.venue}${city ? `, ${city}` : ""}`],
                ["DRESS", fields.dress || "Superheroes & princesses"],
              ].map(([label, value]) => (
                <span className="il-fact" key={label}><b>{label}</b><span>{value}</span></span>
              ))}
            </div>
            <div className="il-row">
              <a className="il-red" href="#details">Party details ↓</a>
              <a className="il-ghost" href="#rsvp">RSVP</a>
            </div>
            <span className="il-sign">With love, {hosts}</span>
          </div>
          <div className="il-cover">
            <div className="il-front">
              <div className="il-head">
                <div className="il-brand">
                  <b>INLAND LETTER CARD</b>
                  <small>Birthday Post · 2 Annas</small>
                </div>
                <div className="il-marks">
                  <div className="il-stamp">
                    <svg width="100%" height="100%" viewBox="0 0 60 70" aria-hidden="true">
                      <rect x="5" y="5" width="50" height="60" fill="#FFF6E5" />
                      <circle cx="30" cy="26" r="13" fill="#F2B33D" />
                      <rect x="16" y="38" width="28" height="14" rx="2" fill="#C8342B" />
                      <rect x="16" y="35" width="28" height="5" fill="#FFF6E5" stroke="#C8342B" strokeWidth="1" />
                      <path d="M30 12v6M26 14l4 4 4-4" stroke="#C8342B" strokeWidth="1.6" fill="none" />
                      <text x="30" y="62" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="6" fill="#1F3A5F">₹ 5 · INDIA</text>
                    </svg>
                  </div>
                  <div className="il-mark">
                    <svg width="100%" height="100%" viewBox="0 0 120 70" aria-hidden="true">
                      <circle cx="35" cy="35" r="27" fill="none" stroke="#1F3A5F" strokeWidth="2" />
                      <circle cx="35" cy="35" r="20" fill="none" stroke="#1F3A5F" strokeWidth="1" />
                      <text x="35" y="33" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="7" fill="#1F3A5F">{city.toUpperCase()}</text>
                      <text x="35" y="42" textAnchor="middle" fontFamily="Special Elite, monospace" fontSize="6" fill="#1F3A5F">{postmark(fields.date)}</text>
                      <path d="M64 22c8-6 16 6 24 0s16 6 24 0M64 35c8-6 16 6 24 0s16 6 24 0M64 48c8-6 16 6 24 0s16 6 24 0" stroke="#1F3A5F" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="il-addr">
                <span className="il-to">TO,</span>
                <span className="il-addrline">Our beloved guest</span>
              </div>
              <div className="il-openhere">OPEN HERE</div>
              <div className="il-strip"><span><Scissors size={12} aria-hidden="true" /> TEAR HERE TO OPEN</span></div>
            </div>
            <div className="il-back"><span>NO ENCLOSURES ALLOWED</span></div>
          </div>
          {open ? (
            Array.from({ length: 18 }, (_, index) => {
              const angle = (index / 18) * Math.PI * 2;
              const reach = desk ? 380 : 220;
              return (
                <span
                  key={index}
                  className="il-confetti"
                  style={{
                    background: INK[index % 5],
                    ["--x" as string]: `${Math.round(Math.cos(angle) * reach)}px`,
                    ["--y" as string]: `${Math.round(Math.sin(angle) * 300)}px`,
                    ["--r" as string]: `${index * 60}deg`,
                    animationDelay: `${1.9 + (index % 4) * 0.05}s`,
                  }}
                  aria-hidden="true"
                />
              );
            })
          ) : (
            <button type="button" className="il-hit" aria-label="Tear open the inland letter" onClick={() => setOpen(true)} />
          )}
        </div>
        {open ? null : <span className="il-hint">Tap the letter to tear it open</span>}
      </section>

      {open ? (
        <>
          <section className="il-sec" id="details">
            <h2 className="il-h2">The party countdown</h2>
            <div className="il-count">
              {count.map((value, index) => (
                <div key={COUNT_TILT[index]} style={{ transform: `rotate(${COUNT_TILT[index]}deg)` }}>
                  <b>{value}</b>
                  <span>{["DAYS", "HOURS", "MINS", "SECS"][index]}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="il-alt">
            <h2 className="il-h2">Party plan</h2>
            <div className="il-plan">
              {plan.map((item, index) => (
                <div className="il-card" key={`${item.title}-${index}`} style={{ transform: `rotate(${PLAN_TILT[index % PLAN_TILT.length]}deg)` }}>
                  <span className="il-ico" style={{ background: INK[index % INK.length] }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={PLAN_ICONS[index % PLAN_ICONS.length]} />
                    </svg>
                  </span>
                  <small>{item.time}</small>
                  <strong>{item.title}</strong>
                  <em>{item.text}</em>
                </div>
              ))}
            </div>
          </section>
          <section className="il-sec">
            <h2 className="il-h2">{child}’s little album</h2>
            <div className="il-gal">
              {(photos.length ? photos : ALBUM.map(([cap]) => cap)).slice(0, 4).map((item, index) => (
                <div className="il-shot" key={index} style={{ transform: `rotate(${ALBUM_TILT[index]}deg)` }}>
                  <div className="il-ph" style={{ background: INK[(index + 2) % INK.length] }}>
                    {photos.length ? (
                      <img src={assetUrl(photos[index])} alt="" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={ALBUM[index][1]} />
                      </svg>
                    )}
                  </div>
                  <span>{photos.length ? ALBUM[index]?.[0] || "Party photo" : item}</span>
                </div>
              ))}
            </div>
            <span className="il-tag">Photos from the party will appear here, tag {pack.caption || "#AadiTurns5"}</span>
          </section>
          <section className="il-alt">
            <div className="il-venue">
              <div className="il-map" aria-hidden="true">
                <svg width="100%" height="100%" viewBox="0 0 200 140" preserveAspectRatio="none">
                  <rect width="200" height="140" fill="#DCEAF5" />
                  <path d="M0 90 C50 70 90 110 200 80" stroke="#FFFFFF" strokeWidth="12" fill="none" />
                  <path d="M60 0 V140 M140 0 C130 50 150 90 140 140" stroke="#FFFFFF" strokeWidth="8" fill="none" />
                  <circle cx="120" cy="74" r="14" fill="#C8342B" />
                  <circle cx="120" cy="74" r="5" fill="#FFFFFF" />
                </svg>
              </div>
              <div className="il-where">
                <small>WHERE</small>
                <strong>{fields.venue}</strong>
                <em>{fields.address}{pack.venueNote ? ` · ${pack.venueNote}` : ""}</em>
                <div className="il-row">
                  <button type="button" className="il-red" onClick={directions}>Get directions</button>
                  <a className="il-ghost" href={calendarUrl(fields) || "#details"} onClick={() => setToast("Party added to your calendar.")}>Add to calendar</a>
                </div>
              </div>
            </div>
          </section>
          <section className="il-sec" id="rsvp">
            <h2 className="il-h2">Will you come?</h2>
            <span className="il-by">Please reply by {replyBy(fields.rsvpBy)}</span>
            {done ? (
              <div className="il-form is-done">
                <span className="il-received">{attend === "yes" ? "RSVP RECEIVED" : "NOTED, WITH LOVE"}</span>
                <span className="il-done">{attend === "yes" ? `Yay! See you at the party, ${name.trim()}.` : `We’ll miss you, ${name.trim()}!`}</span>
                <button type="button" className="il-ghost" onClick={() => setDone(false)}>Change reply</button>
              </div>
            ) : (
              <form className="il-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                <label className="il-lab" htmlFor={`${uid}-name`}>Child’s / family name</label>
                <input id={`${uid}-name`} className="il-field" value={name} placeholder="e.g. Riya & family" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                {nameError ? <span className="il-err">Please write your name.</span> : null}
                <div className="il-choice">
                  <button type="button" aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Yay, we’ll come!</button>
                  <button type="button" aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Can’t make it</button>
                </div>
                {attend === "yes" ? (
                  <>
                    <div className="il-step">
                      <span className="il-lab">Kids</span>
                      <div>
                        <button type="button" aria-label="Fewer kids" onClick={() => setKids((value) => Math.max(0, value - 1))}>−</button>
                        <b>{kids}</b>
                        <button type="button" aria-label="More kids" onClick={() => setKids((value) => Math.min(9, value + 1))}>+</button>
                      </div>
                    </div>
                    <div className="il-step">
                      <span className="il-lab">Adults</span>
                      <div>
                        <button type="button" aria-label="Fewer adults" onClick={() => setAdults((value) => Math.max(0, value - 1))}>−</button>
                        <b>{adults}</b>
                        <button type="button" aria-label="More adults" onClick={() => setAdults((value) => Math.min(9, value + 1))}>+</button>
                      </div>
                    </div>
                  </>
                ) : null}
                <label className="il-lab" htmlFor={`${uid}-wish`}>A birthday wish for {child}</label>
                <textarea id={`${uid}-wish`} className="il-field il-area" rows={3} value={msg} placeholder="Happy birthday, superstar!" onChange={(event) => setMsg(event.target.value)} />
                <button type="submit" className="il-red il-send">Post my reply</button>
              </form>
            )}
          </section>
          <section className="il-alt">
            <h2 className="il-h2">Birthday wishes</h2>
            <div className="il-wishes">
              {rows.map((wish, index) => (
                <article className="il-wish" key={`${wish.name}-${index}`} style={{ borderColor: INK[index % INK.length], transform: `rotate(${index % 2 ? 1 : -1}deg)` }}>
                  <p>“{wish.note}”</p>
                  <span>— {wish.name}</span>
                </article>
              ))}
            </div>
          </section>
          <footer className="il-foot">
            <strong>See you at the party!</strong>
            {demo || !live ? <button type="button" onClick={replay}>↺ Open the letter again</button> : null}
          </footer>
        </>
      ) : null}
      {toast ? (
        <div className="il-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
