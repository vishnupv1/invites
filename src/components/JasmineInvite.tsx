import { useEffect, useState, type FormEvent } from "react";
import { packOf } from "../data/custom";
import { formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./jasmine.css";

type Reply = { name: string; note: string; attending: boolean };
type Screen = "opening" | "invite" | "events" | "rsvp";

const ART = "/jasmine";

function coupleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Athira", second: parts[1] || "Rahul" };
}

function dayParts(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { weekday: "SAT", day: "14", rest: "DEC 2026" };
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
    day: String(date.getDate()),
    rest: `${date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}\n${date.getFullYear()}`,
  };
}

function mapsQuery(venue: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, address].filter(Boolean).join(" "))}`;
}

export function JasmineInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Cormorant Garamond", "DM Sans");
  const pack = packOf("jasmine", fields.lines);
  const couple = coupleOf(fields.names);
  const when = dayParts(fields.date);
  const [screen, setScreen] = useState<Screen>("opening");
  const [parting, setParting] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [guests, setGuests] = useState(1);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (quiet) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [quiet]);

  function open() {
    if (parting || screen !== "opening") return;
    setParting(true);
    window.setTimeout(() => {
      setScreen("invite");
      setParting(false);
    }, 1500);
  }

  function go(next: Screen) {
    if (next !== "opening" && screen === "opening") {
      open();
      return;
    }
    setScreen(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add your name.");
      return;
    }
    const yes = attend === "yes";
    const message = [note.trim(), yes ? `${guests} guest${guests === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ");
    try {
      await onReply?.({ name: name.trim(), note: message, attending: yes });
    } catch {
      setError("Could not send that reply. Try again.");
      return;
    }
    setError("");
    setSent(true);
  }

  const target = new Date(`${fields.date || "2026-12-14"}T${fields.time || "17:30"}:00+05:30`).getTime();
  const remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const countdown = remaining <= 0 ? "Our special day is here" : `${days} days · ${hours} hours · ${minutes} minutes`;
  const programme = pack.programme?.length
    ? pack.programme
    : [
        { title: "Wedding ceremony", time: formatTime(fields.time), text: [fields.venue, fields.address].filter(Boolean).join(", "), note: formatLongDate(fields.date) },
        { title: "Wedding reception", time: formatTime(fields.receptionTime) || "7:00 PM", text: [fields.receptionVenue || fields.venue, fields.receptionAddress || fields.address].filter(Boolean).join(", "), note: formatLongDate(fields.date) },
      ];

  return (
    <div className={`jm${parting ? " is-parting" : ""}${screen !== "opening" ? " is-in" : ""}${quiet ? " is-quiet" : ""}`}>
      {screen === "opening" ? (
        <section className="jm-open" aria-label="Opening invitation">
          <div className="jm-curtain is-l" />
          <div className="jm-curtain is-r" />
          <img className="jm-lamp is-l" src={`${ART}/lamp.webp`} alt="" />
          <img className="jm-lamp is-r" src={`${ART}/lamp.webp`} alt="" />
          <div className="jm-petals" aria-hidden="true">
            <img src={`${ART}/flower.webp`} alt="" />
            <img src={`${ART}/flower-b.webp`} alt="" />
            <img src={`${ART}/flower.webp`} alt="" />
            <img src={`${ART}/flower-b.webp`} alt="" />
          </div>
          <div className="jm-hero">
            <p>{fields.hosts || "With the blessings of our families"}</p>
            <h1>You're<br /><em>Invited</em></h1>
            <img className="jm-mark" src={`${ART}/divider.webp`} alt="" />
            <p className="jm-kicker">{fields.title || "To celebrate our wedding"}</p>
            <p className="jm-names">{couple.first} <span>&</span> {couple.second}</p>
            <button type="button" onClick={open} aria-label="Open the invitation">
              Tap to open <span>→</span>
            </button>
          </div>
        </section>
      ) : null}

      {(screen === "invite" || parting) ? (
        <section className="jm-paper" aria-label="Wedding invitation">
          <img className="jm-arch" src={`${ART}/garland.webp`} alt="" />
          <img className="jm-sprig is-l" src={`${ART}/corner.webp`} alt="" />
          <img className="jm-sprig is-r" src={`${ART}/corner.webp`} alt="" />
          <div className="jm-copy">
            <p className="jm-eyebrow">{fields.hosts || "Together with their families"}</p>
            <p className="jm-mini">Joyfully invite you to celebrate</p>
            <img className="jm-couple" src={`${ART}/couple.webp`} alt="" />
            <h2>{couple.first} <span>&</span> {couple.second}</h2>
            <p className="jm-event">{fields.title || "Their wedding"}</p>
            <div className="jm-date">
              <span>{when.weekday}</span>
              <strong>{when.day}</strong>
              <span>{when.rest}</span>
            </div>
            <p className="jm-time">{formatTime(fields.time) || "5:30 PM"}</p>
            <img className="jm-flower" src={`${ART}/divider.webp`} alt="" />
            <p className="jm-venue">{fields.venue || "The Grand Grove"}<small>{fields.address}</small></p>
            {fields.message ? <p className="jm-note">{fields.message}</p> : null}
            <button type="button" className="jm-next" onClick={() => go("events")}>Explore our celebration <span>→</span></button>
          </div>
          <img className="jm-house" src={`${ART}/house.webp`} alt="" />
          <img className="jm-palm is-l" src={`${ART}/palm.webp`} alt="" />
          <img className="jm-palm is-r" src={`${ART}/palm.webp`} alt="" />
        </section>
      ) : null}

      {screen === "events" ? (
        <section className="jm-paper" aria-label="Events and venue">
          <img className="jm-arch" src={`${ART}/garland.webp`} alt="" />
          <div className="jm-copy">
            <p className="jm-eyebrow">The celebrations</p>
            <h2 className="jm-title">Our special day</h2>
            <p className="jm-sub">A day of love, laughter and new beginnings</p>
            {programme.map((item, index) => (
              <article className="jm-card" key={`${item.title}-${item.time}`}>
                <img src={`${ART}/${["rings.webp", "umbrella.webp", "flower.webp"][index] || "flower.webp"}`} alt="" />
                <div>
                  <h3>{item.title}</h3>
                  {item.note ? <p>{item.note}</p> : null}
                  <p>{[item.time, item.text].filter(Boolean).join(" · ")}</p>
                </div>
              </article>
            ))}
            <img className="jm-house is-card" src={`${ART}/mandap.webp`} alt="" />
            <a className="jm-map" href={mapsQuery(fields.venue, fields.address)} target="_blank" rel="noopener">
              <img src={`${ART}/pin.webp`} alt="" />
              View location
            </a>
            <p className="jm-count">{countdown}</p>
            <button type="button" className="jm-next" onClick={() => go("rsvp")}>Kindly RSVP <span>→</span></button>
          </div>
        </section>
      ) : null}

      {screen === "rsvp" ? (
        <section className="jm-paper" aria-label="RSVP">
          <img className="jm-arch is-note" src={`${ART}/envelope.webp`} alt="" />
          <div className="jm-copy">
            <p className="jm-eyebrow">The honour of your presence</p>
            <h2 className="jm-title">RSVP</h2>
            <p className="jm-sub">We would be delighted to have you celebrate with us.</p>
            {sent ? <p className="jm-thanks">Thank you. Your reply is with {couple.first} & {couple.second}.</p> : (
              <form onSubmit={submit}>
                <div className="jm-choices">
                  <button type="button" className={attend === "yes" ? "is-on" : ""} onClick={() => setAttend("yes")}>Joyfully accepts</button>
                  <button type="button" className={attend === "no" ? "is-on" : ""} onClick={() => setAttend("no")}>Regretfully declines</button>
                </div>
                <label>Your full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
                {attend === "yes" ? (
                  <label>Number of guests<input type="number" min={1} max={20} value={guests} onChange={(event) => setGuests(Number(event.target.value) || 1)} /></label>
                ) : null}
                <label>A note for the couple<textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Your wishes" /></label>
                {error ? <p className="jm-error">{error}</p> : null}
                <button className="jm-next" type="submit">Send RSVP <span>→</span></button>
              </form>
            )}
            <p className="jm-love">With love, {couple.first} & {couple.second}</p>
            <a className="jm-made" href={madeWithHref("jasmine")}>Made with InvitesReady</a>
          </div>
        </section>
      ) : null}
    </div>
  );
}
