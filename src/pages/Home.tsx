import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brand } from "../components/Brand";
import { InviteView } from "../components/InviteView";
import { getTemplate, sampleFor } from "../data/templates";
import type { EventId } from "../types";
import { useFonts } from "../lib/fonts";
import "./landing.css";

const WORDS = ["Invitations", "your", "guests", "open,", "answer", "and"];
const OCCASION_GROUPS = [
  ["Weddings", "Engagements", "Receptions"],
  ["Birthdays", "Anniversaries"],
  ["Baptisms", "Naming ceremonies"],
  ["Housewarmings", "Festivals"],
  ["Corporate events"],
] as const;
const PETAL_COLORS = ["#F23F78", "#FF7380", "#D81B60", "#FCEFF4"];
const QR = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1];
const CONFETTI = ["#D81B60", "#F23F78", "#FF7380", "#FFFFFF", "#FCEFF4"];

const DEMO_SLIDES = [
  { id: "vivah", event: "marriage" as EventId, reply: "Vishnu's family · 4 guests" },
  { id: "baptism", event: "baptism" as EventId, reply: "Joseph Mathew · 3 guests" },
  { id: "hearth", event: "housewarming" as EventId, reply: "Priya & Vivek · 2 guests" },
  { id: "beach", event: "marriage" as EventId, reply: "Fathima & Arif · 2 guests" },
  { id: "anna", event: "marriage" as EventId, reply: "Nisha · attending" },
  { id: "gazal", event: "marriage" as EventId, reply: "Imran's family · 5 guests" },
] as const;

const STEPS = [
  ["01", "Pick & personalise", "Choose a template and add names, photos and every function — no sign-up needed."],
  ["02", "Share on WhatsApp", "Send one link from your own WhatsApp. Guests open it instantly — no app."],
  ["03", "Watch replies arrive", "Headcounts, meals and wishes land in your dashboard in real time."],
] as const;

const LANG_DEMOS = [
  {
    chip: "English",
    invite: "You're invited",
    names: ["Anna", "Joel"],
    joiner: "&",
    date: "Saturday · 14 December",
    place: "Goa",
    venue: "Candolim · North Goa",
    event: "Wedding",
    script: "latin",
    theme: {
      wash: "rgba(68, 42, 58, 0.7)",
      deep: "rgba(36, 22, 32, 0.45)",
      accent: "#e6c893",
      soft: "#f3e2b8",
      orb: "rgba(200, 155, 91, 0.5)",
      orb2: "rgba(230, 183, 195, 0.35)",
      petal: "#e6c893",
      petal2: "#e7b7c3",
      petal3: "#f0e6d8",
    },
  },
  {
    chip: "മലയാളം",
    invite: "സ്വാഗതം",
    names: ["അന്ന", "ജോയൽ"],
    joiner: "&",
    date: "ശനി · ഡിസംബർ 14",
    place: "കൊച്ചി",
    venue: "ഫോർട്ട് കൊച്ചി",
    event: "വിവാഹം",
    script: "ml",
    theme: {
      wash: "rgba(34, 78, 68, 0.72)",
      deep: "rgba(18, 42, 40, 0.42)",
      accent: "#9fd4c0",
      soft: "#f4f0e6",
      orb: "rgba(111, 168, 148, 0.55)",
      orb2: "rgba(200, 155, 91, 0.32)",
      petal: "#9fd4c0",
      petal2: "#e6c893",
      petal3: "#f0e6d8",
    },
  },
  {
    chip: "हिन्दी",
    invite: "आप आमंत्रित हैं",
    names: ["अन्ना", "जोएल"],
    joiner: "और",
    date: "शनिवार · 14 दिसंबर",
    place: "जयपुर",
    venue: "सिटी पैलेस · जयपुर",
    event: "विवाह",
    script: "hi",
    theme: {
      wash: "rgba(92, 36, 28, 0.72)",
      deep: "rgba(48, 18, 16, 0.45)",
      accent: "#f0b27a",
      soft: "#fce8d4",
      orb: "rgba(212, 110, 62, 0.45)",
      orb2: "rgba(230, 200, 147, 0.35)",
      petal: "#f0b27a",
      petal2: "#e6c893",
      petal3: "#f8d9b8",
    },
  },
  {
    chip: "বাংলা",
    invite: "আপনি আমন্ত্রিত",
    names: ["আনা", "জোয়েল"],
    joiner: "ও",
    date: "শনিবার · ১৪ ডিসেম্বর",
    place: "কলকাতা",
    venue: "ভিক্টোরিয়া · কলকাতা",
    event: "বিবাহ",
    script: "bn",
    theme: {
      wash: "rgba(42, 48, 92, 0.72)",
      deep: "rgba(20, 24, 52, 0.45)",
      accent: "#a8b8f0",
      soft: "#e8ecf8",
      orb: "rgba(96, 118, 196, 0.5)",
      orb2: "rgba(230, 183, 195, 0.32)",
      petal: "#a8b8f0",
      petal2: "#e7b7c3",
      petal3: "#e8ecf8",
    },
  },
  {
    chip: "தமிழ்",
    invite: "வரவேற்கிறோம்",
    names: ["அன்னா", "ஜோயல்"],
    joiner: "&",
    date: "சனி · 14 டிசம்பர்",
    place: "மதுரை",
    venue: "மீனாட்சி அம்மன் · மதுரை",
    event: "திருமணம்",
    script: "ta",
    theme: {
      wash: "rgba(58, 32, 78, 0.72)",
      deep: "rgba(28, 16, 42, 0.45)",
      accent: "#d4a8f0",
      soft: "#f2e8f8",
      orb: "rgba(148, 96, 186, 0.5)",
      orb2: "rgba(200, 155, 91, 0.32)",
      petal: "#d4a8f0",
      petal2: "#e6c893",
      petal3: "#f2e8f8",
    },
  },
] as const;

