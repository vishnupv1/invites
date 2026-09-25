import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { formatLongDate, formatTime } from "../lib/dates";
import "./gazal.css";

export type GazalWish = { name: string; note: string };

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0] ?? names, second: parts[1] ?? "" };
}

function initials(names: string) {
  const { first, second } = coupleOf(names);
  const a = first.trim()[0] ?? "";
  const b = second.trim()[0] ?? "";
  return (a + (b ? `&${b}` : "")).toUpperCase();
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
    days: String(Math.floor(diff / 86400000)),
    hours: pad(Math.floor(diff / 3600000) % 24),
    minutes: pad(Math.floor(diff / 60000) % 60),
    seconds: pad(Math.floor(diff / 1000) % 60),
  };
}

function mapsHref(venue: string, address: string, lat: string, lng: string) {
  if (lat && lng) return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} ${address}`.trim())}`;
}

function Reveal({ className, id, children }: { className: string; id?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setShown(true);
    }, { threshold: 0.18 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={ref} id={id} className={`${className}${shown ? " in" : ""}`}>
      {children}
    </section>
  );
}

export function GazalInvite({
  fields,
  quiet = false,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: GazalWish[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
}) {
  const { first, second } = coupleOf(fields.names);
  const count = useCountdown(fields.date, fields.time);
  const [open, setOpen] = useState(false);
  const [lifting, setLifting] = useState(false);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [localWishes, setLocalWishes] = useState<GazalWish[]>([]);
  const photos = (fields.photos ?? []).map(assetUrl);
  const shown = [...localWishes, ...wishes.filter((wish) => wish.note.trim())];

  function begin() {
    if (quiet || lifting) return;
    setLifting(true);
    window.setTimeout(() => setOpen(true), 680);
  }

  const envelope = (
    <>
      <div className="gazal-flap" />
      <div className="gazal-seal">{initials(fields.names)}</div>
      <div className="gazal-envelope-copy">
        <span>Assalamu alaikum</span>
        <strong>You are invited to the Nikah of</strong>
        <em>
          {first}
          {second ? " & " : ""}
          {second}
        </em>
      </div>
    </>
  );

  if (!open) {
    return (
      <div className={`gazal-open${lifting ? " is-lifting" : ""}`}>
        <span className="gazal-bismillah">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>
        {quiet ? (
          <div className="gazal-envelope">{envelope}</div>
        ) : (
          <button type="button" className="gazal-envelope" onClick={begin} aria-label="Open invitation">
            {envelope}
          </button>
        )}
        {quiet ? null : (
          <button type="button" className="gazal-open-btn" onClick={begin}>
            Open invitation
          </button>
        )}
      </div>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(true);
      return;
    }
    await onReply?.({ name: name.trim(), note: note.trim(), attending });
    if (note.trim()) setLocalWishes((current) => [{ name: name.trim(), note: note.trim() }, ...current]);
    setDone(true);
  }

  return (
    <article className="gazal">
      <section className="gazal-hero">
        <span className="gazal-bismillah">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>
        <span className="gazal-translation">In the name of Allah, the Most Gracious, the Most Merciful</span>
        <div className="gazal-arch">
          <span className="gazal-kicker">With the blessings of Allah</span>
          <p>{fields.title}</p>
          <div>
            <strong>{first}</strong>
          </div>
          {second ? <em className="gazal-with">with</em> : null}
          {second ? (
            <div>
              <strong>{second}</strong>
            </div>
          ) : null}
          <span className="gazal-rule" />
          <b>{formatLongDate(fields.date)}</b>
          {fields.hosts ? <small>{fields.hosts}</small> : null}
        </div>
        <a className="gazal-rsvp-jump" href="#gazal-rsvp">
          RSVP now
        </a>
      </section>

      <Reveal className="gazal-count">
        <span>Counting down to the Nikah</span>
        <div>
          {[
            [count.days, "Days"],
            [count.hours, "Hours"],
            [count.minutes, "Mins"],
            [count.seconds, "Secs"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="gazal-events">
        <h2>Wedding events</h2>
        <EventCard
          kicker="The ceremony"
          name="Nikah"
          when={`${formatLongDate(fields.date)} · ${formatTime(fields.time)}`}
          venue={fields.venue}
          address={fields.address}
          lat={fields.lat}
          lng={fields.lng}
        />
        {fields.receptionVenue ? (
          <EventCard
            kicker="The celebration"
            name="Walima reception"
            when={formatTime(fields.receptionTime)}
            venue={fields.receptionVenue}
            address={fields.receptionAddress}
            lat=""
            lng=""
          />
        ) : null}
      </Reveal>

      {fields.message ? (
        <Reveal className="gazal-note">
          <span>إن شاء الله</span>
          <h2>A note from our families</h2>
          <p>{fields.message}</p>
          {fields.hosts ? <em>— {fields.hosts}</em> : null}
        </Reveal>
      ) : null}

      {photos.length ? (
        <Reveal className="gazal-photos">
          <h2>Moments</h2>
          <div>
            {photos.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
        </Reveal>
      ) : null}

      {fields.dress ? (
        <Reveal className="gazal-know">
          <h2>Good to know</h2>
          <div>
            <strong>Dress code</strong>
            <p>{fields.dress}</p>
          </div>
        </Reveal>
      ) : null}

      {fields.audio ? <audio className="gazal-audio" controls src={assetUrl(fields.audio)} /> : null}

      <Reveal id="gazal-rsvp" className="gazal-rsvp">
        <h2>Will you join us?</h2>
        {fields.rsvpBy ? <p>Kindly reply by {formatLongDate(fields.rsvpBy)}</p> : null}
        {done ? (
          <div className="gazal-done">
            <h3>{attending ? "Jazakallah khair" : "Thank you for letting us know"}</h3>
            <button type="button" onClick={() => setDone(false)}>
              Change my reply
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              Your name
              <input value={name} onChange={(event) => { setName(event.target.value); setError(false); }} placeholder="Full name" />
            </label>
            {error ? <span className="gazal-error">Please enter your name.</span> : null}
            <div className="gazal-choice">
              <button type="button" className={attending ? "on" : ""} onClick={() => setAttending(true)}>
                Yes, In shā' Allāh
              </button>
              <button type="button" className={!attending ? "on" : ""} onClick={() => setAttending(false)}>
                Sorry, can't
              </button>
            </div>
            <label>
              Duas & wishes <span>(optional)</span>
              <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Write a message for the couple" />
            </label>
            <button type="submit">Send my reply</button>
          </form>
        )}
      </Reveal>

      <Reveal className="gazal-wishes">
        <h2>Duas & wishes</h2>
        {shown.length === 0 ? <p>Messages appear here after guests reply.</p> : null}
        {shown.map((wish) => (
          <blockquote key={`${wish.name}-${wish.note}`}>
            <p>{wish.note}</p>
            <cite>— {wish.name}</cite>
          </blockquote>
        ))}
      </Reveal>

      <footer>
        <strong>
          {first} {second ? <em>&amp;</em> : null} {second}
        </strong>
        <span>{formatLongDate(fields.date)}</span>
        <Link to="/">Made with InvitesReady</Link>
      </footer>
    </article>
  );
}

function EventCard({
  kicker,
  name,
  when,
  venue,
  address,
  lat,
  lng,
}: {
  kicker: string;
  name: string;
  when: string;
  venue: string;
  address: string;
  lat: string;
  lng: string;
}) {
  return (
    <div className="gazal-event">
      <div className="gazal-event-head">
        <span>{kicker}</span>
        <strong>{name}</strong>
      </div>
      <div>
        <p>{when}</p>
        <p>
          <b>{venue}</b>
          {address ? <small>{address}</small> : null}
        </p>
        <a href={mapsHref(venue, address, lat, lng)} target="_blank" rel="noreferrer">
          Get directions
        </a>
      </div>
    </div>
  );
}
