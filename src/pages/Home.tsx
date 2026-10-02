import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Sparkle } from "lucide-react";
import { Brand } from "../components/Brand";
import { InviteView } from "../components/InviteView";
import { getTemplate, sampleFor } from "../data/templates";
import "./landing.css";

const WORDS = ["Invitations", "your", "guests", "open,", "answer", "and"];
const OCCASIONS = ["Weddings", "Nikah", "Engagements", "Baptisms", "Birthdays", "Housewarmings", "Anniversaries", "Receptions", "Naming ceremonies", "Festivals"];
const OCCASION_GROUPS = [["Weddings", "Nikah", "Engagements"], ["Baptisms", "Birthdays", "Naming ceremonies"], ["Housewarmings", "Anniversaries", "Receptions", "Festivals"]];
const LANG_CHIPS = ["English", "മലയാളം", "தமிழ்", "हिन्दी"];
const LANG_DEMOS = [
  { chip: "English", script: "latin", invite: "Together with their families", names: ["Anjali", "Rahul"], joiner: "&", date: "Sunday, 14 February 2027", venue: "The garden pavilion", event: "Wedding", place: "Kochi", theme: { wash: "#FBF8F5", deep: "#4A263E", accent: "#D81B60", soft: "#FCEFF4", orb: "#F6DCE2", orb2: "#E6C893", petal: "#F23F78", petal2: "#FF7380", petal3: "#D81B60" } },
  { chip: "മലയാളം", script: "malayalam", invite: "കുടുംബാംഗങ്ങളോടൊപ്പം", names: ["അഞ്ജലി", "രാഹുൽ"], joiner: "&", date: "ഞായർ, 14 ഫെബ്രുവരി 2027", venue: "ഗാർഡൻ പവിലിയൻ", event: "വിവാഹം", place: "കൊച്ചി", theme: { wash: "#F5F1E8", deep: "#234A3B", accent: "#B8893F", soft: "#E8F0E8", orb: "#DCE8D9", orb2: "#F1DDB0", petal: "#8BA98A", petal2: "#D7B879", petal3: "#B8893F" } },
  { chip: "தமிழ்", script: "tamil", invite: "குடும்பத்துடன்", names: ["அஞ்சலி", "ராகுல்"], joiner: "&", date: "ஞாயிறு, 14 பிப்ரவரி 2027", venue: "தோட்ட அரங்கம்", event: "திருமணம்", place: "கொச்சி", theme: { wash: "#FBF3EA", deep: "#6B3A5B", accent: "#C8553D", soft: "#FCE8DD", orb: "#F6DCE2", orb2: "#E6C893", petal: "#F23F78", petal2: "#C8553D", petal3: "#D9B26A" } },
  { chip: "हिन्दी", script: "devanagari", invite: "सपरिवार आमंत्रित", names: ["अंजलि", "राहुल"], joiner: "&", date: "रविवार, 14 फ़रवरी 2027", venue: "गार्डन पवेलियन", event: "विवाह", place: "कोच्चि", theme: { wash: "#F8F0E4", deep: "#4A263E", accent: "#B8893F", soft: "#F5E7D1", orb: "#E8C987", orb2: "#DCE8D9", petal: "#D81B60", petal2: "#E6C893", petal3: "#C8553D" } },
];
const PETAL_COLORS = ["#F23F78", "#FF7380", "#D81B60", "#FCEFF4"];
const REPLIES = ["Vishnu's family · 4 guests", "Priya & Vivek · 2 guests", "Joseph Mathew · 3 guests", "Fathima & Arif · 2 guests"];
const DEMO_SLIDES = [
  { id: "vivah", event: "marriage", reply: REPLIES[0] },
  { id: "beach", event: "marriage", reply: REPLIES[1] },
  { id: "baptism", event: "baptism", reply: REPLIES[2] },
  { id: "hearth", event: "housewarming", reply: REPLIES[3] },
];
const loop = OCCASIONS;
const QR = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1];
const CONFETTI = ["#D81B60", "#F23F78", "#FF7380", "#FFFFFF", "#FCEFF4"];

