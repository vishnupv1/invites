import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { formatLongDate, formatTime } from "../lib/dates";
import "./aurelia.css";

export type AureliaWish = { name: string; note: string };

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0] ?? names, second: parts[1] ?? "" };
}

function initials(names: string) {
  const { first, second } = coupleOf(names);
  return `${(first.trim()[0] ?? "").toUpperCase()}&${(second.trim()[0] ?? "").toUpperCase()}`;
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = date ? new Date(`${date}T${time || "00:00"}:00`).getTime() : now;
  const diff = Math.max(0, target - now);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    days: String(Math.floor(diff / 86400000)).padStart(2, "0"),
    hours: pad(Math.floor(diff / 3600000) % 24),
    minutes: pad(Math.floor(diff / 60000) % 60),
    seconds: pad(Math.floor(diff / 1000) % 60),
  };
}

function mapsHref(venue: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} ${address}`.trim())}`;
}

export function AureliaInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: AureliaWish[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
}) {
  const { first, second } = coupleOf(fields.names);
  const count = useCountdown(fields.date, fields.time);
  const photos = (fields.photos ?? []).map(assetUrl);
  const [entered, setEntered] = useState(quiet);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localWishes, setLocalWishes] = useState<AureliaWish[]>([]);
  const shown = [...localWishes, ...wishes.filter((wish) => wish.note.trim())];
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  useEffect(() => {
    if (quiet || entered) return;
    const id = window.setTimeout(() => setEntered(true), 2600);
    return () => window.clearTimeout(id);
  }, [quiet, entered]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !note.trim()) {
      setError(true);
      return;
    }
    await onReply?.({ name: name.trim(), note: note.trim(), attending: true });
    setLocalWishes((current) => [{ name: name.trim(), note: note.trim() }, ...current]);
    setDone(true);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!entered) {
    return (
      <button type="button" className="au-splash" onClick={() => setEntered(true)}>
        <em>
          {first}
          {second ? " & " : ""}
          {second}
        </em>
        <span>A celebration of love</span>
        <i />
        <small>● ● ●</small>
      </button>
    );
  }

  return (
    <article className="au">
      <header className="au-hero" style={photos[0] ? { backgroundImage: `linear-gradient(rgba(8,12,28,0.55), rgba(8,12,28,0.72)), url(${photos[0]})` } : undefined}>
        <div className="au-mark">{initials(fields.names)}</div>
        <span>Wedding invitation</span>
        <h1>
          {first}
          {second ? <small>&</small> : null}
          {second}
        </h1>
        <p>{formatLongDate(fields.date)}</p>
        {fields.venue ? <b>{fields.venue}</b> : null}
        <div className="au-chips">
          <span>{formatLongDate(fields.date)}</span>
          {fields.time ? <span>{formatTime(fields.time)}</span> : null}
          {fields.venue ? <span>{fields.venue}</span> : null}
        </div>
        <a href="#au-events">View details</a>
      </header>

      <section className="au-count">
        <span>Counting down to the day</span>
        <div>
          {[
            [count.days, "Days"],
            [count.hours, "Hours"],
            [count.minutes, "Minutes"],
            [count.seconds, "Seconds"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="au-couple">
        <span>Together</span>
        <h2>The couple</h2>
        <div>
          <p>
            <strong>{first}</strong>
            {fields.hosts ? <small>{fields.hosts}</small> : null}
          </p>
          {second ? <em>&</em> : null}
          {second ? (
            <p>
              <strong>{second}</strong>
            </p>
          ) : null}
        </div>
        {fields.message ? <blockquote>{fields.message}</blockquote> : null}
      </section>

      <section id="au-events" className="au-events">
        <span>Mark your calendar</span>
        <h2>Event details</h2>
        <article>
          <small>Ceremony</small>
          <strong>{fields.title || "Wedding ceremony"}</strong>
          <p>{formatLongDate(fields.date)}{fields.time ? ` · ${formatTime(fields.time)}` : ""}</p>
          <p>{fields.venue}</p>
          {fields.address ? <p>{fields.address}</p> : null}
          {fields.venue ? <a href={mapsHref(fields.venue, fields.address)} target="_blank" rel="noreferrer">Get directions</a> : null}
        </article>
        {fields.receptionVenue ? (
          <article>
            <small>Reception</small>
            <strong>Reception</strong>
            <p>{fields.receptionTime ? formatTime(fields.receptionTime) : formatLongDate(fields.date)}</p>
            <p>{fields.receptionVenue}</p>
            {fields.receptionAddress ? <p>{fields.receptionAddress}</p> : null}
            <a href={mapsHref(fields.receptionVenue, fields.receptionAddress)} target="_blank" rel="noreferrer">Get directions</a>
          </article>
        ) : null}
      </section>

      {photos.length > 1 ? (
        <section className="au-gallery">
          <h2>Moments</h2>
          <div>
            {photos.slice(1).map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
        </section>
      ) : null}

      {fields.audio ? <audio className="au-audio" controls src={assetUrl(fields.audio)} /> : null}

      <section className="au-share">
        <h2>Share the invitation</h2>
        <div>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${fields.names} ${shareUrl}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <button type="button" onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</button>
        </div>
      </section>

      <section className="au-wishes">
        <h2>Send your wishes</h2>
        {done ? <p className="au-done">Thank you. Your wish is with {first}{second ? ` & ${second}` : ""}.</p> : (
          <form onSubmit={submit}>
            <label>
              Your message
              <textarea rows={3} value={note} onChange={(event) => { setNote(event.target.value); setError(false); }} placeholder="A wish for the couple" />
            </label>
            <label>
              Your name
              <input value={name} onChange={(event) => { setName(event.target.value); setError(false); }} placeholder="Full name" />
            </label>
            {error ? <span>Please add your name and a message.</span> : null}
            <button type="submit">Send wishes</button>
          </form>
        )}
        {shown.map((wish) => (
          <blockquote key={`${wish.name}-${wish.note}`}>
            <p>{wish.note}</p>
            <cite>— {wish.name}</cite>
          </blockquote>
        ))}
      </section>

      <footer>
        <strong>{first}{second ? " & " : ""}{second}</strong>
        <span>{formatLongDate(fields.date)}</span>
        <Link to="/">Made with InvitesReady</Link>
      </footer>
    </article>
  );
}
