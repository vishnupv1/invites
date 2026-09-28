import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import "./thiruvizha.css";

export type ThiruvizhaTheme = "rani" | "ivory" | "emerald";
export type ThiruvizhaLang = "en" | "ta" | "both";

type Wish = { name: string; note: string };

const SHOTS = ["The couple", "Muhurtham", "Oonjal", "Virundhu"];
const PETALS = [
  { left: "4%", delay: "0s", dur: "11s", color: "#fff6e4", size: 7 },
  { left: "12%", delay: "1.4s", dur: "13s", color: "#f0c14a", size: 9 },
  { left: "22%", delay: "0.6s", dur: "10s", color: "#fff", size: 6 },
  { left: "31%", delay: "2.2s", dur: "12s", color: "#ffb15a", size: 8 },
  { left: "41%", delay: "0.2s", dur: "14s", color: "#fff6e4", size: 7 },
  { left: "52%", delay: "1.8s", dur: "11s", color: "#f0c14a", size: 10 },
  { left: "63%", delay: "0.9s", dur: "13s", color: "#fff", size: 6 },
  { left: "72%", delay: "2.6s", dur: "10s", color: "#ffd27a", size: 8 },
  { left: "81%", delay: "0.4s", dur: "12s", color: "#fff6e4", size: 7 },
  { left: "90%", delay: "1.6s", dur: "15s", color: "#f0c14a", size: 9 },
  { left: "18%", delay: "3.1s", dur: "12s", color: "#fff", size: 5 },
  { left: "57%", delay: "3.4s", dur: "11s", color: "#ffb15a", size: 8 },
];
const VERSES = [
  { en: "May your home be full of light", ta: "உங்கள் இல்லம் ஒளியால் நிறையட்டும்" },
  { en: "Long and blessed be your union", ta: "தீர்க்க சுமங்கலி பவ" },
  { en: "Auspicious always", ta: "சுபமங்களம்" },
  { en: "Come, the thiruvizha awaits", ta: "வாருங்கள், திருவிழா காத்திருக்கிறது" },
];

const SCALE = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66];

function peopleOf(names: string) {
  return names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
}

function tamilDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ta-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function tamilTime(value: string) {
  return formatTime(value).replace("AM", "காலை").replace("PM", "மாலை");
}

