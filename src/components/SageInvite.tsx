import { useEffect, useRef, useState } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { InstagramLink } from "./InstagramLink";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./sage.css";

type Phase = "closed" | "opening" | "open" | "print";
type Reply = { name: string; note: string; attending: boolean };

function stamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function useLeft(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = new Date(`${date || "2027-04-29"}T${time || "16:00"}:00`).getTime();
  const left = Math.max(0, (Number.isNaN(target) ? 0 : target) - now);
  return [
    Math.floor(left / 86400000),
    Math.floor(left / 3600000) % 24,
    Math.floor(left / 60000) % 60,
    Math.floor(left / 1000) % 60,
  ] as const;
}

function ScratchCard({ image }: { image: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || done) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let dead = false;
    let down = false;
    let last: [number, number] | null = null;
    let moves = 0;

    const paint = () => {
      if (moves > 0) return;
      const box = canvas.getBoundingClientRect();
      if (box.width < 2) return;
      const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(box.width * ratio);
      canvas.height = Math.round(box.height * ratio);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "#d7e6cb";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#5c6b4e";
      context.textAlign = "center";
      context.font = `${Math.round(13 * ratio)}px Jost, sans-serif`;
      context.fillText("SCRATCH", canvas.width / 2, canvas.height / 2);
    };

    const check = () => {
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = 0;
      let clear = 0;
      for (let y = 0; y < canvas.height; y += 8) {
        for (let x = 0; x < canvas.width; x += 8) {
          total += 1;
          if (data[(y * canvas.width + x) * 4 + 3] < 40) clear += 1;
        }
      }
      if (total && clear / total > 0.42) setDone(true);
    };

    const point = (event: PointerEvent): [number, number] => {
      const box = canvas.getBoundingClientRect();
      return [(event.clientX - box.left) * canvas.width / box.width, (event.clientY - box.top) * canvas.height / box.height];
    };

    const draw = (event: PointerEvent) => {
      const next = point(event);
      context.globalCompositeOperation = "destination-out";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = canvas.width * 0.14;
      context.beginPath();
      context.moveTo((last || next)[0], (last || next)[1]);
      context.lineTo(next[0], next[1]);
      context.stroke();
      last = next;
      moves += 1;
      if (moves % 6 === 0) check();
    };

    const start = (event: PointerEvent) => {
      down = true;
      canvas.setPointerCapture(event.pointerId);
      last = null;
      draw(event);
    };
    const move = (event: PointerEvent) => {
      if (down) draw(event);
    };
    const stop = () => {
      down = false;
      last = null;
    };

    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    return () => {
      dead = true;
      observer.disconnect();
      canvas.removeEventListener("pointerdown", start);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", stop);
      canvas.removeEventListener("pointercancel", stop);
      void dead;
    };
  }, [done]);

  return (
    <div className={`sa-frame${done ? " is-clear" : ""}`}>
      <div className="sa-frame-well">
        {image ? <img src={image} alt="" /> : <span>Your photograph</span>}
        {done ? null : <canvas ref={canvasRef} aria-label="Scratch to reveal" />}
      </div>
      <img className="sa-frame-art" src="/sage/oval-frame.webp" alt="" />
    </div>
  );
}

