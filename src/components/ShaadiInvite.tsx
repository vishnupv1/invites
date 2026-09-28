import { useEffect, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { SHAADI_SHOTS, SHAADI_STORY_COUNT, SHAADI_VOWS, festivitiesOf, shaadiDays, type ShaadiTheme } from "./shaadi";
import "./shaadi.css";

export type { ShaadiTheme };

type Wish = { name: string; note: string };

function peopleOf(names: string) {
  return names.split(/\s+&\s+/).filter(Boolean).map((part) => {
    const full = part.trim();
    return { given: full.split(/\s+/)[0] ?? full, full };
  });
}

function monogram(names: string) {
  const people = peopleOf(names);
  const letters = people.map((person) => person.given[0] ?? "").filter(Boolean);
  return letters.join(" & ").toUpperCase() || "A & I";
}

function familiesOf(hosts: string) {
  return hosts.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
}

function parentsOf(detail: string) {
  return detail.split(" · ").map((part) => part.trim()).filter(Boolean);
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
  const query = [venue, address].filter(Boolean).join(", ");
  return query ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}` : "";
}

function Frame({ src, label }: { src: string; label: string }) {
  return (
    <figure className="sh-frame">
      {src ? <img src={src} alt="" /> : <span className="sh-frame-empty">{label}</span>}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export function ShaadiInvite({
  fields,
  theme = "rani",
  motion = true,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  theme?: ShaadiTheme;
  motion?: boolean;
  wishes?: Wish[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
}) {
  const people = peopleOf(fields.names);
  const families = familiesOf(fields.hosts);
  const parents = parentsOf(fields.detail);
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : ""));
  const story = SHAADI_SHOTS.slice(0, SHAADI_STORY_COUNT).map((label, index) => ({ src: photos[index] ?? "", label }));
  const festivities = festivitiesOf(fields.lines);
  const days = shaadiDays(festivities);
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(0);
  const [vow, setVow] = useState(0);
  const [attending, setAttending] = useState(true);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [count, setCount] = useState(1);
  const [picked, setPicked] = useState<string[]>(() => festivities.map((item) => item.name));
  const [sent, setSent] = useState(false);
  const [playing, setPlaying] = useState(false);
  const clock = useCountdown(fields.date, fields.time);
  const place = [fields.venue, fields.address].filter(Boolean).join(" · ");
  const directions = mapsHref(fields.venue, fields.address, fields.lat, fields.lng);
  const calendar = calendarUrl(fields);
  const activeDay = days[Math.min(day, Math.max(days.length - 1, 0))];
  const storyLoop = [...story, ...story];

  useEffect(() => {
    if (!motion) return;
    const id = window.setInterval(() => setVow((current) => (current + 1) % SHAADI_VOWS.length), 4200);
    return () => window.clearInterval(id);
  }, [motion]);

  async function reply(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const extra = [
      note.trim(),
      count > 1 ? `${count} guests` : "",
      attending && picked.length ? picked.join(", ") : "",
    ].filter(Boolean).join(" · ");
    await onReply?.({ name: name.trim(), note: extra, attending });
    setSent(true);
  }

  function togglePick(label: string) {
    setPicked((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  }

  return (
    <article className={`sh${motion ? "" : " sh-still"}`} data-theme={theme}>
      {open ? null : (
        <section className="sh-veil">
          <p className="sh-kicker">॥ श्री गणेशाय नमः ॥</p>
          <p className="sh-mono">{monogram(fields.names)}</p>
          <h1>You are cordially invited</h1>
          <p className="sh-script">to the wedding of</p>
          <p className="sh-names">
            {people.map((person, index) => (
              <span key={person.full}>
                {index ? <i>weds</i> : null}
                <b>{person.given}</b>
              </span>
            ))}
          </p>
          {fields.title ? <p className="sh-hindi">{fields.title}</p> : null}
          <p className="sh-when">{formatLongDate(fields.date)}{place ? ` · ${place}` : ""}</p>
          <button type="button" className="sh-enter" onClick={() => setOpen(true)}>
            Tap to lift the veil
          </button>
        </section>
      )}

      <section className="sh-hero">
        <p className="sh-kicker">॥ श्री गणेशाय नमः ॥</p>
        <p className="sh-script">Together with their families</p>
        <h2>
          {people.map((person, index) => (
            <span key={person.full}>
              {index ? <i>weds</i> : null}
              <b>{person.given}</b>
            </span>
          ))}
        </h2>
        {fields.title ? <p className="sh-hindi">{fields.title}</p> : null}
        <p className="sh-when">{formatLongDate(fields.date)}{fields.time ? ` · ${formatTime(fields.time)}` : ""}</p>
        {place ? <p className="sh-place">{place}</p> : null}
      </section>

      <section className="sh-blessing">
        {families.length ? (
          <p className="sh-families">
            {families.map((family) => (
              <span key={family}>{family}</span>
            ))}
          </p>
        ) : null}
        {fields.message ? <p className="sh-message">{fields.message}</p> : null}
        <div className="sh-couple">
          {people.map((person, index) => (
            <div key={person.full}>
              <b>{person.full}</b>
              {parents[index] ? <span>{parents[index]}</span> : null}
            </div>
          ))}
        </div>
      </section>

      {fields.date ? (
        <section className="sh-count">
          <p className="sh-kicker">Counting down to the pheras</p>
          <ol>
            <li><b>{clock.days}</b><span>Days</span></li>
            <li><b>{clock.hours}</b><span>Hours</span></li>
            <li><b>{clock.minutes}</b><span>Minutes</span></li>
            <li><b>{clock.seconds}</b><span>Seconds</span></li>
          </ol>
        </section>
      ) : null}

      <section className="sh-fete">
        <p className="sh-kicker">The festivities</p>
        <div className="sh-days" role="tablist">
          {days.map((item, index) => (
            <button key={item.label} type="button" role="tab" aria-selected={index === day} onClick={() => setDay(index)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="sh-cards">
          {activeDay?.items.map(({ item, index }) => {
            const photo = photos[SHAADI_STORY_COUNT + index] ?? "";
            return (
              <article key={`${item.name}-${index}`}>
                <Frame src={photo} label={item.name} />
                <div>
                  {item.hindi ? <p className="sh-hindi">{item.hindi}</p> : null}
                  <h3>{item.name}</h3>
                  {item.when ? <p>{item.when}</p> : null}
                  {item.venue ? <p>{item.venue}</p> : null}
                  {item.dress ? <span className="sh-pill">{item.dress}</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sh-vows">
        <p className="sh-kicker">Saat phere</p>
        <div className="sh-vow">
          <span>{String(vow + 1).padStart(2, "0")} / 07</span>
          <h3>{SHAADI_VOWS[vow]?.title}</h3>
          <p>{SHAADI_VOWS[vow]?.text}</p>
        </div>
        <div className="sh-dots">
          {SHAADI_VOWS.map((item, index) => (
            <button key={item.title} type="button" aria-label={item.title} aria-pressed={index === vow} onClick={() => setVow(index)} />
          ))}
        </div>
      </section>

      <section className="sh-gallery">
        <p className="sh-kicker">Our story in frames</p>
        <div className="sh-marquee">
          <div>
            {storyLoop.map((frame, index) => (
              <Frame key={`${frame.label}-${index}`} src={frame.src} label={frame.label} />
            ))}
          </div>
        </div>
      </section>

      <section className="sh-venue">
        <Frame src={photos[SHAADI_SHOTS.length - 1] ?? ""} label={fields.venue || "The palace"} />
        <div>
          <p className="sh-kicker">The venue</p>
          <h3>{fields.venue}</h3>
          {fields.address ? <p>{fields.address}</p> : null}
          <div className="sh-links">
            {directions ? <a href={directions} target="_blank" rel="noreferrer">Get directions</a> : null}
            {calendar ? <a href={calendar} target="_blank" rel="noreferrer">Add to calendar</a> : null}
          </div>
        </div>
      </section>

      <section className="sh-rsvp">
        <p className="sh-kicker">Will you grace us?</p>
        {fields.rsvpBy ? <p className="sh-when">Reply by {formatLongDate(fields.rsvpBy)}</p> : null}
        {sent ? (
          <h3>{attending ? "Dhanyavaad" : "You'll be missed"}</h3>
        ) : (
          <form onSubmit={reply}>
            <input value={name} placeholder="Your name" onChange={(event) => setName(event.target.value)} required />
            <div className="sh-choice">
              <button type="button" aria-pressed={attending} onClick={() => setAttending(true)}>Joyfully accept</button>
              <button type="button" aria-pressed={!attending} onClick={() => setAttending(false)}>Regretfully decline</button>
            </div>
            {attending ? (
              <>
                <div className="sh-picks">
                  {festivities.map((item) => (
                    <button key={item.name} type="button" aria-pressed={picked.includes(item.name)} onClick={() => togglePick(item.name)}>
                      {item.name}
                    </button>
                  ))}
                </div>
                <label>
                  Guests
                  <input type="number" min={1} max={10} value={count} onChange={(event) => setCount(Number(event.target.value) || 1)} />
                </label>
              </>
            ) : null}
            <textarea value={note} rows={3} placeholder="A blessing" onChange={(event) => setNote(event.target.value)} />
            <button type="submit" className="sh-enter">Send reply</button>
          </form>
        )}
      </section>

      {wishes.length ? (
        <section className="sh-wishes">
          <div>
            {[...wishes, ...wishes].map((wish, index) => (
              <p key={`${wish.name}-${index}`}><b>{wish.name}</b> {wish.note}</p>
            ))}
          </div>
        </section>
      ) : null}

      {fields.audio ? (
        <>
          <button type="button" className="sh-music" aria-pressed={playing} onClick={() => setPlaying((value) => !value)}>
            {playing ? "Pause" : "Play"} shehnai & sitar
          </button>
          {playing ? <audio src={assetUrl(fields.audio)} autoPlay loop /> : null}
        </>
      ) : null}
    </article>
  );
}
