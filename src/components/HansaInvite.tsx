import { useEffect, useId, useState } from "react";
import { packOf } from "../data/custom";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./hansa.css";

type Phase = "closed" | "opening" | "open";
type Reply = { name: string; note: string; attending: boolean };

const ART = {
  moon: "/hansa/moon.webp",
  petal: "/hansa/petal.webp",
  swans: "/hansa/swans.webp",
  lilies: "/hansa/lilies.webp",
  wreath: "/hansa/wreath.webp",
  inner: "/hansa/env-inner.webp",
  front: "/hansa/env-front.webp",
  flap: "/hansa/flap.webp",
  seal: "/hansa/seal.webp",
  palace: "/hansa/palace.webp",
  guests: "/hansa/guests.webp",
};

const EVENTS = [
  ["13 FEB", "Mehendi under the Moon", "4:00 PM", "Lotus Courtyard"],
  ["13 FEB", "Sangeet", "8:00 PM", "The Durbar Hall"],
  ["14 FEB", "Haldi", "10:00 AM", "Garden Terrace"],
  ["14 FEB", "The Wedding", "5:30 PM", "Swan Ghat"],
  ["14 FEB", "Reception", "8:30 PM", "The Moonlit Lawns"],
] as const;

const PHONE: [number, number, number, number, boolean][] = [
  [4, 480, -38.3, 2.2, false],
  [-1, 406, -31.5, 2.33, false],
  [0, 330, -24.7, 2.46, false],
  [11, 258, -17.6, 2.59, false],
  [31, 193, -9.3, 2.72, false],
  [57, 138, 1, 2.85, false],
  [89, 96, 14.8, 2.98, false],
  [125, 69, 33.9, 3.11, false],
  [327, 480, -38.3, 2.24, true],
  [333, 406, -31.5, 2.37, true],
  [331, 330, -24.7, 2.5, true],
  [320, 258, -17.6, 2.63, true],
  [300, 193, -9.3, 2.76, true],
  [274, 138, 1, 2.89, true],
  [242, 96, 14.8, 3.02, true],
  [206, 69, 33.9, 3.15, true],
];

const DESK: [number, number, number, number, boolean][] = [
  [399, 502, -42.3, 2.2, false],
  [388, 427, -33.4, 2.33, false],
  [390, 351, -24.6, 2.46, false],
  [402, 276, -15.7, 2.59, false],
  [426, 207, -6.2, 2.72, false],
  [460, 145, 4, 2.85, false],
  [503, 93, 15.4, 2.98, false],
  [553, 54, 28, 3.11, false],
  [607, 28, 41.9, 3.24, false],
  [956, 502, -42.3, 2.24, true],
  [967, 427, -33.4, 2.37, true],
  [965, 351, -24.6, 2.5, true],
  [953, 276, -15.7, 2.63, true],
  [929, 207, -6.2, 2.76, true],
  [895, 145, 4, 2.89, true],
  [852, 93, 15.4, 3.02, true],
  [802, 54, 28, 3.15, true],
  [748, 28, 41.9, 3.28, true],
];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Rhea", second: parts[1] || "Aarav" };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function headlineDate(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${weekday} · ${day.getDate()} ${month} · ${day.getFullYear()}`;
}

function replyBy(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${day.getDate()} ${month} ${day.getFullYear()}`;
}

function clock(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour)) return time;
  const mark = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute || 0).padStart(2, "0")} ${mark}`;
}

