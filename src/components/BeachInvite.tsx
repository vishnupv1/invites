import { useEffect, useId, useMemo, useRef, useState } from "react";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import catalogMeta from "../data/template-meta.json";
import { formatLongDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import { InstagramLink } from "./InstagramLink";
import "./beach2.css";

export type BeachTheme = "sunset" | "tropical" | "dusk";

type Reply = { name: string; note: string; attending: boolean };

const ART = {
  cloudA: "/beach2/cloud-a.webp",
  cloudB: "/beach2/cloud-b.webp",
  cork: "/beach2/cork.webp",
  rod: "/beach2/rod.webp",
  wave: "/beach2/wave.webp",
  bottle: "/beach2/bottle.webp",
  sun: "/beach2/sun.webp",
  palm: "/beach2/palm.webp",
  star: "/beach2/star.webp",
  conch: "/beach2/conch.webp",
  lantern: "/beach2/lantern.webp",
  plane: "/beach2/plane.webp",
  sunIcon: "/beach2/sun-icon.webp",
  fire: "/beach2/fire.webp",
  wish: "/beach2/wish-bottle.webp",
};

const DRESS = [
  ["/beach2/sandals.webp", "Flat sandals"],
  ["/beach2/hat.webp", "Sun hats"],
  ["/beach2/shades.webp", "Shades"],
  ["/beach2/shawl.webp", "Light shawl"],
] as const;

const SWATCHES = ["#F7A77F", "#F4E4CC", "#9ED3D6", "#1F6F78", "#FFFFFF"];
const STORY_COLORS = ["#F6C08F", "#9ED3D6", "#F7A77F"];
const FILM_COLORS = ["#F6C08F", "#9ED3D6", "#F7A77F", "#BFE3E6", "#F4E4CC"];
const SAMPLES = [
  { name: "Aunty Leena", text: "May your love be as endless as the sea." },
  { name: "Kabir", text: "Sunsets, sand and my two favourite people. Can’t wait!" },
  { name: "The D’Souza family", text: "Wishing you calm seas and a lifetime of adventure." },
  { name: "Nisha", text: "Save me a spot by the bonfire!" },
];

function splitNames(names: string) {
  const parts = names.split(/\s+&\s+/);
  return { first: parts[0]?.trim() || "Rohan", second: parts.slice(1).join(" & ").trim() || "Alisha" };
}

function dotted(iso: string, place: string) {
  const date = new Date(`${iso || "2027-03-20"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return `20 · 03 · 2027 · ${place.toUpperCase()}`;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd} · ${mm} · ${date.getFullYear()} · ${place.toUpperCase()}`;
}

function stampOf(iso: string, place: string) {
  const date = new Date(`${iso || "2027-03-20"}T12:00:00`);
  const year = Number.isNaN(date.getTime()) ? "2027" : String(date.getFullYear());
  const short = (place.split(",")[0]?.trim() || "").slice(0, 16).toUpperCase();
  const foot = short ? `${year} · ${short}` : year;
  if (Number.isNaN(date.getTime())) return { weekday: "SATURDAY", mid: "20.03", foot };
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return { weekday, mid: `${dd}.${mm}`, foot };
}

function whenLine(iso: string, time: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return time;
  const day = date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
  return time ? `${day} · ${formatClock(time)}` : day;
}

function formatClock(time: string) {
  const [hourText = "17", minuteText = "00"] = time.split(":");
  const hour = Number(hourText);
  const minute = minuteText.padStart(2, "0");
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute} ${suffix}`;
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
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${stamp}/${iso.replaceAll("-", "")}T${endHour}${minute}00`, location: place });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function wishFromReply(note: string, events: string[]) {
  const known = new Set(events);
  return note
    .split(" · ")
    .map((part) => part.trim())
    .filter((part) => part && !/^\d+ guests?$/.test(part) && !part.split(",").every((bit) => known.has(bit.trim())))
    .join(" · ");
}

