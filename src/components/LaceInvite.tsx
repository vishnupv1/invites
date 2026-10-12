import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { formatLongDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./lace.css";

type Phase = "closed" | "fading" | "scratch" | "open";
type Reply = { name: string; note: string; attending: boolean };

const COPY = {
  en: {
    kick: "Together with their families",
    scratch: "Scratch the oval to reveal us",
    skip: "OR TAP TO REVEAL",
    tap: "TAP THE SEAL TO OPEN",
    cal: "ADD TO CALENDAR",
    scroll: "SCROLL",
    noteH: "You are invited",
    evK: "The celebrations",
    evH: "Three days of love",
    cdH: "Until we say yes",
    venK: "The venue",
    maps: "OPEN IN MAPS",
    dressK: "What to wear",
    dressH: "Ivory & champagne",
    rsvpH: "Will you join us?",
    name: "Full name",
    nameErr: "Please enter your name.",
    yes: "Joyfully accept",
    no: "Regretfully decline",
    guests: "Guests",
    join: "Joining us for",
    msg: "A note for the couple",
    send: "SEND MY REPLY",
    change: "CHANGE MY REPLY",
    again: "OPEN THE ENVELOPE AGAIN",
    days: "DAYS",
    hours: "HOURS",
    mins: "MIN",
    secs: "SEC",
  },
  hi: {
    kick: "परिवारों के आशीर्वाद के साथ",
    scratch: "तस्वीर देखने के लिए स्क्रैच करें",
    skip: "या टैप करें",
    tap: "खोलने के लिए मुहर पर टैप करें",
    cal: "कैलेंडर में जोड़ें",
    scroll: "नीचे देखें",
    noteH: "आप आमंत्रित हैं",
    evK: "समारोह",
    evH: "प्यार के तीन दिन",
    cdH: "शुभ घड़ी तक",
    venK: "स्थान",
    maps: "मैप में खोलें",
    dressK: "पोशाक",
    dressH: "आइवरी और शैम्पेन",
    rsvpH: "क्या आप आएँगे?",
    name: "पूरा नाम",
    nameErr: "कृपया अपना नाम लिखें।",
    yes: "ज़रूर आएँगे",
    no: "नहीं आ पाएँगे",
    guests: "मेहमान",
    join: "किन समारोहों में",
    msg: "दंपति के लिए संदेश",
    send: "उत्तर भेजें",
    change: "उत्तर बदलें",
    again: "लिफ़ाफ़ा फिर से खोलें",
    days: "दिन",
    hours: "घंटे",
    mins: "मिनट",
    secs: "सेकंड",
  },
} as const;

function dotted(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!day || !month || !year) return iso;
  return `${day} · ${month} · ${year}`;
}

