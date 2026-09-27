import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import "./anna.css";

type Theme = "terracotta" | "sage" | "dusk";

const THEMES: Record<Theme, { accent: string; text: string; leaf: string; soft: string }> = {
  terracotta: { accent: "#A44B32", text: "#9C4630", leaf: "#8A9A7B", soft: "#EFD9C8" },
  sage: { accent: "#56684C", text: "#4E5F45", leaf: "#C48A6A", soft: "#DCE3D3" },
  dusk: { accent: "#3F5670", text: "#3A506A", leaf: "#C9A27E", soft: "#D8E0E8" },
};

const STORY = [
  { year: "2016", title: "First day of college", text: "Assigned the same lab bench in first-year chemistry. One broken beaker, and a laugh that stayed." },
  { year: "2022", title: "A monsoon road trip", text: "Munnar in the rain, one flat tyre and a lot of chai. That was when they knew." },
  { year: "2026", title: "The question", text: "A proposal on the Kumarakom backwaters at sunset. The answer came before the question finished." },
];

const FAQS = [
  ["Can I bring a plus-one?", "Your invite shows how many seats are reserved. Please say if that changes."],
  ["Are children welcome?", "Yes. There is a children's corner at the reception."],
  ["Is there parking?", "Yes, at both venues, with people to guide you in."],
];

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0] ?? names, second: parts[1] ?? "" };
}