const PHONES = [
  {
    kicker: "Together with their families",
    names: "Anjali & Rahul",
    date: "Sunday, 14 Feb 2027 · Kochi",
    bg: "#6B3A5B",
    fg: "#FFFFFF",
    accent: "#E6C893",
    font: '"Cormorant Garamond", serif',
    weight: 600,
    stars: false,
    waves: false,
    events: [
      ["Mehendi", "FRI 12 FEB · 5:00 PM"],
      ["Wedding", "SUN 14 FEB · 10:30 AM"],
      ["Reception", "SUN 14 FEB · 7:00 PM"],
    ],
  },
  {
    kicker: "Shubh Vivah",
    names: "Karthik & Nandana",
    date: "12 · 02 · 2027 · Guruvayur",
    bg: "#0B1424",
    fg: "#F6E8C8",
    accent: "#D9B26A",
    font: '"Parisienne", cursive',
    weight: 400,
    stars: true,
    waves: false,
    events: [
      ["Sangeet", "THU 11 FEB · 6:00 PM"],
      ["Muhurtham", "FRI 12 FEB · 10:30 AM"],
      ["Reception", "FRI 12 FEB · 7:00 PM"],
    ],
  },
  {
    kicker: "Two hearts · one shore",
    names: "Rohan & Alisha",
    date: "Sat, 20 Mar 2027 · Varkala",
    bg: "#F7B38A",
    fg: "#1E3A44",
    accent: "#1F6F78",
    font: '"Allura", cursive',
    weight: 400,
    stars: false,
    waves: true,
    events: [
      ["Sunset vows", "SAT · 5:30 PM"],
      ["Beach reception", "SAT · 7:30 PM"],
      ["Bonfire", "SAT · 10:30 PM"],
    ],
  },
  {
    kicker: "Griha Pravesh",
    names: "Our new home!",
    date: "Sun, 17 Jan 2027 · Kakkanad",
    bg: "#DDEFE8",
    fg: "#2E2A25",
    accent: "#C8553D",
    font: '"Caveat", cursive',
    weight: 700,
    stars: false,
    waves: false,
    events: [
      ["Pooja", "6:30 AM"],
      ["Paalukachal", "7:15 AM"],
      ["Sadya lunch", "12:00 PM"],
    ],
  },
] as const;

const STEPS = [
  ["01", "Pick & personalise", "Choose a template and add your names, photos and every function — no sign-up needed."],
  ["02", "Share on WhatsApp", "Send one link from your own WhatsApp. Guests open it instantly — no app."],
  ["03", "Watch replies arrive", "Headcounts, meals and wishes land in your dashboard in real time."],
] as const;

const HOW_CARDS = [
  { bg: "#FAF7F2", fg: "#4A263E", accent: "#C89B5B", font: '"Cormorant Garamond", serif', text: "Devika & Hari", rot: -18, dx: -120 },
  { bg: "#0B1424", fg: "#F6E8C8", accent: "#D9B26A", font: '"Parisienne", cursive', text: "Karthik & Nandana", rot: -6, dx: -40 },
  { bg: "#F6F0E6", fg: "#A44B32", accent: "#8A9A7B", font: '"Pinyon Script", cursive', text: "Anna & Joel", rot: 6, dx: 40 },
  { bg: "#6B3A5B", fg: "#FFFFFF", accent: "#E6C893", font: '"Cormorant Garamond", serif', text: "Anjali & Rahul", rot: 0, dx: 0 },
];

const RSVPS = [
  ["MF", "Vishnu's family", "Attending", "#6B3A5B"],
  ["PV", "Priya & Vivek", "Attending", "#C89B5B"],
  ["JM", "Joseph Mathew", "Pending", "#6F8B74"],
  ["DT", "Design team", "Attending", "#4A263E"],
] as const;

