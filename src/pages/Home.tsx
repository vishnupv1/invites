import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFonts } from "../lib/fonts";
import "./landing.css";

const PLACEHOLDERS = [
  "Aarav & Riya’s wedding · 14 Feb · Munnar",
  "Aadi turns 5 · superhero party · Kochi",
  "Meera & Dev’s engagement · sunset terrace",
  "Our housewarming · Sunday brunch",
] as const;

const CHIPS = [
  ["Wedding", "Aarav & Riya’s wedding · 14 Feb · Munnar"],
  ["Birthday", "Aadi turns 5 · superhero party · Kochi"],
  ["Engagement", "Meera & Dev’s engagement · sunset terrace"],
  ["Baby shower", "Baby Sara’s naming ceremony · Thrissur"],
  ["Housewarming", "Our housewarming · Sunday brunch"],
] as const;

type Design = { id: string; name: string; kicker: string; cover: string };

const SETS: Record<"wedding" | "birthday" | "baby" | "home", Design[]> = {
  wedding: [
    { id: "peace", name: "Peace", kicker: "PEACE · GIFT BOX", cover: "/covers/peace.jpg" },
    { id: "shaadi", name: "Shaadi", kicker: "SHAADI · VEIL", cover: "/covers/shaadi.jpg" },
    { id: "botanica", name: "Blush Botanica", kicker: "BLUSH BOTANICA", cover: "/covers/botanica.jpg" },
  ],
  birthday: [
    { id: "inland", name: "Inland Letter", kicker: "INLAND LETTER", cover: "/covers/inland.jpg" },
    { id: "beach", name: "Sunset Shore", kicker: "SUNSET SHORE", cover: "/covers/beach.jpg" },
    { id: "peace", name: "Peace", kicker: "PEACE · GIFT BOX", cover: "/covers/peace.jpg" },
  ],
  baby: [
    { id: "baptism", name: "Little Blessing", kicker: "LITTLE BLESSING", cover: "/covers/baptism.jpg" },
    { id: "botanica", name: "Blush Botanica", kicker: "BLUSH BOTANICA", cover: "/covers/botanica.jpg" },
    { id: "anna", name: "Anna", kicker: "ANNA", cover: "/covers/anna.jpg" },
  ],
  home: [
    { id: "hearth", name: "Hearth", kicker: "HEARTH", cover: "/covers/hearth.jpg" },
    { id: "beach", name: "Sunset Shore", kicker: "SUNSET SHORE", cover: "/covers/beach.jpg" },
    { id: "anna", name: "Anna", kicker: "ANNA", cover: "/covers/anna.jpg" },
  ],
};

const CARDS: Design[] = [
  { id: "heavenly", name: "Enchanted Doors", kicker: "WEDDING · DOORS OF LIGHT", cover: "/covers/heavenly.jpg" },
  { id: "grandoor", name: "The Grand Door", kicker: "WEDDING · CINEMATIC ENTRANCE", cover: "/covers/grandoor.jpg" },
  { id: "grandenvelope", name: "The Sealed Invitation", kicker: "WEDDING · WAX SEAL", cover: "/covers/grandenvelope.jpg" },
  { id: "pull", name: "Curtain Call", kicker: "WEDDING · PULL THE ROPE", cover: "/covers/pull.jpg" },
  { id: "shaadi", name: "Shaadi", kicker: "WEDDING · VEIL REVEAL", cover: "/covers/shaadi.jpg" },
  { id: "beach", name: "Sunset Shore", kicker: "BEACH · MESSAGE IN A BOTTLE", cover: "/covers/beach.jpg" },
  { id: "inland", name: "Inland Letter", kicker: "BIRTHDAY · TEAR TO OPEN", cover: "/covers/inland.jpg" },
  { id: "botanica", name: "Blush Botanica", kicker: "ENGAGEMENT · FLORAL FRAMES", cover: "/covers/botanica.jpg" },
];

const TILES = [
  { k: "01 · OPENING", t: "Openings guests remember", d: "Doors, curtains, wax seals and gift boxes — every invitation opens like a short film.", stage: true },
  { k: "02 · RSVP", t: "Every reply, live", d: "Headcount, meal choices and messages in one dashboard. Nudge late replies in a tap.", stage: false },
  { k: "03 · SHARE", t: "One link, everywhere", d: "WhatsApp, Instagram, email. No app, no login for guests.", stage: false },
  { k: "04 · FUNCTIONS", t: "Haldi to reception", d: "Every function with its own time, venue and dress code.", stage: false },
  { k: "05 · LANGUAGE", t: "Your language", d: "English, Malayalam, Hindi and Tamil — mixed as you like.", stage: false },
  { k: "06 · PRICING", t: "Pay once, from ₹299", d: "Design and preview free. Pay only when you publish — no subscription.", stage: false },
] as const;