function mapsHref(venue: string, address: string, lat: string, lng: string) {
  if (lat && lng) return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  const query = [venue, address].filter(Boolean).join(", ");
  return query ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}` : "";
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
    { en: "Days", ta: "நாட்கள்", value: String(Math.floor(diff / 86400000)) },
    { en: "Hours", ta: "மணி", value: pad(Math.floor(diff / 3600000) % 24) },
    { en: "Minutes", ta: "நிமிடங்கள்", value: pad(Math.floor(diff / 60000) % 60) },
    { en: "Seconds", ta: "வினாடிகள்", value: pad(Math.floor(diff / 1000) % 60) },
  ];
}

function startNadaswaram(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);

  const drone = (freq: number, amount: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 520;
    gain.gain.value = amount;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    return osc;
  };

  const drones = [drone(130.81, 0.34), drone(196, 0.2)];
  const voice = ctx.createOscillator();
  const voiceGain = ctx.createGain();
  const voiceFilter = ctx.createBiquadFilter();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  voice.type = "sawtooth";
  voiceFilter.type = "bandpass";
  voiceFilter.frequency.value = 980;
  voiceFilter.Q.value = 5;
  voiceGain.gain.value = 0;
  lfo.frequency.value = 5.5;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(voice.detune);
  voice.connect(voiceFilter);
  voiceFilter.connect(voiceGain);
  voiceGain.connect(master);
  voice.start();
  lfo.start();

  let step = 0;
  const tick = () => {
    const now = ctx.currentTime;
    voice.frequency.setValueAtTime(SCALE[step % SCALE.length], now);
    voiceGain.gain.cancelScheduledValues(now);
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(0.55, now + 0.06);
    voiceGain.gain.setValueAtTime(0.5, now + 0.34);
    voiceGain.gain.linearRampToValueAtTime(0, now + 0.46);
    step += 1;
  };
  tick();
  const id = window.setInterval(tick, 520);
  return () => {
    window.clearInterval(id);
    drones.forEach((osc) => osc.stop());
    voice.stop();
    lfo.stop();
    master.disconnect();
  };
}

function Line({ en, ta, lang, className }: { en: string; ta: string; lang: ThiruvizhaLang; className?: string }) {
  const pair = className ? `${className} tv-pair` : "tv-pair";
  if (lang === "en") return en ? <span className={className}>{en}</span> : null;
  if (lang === "ta") return <span className={className} lang="ta">{ta || en}</span>;
  return (
    <span className={pair}>
      {en ? <span>{en}</span> : null}
      {ta ? <span lang="ta">{ta}</span> : null}
    </span>
  );
}

function Kolam() {
  return (
    <svg className="tv-kolam" viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="100" cy="100" r="10" pathLength="1" />
        <circle cx="100" cy="100" r="34" pathLength="1" />
        <circle cx="100" cy="100" r="62" pathLength="1" />
        <circle cx="100" cy="100" r="86" pathLength="1" />
        <path pathLength="1" d="M100 14c22 22 22 50 0 72-22-22-22-50 0-72z" />
        <path pathLength="1" d="M186 100c-22 22-50 22-72 0 22-22 50-22 72 0z" />
        <path pathLength="1" d="M100 186c-22-22-22-50 0-72 22 22 22 50 0 72z" />
        <path pathLength="1" d="M14 100c22-22 50-22 72 0-22 22-50 22-72 0z" />
        <path pathLength="1" d="M40 40c20 8 32 28 28 48-20-4-36-20-28-48z" />
        <path pathLength="1" d="M160 40c-20 8-32 28-28 48 20-4 36-20 28-48z" />
        <path pathLength="1" d="M160 160c-8-20-28-32-48-28 4 20 20 36 48 28z" />
        <path pathLength="1" d="M40 160c8-20 28-32 48-28-4 20-20 36-48 28z" />
      </g>
    </svg>
  );
}

function Gopuram() {
  return (
    <svg className="tv-gopuram" viewBox="0 0 220 280" aria-hidden="true">
      <path d="M110 8l14 22h-28z" fill="#f0c14a" />
      <path d="M78 30h64l10 28H68z" fill="#7a1830" stroke="#f0c14a" strokeWidth="2" />
      <path d="M64 58h92l12 36H52z" fill="#8d1d38" stroke="#f0c14a" strokeWidth="2" />
      <path d="M46 94h128l14 46H32z" fill="#6d142c" stroke="#f0c14a" strokeWidth="2" />
      <path d="M28 140h164l16 58H12z" fill="#541022" stroke="#f0c14a" strokeWidth="2" />
      <path d="M12 198h196v64H12z" fill="#3d0c18" stroke="#f0c14a" strokeWidth="2" />
      <rect x="96" y="214" width="28" height="48" rx="8" fill="#1a060c" />
      {[70, 110, 150].map((x) => (
        <rect key={x} x={x - 8} y="158" width="16" height="22" rx="4" fill="#f0c14a" className="tv-window" />
      ))}
      {[88, 132].map((x) => (
        <rect key={x} x={x - 6} y="112" width="12" height="16" rx="3" fill="#f0c14a" className="tv-window" />
      ))}
    </svg>
  );
}

function Lamp() {
  return (
    <span className="tv-lamp" aria-hidden="true">
      <i className="tv-flame" />
      <svg viewBox="0 0 40 54">
        <path d="M20 16c6 0 10 5 10 10v4H10v-4c0-5 4-10 10-10z" fill="#f0c14a" />
        <path d="M8 30h24l-3 16H11z" fill="#e7c56a" />
        <path d="M6 48h28v4H6z" fill="#c9982e" />
      </svg>
    </span>
  );
}

function MusicButton({ playing, onClick, builtin }: { playing: boolean; onClick: () => void; builtin: boolean }) {
  return (
    <button type="button" className={playing ? "tv-music on" : "tv-music"} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"} onClick={onClick}>
      <span className="tv-eq" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>
        <b>{playing ? "Playing" : "Music"}</b>
        <small>{builtin ? "நாதஸ்வரம்" : "Your song"}</small>
      </span>
    </button>
  );
}

function LangSwitch({ lang, onChange }: { lang: ThiruvizhaLang; onChange: (lang: ThiruvizhaLang) => void }) {
  const options: { id: ThiruvizhaLang; label: string }[] = [
    { id: "en", label: "English" },
    { id: "ta", label: "தமிழ்" },
    { id: "both", label: "Both" },
  ];
  return (
    <div className="tv-langs" role="group" aria-label="Language">
      {options.map((option) => (
        <button key={option.id} type="button" aria-pressed={lang === option.id} lang={option.id === "ta" ? "ta" : undefined} onClick={() => onChange(option.id)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Decor() {
  return (
    <>
      <div className="tv-petals" aria-hidden="true">
        {PETALS.map((petal) => (
          <span key={`${petal.left}-${petal.delay}`} style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.dur }}>
            <i style={{ background: petal.color, width: petal.size, height: petal.size }} />
          </span>
        ))}
      </div>
      <div className="tv-thoranam" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 0.12}s` }} />)}
      </div>
    </>
  );
}

