import { useEffect, useId, useRef, useState } from "react";
import { Flower2, Hand, Heart, Music, Music2, Sparkle, Wine } from "lucide-react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { eventName, packOf } from "../data/custom";
import { photoNotes } from "../data/photos";
import catalogMeta from "../data/template-meta.json";
import { formatTime } from "../lib/dates";
import { InstagramLink } from "./InstagramLink";
import "./vivah.css";

export type VivahTheme = "midnight" | "royal" | "emerald";

type Wish = { name: string; text: string };

const SAMPLE_WISHES: Wish[] = [
  { name: "Ammamma", text: "Deergha sumangali bhava — may you shine together always." },
  { name: "Rohit", text: "Finally! Save me a spot on the Sangeet dance floor." },
  { name: "Sreeja teacher", text: "Wishing you a lifetime of laughter and kindness." },
  { name: "The Pillai family", text: "Endless love and happiness to you both." },
  { name: "Anu & Vishnu", text: "So happy for you two. Cheers to forever!" },
  { name: "Deepak", text: "The best couple I know. Congratulations!" },
];

const PALETTE = ["#D9B26A", "#9B2242", "#1F4D6B", "#2F6B4F", "#E8A0A8"];
const GALLERY = ["#2B3B5C", "#5C3B4F", "#3B4F46", "#5A4A2C", "#3F3560", "#2C4A5A"];
const PETAL_COLORS = ["#E8A0A8", "#F2C6CB", "#D9B26A", "#F6E8C8"];
const DRESS = "Kasavu, silks and jewel tones for the Muhurtham. Go bold and festive for the Sangeet.";
const MANDALA = "M100 4c12 30 12 62 0 96-12-34-12-66 0-96zM196 100c-30 12-62 12-96 0 34-12 66-12 96 0zM100 196c-12-30-12-62 0-96 12 34 12 66 0 96zM4 100c30-12 62-12 96 0-34 12-66 12-96 0zM168 32c-8 30-30 52-68 68 16-38 38-60 68-68zM168 168c-30-8-52-30-68-68 38 16 60 38 68 68zM32 168c8-30 30-52 68-68-16 38-38 60-68 68zM32 32c30 8 52 30 68 68-38-16-60-38-68-68z";

function nums(count: number) {
  return Array.from({ length: count }, (_, index) => index);
}

function dotted(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day} · ${month} · ${year}`;
}

function sealDate(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day} . ${month} . ${year}`;
}

