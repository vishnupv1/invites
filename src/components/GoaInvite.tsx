import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { assetUrl } from "../api";
import { packOf, type ProgrammeItem } from "../data/custom";
import { calendarUrl } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./goa.css";

type Reply = { name: string; note: string; attending: boolean };

const SCENES = ["/goa/mehendi.webp", "/goa/sangeet.webp", "/goa/after.webp", "/goa/wedding.webp"];
const BACKGROUNDS = ["#FBE7DC", "#1E2A47", "#2A1D45", "#F8DCCF"];
const PETALS: { x: string; y: string; endx: string; endy: string; s: string; spin: string; turn: string; flip: number; dur: string; delay: string }[] = [
  { x: "30%", y: "-6%", endx: "42%", endy: "78%", s: "14px", spin: "-24deg", turn: "80deg", flip: 1, dur: "5.4s", delay: "0s" },
  { x: "36%", y: "-10%", endx: "46%", endy: "74%", s: "11px", spin: "16deg", turn: "-70deg", flip: -1, dur: "6s", delay: "-1.6s" },
  { x: "42%", y: "-4%", endx: "48%", endy: "80%", s: "16px", spin: "48deg", turn: "90deg", flip: 1, dur: "4.8s", delay: "-3.1s" },
  { x: "33%", y: "-14%", endx: "44%", endy: "76%", s: "12px", spin: "-60deg", turn: "60deg", flip: 1, dur: "5.8s", delay: "-4.2s" },
  { x: "58%", y: "-8%", endx: "54%", endy: "76%", s: "13px", spin: "20deg", turn: "-80deg", flip: -1, dur: "5.2s", delay: "-0.6s" },
  { x: "65%", y: "-4%", endx: "52%", endy: "80%", s: "15px", spin: "-18deg", turn: "70deg", flip: 1, dur: "6.2s", delay: "-2.2s" },
  { x: "72%", y: "-12%", endx: "56%", endy: "74%", s: "11px", spin: "70deg", turn: "-90deg", flip: -1, dur: "4.6s", delay: "-3.6s" },
  { x: "61%", y: "-16%", endx: "50%", endy: "78%", s: "17px", spin: "-40deg", turn: "50deg", flip: 1, dur: "5.6s", delay: "-1.1s" },
  { x: "28%", y: "-8%", endx: "40%", endy: "76%", s: "10px", spin: "30deg", turn: "-50deg", flip: -1, dur: "5s", delay: "-2.4s" },
  { x: "39%", y: "-12%", endx: "47%", endy: "79%", s: "13px", spin: "-8deg", turn: "40deg", flip: 1, dur: "6.4s", delay: "-0.8s" },
  { x: "68%", y: "-6%", endx: "55%", endy: "77%", s: "12px", spin: "12deg", turn: "-60deg", flip: -1, dur: "5.3s", delay: "-2.8s" },
  { x: "74%", y: "-14%", endx: "53%", endy: "75%", s: "10px", spin: "-55deg", turn: "75deg", flip: 1, dur: "6.1s", delay: "-4.4s" },
];

const DOTS = [
  ["#F2C94C", "#9CC28A", "#F4A6A0"],
  ["#F5ECD7", "#D8B76A", "#B08D57"],
  ["#C86BD8", "#F08BB9", "#5B4BA0"],
  ["#F6C9C4", "#F9E1D2", "#E8B98F"],
];
const LANTERNS = {
  m: [
    [6, 46, 20, 16, 0],
    [43, 56, -24, 19, -2.6],
    [80, 66, 28, 22, -5.2],
    [25, 46, -32, 25, -7.8],
    [62, 56, 36, 16, -10.4],
    [7, 66, -40, 19, -13],
    [44, 46, 44, 22, -15.6],
  ],
  d: [
    [6, 64, 20, 16, 0],
    [43, 80, -24, 19, -2.6],
    [80, 96, 28, 22, -5.2],
    [25, 64, -32, 25, -7.8],
    [62, 80, 36, 16, -10.4],
    [7, 96, -40, 19, -13],
    [44, 64, 44, 22, -15.6],
    [81, 80, -48, 25, -18.2],
    [26, 96, 52, 16, -20.8],
  ],
} as const;

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function when(date: string) {
  const day = new Date(`${date}T12:00:00`);
  return Number.isNaN(day.getTime()) ? null : day;
}