export function ThiruvizhaInvite({
  fields,
  theme = "rani",
  motion = true,
  lang: langProp,
  onLang,
  allowMusic = true,
  wishes = [],
  onReply,
}: {
  fields: InviteFields;
  theme?: ThiruvizhaTheme;
  motion?: boolean;
  lang?: ThiruvizhaLang;
  onLang?: (lang: ThiruvizhaLang) => void;
  allowMusic?: boolean;
  wishes?: Wish[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
}) {
  const pack = packOf("thiruvizha", fields.lines);
  const people = peopleOf(fields.names);
  const tamilPeople = peopleOf(fields.detail);
  const photos = (fields.photos ?? []).map((photo) => (photo ? assetUrl(photo) : "")).filter(Boolean);
  const rites = (pack.programme ?? []).filter((item) => item.title.trim() || item.tamil?.trim());
  const clock = useCountdown(fields.date, fields.time);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopSynth = useRef<(() => void) | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const playingRef = useRef(false);
  const [langState, setLangState] = useState<ThiruvizhaLang>(langProp ?? "both");
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [attending, setAttending] = useState(true);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [guests, setGuests] = useState(2);
  const [sent, setSent] = useState(false);
  const [nameError, setNameError] = useState(false);
  const lang = langProp ?? langState;
  const builtin = !fields.audio;
  const directions = mapsHref(fields.venue, fields.address, fields.lat, fields.lng);
  const calendar = calendarUrl(fields);
  const inviteEn = fields.title || "With love, we invite you";
  const inviteTa = pack.inviteTamil || "அன்புடன் அழைக்கிறோம்";
  const hostsTa = pack.hostsTamil || "";
  const noteTa = pack.tamilNote || "";
  const ceremony = pack.ceremonyName || "Muhurtham";
  const reception = pack.receptionName || "Virundhu";
  const ceremonyTa = ceremony.toLowerCase() === "muhurtham" ? "முகூர்த்தம்" : ceremony;
  const receptionTa = reception.toLowerCase() === "virundhu" ? "விருந்து" : reception;
  const verseLoop = [...VERSES, ...VERSES];

  useEffect(() => {
    return () => {
      stopSynth.current?.();
      void ctxRef.current?.close();
    };
  }, []);

  if (!allowMusic && playing) {
    playingRef.current = false;
    setPlaying(false);
  }

  useEffect(() => {
    if (allowMusic) return;
    stopSynth.current?.();
    stopSynth.current = null;
    audioRef.current?.pause();
  }, [allowMusic]);

  function setLang(next: ThiruvizhaLang) {
    setLangState(next);
    onLang?.(next);
  }

  function stopMusic() {
    playingRef.current = false;
    stopSynth.current?.();
    stopSynth.current = null;
    audioRef.current?.pause();
    setPlaying(false);
  }

  async function toggleMusic() {
    if (!allowMusic) return;
    if (playingRef.current) {
      stopMusic();
      return;
    }
    playingRef.current = true;
    if (fields.audio && audioRef.current) {
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        stopMusic();
      }
      return;
    }
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    await ctx.resume();
    if (!playingRef.current) return;
    stopSynth.current = startNadaswaram(ctx);
    setPlaying(true);
  }

  function enter() {
    setOpen(true);
    window.setTimeout(() => setEntered(true), motion ? 1100 : 0);
  }

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" });
  }

  async function reply(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const extra = [note.trim(), attending ? `${guests} ${guests === 1 ? "guest" : "guests"}` : ""].filter(Boolean).join(" · ");
    await onReply?.({ name: name.trim(), note: extra, attending });
    setSent(true);
  }

  const showReception = Boolean(fields.receptionVenue || fields.receptionTime);
  const whenEn = [formatLongDate(fields.date), formatTime(fields.time)].filter(Boolean).join(" · ");
  const whenTa = [fields.date ? tamilDate(fields.date) : "", fields.time ? tamilTime(fields.time) : ""].filter(Boolean).join(" · ");

  let world: ReactNode = null;
  if (open) {
    world = (
      <div className="tv-world">
        <header className="tv-nav">
          <button type="button" className="tv-brand" onClick={() => jump("tv-top")}>திருவிழா</button>
          <nav>
            <button type="button" onClick={() => jump("tv-day")}>Muhurtham</button>
            <button type="button" onClick={() => jump("tv-rites")}>Rituals</button>
            {photos.length ? <button type="button" onClick={() => jump("tv-frames")}>Frames</button> : null}
            <button type="button" onClick={() => jump("tv-reply")}>Reply</button>
          </nav>
          <div className="tv-nav-end">
            <LangSwitch lang={lang} onChange={setLang} />
            {allowMusic ? <MusicButton playing={playing} onClick={toggleMusic} builtin={builtin} /> : null}
          </div>
        </header>

        <div className="tv-bar">
          <LangSwitch lang={lang} onChange={setLang} />
          {allowMusic ? <MusicButton playing={playing} onClick={toggleMusic} builtin={builtin} /> : null}
        </div>

        <section className="tv-hero" id="tv-top">
          <Kolam />
          <p className="tv-kicker"><Line en="Sri Ganapathi thunai" ta="ஸ்ரீ கணபதி துணை" lang={lang} /></p>
          {fields.hosts || hostsTa ? <p className="tv-hosts"><Line en={fields.hosts} ta={hostsTa} lang={lang} /></p> : null}
          <h1 className="tv-names">
            {(lang === "ta" ? (tamilPeople.length ? tamilPeople : people) : people).map((person, index) => (
              <span key={`${person}-${index}`}>
                {index ? <i>{lang === "ta" ? "மற்றும்" : "&"}</i> : null}
                <b>{person}</b>
              </span>
            ))}
          </h1>
          {lang === "both" && tamilPeople.length ? <p className="tv-names-ta" lang="ta">{tamilPeople.join(" & ")}</p> : null}
          <p className="tv-invite"><Line en={inviteEn} ta={inviteTa} lang={lang} /></p>
          <p className="tv-when"><Line en={whenEn} ta={whenTa} lang={lang} /></p>
          <div className="tv-lamps" aria-hidden="true"><Lamp /><Lamp /><Lamp /></div>
        </section>

        <section className="tv-day tv-reveal" id="tv-day">
          <article>
            <p><Line en="The ceremony" ta="திருமணம்" lang={lang} /></p>
            <h2><Line en={ceremony} ta={ceremonyTa} lang={lang} /></h2>
            <strong><Line en={whenEn} ta={whenTa} lang={lang} /></strong>
            <span>{[fields.venue, fields.address].filter(Boolean).join(" · ")}</span>
            <div className="tv-links">
              {directions ? <a href={directions} target="_blank" rel="noreferrer"><Line en="Directions" ta="வழி" lang={lang} /></a> : null}
              {calendar ? <a href={calendar} target="_blank" rel="noreferrer"><Line en="Add to calendar" ta="நாட்காட்டியில் சேர்" lang={lang} /></a> : null}
            </div>
          </article>
          {showReception ? (
            <article>
              <p><Line en="The feast" ta="விருந்து" lang={lang} /></p>
              <h2><Line en={reception} ta={receptionTa} lang={lang} /></h2>
              <strong>{fields.receptionTime ? <Line en={formatTime(fields.receptionTime)} ta={tamilTime(fields.receptionTime)} lang={lang} /> : null}</strong>
              <span>{[fields.receptionVenue, fields.receptionAddress].filter(Boolean).join(" · ")}</span>
            </article>
          ) : null}
        </section>

        {fields.message || noteTa ? (
          <section className="tv-blessing tv-reveal">
            <Lamp />
            <Line en={fields.message} ta={noteTa} lang={lang} />
          </section>
        ) : null}

        {rites.length ? (
          <section className="tv-rites tv-reveal" id="tv-rites">
            <h2><Line en="The day’s rituals" ta="இன்றைய சடங்குகள்" lang={lang} /></h2>
            <div>
              {rites.map((rite, index) => (
                <article key={`${rite.title}-${index}`} style={{ animationDelay: `${index * 0.12}s` }}>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <h3><Line en={rite.title} ta={rite.tamil || rite.title} lang={lang} /></h3>
                  <time>{rite.time}</time>
                  {lang !== "ta" && rite.text ? <p>{rite.text}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {fields.dress ? (
          <section className="tv-dress tv-reveal">
            <p><Line en="Attire" ta="உடை" lang={lang} /></p>
            <p>{fields.dress}</p>
          </section>
        ) : null}

        {photos.length ? (
          <section className="tv-frames tv-reveal" id="tv-frames">
            <h2><Line en="Frames from the day" ta="விழாவின் காட்சிகள்" lang={lang} /></h2>
            <div>
              {photos.map((src, index) => (
                <figure key={src} style={{ animationDelay: `${index * 0.15}s` }}>
                  <img src={src} alt="" />
                  <figcaption>{SHOTS[index] ?? "Photograph"}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="tv-count tv-reveal" aria-label="Countdown">
          {clock.map((part) => (
            <div key={part.en}>
              <strong>{part.value}</strong>
              <Line en={part.en} ta={part.ta} lang={lang} />
            </div>
          ))}
        </section>

        <section className="tv-reply tv-reveal" id="tv-reply">
          <div>
            <h2><Line en="Will you be there?" ta="நீங்கள் வருகிறீர்களா?" lang={lang} /></h2>
            {fields.rsvpBy ? <p><Line en={`Kindly reply by ${formatLongDate(fields.rsvpBy)}`} ta={`${tamilDate(fields.rsvpBy)}க்குள் பதில் அளியுங்கள்`} lang={lang} /></p> : null}
          </div>
          {sent ? (
            <p className="tv-thanks"><Line en="Your blessing is with us." ta="உங்கள் ஆசி எங்களுடன்." lang={lang} /></p>
          ) : (
            <form onSubmit={(event) => void reply(event)}>
              <label>
                <Line en="Your name" ta="உங்கள் பெயர்" lang={lang} />
                <input value={name} aria-invalid={nameError} onChange={(event) => { setName(event.target.value); setNameError(false); }} />
              </label>
              <div className="tv-choice">
                <button type="button" aria-pressed={attending} onClick={() => setAttending(true)}><Line en="Joyfully joining" ta="மகிழ்ச்சியுடன் வருகிறோம்" lang={lang} /></button>
                <button type="button" aria-pressed={!attending} onClick={() => setAttending(false)}><Line en="Can't make it" ta="வர இயலாது" lang={lang} /></button>
              </div>
              {attending ? (
                <div className="tv-guests">
                  <span><Line en="Guests" ta="விருந்தினர்" lang={lang} /></span>
                  <button type="button" onClick={() => setGuests((count) => Math.max(1, count - 1))} aria-label="Fewer guests">−</button>
                  <b>{guests}</b>
                  <button type="button" onClick={() => setGuests((count) => Math.min(8, count + 1))} aria-label="More guests">+</button>
                </div>
              ) : null}
              <label>
                <Line en="A blessing" ta="ஒரு ஆசி" lang={lang} />
                <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <button type="submit" className="tv-send"><Line en="Send your blessing" ta="ஆசி அனுப்புங்கள்" lang={lang} /></button>
            </form>
          )}
        </section>

        {wishes.length ? (
          <section className="tv-wishes tv-reveal">
            <h2><Line en="Blessings" ta="ஆசிகள்" lang={lang} /></h2>
            <ul>
              {wishes.map((wish, index) => (
                <li key={`${wish.name}-${index}`}><q>{wish.note}</q><span>{wish.name}</span></li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="tv-marquee" aria-hidden="true">
          <div>
            {verseLoop.map((verse, index) => (
              <span key={index}><b>{verse.en}</b><i lang="ta">{verse.ta}</i></span>
            ))}
          </div>
        </div>

        <footer className="tv-foot">
          <Kolam />
          <p>{people.join(" & ") || fields.names}</p>
          {tamilPeople.length ? <p lang="ta">{tamilPeople.join(" & ")}</p> : null}
          <small>திருவிழா</small>
        </footer>
      </div>
    );
  }

  return (
    <article className={entered ? "tv is-entered" : "tv"} data-theme={theme} data-motion={motion ? "on" : "off"} data-lang={lang}>
      <Decor />
      {allowMusic && fields.audio ? <audio ref={audioRef} className="tv-audio" src={assetUrl(fields.audio)} loop onEnded={() => { playingRef.current = false; setPlaying(false); }} /> : null}
      {world}
      {entered ? null : (
        <section className={open ? "tv-gate is-open" : "tv-gate"}>
          <div className="tv-doors" aria-hidden="true">
            <span className="left" />
            <span className="right" />
          </div>
          <div className="tv-gate-art">
            <Gopuram />
            <Kolam />
            <div className="tv-bells" aria-hidden="true"><i /><i /></div>
          </div>
          <div className="tv-gate-copy">
            <div className="tv-gate-tools">
              <LangSwitch lang={lang} onChange={setLang} />
              {allowMusic ? <MusicButton playing={playing} onClick={toggleMusic} builtin={builtin} /> : null}
            </div>
            <p className="tv-kicker"><Line en="Sri Ganapathi thunai" ta="ஸ்ரீ கணபதி துணை" lang={lang} /></p>
            {fields.hosts || hostsTa ? <p className="tv-hosts"><Line en={fields.hosts} ta={hostsTa} lang={lang} /></p> : null}
            <h1 className="tv-names">
              {(lang === "ta" ? (tamilPeople.length ? tamilPeople : people) : people).map((person, index) => (
                <span key={`${person}-${index}`}>
                  {index ? <i>{lang === "ta" ? "மற்றும்" : "&"}</i> : null}
                  <b>{person}</b>
                </span>
              ))}
            </h1>
            {lang === "both" && tamilPeople.length ? <p className="tv-names-ta" lang="ta">{tamilPeople.join(" & ")}</p> : null}
            <p className="tv-invite"><Line en={inviteEn} ta={inviteTa} lang={lang} /></p>
            <p className="tv-when"><Line en={whenEn} ta={whenTa} lang={lang} /></p>
            <button type="button" className="tv-enter" onClick={enter}>
              <Line en="Enter the thiruvizha" ta="திருவிழாவிற்கு வாருங்கள்" lang={lang} />
            </button>
          </div>
        </section>
      )}
    </article>
  );
}
