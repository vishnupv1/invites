import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { InviteFields, Template } from "../types";
import { formatLongDate, formatTime } from "../lib/dates";
import { assetUrl } from "../api";
import "./invite-site.css";
import { AureliaInvite } from "./AureliaInvite";
import { GazalInvite, type GazalWish } from "./GazalInvite";

type Reply = { name: string; note: string; attending: boolean };

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = date ? new Date(`${date}T${time || "00:00"}:00`).getTime() : now;
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

function photosOf(fields: InviteFields) {
  return (fields.photos ?? []).map(assetUrl);
}

function MapBlock({ fields }: { fields: InviteFields }) {
  if (!fields.lat || !fields.lng) return null;
  const src = `https://www.openstreetmap.org/export/embed.html?marker=${fields.lat}%2C${fields.lng}&layer=mapnik`;
  return (
    <iframe className="map-frame" title="Location" src={src} loading="lazy" />
  );
}

function AudioBlock({ src }: { src: string }) {
  src = assetUrl(src);
  if (!src) return null;
  if (src.startsWith("http")) {
    return (
      <p>
        <a href={src} target="_blank" rel="noreferrer">
          Play the song
        </a>
      </p>
    );
  }
  return <audio controls src={src} />;
}

function WishForm({ names, onReply }: { names: string; onReply?: (reply: Reply) => void }) {
  const [wishName, setWishName] = useState("");
  const [wish, setWish] = useState("");
  const [sent, setSent] = useState(false);
  function send(event: FormEvent) {
    event.preventDefault();
    if (!wishName.trim()) return;
    onReply?.({ name: wishName.trim(), note: wish.trim(), attending: true });
    setSent(true);
  }
  if (sent) return <p>Your wish is with {names}.</p>;
  return (
    <form className="wish-form" onSubmit={send}>
      <input value={wishName} placeholder="Your name" onChange={(event) => setWishName(event.target.value)} required />
      <textarea value={wish} rows={2} placeholder="A wish" onChange={(event) => setWish(event.target.value)} />
      <button type="submit">Send wish</button>
    </form>
  );
}

function Basic({ fields }: { fields: InviteFields }) {
  return (
    <article className="layout-basic">
      <p>{fields.hosts}</p>
      <h1>{fields.names}</h1>
      <p>{fields.title}</p>
      <p>
        {formatLongDate(fields.date)}
        {fields.time ? ` · ${formatTime(fields.time)}` : ""}
      </p>
      <p>
        {fields.venue}
        {fields.address ? ` · ${fields.address}` : ""}
      </p>
      <p>{fields.message}</p>
      {fields.dress ? <p>{fields.dress}</p> : null}
    </article>
  );
}

function Dark({ fields }: { fields: InviteFields }) {
  const count = useCountdown(fields.date, fields.time);
  return (
    <article className="layout-dark">
      <p className="eyebrow-lite">Evening</p>
      <h1>{fields.names}</h1>
      <p>{fields.title}</p>
      <p className="count-line">
        {count.days}d {count.hours}h {count.minutes}m {count.seconds}s
      </p>
      <p>
        {formatLongDate(fields.date)} · {formatTime(fields.time)}
      </p>
      <p>{fields.venue}</p>
      <MapBlock fields={fields} />
      <div className="film">
        {photosOf(fields).map((photo) => (
          <img key={photo.slice(-24)} src={photo} alt="" />
        ))}
      </div>
      <AudioBlock src={fields.audio} />
      <p>{fields.message}</p>
    </article>
  );
}

function Frame({ fields }: { fields: InviteFields }) {
  return (
    <article className="layout-frame">
      <div>
        <p>{fields.hosts}</p>
        <h1>{fields.names}</h1>
        <p>{fields.title}</p>
        <p>
          {formatLongDate(fields.date)} · {formatTime(fields.time)}
        </p>
        <p>{fields.venue}</p>
        <p>{fields.address}</p>
        <MapBlock fields={fields} />
        <div className="ornament-row">
          {photosOf(fields).map((photo) => (
            <img key={photo.slice(-24)} src={photo} alt="" />
          ))}
        </div>
        <AudioBlock src={fields.audio} />
        {fields.receptionVenue ? (
          <p>
            Reception {formatTime(fields.receptionTime)} · {fields.receptionVenue}
          </p>
        ) : null}
        <p>{fields.message}</p>
      </div>
    </article>
  );
}

function Poster({ fields }: { fields: InviteFields }) {
  return (
    <article className="layout-poster">
      <p className="age">{fields.detail || "•"}</p>
      <h1>{fields.names}</h1>
      <p>{fields.title}</p>
      <p>
        {formatLongDate(fields.date)} · {formatTime(fields.time)} · {fields.venue}
      </p>
      <div className="poster-photos">
        {photosOf(fields).map((photo) => (
          <img key={photo.slice(-24)} src={photo} alt="" />
        ))}
      </div>
      <MapBlock fields={fields} />
      <AudioBlock src={fields.audio} />
      <p>{fields.message}</p>
    </article>
  );
}