function dateParts(iso: string) {
  const date = iso ? new Date(`${iso}T12:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return { day: "", month: "", year: "", weekday: "", stamp: "" };
  const [year, month, day] = iso.split("-");
  return {
    day,
    month: date.toLocaleDateString("en-US", { month: "long" }),
    year,
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    stamp: `${day}.${month}`,
  };
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
  return [
    { v: String(Math.floor(diff / 86400000)), l: "Days" },
    { v: pad(Math.floor(diff / 3600000) % 24), l: "Hrs" },
    { v: pad(Math.floor(diff / 60000) % 60), l: "Min" },
  ];
}

function mapsHref(venue: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue} ${address}`.trim())}`;
}

function Leaf({ color }: { color: string }) {
  return (
    <svg className="anna-leaf" viewBox="0 0 200 240" fill="none" aria-hidden="true">
      <path d="M20 230C40 160 70 100 150 20" stroke={color} strokeWidth="1.6" />
      <path d="M60 150c-30-4-46-22-48-44 26 2 44 18 48 44zM90 100c-8-28 2-50 22-62 8 24 0 46-22 62zM110 70c26-12 50-6 64 12-24 12-48 8-64-12zM45 190c-28 8-50-2-60-22 24-6 46 4 60 22z" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

export function AnnaInvite({
  fields,
  quiet = false,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
}) {
  const { first, second } = coupleOf(fields.names);
  const when = dateParts(fields.date);
  const count = useCountdown(fields.date, fields.time);
  const photos = (fields.photos ?? []).map(assetUrl);
  const [theme, setTheme] = useState<Theme>("terracotta");
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const [venueTab, setVenueTab] = useState(0);
  const [faq, setFaq] = useState(-1);
  const [name, setName] = useState("");
  const [attending, setAttending] = useState(true);
  const [meal, setMeal] = useState("Veg");
  const [song, setSong] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const ink = THEMES[theme];
  const venues = [
    { label: "Ceremony", name: fields.venue, address: fields.address, time: `${formatLongDate(fields.date)} · ${formatTime(fields.time)}` },
    ...(fields.receptionVenue
      ? [{ label: "Reception", name: fields.receptionVenue, address: fields.receptionAddress, time: formatTime(fields.receptionTime) }]
      : []),
  ];
  const venue = venues[venueTab] ?? venues[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(true);
      return;
    }
    const note = attending ? [`Dinner: ${meal}`, song.trim() ? `Song: ${song.trim()}` : ""].filter(Boolean).join(". ") : "";
    await onReply?.({ name: name.trim(), note, attending });
    setDone(true);
  }

  if (!open) {
    return (
      <div className="anna-open" style={{ ["--leaf" as string]: ink.leaf, ["--accent" as string]: ink.accent }}>
        <Leaf color={ink.leaf} />
        {quiet ? (
          <div className="anna-card front">
            <Names first={first} second={second} />
          </div>
        ) : (
          <button type="button" className={`anna-card ${flipped ? "back" : "front"}`} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? "Show names" : "Reveal the date"}>
            {flipped ? (
              <>
                <span>Save the date</span>
                <strong>{when.day}</strong>
                <em>{when.month}</em>
                <b>{when.year}</b>
                <small>{fields.detail || fields.address}</small>
              </>
            ) : (
              <Names first={first} second={second} />
            )}
          </button>
        )}
        {quiet ? null : (
          <button type="button" className="anna-enter" onClick={() => setOpen(true)}>
            View invitation
          </button>
        )}
      </div>
    );
  }

  return (
    <article className="anna" style={{ ["--accent" as string]: ink.accent, ["--accent-text" as string]: ink.text, ["--leaf" as string]: ink.leaf, ["--soft" as string]: ink.soft }}>
      <header className="anna-bar">
        <span>{first[0]} <i>&</i> {second[0] ?? ""}</span>
        <div>
          <div className="anna-themes" role="group" aria-label="Colour">
            {(Object.keys(THEMES) as Theme[]).map((item) => (
              <button key={item} type="button" aria-pressed={theme === item} style={{ background: THEMES[item].accent }} onClick={() => setTheme(item)} />
            ))}
          </div>
          {fields.audio ? <audio className="anna-audio" controls src={assetUrl(fields.audio)} /> : null}
          <a href="#anna-rsvp">RSVP</a>
        </div>
      </header>

      <section className="anna-hero">
        <Leaf color={ink.leaf} />
        <span>{fields.hosts || "Together with their families"}</span>
        <h1>
          <em>{first}</em>
          {second ? <small>&</small> : null}
          {second ? <em>{second}</em> : null}
        </h1>
        <p>{fields.title}</p>
        <div className="anna-facts">
          <div><small>{when.weekday}</small><strong>{when.stamp}</strong></div>
          <div><small>Year</small><strong>{when.year}</strong></div>
          <div><small>From</small><strong>{formatTime(fields.time)}</strong></div>
        </div>
        {photos[0] ? <img src={photos[0]} alt="" /> : null}
      </section>

      <section className="anna-count">
        <span>Until we say “I do”</span>
        <div>
          {count.map((item) => (
            <div key={item.l}><strong>{item.v}</strong><small>{item.l}</small></div>
          ))}
        </div>
      </section>

      <section className="anna-block">
        <span>01 — Our story</span>
        <h2>{fields.message || "From classmates to forever."}</h2>
        {STORY.map((item) => (
          <div key={item.year} className="anna-story">
            <i />
            <div>
              <strong>{item.year}</strong>
              <b>{item.title}</b>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="anna-day">
        <span>02 — The day</span>
        <h2>Order of the day</h2>
        <div>
          <b>{formatTime(fields.time)}</b>
          <div><strong>Ceremony</strong><small>{fields.venue}</small></div>
        </div>
        {fields.receptionVenue ? (
          <div>
            <b>{formatTime(fields.receptionTime)}</b>
            <div><strong>Reception & dinner</strong><small>{fields.receptionVenue}</small></div>
          </div>
        ) : null}
      </section>

      {venue ? (
        <section className="anna-block">
          <span>03 — Where</span>
          <h2>The venues</h2>
          <div className="anna-tabs" role="tablist">
            {venues.map((item, index) => (
              <button key={item.label} type="button" role="tab" aria-selected={venueTab === index} className={venueTab === index ? "on" : ""} onClick={() => setVenueTab(index)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="anna-venue">
            <strong>{venue.name}</strong>
            {venue.address ? <p>{venue.address}</p> : null}
            <p>{venue.time}</p>
            <div>
              <a href={mapsHref(venue.name, venue.address)} target="_blank" rel="noreferrer">Directions</a>
              {calendarUrl(fields) ? <a href={calendarUrl(fields)} target="_blank" rel="noreferrer">Calendar</a> : null}
            </div>
          </div>
        </section>
      ) : null}

      {fields.dress ? (
        <section className="anna-wear">
          <span>04 — What to wear</span>
          <h2>Garden formal</h2>
          <p>{fields.dress}</p>
          <div>
            {[["#A44B32", "Rust"], ["#C48A6A", "Clay"], ["#8A9A7B", "Sage"], ["#D9B98C", "Sand"], ["#5B4A3F", "Cocoa"]].map(([color, label]) => (
              <span key={label}><i style={{ background: color }} />{label}</span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="anna-block">
        <span>05 — Travel & stay</span>
        <h2>Coming from afar?</h2>
        <div className="anna-note"><strong>Nearest airport</strong><p>Cochin International — about 1.5 hours by road to Kottayam.</p></div>
        <div className="anna-note"><strong>Where to stay</strong><p>Rooms are held at hotels near the church. Mention {fields.names} when booking.</p></div>
      </section>

      <section className="anna-faq">
        <h2>Questions</h2>
        {FAQS.map(([question, answer], index) => (
          <div key={question}>
            <button type="button" aria-expanded={faq === index} onClick={() => setFaq(faq === index ? -1 : index)}>
              {question}<span>{faq === index ? "–" : "+"}</span>
            </button>
            {faq === index ? <p>{answer}</p> : null}
          </div>
        ))}
      </section>

      <section id="anna-rsvp" className="anna-rsvp">
        <span>06 — RSVP</span>
        <h2>Kindly reply{fields.rsvpBy ? <> by<br />{formatLongDate(fields.rsvpBy)}</> : null}</h2>
        {done ? (
          <div className="anna-done">
            <em>{attending ? "See you there" : "We'll miss you"}</em>
            <button type="button" onClick={() => setDone(false)}>Change my reply</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>Name(s)<input value={name} onChange={(event) => { setName(event.target.value); setError(false); }} placeholder="Who's replying?" /></label>
            {error ? <small>Please add your name.</small> : null}
            <div className="anna-choice">
              <button type="button" className={attending ? "on" : ""} onClick={() => setAttending(true)}>Joyfully accept</button>
              <button type="button" className={!attending ? "on" : ""} onClick={() => setAttending(false)}>Regretfully decline</button>
            </div>
            {attending ? (
              <>
                <div className="anna-meals">
                  {["Veg", "Non-veg", "Kids"].map((item) => (
                    <button key={item} type="button" className={meal === item ? "on" : ""} onClick={() => setMeal(item)}>{item}</button>
                  ))}
                </div>
                <label>A song<input value={song} onChange={(event) => setSong(event.target.value)} placeholder="Song request (optional)" /></label>
              </>
            ) : null}
            <button type="submit">Send RSVP</button>
          </form>
        )}
        <div className="anna-gifts">
          <strong>A note on gifts</strong>
          <p>Your presence is the greatest gift. If you'd like to bless them further, a card at the reception is more than enough.</p>
        </div>
        <footer>
          <em>{first}{second ? " & " : ""}{second}</em>
          <Link to="/">Made with InvitesReady</Link>
        </footer>
      </section>
    </article>
  );
}

function Names({ first, second }: { first: string; second: string }) {
  return (
    <>
      <span>You're invited</span>
      <em>{first}</em>
      {second ? <b>&</b> : null}
      {second ? <em>{second}</em> : null}
      <small>Tap the card to reveal the date</small>
    </>
  );
}
