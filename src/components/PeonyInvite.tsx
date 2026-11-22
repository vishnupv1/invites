import { useEffect, useRef, useState } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { InstagramLink } from "./InstagramLink";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./peony.css";

type Phase = "closed" | "opening" | "open" | "print";
type Reply = { name: string; note: string; attending: boolean };

function prettyDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function stamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function typedParts(lines: string[], count: number) {
  let left = count;
  return lines.map((line) => {
    if (left <= 0) return "";
    const take = Math.min(line.length, left);
    left -= take + 1;
    return line.slice(0, take);
  });
}

function useTyped(lines: string[], on: boolean) {
  const full = lines.join("\n");
  const [count, setCount] = useState(on ? full.length : 0);
  useEffect(() => {
    if (!on) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(full.length);
      return;
    }
    setCount(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= full.length) window.clearInterval(id);
    }, 62);
    return () => window.clearInterval(id);
  }, [on, full]);
  return typedParts(lines, count);
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
      context.fillStyle = "#f0c4cc";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#7a3144";
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
    <div className={`pn-frame${done ? " is-clear" : ""}`}>
      <div className="pn-frame-well">
        {image ? <img src={image} alt="" /> : <span>Your photograph</span>}
        {done ? null : <canvas ref={canvasRef} aria-label="Scratch to reveal" />}
      </div>
      <img className="pn-frame-art" src="/peony/frame.webp" alt="" />
    </div>
  );
}