const LANG_CHIPS = ["English", "മലയാളം", "हिन्दी", "বাংলা", "தமிழ்", "ગુજરાતી", "ಕನ್ನಡ", "తెలుగు"] as const;

const HOW_CARDS = [
  { id: "vivah", name: "Karthik & Nandana", cover: "/covers/vivah.jpg", rot: -12, dx: -118 },
  { id: "baptism", name: "Ethan", cover: "/covers/baptism.jpg", rot: -5, dx: -40 },
  { id: "hearth", name: "Our new home", cover: "/covers/hearth.jpg", rot: 12, dx: 118 },
  { id: "anna", name: "Anna & Joel", cover: "/covers/anna.jpg", rot: 0, dx: 0 },
] as const;

const RSVPS = [
  ["MF", "Vishnu's family", "Attending", "#D81B60", "All 3 functions"],
  ["PV", "Priya & Vivek", "Attending", "#F23F78", "Wedding + Reception"],
  ["JM", "Joseph Mathew", "Pending", "#6F8B74", "No reply yet"],
  ["AR", "Aisha & Rafi", "Attending", "#8E1550", "Wedding only"],
] as const;

const TEMPLATES = [
  { name: "Royal Night", tag: "Animated", cover: "/covers/vivah.jpg", sample: "Karthik & Nandana", kicker: "Shubh Vivah", to: "/create?template=vivah" },
  { name: "Sunset Shore", tag: "Animated", cover: "/covers/beach.jpg", sample: "Rohan & Alisha", kicker: "One shore", to: "/create?template=beach" },
  { name: "Heavenly", tag: "Animated", cover: "/covers/heavenly.jpg", sample: "Aarav & Riya", kicker: "Wedding", to: "/create?template=heavenly" },
  { name: "Blush Botanica", tag: "Animated", cover: "/covers/botanica.jpg", sample: "Nila & Kiran", kicker: "Wedding", to: "/create?template=botanica" },
  { name: "Happy Home", tag: "Animated", cover: "/covers/hearth.jpg", sample: "Our new home", kicker: "Griha Pravesh", to: "/create?template=hearth" },
  { name: "Heavenly Halo", tag: "Animated", cover: "/covers/baptism.jpg", sample: "Ethan", kicker: "Baptism", to: "/create?template=baptism" },
  { name: "Emerald Nikah", tag: "Premium", cover: "/covers/gazal.jpg", sample: "Imran & Safa", kicker: "Nikah", to: "/create?template=gazal" },
  { name: "Garden Editorial", tag: "Free", cover: "/covers/anna.jpg", sample: "Anna & Joel", kicker: "Save the date", to: "/create?template=anna" },
  { name: "Aurelia", tag: "Premium", cover: "/covers/aurelia.jpg", sample: "Aisha & Kabir", kicker: "Wedding", to: "/create?template=aurelia" },
  { name: "Thiruvizha", tag: "Animated", cover: "/covers/thiruvizha.jpg", sample: "Family feast", kicker: "Celebration", to: "/create?template=thiruvizha" },
] as const;

const BARS = [
  ["Mehendi · 118 / 150", 79, "#F23F78"],
  ["Wedding · 186 / 320", 58, "#D81B60"],
  ["Reception · 204 / 300", 68, "#2E8B57"],
] as const;

const FAQS = [
  ["Do my guests need an app or an account?", "No. Guests open your link in any browser and RSVP in one tap — it works on basic phones too."],
  ["Can I design before signing up?", "Yes. Pick a template and customise it as a guest. We only ask you to log in when you publish, and your draft comes with you."],
  ["Can different guests see different functions?", "Yes. Put guests into groups and choose which functions each group sees."],
  ["Is our family information private?", "Pages can be password-protected, and the address can stay hidden until a guest says yes."],
  ["Can I edit after sending?", "Of course — every guest sees the latest version through the same link."],
] as const;

const NAV = [
  { href: "/browse", label: "Templates" },
  { href: "/how", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/faq", label: "FAQ" },
];

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return narrow;
}

