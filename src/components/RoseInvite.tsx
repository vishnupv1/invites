import { useEffect, useId, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./rose.css";

type Phase = "closed" | "opening" | "open";
type Reply = { name: string; note: string; attending: boolean };

const ICONS = ["/rose/icon-arrival.webp", "/rose/icon-pheras.webp", "/rose/icon-cocktail.webp", "/rose/icon-dance.webp"];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  const first = parts[0] || "Saanvi";
  const second = parts[1] || "Arjun";
  return { first, second, a: first[0] || "S", b: second[0] || "A" };
}

function dayOf(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function coverDate(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const weekday = day.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = day.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  return `${weekday} · ${day.getDate()} ${month} ${day.getFullYear()}`;
}

function replyBy(date: string) {
  const day = dayOf(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" });
  return `${day.getDate()} ${month} ${day.getFullYear()}`;
}

function stamp(date: string) {
  const [year, month, day] = date.split("-");
  if (!day) return date;
  return `${day} · ${month} · ${year}`;
}

function cityOf(address: string, venue: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2].toUpperCase();
  return (parts[0] || venue).toUpperCase();
}

function countdown(date: string, time: string, now: number) {
  const target = new Date(`${date}T${time || "17:30"}:00+05:30`).getTime();
  let left = Math.max(0, Math.floor((target - now) / 1000));
  if (Number.isNaN(left)) left = 0;
  const days = Math.floor(left / 86400);
  left %= 86400;
  const hours = Math.floor(left / 3600);
  left %= 3600;
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  return [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

function ScratchGlass({ cover, gone, onDone }: { cover: string; gone: boolean; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(false);
  const finish = useRef(onDone);
  finish.current = onDone;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || done.current) return;
    let dead = false;
    let down = false;
    let last: [number, number] | null = null;
    let moves = 0;
    const context = canvas.getContext("2d");
    if (!context) return;

    const paint = () => {
      if (dead || !canvas.offsetWidth) return;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.offsetWidth * scale);
      canvas.height = Math.round(canvas.offsetHeight * scale);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "#E9B9B3";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const image = new Image();
      image.onload = () => {
        if (dead) return;
        context.globalCompositeOperation = "source-over";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = cover;
    };

    const point = (event: PointerEvent): [number, number] => {
      const box = canvas.getBoundingClientRect();
      return [(event.clientX - box.left) * canvas.width / box.width, (event.clientY - box.top) * canvas.height / box.height];
    };

    const cleared = () => {
      if (done.current) return;
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      let clear = 0;
      for (let y = 0; y < canvas.height; y += 8) {
        for (let x = 0; x < canvas.width; x += 8) {
          total += 1;
          if (data[(y * canvas.width + x) * 4 + 3] < 40) clear += 1;
        }
      }
      if (total && clear / total > 0.45) {
        done.current = true;
        finish.current();
      }
    };

    const draw = (next: [number, number]) => {
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = canvas.width * 0.22;
      context.beginPath();
      context.moveTo((last || next)[0], (last || next)[1]);
      context.lineTo(next[0], next[1]);
      context.stroke();
      last = next;
      moves += 1;
      if (moves % 8 === 0) cleared();
    };

    const downAt = (event: PointerEvent) => {
      down = true;
      last = null;
      try { canvas.setPointerCapture(event.pointerId); } catch { /* pointer capture is optional */ }
      draw(point(event));
    };
    const move = (event: PointerEvent) => { if (down) draw(point(event)); };
    const up = () => { down = false; last = null; cleared(); };

    paint();
    let frame = 0;
    if (!canvas.offsetWidth) {
      frame = window.requestAnimationFrame(() => {
        if (!dead && canvas.offsetWidth) paint();
      });
    }
    canvas.addEventListener("pointerdown", downAt);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      dead = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", downAt);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [cover]);

  return <canvas ref={ref} className={gone ? "gone" : undefined} aria-label="Rub the glass to reveal the couple’s photo" />;
}

export function RoseInvite({
  fields,
  quiet = false,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond");
  const rootRef = useRef<HTMLDivElement>(null);
  const oliveId = useId();
  const nameId = useId();
  const noteId = useId();
  const [desk, setDesk] = useState(false);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [revealed, setRevealed] = useState(quiet);
  const [gone, setGone] = useState(false);
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => setDesk(node.clientWidth >= 960);
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
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    const id = window.setTimeout(() => setPhase("open"), 3800);
    return () => window.clearTimeout(id);
  }, [phase]);

  const couple = coupleOf(fields.names);
  const pack = packOf("rose", fields.lines);
  const programme = pack.programme ?? [];
  const photo = fields.photos[0] ? assetUrl(fields.photos[0]) : "/rose/couple.webp";
  const parts = countdown(fields.date, fields.time, now);
  const labels = ["DAYS", "HOURS", "MIN", "SEC"];
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");

  function open() {
    if (phase !== "closed") return;
    setPhase("opening");
  }

  function reveal() {
    setGone(true);
    window.setTimeout(() => setRevealed(true), 900);
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const chosen = programme.filter((_, index) => picked[index] !== false).map((item) => item.title);
    const wish = [note.trim(), chosen.length ? `Joining: ${chosen.join(", ")}` : "", attend === "yes" ? `${guests} ${guests === 1 ? "guest" : "guests"}` : ""].filter(Boolean).join(" · ");
    setSending(true);
    try {
      await onReply?.({ name: name.trim(), note: wish, attending: attend === "yes" });
      setDone(true);
    } catch {
      setToast("We couldn’t send that reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function maps() {
    const query = encodeURIComponent(place || fields.venue);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
    setToast(`Opening ${fields.venue || "the venue"} in Maps…`);
  }

  return (
    <div ref={rootRef} className={`rg${desk ? " is-desk" : ""}${phase !== "closed" ? " is-go" : ""}`}>
      <section className="rg-stage" aria-label="Opening">
        <img className="rg-arch m" src="/rose/arch-m.webp" alt="" />
        <img className="rg-arch d" src="/rose/arch-d.webp" alt="" />
        <div className="rg-wel">
          {fields.hosts ? <span className="rg-k">{fields.hosts}</span> : null}
          {fields.title ? <span className="it">{fields.title}</span> : null}
          <span className="nm">{couple.first}</span>
          <span className="amp">&amp;</span>
          <span className="nm">{couple.second}</span>
          <span className="rule" />
          <span className="dt">{coverDate(fields.date)}</span>
          <span className="vn">{[fields.venue, cityOf(fields.address, "")].filter(Boolean).join(" · ").toUpperCase()}</span>
          <span className="rg-k left">{parts[0]} days to go</span>
        </div>
        <div className="rg-door l">
          <img className="m" src="/rose/door-m.webp" alt="" />
          <img className="d" src="/rose/door-d.webp" alt="" />
        </div>
        <div className="rg-door r">
          <img className="m" src="/rose/door-m.webp" alt="" />
          <img className="d" src="/rose/door-d.webp" alt="" />
        </div>
        {phase === "closed" ? (
          <>
            <span className="rg-ring" />
            <div className="rg-seal">
              <img src="/rose/seal.webp" alt="" />
              <span className="mono">{couple.a}<i>&amp;</i>{couple.b}</span>
            </div>
            <span className="rg-tap">Tap the seal to open</span>
            <button type="button" className="rg-hit" onClick={open} aria-label="Break the seal and open the doors" />
          </>
        ) : null}
        {phase === "open" ? <a className="rg-scroll" href={`#${oliveId}`}>Scroll ↓</a> : null}
      </section>

      <section className="rg-sec" id={oliveId}>
        <div className="rg-duo">
          <div className="rg-olive">
            <img loading="lazy" src="/rose/olive.webp" alt="" />
            <div className="in">
              <span className="rg-sc">{fields.detail || "We’re so happy to share this day with you"}</span>
              <p>{pack.ceremonyName || "Having you with us means the world. We can’t wait to celebrate with the people we love most."}</p>
              <div className="rg-cd">
                {parts.map((value, index) => (
                  <b key={labels[index]}><span className="n">{value}</span><span className="lb">{labels[index]}</span></b>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="rg-oval">
              <div className="ph">
                <img loading="lazy" src={photo} alt={fields.names || "The couple"} />
                {revealed ? null : <ScratchGlass key={desk ? "desk" : "phone"} cover="/rose/glass.webp" gone={gone} onDone={reveal} />}
              </div>
              <img loading="lazy" className="fr" src="/rose/oval.webp" alt="" />
            </div>
            {revealed ? null : (
              <div className="rg-hint">
                <svg className="rg-finger" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#B08A4E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.6 14.5a1.6 1.6 0 0 1 2.6-1.8L9 15" />
                </svg>
                <span>Rub the glass to see us</span>
                <button type="button" className="rg-skip" onClick={reveal}>Or tap to reveal</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rg-sec">
        <img loading="lazy" className="rg-spray l" src="/rose/spray.webp" alt="" />
        <img loading="lazy" className="rg-spray r" src="/rose/spray.webp" alt="" />
        <span className="rg-k" style={{ position: "relative" }}>Welcome</span>
        <h2 style={{ position: "relative" }}>Our families welcome you</h2>
        {fields.message ? <p className="rg-lead" style={{ position: "relative" }}>{fields.message}</p> : null}
        {fields.time ? <span className="rg-k" style={{ position: "relative", marginTop: 10, color: "#C77A82" }}>Ceremony · {formatTime(fields.time)}</span> : null}
      </section>

      <section className="rg-sec">
        <div className="rg-duo">
          <div className="rg-card">
            <img loading="lazy" className="b" src="/rose/card.webp" alt="" />
            <div className="in">
              <span className="rg-k">The venue</span>
              <span className="rg-sc">{fields.venue}</span>
              <span className="t">{[coverDate(fields.date), fields.time ? formatTime(fields.time) : ""].filter(Boolean).join(" · ")}</span>
              {fields.address ? <span className="a">{fields.address}</span> : null}
              <img loading="lazy" className="shot" src="/rose/venue.webp" alt={fields.venue || "The venue"} />
              <button type="button" className="rg-btn" onClick={maps}>Open in maps</button>
            </div>
          </div>
          <div className="rg-dress">
            <img loading="lazy" src="/rose/dress.webp" alt="" />
            <span className="rg-k">Dress code</span>
            <h2>{fields.dress || "Festive Formal"}</h2>
            {pack.venueNote ? <p className="rg-lead">{pack.venueNote}</p> : null}
          </div>
        </div>
      </section>

      {programme.length ? (
        <section className="rg-sec">
          <span className="rg-k">The day</span>
          <h2>Programme</h2>
          <div className="rg-prog">
            <img loading="lazy" className="rb" src="/rose/ribbon.webp" alt="" />
            {programme.map((item, index) => (
              <div className="rg-pi" key={`${item.title}-${index}`}>
                <img loading="lazy" src={ICONS[index % ICONS.length]} alt="" />
                <span className="n">{item.title}</span>
                <span className="t">{item.time}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rg-sec">
        <div className="rg-two">
          <div className="rg-note">
            <img loading="lazy" src="/rose/gift.webp" alt="" />
            <span className="rg-k">Gifts</span>
            <h2>Your presence is our present</h2>
            {pack.gift ? <p className="rg-lead">{pack.gift}</p> : null}
          </div>
          <div className="rg-note stay">
            <img loading="lazy" src="/rose/hotel.webp" alt="" />
            <span className="rg-k">Where to stay</span>
            <h2>{pack.caption || "Hotel Gulab Bagh"}</h2>
            {pack.stay ? <p className="rg-lead">{pack.stay}</p> : null}
            {pack.instagram ? <span className="rg-code">{pack.instagram}</span> : null}
            {pack.instagram ? <span className="rg-k" style={{ color: "#86686A", fontSize: 9.5 }}>Quote this code when booking</span> : null}
          </div>
        </div>
      </section>

      <section className="rg-sec rg-rsvp" id="rsvp">
        <span className="rg-k" style={{ color: "#E7C9A0" }}>RSVP</span>
        <h2>Will you join us?</h2>
        {fields.rsvpBy ? <span className="rg-k" style={{ color: "#D9C29A" }}>Kindly reply by {replyBy(fields.rsvpBy)}</span> : null}
        <div className="rg-form">
          {done ? (
            <div className="rg-done">
              <div className="rg-seal">
                <img loading="lazy" src="/rose/seal.webp" alt="" />
                <span className="mono">{couple.a}<i>&amp;</i>{couple.b}</span>
              </div>
              <span className="rg-sc">{attend === "yes" ? `Thank you, ${name.trim().split(" ")[0]}` : "We’ll miss you"}</span>
              <p className="rg-lead">
                {attend === "yes"
                  ? `${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you in ${cityOf(fields.address, fields.venue).toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}.`
                  : "Thank you for letting us know — your blessings mean the world to us."}
              </p>
              <button type="button" className="rg-link" style={{ color: "#B08A4E" }} onClick={() => setDone(false)}>Change my reply</button>
            </div>
          ) : (
            <>
              <div>
                <label className="rg-lab" htmlFor={nameId}>Full name</label>
                <input id={nameId} className="rg-fld" value={name} onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                {nameError ? <span className="rg-err">Please enter your name</span> : null}
              </div>
              <div className="rg-seg">
                <button type="button" className="rg-opt" aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                <button type="button" className="rg-opt" aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="rg-step">
                    <span className="rg-lab">Guests</span>
                    <div>
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                      <b>{guests}</b>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                    </div>
                  </div>
                  {programme.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span className="rg-lab">Joining us for</span>
                      <div className="rg-chips">
                        {programme.map((item, index) => (
                          <button key={item.title} type="button" aria-pressed={picked[index] !== false} onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}>
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
              <div>
                <label className="rg-lab" htmlFor={noteId}>A wish or memory for the couple</label>
                <textarea id={noteId} className="rg-fld" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
              <button type="button" className="rg-btn wide" disabled={sending} onClick={() => void submit()}>{sending ? "Sending…" : "Send RSVP"}</button>
            </>
          )}
        </div>
      </section>

      <footer className="rg-foot">
        <span className="rg-sc">{fields.names}</span>
        <span className="rg-k" style={{ color: "#D9C29A" }}>{stamp(fields.date)} · {cityOf(fields.address, fields.venue)}</span>
        <button type="button" className="rg-link" onClick={() => { setPhase("closed"); setGone(false); setRevealed(false); }}>↺ Open the doors again</button>
        <a className="rg-link" href={madeWithHref("rose")}>Made with InvitesReady</a>
      </footer>

      {toast ? (
        <div className="rg-toast" role="status">
          <span style={{ flex: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