function pairOf(names: string) {
  const parts = names.split(/\s+&\s+/).map((part) => part.trim()).filter(Boolean);
  return { first: parts[0] || "Ananya", second: parts[1] || "Rohan" };
}

function ribbon(date: string) {
  const day = when(date);
  if (!day) return date;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(day.getDate())} · ${pad(day.getMonth() + 1)} · ${day.getFullYear()}`;
}

function spanLabel(date: string, kicks: string[]) {
  const day = when(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" });
  const year = day.getFullYear();
  const days = kicks
    .map((kick) => kick.match(/(\d{1,2})\s+[A-Za-z]/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);
  const unique = [...new Set(days)].sort((a, b) => a - b);
  if (unique.length > 1) return `${unique[0]} – ${unique[unique.length - 1]} ${month} ${year}`;
  return `${day.getDate()} ${month} ${year}`;
}

function formalDate(date: string) {
  const day = when(date);
  if (!day) return date;
  const month = day.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
  return `${day.getDate()} ${month} ${day.getFullYear()}`;
}

function eventIso(kick: string, fallback: string) {
  const match = kick.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return fallback;
  const day = new Date(`${match[2]} ${match[1]}, ${match[3]} 12:00:00`);
  if (Number.isNaN(day.getTime())) return fallback;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

function clock(text: string) {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return "16:30";
  let hour = Number(match[1]);
  const minute = match[2] || "00";
  const suffix = match[3].toUpperCase();
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function eventCalendar(item: ProgrammeItem, names: string, fallbackDate: string) {
  return calendarUrl({
    event: "marriage",
    hostEmail: "",
    hosts: "",
    names,
    title: item.title || "Celebration",
    detail: "",
    date: eventIso(item.kick || "", fallbackDate),
    time: clock(item.time || ""),
    venue: item.text || "",
    address: "",
    message: item.note || "",
    dress: "",
    rsvpBy: "",
    receptionTime: "",
    receptionVenue: "",
    receptionAddress: "",
    photos: [],
    audio: "",
    lat: "",
    lng: "",
    lines: "",
  });
}

export function GoaInvite({
  fields,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Pinyon Script", "Cinzel", "Cormorant Garamond");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nameId = useId();
  const noteId = useId();
  const ribbonId = useId().replace(/:/g, "");
  const [desk, setDesk] = useState(false);
  const [phase, setPhase] = useState<"closed" | "go" | "open">("closed");
  const [seen, setSeen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState(false);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");

  const pack = packOf("goa", fields.lines);
  const events: ProgrammeItem[] = pack.programme?.length
    ? pack.programme
    : [{ kick: formalDate(fields.date), title: "The Wedding", time: fields.time, text: fields.venue, note: fields.dress }];
  const parents = pack.people ?? [];
  const names = pairOf(fields.names);
  const range = spanLabel(fields.date, events.map((item) => item.kick || ""));
  const place = fields.venue || "The Palm Cove";
  const region = (() => {
    const parts = fields.address.split(",").map((part) => part.trim()).filter(Boolean);
    const last = parts[parts.length - 1] || "Goa";
    return /goa/i.test(last) ? "Goa" : last;
  })();
  const photo = fields.photos[0] ? assetUrl(fields.photos[0]) : "/goa/couple.webp";
  const flight = pack.facts ?? [];
  const fromCode = flight.find((item) => item.label === "From")?.value || "BOM";
  const toCode = flight.find((item) => item.label === "To")?.value || "GOI";
  const flightNo = flight.find((item) => item.label === "Flight")?.value || "IR 1701";
  const seat = flight.find((item) => item.label === "Seat")?.value || "1A";
  const mapQuery = fields.lat && fields.lng ? `${fields.lat},${fields.lng}` : [fields.venue, fields.address].filter(Boolean).join(", ");
  const travelArt = desk
    ? { pass: ["5.3%", "7.8%", "42%"], card: ["32.9%", "42.2%", "58%"], hand: ["78.9%", "72.8%", "30%"] }
    : { pass: ["0%", "0%", "55%"], card: ["24.6%", "43.4%", "73%"], hand: ["76.9%", "69.7%", "38.5%"] };

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const measure = () => setDesk(node.clientWidth >= 1100);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const fit = fitRef.current;
    if (!stage || !fit) return;
    const apply = () => {
      const width = stage.clientWidth;
      const embedded = Boolean(stage.closest(".ir-preview, .ir-play"));
      const wide = !embedded && width >= 1100;
      const windowH = window.visualViewport?.height ?? window.innerHeight;
      let visible = windowH;
      if (embedded) {
        visible = stage.closest(".ir-preview-stage")?.clientHeight || 844;
      } else {
        let box = stage.parentElement;
        while (box) {
          const overflowY = getComputedStyle(box).overflowY;
          const clips = overflowY === "hidden" || overflowY === "clip" || overflowY === "auto" || overflowY === "scroll";
          if (clips && box.clientHeight > 80 && box.clientHeight < windowH - 4) {
            visible = box.clientHeight;
            break;
          }
          box = box.parentElement;
        }
      }
      const designW = wide ? 1440 : 390;
      const designH = wide ? 900 : 844;
      const scale = Math.min(width / designW, visible / designH);
      stage.style.height = `${visible}px`;
      fit.style.width = `${designW}px`;
      fit.style.height = `${designH}px`;
      fit.style.transform = `translate(-50%, -50%) scale(${scale})`;
      const root = rootRef.current;
      if (root) root.style.height = root.classList.contains("is-open") ? "" : `${visible}px`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage);
    window.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("resize", apply);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "closed") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const node = travelRef.current;
    if (!node || phase !== "open") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setSeen(true);
    }, { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [phase]);

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)); }, []);

  function openGates() {
    if (phase !== "closed") return;
    if (reduced()) {
      setPhase("open");
      setNow(Date.now());
      return;
    }
    setPhase("go");
    timers.current.push(window.setTimeout(() => setPhase("open"), 4300));
  }

  function replay() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPhase("closed");
    setSeen(false);
    rootRef.current?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  }

  async function submit() {
    if (!name.trim()) {
      setNameErr(true);
      return;
    }
    const yes = attend === "yes";
    const chosen = events.filter((_, index) => picked[index] !== false).map((item) => item.title);
    const note = [
      msg.trim(),
      yes ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
      yes && chosen.length ? `Joining: ${chosen.join(", ")}.` : "",
    ].filter(Boolean).join(" · ");
    try {
      await onReply?.({ name: name.trim(), note, attending: yes });
    } catch {
      setToast("Could not send that reply. Try again.");
      return;
    }
    setDone(true);
  }

  const target = new Date(`${fields.date || "2027-01-17"}T${fields.time || "16:30"}:00+05:30`).getTime();
  let left = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(left / 86400);
  left %= 86400;
  const countdown = [
    [days, "DAYS"],
    [Math.floor(left / 3600), "HOURS"],
    [Math.floor((left % 3600) / 60), "MINUTES"],
    [left % 60, "SECONDS"],
  ] as const;
  const hero = desk
    ? { sky: [1440, 0, -838], gull: [380, -400, 90, "2000px"], crest: [300, 26, 64, 11], heroTop: 330, name: 78, date: 16, venue: 12, resort: [1440, 0, 330], leaf: [427, 780, 293, 720, 120], palm: [430, -70, -50], intro: [150, 56], tap: 820 }
    : { sky: [475, -42, 0], gull: [210, -220, 64, "700px"], crest: [232, 30, 50, 8.5], heroTop: 262, name: 50, date: 12, venue: 10, resort: [440, -25, 396], leaf: [328, 600, -133, 195, 244], palm: [190, -46, -24], intro: [96, 40], tap: 780 };
  const lanterns = desk ? LANTERNS.d : LANTERNS.m;
  const firstName = name.trim().split(" ")[0] || "friend";

  return (
    <div ref={rootRef} className={`gg ${desk ? "d" : "m"}${phase !== "closed" ? " go" : ""}${phase === "open" ? " is-open" : ""}`}>
      <section className="stage" ref={stageRef}>
        <div className="gg-fit" ref={fitRef}>
          <div className="scene">
            <img className="sky" src="/goa/sky.webp" alt="" style={{ width: hero.sky[0], left: hero.sky[1], top: hero.sky[2] }} />
            <img className="gulls" src="/goa/gulls.webp" alt="" style={{ width: hero.gull[0], left: hero.gull[1], top: hero.gull[2], ["--fx" as string]: hero.gull[3] }} />
            <div className="crestW" style={{ width: hero.crest[0], top: hero.crest[1], transform: "translateX(-50%)" }}>
              <img src="/goa/crest.webp" alt="" />
              <span className="ini">{names.first[0]?.toUpperCase()} <span>&amp;</span> {names.second[0]?.toUpperCase()}</span>
              <svg className="rib" viewBox="0 0 200 48" aria-hidden="true">
                <path id={ribbonId} d="M 22 6 Q 100 42 178 6" fill="none" />
                <text>
                  <textPath href={`#${ribbonId}`} startOffset="50%" textAnchor="middle" textLength="148" lengthAdjust="spacing">{ribbon(fields.date)}</textPath>
                </text>
              </svg>
            </div>
            <div className="hero" style={{ top: hero.heroTop }}>
              <span className="nm" style={{ fontSize: hero.name }}>{names.first}</span>
              <span className="w">WEDS</span>
              <span className="nm" style={{ fontSize: hero.name }}>{names.second}</span>
              <span className="dt" style={{ fontSize: hero.date }}>{range}</span>
              <span className="vn" style={{ fontSize: hero.venue }}>{place} · {region}</span>
            </div>
            <img className="resort" src="/goa/resort.webp" alt="" style={{ width: hero.resort[0], left: hero.resort[1], top: hero.resort[2] }} />
          </div>
          <div className="gateL">
            {desk ? (
              <>
                <img className="pillar l" src="/goa/pillar.webp" alt="" style={{ left: -28, top: 0, width: 480, height: 900 }} />
                <img className="pillar r" src="/goa/pillar.webp" alt="" style={{ left: 988, top: 0, width: 480, height: 900 }} />
              </>
            ) : null}
            <div className="leaf l" style={{ left: hero.leaf[2], top: hero.leaf[4], width: hero.leaf[0], height: hero.leaf[1] }}><img src="/goa/gate.webp" alt="" /></div>
            <div className="leaf r" style={{ left: hero.leaf[3], top: hero.leaf[4], width: hero.leaf[0], height: hero.leaf[1] }}><img src="/goa/gate.webp" alt="" /></div>
          </div>
          <img className="palm l" src="/goa/palm.webp" alt="" style={{ width: hero.palm[0], left: hero.palm[1], top: hero.palm[2] }} />
          <img className="palm r" src="/goa/palm.webp" alt="" style={{ width: hero.palm[0], right: hero.palm[1], top: hero.palm[2] }} />
          <div className="intro" style={{ top: hero.intro[0] }}>
            <span className="sub">YOU ARE INVITED TO</span>
            <span className="nm" style={{ fontSize: hero.intro[1] }}>{fields.names}’s</span>
            <span className="sub">WEDDING IN {region.toUpperCase()}</span>
          </div>
          {phase === "closed" ? <button type="button" className="tap" style={{ top: hero.tap }} onClick={openGates}>TAP TO OPEN THE GATES</button> : null}
          {phase === "closed" ? <button type="button" className="hit" onClick={openGates} aria-label="Open the gates" /> : null}
          {phase === "open" ? <a className="scrollHint" href="#gg-travel">SCROLL ↓</a> : null}
        </div>
      </section>

      <section className="sec travel" id="gg-travel">
        <div className="txt">
          <span className="k">Pack your bags</span>
          <h2>We’re getting married in {region}!</h2>
          <p className="lead">{fields.message}</p>
        </div>
        <div ref={travelRef} className={`art rv${seen ? " in" : ""}`}>
          <div className="pass" style={{ left: travelArt.pass[0], top: travelArt.pass[1], width: travelArt.pass[2] }}>
            <img loading="lazy" src="/goa/pass.webp" alt="Boarding pass" />
            <span className="gg-ink big" style={{ left: "51.2%", top: "22.8%" }}>{toCode === "GOI" ? "GOA" : toCode}<br /><span style={{ fontSize: "0.3em", letterSpacing: "0.2em" }}>{fromCode} ✈ {toCode}</span></span>
            <span className="gg-ink mid" style={{ left: "58.2%", top: "49.4%" }}>{fields.names}</span>
            <span className="gg-ink mid" style={{ left: "60.2%", top: "55.9%" }}>{range}</span>
            <span className="gg-ink mid" style={{ left: "42.6%", top: "63.3%" }}>{flightNo}</span>
            <span className="gg-ink mid" style={{ left: "76.3%", top: "61.7%" }}>{seat}</span>
            <span className="gg-ink tiny" style={{ left: "58.2%", top: "86.1%" }}>ADMIT YOU<br />&amp; YOUR LOVED ONES</span>
          </div>
          <div className="gg-post" style={{ left: travelArt.card[0], top: travelArt.card[1], width: travelArt.card[2] }}>
            <img loading="lazy" className="ph" src={photo} alt="" />
            <img loading="lazy" className="fr" src="/goa/frame.webp" alt="" />
          </div>
          <div className="hand" style={{ left: travelArt.hand[0], top: travelArt.hand[1], width: travelArt.hand[2] }}>
            <img loading="lazy" src="/goa/hand.webp" alt="" />
          </div>
        </div>
      </section>

      <section className="sec invite">
        {lanterns.map(([left, width, sx, duration, delay]) => (
          <img loading="lazy" key={`${left}-${delay}`} className="lan" src="/goa/lantern.webp" alt="" style={{ left: `${left}%`, width, ["--sx" as string]: `${sx}px`, ["--ry" as string]: "-1400px", animationDuration: `${duration}s`, animationDelay: `${delay}s` }} />
        ))}
        <div className="card">
          <span className="k">{fields.hosts || "With the blessings of our families"}</span>
          <span className="it">{fields.title || "We cordially invite you to the wedding celebrations of"}</span>
          <span className="who">{names.first}</span>
          {parents[0] ? <span className="par">{parents[0].role} {parents[0].name}</span> : null}
          <span className="with">WITH</span>
          <span className="who">{names.second}</span>
          {parents[1] ? <span className="par">{parents[1].role} {parents[1].name}</span> : null}
          <span className="dt">{range.toUpperCase()}</span>
          <span className="vn">{place.toUpperCase()}, {region.toUpperCase()}</span>
        </div>
        <img loading="lazy" className="picnic" src="/goa/picnic.webp" alt="" />
      </section>

      <section className="sec evHead">
        <span className="k">The celebrations</span>
        <h2>Two days by the sea</h2>
        <p className="lead">Four moments we can’t wait to share with you.</p>
      </section>
      {events.map((item, index) => {
        const tone = index % 4;
        return (
          <section key={item.title + item.kick} className={`sec ev${tone === 1 || tone === 2 ? " dark" : ""}${tone % 2 ? " rt" : ""}`} style={{ background: BACKGROUNDS[tone], color: tone === 1 || tone === 2 ? "#FFF6EA" : undefined }}>
            <div className="img" style={{ backgroundImage: `url(${SCENES[tone]})` }} />
            {tone === 3 ? (
              <div className="gg-petals" aria-hidden="true">
                {PETALS.map((petal) => (
                  <span key={`${petal.x}-${petal.y}-${petal.s}`} className="gg-petal" style={{ ["--x" as string]: petal.x, ["--y" as string]: petal.y, ["--endx" as string]: petal.endx, ["--endy" as string]: petal.endy, ["--s" as string]: petal.s, ["--spin" as string]: petal.spin, ["--turn" as string]: petal.turn, ["--flip" as string]: String(petal.flip), ["--dur" as string]: petal.dur, ["--delay" as string]: petal.delay }}>
                    <img loading="lazy" src="/goa/petal.webp" alt="" />
                  </span>
                ))}
              </div>
            ) : null}
            <div className="box">
              <span className="day" style={tone === 1 || tone === 2 ? { color: "#F3C98B" } : undefined}>{item.kick}</span>
              <h3>{item.title}</h3>
              <span className="tm">{item.time}</span>
              <span className="vn">{item.text}</span>
              {item.note ? (
                <span className="dc">
                  {DOTS[tone].map((color) => <i key={color} style={{ background: color }} />)}
                  <span>{item.note}</span>
                </span>
              ) : null}
              <a className="lk" href={eventCalendar(item, fields.names, fields.date)} target="_blank" rel="noreferrer">ADD TO CALENDAR</a>
            </div>
          </section>
        );
      })}

      <section className="sec cdv">
        <div className="bg" style={{ backgroundImage: "url(/goa/sky.webp)" }} />
        <span className="k">Counting down</span>
        <h2>Until we say “I do”</h2>
        <div className="cdRow">
          {countdown.map(([value, label]) => (
            <div key={label} className="cdB"><span className="n">{String(value).padStart(2, "0")}</span><span className="l">{label}</span></div>
          ))}
        </div>
        <div className="venue">
          <div className="vi" style={{ backgroundImage: "url(/goa/resort.webp)" }} />
          <div className="vb">
            <span className="k">The venue</span>
            <b>{place}</b>
            <span className="lead" style={{ fontSize: 17, fontStyle: "italic" }}>{fields.address}</span>
            <div className="btnRow" style={{ marginTop: 10 }}>
              <a className="btn" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer">OPEN IN MAPS</a>
              <a className="btn line" href={calendarUrl(fields)} target="_blank" rel="noreferrer">ADD TO CALENDAR</a>
            </div>
          </div>
        </div>
      </section>

      <section className="sec rsvp" id="gg-rsvp">
        <span className="k">RSVP</span>
        <h2>Will you join us in {region}?</h2>
        {fields.rsvpBy ? <span className="k" style={{ color: "#5E6B80" }}>Kindly reply by {formalDate(fields.rsvpBy)}</span> : null}
        <div className="form">
          {done ? (
            <div className="done">
              <img loading="lazy" src="/goa/crest.webp" alt="" style={{ width: 120 }} />
              <span className="sc" style={{ fontSize: 42 }}>{attend === "yes" ? `See you in ${region}, ${firstName}` : "We’ll miss you"}</span>
              <p className="lead" style={{ fontSize: 18 }}>{attend === "yes" ? `${guests} ${guests === 1 ? "seat is" : "seats are"} saved for you by the sea.` : "Thank you for letting us know — your blessings mean the world to us."}</p>
              <button type="button" className="link" onClick={() => setDone(false)}>CHANGE MY REPLY</button>
            </div>
          ) : (
            <>
              <div>
                <label className="lab" htmlFor={nameId}>FULL NAME</label>
                <input id={nameId} className="fld" value={name} onChange={(event) => { setName(event.target.value); setNameErr(false); }} />
                {nameErr ? <span className="err">PLEASE ENTER YOUR NAME</span> : null}
              </div>
              <div className="seg">
                <button type="button" className="opt" aria-pressed={attend === "yes"} onClick={() => setAttend("yes")}>Joyfully accept</button>
                <button type="button" className="opt" aria-pressed={attend === "no"} onClick={() => setAttend("no")}>Regretfully decline</button>
              </div>
              {attend === "yes" ? (
                <>
                  <div className="step">
                    <span className="lab">GUESTS</span>
                    <div>
                      <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(1, count - 1))}>−</button>
                      <b aria-live="polite">{guests}</b>
                      <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(10, count + 1))}>+</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span className="lab">JOINING US FOR</span>
                    <div className="chips">
                      {events.map((item, index) => {
                        const on = picked[index] !== false;
                        return <button key={item.title} type="button" aria-pressed={on} onClick={() => setPicked((current) => ({ ...current, [index]: current[index] === false }))}>{item.title}</button>;
                      })}
                    </div>
                  </div>
                </>
              ) : null}
              <div>
                <label className="lab" htmlFor={noteId}>A NOTE FOR THE COUPLE</label>
                <textarea id={noteId} className="fld" value={msg} onChange={(event) => setMsg(event.target.value)} />
              </div>
              <button type="button" className="btn" style={{ minHeight: 52 }} onClick={() => { void submit(); }}>SEND MY REPLY</button>
            </>
          )}
        </div>
      </section>

      <footer className="foot">
        <img loading="lazy" src="/goa/crest.webp" alt="" style={{ width: 150 }} />
        <span className="sc" style={{ fontSize: 48 }}>{fields.names}</span>
        <span className="k" style={{ color: "#5E6B80" }}>{ribbon(fields.date)} · {region.toUpperCase()}</span>
        <button type="button" className="link" onClick={replay}>↺ OPEN THE GATES AGAIN</button>
        <a className="k" href={madeWithHref("goa")} style={{ color: "#5E6B80", opacity: 0.75, fontSize: 9.5, textDecoration: "none" }}>MADE WITH INVITESREADY</a>
      </footer>

      {toast ? (
        <div className="toast" role="status"><span style={{ flex: 1 }}>{toast}</span><button type="button" onClick={() => setToast("")}>OK</button></div>
      ) : null}
    </div>
  );
}