function Gull({ className, size }: { className: string; size: number }) {
  return (
    <div className={className} aria-hidden="true">
      <svg width={size} height={size * 0.5} viewBox="0 0 40 20">
        <path d="M2 12C8 4 14 4 20 12C26 4 32 4 38 12" stroke="#5A3A3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Waves() {
  return (
    <div className="b2-waves" aria-hidden="true">
      <div className="b2-wave-row">
        {Array.from({ length: 8 }, (_, index) => (
          <img key={index} src={ART.wave} alt="" className={index % 2 ? "flip" : undefined} />
        ))}
      </div>
    </div>
  );
}

function Shore() {
  return (
    <div className="b2-scene" aria-hidden="true">
      <div className="b2-sky" />
      <div className="b2-glow" />
      <div className="b2-sunclip">
        <img className="b2-sun" src={ART.sun} alt="" />
      </div>
      <img className="b2-cloud c1" src={ART.cloudA} alt="" />
      <img className="b2-cloud c2" src={ART.cloudB} alt="" />
      <img className="b2-cloud c3" src={ART.cloudA} alt="" />
      <img className="b2-cloud c4" src={ART.cloudB} alt="" />
      <Gull className="b2-gull g1" size={22} />
      <Gull className="b2-gull g2" size={30} />
      <Gull className="b2-gull g3" size={22} />
      <Gull className="b2-gull g4" size={30} />
      {Array.from({ length: 8 }, (_, index) => (
        <span
          key={index}
          className="b2-glint"
          style={{
            left: `${18 + (index * 9) % 34}%`,
            top: `${62 + (index * 4) % 18}%`,
            width: 14 + (index % 3) * 10,
            animationDuration: `${2 + (index % 4) * 0.6}s`,
            animationDelay: `${index * 0.3}s`,
          }}
        />
      ))}
      <Waves />
      <img className="b2-palm left" src={ART.palm} alt="" />
      <img className="b2-palm right" src={ART.palm} alt="" />
    </div>
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
  useFonts("Allura", "DM Sans", "Playfair Display");
  const nameId = useId();
  const wishId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [stage, setStage] = useState<"bottle" | "scroll" | "page">("bottle");
  const [popping, setPopping] = useState(false);
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
    if (!popping || stage !== "bottle") return;
    const timer = window.setTimeout(() => setStage("scroll"), 850);
    return () => window.clearTimeout(timer);
  }, [popping, stage]);

  useEffect(() => {
    if (stage !== "page") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const { first, second } = splitNames(fields.names || "Rohan & Alisha");
  const place = fields.address || "Varkala";
  const stamp = stampOf(fields.date, place);
  const dateLine = dotted(fields.date, place);
  const tag = `#${first.replace(/\s/g, "")}And${second.replace(/\s/g, "")}`;
  const photos = (fields.photos ?? []).map(assetUrl).filter(Boolean);
  const captions = photoNotes(fields.notes, catalogMeta.beach.shots);
  const journey = packOf("beach", fields.lines);
  const story = (journey.story ?? []).filter((item) => item.title.trim() || item.text.trim());
  const ceremonyName = eventName(fields.lines, "ceremonyName", "Sunset vows");
  const receptionName = eventName(fields.lines, "receptionName", "Beach reception");
  const bonfireName = typeof journey.bonfireName === "string" ? journey.bonfireName.trim() : "";
  const ceremonyPlace = [fields.venue || "Cliff-top lawn", place].filter(Boolean).join(", ");
  const receptionPlace = [fields.receptionVenue, fields.receptionAddress || place].filter(Boolean).join(", ");
  const from = typeof journey.travelFrom === "string" && journey.travelFrom.trim() ? journey.travelFrom : "Trivandrum Airport";
  const km = typeof journey.travelKm === "string" && journey.travelKm.trim() ? journey.travelKm : "50 km";
  const cards = [
    { key: "sun", kicker: "The ceremony", name: ceremonyName, when: whenLine(fields.date, fields.time || "17:30"), venue: ceremonyPlace, time: fields.time || "17:30", place: ceremonyPlace },
    ...(fields.receptionVenue ? [{ key: "lantern", kicker: "Dinner & dancing", name: receptionName, when: whenLine(fields.date, fields.receptionTime || "19:30"), venue: receptionPlace, time: fields.receptionTime || "19:30", place: receptionPlace }] : []),
    ...(bonfireName ? [{ key: "fire", kicker: "Late night", name: bonfireName, when: journey.bonfireWhen || "", venue: journey.bonfireVenue || "", time: "22:30", place: [journey.bonfireVenue, place].filter(Boolean).join(", ") }] : []),
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

  const eventNames = cards.map((card) => card.name);
  const liveWishes = [...added, ...wishes.map((item) => ({ name: item.name, text: wishFromReply(item.note, eventNames) }))].filter((item, index, all) => item.text && all.findIndex((other) => other.name === item.name && other.text === item.text) === index);
  const shownWishes = liveWishes.length ? liveWishes : SAMPLES;
  const picked = eventNames.filter((item) => !skipped.includes(item));
  const film = photos.length ? Array.from({ length: 10 }, (_, index) => photos[index % photos.length]) : FILM_COLORS;
  const filmLoop = [...film, ...film];

  function openBottle() {
    if (quiet || popping) return;
    setPopping(true);
  }

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
    <div className={`b2 ${theme}${stage === "page" ? " is-page" : ""}`} data-motion={motion ? "on" : "off"}>
      {stage !== "page" ? (
        <section className="b2-open" aria-label="Invitation in a bottle">
          <Shore />
          {stage === "bottle" ? (
            <button type="button" className={popping ? "b2-bottle is-pop" : "b2-bottle"} aria-label="Open the message in a bottle" onClick={openBottle}>
              <span className="b2-bob">
                <span className="b2-bottle-fig">
                  <img src={ART.bottle} alt="" />
                  <img className="b2-cork" src={ART.cork} alt="" />
                </span>
              </span>
              <span className="b2-hint">Tap the bottle to open your invitation</span>
            </button>
          ) : (
            <>
              <div className="b2-dim" aria-hidden="true" />
              <div className="b2-scroll-wrap">
                <div className="b2-scroll">
                  <img className="b2-rod" src={ART.rod} alt="" />
                  <div className="b2-paper">
                    <span className="b2-dear">Dear friend</span>
                    <span className="b2-tide">the tide has brought you an invitation to the wedding of</span>
                    <span className="b2-script one">{first}</span>
                    <span className="b2-amp">&amp;</span>
                    <span className="b2-script two">{second}</span>
                    <span className="b2-when">{dateLine}</span>
                    <button type="button" className="b2-enter" onClick={() => setStage("page")}>Open the invitation</button>
                  </div>
                  <img className="b2-rod bot" src={ART.rod} alt="" />
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        <article className="b2-page">
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} onEnded={() => setPlaying(false)} /> : null}
          {fields.audio ? (
            <button type="button" className={playing ? "b2-music on" : "b2-music"} aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing} onClick={toggleMusic}>
              {[0, 1, 2, 3].map((index) => (
                <i key={index} style={playing ? { animationDuration: `${0.6 + index * 0.15}s`, animationDelay: `${index * 0.1}s` } : undefined} />
              ))}
            </button>
          ) : null}
          <nav className="b2-nav" aria-label="Invitation">
            <em>{first[0]} &amp; {second[0]}</em>
            <div>
              <a href="#story">Our story</a>
              <a href="#events">Events</a>
              <a href="#travel">Travel</a>
              <a href="#rsvp">RSVP</a>
            </div>
          </nav>

          <section className="b2-hero">
            <div className="b2-scene">
              <div className="b2-hero-bg" />
              <img className="b2-cloud c1" src={ART.cloudA} alt="" />
              <img className="b2-cloud c2" src={ART.cloudB} alt="" />
              <img className="b2-cloud c3" src={ART.cloudA} alt="" />
              <Gull className="b2-gull g1" size={22} />
              <Gull className="b2-gull g2" size={30} />
              <Gull className="b2-gull g3" size={22} />
              <Gull className="b2-gull g4" size={30} />
              <div className="b2-sea">
                {Array.from({ length: 8 }, (_, index) => (
                  <span key={index} className="b2-glint" style={{ left: `${8 + (index * 11) % 70}%`, top: `${10 + (index * 12) % 70}%`, width: 14 + (index % 3) * 10, animationDuration: `${2 + (index % 4) * 0.6}s`, animationDelay: `${index * 0.3}s` }} />
                ))}
              </div>
              <Waves />
              <img className="b2-palm left" src={ART.palm} alt="" />
              <img className="b2-palm right" src={ART.palm} alt="" />
            </div>
            <div className="b2-hero-text">
              <span className="b2-kicker">Two hearts · one shore</span>
              <div className="b2-names">
                <span className="b2-name one">{first}</span>
                <span className="b2-amp">&amp;</span>
                <span className="b2-name two">{second}</span>
              </div>
              <span className="b2-sub">{fields.title || "are tying the knot by the sea"}</span>
              <div className="b2-stamp">
                <span>{stamp.weekday}</span>
                <b>{stamp.mid}</b>
                <span>{stamp.foot}</span>
              </div>
            </div>
          </section>

          <section className="b2-count b2-sand">
            <img className="b2-deco star" src={ART.star} alt="" />
            <img className="b2-deco conch" src={ART.conch} alt="" />
            <span className="b2-kicker-line">Until the sunset vows</span>
            <div className="b2-count-row">
              {countdown.map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div className="b2-ring">
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="44" stroke="#F4E4CC" strokeWidth="7" fill="none" />
                      <circle cx="50" cy="50" r="44" stroke={item.color} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="276.5" strokeDashoffset={item.offset} />
                    </svg>
                    <strong>{item.value}</strong>
                  </div>
                  <span className="b2-unit">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="b2-block" id="story">
            <h2 className="b2-h2">How we washed ashore</h2>
            <div className="b2-story">
              <svg className="line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 10Q500 70 1000 10" stroke="#B7834F" strokeWidth="2" fill="none" />
              </svg>
              <div className="b2-polas">
                {story.map((item, index) => (
                  <div key={`${item.year}-${item.title}`} className="b2-pola" style={{ animationDelay: `${0.3 + index * 0.35}s` }}>
                    <article className="b2-card" style={{ animationDuration: `${3.4 + index * 0.5}s`, animationDelay: `${index * -1.2}s` }}>
                      <span className="b2-pin" aria-hidden="true" />
                      <div className="b2-shot" style={{ background: STORY_COLORS[index] ?? "#F6C08F" }}>
                        {photos[index] ? <img src={photos[index]} alt="" /> : <span>{captions[index]?.title || "Photo"}</span>}
                      </div>
                      <div className="b2-year">{item.year}</div>
                      <b>{item.title}</b>
                      <p>{item.text}</p>
                    </article>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="b2-events" id="events">
            <h2 className="b2-h2 light">The celebrations</h2>
            <div className="b2-events-grid">
              {cards.map((item, index) => (
                <article key={item.key} className="b2-event" style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className={`b2-icon ${item.key === "lantern" ? "lantern" : item.key === "fire" ? "fire" : ""}`}>
                    <span className="glow" aria-hidden="true" />
                    <img src={item.key === "lantern" ? ART.lantern : item.key === "fire" ? ART.fire : ART.sunIcon} alt="" />
                    {item.key === "fire" ? [0, 1, 2, 3].map((spark) => (
                      <span key={spark} className="b2-spark" style={{ left: `${46 + spark * 3}%`, ["--sx" as string]: spark % 2 ? "14px" : "-14px", animationDuration: `${1.4 + spark * 0.3}s`, animationDelay: `${spark * 0.35}s` }} />
                    )) : null}
                  </div>
                  <span className="kick">{item.kicker}</span>
                  <h3>{item.name}</h3>
                  <p><strong>{item.when}</strong><br />{item.venue}</p>
                  <div className="b2-actions">
                    <a className="fill" href={mapsUrl(item.place)} target="_blank" rel="noreferrer">Directions</a>
                    <a className="ghost" href={calendarLink(`${first} & ${second} · ${item.name}`, fields.date, item.time, item.place)} target="_blank" rel="noreferrer">Calendar</a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="b2-gallery b2-sand">
            <h2 className="b2-h2">Salt-kissed moments</h2>
            <div className="b2-marq">
              <div className="b2-marq-row">
                {filmLoop.map((frame, index) => (
                  <div key={index} className="b2-frame" style={{ animationDuration: `${4 + (index % 3)}s`, animationDelay: `${index * -0.7}s` }}>
                    <div className="b2-shot" style={photos.length ? undefined : { background: frame }}>
                      {photos.length ? <img src={frame} alt="" /> : <span>Photo {(index % 5) + 1}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="b2-travel" id="travel">
            <div className="b2-col grow">
              <h2 className="b2-h2 left">Getting to {place.split(",")[0]}</h2>
              <div className="b2-map">
                <svg className="phone" viewBox="0 0 350 262" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M270 196C188 218 106 154 150 62" stroke="#FFF8EE" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />
                  <path className="dash" d="M270 196C188 218 106 154 150 62" stroke="#E8795A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
                <svg className="desk" viewBox="0 0 520 390" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M402 292C280 322 158 232 224 92" stroke="#FFF8EE" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />
                  <path className="dash" d="M402 292C280 322 158 232 224 92" stroke="#E8795A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
                <span className="b2-plane" aria-hidden="true"><img src={ART.plane} alt="" /></span>
                <span className="b2-chip from">{from}</span>
                <span className="b2-chip to">{place.split(",")[0]} · {km}</span>
              </div>
              <p>{fields.message || "Shuttles from the airport on Friday afternoon. Rooms are held at two cliff-top resorts — mention the couple when booking."}</p>
            </div>
            <div className="b2-col even">
              <h2 className="b2-h2 left">Beach formal</h2>
              <p>{fields.dress || "Light linens, flowing sarees and breezy dresses. Leave the heels at home — we'll be on sand!"}</p>
              <div className="b2-dress">
                {DRESS.map(([src, label], index) => (
                  <div key={label} style={{ animationDelay: `${index * 0.3}s` }}>
                    <img src={src} alt="" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="b2-swatches">
                {SWATCHES.map((color, index) => (
                  <i key={color} style={{ background: color, animationDelay: `${index * 0.2}s` }} aria-hidden="true" />
                ))}
              </div>
            </div>
          </section>

          <section className="b2-rsvp" id="rsvp">
            <div className="b2-rsvp-intro">
              <h2 className="b2-h2 light">Will you join us on the shore?</h2>
              <p>Kindly reply by {fields.rsvpBy ? formatLongDate(fields.rsvpBy) : "20 February 2027"}</p>
            </div>
            <div className="b2-form-wrap">
              {done ? (
                <div className="b2-done">
                  <div className="b2-sweep" aria-hidden="true">
                    <svg viewBox="0 0 400 300" preserveAspectRatio="none"><path d="M0 140C60 110 120 170 200 140S340 110 400 140V300H0z" fill="#6FB3B8" fillOpacity="0.35" /></svg>
                  </div>
                  {Array.from({ length: 12 }, (_, index) => (
                    <img key={index} className="b2-shell" src={index % 2 ? ART.star : ART.conch} alt="" style={{ left: `${(index * 37) % 92}%`, width: 20 + (index % 3) * 8, animationDuration: `${2.4 + (index % 4) * 0.4}s`, animationDelay: `${(index % 6) * 0.15}s` }} />
                  ))}
                  <img src={ART.conch} alt="" />
                  <h3>{attend === "yes" ? "See you at the shore!" : "We’ll miss you"}</h3>
                  <p>
                    {attend === "yes"
                      ? `Thank you, ${name.trim()}! ${guests} ${guests === 1 ? "spot" : "spots"}${picked.length ? ` saved for the ${picked.join(", ")}` : " saved"}. Bring your dancing feet.`
                      : `Thank you for letting us know, ${name.trim()}. We’ll send you sunset photos!`}
                  </p>
                  <button type="button" className="b2-change" onClick={() => setDone(false)}>Change my reply</button>
                </div>
              ) : (
                <form className="b2-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
                  <label htmlFor={nameId}>Your name</label>
                  <input id={nameId} className={nameError ? "bad" : undefined} value={name} placeholder="Guest or family name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                  {nameError ? <span className="b2-err">Please enter your name.</span> : null}
                  <div className="b2-yesno">
                    <button type="button" className={attend === "yes" ? "on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Count me in</button>
                    <button type="button" className={attend === "no" ? "on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Can't make it</button>
                  </div>
                  {attend === "yes" ? (
                    <>
                      <span>I'll be at</span>
                      <div className="b2-chips">
                        {cards.map((card) => (
                          <button key={card.key} type="button" className={skipped.includes(card.name) ? undefined : "on"} aria-pressed={!skipped.includes(card.name)} onClick={() => setSkipped((current) => (current.includes(card.name) ? current.filter((item) => item !== card.name) : [...current, card.name]))}>{card.name}</button>
                        ))}
                      </div>
                      <div className="b2-step">
                        <span>Guests</span>
                        <div>
                          <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                          <span aria-live="polite">{guests}</span>
                          <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <label htmlFor={wishId}>A wish for the couple</label>
                  <input id={wishId} value={wish} placeholder="Optional" onChange={(event) => setWish(event.target.value)} />
                  <button type="submit" className="b2-send">Send my RSVP</button>
                </form>
              )}
            </div>
          </section>

          <section className="b2-wishes b2-sand">
            <h2 className="b2-h2">Messages in bottles</h2>
            {shownWishes.length ? (
              <div className="b2-wish-grid">
                {shownWishes.map((item, index) => (
                  <article key={`${item.name}-${index}`} className="b2-wish" style={{ animationDuration: `${4 + (index % 3)}s`, animationDelay: `${index * -0.8}s` }}>
                    <img src={ART.wish} alt="" style={{ transform: `rotate(${index % 2 ? 18 : -14}deg)` }} />
                    <p>{item.text}</p>
                    <span>— {item.name}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="b2-empty">No messages yet.</p>
            )}
          </section>

          <footer className="b2-foot">
            <div className="b2-feet" aria-hidden="true">
              {Array.from({ length: 16 }, (_, index) => (
                <i key={index} style={{ left: index * 46 + 10, top: index % 2 ? 18 : 0, animationDelay: `${index * 0.5}s` }}>👣</i>
              ))}
            </div>
            <em>{first} &amp; {second}</em>
            <small>{dateLine} · {tag}</small>
            <a href={madeWithHref("beach")}>Made with InvitesReady</a>
            <InstagramLink />
          </footer>
        </article>
      )}
    </div>
  );
}
