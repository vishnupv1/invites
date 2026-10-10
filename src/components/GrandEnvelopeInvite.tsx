import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { madeWithHref } from "../lib/share";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { useFonts } from "../lib/fonts";
import type { InviteFields } from "../types";
import "./grandenvelope.css";

type Phase = "closed" | "break" | "open" | "suite";
type Step = "intro" | "form" | "yes" | "no";
type Reply = { name: string; note: string; attending: boolean };

const ART = {
  flap: "/grandenvelope/flap.webp",
  seal: "/grandenvelope/seal.webp",
  pocket: "/grandenvelope/pocket.webp",
  table: "/grandenvelope/table.jpg",
  tableWide: "/grandenvelope/table-wide.jpg",
  ceremony: "/grandenvelope/ceremony.jpg",
  ceremonyWide: "/grandenvelope/ceremony-wide.jpg",
  reception: "/grandenvelope/reception.jpg",
  receptionWide: "/grandenvelope/reception-wide.jpg",
  venue: "/grandenvelope/venue.jpg",
};

const PETALS = ["#E8789A", "#F3C2C9", "#A3304A", "#FFE3C2"];
const FRAGS: { clip: string; x: string; y: string; r: string }[] = [
  { clip: "polygon(0% 0%, 52% 0%, 50% 50%, 0% 46%)", x: "-90px", y: "-60px", r: "-40deg" },
  { clip: "polygon(52% 0%, 100% 0%, 100% 54%, 50% 50%)", x: "90px", y: "-70px", r: "50deg" },
  { clip: "polygon(50% 50%, 100% 54%, 100% 100%, 48% 100%)", x: "70px", y: "160px", r: "70deg" },
  { clip: "polygon(0% 46%, 50% 50%, 48% 100%, 0% 100%)", x: "-80px", y: "150px", r: "-60deg" },
];
const SPARKS = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * Math.PI * 2;
  return { x: `${Math.round(Math.cos(angle) * 90)}px`, y: `${Math.round(Math.sin(angle) * 90)}px` };
});

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Aarav", second: parts[1] || "" };
}

function monogram(names: string) {
  const couple = coupleOf(names);
  const first = couple.first.charAt(0).toUpperCase() || "A";
  const second = couple.second.charAt(0).toUpperCase();
  return { first, second };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00+05:30`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function nextDay(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const next = new Date(day);
  next.setDate(next.getDate() + 1);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const value = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${month}-${value}`;
}

function momentOf(date: string, time: string) {
  return new Date(`${date}T${time || "17:00"}:00+05:30`);
}

