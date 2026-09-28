import { useEffect, useId, useMemo, useRef, useState } from "react";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { formatLongDate, formatTime } from "../lib/dates";
import type { InviteFields } from "../types";
import "./beach.css";

export type BeachTheme = "sunset" | "tropical" | "dusk";

type Reply = { name: string; note: string; attending: boolean };

const STORY_COLORS = ["#F6C08F", "#9ED3D6", "#F7A77F"];

const FILM = ["#F6C08F", "#9ED3D6", "#F7A77F", "#BFE3E6", "#F4E4CC"];

const SAMPLE_WISHES = [
  { name: "Aunty Leena", text: "May your love be as endless as the sea." },
  { name: "Kabir", text: "Sunsets, sand and my two favourite people. Can’t wait!" },
  { name: "The D’Souza family", text: "Wishing you calm seas and a lifetime of adventure." },
  { name: "Nisha", text: "Save me a spot by the bonfire!" },
];

const DRESS = [
  ["👡", "Flat sandals"],
  ["👒", "Sun hats"],
  ["🕶️", "Shades"],
  ["🧣", "Light shawl"],
] as const;

const SWATCHES = ["#F7A77F", "#F4E4CC", "#9ED3D6", "#1F6F78", "#FFFFFF"];
const SHELLS = ["🐚", "⭐", "🌸", "🐠", "✦"];

function splitNames(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0]?.trim() || "Rohan", second: parts.slice(1).join(" & ").trim() || "Alisha" };
}

function stampOf(iso: string, place: string) {
  const date = new Date(`${iso || "2027-03-20"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { weekday: "SATURDAY", mid: "20.03", foot: `2027 · ${place.toUpperCase()}` };
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return { weekday, mid: `${dd}.${mm}`, foot: `${date.getFullYear()} · ${place.toUpperCase()}` };
}

function dotted(iso: string, place: string) {
  const date = new Date(`${iso || "2027-03-20"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return `20 · 03 · 2027 · ${place.toUpperCase()}`;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${date.getFullYear()} · ${place.toUpperCase()}`;
}

function whenLine(iso: string, time: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return time;
  const day = date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  return time ? `${day} · ${formatTime(time)}` : day;
}

function targetTime(iso: string, time: string) {
  if (!iso) return 0;
  const [hour = "17", minute = "30"] = (time || "17:30").split(":");
  return new Date(`${iso}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+05:30`).getTime();
}

function mapsUrl(place: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

function calendarLink(title: string, iso: string, time: string, place: string) {
  if (!iso) return "";
  const [hourText = "17", minuteText = "30"] = (time || "17:30").split(":");
  const hour = hourText.padStart(2, "0");
  const minute = minuteText.padStart(2, "0");
  const stamp = `${iso.replaceAll("-", "")}T${hour}${minute}00`;
  const endHour = String((Number(hour) + 3) % 24).padStart(2, "0");
  const end = `${iso.replaceAll("-", "")}T${endHour}${minute}00`;
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${stamp}/${end}`, location: place });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function Palm() {
  return (
    <svg viewBox="0 0 200 400" fill="none" aria-hidden="true">
      <path d="M110 400C104 300 96 200 112 110" stroke="#3A2A33" strokeWidth="10" strokeLinecap="round" />
      <g fill="#2E3B33">
        <path d="M112 110C80 80 40 80 6 104c36-8 70-2 106 6z" />
        <path d="M112 110C90 60 60 40 20 36c34 18 62 42 92 74z" />
        <path d="M112 110c10-44 34-72 70-86-22 30-44 56-70 86z" />
        <path d="M112 110c40-24 70-20 88 0-30-6-58-4-88 0z" />
        <path d="M112 110c30 10 50 34 58 66-22-26-40-44-58-66z" />
      </g>
    </svg>
  );
}

function Bottle() {
  return (
    <svg viewBox="0 0 60 150" aria-hidden="true">
      <rect x="22" y="2" width="16" height="16" rx="3" fill="#B7834F" />
      <path d="M24 18h12v18c10 8 18 20 18 36v62a14 14 0 0 1-14 14H20a14 14 0 0 1-14-14V72c0-16 8-28 18-36z" fill="#BFE3E6" fillOpacity="0.75" stroke="#FFFFFF" strokeWidth="2" />
      <rect x="16" y="70" width="28" height="56" rx="4" fill="#F4E4CC" transform="rotate(-6 30 98)" />
      <path d="M20 84h20M20 94h20M20 104h14" stroke="#C9A77E" strokeWidth="2" transform="rotate(-6 30 98)" />
      <path d="M14 80c0-8 3-14 8-18" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function Shore() {
  return (
    <>
      <div className="bw-sky" />
      <div className="bw-sun" />
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className={`bw-cloud c${index}`} aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 150 60">
            <path d="M30 55a22 22 0 0 1 4-43 30 30 0 0 1 56-2 24 24 0 0 1 36 23 16 16 0 0 1-6 22z" fill="#FFF3E6" fillOpacity="0.85" />
          </svg>
        </div>
      ))}
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className={`bw-gull g${index}`} aria-hidden="true">
          <svg width={index % 2 ? 36 : 26} height={index % 2 ? 36 : 26} viewBox="0 0 40 20">
            <g>
              <path d="M2 12C8 4 14 4 20 12C26 4 32 4 38 12" stroke="#3A2A33" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      ))}
      <div className="bw-sea">
        {[0, 1, 2].map((index) => (
          <div key={index} className={`bw-wave w${index}`} aria-hidden="true">
            <svg viewBox="0 0 1600 120" preserveAspectRatio="none">
              <path d="M0 40C100 10 200 70 300 40S500 10 600 40 800 70 900 40 1100 10 1200 40 1400 70 1500 40 1600 40 1600 40V120H0z" fill="currentColor" />
            </svg>
          </div>
        ))}
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            className={index >= 10 ? "bw-glint wide" : "bw-glint"}
            style={{
              left: `${(index * 17) % 86 + 6}%`,
              top: `${8 + ((index * 13) % 70)}%`,
              width: 18 + (index % 3) * 10,
              animationDuration: `${2 + (index % 4) * 0.6}s`,
              animationDelay: `${index * 0.3}s`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </>
  );
}