const STEPS = [
  ["01 — DESCRIBE", "Tell us the moment", "Names, date, place — one sentence is enough to start."],
  ["02 — PERSONALISE", "Make it yours", "Pick a design, add photos, functions and music. See it live."],
  ["03 — SHARE", "Send one link", "Publish, share on WhatsApp and watch replies arrive."],
] as const;

const FAQS = [
  ["Do guests need an app?", "No. They tap your link on WhatsApp and the invitation opens instantly in their browser."],
  ["When do I pay?", "Only when you publish. Describing, designing and previewing are free."],
  ["Can I add every function?", "Yes — Haldi, Mehendi, Sangeet, wedding and reception, each with its own details."],
  ["Can I edit after sharing?", "Anytime. Your link stays the same and guests always see the latest version."],
  ["Which languages work?", "English, Malayalam, Hindi and Tamil — mix them on one invitation."],
] as const;

const LOG = ["Reading your celebration…", "Matching designs to the mood…", "Writing your invitation…"] as const;

const GLINTS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 41 + 7) % 94,
  top: (i * 29 + 5) % 82,
  size: 8 + (i % 4) * 4,
  color: ["#E0F2FE", "#BAE6FD", "#C7D2FE", "#FFFFFF"][i % 4],
  delay: `${i * 0.37}s`,
  dur: `${2.2 + (i % 5) * 0.5}s`,
}));

const SHOOTS = [
  { x: 78, y: 8, delay: "0s" },
  { x: 92, y: 26, delay: "3.5s" },
  { x: 64, y: 4, delay: "7s" },
];

const DUST = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37 + 11) % 96,
  top: 30 + ((i * 23) % 60),
  size: 2 + (i % 3),
  color: i % 3 ? "#BAE6FD" : "#C7D2FE",
  delay: `${i * 0.6}s`,
  dur: `${6 + (i % 5)}s`,
}));

const SPARKS = [
  [14, 30, 4],
  [86, 22, 3],
  [92, 70, 5],
  [8, 74, 3],
  [50, 6, 3],
  [62, 94, 4],
] as const;

const DOOR_SPARKS = [
  [22, 20, 12],
  [78, 18, 9],
  [84, 52, 14],
  [16, 56, 8],
  [30, 78, 10],
  [70, 80, 8],
] as const;

const KINDS = [
  ["Doors", "M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M12 3v18M9 12h.01M15 12h.01"],
  ["Curtains", "M3 3h18M5 3c0 8 2 14 6 18M19 3c0 8-2 14-6 18"],
  ["Wax seal", "M12 3l2.4 2.1 3.1-.4.7 3.1 2.7 1.6-1.3 2.9 1.3 2.9-2.7 1.6-.7 3.1-3.1-.4L12 21l-2.4-2.1-3.1.4-.7-3.1-2.7-1.6 1.3-2.9-1.3-2.9 2.7-1.6.7-3.1 3.1.4z"],
  ["Gift box", "M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"],
] as const;

const AUTH = [
  ["Continue with Google", "M21 12.2c0-.7-.1-1.4-.2-2H12v3.8h5a4.3 4.3 0 0 1-1.9 2.8v2.3h3A9 9 0 0 0 21 12.2zM12 21a8.9 8.9 0 0 0 6.1-2.2l-3-2.3a5.5 5.5 0 0 1-8.2-2.9H3.8v2.4A9 9 0 0 0 12 21z"],
  ["Continue with WhatsApp", "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"],
  ["Continue with Email", "M3 6h18v12H3zM3 6l9 7 9-7"],
] as const;

const FOOTER = [
  {
    h: "PRODUCT",
    links: [
      { label: "Templates", to: "/browse" },
      { label: "Pricing", to: "/#pricing" },
      { label: "How it works", to: "/how" },
    ],
  },
  {
    h: "OCCASIONS",
    links: [
      { label: "Weddings", to: "/wedding" },
      { label: "Birthdays", to: "/birthday" },
      { label: "Baby & kids", to: "/baptism" },
    ],
  },
  {
    h: "COMPANY",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
    ],
  },
] as const;