function petals(list: [number, number, number, number, boolean][], width: number, height: number, size: number) {
  return list.map(([x, y, rotate, delay, flip]) => (
    <span
      key={`${width}-${x}-${y}`}
      className="hs-petal"
      style={{ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%`, width: `${(size / width) * 100}%`, ["--d" as string]: `${delay}s` }}
    >
      <img src={ART.petal} alt="" style={{ transform: `${flip ? "scaleX(-1) " : ""}rotate(${rotate}deg)` }} />
    </span>
  ));
}

export function HansaInvite({
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
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond", "Jost");
  const nameId = useId();
  const noteId = useId();
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState(() => EVENTS.map(() => true));
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");
  const [wish, setWish] = useState("");
  const [extraWishes, setExtraWishes] = useState<{ text: string; by: string }[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    const id = window.setTimeout(() => setPhase("open"), 3500);
    return () => window.clearTimeout(id);
  }, [phase]);

  const couple = coupleOf(fields.names);
  const pack = packOf("hansa", fields.lines);
  const parents = pack.people ?? [];
  const story = pack.story ?? [];
  const programme = pack.programme?.length
    ? pack.programme
    : EVENTS.map(([day, title, time, text]) => ({ kick: day, title, time, text, note: "" }));
  const shownWishes = [
    ...extraWishes,
    ...wishes.map((item) => ({ text: item.note, by: item.name })),
    ...(pack.wishes ?? []),
  ].slice(0, 6);
  const photos = fields.photos.filter(Boolean);
  const live = phase !== "closed";
  const left = Math.max(0, new Date(`${fields.date}T${fields.time || "17:30"}:00+05:30`).getTime() - now);
  const count = [
    [Math.floor(left / 86400000), "DAYS"],
    [Math.floor(left / 3600000) % 24, "HOURS"],
    [Math.floor(left / 60000) % 60, "MIN"],
    [Math.floor(left / 1000) % 60, "SEC"],
  ] as const;
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const tag = `#${couple.first}${couple.second}Forever`;

  function open() {
    if (phase !== "closed") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("open");
      return;
    }
    setPhase("opening");
  }

  function directions() {
    const query = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : place;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function addCal() {
    const start = new Date(`${fields.date}T${fields.time || "17:30"}:00+05:30`);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const stamp = (day: Date) => day.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${couple.first} & ${couple.second}`)}&dates=${stamp(start)}/${stamp(end)}&location=${encodeURIComponent(place)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setSending(true);
    try {
      await onReply?.({
        name: name.trim(),
        note: attend === "yes" ? `${guests} ${guests === 1 ? "guest" : "guests"}${note.trim() ? ` · ${note.trim()}` : ""}` : note.trim(),
        attending: attend === "yes",
      });
      setDone(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`hs${live ? " is-live" : ""}${phase === "opening" ? " is-opening" : ""}${phase === "open" ? " is-open" : ""}`}>
      <section className="hs-stage" aria-label="Opening">
        <span className="hs-moon-glow" aria-hidden="true" />
        <img className="hs-moon" src={ART.moon} alt="" />
        <div className="hs-arch hs-arch-phone" data-on={live ? "true" : "false"}>{petals(PHONE, 390, 844, 58)}</div>
        <div className="hs-arch hs-arch-desk" data-on={live ? "true" : "false"}>{petals(DESK, 1440, 900, 84)}</div>
        {Array.from({ length: 6 }, (_, index) => (
          <img
            key={index}
            className="hs-drift"
            src={ART.petal}
            alt=""
            style={{
              left: `${((index * 0.17 + 0.08) % 0.9) * 100}%`,
              ["--x" as string]: `${index % 2 ? 50 : -50}px`,
              ["--r" as string]: `${index % 2 ? 160 : -140}deg`,
              ["--dur" as string]: `${14 + (index % 3) * 4}s`,
              ["--delay" as string]: `${4 + index * 2.2}s`,
            }}
          />
        ))}
        <div className="hs-hero">
          <span className="hs-kick hs-kick-hero">WE’RE GETTING MARRIED</span>
          <h1 className="hs-names">
            <span>{couple.first}</span>
            <i>&amp;</i>
            <span>{couple.second}</span>
          </h1>
          <span className="hs-date">{headlineDate(fields.date)}</span>
          <span className="hs-place">{place}</span>
        </div>
        <span className="hs-rip" aria-hidden="true" />
        <span className="hs-rip b" aria-hidden="true" />
        <div className="hs-swans"><img src={ART.swans} alt="" /></div>
        <img className="hs-lilies" src={ART.lilies} alt="" />
        {phase === "open" ? <a className="hs-scroll" href="#hansa-welcome">SCROLL TO CONTINUE ↓</a> : null}

        {phase !== "open" ? (
          <div className="hs-env">
            <div className="hs-sheet">
              <img className="fit hs-env-in" src={ART.inner} alt="" />
              <div className="hs-card">
                <b>YOU ARE INVITED</b>
                <strong>{couple.first} &amp; {couple.second}</strong>
                <i />
                <b>{fields.date.split("-").reverse().join(" · ")}</b>
                <img src={ART.swans} alt="" />
              </div>
              <img className="fit hs-front" src={ART.front} alt="" />
              <div className="hs-flap">
                <img src={ART.flap} alt="" />
                <span className="hs-flap-back" />
              </div>
              {phase === "closed" ? <span className="hs-ring" aria-hidden="true" /> : null}
              <img className="hs-seal" src={ART.seal} alt="" />
              <div className="hs-env-copy">
                <span>This invitation is lovely for you</span>
                <strong>{couple.first} &amp; {couple.second}</strong>
              </div>
              {phase === "closed" ? <span className="hs-tap">TAP THE SEAL TO OPEN</span> : null}
            </div>
            {phase === "closed" ? <button type="button" className="hs-hit" aria-label="Break the seal and open the invitation" onClick={open} /> : null}
          </div>
        ) : null}
      </section>

      <section className="hs-sec" id="hansa-welcome">
        <img className="hs-wreath" src={ART.wreath} alt="" />
        <span className="hs-kick">{fields.hosts || "WITH THE BLESSINGS OF OUR FAMILIES"}</span>
        <div className="hs-parents">
          {parents[0] ? (
            <div>
              <span className="hs-small">{parents[0].role.toUpperCase()}</span>
              <strong>{parents[0].name}</strong>
            </div>
          ) : null}
          {parents.length > 1 ? <span className="hs-amp">&amp;</span> : null}
          {parents[1] ? (
            <div>
              <span className="hs-small">{parents[1].role.toUpperCase()}</span>
              <strong>{parents[1].name}</strong>
            </div>
          ) : null}
        </div>
        {fields.message ? <p className="hs-lead">{fields.message}</p> : null}
      </section>

      <section className="hs-sec alt">
        <img className="hs-wreath sm" src={ART.wreath} alt="" />
        <h2>Counting the moons</h2>
        <div className="hs-count">
          {count.map(([value, label]) => (
            <div key={label}>
              <b>{String(value).padStart(2, "0")}</b>
              <span className="hs-small">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="hs-sec">
        <h2>When &amp; Where</h2>
        <span className="hs-blush">CEREMONY AT SUNSET · {clock(fields.time || "17:30")}</span>
        <img className="hs-palace" src={ART.palace} alt="" />
        <span className="hs-venue">{fields.venue}</span>
        <span className="hs-lead">{fields.address}{pack.venueNote ? ` · ${pack.venueNote}` : ""}</span>
        <div className="hs-actions">
          <button type="button" className="hs-btn ink" onClick={directions}>Open in Maps</button>
          <button type="button" className="hs-btn line" onClick={addCal}>Add to calendar</button>
        </div>
      </section>

      <section className="hs-sec alt">
        <span className="hs-kick">OUR STORY</span>
        <h2>Two swans, one lake</h2>
        <div className="hs-story">
          <div className="hs-frame">
            <button type="button" className="hs-slot" aria-label={photos[0] ? "Couple photograph" : "Add a couple photo"} onClick={() => { if (!photos[0]) setToast("Couples add their own photos here in the editor."); }}>
              {photos[0] ? <img src={photos[0]} alt="" /> : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6F7390" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
                  <span className="hs-small">ADD YOUR PHOTO</span>
                </>
              )}
            </button>
            <img className="hs-flower l" src={ART.petal} alt="" />
            <img className="hs-flower r" src={ART.petal} alt="" />
          </div>
          <div className="hs-beats">
            {story.map((beat) => (
              <article key={beat.year + beat.title}>
                <em>{beat.year}</em>
                <strong>{beat.title}</strong>
                <p>{beat.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hs-sec">
        <img className="hs-moon-sm" src={ART.moon} alt="" />
        <span className="hs-kick">THE CELEBRATIONS</span>
        <h2>Schedule</h2>
        <div className="hs-tl">
          <span className="hs-tl-line" aria-hidden="true" />
          {programme.map((item) => (
            <article key={item.title + item.time}>
              <time>{item.time}</time>
              <i />
              <div>
                <strong>{item.title}</strong>
                <span>{[item.kick, item.text].filter(Boolean).join(" · ")}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="hs-sec alt">
        <span className="hs-kick">WHAT TO WEAR</span>
        <h2>Dress Code</h2>
        <span className="hs-dress">Moonlight Formal</span>
        <img className="hs-guests" src={ART.guests} alt="" />
        {fields.dress ? <p className="hs-lead">{fields.dress}</p> : null}
      </section>

      <section className="hs-sec">
        <span className="hs-kick">MOMENTS</span>
        <h2>Our gallery</h2>
        <div className="hs-gal">
          {Array.from({ length: 6 }, (_, index) => (
            <button key={index} type="button" aria-label={photos[index] ? `Photograph ${index + 1}` : `Add gallery photo ${index + 1}`} onClick={() => { if (!photos[index]) setToast("Couples add their own photos here in the editor."); }}>
              {photos[index] ? <img src={photos[index]} alt="" /> : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              )}
            </button>
          ))}
        </div>
        <span className="hs-small">COUPLES ADD PHOTOGRAPHS IN THE EDITOR</span>
      </section>

      <section className="hs-sec alt">
        <span className="hs-kick">BLESSINGS &amp; WISHES</span>
        <h2>Words from loved ones</h2>
        <div className="hs-wishes">
          {shownWishes.slice(0, 3).map((item) => (
            <article className="hs-wish" key={item.by + item.text}>
              <b>“</b>
              <p>{item.text}</p>
              <span>— {item.by}</span>
            </article>
          ))}
        </div>
        <form className="hs-wish-form" onSubmit={(event) => {
          event.preventDefault();
          if (!wish.trim()) { setToast("Write a few words first."); return; }
          setExtraWishes((items) => [{ text: wish.trim(), by: "You" }, ...items]);
          setWish("");
          setToast("Your wish has been added. Thank you!");
        }}>
          <input className="hs-field" aria-label={`Your wish for ${couple.first} and ${couple.second}`} value={wish} onChange={(event) => setWish(event.target.value)} placeholder={`Leave a wish for ${couple.first} & ${couple.second}…`} />
          <button type="submit" className="hs-btn ink">Send</button>
        </form>
      </section>

      <section className="hs-sec" id="hansa-rsvp">
        <h2>Will you join us?</h2>
        <span className="hs-blush">KINDLY REPLY BY {replyBy(fields.rsvpBy)}</span>
        <div className="hs-form">
          {done ? (
            <div className="hs-done">
              <img src={ART.seal} alt="" />
              <strong>{attend === "yes" ? `Thank you, ${name.trim().split(" ")[0]}` : "We’ll miss you"}</strong>
              <p className="hs-lead">{attend === "yes" ? `Your reply is sealed. ${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you by the lake.` : "Thank you for letting us know — your blessings mean the world to us."}</p>
              <button type="button" className="hs-link" onClick={() => setDone(false)}>Change my reply</button>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor={nameId}>Full name *</label>
                <input id={nameId} className="hs-field" value={name} onChange={(event) => { setName(event.target.value); setNameError(false); }} placeholder="Your name" />
                {nameError ? <span className="hs-err">Please enter your name.</span> : null}
              </div>
              <div className="hs-choice">
                <button type="button" className={attend === "yes" ? "hs-pill on" : "hs-pill"} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                <button type="button" className={attend === "no" ? "hs-pill on" : "hs-pill"} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="hs-step">
                    <span className="hs-lab">Guests</span>
                    <div>
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                      <strong>{guests}</strong>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                    </div>
                  </div>
                  <div>
                    <span className="hs-lab">Joining us for</span>
                    <div className="hs-chips">
                      {EVENTS.map(([, label], index) => (
                        <button key={label} type="button" className={picked[index] ? "hs-pill on" : "hs-pill"} aria-pressed={picked[index]} onClick={() => setPicked((value) => value.map((on, item) => item === index ? !on : on))}>{label.replace(" under the Moon", "")}</button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              <div>
                <label htmlFor={noteId}>Message for the couple (optional)</label>
                <textarea id={noteId} className="hs-area" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write us a few words…" />
              </div>
              <button type="button" className="hs-btn ink" style={{ width: "100%", minHeight: 54 }} disabled={sending} onClick={submit}>{sending ? "Sealing…" : "Seal my reply"}</button>
            </>
          )}
        </div>
      </section>

      <section className="hs-sec alt">
        <span className="hs-kick">SHARE THE LOVE</span>
        <span className="hs-tag">{tag}</span>
        <span className="hs-lead">Tag your photos so we can relive every moment with you.</span>
        <button type="button" className="hs-btn line" onClick={() => window.open(`https://www.instagram.com/explore/tags/${tag.slice(1)}/`, "_blank", "noopener,noreferrer")}>Open on Instagram</button>
      </section>

      <footer className="hs-foot">
        <img className="swans" src={ART.swans} alt="" />
        <strong>{couple.first} &amp; {couple.second}</strong>
        <span className="hs-small">{fields.date.split("-").reverse().join(" · ")} · {fields.address.split(",")[0] || fields.venue}</span>
        <button type="button" className="hs-link" onClick={() => { setPhase("closed"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>↺ Open the invitation again</button>
        <a className="hs-made" href="/">MADE WITH INVITESREADY</a>
        <img className="lilies" src={ART.lilies} alt="" />
      </footer>

      {toast ? (
        <div className="hs-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