export function Home({ focus }: { focus?: string }) {
  useFonts("Alex Brush", "Allura", "Caveat", "Cormorant Garamond", "Great Vibes", "Parisienne", "Pinyon Script");
  const narrow = useNarrow();
  const { hash, pathname } = useLocation();
  const tplRow = useRef<HTMLDivElement>(null);
  const tplDragged = useRef(false);
  const [tick, setTick] = useState(0);
  const [how, setHow] = useState(0);
  const [howT, setHowT] = useState(0);
  const [spot, setSpot] = useState({ x: 70, y: 30 });
  const [faq, setFaq] = useState(0);
  const [burst, setBurst] = useState(0);
  const [menu, setMenu] = useState(false);
  const [lang, setLang] = useState(0);

  useEffect(() => {
    const id = focus || hash.replace(/^#/, "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView();
  }, [focus, hash]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
      setHowT((value) => {
        if (value + 1 >= 8) {
          setHow((step) => (step + 1) % 3);
          return 0;
        }
        return value + 1;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLang((value) => (value + 1) % LANG_DEMOS.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, []);

  const slide = DEMO_SLIDES[Math.floor(tick / 7) % DEMO_SLIDES.length];
  const template = getTemplate(slide.id);
  const fields = template ? sampleFor(template, slide.event) : null;
  const head = 140 + (tick % 60) * 0.8;
  const headcount = String(Math.round(head));
  const pct = Math.round((head / 220) * 100);
  const reply = slide.reply;
  const cards = [...TEMPLATES, ...TEMPLATES];

  useEffect(() => {
    const row = tplRow.current;
    if (!row) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let paused = false;
    let idle = 0;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    let wrapping = false;

    const pause = () => {
      paused = true;
      window.clearTimeout(idle);
    };
    const resume = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        paused = false;
      }, 900);
    };
    const span = () => row.scrollWidth / 2;
    const wrap = (value: number) => {
      const width = span();
      if (width < 1) return value;
      return ((value % width) + width) % width;
    };

    const step = () => {
      if (!paused && !dragging && !media.matches && !document.hidden) {
        const width = span();
        if (width > 1) row.scrollLeft += width / (50 * 60);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pause();
      if (event.pointerType !== "mouse") return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = row.scrollLeft;
      row.classList.add("is-dragging");
      row.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      row.scrollLeft = wrap(startScroll - dx);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        resume();
        return;
      }
      if (!dragging) return;
      dragging = false;
      row.classList.remove("is-dragging");
      if (row.hasPointerCapture(event.pointerId)) row.releasePointerCapture(event.pointerId);
      tplDragged.current = moved;
      resume();
    };
    const onClick = (event: MouseEvent) => {
      if (!tplDragged.current) return;
      event.preventDefault();
      event.stopPropagation();
      tplDragged.current = false;
    };
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      pause();
      row.scrollLeft = wrap(row.scrollLeft + delta);
      resume();
    };
    const onScroll = () => {
      if (wrapping) return;
      const width = span();
      if (width > 1 && row.scrollLeft >= width) {
        wrapping = true;
        row.scrollLeft -= width;
        wrapping = false;
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      pause();
      row.scrollLeft = wrap(row.scrollLeft + (event.key === "ArrowRight" ? 304 : -304));
      resume();
    };

    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", onPointerUp);
    row.addEventListener("pointercancel", onPointerUp);
    row.addEventListener("click", onClick, true);
    row.addEventListener("wheel", onWheel, { passive: false });
    row.addEventListener("scroll", onScroll);
    row.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      row.classList.remove("is-dragging");
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointermove", onPointerMove);
      row.removeEventListener("pointerup", onPointerUp);
      row.removeEventListener("pointercancel", onPointerUp);
      row.removeEventListener("click", onClick, true);
      row.removeEventListener("wheel", onWheel);
      row.removeEventListener("scroll", onScroll);
      row.removeEventListener("keydown", onKey);
    };
  }, []);

  function closeMenu() {
    setMenu(false);
  }

  return (
    <div className="lp">
      <header className="lp-nav">
        <Brand />
        <nav className="lp-links" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} to={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="lp-nav-actions">
          <Link className="lp-login" to="/login">
            Log in
          </Link>
          <Link className="lp-create lp-btn" to="/create">
            Create invite
          </Link>
        </div>
        <button type="button" className="lp-burger" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
          {menu ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          )}
        </button>
      </header>
      {menu ? (
        <nav className="lp-menu" aria-label="Menu">
          {NAV.map((item) => (
            <Link key={item.href} to={item.href} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}
          <Link to="/login" onClick={closeMenu}>Log in</Link>
          <Link className="lp-create" to="/create" onClick={closeMenu}>
            Create invite — free
          </Link>
        </nav>
      ) : null}

      <main>
      <section
        id="top"
        className="lp-hero"
        style={{ background: `radial-gradient(${narrow ? 360 : 600}px circle at ${spot.x}% ${spot.y}%, rgba(216,27,96,0.16), rgba(251,248,245,0) 70%), #FBF8F5` }}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setSpot({ x: Math.round(((event.clientX - box.left) / box.width) * 100), y: Math.round(((event.clientY - box.top) / box.height) * 100) });
        }}
      >
        {Array.from({ length: narrow ? 10 : 14 }, (_, i) => (
          <span
            key={i}
            className="lp-petal"
            aria-hidden="true"
            style={{ left: `${(i * 7.2) % 100}%`, animationDuration: `${12 + (i % 5) * 2}s`, animationDelay: `-${i * 1.3}s` }}
          >
            <span style={{ animationDuration: `${3 + (i % 3)}s` }}>
              <svg width={12 + (i % 3) * 6} height={12 + (i % 3) * 6} viewBox="0 0 20 20">
                <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={PETAL_COLORS[i % 4]} />
              </svg>
            </span>
          </span>
        ))}
        <svg className="lp-mandala" width="760" height="760" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <g stroke="#F23F78" strokeWidth="0.4">
            <circle cx="100" cy="100" r="96" />
            <circle cx="100" cy="100" r="70" />
            <circle cx="100" cy="100" r="40" />
            <path d="M100 4c12 30 12 62 0 96-12-34-12-66 0-96zM196 100c-30 12-62 12-96 0 34-12 66-12 96 0zM100 196c-12-30-12-62 0-96 12 34 12 66 0 96zM4 100c30-12 62-12 96 0-34 12-66 12-96 0z" />
          </g>
        </svg>

        <div className="lp-hero-copy">
          <span className="lp-pill">
            <b>NEW</b>
            Animated templates for every celebration
          </span>
          <h1>
            {WORDS.map((word, index) => (
              <span key={word}>
                <span className="lp-word">
                  <span style={{ animationDelay: `${0.1 + index * 0.12}s` }}>{word}</span>
                </span>{" "}
              </span>
            ))}
            <span className="lp-word">
              <span className="lp-remember">
                remember.
                <svg viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M4 12C60 4 120 16 180 8s90 4 112 2" stroke="#D81B60" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </span>
          </h1>
          <p className="lp-lede">
            {narrow
              ? "Design a beautiful invitation in minutes, share one link on WhatsApp, and watch replies arrive."
              : "Design a beautiful invitation in minutes, share one link on WhatsApp, and watch replies arrive — for a wedding, a housewarming, or the evening after."}
          </p>
          <div className="lp-ctas">
            <Link className="lp-cta lp-btn" to="/create">
              Create your invitation — free <span aria-hidden="true">→</span>
            </Link>
            <Link className="lp-cta-line lp-btn" to="/browse">
              Browse templates
            </Link>
          </div>
          <div className="lp-checks">
            <span>✓ No app for guests</span>
            <span>{narrow ? "✓ Design free" : "✓ Design free, no sign-up"}</span>
            <span>✓ Pay once per event</span>
          </div>
        </div>

        <div className="lp-stage">
          <div className="lp-phone">
            <div className="lp-phone-screen">
              {template && fields ? (
                <div className="lp-phone-live" key={slide.id}>
                  <div className="lp-phone-live-stage">
                    <InviteView template={template} fields={fields} demo />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="lp-float-card lp-rsvp">
            <i>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E6853" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l4 4L19 7" />
              </svg>
            </i>
            <div key={reply}>
              <strong>New reply</strong>
              <small>{reply}</small>
            </div>
          </div>
          <div className="lp-float-card lp-head">
            <em>HEADCOUNT</em>
            <div>
              <strong>{headcount}</strong> <span>attending</span>
            </div>
            <div className="lp-bar">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="lp-wa"><img src="/whatsapp.png" alt="" width={16} height={16} /> Shared on WhatsApp</div>
          <div className="lp-dots" aria-hidden="true">
            {DEMO_SLIDES.map((item) => (
              <i key={item.id} style={{ width: item.id === slide.id ? 28 : 8, background: item.id === slide.id ? "#D81B60" : "#D8CCBF" }} />
            ))}
          </div>
        </div>
      </section>

      <section id="occasions" className="lp-marquee" aria-label="Occasions">
        <div className="lp-occasion-viewport">
          <div className="lp-occasion-row">
            {[0, 1].map((copy) => (
              <span key={copy} className="lp-occasion-copy" aria-hidden={copy === 1}>
                {OCCASION_GROUPS.map((group) => (
                  <Fragment key={group[0]}>
                    <i className="lp-occasion-rule" aria-hidden="true" />
                    <span className="lp-occasion-group">
                      {group.map((label, itemIndex) => (
                        <Fragment key={label}>
                          {itemIndex > 0 ? <i aria-hidden="true" /> : null}
                          {label}
                        </Fragment>
                      ))}
                    </span>
                  </Fragment>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-occasions" aria-label="Celebrations">
        <div className="lp-occasions-glow" aria-hidden="true">
          <i className="a" />
          <i className="b" />
          {Array.from({ length: 7 }, (_, n) => (
            <span
              key={n}
              className="lp-occasions-petal"
              style={{
                left: `${6 + n * 14}%`,
                animationDuration: `${13 + (n % 4) * 2.5}s`,
                animationDelay: `${-n * 1.8}s`,
              }}
            />
          ))}
        </div>
        <span className="lp-kicker-label">Celebrations</span>
        <h2>
          An invitation for every <em>celebration.</em>
        </h2>
        <nav aria-label="Celebrations">
          <Link to="/c/marriage">Marriage</Link>
          <Link to="/c/engagement">Engagements</Link>
          <Link to="/c/housewarming">Housewarming</Link>
        </nav>
      </section>

      <section id="how" className="lp-how">
        <div className="lp-how-glow" aria-hidden="true">
          <i className="a" />
          <i className="b" />
          <span />
        </div>
        <div className="lp-how-copy">
          <span className="lp-kicker-label">How it works</span>
          <h2>
            From idea to replies in <em>three steps.</em>
          </h2>
          <p className="lp-how-lede">Design once, share one link, and keep every reply in one place.</p>
          <div className="lp-steps" role="tablist" aria-label="Steps">
            {STEPS.map(([n, title, text], index) => {
              const on = how === index;
              return (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={on ? "lp-step on" : "lp-step"}
                  onClick={() => {
                    setHow(index);
                    setHowT(0);
                  }}
                >
                  <b>{n}</b>
                  <span>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </span>
                  <u aria-hidden="true">
                    <i style={{ width: `${on ? Math.min(100, (howT + 1) * 12.5) : 0}%` }} />
                  </u>
                </button>
              );
            })}
          </div>
        </div>
        <div className="lp-how-stage">
          <div className="lp-how-aura" aria-hidden="true">
            <span className="lp-how-ribbon lp-how-ribbon-a" />
            <span className="lp-how-ribbon lp-how-ribbon-b" />
            <span className="lp-how-ribbon lp-how-ribbon-c" />
            <svg className="lp-how-ornament lp-how-ornament-tl" viewBox="0 0 120 120" fill="none">
              <path d="M8 112C18 72 48 42 88 28" stroke="currentColor" strokeWidth="1.2" />
              <path d="M28 112C36 84 58 58 92 44" stroke="currentColor" strokeWidth="1" opacity="0.7" />
              <path d="M88 28c8-4 16-6 24-6M88 28c2 10 0 20-6 28" stroke="currentColor" strokeWidth="1" />
              <circle cx="88" cy="28" r="2.5" fill="currentColor" />
            </svg>
            <svg className="lp-how-ornament lp-how-ornament-br" viewBox="0 0 120 120" fill="none">
              <path d="M112 8C102 48 72 78 32 92" stroke="currentColor" strokeWidth="1.2" />
              <path d="M92 8C84 36 62 62 28 76" stroke="currentColor" strokeWidth="1" opacity="0.7" />
              <path d="M32 92c-8 4-16 6-24 6M32 92c-2-10 0-20 6-28" stroke="currentColor" strokeWidth="1" />
              <circle cx="32" cy="92" r="2.5" fill="currentColor" />
            </svg>
            {Array.from({ length: narrow ? 10 : 16 }, (_, i) => (
              <span
                key={i}
                className={`lp-how-foil lp-how-foil-${(i % 3) + 1}`}
                style={{
                  left: `${8 + ((i * 11.7) % 84)}%`,
                  animationDuration: `${7 + (i % 5) * 1.6}s`,
                  animationDelay: `-${i * 0.7}s`,
                }}
              />
            ))}
          </div>
          {how === 0 ? (
            <div className="lp-how-panel" key="pick">
              <div className="lp-how-fan">
                {HOW_CARDS.map((card, index) => (
                  <div
                    key={card.id}
                    className="lp-how-slot"
                    style={{
                      transform: `translate(${Math.round(card.dx * (narrow ? 0.52 : 1))}px, 0) rotate(${card.rot}deg)`,
                      zIndex: index === 3 ? 2 : 1,
                    }}
                  >
                    <div className="lp-how-card" style={{ animationDelay: `${index * 0.12}s` }}>
                      <img src={card.cover} alt="" />
                      <span>{card.name}</span>
                    </div>
                  </div>
                ))}
              </div>
              <span className="lp-typing">Personalising Anna &amp; Joel…</span>
            </div>
          ) : null}
          {how === 1 ? (
            <div className="lp-how-panel" key="share">
              <div className="lp-chat-shell">
                <div className="lp-chat">
                  <div className="lp-chat-head">
                    <img src="/whatsapp.png" alt="" width={16} height={16} />
                    <span>WhatsApp</span>
                  </div>
                  <div className="lp-chat-body">
                    <div className="lp-chat-out">
                      <div className="lp-chat-card">
                        <img src="/covers/anna.jpg" alt="" />
                        <strong>
                          Anna <em>&amp;</em> Joel
                        </strong>
                        <small>invitesready.com/anna-joel</small>
                      </div>
                      <p>You're invited — tap to RSVP</p>
                      <em>10:24 ✓✓</em>
                    </div>
                    <div className="lp-chat-in" style={{ animationDelay: "0.55s" }}>
                      So beautiful. We'll be there.
                    </div>
                    <div className="lp-chat-in" style={{ animationDelay: "0.95s" }}>
                      RSVP'd for all three functions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {how === 2 ? (
            <div className="lp-how-panel lp-how-panel-live" key="replies">
              <div className="lp-live-invite" aria-hidden="true">
                <img src="/covers/anna.jpg" alt="" />
                <span>Anna &amp; Joel</span>
              </div>
              <div className="lp-live">
                <div className="lp-live-top">
                  <div>
                    <span>Live RSVPs</span>
                    <small>Updating as guests reply</small>
                  </div>
                  <strong>{headcount}</strong>
                </div>
                <div className="lp-live-list">
                  {RSVPS.map(([initials, name, status, color, detail], index) => (
                    <div className="lp-live-row" key={name} style={{ animationDelay: `${0.15 + index * 0.18}s` }}>
                      <b style={{ background: color }}>{initials}</b>
                      <span>
                        <strong>{name}</strong>
                        <small>{detail}</small>
                      </span>
                      <em className={status === "Pending" ? "wait" : "yes"}>{status}</em>
                    </div>
                  ))}
                </div>
                <div className="lp-live-foot">
                  <i style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section id="templates" className="lp-templates">
        <div className="lp-templates-glow" aria-hidden="true">
          <i />
          <i />
          <i />
          {Array.from({ length: 18 }, (_, i) => (
            <em
              key={i}
              style={{
                left: `${4 + ((i * 13.7) % 92)}%`,
                animationDuration: `${8 + (i % 6) * 1.4}s`,
                animationDelay: `-${i * 0.55}s`,
              }}
            />
          ))}
        </div>
        <div className="lp-templates-head">
          <div>
            <span className="lp-kicker-label lp-kicker-gold">Templates</span>
            <h2>
              Invitations that <em>move.</em>
            </h2>
            <p>
              {narrow
                ? "Doors that open, sunsets that settle, homes that build themselves."
                : "Palace doors that open, sunsets that set, houses that build themselves. Hover to peek."}
            </p>
          </div>
          <Link className="lp-gold-link lp-btn" to="/browse">
            See all templates
          </Link>
        </div>
        <div className="lp-tpl-row" ref={tplRow} tabIndex={0} role="region" aria-label="Invitation templates">
          <div className="lp-tpl-track">
            {cards.map((template, index) => (
              <Link draggable={false} className="lp-tpl" to={template.to} key={`${template.name}-${index}`}>
                <span className={`lp-tpl-badge${template.tag === "Free" ? " free" : template.tag === "Premium" ? " premium" : ""}`}>
                  {template.tag}
                </span>
                <div className="lp-tpl-media">
                  <img src={template.cover} alt="" loading="lazy" />
                  <div className="lp-tpl-veil">
                    <small>{template.kicker}</small>
                    <strong>{template.sample}</strong>
                  </div>
                </div>
                <span className="lp-tpl-name">{template.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="lp-tpl-more">
          <Link to="/browse">See all templates</Link>
        </div>
      </section>

      <section id="features" className="lp-features">
        <div className="lp-features-glow" aria-hidden="true">
          <i className="orb a" />
          <i className="orb b" />
          <i className="orb c" />
          <span className="lp-features-wave w1" />
          <span className="lp-features-wave w2" />
          {Array.from({ length: 12 }, (_, n) => (
            <em
              key={n}
              className="lp-features-dot"
              style={{
                left: `${8 + ((n * 15.5) % 84)}%`,
                top: `${12 + ((n * 23) % 70)}%`,
                animationDelay: `${-n * 0.7}s`,
                animationDuration: `${5 + (n % 4)}s`,
              }}
            />
          ))}
        </div>
        <div className="lp-features-intro">
          <span className="lp-kicker-label">Everything, ready</span>
          <h2>
            Everything around the invite, <em>handled.</em>
          </h2>
          <p className="lp-features-lede">
            {narrow
              ? "The details hosts forget — already designed in."
              : "Languages, privacy, RSVPs, venue check-in and the guest-page details hosts usually forget — already designed in."}
          </p>
        </div>

        <div className="lp-feat-stage">
          <article className="lp-feat lp-feat-lang">
            <div className="lp-feat-lang-bg" aria-hidden="true">
              <b />
              <b />
              <b className="teal" />
              <span className="lp-feat-ring r1" />
              <span className="lp-feat-ring r2" />
              <span className="lp-feat-ring r3" />
            </div>
            <div className="lp-feat-copy">
              <span>01 — Languages</span>
              <h3>Invites in every language</h3>
              <p>
                {narrow
                  ? "English, Malayalam, Hindi, Bengali and more Indian languages — side by side."
                  : "English, Malayalam, Hindi, Bengali, Tamil and more Indian languages — so every relative reads the invite in their own script."}
              </p>
            </div>
            <div
              className="lp-lang-stage"
              aria-hidden="true"
              style={{
                ["--lang-accent" as string]: LANG_DEMOS[lang].theme.accent,
                ["--lang-soft" as string]: LANG_DEMOS[lang].theme.soft,
              }}
            >
              <div className="lp-lang-chips">
                {LANG_CHIPS.map((chip) => (
                  <i key={chip} className={LANG_DEMOS[lang].chip === chip ? "on" : undefined}>
                    {chip}
                  </i>
                ))}
              </div>
              <div
                className={`lp-lang-sheet script-${LANG_DEMOS[lang].script}`}
                key={lang}
                style={{
                  ["--lang-wash" as string]: LANG_DEMOS[lang].theme.wash,
                  ["--lang-deep" as string]: LANG_DEMOS[lang].theme.deep,
                  ["--lang-accent" as string]: LANG_DEMOS[lang].theme.accent,
                  ["--lang-soft" as string]: LANG_DEMOS[lang].theme.soft,
                  ["--lang-orb" as string]: LANG_DEMOS[lang].theme.orb,
                  ["--lang-orb2" as string]: LANG_DEMOS[lang].theme.orb2,
                  ["--lang-petal" as string]: LANG_DEMOS[lang].theme.petal,
                  ["--lang-petal2" as string]: LANG_DEMOS[lang].theme.petal2,
                  ["--lang-petal3" as string]: LANG_DEMOS[lang].theme.petal3,
                }}
              >
                <div className="lp-lang-aura" aria-hidden="true">
                  <span className="lp-lang-orb o1" />
                  <span className="lp-lang-orb o2" />
                  <span className="lp-lang-orb o3" />
                  <span className="lp-lang-halo h1" />
                  <span className="lp-lang-halo h2" />
                  <span className="lp-lang-halo h3" />
                  {Array.from({ length: 7 }, (_, n) => (
                    <em
                      key={n}
                      className={`lp-lang-petal p${(n % 3) + 1}`}
                      style={{
                        left: `${-8 + ((n * 18) % 110)}%`,
                        animationDelay: `${-n * 0.9}s`,
                        animationDuration: `${7 + (n % 4)}s`,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20">
                        <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill="currentColor" />
                      </svg>
                    </em>
                  ))}
                </div>
                <div className="lp-lang-sheet-inner">
                  <small>{LANG_DEMOS[lang].invite}</small>
                  <strong className="lp-lang-names">
                    <b>{LANG_DEMOS[lang].names[0]}</b>
                    <em className={LANG_DEMOS[lang].joiner === "&" ? "amp" : undefined}>{LANG_DEMOS[lang].joiner}</em>
                    <b>{LANG_DEMOS[lang].names[1]}</b>
                  </strong>
                  <i className="lp-lang-goldline" />
                  <span>{LANG_DEMOS[lang].date}</span>
                  <em className="lp-lang-venue">{LANG_DEMOS[lang].venue}</em>
                  <div className="lp-lang-meta">
                    <i>{LANG_DEMOS[lang].event}</i>
                    <i>{LANG_DEMOS[lang].place}</i>
                  </div>
                  <div className="lp-lang-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="lp-feat-side">
            <article className="lp-feat lp-feat-rsvp">
              <div className="lp-feat-copy">
                <span>02 — RSVP</span>
                <h3>One-tap reply</h3>
                <p>{narrow ? "No login, no app." : "No login, no app — even on older phones."}</p>
              </div>
              <div className="lp-rsvp-sheet" aria-hidden="true">
                <b>Will you join?</b>
                <div>
                  <button type="button" tabIndex={-1}>Joyfully joining</button>
                  <button type="button" tabIndex={-1} className="ghost">
                    Regretfully decline
                  </button>
                </div>
                <small>Mehendi · Wedding · Reception</small>
              </div>
            </article>

            <article className="lp-feat lp-feat-lock">
              <div className="lp-feat-copy">
                <span>03 — Privacy</span>
                <h3>Private by default</h3>
                <p>{narrow ? "Address after a yes." : "Venue address appears only after a guest says yes."}</p>
              </div>
              <div className="lp-seal" aria-hidden="true">
                <div className="lp-seal-card">
                  <strong>The Grand Pavilion</strong>
                  <em className="blur">12 Orchid Lane, Kochi</em>
                  <u>Unlocks after RSVP</u>
                </div>
                <i>
                  <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
                    <path d="M5 11V8a6 6 0 0 1 12 0v3" stroke="currentColor" strokeWidth="1.8" />
                    <rect x="2" y="11" width="18" height="13" rx="2" fill="currentColor" />
                    <circle cx="11" cy="17" r="1.6" fill="#F23F78" />
                  </svg>
                </i>
              </div>
            </article>
          </div>
        </div>

        <div className="lp-feat-row">
          <article className="lp-feat lp-feat-fns">
            <div className="lp-feat-copy">
              <span>04 — Functions</span>
              <h3>Every function, one link</h3>
            </div>
            <div className="lp-fns-board" aria-hidden="true">
              {BARS.map(([name, width, color]) => (
                <div key={name}>
                  <div className="lp-fns-meta">
                    <span>{name.split(" · ")[0]}</span>
                    <em>{name.split(" · ")[1]}</em>
                  </div>
                  <div className="lp-bar">
                    <i style={{ width: `${width}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="lp-feat lp-feat-qr">
            <div className="lp-feat-copy">
              <span>05 — Venue</span>
              <h3>QR check-in</h3>
            </div>
            <div className="lp-qr-board" aria-hidden="true">
              <div className="lp-qr-frame">
                <div className="lp-qr">
                  {QR.map((cell, index) => (
                    <i key={index} style={{ background: cell ? "#2A1527" : "transparent" }} />
                  ))}
                  <u />
                </div>
                <div className="lp-qr-meta">
                  <strong>Gate A</strong>
                  <small>42 checked in</small>
                </div>
              </div>
            </div>
          </article>

          <article className="lp-feat lp-feat-music">
            <img className="lp-music-cover" src="/covers/beach.jpg" alt="" aria-hidden="true" />
            <div className="lp-feat-copy">
              <span>06 — Guest page</span>
              <h3>{narrow ? "Music & more" : "Music, maps & wishes"}</h3>
            </div>
            <div className="lp-music-player" aria-hidden="true">
              <div className="lp-music-meta">
                <strong>Golden Hour</strong>
                <small>Now playing</small>
              </div>
              <div className="lp-eq">
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} style={{ background: i % 2 ? "#F23F78" : "#D81B60", animationDuration: `${0.5 + (i % 5) * 0.11}s`, animationDelay: `${i * 0.04}s` }} />
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="faq" className="lp-faq">
        <div className="lp-faq-stage" aria-hidden="true">
          <div className="lp-faq-rules" />
          <div className="lp-faq-wash" />
          <i className="lp-faq-pen" />
          <i className="lp-faq-pen late" />
          {["tr", "bl"].map((corner) => (
            <span key={corner} className={`lp-faq-corner ${corner}`} />
          ))}
          {Array.from({ length: narrow ? 4 : 7 }, (_, i) => (
            <i
              key={i}
              className="lp-faq-gem"
              style={{ left: i % 2 === 0 ? "2.2%" : "96%", top: `${18 + (i * 16) % 64}%`, animationDelay: `-${i * 0.45}s`, animationDuration: `${3 + (i % 3) * 0.8}s` }}
            />
          ))}
        </div>
        <div className="lp-faq-intro">
          <span className="lp-kicker-label">FAQ</span>
          <h2>
            A few answers,
            <em>before you share.</em>
          </h2>
          <p>The practical details, before the first invitation goes out.</p>
        </div>
        <div className="lp-faq-list">
          {FAQS.map(([question, answer], index) => {
            const open = faq === index;
            return (
              <div className={open ? "lp-faq-item on" : "lp-faq-item"} key={question}>
                <button type="button" aria-expanded={open} onClick={() => setFaq(open ? -1 : index)}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>{question}</span>
                  <i className={open ? "on" : ""}>+</i>
                </button>
                <p hidden={!open}>{answer}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="lp-finale"
        onMouseEnter={() => setBurst((value) => value + 1)}
        onClick={() => setBurst((value) => value + 1)}
      >
        {burst > 0
          ? Array.from({ length: 24 }, (_, i) => (
              <span
                key={`${burst}-${i}`}
                className="lp-confetti"
                aria-hidden="true"
                style={{
                  left: `${(i * 41) % 100}%`,
                  width: 8 + (i % 3) * 4,
                  height: 12 + (i % 2) * 6,
                  background: CONFETTI[i % 5],
                  animationDuration: `${2 + (i % 4) * 0.4}s`,
                  animationDelay: `${(i % 6) * 0.1}s`,
                }}
              />
            ))
          : null}
        <div className="lp-finale-copy">
          <span className="lp-kicker-label">Start today</span>
          <h2>
            {narrow ? (
              <>
                More than a <em>forwarded PDF.</em>
              </>
            ) : (
              <>
                Your celebration deserves more than a <em>forwarded PDF.</em>
              </>
            )}
          </h2>
          <p>{narrow ? "Your first invite in about ten minutes. Free to design." : "Create your first invite in about ten minutes. Free to design — no sign-up needed."}</p>
          <div className="lp-ctas">
            <Link className="lp-cta" to="/create">
              Create your invitation — free <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="lp-checks">
            <span>✓ Free to design</span>
            <span>✓ No sign-up</span>
            <span>✓ Share on WhatsApp</span>
          </div>
        </div>
      </section>
      </main>

      <footer className="lp-foot">
        <Brand light />
        <nav aria-label="Footer">
          <Link to="/browse">Templates</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refunds">Refunds</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <small>© 2026 InvitesReady.com</small>
      </footer>
    </div>
  );
}