function occasionOf(query: string) {
  if (/birthday|turns|bday/i.test(query)) return "birthday" as const;
  if (/baby|baptism|naming|shower/i.test(query)) return "baby" as const;
  if (/house|home/i.test(query)) return "home" as const;
  return "wedding" as const;
}

function celebrationName(query: string) {
  return query.split(/[·,]| on | in |'s|’s/)[0]?.trim().slice(0, 30) || "Your celebration";
}

function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 960px)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return wide;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function Spark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 0C10.8 6 14 9.2 20 10C14 10.8 10.8 14 10 20C9.2 14 6 10.8 0 10C6 9.2 9.2 6 10 0Z" fill={color} />
    </svg>
  );
}

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="132" fill="#FAFAFA" />
      <path d="M256 244C256 244 176 182 176 140C176 110 199 90 225 90C242 90 252 101 256 110C260 101 270 90 287 90C313 90 336 110 336 140C336 182 256 244 256 244Z" fill="#09090B" />
      <path d="M104 236L256 348L408 236" fill="none" stroke="#09090B" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Emblem({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E0F2FE" />
          <stop offset=".5" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#A5B4FC" />
        </linearGradient>
      </defs>
      <path d="M60 52C60 52 42 38 42 28C42 21 47 16 53 16C57 16 59 19 60 21C61 19 63 16 67 16C73 16 78 21 78 28C78 38 60 52 60 52Z" fill={`url(#${id})`} />
      <path d="M18 50L60 80L102 50" fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="44" width="92" height="62" rx="14" fill="none" stroke="rgba(224,242,254,.35)" strokeWidth="2" />
    </svg>
  );
}

