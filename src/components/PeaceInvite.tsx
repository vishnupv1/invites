import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Sparkle } from "lucide-react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem, type StoryBeat } from "../data/custom";
import { photoNotes } from "../data/photos";
import catalogMeta from "../data/template-meta.json";
import { calendarUrl, formatLongDate } from "../lib/dates";
import { InstagramLink } from "./InstagramLink";
import { Spinner } from "./Loader";
import { useFonts } from "../lib/fonts";
import "./peace.css";

function ScriptFit({ className, children }: { className: string; children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    let frame = 0;
    const fit = () => {
      const styles = getComputedStyle(parent);
      const available = parent.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      if (available <= 0) return;
      el.style.fontSize = "";
      const start = parseFloat(getComputedStyle(el).fontSize);
      const needed = el.scrollWidth;
      el.style.fontSize = needed > available && needed > 0 ? `${Math.max(20, (start * available) / needed)}px` : "";
    };
    fit();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(parent);
    document.fonts.ready.then(fit);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [children]);
  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
export type PeaceTheme = "blush" | "noir" | "sage";

type Wish = { name: string; note: string };

const SAMPLE_NOTES = [
  { name: "Tara", text: "Two of the kindest people I know. Cannot wait to dance at your wedding!" },
  { name: "Uncle Joe", text: "Wishing you a lifetime of adventures and quiet Sunday mornings." },
  { name: "Sameer & Lina", text: "We'll bring the best dance moves. You bring the cake." },
  { name: "Grandma Rose", text: "May your love grow a little more every single day." },
  { name: "The book club", text: "Finally — the plot twist we were all waiting for!" },
];
const FRAME_COLORS = ["#E9B3B0", "#C9D3C4", "#E8C987", "#CFC3D6", "#F4D3CF"];
const CONFETTI = ["#E8C987", "#E9B3B0", "#B8893F", "#FFFFFF", "#F4D3CF"];
const DRESS = ["#F4D3CF", "#E8C987", "#EDE3D8", "#C9D3C4", "#2B2326"];
const MOBILE_PATH = "M40 20C40 160 300 160 300 300S40 440 40 580 300 740 300 880";
const DESK_PATH = "M40 360C180 360 180 180 320 180S480 380 620 360 780 160 960 180";

function peopleOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return [parts[0] || "Maya", parts[1] || ""];
}

function stamp(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (!iso || Number.isNaN(date.getTime())) return { long: iso || "Date to come", dots: iso || "Date" };
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const month = date.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return {
    long: `${weekday} · ${date.getDate()} ${month} ${date.getFullYear()}`,
    dots: `${String(date.getDate()).padStart(2, "0")} · ${String(date.getMonth() + 1).padStart(2, "0")} · ${date.getFullYear()}`,
  };
}

function useClock(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const target = date ? new Date(`${date}T${time || "00:00"}:00`).getTime() : now;
  let diff = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  return [
    { label: "Days", value: String(days).padStart(3, "0") },
    { label: "Hours", value: String(hours).padStart(2, "0") },
    { label: "Minutes", value: String(minutes).padStart(2, "0") },
    { label: "Seconds", value: String(seconds).padStart(2, "0") },
  ];
}

function useDesk(node: HTMLElement | null) {
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    if (!node) return;
    const watch = new ResizeObserver(() => setDesk(node.clientWidth >= 760));
    watch.observe(node);
    setDesk(node.clientWidth >= 760);
    return () => watch.disconnect();
  }, [node]);
  return desk;
}

function storyLayout(beats: StoryBeat[], desk: boolean) {
  if (beats.length === 4) {
    const points = desk
      ? [[40, 360], [320, 180], [620, 360], [960, 180]]
      : [[40, 20], [300, 300], [40, 580], [300, 880]];
    return { width: desk ? 1000 : 350, height: desk ? 560 : 1080, path: desk ? DESK_PATH : MOBILE_PATH, points };
  }
  const width = desk ? 1000 : 350;
  const height = desk ? 420 : Math.max(420, beats.length * 260);
  const points = beats.map((_, index) => {
    if (desk) return [40 + index * ((width - 80) / Math.max(1, beats.length - 1)), index % 2 ? 120 : 280];
    return [index % 2 ? 140 : 20, 20 + index * 240];
  });
  const path = points.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
  return { width, height, path, points };
}