function Editorial({ fields, big }: { fields: InviteFields; big?: string }) {
  return (
    <article className="layout-editorial">
      <aside>
        <strong>{big || fields.detail}</strong>
        <span>{formatLongDate(fields.date)}</span>
      </aside>
      <div>
        <p>{fields.hosts}</p>
        <h1>{fields.names}</h1>
        <p>{fields.title}</p>
        <p>
          {formatTime(fields.time)} · {fields.venue}
        </p>
        <p>{fields.address}</p>
        <div className="editorial-photos">
          {photosOf(fields).map((photo) => (
            <img key={photo.slice(-24)} src={photo} alt="" />
          ))}
        </div>
        <MapBlock fields={fields} />
        <AudioBlock src={fields.audio} />
        <p>{fields.message}</p>
      </div>
    </article>
  );
}

function Program({ fields }: { fields: InviteFields }) {
  return (
    <article className="layout-program">
      <h1>{fields.names}</h1>
      <p>{fields.title}</p>
      <ol>
        <li>
          <span>{formatTime(fields.time)}</span>
          {fields.venue} — {fields.address}
        </li>
        {fields.receptionVenue ? (
          <li>
            <span>{formatTime(fields.receptionTime)}</span>
            {fields.receptionVenue}
          </li>
        ) : null}
      </ol>
      <div className="program-photos">
        {photosOf(fields).map((photo) => (
          <img key={photo.slice(-24)} src={photo} alt="" />
        ))}
      </div>
      <MapBlock fields={fields} />
      <AudioBlock src={fields.audio} />
      <p>{fields.message}</p>
    </article>
  );
}

function Story({ fields }: { fields: InviteFields }) {
  const [cover, ...rest] = photosOf(fields);
  return (
    <article className="layout-story">
      {cover ? <img className="cover" src={cover} alt="" /> : <div className="cover empty">Lantern hour</div>}
      <div className="story-copy">
        <h1>{fields.names}</h1>
        <p>{fields.title}</p>
        <p>
          {formatLongDate(fields.date)} · {formatTime(fields.time)}
        </p>
        <p>{fields.venue}</p>
        <div className="story-rest">
          {rest.map((photo) => (
            <img key={photo.slice(-24)} src={photo} alt="" />
          ))}
        </div>
        <MapBlock fields={fields} />
        <AudioBlock src={fields.audio} />
        <p>{fields.message}</p>
      </div>
    </article>
  );
}

function Letter({ fields }: { fields: InviteFields }) {
  return (
    <article className="layout-letter">
      <p>Dear friends,</p>
      <h1>{fields.names}</h1>
      <p>{fields.title}</p>
      <p>{fields.message}</p>
      <p>
        {formatLongDate(fields.date)} at {formatTime(fields.time)}
        <br />
        {fields.venue}
        <br />
        {fields.address}
      </p>
      <div className="letter-photos">
        {photosOf(fields).map((photo) => (
          <img key={photo.slice(-24)} src={photo} alt="" />
        ))}
      </div>
      <MapBlock fields={fields} />
    </article>
  );
}

function House({ fields }: { fields: InviteFields }) {
  return (
    <article className="layout-house">
      <div className="house-photos">
        {photosOf(fields).map((photo) => (
          <img key={photo.slice(-24)} src={photo} alt="" />
        ))}
      </div>
      <h1>{fields.names}</h1>
      <p>{fields.title}</p>
      <p>
        {formatLongDate(fields.date)} · {formatTime(fields.time)}
      </p>
      <p>{fields.address || fields.venue}</p>
      <MapBlock fields={fields} />
      <p>{fields.message}</p>
    </article>
  );
}

export function InviteSite({
  template,
  fields,
  onReply,
  wishes = [],
}: {
  template: Template;
  fields: InviteFields;
  onReply?: (reply: Reply) => void;
  wishes?: GazalWish[];
}) {
  if (template.style === "gazal") {
    return <GazalInvite fields={fields} wishes={wishes} onReply={onReply} />;
  }
  if (template.style === "aurelia") {
    return <AureliaInvite fields={fields} wishes={wishes} onReply={onReply} />;
  }
  let body: ReactNode;
  switch (template.style) {
    case "garden":
      body = <Basic fields={fields} />;
      break;
    case "midnight":
      body = <Dark fields={fields} />;
      break;
    case "marigold":
      body = <Frame fields={fields} />;
      break;
    case "confetti":
    case "spark":
      body = <Poster fields={fields} />;
      break;
    case "table":
      body = <Editorial fields={fields} />;
      break;
    case "years":
      body = <Editorial fields={fields} big={fields.detail} />;
      break;
    case "banquet":
      body = <Program fields={fields} />;
      break;
    case "lantern":
      body = <Story fields={fields} />;
      break;
    case "promise":
      body = <Letter fields={fields} />;
      break;
    case "hearth":
      body = <House fields={fields} />;
      break;
    default:
      body = <Basic fields={fields} />;
  }

  return (
    <div className={`invite-root root-${template.style}`}>
      {body}
      <section className="layout-wish">
        <h2>Greetings</h2>
        <WishForm names={fields.names} onReply={onReply} />
      </section>
      <footer className="site-foot">
        Made with <Link to="/">Vellum</Link>
      </footer>
    </div>
  );
}