function dayStamp(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function clock(time: string) {
  const [rawH, rawM] = time.split(":");
  const hour = Number(rawH);
  const minute = Number(rawM);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const face = hour % 12 || 12;
  return `${face}:${String(Number.isNaN(minute) ? 0 : minute).padStart(2, "0")} ${suffix}`;
}

function initials(names: string) {
  const parts = names.split(/\s*&\s*/);
  const letter = (part: string) => (part.trim().match(/[A-Za-z]/)?.[0] || "").toUpperCase();
  return [letter(parts[0] || "") || "M", letter(parts[1] || "") || "K"];
}

export function LaceInvite({
  fields,
  quiet = false,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  useFonts("Pinyon Script", "Cormorant Garamond", "Great Vibes", "Jost");
  const fitRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timers = useRef<number[]>([]);
  const revealing = useRef(false);
  const revealRef = useRef<() => void>(() => {});
  const nameId = useId();
  const noteId = useId();
  const [desk, setDesk] = useState(false);
  const [scale, setScale] = useState(1);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [gone, setGone] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState<boolean[]>([true, true, true, true]);
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const copy = COPY[lang];
  const photo = fields.photos[0] ? assetUrl(fields.photos[0]) : "/lace/couple.webp";
  const [ini1, ini2] = initials(fields.names);
  const place = [fields.venue, fields.address].filter(Boolean).join(", ");
  const venueLine = [fields.venue, fields.address].filter(Boolean).join(" · ").toUpperCase();
  const pack = packOf("lace", fields.lines);
  const events = (pack.programme ?? []).map((item) => {
    const wedding = /wedding/i.test(item.title);
    const reception = /reception/i.test(item.title);
    return {
      day: wedding ? dayStamp(fields.date) : item.kick,
      name: item.title,
      time: wedding ? clock(fields.time) : reception && fields.receptionTime ? clock(fields.receptionTime) : item.time,
      venue: wedding ? fields.venue : reception && fields.receptionVenue ? fields.receptionVenue : item.text,
    };
  });

  const start = new Date(`${fields.date}T${fields.time || "18:30"}:00+05:30`).getTime();
  let remain = Math.max(0, Math.floor((start - now) / 1000));
  const days = Math.floor(remain / 86400);
  remain %= 86400;
  const hours = Math.floor(remain / 3600);
  remain %= 3600;
  const mins = Math.floor(remain / 60);
  const secs = remain % 60;
  const pads = [days, hours, mins, secs].map((value) => String(value).padStart(2, "0"));
  const countLine = lang === "hi"
    ? `${days} दिन · ${hours} घंटे · ${mins} मिनट`
    : `${days} Days · ${hours} Hours · ${mins} Mins`;

  useEffect(() => {
    if (phase !== "open") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useLayoutEffect(() => {
    const fit = fitRef.current;
    const page = pageRef.current;
    if (!fit || !page) return;
    const apply = () => {
      const width = fit.clientWidth;
      if (!width) return;
      const nextDesk = width >= 860;
      const design = nextDesk ? 1440 : 390;
      const nextScale = width / design;
      setDesk((value) => (value === nextDesk ? value : nextDesk));
      setScale((value) => (Math.abs(value - nextScale) < 0.001 ? value : nextScale));
      const nextHeight = page.offsetHeight * nextScale;
      if (Math.abs(fit.getBoundingClientRect().height - nextHeight) > 1) fit.style.height = `${nextHeight}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(fit);
    observer.observe(page);
    return () => observer.disconnect();
  }, [phase, desk, lang, done, events.length]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function openSeal() {
    if (phase !== "closed") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("open");
      return;
    }
    setPhase("fading");
    timers.current.push(window.setTimeout(() => setPhase("scratch"), 6300));
  }

  function reveal() {
    if (revealing.current || phase === "open") return;
    revealing.current = true;
    setGone(true);
    timers.current.push(window.setTimeout(() => {
      revealing.current = false;
      setGone(false);
      setPhase("open");
    }, 900));
  }
  revealRef.current = reveal;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (phase !== "scratch" || !canvas) return;
    let dead = false;
    let down = false;
    let last: [number, number] | null = null;
    let moves = 0;
    const context = canvas.getContext("2d");
    if (!context) return;

    const paint = (ratio: number) => {
      context.fillStyle = "rgba(168,139,94,.75)";
      context.textAlign = "center";
      context.font = `italic ${Math.round(17 * ratio)}px "Cormorant Garamond", serif`;
      context.fillText(lang === "hi" ? "स्क्रैच करें" : "scratch to reveal", canvas.width / 2, canvas.height / 2 + 6 * ratio);
      context.strokeStyle = "rgba(168,139,94,.45)";
      context.lineWidth = ratio;
      context.beginPath();
      context.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 14 * ratio, canvas.height / 2 - 14 * ratio, 0, 0, Math.PI * 2);
      context.setLineDash([3 * ratio, 5 * ratio]);
      context.stroke();
      context.setLineDash([]);
    };

    const check = () => {
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      let clear = 0;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      for (let y = 0; y < canvas.height; y += 8) {
        for (let x = 0; x < canvas.width; x += 8) {
          const nx = (x - cx) / cx;
          const ny = (y - cy) / cy;
          if (nx * nx + ny * ny > 1) continue;
          total += 1;
          if (data[(y * canvas.width + x) * 4 + 3] < 40) clear += 1;
        }
      }
      if (total && clear / total > 0.45) revealRef.current();
    };

    const pos = (event: PointerEvent): [number, number] => {
      const box = canvas.getBoundingClientRect();
      return [(event.clientX - box.left) * canvas.width / box.width, (event.clientY - box.top) * canvas.height / box.height];
    };

    const draw = (point: [number, number]) => {
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = canvas.width * 0.2;
      context.beginPath();
      context.moveTo((last || point)[0], (last || point)[1]);
      context.lineTo(point[0], point[1]);
      context.stroke();
      last = point;
      moves += 1;
      if (moves % 8 === 0) check();
    };

    const downHandler = (event: PointerEvent) => {
      down = true;
      last = null;
      canvas.setPointerCapture?.(event.pointerId);
      draw(pos(event));
    };
    const moveHandler = (event: PointerEvent) => {
      if (down) draw(pos(event));
    };
    const upHandler = () => {
      down = false;
      last = null;
      check();
    };

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    if (!width || !height) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const wash = context.createRadialGradient(canvas.width / 2, canvas.height * 0.42, 10, canvas.width / 2, canvas.height / 2, canvas.height * 0.7);
    wash.addColorStop(0, "#F7F0E3");
    wash.addColorStop(1, "#E4D5BD");
    context.fillStyle = wash;
    context.fillRect(0, 0, canvas.width, canvas.height);
    paint(ratio);
    const texture = new Image();
    texture.onload = () => {
      if (dead) return;
      context.globalAlpha = 0.55;
      context.globalCompositeOperation = "multiply";
      const pattern = context.createPattern(texture, "repeat");
      if (pattern) {
        context.fillStyle = pattern;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      paint(ratio);
    };
    texture.src = "/lace/paper.webp";
    canvas.addEventListener("pointerdown", downHandler);
    canvas.addEventListener("pointermove", moveHandler);
    canvas.addEventListener("pointerup", upHandler);
    canvas.addEventListener("pointercancel", upHandler);
    return () => {
      dead = true;
      canvas.removeEventListener("pointerdown", downHandler);
      canvas.removeEventListener("pointermove", moveHandler);
      canvas.removeEventListener("pointerup", upHandler);
      canvas.removeEventListener("pointercancel", upHandler);
    };
  }, [phase, lang, desk]);

  function addCal() {
    const startAt = new Date(`${fields.date}T${fields.time || "18:30"}:00+05:30`);
    const endAt = new Date(startAt.getTime() + 4 * 60 * 60 * 1000);
    const stamp = (day: Date) => day.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(fields.names)}&dates=${stamp(startAt)}/${stamp(endAt)}&location=${encodeURIComponent(place)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function maps() {
    const query = place || fields.venue;
    if (!query) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  async function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setSending(true);
    try {
      const chosen = events.filter((_, index) => picked[index] !== false).map((item) => item.name);
      const extra = attend === "yes"
        ? `${guests} ${guests === 1 ? "guest" : "guests"}${chosen.length ? ` · ${chosen.join(", ")}` : ""}${note.trim() ? ` · ${note.trim()}` : ""}`
        : note.trim();
      await onReply?.({ name: name.trim(), note: extra, attending: attend === "yes" });
      setDone(true);
    } finally {
      setSending(false);
    }
  }

  function replay() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    revealing.current = false;
    setGone(false);
    setPhase("closed");
  }

  const stage = desk ? 900 : 844;
  const frame = desk
    ? { left: 270, top: 186, width: 420, height: 535 }
    : { left: 55, top: 84, width: 280, height: 357 };
  const envelope = desk
    ? { left: -79.6, top: 0, width: 1599.1, height: 900 }
    : { left: -42.5, top: 0, width: 475, height: 844 };
  const seal = desk
    ? { left: 733.6, top: 734.9, width: 132 }
    : { left: 181.5, top: 397.6, width: 112 };
  const ring = desk
    ? { left: 713.6, top: 711.1, size: 172 }
    : { left: 164.5, top: 377.4, size: 146 };
  const pocket = desk ? "/lace/pocket-d.webp" : "/lace/pocket-m.webp";
  const flap = desk ? "/lace/flap-d.webp" : "/lace/flap-m.webp";
  const flapBack = desk ? "/lace/back-d.webp" : "/lace/back-m.webp";
  const showEnv = phase === "closed" || phase === "fading";
  const replyBy = fields.rsvpBy
    ? (lang === "hi" ? `${formatLongDate(fields.rsvpBy)} तक उत्तर दें` : `Kindly reply by ${formatLongDate(fields.rsvpBy)}`)
    : "";
  const first = name.trim().split(" ")[0] || (lang === "hi" ? "मित्र" : "friend");

  return (
    <div className="lr-fit" ref={fitRef} style={{ height: stage }}>
      <div
        ref={pageRef}
        className={`lr ${desk ? "d" : "m"} ph-${phase}`}
        style={{ width: desk ? 1440 : 390, transform: `scale(${scale})`, transformOrigin: "top left" }}
        data-motion={window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "off" : "on"}
      >
        <section className="stage" style={{ height: stage }}>
          <img className="dove" src="/lace/dove.webp" alt="" style={{ top: desk ? 30 : 24, width: desk ? 64 : 50, marginLeft: desk ? -32 : -25 }} />
          <div className="lang" style={{ top: desk ? 24 : 14, right: desk ? 40 : 10 }} role="group" aria-label="Language">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
            <span style={{ alignSelf: "center", color: "#CDBEA8" }}>/</span>
            <button type="button" aria-pressed={lang === "hi"} onClick={() => setLang("hi")}>हिं</button>
          </div>

          <div className="fw" style={frame}>
            <div className="oval">
              <img src={photo} alt={fields.names} />
              {phase === "scratch" ? (
                <canvas ref={canvasRef} className={gone ? "gone" : ""} aria-label="Scratch to reveal the couple’s photo" />
              ) : null}
            </div>
            <img className="frame" src="/lace/frame.webp" alt="" />
          </div>

          {phase === "scratch" && !gone ? (
            <div className="hint" style={{ top: desk ? 736 : 676 }}>
              <svg className="finger" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A88B5E" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.6 14.5a1.6 1.6 0 0 1 2.6-1.8L9 15" />
              </svg>
              <span className="msg">{copy.scratch}</span>
              <button type="button" className="skip" onClick={reveal}>{copy.skip}</button>
            </div>
          ) : null}

          <div className="ht" style={desk ? { left: 740, width: 520, top: 40, bottom: 0, justifyContent: "center" } : { left: 16, right: 16, top: 458 }}>
            <span className="k rise" style={{ animationDelay: ".3s" }}>{copy.kick}</span>
            <span className="nm script rise" style={{ animationDelay: ".6s" }}>{fields.names}</span>
            <span className="dt rise" style={{ animationDelay: "1s" }}>{dotted(fields.date)}</span>
            <span className="vn rise" style={{ animationDelay: "1.2s" }}>{venueLine}</span>
            <span className="cdl rise" style={{ animationDelay: "1.4s" }}>{countLine}</span>
            <button type="button" className="pillBtn rise" style={{ animationDelay: "1.7s", marginTop: 10 }} onClick={addCal}>{copy.cal}</button>
          </div>
          {phase === "open" ? <a className="scrollHint" href="#lr-note">{copy.scroll} ↓</a> : null}

          {showEnv ? (
            <div className="env">
              <div className="eb" />
              <div className="ecw">
                <div className="ec" style={envelope}>
                  <span className="L in" />
                  <div className="card">
                    <div className="ct">
                      <img src="/lace/dove.webp" alt="" style={{ width: 34, marginBottom: 6 }} />
                      <span className="k">{copy.kick}</span>
                      <span className="script">{fields.names}</span>
                      <span className="cd8">{dotted(fields.date)}</span>
                      <span className="k" style={{ marginTop: 6, color: "#857867" }}>{venueLine}</span>
                    </div>
                  </div>
                  <img className="L pk" src={pocket} alt="" />
                  <div className="flapW">
                    <div className="fs">
                      <img className="L" src={flap} alt="" />
                      <img className="fb" src={flapBack} alt="" />
                    </div>
                  </div>
                  {phase === "closed" ? <span className="ring" style={{ left: ring.left, top: ring.top, width: ring.size, height: ring.size }} /> : null}
                  <div className="sealW" style={{ left: seal.left, top: seal.top, width: seal.width }}>
                    <img src="/lace/seal.webp" alt="" />
                    <span className="mono">{ini1}<i>&amp;</i>{ini2}</span>
                  </div>
                </div>
              </div>
              <span className="tap" style={{ top: desk ? 54 : 675 }}>{copy.tap}</span>
              {phase === "closed" ? <button type="button" className="hit" onClick={openSeal} aria-label="Break the seal and open the invitation" /> : null}
            </div>
          ) : null}
        </section>

        <section className="sec" id="lr-note">
          <img className="div" src="/lace/divider.webp" alt="" />
          <div className="lacecard">
            <img className="c1" src="/lace/corner.webp" alt="" />
            <img className="c2" src="/lace/corner.webp" alt="" />
            <span className="k">{copy.kick}</span>
            <h2>{copy.noteH}</h2>
            {fields.message ? <p className="lead">{fields.message}</p> : null}
            {fields.hosts ? <p className="parents" style={{ margin: "14px 0 0" }}>{fields.hosts}</p> : null}
          </div>
        </section>

        <section className="sec alt">
          <span className="k">{copy.evK}</span>
          <h2>{copy.evH}</h2>
          <div className="evGrid">
            {events.map((item) => (
              <div className="ev" key={`${item.day}-${item.name}`}>
                <img className="c1" src="/lace/corner.webp" alt="" />
                <img className="c2" src="/lace/corner.webp" alt="" />
                <span className="d">{item.day}</span>
                <span className="n">{item.name}</span>
                <span className="w">{item.time}</span>
                <span className="v">{item.venue}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="sec">
          <img src="/lace/dove.webp" alt="" style={{ width: 54 }} />
          <h2>{copy.cdH}</h2>
          <div className="cdRow">
            {[copy.days, copy.hours, copy.mins, copy.secs].map((label, index) => (
              <div className="cdB" key={label}>
                <span className="num">{pads[index]}</span>
                <span className="lbl">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="sec alt">
          <span className="k">{copy.venK}</span>
          <h2>{fields.venue}</h2>
          {fields.address ? <p className="lead" style={{ fontStyle: "italic", color: "#857867" }}>{fields.address}</p> : null}
          <div className="map">
            <svg viewBox="0 0 520 260" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 190 C 120 160, 160 230, 300 200 S 460 150, 520 170 L520 260 L0 260Z" fill="#D9E1DA" />
              <path d="M0 60 L520 110 M120 0 L170 260 M330 0 L300 260 M0 140 L520 60" stroke="#FBF7F0" strokeWidth="7" />
              <path d="M0 60 L520 110 M120 0 L170 260 M330 0 L300 260 M0 140 L520 60" stroke="#E2D6C2" strokeWidth="1" />
            </svg>
            <div className="pin"><i /><span>{fields.venue.toUpperCase()}</span></div>
          </div>
          <div className="btnRow">
            <button type="button" className="pillBtn solid" onClick={maps}>{copy.maps}</button>
            <button type="button" className="pillBtn" onClick={addCal}>{copy.cal}</button>
          </div>
        </section>

        <section className="sec">
          <span className="k">{copy.dressK}</span>
          <h2>{copy.dressH}</h2>
          {fields.dress ? <p className="lead">{fields.dress}</p> : null}
          <div className="sw">
            <span style={{ background: "#F7F1E6" }} />
            <span style={{ background: "#E9DCC5" }} />
            <span style={{ background: "#D8C3A0" }} />
            <span style={{ background: "#E8CFC4" }} />
            <span style={{ background: "#B9A58A" }} />
          </div>
          <img className="div" src="/lace/divider.webp" alt="" style={{ marginTop: 20 }} />
        </section>

        <section className="sec alt" id="lr-rsvp">
          <span className="k">RSVP</span>
          <h2>{copy.rsvpH}</h2>
          {replyBy ? <span className="k" style={{ color: "#857867" }}>{replyBy}</span> : null}
          <div className="form">
            {done ? (
              <div className="done">
                <div className="sealMark">
                  <img src="/lace/seal.webp" alt="" />
                  <span className="mono">{ini1}<i>&amp;</i>{ini2}</span>
                </div>
                <span className="script" style={{ fontSize: 40 }}>{attend === "yes" ? `${lang === "hi" ? "धन्यवाद, " : "Thank you, "}${first}` : (lang === "hi" ? "हमें आपकी कमी रहेगी" : "We’ll miss you")}</span>
                <p className="lead" style={{ fontSize: 18 }}>
                  {attend === "yes"
                    ? (lang === "hi" ? `${guests} सीट आपके लिए सुरक्षित है।` : `${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you.`)
                    : (lang === "hi" ? "बताने के लिए धन्यवाद — आपके आशीर्वाद हमारे लिए अनमोल हैं।" : "Thank you for letting us know. Your blessings mean the world to us.")}
                </p>
                <button type="button" className="link" onClick={() => setDone(false)}>{copy.change}</button>
              </div>
            ) : (
              <>
                <div>
                  <label className="lab" htmlFor={nameId}>{copy.name}</label>
                  <input id={nameId} className="fld" value={name} placeholder="—" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                  {nameError ? <span className="err">{copy.nameErr}</span> : null}
                </div>
                <div className="seg">
                  <button type="button" className="opt" aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>{copy.yes}</button>
                  <button type="button" className="opt" aria-pressed={attend === "no"} onClick={() => setAttend("no")}>{copy.no}</button>
                </div>
                {attend === "yes" ? (
                  <>
                    <div className="step">
                      <span className="k">{copy.guests}</span>
                      <div>
                        <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                        <b aria-live="polite">{guests}</b>
                        <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(10, value + 1))}>+</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span className="k">{copy.join}</span>
                      <div className="chips">
                        {events.map((item, index) => (
                          <button
                            key={item.name}
                            type="button"
                            aria-pressed={picked[index] !== false}
                            onClick={() => setPicked((value) => events.map((_, placeIndex) => (placeIndex === index ? value[placeIndex] === false : value[placeIndex] !== false)))}
                          >
                            {item.name.replace(/^The /, "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
                <div>
                  <label className="lab" htmlFor={noteId}>{copy.msg}</label>
                  <textarea id={noteId} className="fld" value={note} onChange={(event) => setNote(event.target.value)} />
                </div>
                <button type="button" className="pillBtn solid" style={{ minHeight: 52 }} disabled={sending} onClick={submit}>{copy.send}</button>
              </>
            )}
          </div>
        </section>

        <footer className="foot">
          <img src="/lace/dove.webp" alt="" style={{ width: 60 }} />
          <span className="script" style={{ fontSize: 48 }}>{fields.names}</span>
          <span className="k">{dotted(fields.date)} · {fields.address || fields.venue}</span>
          <button type="button" className="link" onClick={replay}>↺ {copy.again}</button>
          <a className="k" href={madeWithHref("lace")} style={{ color: "#857867", opacity: 0.75, fontSize: 9.5, textDecoration: "none" }}>MADE WITH INVITESREADY</a>
        </footer>

      </div>
    </div>
  );
}