function GiftIcon({ kind }: { kind: "drinks" | "vows" | "party" | "day" }) {
  if (kind === "drinks") {
    return (
      <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden="true">
        <g className="pc-clink-l"><path d="M16 12h20l-3 20a7 7 0 0 1-14 0z" fill="rgba(232,201,135,0.35)" stroke="#E8C987" strokeWidth="1.6" /><path d="M26 39v16M19 58h14" stroke="#E8C987" strokeWidth="1.6" /></g>
        <g className="pc-clink-r"><path d="M34 12h20l-3 20a7 7 0 0 1-14 0z" fill="rgba(232,201,135,0.35)" stroke="#E8C987" strokeWidth="1.6" /><path d="M44 39v16M37 58h14" stroke="#E8C987" strokeWidth="1.6" /></g>
        <circle cx="35" cy="8" r="2" fill="#FFF1CC" style={{ animation: "pc-sparkle 2.4s ease-in-out infinite" }} />
      </svg>
    );
  }
  if (kind === "vows") {
    return (
      <svg width="70" height="60" viewBox="0 0 70 60" aria-hidden="true">
        <g className="pc-ring-l"><circle cx="26" cy="34" r="15" stroke="#E8C987" strokeWidth="3" fill="none" /></g>
        <g className="pc-ring-r"><circle cx="44" cy="34" r="15" stroke="#F4D3CF" strokeWidth="3" fill="none" /><path d="M44 15l4-6h-8z" fill="#FFF1CC" /></g>
      </svg>
    );
  }
  if (kind === "party") {
    return (
      <>
        <svg className="pc-ball" width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          <circle cx="30" cy="30" r="22" fill="#6E6770" />
          <path d="M8 30h44M30 8v44M14 16c10 8 22 8 32 0M14 44c10-8 22-8 32 0" stroke="#CFC7D2" strokeWidth="1.2" fill="none" />
          <circle cx="22" cy="22" r="4" fill="#FFFFFF" fillOpacity="0.7" />
        </svg>
        {[[14, 18, "#E8C987"], [76, 24, "#F4D3CF"], [20, 80, "#FFFFFF"], [80, 76, "#E8C987"]].map(([left, top, color], index) => (
          <span key={index} className="pc-spot" style={{ left, top, background: color as string, animationDelay: `${index * 0.3}s` }} />
        ))}
      </>
    );
  }
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="18" fill="none" stroke="#E8C987" strokeWidth="2" />
      <path d="M30 18v14l8 5" stroke="#E8C987" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PeaceInvite({
  fields,
  theme = "blush",
  motion = true,
  allowMusic = true,
  wishes = [],
  onReply,
  demo = false,
}: {
  fields: InviteFields;
  theme?: PeaceTheme;
  motion?: boolean;
  allowMusic?: boolean;
  wishes?: Wish[];
  onReply?: (reply: { name: string; note: string; attending: boolean }) => void | Promise<void>;
  demo?: boolean;
}) {
  useFonts("Bodoni Moda", "Jost", "Monsieur La Doulaise");
  const pageRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const desk = useDesk(node);
  const [opened, setOpened] = useState(false);
  const [entered, setEntered] = useState(false);
  const [music, setMusic] = useState(false);
  const [shuffle, setShuffle] = useState(0);
  const [toast, setToast] = useState("");
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [meal, setMeal] = useState("veg");
  const [guests, setGuests] = useState(2);
  const [wish, setWish] = useState("");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const pack = packOf("peace", fields.lines);
  const [first, second] = peopleOf(fields.names);
  const when = stamp(fields.date);
  const place = [fields.venue, fields.address].filter(Boolean).join(" · ");
  const clock = useClock(fields.date, fields.time);
  const story = (pack.story ?? []).filter((item) => item.title.trim() || item.text.trim());
  const events = (pack.programme ?? []).filter((item) => item.title.trim());
  const layout = useMemo(() => storyLayout(story, desk), [story, desk]);
  const captions = photoNotes(fields.notes, catalogMeta.peace.shots);
  const photos = (fields.photos ?? []).map((photo, index) => ({ src: photo ? assetUrl(photo) : "", label: FRAME_COLORS[index % FRAME_COLORS.length] }));
  const frames = photos.length ? photos : FRAME_COLORS.map((label) => ({ src: "", label }));
  const notes = wishes.length ? wishes.map((item) => ({ name: item.name, text: item.note })) : demo ? SAMPLE_NOTES : [];
  const wide = desk ? 10 : 7;

  useEffect(() => {
    const id = window.setInterval(() => setShuffle((value) => value + 1), 3200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (music) void audio.play().catch(() => setMusic(false));
    else audio.pause();
  }, [music]);

  function enterInvite() {
    setEntered(true);
    window.setTimeout(() => pageRef.current?.scrollIntoView({ behavior: motion ? "smooth" : "auto" }), 40);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const chosen = events.filter((item) => picked[item.title] !== false).map((item) => item.title);
    const extra = [
      wish.trim(),
      attend === "yes" && chosen.length ? `I'll be at ${chosen.join(", ")}.` : "",
      attend === "yes" ? `Dinner: ${meal}.` : "",
      attend === "yes" ? `${guests} ${guests === 1 ? "guest" : "guests"}.` : "",
    ].filter(Boolean).join(" ");
    setBusy(true);
    try {
      await onReply?.({ name: name.trim(), note: extra, attending: attend === "yes" });
      setDone(true);
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : "Could not send that reply.");
    } finally {
      setBusy(false);
    }
  }

  function addToCalendar(item: ProgrammeItem) {
    const url = calendarUrl({ ...fields, title: item.title, message: [item.kick, item.time, item.text].filter(Boolean).join(" · ") });
    if (url) window.open(url, "_blank", "noopener");
    setToast(`${item.title} added to your calendar.`);
  }

  function Seal() {
    return (
      <>
        {first[0] ?? "M"}
        {second ? <span style={{ fontSize: "0.6em" }}>&amp;</span> : null}
        {second ? second[0] : null}
      </>
    );
  }
  const info = [
    fields.dress ? { title: "Dress code", text: fields.dress, kind: "dress" as const } : null,
    pack.gift ? { title: "Gifts", text: pack.gift, kind: "gift" as const } : null,
    pack.stay ? { title: "Stay", text: pack.stay, kind: "stay" as const } : null,
    pack.airport ? { title: "Getting there", text: pack.airport, kind: "car" as const } : null,
  ].filter((item): item is { title: string; text: string; kind: "dress" | "gift" | "stay" | "car" } => Boolean(item));

  return (
    <div className={`pc${opened ? " is-open" : ""}${entered ? " is-entered" : ""}`} data-theme={theme} data-motion={motion ? "on" : "off"} ref={setNode}>
      <section className="pc-gate" aria-label="Gift">
        {Array.from({ length: wide }, (_, index) => (
          <span key={`bokeh-${index}`} className="pc-bokeh" style={{ left: `${(index * 157) % 86}%`, top: `${(index * 113) % 80}%`, width: 40 + (index % 3) * 30, height: 40 + (index % 3) * 30, animationDelay: `${index * 0.6}s`, animationDuration: `${4 + (index % 3)}s` }} />
        ))}
        {Array.from({ length: desk ? 24 : 16 }, (_, index) => (
          <span key={`dust-${index}`} className="pc-dust" style={{ left: `${(index * 71) % 100}%`, top: `${40 + (index * 7) % 55}%`, ["--dx" as string]: index % 2 ? "20px" : "-20px", animationDelay: `${index * 0.35}s`, animationDuration: `${4 + (index % 4)}s` }} />
        ))}
        {!opened ? (
          <div className="pc-top">
            <span className="pc-kick">A little something for</span>
            <ScriptFit className="pc-guest pc-foil">{fields.detail || "Our guest"}</ScriptFit>
          </div>
        ) : null}
        {opened ? <div className="pc-rays" aria-hidden="true" /> : null}
        {opened
          ? Array.from({ length: desk ? 32 : 24 }, (_, index) => {
              const count = desk ? 32 : 24;
              const angle = (index / count) * Math.PI * 2;
              const reach = (desk ? 420 : 260) * (0.6 + (index % 3) * 0.2);
              return (
                <span
                  key={`pop-${index}`}
                  className="pc-pop"
                  style={{
                    left: "50%",
                    top: "48%",
                    width: 8 + (index % 3) * 4,
                    height: 12 + (index % 2) * 6,
                    borderRadius: index % 4 === 0 ? "50%" : 2,
                    background: CONFETTI[index % CONFETTI.length],
                    ["--px" as string]: `${Math.round(Math.cos(angle) * reach)}px`,
                    ["--py" as string]: `${Math.round(Math.sin(angle) * reach - 120)}px`,
                    ["--pr" as string]: `${index * 47}deg`,
                  }}
                />
              );
            })
          : null}
        <button type="button" className="pc-gift" onClick={() => setOpened(true)} aria-expanded={opened} aria-label={opened ? "Gift opened" : "Open your gift"}>
          <span className="pc-shadow" />
          <span className="pc-shake">
            <span className="pc-front"><span className="pc-band" /><span className="pc-sheen" /></span>
            <span className="pc-lid">
              <span className="pc-band" />
              <svg className="pc-bow" viewBox="0 0 120 80" aria-hidden="true">
                <g className="pc-tail-l"><path d="M56 38L34 78l12-4 6 6 8-40z" fill="var(--ribd)" /></g>
                <g className="pc-tail-r"><path d="M64 38l22 40-12-4-6 6-8-40z" fill="var(--ribd)" /></g>
                <g className="pc-loop-l"><path d="M60 36C44 10 10 6 8 24s30 22 52 12z" fill="var(--rib)" /><path d="M60 36C46 18 22 14 18 24" stroke="var(--ribd)" strokeWidth="2" fill="none" /></g>
                <g className="pc-loop-r"><path d="M60 36c16-26 50-30 52-12s-30 22-52 12z" fill="var(--rib)" /><path d="M60 36c14-18 38-22 42-12" stroke="var(--ribd)" strokeWidth="2" fill="none" /></g>
                <g className="pc-knot"><ellipse cx="60" cy="36" rx="9" ry="10" fill="var(--ribd)" /><ellipse cx="58" cy="33" rx="3" ry="4" fill="#FFF5DA" fillOpacity="0.6" /></g>
              </svg>
              <span className="pc-tagwrap"><span className="pc-string" /><span className="pc-tag">For you</span></span>
            </span>
          </span>
          {[-20, 250, -30, 260, 120, 10].map((left, index) => (
            <span key={left} className="pc-spark" style={{ left, top: [20, 0, 170, 150, -60, -40][index], fontSize: 12 + (index % 3) * 6, animationDelay: `${index * 0.4}s` }} aria-hidden="true"><Sparkle className="glyph" /></span>
          ))}
        </button>
        {!opened ? <span className="pc-hint">Tap the gift to open</span> : null}
        {opened ? (
          <div className="pc-card-pos">
            <div className="pc-card">
              <div className="pc-card-in">
                <span className="pc-seal"><Seal /></span>
                <span className="pc-card-kick">{fields.hosts || "Together with their families"}</span>
                <ScriptFit className="pc-script one pc-foil">{first}</ScriptFit>
                {second ? <span className="pc-amp">&amp;</span> : null}
                {second ? <ScriptFit className="pc-script two pc-foil">{second}</ScriptFit> : null}
                <span className="pc-sub">{fields.title || "are getting married"}</span>
                <span className="pc-rule" />
                <span className="pc-when">{when.long}</span>
                {place ? <span className="pc-where">{place}</span> : null}
                <button type="button" className="pc-cta" onClick={enterInvite}>
                  <span className="pc-shimmer" aria-hidden="true" />
                  <span style={{ position: "relative" }}>Open the invitation</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {entered ? (
        <>
          {allowMusic ? (
            <button
              type="button"
              className={music ? "pc-music on" : "pc-music"}
              aria-pressed={music}
              aria-label={music ? "Pause music" : "Play music"}
              onClick={() => {
                setMusic((value) => !value);
                setToast(music ? "Music paused." : fields.audio ? "Music playing." : "Music on.");
              }}
            >
              <span className="pc-eq" /><span className="pc-eq" /><span className="pc-eq" /><span className="pc-eq" />
            </button>
          ) : null}
          {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop onEnded={() => setMusic(false)} /> : null}

          <section className="pc-hero" ref={pageRef}>
            {Array.from({ length: desk ? 18 : 12 }, (_, index) => (
              <span key={`confetti-${index}`} aria-hidden="true" style={{ position: "absolute", top: 0, left: `${(index * 67) % 100}%`, ["--cy" as string]: "920px", animation: `pc-confetti ${9 + (index % 5) * 2}s linear -${index * 0.8}s infinite`, pointerEvents: "none" }}>
                <span style={{ display: "block", width: 6 + (index % 3) * 3, height: 10 + (index % 2) * 6, borderRadius: index % 4 === 0 ? "50%" : 1, background: CONFETTI[index % CONFETTI.length], animation: `pc-sway ${3 + (index % 3)}s ease-in-out infinite` }} />
              </span>
            ))}
            <div className="pc-polaroid left" aria-hidden="true">{frames[0]?.src ? <img src={frames[0].src} alt="" /> : <span className="pc-photo-label">PHOTO</span>}</div>
            <div className="pc-polaroid right" aria-hidden="true">{frames[1]?.src ? <img src={frames[1].src} alt="" /> : <span className="pc-photo-label">PHOTO</span>}</div>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center", padding: "0 20px" }}>
              <span className="pc-seal pc-hero-seal"><Seal /></span>
              <span className="pc-hero-kick">{fields.hosts || "Together with their families"}</span>
              <ScriptFit className="pc-hero-name one pc-foil">{first}</ScriptFit>
              {second ? <span className="pc-hero-amp">&amp;</span> : null}
              {second ? <ScriptFit className="pc-hero-name two pc-foil">{second}</ScriptFit> : null}
              <span className="pc-track">{(fields.title || "are getting married").toUpperCase()}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span className="pc-line l" /><span className="pc-date">{when.dots}</span><span className="pc-line r" />
              </div>
              {place ? <span className="pc-venue">{place}</span> : null}
            </div>
            <span className="pc-scroll" aria-hidden="true" />
          </section>

          {fields.date ? (
            <section className="pc-block alt">
              <span className="pc-count">Until we say “I do”</span>
              <div className="pc-clock">
                {clock.map((unit) => (
                  <div className="pc-unit" key={unit.label}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {unit.value.split("").map((digit, index) => (
                        <span key={`${unit.label}-${index}-${digit}`} className={Number(digit) % 2 ? "pc-digit a" : "pc-digit b"}>{digit}</span>
                      ))}
                    </div>
                    <small>{unit.label}</small>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {story.length ? (
            <section className="pc-block">
              <h2 className="pc-h">Our story</h2>
              <div className="pc-story" style={{ width: layout.width, height: layout.height, maxWidth: "100%" }}>
                <svg viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
                  <path d={layout.path} />
                </svg>
                <span className="pc-heart" style={{ offsetPath: `path('${layout.path}')` }} aria-hidden="true">
                  <svg width="26" height="24" viewBox="0 0 24 22"><path d="M12 21S2 14 2 7.5A5 5 0 0 1 12 5a5 5 0 0 1 10 2.5C22 14 12 21 12 21z" fill="#C27A78" /></svg>
                </span>
                {story.map((beat, index) => {
                  const [x, y] = layout.points[index] ?? [20, 20];
                  const cardWidth = desk ? 220 : 200;
                  const left = desk ? Math.min(layout.width - cardWidth, Math.max(0, x - cardWidth / 2)) : x < 150 ? 60 : 70;
                  const top = desk ? (y > 250 ? y + 20 : Math.max(0, y - 150)) : y + 16;
                  return (
                    <div key={`${beat.year}-${beat.title}`} className="pc-beat" style={{ left, top, animationDelay: `${0.6 + index * 0.7}s` }}>
                      <b className="pc-foil">{beat.year}</b>
                      <strong>{beat.title}</strong>
                      <span>{beat.text}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {events.length ? (
            <section className="pc-block dark">
              <h2 className="pc-h">The celebration</h2>
              <div className="pc-events">
                {events.map((item, index) => (
                  <article key={`${item.title}-${index}`} className="pc-event" style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="pc-icon"><GiftIcon kind={index === 0 ? "drinks" : index === 1 ? "vows" : index === 2 ? "party" : "day"} /></div>
                    {item.kick ? <small>{item.kick}</small> : null}
                    <strong>{item.title}</strong>
                    <p>{item.time}{item.text ? <><br />{item.text}</> : null}</p>
                    {item.note ? <em>Dress: {item.note}</em> : null}
                    <button type="button" className="pc-cal" onClick={() => addToCalendar(item)}>Add to calendar</button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {frames.length ? (
            <section className="pc-block alt">
              <div className="pc-gallery">
                <div>
                  <h2 className="pc-h" style={desk ? { textAlign: "left" } : undefined}>Moments we love</h2>
                  <p>A few of our favourite frames — tap the stack to shuffle.</p>
                </div>
                <button type="button" className="pc-stack" aria-label="Shuffle photos" onClick={() => setShuffle((value) => value + 1)}>
                  {frames.map((frame, index) => {
                    const count = frames.length;
                    const pos = (index - (shuffle % count) + count) % count;
                    const rot = [-2, 5, -7, 8, -4][index % 5];
                    const caption = captions[index]?.title || "Photo";
                    const about = captions[index]?.text ?? "";
                    return (
                      <span key={`${caption}-${index}`} className="pc-shot" style={{ zIndex: count - pos, transform: `translate(${pos * (desk ? 14 : 8)}px, ${pos * (desk ? 10 : 6)}px) rotate(${rot}deg) scale(${1 - pos * 0.04})` }}>
                        {frame.src ? <img src={frame.src} alt="" /> : <i style={{ background: frame.label }}>Photo</i>}
                        <b>{caption}</b>
                        {about ? <small>{about}</small> : null}
                      </span>
                    );
                  })}
                </button>
              </div>
            </section>
          ) : null}

          {info.length ? (
            <section className="pc-block">
              <h2 className="pc-h">Good to know</h2>
              <div className="pc-info">
                {info.map((item) => (
                  <article key={item.title}>
                    {item.kind === "dress" ? (
                      <div className="pc-swatches">
                        {DRESS.map((color, index) => (
                          <span key={color} className="pc-swatch" style={{ color }}>
                            <i style={{ animationDelay: `${index * 0.3}s` }} />
                            <b style={{ background: color }} />
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {item.kind === "gift" ? (
                      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><rect x="6" y="18" width="32" height="22" rx="3" fill="#E9B3B0" /><g className="pc-lidhop"><rect x="4" y="12" width="36" height="8" rx="2" fill="#C27A78" /><path d="M22 12c-4-8-12-6-10 0M22 12c4-8 12-6 10 0" stroke="#B8893F" strokeWidth="2" fill="none" /></g><rect x="20" y="12" width="4" height="28" fill="#E3C07E" /></svg>
                    ) : null}
                    {item.kind === "stay" ? (
                      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><path d="M8 34V18l14-10 14 10v16z" fill="none" stroke="var(--accent)" strokeWidth="2" /><rect x="18" y="24" width="8" height="10" fill="var(--accent)" /><circle cx="34" cy="10" r="3" fill="#E8C987" style={{ animation: "pc-sparkle 2s ease-in-out infinite" }} /></svg>
                    ) : null}
                    {item.kind === "car" ? (
                      <div style={{ position: "relative", width: 120, height: 44 }}>
                        <svg width="120" height="44" viewBox="0 0 120 44" aria-hidden="true"><path d="M4 36C40 36 40 10 80 10s36 20 36 20" stroke="var(--sub)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" /></svg>
                        <span className="pc-car" aria-hidden="true" />
                      </div>
                    ) : null}
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="pc-block dark">
            <div className="pc-rsvp">
              <div>
                <h2 className="pc-h" style={desk ? { textAlign: "left" } : undefined}>Will you celebrate with us?</h2>
                {fields.rsvpBy ? <span>Kindly reply by {formatLongDate(fields.rsvpBy)}</span> : null}
              </div>
              {done ? (
                <div className="pc-done">
                  {Array.from({ length: 16 }, (_, index) => (
                    <span key={index} aria-hidden="true" style={{ position: "absolute", top: 0, left: `${(index * 37) % 95}%`, width: 7 + (index % 3) * 3, height: 11 + (index % 2) * 5, background: CONFETTI[index % CONFETTI.length], ["--cy" as string]: "520px", animation: `pc-confetti ${2.4 + (index % 4) * 0.4}s ease-in ${(index % 6) * 0.1}s both` }} />
                  ))}
                  <div style={{ position: "relative", width: 140, height: 120 }} aria-hidden="true">
                    <span className="pc-burst" />
                    <svg width="140" height="120" viewBox="0 0 140 120"><g className="pc-cheers-l"><path d="M34 22h32l-5 34a11 11 0 0 1-22 0z" fill="rgba(232,201,135,0.45)" stroke="#B8893F" strokeWidth="2" /><path d="M50 67v36M38 106h24" stroke="#B8893F" strokeWidth="2" /></g><g className="pc-cheers-r"><path d="M74 22h32l-5 34a11 11 0 0 1-22 0z" fill="rgba(232,201,135,0.45)" stroke="#B8893F" strokeWidth="2" /><path d="M90 67v36M78 106h24" stroke="#B8893F" strokeWidth="2" /></g></svg>
                  </div>
                  <h3 className="pc-foil">{attend === "yes" ? "Cheers!" : "We'll miss you"}</h3>
                  <p>{attend === "yes" ? `Thank you, ${name.trim()}! ${guests} ${guests === 1 ? "seat" : "seats"} saved. We can't wait to celebrate together.` : `Thank you for letting us know, ${name.trim()}. You'll be with us in spirit.`}</p>
                  <button type="button" className="pc-again" onClick={() => setDone(false)}>Change my reply</button>
                </div>
              ) : (
                <form className="pc-form" onSubmit={(event) => void submit(event)}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label htmlFor="pc-name">Your name</label>
                    <input id="pc-name" className={nameError ? "bad" : undefined} value={name} placeholder="Guest or family name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                    {nameError ? <span className="pc-err">Please enter your name.</span> : null}
                  </div>
                  <div className="pc-choice">
                    <button type="button" className={attend === "yes" ? "on" : undefined} aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Wouldn't miss it</button>
                    <button type="button" className={attend === "no" ? "on" : undefined} aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Sadly can't</button>
                  </div>
                  {attend === "yes" ? (
                    <>
                      {events.length ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <span className="pc-lab">I'll be at</span>
                          <div className="pc-chips">
                            {events.map((item) => {
                              const on = picked[item.title] !== false;
                              return (
                                <button key={item.title} type="button" className={on ? "on" : undefined} aria-pressed={on} onClick={() => setPicked((current) => ({ ...current, [item.title]: current[item.title] === false }))}>{item.title}</button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <span className="pc-lab">Dinner choice</span>
                        <div className="pc-meals">
                          {[["veg", "Vegetarian"], ["nonveg", "Non-veg"], ["vegan", "Vegan"]].map(([id, label]) => (
                            <button key={id} type="button" className={meal === id ? "on" : undefined} aria-pressed={meal === id} onClick={() => setMeal(id)}>{label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="pc-lab">Guests</span>
                        <div className="pc-step">
                          <button type="button" aria-label="Fewer guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>−</button>
                          <b>{guests}</b>
                          <button type="button" aria-label="More guests" onClick={() => setGuests((value) => Math.min(8, value + 1))}>+</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label htmlFor="pc-wish">A note for the couple</label>
                    <input id="pc-wish" value={wish} placeholder="Optional" onChange={(event) => setWish(event.target.value)} />
                  </div>
                  <button type="submit" className="pc-send" disabled={busy}>
                    <span className="pc-shimmer" aria-hidden="true" />
                    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>{busy ? <Spinner tone="paper" /> : null}{busy ? "Sending…" : "Send RSVP"}</span>
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className="pc-block alt" style={{ alignItems: "stretch" }}>
            <h2 className="pc-h">Love notes</h2>
            {notes.length ? (
            <div className="pc-wishes">
              <div className="pc-marq">
                {[...notes, ...notes].map((item, index) => (
                  <div className="pc-wish" key={`${item.name}-${index}`}>
                    <q>{item.text}</q>
                    <span>— {item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            ) : (
              <p className="pc-empty">Love notes appear here as guests reply.</p>
            )}
          </section>

          <footer className="pc-foot">
            <span className="pc-seal"><Seal /></span>
            {fields.message ? <span className="pc-script pc-foil">{fields.message}</span> : null}
            <small>{when.dots}{pack.caption ? ` · ${pack.caption}` : ""}</small>
            <a href="/">Made with InvitesReady</a>
            <InstagramLink />
          </footer>
        </>
      ) : null}

      {toast ? (
        <div className="pc-toast" role="status">
          <span style={{ flexGrow: 1 }}>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </div>
  );
}