function clock(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  if (!hour && hour !== 0) return time;
  const mark = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${String(minute || 0).padStart(2, "0")} ${mark}`;
}

function longDate(date: string) {
  const day = dayOf(date);
  return day ? day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : date;
}

function replyDate(date: string) {
  const day = dayOf(date);
  return day ? day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase() : "";
}

function spanDate(date: string, two: boolean, short = false) {
  const day = dayOf(date);
  if (!day) return date.toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: short ? "short" : "long" }).toUpperCase();
  const year = day.getFullYear();
  if (!two) return `${day.getDate()} ${month} ${year}`;
  const next = new Date(day);
  next.setDate(next.getDate() + 1);
  if (next.getMonth() === day.getMonth()) return `${day.getDate()} · ${next.getDate()} ${month} ${year}`;
  const month2 = next.toLocaleDateString("en-GB", { month: short ? "short" : "long" }).toUpperCase();
  return `${day.getDate()} ${month} · ${next.getDate()} ${month2} ${year}`;
}

function Lam({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
  return (
    <div className={hero ? "ge-lam ge-hero-card" : "ge-lam"}>
      <div className="ge-lam-in">
        <span className="ge-glass" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

export function GrandEnvelopeInvite({
  fields,
  quiet = false,
  onReply,
  autoPlay = false,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string; attending?: boolean }[];
  onReply?: (reply: Reply) => void | Promise<unknown>;
  demo?: boolean;
  autoPlay?: boolean;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond", "Jost");
  const nameId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<Phase>(quiet ? "suite" : "closed");
  const [width, setWidth] = useState(390);
  const [height, setHeight] = useState(844);
  const [now, setNow] = useState(() => Date.now());
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(2);
  const [msg, setMsg] = useState("");
  const [nameErr, setNameErr] = useState(false);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [fanAt, setFanAt] = useState(0);

  const couple = coupleOf(fields.names);
  const mark = monogram(fields.names);
  const pack = packOf("grandenvelope", fields.lines);
  const story = pack.story?.[0];
  const storyLines = (story?.text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : "")).filter(Boolean).slice(0, 3);
  const wide = width >= 860;
  const hasReception = Boolean(fields.receptionVenue || fields.receptionTime);
  const ceremonyName = eventName(fields.lines, "ceremonyName", "The Wedding");
  const receptionName = eventName(fields.lines, "receptionName", "The Reception");
  const where = [fields.venue, fields.address].filter(Boolean).join(", ");
  const venueNotes = (pack.venueNote || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const quote = (fields.message || "Your love story deserves\na beautiful beginning").split("\n");
  const table = wide ? ART.tableWide : ART.table;
  const ceremonyArt = wide ? ART.ceremonyWide : ART.ceremony;
  const receptionArt = wide ? ART.receptionWide : ART.reception;

  useLayoutEffect(() => {
    const node = rootRef.current;
    const stage = stageRef.current;
    if (!node) return;
    const measure = () => {
      if (node.offsetWidth) setWidth(node.offsetWidth);
      if (stage?.offsetHeight) setHeight(stage.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (stage) observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function openSeal() {
    if (phase !== "closed") return;
    if (reduced()) {
      setPhase("suite");
      return;
    }
    clearTimers();
    setPhase("break");
    timers.current = [
      window.setTimeout(() => setPhase("open"), 2300),
      window.setTimeout(() => setPhase("suite"), 5000),
    ];
  }

  function replay() {
    clearTimers();
    setStep("intro");
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (quiet || reduced()) {
      setPhase("suite");
      return;
    }
    setPhase("closed");
  }

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!autoPlay || quiet) return;
    const timer = window.setTimeout(() => openSeal(), 800);
    return () => window.clearTimeout(timer);
    // Opening runs once on marketing surfaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, quiet]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setFanAt((at) => at + 1), 2800);
    return () => window.clearInterval(id);
  }, []);

  async function submit() {
    if (!name.trim()) {
      setNameErr(true);
      return;
    }
    const note = [msg.trim(), guests > 1 ? `${guests} guests` : ""].filter(Boolean).join(" · ");
    setSending(true);
    try {
      await onReply?.({ name: name.trim(), note, attending: true });
      setStep("yes");
    } catch {
      setToast("We couldn’t send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function directions() {
    const query = encodeURIComponent(where || fields.venue || "venue");
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener");
  }

  function addCalendar() {
    const start = momentOf(fields.date, fields.time);
    if (Number.isNaN(start.getTime())) {
      setToast("The date isn’t set yet.");
      return;
    }
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${couple.first}${couple.second ? ` & ${couple.second}` : ""}`)}&dates=${stamp(start)}/${stamp(end)}&location=${encodeURIComponent(where)}`;
    window.open(url, "_blank", "noopener");
  }

  const left = Math.max(0, Math.floor((momentOf(fields.date, fields.time).getTime() - now) / 1000));
  const count = Number.isNaN(left) ? [0, 0, 0, 0] : [Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, left % 60];
  const fan = [fields.names || `${couple.first}${couple.second ? ` & ${couple.second}` : ""}`, "Our story", ceremonyName, hasReception ? receptionName : "", "The Venue"].filter(Boolean);
  const mid = (fan.length - 1) / 2;
  const candles = (wide ? [[0.04, 0.17], [0.88, 0.08], [0.975, 0.9]] : [[0.41, 0.03], [0.03, 0.82]]) as [number, number][];
  const showSeal = phase === "closed" || phase === "break";

  return (
    <div ref={rootRef} className="ge" data-phase={phase} data-quiet={quiet ? "1" : "0"}>
      <section ref={stageRef} className="ge-stage" aria-label="Opening">
        <div className="ge-stage-bg" style={{ backgroundImage: `url(${table})` }} />
        <div className="ge-shade" />
        {candles.map(([x, y], index) => (
          <span key={index} className="ge-candle" style={{ left: `${x * 100}%`, top: `${y * 100}%`, animationDuration: `${1.3 + index * 0.4}s` }} aria-hidden="true" />
        ))}

        <div className="ge-env">
          <div className="ge-back" />
          <div className="ge-pocket" />
          <div className="ge-mini">
            <strong>{couple.first}{couple.second ? ` & ${couple.second}` : ""}</strong>
            <span>{spanDate(fields.date, hasReception, true)}</span>
          </div>
          <img className="ge-body" src={ART.pocket} alt="" />
          <div className="ge-flap">
            <img src={ART.flap} alt="" />
            <img className="back" src={ART.flap} alt="" />
          </div>
          {showSeal ? (
            <div className="ge-seal">
              <img src={ART.seal} alt="" />
              <span className="ge-mono">{mark.first}{mark.second ? <i>&amp;</i> : null}{mark.second}</span>
              <span className="ge-glow" />
              {phase === "closed" ? <span className="ge-ring" aria-hidden="true" /> : null}
              {phase === "break" ? (
                <svg className="ge-crack" viewBox="0 0 100 100" aria-hidden="true">
                  <path d="M50 50 L38 30 L30 12 M50 50 L66 34 L80 20 M50 50 L56 70 L52 90 M50 50 L32 58 L14 64 M50 50 L72 60 L88 70" fill="none" stroke="#FFE7B0" strokeWidth="1.6" strokeDasharray="120" />
                </svg>
              ) : null}
              {phase === "break"
                ? FRAGS.map((frag) => (
                    <img key={frag.clip} className="ge-frag" src={ART.seal} alt="" style={{ clipPath: frag.clip, ["--x" as string]: frag.x, ["--y" as string]: frag.y, ["--r" as string]: frag.r } as CSSProperties} />
                  ))
                : null}
              {phase === "break"
                ? SPARKS.map((spark, index) => (
                    <span key={index} className="ge-spark" style={{ ["--x" as string]: spark.x, ["--y" as string]: spark.y } as CSSProperties} aria-hidden="true" />
                  ))
                : null}
            </div>
          ) : null}
        </div>

        {phase === "break" ? <div className="ge-flash" aria-hidden="true" /> : null}

        {phase === "suite" ? (
          <div className="ge-hero">
            <Lam hero>
              <span className="ge-kick ge-up" style={{ animationDelay: "0.8s" }}>{fields.hosts || "Together with their families"}</span>
              <span className="ge-name" style={quiet ? undefined : { animation: "ge-wipe 1.1s ease-out 1.2s both" }}>{couple.first}</span>
              {couple.second ? <span className="ge-amp ge-up" style={{ animationDelay: "1.8s" }}>&amp;</span> : null}
              {couple.second ? <span className="ge-name" style={quiet ? undefined : { animation: "ge-wipe 1.1s ease-out 2s both" }}>{couple.second}</span> : null}
              {fields.title ? <span className="ge-line ge-up" style={{ animationDelay: "3s" }}>{fields.title}</span> : null}
              <span className="ge-rule" />
              <span className="ge-date ge-up" style={{ animationDelay: "3.5s" }}>{spanDate(fields.date, hasReception)}</span>
              {fields.venue ? <span className="ge-place ge-up" style={{ animationDelay: "4s" }}>{fields.venue}{fields.address ? ` · ${fields.address}` : ""}</span> : null}
            </Lam>
            <button type="button" className="ge-scroll" onClick={() => storyRef.current?.scrollIntoView({ behavior: "smooth" })}>
              SCROLL TO CONTINUE<br />↓
            </button>
          </div>
        ) : null}

        {PETALS.map((color, index) => (
          <span
            key={color + index}
            className="ge-petal"
            style={{ left: (index * 97) % Math.max(width, 1), ["--fy" as string]: `${height + 60}px`, animationDuration: `${10 + (index % 4) * 2}s`, animationDelay: `-${index * 1.5}s` } as CSSProperties}
            aria-hidden="true"
          >
            <svg width={10 + (index % 3) * 6} height={10 + (index % 3) * 6} viewBox="0 0 20 20"><path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={color} /></svg>
          </span>
        ))}
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="ge-mote" style={{ left: (index * 67) % Math.max(width, 1), top: Math.round(height * 0.45 + ((index * 53) % (height * 0.5))), animationDuration: `${4 + (index % 4)}s`, animationDelay: `${index * 0.45}s` }} aria-hidden="true" />
        ))}

        {phase === "closed" ? (
          <button type="button" className="ge-hit" aria-label="Break the seal to open the invitation" onClick={openSeal}>
            <span className="ge-hint">Something beautiful is waiting inside<br /><strong>TAP THE SEAL</strong></span>
          </button>
        ) : null}
      </section>

      <section ref={storyRef} className="ge-sec" aria-label="Our story">
        <div className="ge-sec-bg is-blur" style={{ backgroundImage: `url(${table})` }} />
        <div className="ge-sec-shade" />
        <Lam>
          <div className="ge-frames">
            {[0, 1, 2].map((index) => (
              <span key={index} className="ge-frame">
                {photos[index] ? <img src={photos[index]} alt="" /> : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B8893F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
                    ADD PHOTO
                  </>
                )}
              </span>
            ))}
          </div>
          <span className="ge-kick">OUR STORY</span>
          <span className="ge-script">{story?.title || "Two hearts."}</span>
          {storyLines[0] ? <span className="ge-line">{storyLines[0]}</span> : null}
          <span className="ge-rule" />
          {story?.year ? <span className="ge-date">EST. {story.year}</span> : null}
          {storyLines[1] ? <span className="ge-place">{storyLines[1]}</span> : null}
        </Lam>
      </section>

      <section className="ge-sec" aria-label="Wedding ceremony">
        <div className="ge-sec-bg" style={{ backgroundImage: `url(${ceremonyArt})` }} />
        <div className="ge-sec-shade" />
        <Lam>
          <div className="ge-photo"><img src={ceremonyArt} alt="Wedding mandap at sunset" /></div>
          <span className="ge-kick">WEDDING CEREMONY</span>
          <span className="ge-script small">{ceremonyName}</span>
          <span className="ge-line">{longDate(fields.date)}</span>
          <span className="ge-rule" />
          {fields.time ? <span className="ge-date">{clock(fields.time)}</span> : null}
          <span className="ge-place">{fields.detail || fields.venue}</span>
        </Lam>
      </section>

      {hasReception ? (
        <section className="ge-sec" aria-label="Reception">
          <div className="ge-sec-bg" style={{ backgroundImage: `url(${receptionArt})` }} />
          <div className="ge-sec-shade" />
          <Lam>
            <div className="ge-photo"><img src={receptionArt} alt="Candlelit reception" /></div>
            <span className="ge-kick">RECEPTION</span>
            <span className="ge-script small">{receptionName}</span>
            <span className="ge-line">{longDate(nextDay(fields.date))}</span>
            <span className="ge-rule" />
            {fields.receptionTime ? <span className="ge-date">{clock(fields.receptionTime)}</span> : null}
            <span className="ge-place">{fields.receptionVenue}</span>
          </Lam>
        </section>
      ) : null}

      <section className="ge-sec" aria-label="Venue">
        <div className="ge-sec-bg" style={{ backgroundImage: `url(${ART.venue})` }} />
        <div className="ge-sec-shade" />
        <Lam>
          <div className="ge-photo"><img src={ART.venue} alt={fields.venue || "The venue"} /></div>
          <span className="ge-kick">THE VENUE</span>
          <span className="ge-script small">{fields.venue || "The venue"}</span>
          {fields.address ? <span className="ge-line">{fields.address}</span> : null}
          <span className="ge-rule" />
          {venueNotes[0] ? <span className="ge-date">{venueNotes[0].toUpperCase()}</span> : null}
          {venueNotes[1] ? <span className="ge-place">{venueNotes[1]}</span> : null}
          <button type="button" className="ge-btn gold" style={{ marginTop: 8 }} onClick={directions}>⌖ Get directions</button>
        </Lam>
      </section>

      <section className="ge-final" aria-label="Closing">
        <div className="ge-final-bg" style={{ backgroundImage: `url(${table})` }} />
        <div className="ge-fan">
          {fan.map((title, index) => {
            const slot = (index - (fanAt % fan.length) + fan.length) % fan.length;
            const front = slot === 0;
            return (
              <div key={title} className={front ? "ge-fan-card is-front" : "ge-fan-card"} style={{ transform: `rotate(${(slot - mid) * 9}deg)`, zIndex: front ? 9 : 5 - Math.abs(slot - mid) }}>
                <div className="ge-lam-in"><span className="ge-script">{title}</span></div>
              </div>
            );
          })}
          <img className="ge-fan-seal" src={ART.seal} alt="" />
        </div>
        <span className="ge-quote">{quote.map((line, index) => <span key={line}>{index ? <br /> : null}{line}</span>)}</span>
        <div className="ge-actions">
          <a className="ge-btn gold" href="#rsvp">RSVP below ↓</a>
          <button type="button" className="ge-btn glass" onClick={replay}>↺ Open the envelope again</button>
        </div>
      </section>

      <section id="rsvp" className="ge-rsvp" aria-label="Reply">
        <div className="ge-rsvp-bg" style={{ backgroundImage: `url(${table})` }} />
        <div className="ge-count">
          {count.map((value, index) => (
            <div key={["DAYS", "HOURS", "MINUTES", "SECONDS"][index]} className="ge-box">
              <span className="ge-num">{String(Math.max(0, value)).padStart(2, "0")}</span>
              <span className="ge-unit">{["DAYS", "HOURS", "MINUTES", "SECONDS"][index]}</span>
            </div>
          ))}
        </div>
        <div className="ge-rsvp-card">
          <div className="ge-lam">
            <div className="ge-lam-in">
              <span className="ge-glass" aria-hidden="true" />
              {step === "intro" ? (
                <>
                  <span className="ge-kick">{fields.rsvpBy ? `KINDLY REPLY BY ${replyDate(fields.rsvpBy)}` : "KINDLY REPLY"}</span>
                  <span className="ge-big">Will you join us?</span>
                  <button type="button" className="ge-btn wine" onClick={() => setStep("form")}>Joyfully accept</button>
                  <button type="button" className="ge-btn line" onClick={() => setStep("no")}>Regretfully decline</button>
                </>
              ) : null}
              {step === "form" ? (
                <>
                  <span className="ge-kick">YOUR DETAILS</span>
                  <input id={nameId} className="ge-field" aria-label="Your name" value={name} placeholder="Your name" onChange={(input) => { setName(input.target.value); setNameErr(false); }} />
                  {nameErr ? <span className="ge-err">Please enter your name.</span> : null}
                  <div className="ge-guests">
                    <span>Guests</span>
                    <div className="ge-step">
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                      <strong>{guests}</strong>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(9, count + 1))}>+</button>
                    </div>
                  </div>
                  <input className="ge-field" aria-label="Message" value={msg} placeholder="A wish for the couple (optional)" onChange={(input) => setMsg(input.target.value)} />
                  <button type="button" className="ge-btn wine" disabled={sending} onClick={() => void submit()}>{sending ? "Sealing…" : "Seal my reply"}</button>
                </>
              ) : null}
              {step === "yes" ? (
                <>
                  <img className="ge-stamp" src={ART.seal} alt="" />
                  <span className="ge-big">Thank you, {name.trim().split(" ")[0]}</span>
                  <span className="ge-line">We can’t wait to celebrate with you.</span>
                  <button type="button" className="ge-btn line" onClick={addCalendar}>+ Add to calendar</button>
                  <button type="button" className="ge-link" onClick={() => setStep("intro")}>Change reply</button>
                </>
              ) : null}
              {step === "no" ? (
                <>
                  <span className="ge-big">We’ll miss you</span>
                  <span className="ge-line">Thank you for letting us know. Your wishes mean the world to us.</span>
                  <button type="button" className="ge-btn line" onClick={() => setStep("intro")}>Change reply</button>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <a className="ge-made" href={madeWithHref("grandenvelope")}>CREATE YOUR INVITATION · INVITESREADY</a>
      </section>

      {toast ? (
        <div className="ge-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
