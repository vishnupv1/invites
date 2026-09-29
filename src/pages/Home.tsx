import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./landing.css";

const WORDS = ["Invitations", "your", "guests", "open,", "answer", "and"];
const OCCASIONS = ["Weddings", "Nikah", "Engagements", "Baptisms", "Birthdays", "Housewarmings", "Anniversaries", "Receptions", "Naming ceremonies", "Festivals"];
const PETAL_COLORS = ["#E8A0A8", "#F2C6CB", "#C89B5B", "#EADCE4"];
const REPLIES = ["Vishnu's family · 4 guests", "Priya & Vivek · 2 guests", "Joseph Mathew · 3 guests", "Fathima & Arif · 2 guests"];
const QR = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1];
const CONFETTI = ["#C89B5B", "#F2DDB0", "#E8A0A8", "#FFFFFF", "#9FD3C4"];

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
  { name: "Royal Night", tag: "Animated", bg: "#0B1424", fg: "#F6E8C8", accent: "#D9B26A", font: '"Parisienne", cursive', sample: "Karthik & Nandana", kicker: "Shubh Vivah", to: "/templates" },
  { name: "Sunset Shore", tag: "Animated", bg: "#F7B38A", fg: "#1E3A44", accent: "#1F6F78", font: '"Allura", cursive', sample: "Rohan & Alisha", kicker: "One shore", to: "/preview/beach" },
  { name: "Happy Home", tag: "Animated", bg: "#DDEFE8", fg: "#2E2A25", accent: "#C8553D", font: '"Caveat", cursive', sample: "Our new home!", kicker: "Griha Pravesh", to: "/preview/hearth" },
  { name: "Heavenly Halo", tag: "Animated", bg: "#DCEBF7", fg: "#2F5E8A", accent: "#D9B26A", font: '"Great Vibes", cursive', sample: "Ethan", kicker: "Baptism", to: "/preview/baptism" },
  { name: "Emerald Nikah", tag: "Premium", bg: "#12352B", fg: "#FFFFFF", accent: "#C89B5B", font: '"Cormorant Garamond", serif', sample: "Imran & Safa", kicker: "Nikah", to: "/preview/gazal" },
  { name: "Garden Editorial", tag: "Free", bg: "#F6F0E6", fg: "#A44B32", accent: "#8A9A7B", font: '"Pinyon Script", cursive', sample: "Anna & Joel", kicker: "Save the date", to: "/preview/anna" },
];

const BARS = [
  ["Mehendi · 118 / 150", 79, "#C89B5B"],
  ["Wedding · 186 / 320", 58, "#6B3A5B"],
  ["Reception · 204 / 300", 68, "#6F8B74"],
] as const;

const PLANS = [
  { id: "free", name: "Free", sub: "For simple get-togethers", price: "₹0", items: ["Free templates", "1 function", "RSVP up to 50 guests", "Small InvitesReady credit"], cta: "Start free", featured: false },
  { id: "wedding", name: "Wedding", sub: "For multi-day celebrations", price: "", items: ["All animated & premium templates", "Unlimited functions & groups", "Reminders, QR check-in, photo wall", "No branding"], cta: "Plan my wedding", featured: true },
  { id: "premium", name: "Premium", sub: "Birthdays & family functions", price: "", items: ["All premium templates", "Up to 3 functions", "RSVP up to 300 guests", "No branding"], cta: "Go premium", featured: false },
];

const FAQS = [
  ["Do my guests need an app or an account?", "No. Guests open your link in any browser and RSVP in one tap — it works on basic phones too."],
  ["Can I design before signing up?", "Yes. Pick a template and customise it as a guest. We only ask you to log in when you publish, and your draft comes with you."],
  ["Can different guests see different functions?", "Yes. Put guests into groups and choose which functions each group sees."],
  ["Is our family information private?", "Pages can be password-protected, and the address can stay hidden until a guest says yes."],
  ["Can I edit after sending?", "Of course — every guest sees the latest version through the same link."],
] as const;

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

function Logo({ light = false }: { light?: boolean }) {
  const ring = light ? "#FAF7F2" : "#6B3A5B";
  return (
    <Link className="lp-logo" to="/" aria-label="invitesready.com">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <circle cx="18" cy="19" r="14" stroke={ring} strokeWidth="2.6" />
        <circle cx="18" cy="19" r="8" stroke="#C89B5B" strokeWidth="2.4" />
        <circle cx="18" cy="4" r="2.6" fill={ring} />
      </svg>
      <span>invitesready.com</span>
    </Link>
  );
}