export function Home({ focus }: { focus?: string }) {
  useFonts("Geist", "Geist Mono");
  const wide = useWide();
  const reduced = useReducedMotion();
  const { hash } = useLocation();
  const drag = useRef({ x: 0, active: false });
  const swiped = useRef(false);
  const [query, setQuery] = useState("");
  const [ph, setPh] = useState(0);
  const [mode, setMode] = useState<"idle" | "working" | "done">("idle");
  const [faq, setFaq] = useState(0);
  const [ci, setCi] = useState(1);

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = "#09090B";
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  useEffect(() => {
    const id = focus === "occasions" ? "templates" : focus || hash.replace(/^#/, "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [focus, hash]);

  useEffect(() => {
    if (reduced || mode !== "idle") return;
    const id = window.setInterval(() => setPh((value) => (value + 1) % PLACEHOLDERS.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced, mode]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setCi((value) => (value + 1) % CARDS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduced, ci]);

  useEffect(() => {
    if (mode !== "working") return;
    const id = window.setTimeout(() => setMode("done"), reduced ? 400 : 2800);
    return () => window.clearTimeout(id);
  }, [mode, reduced]);

  function go(text?: string) {
    const next = (text ?? query).trim() || PLACEHOLDERS[0];
    setQuery(next);
    setMode("working");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    go();
  }

  function choose(index: number) {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    setCi(index);
  }

  function onStripDown(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = { x: event.clientX, active: true };
  }

  function onStripUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.x;
    drag.current.active = false;
    if (Math.abs(dx) < 48) return;
    swiped.current = true;
    setCi((value) => (value + (dx < 0 ? 1 : CARDS.length - 1)) % CARDS.length);
  }

  const picks = SETS[occasionOf(query)];
  const names = celebrationName(query);
  const current = CARDS[ci];
  const shift = wide ? 210 : 120;

  return (
    <div className="lv">
      <header className="lv-nav">
        <Link className="lv-logo" to="/" aria-label="InvitesReady">
          <Mark />
          <span>invitesready</span>
        </Link>
        <nav className="lv-nav-links" aria-label="Main">
          <a href="#templates">Templates</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQs</a>
        </nav>
        <a className="lv-pill" href="#start">Get started</a>
      </header>

      <main>
        <section id="start" className="lv-hero">
          <span className="lv-aur lv-aur-a" aria-hidden="true" />
          <span className="lv-aur lv-aur-b" aria-hidden="true" />
          <span className="lv-aur lv-aur-c" aria-hidden="true" />
          <span className="lv-beam" aria-hidden="true" />
          <span className="lv-grid" aria-hidden="true" />
          <span className="lv-horizon" aria-hidden="true" />
          {GLINTS.map((glint, index) => (
            <span
              key={index}
              className={index >= 14 ? "lv-glint lv-glint-wide" : "lv-glint"}
              style={{ left: `${glint.left}%`, top: `${glint.top}%`, animationDelay: glint.delay, animationDuration: glint.dur }}
              aria-hidden="true"
            >
              <Spark size={glint.size} color={glint.color} />
            </span>
          ))}
          {SHOOTS.map((shoot) => (
            <span key={shoot.delay} className="lv-shoot" style={{ left: `${shoot.x}%`, top: `${shoot.y}%`, animationDelay: shoot.delay }} aria-hidden="true" />
          ))}
          {DUST.map((speck, index) => (
            <span
              key={index}
              className="lv-dust"
              style={{
                left: `${speck.left}%`,
                top: `${speck.top}%`,
                width: speck.size,
                height: speck.size,
                background: speck.color,
                animationDelay: speck.delay,
                animationDuration: speck.dur,
              }}
              aria-hidden="true"
            />
          ))}

          <div className="lv-orb" aria-hidden="true">
            <span className="lv-orb-glow" />
            <span className="lv-ring" />
            <span className="lv-ring lv-ring-inner" />
            <span className="lv-orbit lv-orbit-a"><span className="lv-glint-dot" /></span>
            <span className="lv-orbit lv-orbit-b"><span className="lv-glint-dot" /></span>
            <div className="lv-emblem"><Emblem id="lv-em" /></div>
            {SPARKS.map(([x, y, size], index) => (
              <span key={index} className="lv-spark" style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animationDelay: `${index * 0.3}s`, animationDuration: `${2 + index * 0.4}s` }} />
            ))}
          </div>

          <span className="lv-mono">DESCRIBE YOUR CELEBRATION</span>
          <h1>Beautiful invitations,<br /><span className="lv-sheen">ready in seconds.</span></h1>

          {mode === "idle" ? (
            <>
              <form className="lv-prompt" onSubmit={onSubmit}>
                <input
                  type="text"
                  aria-label="Describe your celebration"
                  value={query}
                  placeholder={PLACEHOLDERS[ph]}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button type="submit" className="lv-go" aria-label="Create my invitations">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#09090B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
              <div className="lv-chips">
                {CHIPS.map(([label, text]) => (
                  <button key={label} type="button" className="lv-chip" onClick={() => go(text)}>{label}</button>
                ))}
              </div>
              <div className="lv-auth">
                {AUTH.map(([label, icon]) => (
                  <Link key={label} className="lv-auth-btn" to="/login">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAFAFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={icon} />
                    </svg>
                    {label}
                  </Link>
                ))}
              </div>
              <span className="lv-fine">Free to design · pay only when you publish</span>
            </>
          ) : null}

          {mode === "working" ? (
            <div className="lv-panel" aria-live="polite">
              <span className="lv-mono lv-quote">“{query}”</span>
              {LOG.map((line, index) => (
                <span key={line} className="lv-log" style={{ animationDelay: `${index * 0.8}s` }}>
                  <span>›</span> {line}
                </span>
              ))}
              <div className="lv-bar" aria-hidden="true"><div /></div>
            </div>
          ) : null}

          {mode === "done" ? (
            <>
              <div className="lv-picks">
                {picks.map((pick, index) => (
                  <article key={pick.id} className="lv-pick" style={{ animationDelay: `${index * 0.15}s` }}>
                    <div className="lv-pick-shot">
                      <img src={pick.cover} alt={`${pick.name} design`} />
                      <div>
                        <span>{names}</span>
                        <span className="lv-mono">{pick.kicker}</span>
                      </div>
                    </div>
                    <Link className="lv-use" to={`/create?template=${pick.id}`}>Use this design</Link>
                  </article>
                ))}
              </div>
              <button type="button" className="lv-reset" onClick={() => { setMode("idle"); setQuery(""); }}>
                Try another celebration
              </button>
            </>
          ) : null}
        </section>

        <section id="templates" className="lv-car" aria-roledescription="carousel" aria-label="Invitation designs">
          <span className="lv-mono">MADE WITH INVITESREADY</span>
          <h2>Designs that open <span>like a film.</span></h2>
          <div className="lv-flow" onPointerDown={onStripDown} onPointerUp={onStripUp} onPointerCancel={() => { drag.current.active = false; }}>
            <span className="lv-flow-glow" aria-hidden="true" />
            {CARDS.map((card, index) => {
              let off = index - ci;
              if (off > 4) off -= CARDS.length;
              if (off < -4) off += CARDS.length;
              const distance = Math.abs(off);
              return (
                <button
                  key={card.id}
                  type="button"
                  className={distance === 0 ? "lv-slide is-front" : "lv-slide"}
                  aria-label={`Show ${card.name}`}
                  aria-hidden={distance > 2}
                  tabIndex={distance > 2 ? -1 : 0}
                  onClick={() => choose(index)}
                  style={{
                    transform: `translateX(${off * shift}px) translateZ(${-distance * 120}px) rotateY(${-off * 22}deg) scale(${1 - distance * 0.08})`,
                    zIndex: 10 - distance,
                    opacity: distance > 3 ? 0 : 1 - distance * 0.22,
                    filter: `brightness(${1 - distance * 0.25})`,
                    pointerEvents: distance > 3 ? "none" : "auto",
                  }}
                >
                  <img src={card.cover} alt="" />
                </button>
              );
            })}
          </div>
          <div className="lv-cap" key={current.id}>
            <span>{current.name}</span>
            <span className="lv-mono">{current.kicker}</span>
          </div>
          <div className="lv-car-nav">
            <button type="button" className="lv-arrow" aria-label="Previous design" onClick={() => choose((ci + CARDS.length - 1) % CARDS.length)}>‹</button>
            <Link className="lv-preview" to={`/open/${current.id}`}>Preview this invitation</Link>
            <button type="button" className="lv-arrow" aria-label="Next design" onClick={() => choose((ci + 1) % CARDS.length)}>›</button>
          </div>
          <div className="lv-dots">
            {CARDS.map((card, index) => (
              <button
                key={card.id}
                type="button"
                className={index === ci ? "is-on" : undefined}
                aria-label={`Design ${index + 1}`}
                aria-current={index === ci ? "true" : undefined}
                onClick={() => choose(index)}
              />
            ))}
          </div>
        </section>

        <section id="features" className="lv-sec">
          <h2>Everything a celebration needs.<br /><span>Nothing it doesn’t.</span></h2>
          <div className="lv-bento">
            {TILES.map((tile) => (
              <article key={tile.k} id={tile.k.startsWith("06") ? "pricing" : undefined} className={tile.stage ? "lv-tile lv-tile-stage" : "lv-tile"}>
                <span className="lv-mono lv-kicker">{tile.k}</span>
                <h3>{tile.t}</h3>
                <p>{tile.d}</p>
                {tile.stage ? (
                  <div className="lv-stage" aria-hidden="true">
                    <span className="lv-stage-glow" />
                    <div className="lv-door">
                      <div className="lv-door-in">
                        <span className="lv-door-card"><Emblem id="lv-door-em" /></span>
                      </div>
                      <div className="lv-door-l"><span /></div>
                      <div className="lv-door-r"><span /></div>
                    </div>
                    {DOOR_SPARKS.map(([x, y, size], index) => (
                      <span key={index} className="lv-door-spark" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * 0.35}s`, animationDuration: `${2.4 + index * 0.4}s` }}>
                        <Spark size={size} color="#E0F2FE" />
                      </span>
                    ))}
                    <div className="lv-kinds">
                      {KINDS.map(([label, icon]) => (
                        <span key={label}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7DD3FC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d={icon} />
                          </svg>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="lv-sec">
          <div className="lv-steps">
            {STEPS.map(([n, title, text]) => (
              <div key={n}>
                <span className="lv-mono">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="lv-sec">
          <h2>FAQs</h2>
          <div className="lv-faqs">
            {FAQS.map(([question, answer], index) => {
              const open = faq === index;
              return (
                <div key={question}>
                  <button type="button" aria-expanded={open} onClick={() => setFaq(open ? -1 : index)}>
                    {question}
                    <span style={{ transform: open ? "rotate(45deg)" : undefined }}>+</span>
                  </button>
                  {open ? <p>{answer}</p> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="lv-cta">
          <span aria-hidden="true" />
          <h2>Your celebration starts with a sentence.</h2>
          <a href="#start">Describe yours</a>
        </section>
      </main>

      <footer className="lv-foot">
        <div className="lv-foot-brand">
          <span>invitesready</span>
          <p>Beautiful digital invitations for life’s moments. Designed to be opened, shared and remembered.</p>
        </div>
        <div className="lv-foot-cols">
          {FOOTER.map((column) => (
            <div key={column.h}>
              <span className="lv-mono">{column.h}</span>
              {column.links.map((link) => (
                <Link key={link.label} to={link.to}>{link.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="lv-foot-end">
          <span className="lv-mono">© INVITESREADY 2026</span>
          <span className="lv-mono">DESIGNED WITH LOVE IN KOCHI</span>
        </div>
      </footer>
    </div>
  );
}