const TEMPLATES = [
  { name: "Royal Night", tag: "Animated", bg: "#0B1424", fg: "#F6E8C8", accent: "#D9B26A", font: '"Parisienne", cursive', sample: "Karthik & Nandana", kicker: "Shubh Vivah", to: "/create?template=vivah" },
  { name: "Sunset Shore", tag: "Animated", bg: "#F7B38A", fg: "#1E3A44", accent: "#1F6F78", font: '"Allura", cursive', sample: "Rohan & Alisha", kicker: "One shore", to: "/create?template=beach" },
  { name: "Blush Botanica", tag: "Animated", bg: "#F3E3D6", fg: "#3A2E2A", accent: "#B8893F", font: '"Alex Brush", cursive', sample: "Nila & Kiran", kicker: "Wedding", to: "/create?template=botanica" },
  { name: "Happy Home", tag: "Animated", bg: "#DDEFE8", fg: "#2E2A25", accent: "#C8553D", font: '"Caveat", cursive', sample: "Our new home!", kicker: "Griha Pravesh", to: "/create?template=hearth" },
  { name: "Heavenly Halo", tag: "Animated", bg: "#DCEBF7", fg: "#2F5E8A", accent: "#D9B26A", font: '"Great Vibes", cursive', sample: "Ethan", kicker: "Baptism", to: "/create?template=baptism" },
  { name: "Emerald Nikah", tag: "Premium", bg: "#12352B", fg: "#FFFFFF", accent: "#C89B5B", font: '"Cormorant Garamond", serif', sample: "Imran & Safa", kicker: "Nikah", to: "/create?template=gazal" },
  { name: "Garden Editorial", tag: "Free", bg: "#F6F0E6", fg: "#A44B32", accent: "#8A9A7B", font: '"Pinyon Script", cursive', sample: "Anna & Joel", kicker: "Save the date", to: "/create?template=anna" },
];

const BARS = [
  ["Mehendi · 118 / 150", 79, "#F23F78"],
  ["Wedding · 186 / 320", 58, "#D81B60"],
  ["Reception · 204 / 300", 68, "#2E8B57"],
] as const;

const PLANS = [
  { id: "free", name: "Free", kicker: "Start here", sub: "For simple get-togethers", price: "₹0", note: "forever", items: ["Free templates", "1 function", "RSVP up to 50 guests", "Small InvitesReady credit"], cta: "Start free", featured: false },
  { id: "wedding", name: "Wedding", kicker: "Most popular", sub: "For multi-day celebrations", price: "", note: "one-time per event", items: ["All animated & premium templates", "Unlimited functions & groups", "Reminders, QR check-in, photo wall", "No branding"], cta: "Plan my wedding", featured: true },
  { id: "premium", name: "Premium", kicker: "For family events", sub: "Birthdays & family functions", price: "", note: "one-time per event", items: ["All premium templates", "Up to 3 functions", "RSVP up to 300 guests", "No branding"], cta: "Go premium", featured: false },
];

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
  { href: "/pricing", label: "Pricing" },
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

function PricingMandala({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <g stroke="#F23F78" strokeWidth="0.45">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="70" />
        <circle cx="100" cy="100" r="40" />
        <path d="M100 4c12 30 12 62 0 96-12-34-12-66 0-96zM196 100c-30 12-62 12-96 0 34-12 66-12 96 0zM100 196c-12-30-12-62 0-96 12 34 12 66 0 96zM4 100c30-12 62-12 96 0-34 12-66 12-96 0z" />
      </g>
    </svg>
  );
}