export function BeachInvite({
  fields,
  theme = "sunset",
  quiet = false,
  motion = true,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  theme?: BeachTheme;
  quiet?: boolean;
  motion?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void;
}) {
  const nameId = useId();
  const wishId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<"bottle" | "scroll" | "page">(quiet ? "bottle" : "bottle");
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [added, setAdded] = useState<{ name: string; text: string }[]>([]);

  useEffect(() => {
    if (stage !== "page") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const { first, second } = splitNames(fields.names || "Rohan & Alisha");
  const place = fields.address || "Varkala";
  const stamp = stampOf(fields.date, place);
  const dateLine = dotted(fields.date, place);
  const tag = first === "Rohan" && second === "Alisha" ? "#RohanAndAlishaAshore" : `#${first.replace(/\s/g, "")}And${second.replace(/\s/g, "")}`;
  const photos = (fields.photos ?? []).map(assetUrl);
  const journey = packOf("beach", fields.lines);
  const story = (journey.story ?? []).filter((item) => item.title.trim() || item.text.trim()).map((item, index) => ({ ...item, color: STORY_COLORS[index] ?? "#F6C08F" }));
  const ceremonyName = eventName(fields.lines, "ceremonyName", "Sunset vows");
  const receptionName = eventName(fields.lines, "receptionName", "Beach reception");
  const bonfireName = typeof journey.bonfireName === "string" ? journey.bonfireName.trim() : "";
  const ceremonyPlace = [fields.venue || "Cliff-top lawn", place].filter(Boolean).join(", ");
  const receptionPlace = [fields.receptionVenue, fields.receptionAddress || place].filter(Boolean).join(", ");
  const cards = [
    {
      key: "sun",
      kicker: "The ceremony",
      name: ceremonyName,
      when: whenLine(fields.date, fields.time || "17:30"),
      venue: ceremonyPlace,
      time: fields.time || "17:30",
      place: ceremonyPlace,
    },
    ...(fields.receptionVenue ? [{
      key: "lantern",
      kicker: "Dinner & dancing",
      name: receptionName,
      when: whenLine(fields.date, fields.receptionTime || "19:30"),
      venue: receptionPlace,
      time: fields.receptionTime || "19:30",
      place: receptionPlace,
    }] : []),
    ...(bonfireName ? [{
      key: "fire",
      kicker: "Late night",
      name: bonfireName,
      when: journey.bonfireWhen || "",
      venue: journey.bonfireVenue || "",
      time: "22:30",
      place: [journey.bonfireVenue, place].filter(Boolean).join(", "),
    }] : []),
  ];

  const countdown = useMemo(() => {
    const target = targetTime(fields.date || "2027-03-20", fields.time || "17:30");
    let diff = Math.max(0, Math.floor((target - now) / 1000));
    const days = Math.floor(diff / 86400);
    diff -= days * 86400;
    const hours = Math.floor(diff / 3600);
    diff -= hours * 3600;
    const mins = Math.floor(diff / 60);
    const secs = diff - mins * 60;
    const ring = 276.5;
    return [
      { label: "Days", value: String(days), color: "#E8795A", offset: ring - ring * Math.min(1, days / 365) },
      { label: "Hours", value: String(hours).padStart(2, "0"), color: "#F6B48F", offset: ring - ring * Math.min(1, hours / 24) },
      { label: "Mins", value: String(mins).padStart(2, "0"), color: "#3E8E97", offset: ring - ring * Math.min(1, mins / 60) },
      { label: "Secs", value: String(secs).padStart(2, "0"), color: "#1F6F78", offset: ring - ring * Math.min(1, secs / 60) },
    ];
  }, [fields.date, fields.time, now]);

  const liveWishes = [...added, ...wishes.map((item) => ({ name: item.name, text: item.note })), ...SAMPLE_WISHES];
  const picked = cards.map((card) => card.name).filter((name) => !skipped.includes(name));

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || !fields.audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  function submit() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const attending = attend === "yes";
    const note = [attending ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "", attending ? picked.join(", ") : "", wish.trim()].filter(Boolean).join(" · ");
    onReply?.({ name: name.trim(), attending, note });
    if (wish.trim()) setAdded((current) => [{ name: name.trim(), text: wish.trim() }, ...current]);
    setWish("");
    setDone(true);
  }

  return (
    <div className={`beach ${theme}`} data-motion={motion ? "on" : "off"}>
      {stage !== "page" ? (
        <section className="bw-open" aria-label="Invitation in a bottle">
          <Shore />
          {stage === "bottle" ? (
            <button type="button" className="bw-bottle" onClick={() => { if (!quiet) setStage("scroll"); }}>
              <span className="bw-bob">
                <Bottle />
              </span>
              <span className="bw-hint">Tap the bottle to open your invitation</span>
            </button>
          ) : (
            <>
              <span className="bw-cork" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 16 16">
                  <rect x="2" y="2" width="12" height="12" rx="3" fill="#B7834F" />
                </svg>
              </span>
              <div className="bw-scroll-wrap">
                <div className="bw-scroll">
                  <span className="bw-dear">Dear friend</span>
                  <span className="bw-tide">the tide has brought you an invitation to the wedding of</span>
                  <span className="bw-script one">{first}</span>
                  <span className="bw-amp">&amp;</span>
                  <span className="bw-script two">{second}</span>
                  <span className="bw-when">{dateLine}</span>
                  <button type="button" className="bw-enter" onClick={() => setStage("page")}>
                    Open the invitation
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        <article className="bw-page">
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} onEnded={() => setPlaying(false)} /> : null}
          <button type="button" className={playing ? "bw-music on" : "bw-music"} aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing} onClick={toggleMusic}>
            {[0, 1, 2, 3].map((index) => (
              <i key={index} style={playing ? { animationDuration: `${0.6 + index * 0.15}s`, animationDelay: `${index * 0.1}s` } : undefined} />
            ))}
          </button>
          <nav className="bw-nav" aria-label="Invitation">
            <em>
              {first[0]} &amp; {second[0]}
            </em>
            <div>
              <a href="#story">Our story</a>
              <a href="#events">Events</a>
              <a href="#travel">Travel</a>
              <a href="#rsvp">RSVP</a>
            </div>
          </nav>

          <section className="bw-hero">
            <Shore />
            <div className="bw-palm left">
              <Palm />
            </div>
            <div className="bw-palm right">
              <Palm />
            </div>
            <div className="bw-hero-text">
              <span className="bw-kicker">Two hearts · one shore</span>
              <div className="bw-names">
                <span className="bw-name one">{first}</span>
                <span className="bw-amp">&amp;</span>
                <span className="bw-name two">{second}</span>
              </div>
              <span className="bw-sub">{fields.title || "are tying the knot by the sea"}</span>
              <div className="bw-stamp">
                <span>{stamp.weekday}</span>
                <b>{stamp.mid}</b>
                <span>{stamp.foot}</span>
              </div>
            </div>
          </section>

          <section className="bw-count" aria-label="Countdown">
            <span className="bw-section-kicker">Until the {ceremonyName.toLowerCase()}</span>
            <div className="bw-count-row">
              {countdown.map((item) => (
                <div key={item.label}>
                  <div className="bw-ring">
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="44" stroke="#F4E4CC" strokeWidth="7" fill="none" />
                      <circle cx="50" cy="50" r="44" stroke={item.color} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="276.5" strokeDashoffset={item.offset} />
                    </svg>
                    <strong>{item.value}</strong>
                  </div>
                  <span className="bw-ring-label">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bw-story" id="story">
            <h2 className="bw-h2">How we washed ashore</h2>
            <div className="bw-polas">
              <svg className="bw-rope" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 10Q500 70 1000 10" stroke="#B7834F" strokeWidth="2" fill="none" />
              </svg>
              {story.map((item, index) => (
                <div key={item.year} className={index === 1 ? "bw-drop shift" : "bw-drop"} style={{ animationDelay: `${0.3 + index * 0.35}s` }}>
                  <div className="bw-pola" style={{ animationDuration: `${3.4 + index * 0.5}s`, animationDelay: `${index * -1.2}s` }}>
                    <span className="bw-pin" aria-hidden="true" />
                    <div className="bw-photo" style={{ background: item.color }}>
                      {photos[index] ? <img src={photos[index]} alt="" /> : "Photo"}
                    </div>
                    <span className="bw-year">{item.year}</span>
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bw-events" id="events">
            <h2 className="bw-h2 light">The celebrations</h2>
            <div className="bw-event-grid">
              {cards.map((item, index) => (
                <article key={item.key} className="bw-event" style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="bw-icon" aria-hidden="true">
                    {item.key === "sun" ? (
                      <>
                        <span className="bw-sink" />
                        <span className="bw-horizon" />
                        <span className="bw-glint" style={{ left: 20, right: 20, top: 50, width: "auto", height: 2 }} />
                      </>
                    ) : null}
                    {item.key === "lantern" ? (
                      <svg className="bw-lantern" width="40" height="50" viewBox="0 0 24 32">
                        <path d="M12 0v4" stroke="#FFF6E0" strokeWidth="1.5" />
                        <path d="M5 6h14l2 18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="#F7A77F" />
                        <ellipse cx="12" cy="20" rx="4" ry="3" fill="#FFF3C4" />
                      </svg>
                    ) : null}
                    {item.key === "fire" ? (
                      <>
                        <svg width="40" height="48" viewBox="0 0 30 36">
                          <g className="bw-flame">
                            <path d="M15 2c4 8 11 12 11 21a11 11 0 0 1-22 0c0-6 4-9 6-13 1 4 3 6 5 6-2-5-2-9 0-14z" fill="#F7A77F" />
                            <path d="M15 14c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3-1-2-1-4 0-7z" fill="#FFE08A" />
                          </g>
                        </svg>
                        {[0, 1, 2, 3].map((spark) => (
                          <span
                            key={spark}
                            className="bw-spark"
                            style={{
                              left: 34 + spark * 5,
                              ["--sx" as string]: spark % 2 ? "10px" : "-10px",
                              animationDuration: `${1.4 + spark * 0.3}s`,
                              animationDelay: `${spark * 0.35}s`,
                            }}
                          />
                        ))}
                      </>
                    ) : null}
                  </div>
                  <em>{item.kicker}</em>
                  <strong>{item.name}</strong>
                  <p>
                    <b>{item.when}</b>
                    <br />
                    {item.venue}
                  </p>
                  <div className="bw-event-actions">
                    <a className="fill" href={mapsUrl(item.place)} target="_blank" rel="noreferrer">
                      Directions
                    </a>
                    <a className="ghost" href={calendarLink(`${first} & ${second} · ${item.name}`, fields.date, item.time, item.place)} target="_blank" rel="noreferrer">
                      Calendar
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="bw-gallery">
            <h2 className="bw-h2">Salt-kissed moments</h2>
            <div className="bw-marq-clip">
              <div className="bw-marq">
                {Array.from({ length: 20 }, (_, index) => {
                  const photo = photos[index % Math.max(photos.length, 1)];
                  const color = FILM[index % 5];
                  return (
                    <div key={index} className="bw-frame" style={{ animationDuration: `${4 + (index % 3)}s`, animationDelay: `${(index % 10) * -0.7}s` }}>
                      {photos.length ? <img src={photo} alt="" /> : <div style={{ background: color }}>Photo {(index % 5) + 1}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bw-travel" id="travel">
            <div className="bw-col grow">
              <h2 className="bw-h2 left">Getting to {place}</h2>
              <div className="bw-map">
                <svg className="route bw-map-m" viewBox="0 0 350 170" fill="none" aria-hidden="true">
                  <path d="M24 140C110 30 240 30 320 110" stroke="#1F6F78" strokeWidth="2.5" strokeDasharray="8 8" />
                  <circle cx="24" cy="140" r="7" fill="#1F6F78" />
                  <circle cx="320" cy="110" r="9" fill="#E8795A" />
                </svg>
                <svg className="route bw-map-d" viewBox="0 0 520 240" fill="none" aria-hidden="true">
                  <path d="M40 200C160 40 360 40 480 150" stroke="#1F6F78" strokeWidth="2.5" strokeDasharray="8 8" />
                  <circle cx="40" cy="200" r="7" fill="#1F6F78" />
                  <circle cx="480" cy="150" r="9" fill="#E8795A" />
                </svg>
                <span className="bw-plane" aria-hidden="true">
                  ✈
                </span>
                <span className="bw-from">{journey.travelFrom || "Trivandrum Airport"}</span>
                <span className="bw-to">{place} Cliff · {journey.travelKm || "50 km"}</span>
              </div>
              <p>
                {fields.message || `Shuttles from the airport on Friday afternoon. Rooms are held at two cliff-top resorts — mention “${first} & ${second}” when booking.`}
              </p>
            </div>
            <div className="bw-col side">
              <h2 className="bw-h2 left">Beach formal</h2>
              <p>{fields.dress || "Light linens, flowing sarees and breezy dresses. Leave the heels at home — we'll be on sand!"}</p>
              <div className="bw-dress-row">
                {DRESS.map(([emoji, label], index) => (
                  <div key={label} className="bw-dress" style={{ animationDelay: `${index * 0.3}s` }}>
                    <span aria-hidden="true">{emoji}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="bw-swatches">
                {SWATCHES.map((color, index) => (
                  <i key={color} style={{ background: color, animationDelay: `${index * 0.2}s` }} aria-hidden="true" />
                ))}
              </div>
            </div>
          </section>

          <section className="bw-rsvp" id="rsvp">
            <div className="bw-rsvp-intro">
              <h2 className="bw-h2 light">Will you join us on the shore?</h2>
              <p>Kindly reply by {fields.rsvpBy ? formatLongDate(fields.rsvpBy) : "20 February 2027"}</p>
            </div>
            <div className="bw-form-wrap">
              {done ? (
                <div className="bw-done">
                  <div className="bw-sweep" aria-hidden="true">
                    <svg viewBox="0 0 400 300" preserveAspectRatio="none">
                      <path d="M0 140C60 110 120 170 200 140S340 110 400 140V300H0z" fill="#6FB3B8" fillOpacity="0.35" />
                    </svg>
                  </div>
                  {Array.from({ length: 18 }, (_, index) => (
                    <span
                      key={index}
                      className={index >= 12 ? "bw-shell extra" : "bw-shell"}
                      style={{
                        left: `${(index * 37) % 95}%`,
                        fontSize: 16 + (index % 3) * 6,
                        animationDuration: `${2.4 + (index % 4) * 0.4}s`,
                        animationDelay: `${(index % 6) * 0.15}s`,
                      }}
                      aria-hidden="true"
                    >
                      {SHELLS[index % 5]}
                    </span>
                  ))}
                  <span aria-hidden="true">🐚</span>
                  <h3>{attend === "yes" ? "See you at the shore!" : "We’ll miss you"}</h3>
                  <p>
                    {attend === "yes"
                      ? `Thank you, ${name.trim()}! ${guests} ${guests === 1 ? "spot" : "spots"}${picked.length ? ` saved for the ${picked.join(", ")}` : " saved"}. Bring your dancing feet.`
                      : `Thank you for letting us know, ${name.trim()}. We’ll send you sunset photos!`}
                  </p>
                  <button type="button" className="bw-change" onClick={() => setDone(false)}>
                    Change my reply
                  </button>
                </div>
              ) : (
                <form
                  className="bw-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                  }}
                >
                  <label htmlFor={nameId}>Your name</label>
                  <input id={nameId} className={nameError ? "bad" : undefined} value={name} placeholder="Guest or family name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                  {nameError ? <span className="err">Please enter your name.</span> : null}
                  <div className="bw-yesno">
                    <button type="button" className={attend === "yes" ? "on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>
                      🌊 Count me in
                    </button>
                    <button type="button" className={attend === "no" ? "on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>
                      Can't make it
                    </button>
                  </div>
                  {attend === "yes" ? (
                    <>
                      <span>I'll be at</span>
                      <div className="bw-chips">
                        {cards.map((card) => (
                          <button key={card.key} type="button" className={skipped.includes(card.name) ? undefined : "on"} aria-pressed={!skipped.includes(card.name)} onClick={() => setSkipped((current) => (current.includes(card.name) ? current.filter((name) => name !== card.name) : [...current, card.name]))}>
                            {card.name}
                          </button>
                        ))}
                      </div>
                      <div className="bw-step">
                        <span>Guests</span>
                        <div>
                          <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>
                            −
                          </button>
                          <span aria-live="polite">{guests}</span>
                          <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>
                            +
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <label htmlFor={wishId}>A wish for the couple</label>
                  <input id={wishId} value={wish} placeholder="Optional" onChange={(event) => setWish(event.target.value)} />
                  <button type="submit" className="bw-send">
                    Send my RSVP
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className="bw-wishes">
            <h2 className="bw-h2">Messages in bottles</h2>
            <div className="bw-wish-grid">
              {liveWishes.map((item, index) => (
                <article key={`${item.name}-${index}`} className="bw-wish" style={{ animationDuration: `${4 + (index % 3)}s`, animationDelay: `${index * -0.8}s` }}>
                  <span aria-hidden="true">🍾</span>
                  <p>{item.text}</p>
                  <span>— {item.name}</span>
                </article>
              ))}
            </div>
          </section>

          <footer className="bw-foot">
            <div className="bw-feet" aria-hidden="true">
              {Array.from({ length: 16 }, (_, index) => (
                <i key={index} className={index >= 8 ? "extra" : index % 2 ? "odd" : undefined} style={{ ["--i" as string]: index, animationDelay: `${index * 0.5}s` }}>
                  👣
                </i>
              ))}
            </div>
            <em>
              {first} &amp; {second}
            </em>
            <small>
              {dateLine} · {tag}
            </small>
            <a href="/">Made with InvitesReady</a>
            <div className="bw-foot-wave" aria-hidden="true">
              <div className="bw-wave" style={{ height: 60, animationDuration: "10s" }}>
                <svg viewBox="0 0 1600 60" preserveAspectRatio="none">
                  <path d="M0 30C100 10 200 50 300 30S500 10 600 30 800 50 900 30 1100 10 1200 30 1400 50 1500 30 1600 30V60H0z" fill="#6FB3B8" fillOpacity="0.5" />
                </svg>
              </div>
            </div>
          </footer>
        </article>
      )}
    </div>
  );
}