function dayBefore(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  date.setDate(date.getDate() - 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayLabel(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${date.getDate()} ${month}`;
}

function addMinutes(time: string, minutes: number) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeRange(start: string, end: string) {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from.slice(-2) === to.slice(-2)) return `${from.slice(0, -3)} – ${to}`;
  return `${from} – ${to}`;
}

function maps(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function calendarLink(title: string, date: string, time: string, location: string) {
  if (!date) return "";
  const [hourText, minuteText] = (time || "18:00").split(":");
  const hour = String(hourText).padStart(2, "0");
  const minute = String(minuteText || "0").padStart(2, "0");
  const stamp = `${date.replaceAll("-", "")}T${hour}${minute}00`;
  const endHour = String((Number(hour) + 2) % 24).padStart(2, "0");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp}/${date.replaceAll("-", "")}T${endHour}${minute}00`,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function tagOf(first: string, second: string) {
  const clean = (value: string) => value.replace(/[^A-Za-z0-9]/g, "");
  return second ? `#${clean(first)}Weds${clean(second)}` : `#${clean(first)}`;
}

function Mandala() {
  return (
    <svg className="wd-mandala" viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <g stroke="#D9B26A" strokeWidth="0.6">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="70" />
        <circle cx="100" cy="100" r="40" />
        <path d={MANDALA} />
      </g>
    </svg>
  );
}

function Letters({ name, base, step, glow }: { name: string; base: number; step: number; glow: number }) {
  return (
    <div className="wd-row" aria-label={name}>
      {[...name].map((character, index) => (
        <span
          key={`${character}-${index}`}
          className="wd-ch"
          aria-hidden="true"
          style={{ animationDelay: `${(base + index * step).toFixed(2)}s, ${glow.toFixed(2)}s` }}
        >
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </div>
  );
}

function Stars({ count, left, top, delay, wide }: { count: number; left: (index: number) => string; top: (index: number) => string; delay: number; wide?: boolean }) {
  return (
    <span className={wide ? "wd-only-desk" : "wd-only-phone"}>
      {nums(count).map((index) => (
        <span
          key={index}
          className="wd-star"
          aria-hidden="true"
          style={{
            left: left(index),
            top: top(index),
            width: 2 + (index % 3),
            height: 2 + (index % 3),
            animationDuration: `${2 + (index % 5) * 0.5}s`,
            animationDelay: `${index * delay}s`,
          }}
        />
      ))}
    </span>
  );
}

function Flies({ count, left, top, duration, blink = 0, wide }: { count: number; left: (index: number) => string; top: (index: number) => string; duration: (index: number) => string; blink?: number; wide?: boolean }) {
  return (
    <span className={wide ? "wd-only-desk" : "wd-only-phone"}>
      {nums(count).map((index) => (
        <span key={index} className="wd-fly" aria-hidden="true" style={{ left: left(index), top: top(index), animationDuration: duration(index), animationDelay: `-${index}s` }}>
          <span style={{ animationDuration: `${1.6 + (index % 3) * 0.6}s`, animationDelay: blink ? `${index * blink}s` : undefined }} />
        </span>
      ))}
    </span>
  );
}

function Petals({ count, left, size, fall, delay, wide }: { count: number; left: (index: number) => string; size: (index: number) => number; fall: (index: number) => string; delay: number; wide?: boolean }) {
  return (
    <span className={wide ? "wd-only-desk" : "wd-only-phone"}>
      {nums(count).map((index) => (
        <span key={index} className="wd-petal" aria-hidden="true" style={{ left: left(index), animationDuration: fall(index), animationDelay: `-${index * delay}s` }}>
          <span style={{ animationDuration: `${2.5 + (index % 3)}s` }}>
            <svg width={size(index)} height={size(index)} viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={PETAL_COLORS[index % 4]} />
            </svg>
          </span>
        </span>
      ))}
    </span>
  );
}

function Lanterns({ count, left, rise, delay, size, wide }: { count: number; left: (index: number) => string; rise: (index: number) => string; delay: number; size: (index: number) => [number, number]; wide?: boolean }) {
  return (
    <span className={wide ? "wd-only-desk" : "wd-only-phone"}>
      {nums(count).map((index) => {
        const [width, height] = size(index);
        return (
          <span key={index} className="wd-lantern" aria-hidden="true" style={{ left: left(index), animationDuration: rise(index), animationDelay: `-${index * delay}s` }}>
            <span style={{ animationDuration: `${4 + (index % 2)}s, 1.4s` }}>
              <svg width={width} height={height} viewBox="0 0 24 32" aria-hidden="true">
                <path d="M5 4h14l2 20a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="#F2A65A" />
                <path d="M5 4h14l2 20a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="#FFD28A" opacity="0.55" />
                <ellipse cx="12" cy="22" rx="4" ry="3" fill="#FFF3C4" />
                <rect x="8" y="27" width="8" height="3" rx="1" fill="#A5602A" />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

function DoorArt({ side }: { side: "left" | "right" }) {
  const knob = side === "left" ? 176 : 20;
  const deskKnob = side === "left" ? 690 : 30;
  return (
    <>
      <svg className="wd-door-phone" viewBox="0 0 195 844" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <rect x="14" y="14" width="167" height="816" stroke="#D9B26A" strokeWidth="1.2" />
        <path d="M34 830V300a64 64 0 0 1 128 0v530" stroke="#D9B26A" strokeWidth="1.2" />
        <path d="M54 830V310a44 44 0 0 1 88 0v520" stroke="#D9B26A" strokeOpacity="0.5" />
        <circle cx="98" cy="190" r="26" stroke="#D9B26A" />
        <circle cx="98" cy="190" r="14" stroke="#D9B26A" strokeOpacity="0.6" />
        <path d="M98 164v52M72 190h52" stroke="#D9B26A" strokeOpacity="0.5" />
        <circle cx={knob} cy="440" r="8" fill="#D9B26A" />
      </svg>
      <svg className="wd-door-desk" viewBox="0 0 720 900" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <rect x="24" y="24" width="672" height="852" stroke="#D9B26A" strokeWidth="1.4" />
        <path d="M140 876V380a220 220 0 0 1 440 0v496" stroke="#D9B26A" strokeWidth="1.4" />
        <path d="M190 876V390a170 170 0 0 1 340 0v486" stroke="#D9B26A" strokeOpacity="0.5" />
        <circle cx="360" cy="230" r="46" stroke="#D9B26A" />
        <circle cx="360" cy="230" r="26" stroke="#D9B26A" strokeOpacity="0.6" />
        <path d="M360 184v92M314 230h92M328 198l64 64M392 198l-64 64" stroke="#D9B26A" strokeOpacity="0.45" />
        <circle cx={deskKnob} cy="470" r="12" fill="#D9B26A" />
        <path d="M60 60h80M60 60v80M660 60h-80M660 60v80" stroke="#D9B26A" strokeOpacity="0.6" />
      </svg>
    </>
  );
}

function EventIcon({ kind }: { kind: "music" | "fire" | "sparkle" }) {
  if (kind === "music") {
    return (
      <>
        <span className="bob" aria-hidden="true"><Music className="glyph" /></span>
        <span className="note a" aria-hidden="true"><Music2 className="glyph" /></span>
        <span className="note b" aria-hidden="true"><Music className="glyph" /></span>
      </>
    );
  }
  if (kind === "fire") {
    return (
      <svg width="30" height="36" viewBox="0 0 30 36" aria-hidden="true">
        <g className="wd-flame">
          <path d="M15 2c4 8 11 12 11 21a11 11 0 0 1-22 0c0-6 4-9 6-13 1 4 3 6 5 6-2-5-2-9 0-14z" fill="#F2A65A" />
          <path d="M15 14c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3-1-2-1-4 0-7z" fill="#FFE08A" />
        </g>
      </svg>
    );
  }
  return (
    <>
      <span aria-hidden="true"><Wine className="glyph" /></span>
      <span className="spark a" aria-hidden="true"><Sparkle className="glyph" /></span>
      <span className="spark b" aria-hidden="true"><Sparkle className="glyph" /></span>
    </>
  );
}

function MusicButton({ className, playing, onClick }: { className: string; playing: boolean; onClick: () => void }) {
  return (
    <button type="button" className={className} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"} onClick={onClick}>
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className={playing ? "wd-eq on" : "wd-eq"} style={playing ? { animationDuration: `${0.6 + index * 0.15}s`, animationDelay: `${index * 0.1}s` } : undefined} />
      ))}
    </button>
  );
}

const PHONE_FIRE = [[80, 90], [290, 70], [190, 180]] as const;
const DESK_FIRE = [[140, 110], [560, 80], [360, 220], [700, 240]] as const;
const FIRE_COLORS = ["#D9B26A", "#F6E8C8", "#E8A0A8", "#FFE9A8", "#9FD3F2"];

function Fireworks({ points, sparks, radius, step, size, duration, delay, wide }: { points: readonly (readonly [number, number])[]; sparks: number; radius: number; step: number; size: number; duration: string; delay: number; wide?: boolean }) {
  const bits = points.flatMap(([x, y], burst) =>
    nums(sparks).map((spark) => {
      const angle = (spark / sparks) * Math.PI * 2;
      const reach = radius + (spark % 3) * step;
      return { x, y, burst, spark, dx: Math.round(Math.cos(angle) * reach), dy: Math.round(Math.sin(angle) * reach) };
    }),
  );
  return (
    <span className={wide ? "wd-only-desk" : "wd-only-phone"}>
      {bits.map((bit) => (
        <span
          key={`${bit.burst}-${bit.spark}`}
          className="wd-fw"
          aria-hidden="true"
          style={{
            left: `${(bit.x / (wide ? 800 : 360)) * 100}%`,
            top: bit.y,
            width: size,
            height: size,
            background: FIRE_COLORS[(bit.spark + bit.burst) % 5],
            boxShadow: `0 0 ${wide ? 10 : 8}px ${FIRE_COLORS[(bit.spark + bit.burst) % 5]}`,
            ["--x" as string]: `${bit.dx}px`,
            ["--y" as string]: `${bit.dy}px`,
            animationDuration: duration,
            animationDelay: `${bit.burst * delay}s`,
          }}
        />
      ))}
    </span>
  );
}

export function VivahInvite({
  fields,
  theme = "midnight",
  quiet = false,
  guest = "Rohit & family",
  wishes = [],
  onReply,
  motion = true,
}: {
  fields: InviteFields;
  theme?: VivahTheme;
  quiet?: boolean;
  guest?: string;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void;
  motion?: boolean;
}) {
  const sealId = useId().replace(/:/g, "");
  const nameId = useId();
  const wishId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [added, setAdded] = useState<Wish[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const pack = packOf("vivah", fields.lines);
  const captions = photoNotes(fields.notes, catalogMeta.vivah.shots);
  const story = (pack.story ?? []).filter((item) => item.title.trim() || item.text.trim());
  const sangeetTime = pack.sangeetTime || "18:00";
  const sangeetVenue = pack.sangeetVenue || "";
  const sangeetName = typeof pack.sangeetName === "string" ? pack.sangeetName.trim() : "";
  const ceremonyName = eventName(fields.lines, "ceremonyName", "Muhurtham");
  const receptionName = eventName(fields.lines, "receptionName", "Reception");
  const parts = fields.names.split(/\s+&\s+/);
  const first = parts[0] || "";
  const second = parts.slice(1).join(" & ");
  const place = fields.address || "";
  const dateLine = dotted(fields.date);
  const couple = second ? `${first} & ${second}` : first;
  const mono = `${(first[0] || "").toUpperCase()}${second ? ` & ${(second[0] || "").toUpperCase()}` : ""}`;
  const hashtag = tagOf(first, second);
  const seal = `${first} WEDS ${second || first} • ${sealDate(fields.date)} • `.toUpperCase();
  const target = fields.date ? new Date(`${fields.date}T${fields.time || "10:30"}:00+05:30`).getTime() : now;
  let diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  const countdown = [
    [String(days), "Days", "Days"],
    [String(hours).padStart(2, "0"), "Hours", "Hours"],
    [String(minutes).padStart(2, "0"), "Mins", "Minutes"],
    [String(seconds).padStart(2, "0"), "Secs", "Seconds"],
  ] as const;

  const sangeetDate = dayBefore(fields.date);
  const muhurthamWhere = [fields.venue, fields.address].filter(Boolean).join(", ");
  const receptionWhere = [fields.receptionVenue, fields.receptionAddress].filter(Boolean).join(", ");
  const celebrations = [
    ...(sangeetName ? [{ kind: "music" as const, kicker: "The evening before", name: sangeetName, when: `${dayLabel(sangeetDate)} · ${formatTime(sangeetTime)}`, venue: sangeetVenue, date: sangeetDate, time: sangeetTime }] : []),
    { kind: "fire" as const, kicker: "The sacred moment", name: ceremonyName, when: `${dayLabel(fields.date)} · ${timeRange(fields.time || "10:30", addMinutes(fields.time || "10:30", 45))}`, venue: muhurthamWhere, date: fields.date, time: fields.time || "10:30" },
    ...(fields.receptionVenue ? [{ kind: "sparkle" as const, kicker: "Let’s celebrate", name: receptionName, when: `${dayLabel(fields.date)} · ${formatTime(fields.receptionTime || "19:00")} onwards`, venue: receptionWhere, date: fields.date, time: fields.receptionTime || "19:00" }] : []),
  ];

  const dress = fields.dress || DRESS;
  const replyDate = fields.rsvpBy ? new Date(`${fields.rsvpBy}T12:00:00`) : null;
  const replyBy = replyDate && !Number.isNaN(replyDate.getTime())
    ? `${replyDate.getDate()} ${replyDate.toLocaleDateString("en-US", { month: "long" })} ${replyDate.getFullYear()}`
    : "";
  const liveWishes = [...added, ...wishes.map((item) => ({ name: item.name, text: item.note })), ...SAMPLE_WISHES];
  const half = Math.ceil(liveWishes.length / 2);
  const rowA = liveWishes.slice(0, half);
  const rowB = liveWishes.slice(half).length ? liveWishes.slice(half) : liveWishes.slice(0, 1);
  const yes = attend === "yes";
  const picked = celebrations.map((item) => item.name).filter((name) => !skipped.includes(name));

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
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
    if (wish.trim()) setAdded((current) => [{ name: name.trim(), text: wish.trim() }, ...current]);
    setDone(true);
    setWish("");
    onReply?.({
      name: name.trim(),
      attending: yes,
      note: [wish.trim(), yes ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "", yes && picked.length ? picked.join(", ") : ""].filter(Boolean).join(" · "),
    });
  }

  const doneTitle = yes ? "See you there!" : "We’ll miss you";
  const doneText = yes
    ? `Thank you, ${name.trim()}! ${guests} ${guests === 1 ? "seat" : "seats"}${picked.length ? ` saved for the ${picked.join(", ")}` : " saved"}.`
    : `Thank you for letting us know, ${name.trim()}. Your blessings mean the world.`;

  return (
    <div className={`vivah ${theme}`} data-motion={motion ? "on" : "off"}>
      {entered ? (
        <div className="wd-event">
          {fields.audio ? (
            <>
              <MusicButton className="wd-music" playing={playing} onClick={toggleMusic} />
              <audio ref={audioRef} src={assetUrl(fields.audio)} onEnded={() => setPlaying(false)} />
            </>
          ) : null}
          <nav className="wd-nav" aria-label="Invitation">
            <span className="wd-nav-brand">{(first[0] || "").toUpperCase()} <span>&amp;</span> {(second[0] || "").toUpperCase()}</span>
            <div className="wd-nav-links">
              <a href="#story">Our story</a>
              <a href="#events">Celebrations</a>
              <a href="#moments">Moments</a>
              <a href="#blessings">Blessings</a>
            </div>
            <div className="wd-nav-actions">
              {fields.audio ? <MusicButton className="wd-music-desk" playing={playing} onClick={toggleMusic} /> : null}
              <a className="wd-rsvp-link" href="#rsvp">RSVP</a>
            </div>
          </nav>

          <section className="wd-hero">
            <div className="wd-moon" aria-hidden="true"><span /></div>
            <Stars count={14} delay={0.27} left={(index) => `${(((index * 53) % 370 + 10) / 390) * 100}%`} top={(index) => `${(((index * 89) % 740 + 10) / 780) * 100}%`} />
            <Stars wide count={30} delay={0.2} left={(index) => `${(((index * 197) % 1400 + 20) / 1440) * 100}%`} top={(index) => `${(((index * 113) % 860 + 10) / 900) * 100}%`} />
            <Lanterns count={6} delay={2.6} left={(index) => `${((20 + index * 60) / 390) * 100}%`} rise={(index) => `${14 + (index % 3) * 4}s`} size={(index) => [18 + (index % 3) * 6, 24 + (index % 3) * 8]} />
            <Lanterns wide count={12} delay={2.2} left={(index) => `${((40 + index * 116) / 1440) * 100}%`} rise={(index) => `${16 + (index % 4) * 4}s`} size={(index) => [20 + (index % 3) * 8, 27 + (index % 3) * 10]} />
            <Flies count={10} duration={(index) => `${7 + (index % 4) * 2}s`} left={(index) => `${(((index * 71) % 340 + 20) / 390) * 100}%`} top={(index) => `${(((index * 131) % 640 + 80) / 780) * 100}%`} />
            <Flies wide count={18} duration={(index) => `${8 + (index % 4) * 2}s`} left={(index) => `${(((index * 151) % 1360 + 40) / 1440) * 100}%`} top={(index) => `${(((index * 97) % 700 + 120) / 900) * 100}%`} />
            <Mandala />
            <span className="wd-kicker">॥ Shubh Vivah ॥</span>
            <span className="wd-bless">With the blessings of our families</span>
            <div className="wd-hero-names">
              <Letters name={first} base={0.6} step={0.09} glow={2} />
              {second ? <span className="wd-hero-amp">&amp;</span> : null}
              {second ? <Letters name={second} base={1.5} step={0.09} glow={2.9} /> : null}
            </div>
            <svg className="wd-ornament phone" width="220" height="30" viewBox="0 0 220 30" fill="none" aria-hidden="true">
              <path d="M4 15C40 15 60 2 90 15s50 0 60-6c10 6 30 6 40 6h26M110 4l6 11-6 11-6-11z" stroke="#D9B26A" strokeWidth="1.4" />
            </svg>
            <svg className="wd-ornament desk" width="420" height="40" viewBox="0 0 420 40" fill="none" aria-hidden="true">
              <path d="M4 20C70 20 110 4 170 20s80 0 40-10c-10 14 30 16 40 10s30-20 60-8c30 12 70 8 104 8M210 6l8 14-8 14-8-14z" stroke="#D9B26A" strokeWidth="1.5" />
            </svg>
            <span className="wd-honour">{fields.title || "request the honour of your presence"}</span>
            <span className="wd-hero-date">{dateLine}</span>
            <span className="wd-hash">{hashtag}</span>
            <Petals count={12} delay={1.1} left={(index) => `${(((index * 37) % 360) / 390) * 100}%`} size={(index) => 12 + (index % 3) * 5} fall={(index) => `${8 + (index % 5) * 1.5}s`} />
            <Petals wide count={18} delay={0.9} left={(index) => `${(((index * 79) % 1400) / 1440) * 100}%`} size={(index) => 14 + (index % 3) * 6} fall={(index) => `${9 + (index % 5) * 1.5}s`} />
          </section>

          <section className="wd-count" aria-label="Countdown">
            <div className="wd-count-copy">
              <span className="wd-count-label">The countdown begins</span>
              <span className="wd-count-sub">until the Muhurtham</span>
            </div>
            <div className="wd-count-grid">
              {countdown.map(([value, short, long]) => (
                <div key={short} className="wd-count-item">
                  <div className="wd-count-box">
                    <span />
                    <strong key={value}>{value}</strong>
                  </div>
                  <em><span className="s">{short}</span><span className="l">{long}</span></em>
                </div>
              ))}
            </div>
          </section>

          <section className="wd-story" id="story">
            <h2 className="wd-h">Our love story</h2>
            <div className="wd-story-phone">
              <svg className="wd-story-line" viewBox="0 0 2 600" preserveAspectRatio="none" aria-hidden="true">
                <path d="M1 0v600" stroke="#D9B26A" strokeWidth="2" />
              </svg>
              {story.map((beat, index) => (
                <div key={beat.year} className={index % 2 === 0 ? "wd-story-row left" : "wd-story-row right"}>
                  <div className="wd-story-card" style={{ animationDelay: `${0.4 + index * 0.5}s` }}>
                    <div className="year">{beat.year}</div>
                    <div className="title">{beat.title}</div>
                    <p>{beat.text}</p>
                  </div>
                  <span className="wd-heart" style={{ animationDelay: `${index * 0.4}s` }} aria-hidden="true"><Heart className="glyph" fill="currentColor" /></span>
                </div>
              ))}
            </div>
            <div className="wd-story-desk">
              <svg className="wd-story-curve" viewBox="0 0 1200 30" fill="none" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 15C200 0 400 30 600 15s400-30 600 0" stroke="#D9B26A" strokeWidth="2" />
              </svg>
              {story.map((beat, index) => (
                <article key={beat.year} style={{ animationDelay: `${0.4 + index * 0.4}s, ${index * -2}s` }}>
                  <span className="wd-heart" style={{ animationDelay: `${index * 0.4}s` }} aria-hidden="true"><Heart className="glyph" fill="currentColor" /></span>
                  <div className="year">{beat.year}</div>
                  <div className="title">{beat.title}</div>
                  <p>{beat.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="wd-events" id="events">
            <h2 className="wd-h">The celebrations</h2>
            <div className="wd-event-grid">
              {celebrations.map((item, index) => (
                <div key={item.name} className="wd-frame" style={{ animationDuration: `${5 + index}s, 0.8s`, animationDelay: `0s, ${index * 0.2}s` }}>
                  <div className="wd-event-in">
                    <div className="wd-event-head">
                      <div className="wd-icon"><EventIcon kind={item.kind} /></div>
                      <div>
                        <div className="wd-kicker-sm">{item.kicker}</div>
                        <div className="wd-event-name">{item.name}</div>
                      </div>
                    </div>
                    <div className="wd-when"><strong>{item.when}</strong><br />{item.venue}</div>
                    <div className="wd-actions">
                      <a className="wd-gold" href={maps(item.venue)} target="_blank" rel="noreferrer">Directions</a>
                      <a className="wd-ghost" href={calendarLink(`${couple} — ${item.name}`, item.date, item.time, item.venue)} target="_blank" rel="noreferrer">Calendar</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="wd-moments" id="moments">
            <div className="wd-moments-copy">
              <h2 className="wd-h">Moments</h2>
              <p>{fields.message || "From our pre-wedding shoot on the backwaters of Alleppey — a few favourite frames before the big day."}</p>
              <span>Six photos · always turning</span>
            </div>
            <div className="wd-stage">
              <div className="wd-ring">
                {GALLERY.map((color, index) => {
                  const photo = fields.photos[index];
                  const caption = captions[index];
                  return (
                    <div
                      key={color}
                      className="wd-photo"
                      style={{ ["--i" as string]: index, backgroundColor: color, backgroundImage: photo ? `url(${assetUrl(photo)})` : undefined }}
                    >
                      <span>{caption?.title || `Photo ${index + 1}`}</span>
                      {caption?.text ? <small>{caption.text}</small> : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <span className="wd-moments-note">{pack.caption || "Pre-wedding shoot · Alleppey"}</span>
          </section>

          {dress ? (
            <section className="wd-dress">
              <div className="wd-dress-copy">
                <h2 className="wd-h">Dress in colour</h2>
                <p>
                  {dress}
                  {dress === DRESS ? <span className="brighter"> — the brighter the better.</span> : null}
                </p>
              </div>
              <div className="wd-swatches">
                {PALETTE.map((color, index) => (
                  <span key={color} className="wd-swatch" style={{ background: color, animationDelay: `${index * 0.2}s` }} aria-hidden="true" />
                ))}
              </div>
            </section>
          ) : null}

          <section className="wd-rsvp" id="rsvp">
            <Stars count={8} delay={0.35} left={(index) => `${(((index * 61) % 360 + 10) / 390) * 100}%`} top={(index) => `${(((index * 113) % 600 + 10) / 700) * 100}%`} />
            <Stars wide count={14} delay={0.3} left={(index) => `${(((index * 211) % 1400 + 20) / 1440) * 100}%`} top={(index) => `${(((index * 137) % 640 + 10) / 700) * 100}%`} />
            <div className="wd-rsvp-intro">
              <h2 className="wd-h">Will you join us?</h2>
              <p>{replyBy ? `Kindly reply by ${replyBy}` : "Kindly reply"}</p>
              <svg className="wd-rsvp-wave" width="200" height="60" viewBox="0 0 200 60" fill="none" aria-hidden="true">
                <path d="M10 30c30-20 60-20 90 0s60 20 90 0" stroke="#D9B26A" strokeWidth="1.5" strokeDasharray="1200" style={{ animation: "wd-d-draw 3s ease-out both" }} />
                <circle cx="100" cy="30" r="5" fill="#E8A0A8" />
              </svg>
            </div>
            <div className="wd-rsvp-body">
              {done ? (
                <div className="wd-done">
                  <Fireworks points={PHONE_FIRE} sparks={14} radius={60} step={18} size={6} duration="1.3s" delay={0.5} />
                  <Fireworks wide points={DESK_FIRE} sparks={16} radius={80} step={24} size={7} duration="1.4s" delay={0.4} />
                  <span className="wd-only-phone">
                    {nums(8).map((index) => (
                      <span key={index} className="wd-float" aria-hidden="true" style={{ left: `${10 + index * 12}%`, color: ["#E8A0A8", "#D9B26A", "#F2C6CB"][index % 3], fontSize: 14 + (index % 3) * 6, animationDuration: `${3 + (index % 3) * 0.7}s`, animationDelay: `${index * 0.35}s` }}><Heart className="glyph" fill="currentColor" /></span>
                    ))}
                  </span>
                  <span className="wd-only-desk">
                    {nums(10).map((index) => (
                      <span key={index} className="wd-float" aria-hidden="true" style={{ left: `${6 + index * 9.5}%`, color: ["#E8A0A8", "#D9B26A", "#F2C6CB"][index % 3], fontSize: 16 + (index % 3) * 7, animationDuration: `${3.2 + (index % 3) * 0.7}s`, animationDelay: `${index * 0.3}s` }}><Heart className="glyph" fill="currentColor" /></span>
                    ))}
                  </span>
                  <span className="bloom" aria-hidden="true"><Flower2 className="glyph" /></span>
                  <h3>{doneTitle}</h3>
                  <p>{doneText}</p>
                  <button type="button" onClick={() => setDone(false)}>Change my reply</button>
                </div>
              ) : (
                <div className="wd-form-frame">
                  <form className="wd-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
                    <div className="wd-rsvp-top">
                      <div className="wd-field">
                        <label htmlFor={nameId}>Your name</label>
                        <input id={nameId} className={nameError ? "bad" : undefined} value={name} placeholder="Guest or family name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                        {nameError ? <span className="err">Please enter your name.</span> : null}
                      </div>
                      <div className="wd-field">
                        <span>Attending?</span>
                        <div className="wd-attend">
                          <button type="button" className={yes ? "wd-opt on" : "wd-opt"} aria-pressed={yes} onClick={() => setAttend("yes")}>Joyfully yes</button>
                          <button type="button" className={yes ? "wd-opt" : "wd-opt on"} aria-pressed={!yes} onClick={() => setAttend("no")}>Sadly no</button>
                        </div>
                      </div>
                    </div>
                    {yes ? (
                      <div className="wd-rsvp-extra">
                        <div className="wd-field">
                          <span>I&apos;ll be at</span>
                          <div className="wd-chips">
                            {celebrations.map((item) => (
                              <button
                                key={item.name}
                                type="button"
                                className={skipped.includes(item.name) ? "wd-chip-btn" : "wd-chip-btn on"}
                                aria-pressed={!skipped.includes(item.name)}
                                onClick={() => setSkipped((current) => (current.includes(item.name) ? current.filter((name) => name !== item.name) : [...current, item.name]))}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="wd-guests">
                          <span>Guests</span>
                          <div className="wd-stepper">
                            <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                            <strong aria-live="polite">{guests}</strong>
                            <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className="wd-field">
                      <label htmlFor={wishId}>A blessing for the couple</label>
                      <input id={wishId} value={wish} placeholder="Optional" onChange={(event) => setWish(event.target.value)} />
                    </div>
                    <button className="wd-send" type="submit">Send my RSVP</button>
                  </form>
                </div>
              )}
            </div>
          </section>

          <section className="wd-blessings" id="blessings">
            <h2 className="wd-h">Blessings</h2>
            {[rowA, rowB].map((row, index) => (
              <div key={index} className="wd-marq">
                <div className={index === 0 ? "wd-marq-track" : "wd-marq-track back"}>
                  {[...row, ...row].map((item, card) => (
                    <div key={`${item.name}-${card}`} className="wd-wish">
                      <q>{item.text}</q>
                      <span>— {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <footer className="wd-foot">
            <div className="wd-foot-names">
              <strong>{couple}</strong>
              <span>With love, {fields.hosts}</span>
            </div>
            <div className="wd-seal">
              <svg viewBox="0 0 170 170" aria-hidden="true">
                <defs>
                  <path id={sealId} d="M85 85m-66 0a66 66 0 1 1 132 0a66 66 0 1 1-132 0" />
                </defs>
                <text fontFamily="Jost, sans-serif" fontSize="11" letterSpacing="3.2" fill="#E6C893">
                  <textPath href={`#${sealId}`}>{seal}</textPath>
                </text>
              </svg>
              <div className="wd-seal-in">{(first[0] || "").toUpperCase()}<i><Heart className="glyph" fill="currentColor" /></i>{(second[0] || "").toUpperCase()}</div>
            </div>
            <span className="wd-foot-love">With love, {fields.hosts}</span>
            <a className="wd-made" href="/">Made with InvitesReady</a>
            <InstagramLink />
          </footer>
        </div>
      ) : (
        <div className="wd-open">
          <div className="wd-moon" aria-hidden="true"><span /></div>
          {quiet ? null : (
            <>
              <Stars count={16} delay={0.27} left={(index) => `${(((index * 53) % 370 + 10) / 390) * 100}%`} top={(index) => `${(((index * 97) % 820 + 10) / 844) * 100}%`} />
              <Stars wide count={30} delay={0.2} left={(index) => `${(((index * 197) % 1400 + 20) / 1440) * 100}%`} top={(index) => `${(((index * 113) % 860 + 10) / 900) * 100}%`} />
              <Flies count={12} blink={0.3} duration={(index) => `${7 + (index % 4) * 2}s`} left={(index) => `${(((index * 71) % 340 + 20) / 390) * 100}%`} top={(index) => `${(((index * 131) % 700 + 80) / 844) * 100}%`} />
              <Flies wide count={20} blink={0.25} duration={(index) => `${8 + (index % 4) * 2}s`} left={(index) => `${(((index * 151) % 1360 + 40) / 1440) * 100}%`} top={(index) => `${(((index * 97) % 700 + 120) / 900) * 100}%`} />
            </>
          )}
          <div className="wd-open-copy">
            <Mandala />
            {open ? (
              <div className="wd-open-card">
                <span className="wd-burst" aria-hidden="true" />
                <span className="wd-dear">Dear {guest}, with love</span>
                <div className="wd-open-names">
                  <Letters name={first} base={1.1} step={0.1} glow={2.6} />
                  {second ? <span className="wd-open-amp">&amp;</span> : null}
                  {second ? <Letters name={second} base={2.1} step={0.1} glow={3.6} /> : null}
                </div>
                <span className="wd-invite-line">invite you to celebrate their wedding</span>
                <span className="wd-open-date">{dateLine}{place ? <span className="wd-place"> · {place}</span> : null}</span>
                {quiet ? null : (
                  <button type="button" className="wd-enter" onClick={() => setEntered(true)}>Enter the celebration</button>
                )}
              </div>
            ) : null}
          </div>
          {quiet ? null : (
            <>
              <Petals count={12} delay={1.1} left={(index) => `${(((index * 37) % 360) / 390) * 100}%`} size={(index) => 12 + (index % 3) * 5} fall={(index) => `${8 + (index % 5) * 1.5}s`} />
              <Petals wide count={20} delay={0.8} left={(index) => `${(((index * 71) % 1400) / 1440) * 100}%`} size={(index) => 14 + (index % 3) * 6} fall={(index) => `${9 + (index % 5) * 1.5}s`} />
            </>
          )}
          <button type="button" className={open ? "wd-doors is-open" : "wd-doors"} aria-label={open ? "Doors opened" : "Open the doors"} aria-expanded={open} onClick={() => setOpen(true)}>
            <span className="wd-door left"><DoorArt side="left" /></span>
            <span className="wd-door right"><DoorArt side="right" /></span>
            {open ? null : (
              <span className="wd-chip">
                <span className="wd-mono">{mono}</span>
                <span className="wd-tap"><span className="hand" aria-hidden="true"><Hand className="glyph" /></span><span className="phone">Tap to open the doors</span><span className="desk">Click to open the doors</span></span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