function PlanCheck({ light = false }: { light?: boolean }) {
  const stroke = light ? "#FF7380" : "#D81B60";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke={stroke} strokeWidth="1.2" />
      <path d="M4.7 8.15 6.9 10.3 11.3 5.7" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Home({ focus }: { focus?: string }) {
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
  const phone = PHONES[Math.floor(tick / 7) % PHONES.length];
  const lightCover = phone.bg !== "#0B1424";
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
            <span><Check size={16} aria-hidden="true" /> No app for guests</span>
            <span><Check size={16} aria-hidden="true" /> {narrow ? "Design free" : "Design free, no sign-up"}</span>
            <span><Check size={16} aria-hidden="true" /> Pay once per event</span>
          </div>
        </div>

        <div className="lp-stage">
          <div className="lp-phone">
            <div className="lp-phone-screen">
              {template && fields ? (
                <div className="lp-phone-live" key={slide.id}>
                  <div className="lp-phone-live-stage">
                    <InviteView template={template} fields={fields} />
                  </div>
                </div>
              ) : null}
              <div className="lp-screen" key={phone.names}>
                <div className="lp-cover" style={{ background: phone.bg, color: phone.fg }}>
                  {phone.stars
                    ? Array.from({ length: 6 }, (_, i) => (
                        <span key={i} className="lp-star" style={{ left: 20 + i * 50, top: 18 + (i % 3) * 24, animationDuration: `${1.6 + i * 0.3}s` }} />
                      ))
                    : null}
                  <span className="lp-kicker">{phone.kicker}</span>
                  <span className="lp-names" style={{ fontFamily: phone.font, fontWeight: phone.weight }}>
                    {phone.names}
                  </span>
                  <span className="lp-date">{phone.date}</span>
                  {phone.waves ? (
                    <div className="lp-waves" aria-hidden="true">
                      <div>
                        <svg width="640" height="40" viewBox="0 0 1600 100" preserveAspectRatio="none">
                          <path d="M0 40C100 10 200 70 300 40S500 10 600 40 800 70 900 40 1100 10 1200 40 1400 70 1500 40 1600 40V100H0z" fill="#1F6F78" />
                        </svg>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="lp-sheet">
                  <div className="lp-count">
                    {[
                      ["142", "DAYS"],
                      ["06", "HOURS"],
                      ["32", "MINS"],
                    ].map(([value, label]) => (
                      <div key={label}>
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  {phone.events.map(([name, when]) => (
                    <div className="lp-fn" key={name}>
                      <div>
                        <strong>{name}</strong>
                        <small>{when}</small>
                      </div>
                      <em style={{ color: lightCover ? phone.accent : "#6B3A5B" }}>Map</em>
                    </div>
                  ))}
                  <div className="lp-join">
                    <span style={{ background: lightCover ? phone.accent : phone.bg }}>Joyfully joining</span>
                    <i>Can't make it</i>
                  </div>
                  <span className="lp-join-solo" style={{ background: lightCover ? phone.accent : phone.bg }}>
                    Joyfully joining
                  </span>
                </div>
              </div>
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
            {PHONES.map((item) => (
              <i key={item.names} style={{ width: item.names === phone.names ? 28 : 8, background: item.names === phone.names ? "#6B3A5B" : "#D8CCBF" }} />
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

      <section id="how" className="lp-how">
        <div className="lp-how-glow" aria-hidden="true"><i className="a" /><i className="b" /><span /></div>
        <div className="lp-how-copy">
          <span className="lp-kicker-label">How it works</span>
          <h2>{STEPS[how]?.[1]}</h2>
          <p className="lp-how-lede">{STEPS[how]?.[2]}</p>
          <div className="lp-how-progress" aria-label={`Step ${how + 1} of ${STEPS.length}`}>
            {STEPS.map((step, index) => <button key={step[0]} type="button" aria-pressed={how === index} onClick={() => { setHow(index); setHowT(0); }}>{step[0]}</button>)}
            <span aria-hidden="true" style={{ width: `${(howT / 8) * 100}%` }} />
          </div>
        </div>
        <div className="lp-how-stage" aria-label="Invitation examples" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, minHeight: 300 }}>
          {HOW_CARDS.map((card, index) => <div key={card.text} className="lp-how-card" style={{ background: card.bg, color: card.fg, border: `2px solid ${card.accent}`, padding: 18, transform: `rotate(${card.rot + (index === how ? 0 : card.dx / 30)}deg)`, zIndex: index === how ? 2 : 1 }}><span style={{ fontFamily: card.font }}>{card.text}</span></div>)}
          <div className="lp-how-replies">{RSVPS.map(([initials, name, status, color]) => <span key={initials}><i style={{ background: color }}>{initials}</i>{name}<small>{status}</small></span>)}</div>
        </div>
      </section>

      <section className="lp-marquee" aria-hidden="true">
        <div>
          <div className="lp-marquee-track">
            {loop.map((label, index) => (
              <span key={`${label}-${index}`}>
                {label} <i><Sparkle size={16} aria-hidden="true" /></i>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="templates" className="lp-templates">
        <div className="lp-templates-head">
          <div>
            <span className="lp-kicker-label" style={{ color: "#E6C893" }}>
              Templates
            </span>
            <h2>
              Invitations that <em>move.</em>
            </h2>
            <p>{narrow ? "Palace doors, sunsets and houses that build themselves." : "Palace doors that open, sunsets that set, houses that build themselves. Hover to peek."}</p>
          </div>
          <Link className="lp-gold-link lp-btn" to="/browse">
            See all templates
          </Link>
        </div>
        <div className="lp-tpl-row" ref={tplRow} tabIndex={0} role="region" aria-label="Invitation templates">
          <div className="lp-tpl-track">
            {cards.map((template, index) => (
              <Link draggable={false} className="lp-tpl" to={template.to} key={`${template.name}-${index}`} style={{ background: template.bg, color: template.fg }}>
                <div className="lp-tpl-frame" style={{ borderColor: template.accent }}>
                  <small>{template.kicker}</small>
                  <strong style={{ fontFamily: template.font }}>{template.sample}</strong>
                </div>
                {template.tag === "Animated" ? null : <span className={template.tag === "Free" ? "lp-tpl-badge free" : "lp-tpl-badge"}>{template.tag}</span>}
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
              {BARS.map(([name, width, color], index) => (
                <div key={name}>
                  <div className="lp-fns-meta">
                    <span>{name.split(" · ")[0]}</span>
                    <em>{name.split(" · ")[1]}</em>
                  </div>
                  <div className="lp-bar">
                    <i style={{ width: `${width}%`, background: color, animationDelay: `${0.2 + index * 0.25}s` }} />
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

      <section id="pricing" className="lp-pricing">
        <PricingMandala className="lp-pricing-mandala" />
        <div className="lp-pricing-intro">
          <span className="lp-kicker-label">Pricing</span>
          <h2>
            Design free. <em>Pay once</em> to share.
          </h2>
          <p>No subscriptions. One price per event.</p>
        </div>
        <div className="lp-plans">
          {PLANS.map((plan) => (
            <article key={plan.id} className={plan.featured ? `lp-plan featured ${plan.id}` : `lp-plan ${plan.id}`}>
              <p className="lp-plan-kicker">{plan.kicker}</p>
              <h3>{plan.name}</h3>
              <p className="lp-plan-sub">{plan.sub}</p>
              <p className="lp-plan-price">
                <strong>{plan.price}</strong>
                <span>{plan.note}</span>
              </p>
              <ul>
                {plan.items.map((item) => (
                  <li key={item}><PlanCheck light={plan.featured} /> {item}</li>
                ))}
              </ul>
              <Link className="lp-plan-cta" to="/create">
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="lp-faq">
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
                <span className="lp-desk-line">Your celebration deserves more than a </span>
                <em>forwarded PDF.</em>
              </>
            )}
          </h2>
          <p>{narrow ? "Your first invite in about ten minutes. Free to design." : "Create your first invite in about ten minutes. Free to design — no sign-up needed."}</p>
          <Link className="lp-shine lp-btn" to="/create">
            Create your invitation — free →
          </Link>
        </div>
      </section>
      </main>

      <footer className="lp-foot">
        <Brand light />
        <nav aria-label="Footer">
          <Link to="/browse">Templates</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refunds">Refunds</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <nav className="lp-social" aria-label="Social">
          <a href="https://www.facebook.com/profile.php?id=61594844762009" target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M14.5 8.5V6.8c0-.6.4-.8.8-.8H17V3.5h-2.4C12.1 3.5 11 4.9 11 7.1v1.4H9v2.7h2V20h2.8v-8.8h2.3l.4-2.7h-2.7z" />
            </svg>
            <span className="lp-sr">Facebook</span>
          </a>
          <a href="https://www.instagram.com/invitesready/" target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span className="lp-sr">Instagram</span>
          </a>
        </nav>
        <small>© 2026 InvitesReady.com</small>
      </footer>
    </div>
  );
}