export function PeonyInvite({ fields, quiet = false, onReply }: { fields: InviteFields; quiet?: boolean; onReply?: (reply: Reply) => void | Promise<void> }) {
  useFonts("Great Vibes", "Cormorant Garamond", "Jost");
  const [phase, setPhase] = useState<Phase>(quiet ? "print" : "closed");
  const shots = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : ""));
  const reveal = shots[1] || "";
  const gallery = shots.slice(2).filter(Boolean);
  const place = [fields.venue, fields.address].filter(Boolean).join(" · ");
  const date = stamp(fields.date || "");
  const rawNames = fields.names || "Clara & Julien";
  const [firstName, ...restName] = rawNames.split(/\s*&\s*/);
  const secondName = restName.join(" & ");
  const when = prettyDate(fields.date || "");
  const lines = [firstName, secondName, when, fields.venue || "", fields.address || ""].filter(Boolean);
  const left = useLeft(fields.date || "", fields.time || "");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guest, setGuest] = useState("");
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const thanksRef = useRef<HTMLElement>(null);
  const [ink, setInk] = useState(false);

  useEffect(() => {
    if (!photo) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPhoto(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo]);

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
  const typed = useTyped(lines, revealed && !quiet);
  const shown = quiet ? lines : typed;
  const caret = quiet ? -1 : shown.findIndex((part, index) => part.length < lines[index].length);

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
    <div className={`pn${lifting ? " is-opening" : ""}${revealed ? " is-open" : ""}${phase === "print" ? " is-print" : ""}${quiet ? " is-quiet" : ""}`}>
      <div className="pn-paper" />
      <div className="pn-scroll">
      <div className="pn-stage">
        <div className="pn-spray pn-spray-top">
          <img src="/peony/spray-top.webp" alt="" />
        </div>
        <div className="pn-spray pn-spray-bottom">
          <img src="/peony/spray-bottom.webp" alt="" />
        </div>
        <section className="pn-invite" aria-label="Wedding announcement">
          <div className="pn-identity">
            <div className="pn-eyebrow">{fields.title || "We joyfully invite you to our wedding"}</div>
            <div className="pn-type" aria-live="polite">
              <h1 className="pn-names">{shown[lines.indexOf(firstName)] || ""}{caret === lines.indexOf(firstName) ? <i className="pn-caret" /> : null}</h1>
              {secondName ? <p className="pn-amp">{caret > lines.indexOf(firstName) || caret === -1 ? "&" : "\u00a0"}</p> : null}
              {secondName ? <p className="pn-names">{shown[lines.indexOf(secondName)] || ""}{caret === lines.indexOf(secondName) ? <i className="pn-caret" /> : null}</p> : null}
              <div className={`pn-rule${caret === -1 || caret > lines.indexOf(secondName || firstName) ? " is-on" : ""}`} aria-hidden="true"><i /><b /><i /></div>
              {when ? <p className="pn-type-date">{shown[lines.indexOf(when)] || ""}{caret === lines.indexOf(when) ? <i className="pn-caret" /> : null}</p> : null}
              {fields.venue ? <p className="pn-type-place">{shown[lines.indexOf(fields.venue)] || ""}{caret === lines.indexOf(fields.venue) ? <i className="pn-caret" /> : null}</p> : null}
              {fields.address ? <p className="pn-type-place">{shown[lines.indexOf(fields.address)] || ""}{caret === lines.indexOf(fields.address) ? <i className="pn-caret" /> : null}</p> : null}
            </div>
          </div>
          {quiet ? (
            <>
              <button className="pn-replay" type="button" onClick={() => setPhase("closed")}>↻ Replay</button>
              <div className="pn-credit">
                <a href={madeWithHref("peony")}>Made with InvitesReady</a>
                <InstagramLink />
              </div>
            </>
          ) : null}
        </section>
        {phase === "closed" || phase === "opening" ? (
          <div className="pn-env">
            <div className="pn-sheet">
              <img className="fit pn-front" src="/peony/envelope.webp" alt="" />
              <div className="pn-flap">
                <img src="/peony/flap.webp" alt="" />
                <span className="pn-flap-back" />
              </div>
              <div className="pn-bow" aria-hidden="true">
                <img className="pn-seal-l" src="/peony/seal.webp" alt="" />
                <img className="pn-seal-r" src="/peony/seal.webp" alt="" />
                <i className="pn-drop pn-drop-a" />
                <i className="pn-drop pn-drop-b" />
                <i className="pn-drop pn-drop-c" />
              </div>
              <div className="pn-env-copy">
                <span>A letter for you, with love</span>
                <strong>{fields.names || "Clara & Julien"}</strong>
              </div>
              {phase === "closed" ? <span className="pn-tap">TAP TO OPEN</span> : null}
            </div>
            {phase === "closed" ? (
              <button type="button" className="pn-hit" aria-label="Open invitation" onClick={openInvite} />
            ) : null}
          </div>
        ) : null}
      </div>
      {revealed && !quiet ? (
        <div className="pn-pages">
          <section className="pn-page" aria-label="Gallery">
            <p className="pn-kicker">The photographs</p>
            <img className="pn-divider" src="/peony/divider.webp" alt="" />
            <h2>Moments</h2>
            <div className={`pn-gallery${gallery.length < 2 ? " is-single" : ""}`}>
              {(gallery.length ? gallery : [""]).map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  className="pn-shot"
                  disabled={!src}
                  onClick={() => src && setPhoto(src)}
                >
                  {src ? <img src={src} alt="" /> : <span>Your photograph</span>}
                </button>
              ))}
            </div>
          </section>
          <section className="pn-page" aria-label="Countdown">
            <p className="pn-kicker">{date || "The day"}</p>
            <h2>Counting the days</h2>
            <div className="pn-count">
              {(["Days", "Hours", "Minutes", "Seconds"] as const).map((label, index) => (
                <div key={label}>
                  <b>{String(left[index]).padStart(2, "0")}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            {place ? <p className="pn-when">{place}</p> : null}
          </section>
          <section className="pn-page" aria-label="Scratch to reveal">
            <p className="pn-kicker">A note for you</p>
            <h2>Scratch the card</h2>
            <ScratchCard image={reveal} />
          </section>
          <section className="pn-page" aria-label="Reply">
            <p className="pn-kicker">Reply</p>
            <h2>Will you be there?</h2>
            {sent ? (
              <p className="pn-sent">Thank you. Your reply is with {fields.names || "Clara & Julien"}.</p>
            ) : (
              <form className="pn-rsvp" onSubmit={(event) => { event.preventDefault(); void sendReply(); }}>
                <label>
                  Your name
                  <input value={guest} placeholder="Name" onChange={(event) => { setGuest(event.target.value); setNameError(false); }} />
                </label>
                {nameError ? <small>Please add your name.</small> : null}
                <div className="pn-choice">
                  <button type="button" className={attend === "yes" ? "is-on" : ""} onClick={() => setAttend("yes")}>Joyfully yes</button>
                  <button type="button" className={attend === "no" ? "is-on" : ""} onClick={() => setAttend("no")}>With regret</button>
                </div>
                <label>
                  A note
                  <textarea value={note} rows={2} placeholder="A few words" onChange={(event) => setNote(event.target.value)} />
                </label>
                <button className="pn-send" type="submit" disabled={sending}>{sending ? "Sending" : "Send reply"}</button>
              </form>
            )}
          </section>
          <section ref={thanksRef} className={`pn-page pn-thanks${ink ? " is-ink" : ""}`} aria-label="Thank you">
            <div className="pn-letter">
              <img className="pn-plaque" src="/peony/plaque.webp" alt="" />
              <div className="pn-letter-copy">
                <p className="pn-line">
                  <span className="pn-script">With love</span>
                  <i className="pn-nib" aria-hidden="true" />
                </p>
                <h2 className="pn-line">
                  <span className="pn-script is-mid">Thank you</span>
                  <i className="pn-nib is-mid" aria-hidden="true" />
                </h2>
                <p className="pn-line pn-signed">
                  <span className="pn-script is-last">{fields.names || "Clara & Julien"}</span>
                  <i className="pn-nib is-last" aria-hidden="true" />
                </p>
              </div>
            </div>
            {place ? <p className="pn-thanks-place">{place}</p> : null}
            <div className="pn-close">
              <button className="pn-replay" type="button" onClick={() => setPhase("closed")}>↻ Replay</button>
              <div className="pn-credit">
                <a href={madeWithHref("peony")}>Made with InvitesReady</a>
                <InstagramLink />
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {photo ? (
        <div className="pn-lightbox" role="dialog" aria-modal="true" aria-label="Photograph" onClick={() => setPhoto(null)}>
          <img src={photo} alt="" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
      </div>
    </div>
  );
}