export function SageInvite({ fields, quiet = false, onReply }: { fields: InviteFields; quiet?: boolean; onReply?: (reply: Reply) => void | Promise<void> }) {
  useFonts("Great Vibes", "Cormorant Garamond", "Jost");
  const [phase, setPhase] = useState<Phase>(quiet ? "print" : "closed");
  const shots = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : ""));
  const cover = shots[0] || "";
  const reveal = shots[1] || "";
  const gallery = shots.slice(2).filter(Boolean);
  const place = [fields.venue, fields.address].filter(Boolean).join(" · ");
  const date = stamp(fields.date || "");
  const left = useLeft(fields.date || "", fields.time || "");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guest, setGuest] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const thanksRef = useRef<HTMLElement>(null);
  const [ink, setInk] = useState(false);

  useEffect(() => {
    if (phase !== "opening") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("print");
      return;
    }
    const openAt = window.setTimeout(() => setPhase("open"), 2650);
    return () => window.clearTimeout(openAt);
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const printAt = window.setTimeout(() => setPhase("print"), 180);
    return () => window.clearTimeout(printAt);
  }, [phase]);

  function openInvite() {
    if (phase !== "closed") return;
    setPhase("opening");
  }

  async function sendReply() {
    if (!guest.trim()) {
      setNameError(true);
      return;
    }
    setSending(true);
    try {
      await onReply?.({ name: guest.trim(), note: note.trim(), attending: attend === "yes" });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  const lifting = phase === "opening" || phase === "open" || phase === "print";
  const revealed = phase === "open" || phase === "print";

  useEffect(() => {
    const node = thanksRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setInk(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setInk(true);
      observer.disconnect();
    }, { threshold: 0.45 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <div className={`sa${lifting ? " is-opening" : ""}${revealed ? " is-open" : ""}${phase === "print" ? " is-print" : ""}${quiet ? " is-quiet" : ""}`}>
      <div className="sa-paper" />
      <div className="sa-scroll">
      <div className="sa-stage">
        <section className="sa-invite" aria-label="Wedding announcement">
          <div className="sa-identity">
            <div className="sa-eyebrow">{fields.title || "We're getting married"}</div>
            <h1 className="sa-names">{fields.names || "Ana & Luka"}</h1>
            <div className="sa-dispenser">
              <div className="sa-mask">
                <div className="sa-polaroid">
                  <div className="sa-photo">
                    {cover ? <img src={cover} alt="" /> : <div className="sa-placeholder">Your couple photo</div>}
                  </div>
                  {date ? <div className="sa-date">{date}</div> : null}
                </div>
              </div>
              <img className="sa-slot" src="/sage/gold-slot.webp" alt="" />
            </div>
          </div>
          {quiet && place ? <p className="sa-place">{place}</p> : null}
          {quiet ? (
            <>
              <button className="sa-replay" type="button" onClick={() => setPhase("closed")}>↻ Replay</button>
              <div className="sa-credit">
                <a href={madeWithHref("sage")}>Made with InvitesReady</a>
                <InstagramLink />
              </div>
            </>
          ) : null}
        </section>
        {phase === "closed" || phase === "opening" ? (
          <div className="sa-env">
            <div className="sa-sheet">
              <img className="fit sa-front" src="/sage/envelope.webp" alt="" />
              <div className="sa-flap">
                <img src="/sage/flap.webp" alt="" />
                <span className="sa-flap-back" />
              </div>
              <img className="sa-bow" src="/sage/ivory-bow.webp" alt="" />
              <div className="sa-env-copy">
                <span>A letter for you, with love</span>
                <strong>{fields.names || "Ana & Luka"}</strong>
              </div>
              {phase === "closed" ? <span className="sa-tap">TAP TO OPEN</span> : null}
            </div>
            {phase === "closed" ? (
              <button type="button" className="sa-hit" aria-label="Open invitation" onClick={openInvite} />
            ) : null}
          </div>
        ) : null}
      </div>
      {revealed && !quiet ? (
        <div className="sa-pages">
          <section className="sa-page" aria-label="Gallery">
            <p className="sa-kicker">The photographs</p>
            <h2>Moments</h2>
            <div className={`sa-gallery${gallery.length < 2 ? " is-single" : ""}`}>
              {(gallery.length ? gallery : [""]).map((src, index) => (
                <figure key={`${src}-${index}`}>
                  {src ? <img src={src} alt="" /> : <span>Your photograph</span>}
                </figure>
              ))}
            </div>
          </section>
          <section className="sa-page" aria-label="Countdown">
            <p className="sa-kicker">{date || "The day"}</p>
            <h2>Counting the days</h2>
            <div className="sa-count">
              {(["Days", "Hours", "Minutes", "Seconds"] as const).map((label, index) => (
                <div key={label}>
                  <b>{String(left[index]).padStart(2, "0")}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            {place ? <p className="sa-when">{place}</p> : null}
          </section>
          <section className="sa-page" aria-label="Scratch to reveal">
            <p className="sa-kicker">A note for you</p>
            <h2>Scratch the card</h2>
            <ScratchCard image={reveal} />
          </section>
          <section className="sa-page" aria-label="Reply">
            <p className="sa-kicker">Reply</p>
            <h2>Will you be there?</h2>
            {sent ? (
              <p className="sa-sent">Thank you. Your reply is with {fields.names || "Ana & Luka"}.</p>
            ) : (
              <form className="sa-rsvp" onSubmit={(event) => { event.preventDefault(); void sendReply(); }}>
                <label>
                  Your name
                  <input value={guest} placeholder="Name" onChange={(event) => { setGuest(event.target.value); setNameError(false); }} />
                </label>
                {nameError ? <small>Please add your name.</small> : null}
                <div className="sa-choice">
                  <button type="button" className={attend === "yes" ? "is-on" : ""} onClick={() => setAttend("yes")}>Joyfully yes</button>
                  <button type="button" className={attend === "no" ? "is-on" : ""} onClick={() => setAttend("no")}>With regret</button>
                </div>
                <label>
                  A note
                  <textarea value={note} rows={2} placeholder="A few words" onChange={(event) => setNote(event.target.value)} />
                </label>
                <button className="sa-send" type="submit" disabled={sending}>{sending ? "Sending" : "Send reply"}</button>
              </form>
            )}
          </section>
          <section ref={thanksRef} className={`sa-page sa-thanks${ink ? " is-ink" : ""}`} aria-label="Thank you">
            <p className="sa-line">
              <span className="sa-script">With love</span>
              <i className="sa-nib" aria-hidden="true" />
            </p>
            <h2 className="sa-line">
              <span className="sa-script is-mid">Thank you</span>
              <i className="sa-nib is-mid" aria-hidden="true" />
            </h2>
            <p className="sa-line sa-signed">
              <span className="sa-script is-last">{fields.names || "Ana & Luka"}</span>
              <i className="sa-nib is-last" aria-hidden="true" />
            </p>
            {place ? <p className="sa-thanks-place">{place}</p> : null}
            <div className="sa-close">
              <button className="sa-replay" type="button" onClick={() => setPhase("closed")}>↻ Replay</button>
              <div className="sa-credit">
                <a href={madeWithHref("sage")}>Made with InvitesReady</a>
                <InstagramLink />
              </div>
            </div>
          </section>
        </div>
      ) : null}
      </div>
    </div>
  );
}