export function Home() {
  const narrow = useNarrow();
  const [tick, setTick] = useState(0);
  const [how, setHow] = useState(0);
  const [howT, setHowT] = useState(0);
  const [spot, setSpot] = useState({ x: 70, y: 30 });
  const [faq, setFaq] = useState(0);
  const [burst, setBurst] = useState(0);
  const [menu, setMenu] = useState(false);

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

  const phone = PHONES[Math.floor(tick / 7) % PHONES.length];
  const lightCover = phone.bg === "#DDEFE8" || phone.bg === "#F7B38A";
  const head = 140 + (tick % 60) * 0.8;
  const headcount = String(Math.round(head));
  const pct = Math.round((head / 220) * 100);
  const reply = REPLIES[Math.floor(tick / 5) % REPLIES.length];
  const loop = [...OCCASIONS, ...OCCASIONS];
  const cards = [...TEMPLATES, ...TEMPLATES];

  function closeMenu() {
    setMenu(false);
  }

  return (
    <div className="lp">
      <header className="lp-nav">
        <Logo />
        <nav className="lp-links" aria-label="Main">
          <a href="#templates">Templates</a>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          )}
        </button>
      </header>
      {menu ? (
        <nav className="lp-menu" aria-label="Menu">
          <a href="#templates" onClick={closeMenu}>Templates</a>
          <a href="#how" onClick={closeMenu}>How it works</a>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <Link to="/login" onClick={closeMenu}>Log in</Link>
          <Link className="lp-create" to="/create" onClick={closeMenu}>
            Create invite — free
          </Link>
        </nav>
      ) : null}

      <section
        id="top"
        className="lp-hero"
        style={{ background: `radial-gradient(${narrow ? 360 : 600}px circle at ${spot.x}% ${spot.y}%, rgba(200,155,91,0.22), rgba(250,247,242,0) 70%), #FAF7F2` }}
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
          <g stroke="#C89B5B" strokeWidth="0.4">
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
                  <path d="M4 12C60 4 120 16 180 8s90 4 112 2" stroke="#C89B5B" strokeWidth="4" strokeLinecap="round" fill="none" />
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
            <Link className="lp-cta-line lp-btn" to="/templates">
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

      <section className="lp-marquee" aria-hidden="true">
        <div>
          <div className="lp-marquee-track">
            {loop.map((label, index) => (
              <span key={`${label}-${index}`}>
                {label} <i>✦</i>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="lp-how">
        <div className="lp-how-copy">
          <span className="lp-kicker-label">How it works</span>
          <h2>
            From idea to replies in <em>three steps.</em>
          </h2>
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
                    <u>
                      <i style={{ width: `${on ? Math.min(100, (howT + 1) * 12.5) : 0}%` }} />
                    </u>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="lp-how-stage">
          {how === 0 ? (
            <div className="lp-how-panel" key="pick">
              {HOW_CARDS.map((card, index) => (
                <div
                  key={card.text}
                  className="lp-how-slot"
                  style={{ transform: `translate(calc(-50% + ${Math.round(card.dx * (narrow ? 0.6 : 1))}px), -50%) rotate(${card.rot}deg)`, zIndex: index === 3 ? 2 : 1 }}
                >
                  <div className="lp-how-card" style={{ background: card.bg, color: card.fg, animationDelay: `${index * 0.2}s` }}>
                    <div style={{ borderColor: card.accent }}>
                      <span style={{ fontFamily: card.font }}>{card.text}</span>
                    </div>
                  </div>
                </div>
              ))}
              <span className="lp-typing">✏️ Typing “Anjali & Rahul”…</span>
            </div>
          ) : null}
          {how === 1 ? (
            <div className="lp-how-panel" key="share">
              <div className="lp-chat">
                <div className="lp-chat-out">
                  <div className="lp-chat-card">
                    <strong>
                      Anjali <em>&amp;</em> Rahul
                    </strong>
                    <small>invitesready.com/anjali-rahul</small>
                  </div>
                  <p>You're invited! Tap to RSVP 💌</p>
                  <em>10:24 ✓✓</em>
                </div>
                <div className="lp-chat-in" style={{ animationDelay: "1.3s" }}>
                  So beautiful!! We'll be there 🥳
                </div>
                <div className="lp-chat-in" style={{ animationDelay: "2.1s" }}>
                  {narrow ? "RSVP'd for all 3 functions 🙏" : "Just RSVP'd for all 3 functions 🙏"}
                </div>
              </div>
            </div>
          ) : null}
          {how === 2 ? (
            <div className="lp-how-panel" key="replies">
              <div className="lp-live">
                <div className="lp-live-top">
                  <span>Live RSVPs</span>
                  <strong>{headcount}</strong>
                </div>
                <div className="lp-bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                {RSVPS.map(([initials, name, status, color], index) => (
                  <div className="lp-live-row" key={name} style={{ animationDelay: `${0.2 + index * 0.25}s` }}>
                    <b style={{ background: color }}>{initials}</b>
                    <span>{name}</span>
                    <em className={status === "Pending" ? "wait" : "yes"}>{status}</em>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
          <Link className="lp-gold-link lp-btn" to="/templates">
            See all templates
          </Link>
        </div>
        <div className="lp-tpl-row">
          <div className="lp-tpl-track">
            {cards.map((template, index) => (
              <Link className="lp-tpl" to={template.to} key={`${template.name}-${index}`} style={{ background: template.bg, color: template.fg }}>
                <div className="lp-tpl-frame" style={{ borderColor: template.accent }}>
                  <small>{template.kicker}</small>
                  <strong style={{ fontFamily: template.font }}>{template.sample}</strong>
                </div>
                <span className={template.tag === "Free" ? "lp-tpl-badge free" : "lp-tpl-badge"}>{template.tag}</span>
                <span className="lp-tpl-name">{template.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="lp-tpl-more">
          <Link to="/templates">See all templates</Link>
        </div>
      </section>

      <section id="features" className="lp-features">
        <div className="lp-features-intro">
          <span className="lp-kicker-label">Everything, ready</span>
          <h2>
            Everything around the invite, <em>handled.</em>
          </h2>
        </div>
        <div className="lp-bento">
          <article className="lp-tile lp-bilingual">
            <div>
              <h3>Bilingual invites</h3>
              <p>English beside Malayalam, Tamil, Hindi and more — so grandparents and cousins abroad both feel at home.</p>
            </div>
            <div className="lp-flip" aria-hidden="true">
              <div>
                <span>You're invited</span>
                <span>സ്വാഗതം</span>
              </div>
            </div>
          </article>
          <article className="lp-tile paper">
            <h3>One-tap RSVP</h3>
            <p>{narrow ? "No login, no app." : "No login, no app — even on older phones."}</p>
            <div className="lp-join-demo">
              <i />
              <b>{narrow ? "Joining" : "Joyfully joining"}</b>
            </div>
          </article>
          <article className="lp-tile sand">
            <h3>{narrow ? "Private" : "Private by default"}</h3>
            <p>{narrow ? "Address after a yes." : "Address shown only after a guest says yes."}</p>
            <svg className="lp-lock" width="80" height="96" viewBox="0 0 80 96" aria-hidden="true">
              <path d="M20 44V30a20 20 0 0 1 40 0v14" stroke="#6B3A5B" strokeWidth="7" fill="none" strokeLinecap="round" />
              <rect x="8" y="42" width="64" height="50" rx="12" fill="#6B3A5B" />
              <circle cx="40" cy="64" r="7" fill="#C89B5B" />
            </svg>
          </article>
          <article className="lp-tile paper lp-order-fns">
            <h3>Every function, one link</h3>
            <div className="lp-fns">
              {BARS.map(([name, width, color], index) => (
                <div key={name}>
                  <span>{name}</span>
                  <div className="lp-bar">
                    <i style={{ width: `${width}%`, background: color, animationDelay: `${0.2 + index * 0.25}s` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="lp-tile ink lp-order-qr">
            <h3>QR check-in</h3>
            <p>{narrow ? "At the venue." : "Welcome guests at the venue in seconds."}</p>
            <div className="lp-qr" aria-hidden="true">
              {QR.map((cell, index) => (
                <i key={index} style={{ background: cell ? "#211C1E" : "transparent" }} />
              ))}
              <u />
            </div>
          </article>
          <article className="lp-tile mist lp-music lp-order-music">
            <div>
              <h3 className="lp-long">Music, maps, countdowns &amp; a wishes wall</h3>
              <h3 className="lp-short">Music</h3>
              <p className="lp-long">Everything a guest needs on one beautiful page — with background music they can play at a tap.</p>
              <p className="lp-short">Plays at a tap.</p>
            </div>
            <div className="lp-eq" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} style={{ background: i % 2 ? "#C89B5B" : "#6B3A5B", animationDuration: `${0.7 + (i % 5) * 0.15}s`, animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="pricing" className="lp-pricing">
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
              <div className="lp-plan-inner">
                {plan.featured ? <b>Most loved</b> : null}
                <h3>{plan.name}</h3>
                <span>{plan.sub}</span>
                {plan.price ? <strong>{plan.price}</strong> : null}
                <ul>
                  {plan.items.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
                <Link className="lp-btn" to="/create">
                  {plan.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="lp-faq">
        <div className="lp-faq-intro">
          <span className="lp-kicker-label">FAQ</span>
          <h2>Questions families ask us.</h2>
        </div>
        <div className="lp-faq-list">
          {FAQS.map(([question, answer], index) => {
            const open = faq === index;
            return (
              <div className="lp-faq-item" key={question}>
                <button type="button" aria-expanded={open} onClick={() => setFaq(open ? -1 : index)}>
                  <span>{question}</span>
                  <i className={open ? "on" : ""}>+</i>
                </button>
                {open ? <p>{answer}</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="lp-finale">
        <div
          className="lp-finale-card"
          onMouseEnter={() => setBurst((value) => value + 1)}
          onClick={() => setBurst((value) => value + 1)}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="lp-lantern"
              aria-hidden="true"
              style={{ left: `${6 + i * 12}%`, fontSize: 22 + (i % 3) * 8, animationDuration: `${8 + (i % 4) * 2}s`, animationDelay: `-${i * 1.3}s` }}
            >
              🏮
            </span>
          ))}
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

      <footer className="lp-foot">
        <Logo light />
        <nav aria-label="Footer">
          <Link to="/templates">Templates</Link>
          <a href="#pricing">Pricing</a>
          <a href="#faq">Help</a>
          <a href="#faq">Privacy</a>
          <a className="desk-link" href="#faq">
            Terms
          </a>
        </nav>
        <small>© 2026 InvitesReady.com</small>
      </footer>
    </div>
  );
}
