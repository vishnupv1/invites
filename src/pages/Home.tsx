import { useState } from "react";
import { Link } from "react-router-dom";
import "./landing.css";

const occasions = [
  { to: "/c/marriage", label: "Weddings" },
  { to: "/c/engagement", label: "Engagements" },
  { to: "/c/birthday", label: "Birthdays" },
  { to: "/c/housewarming", label: "Housewarmings" },
  { to: "/c/anniversary", label: "Anniversaries" },
  { to: "/c/reception", label: "Receptions" },
];

const steps = [
  {
    n: "01",
    title: "Design",
    text: "Choose the celebration, then a style made only for that day. Add the names, a few photographs, a song if you have one, and the place.",
  },
  {
    n: "02",
    title: "Share the link",
    text: "Publish one link and send it yourself — WhatsApp, a message, or an email. Guests open it in the browser. No app to install.",
  },
  {
    n: "03",
    title: "Read the replies",
    text: "They say yes or leave a wish on the page. Your studio keeps the count, so you are not collecting answers in a group chat.",
  },
];

const features = [
  {
    title: "A style for the day",
    text: "Wedding, reception, birthday, anniversary, engagement, and housewarming each keep their own designs.",
    icon: "calendar",
  },
  {
    title: "Photographs",
    text: "Paid styles carry a row of pictures. The free wedding note stays a letter.",
    icon: "photo",
  },
  {
    title: "A song, if you have one",
    text: "Evening styles can hold a track. Leave it quiet when the day does not need music.",
    icon: "music",
  },
  {
    title: "The venue on a map",
    text: "Search the hall or the house. Guests open the pin from the invitation.",
    icon: "pin",
  },
  {
    title: "Wishes on the page",
    text: "Guests write a line and send it. No account, and no app on their phone.",
    icon: "note",
  },
  {
    title: "Bought once",
    text: "One wedding note is free. Every other style is a single purchase, with no subscription after.",
    icon: "once",
  },
];

const guests = [
  { name: "The Menon family", group: "Family", count: "4", status: "Attending" },
  { name: "Priya & Vivek", group: "Friends", count: "2", status: "Attending" },
  { name: "Joseph Mathew", group: "Family", count: "3", status: "Pending" },
  { name: "Design team", group: "Work", count: "8", status: "Attending" },
  { name: "Lakshmi Aunty", group: "Family", count: "1", status: "Declined" },
];

const faqs = [
  {
    q: "Do guests need an app or an account?",
    a: "No. They open the link in a browser, read the invitation, and send a reply from the page.",
  },
  {
    q: "How do I send the invitation?",
    a: "You publish a link and share it yourself, on WhatsApp or anywhere else. Everyone who opens it sees the same page.",
  },
  {
    q: "What is free, and what is bought?",
    a: "Gazal is free. You add the names, the Nikah, and the walima, then share one link.",
  },
  {
    q: "Can I change the invitation after I send it?",
    a: "Publish again when the details change. The new link is the one guests should open.",
  },
];

export function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const [menu, setMenu] = useState(false);

  return (
    <div className="lp">
      <header className="lp-nav">
        <Link className="brand" to="/">
          <Mark />
          <span>invitesready.com</span>
        </Link>
        <nav className="lp-links">
          <a href="#templates">Templates</a>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="lp-actions">
          <Link className="text-link" to="/login">
            Log in
          </Link>
          <Link className="btn btn-fill lp-create" to="/create/gazal?event=marriage">
            Create invite
          </Link>
          <button
            type="button"
            className="lp-burger"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu((open) => !open)}
          >
            {menu ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </header>
      {menu ? (
        <nav className="lp-drawer" aria-label="Menu" onClick={() => setMenu(false)}>
          <a href="#templates">Templates</a>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <Link to="/create/gazal?event=marriage">Create your invitation</Link>
        </nav>
      ) : null}

      <section className="hero">
        <div className="hero-copy">
          <div className="badge">
            <span />
            Made for weddings and family functions
          </div>
          <h1>
            Invitations your guests open, answer and <em>remember.</em>
          </h1>
          <p>
            Design an invitation, share one link, and collect replies on the page — for a wedding,
            a birthday, or the evening after.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-fill btn-lg" to="/create/gazal?event=marriage">
              Create your invitation — free
              <Arrow />
            </Link>
            <a className="btn btn-line btn-lg" href="#templates">
              Browse templates
            </a>
          </div>
          <ul className="checks">
            <li>
              <Check /> No app for guests
            </li>
            <li>
              <Check /> A reply on the page
            </li>
            <li>
              <Check /> One style, bought once
            </li>
          </ul>
        </div>

        <div className="phone-stage" aria-hidden="true">
          <div className="phone">
            <div className="phone-screen">
              <div className="phone-hero">
                <Diamond />
                <div className="phone-kicker">Together with their families</div>
                <div className="phone-names">
                  Anjali <em>&amp;</em> Rahul
                </div>
                <div className="phone-when">Sunday, 14 February 2027 · Kochi</div>
              </div>
              <div className="phone-body">
                <div className="count">
                  <div>
                    <strong>142</strong>
                    <span>Days</span>
                  </div>
                  <div>
                    <strong>06</strong>
                    <span>Hours</span>
                  </div>
                  <div>
                    <strong>32</strong>
                    <span>Mins</span>
                  </div>
                </div>
                <div className="phone-label">Your functions</div>
                <div className="func">
                  <div>
                    <strong>Mehendi</strong>
                    <span>Fri 12 Feb · 5:00 PM</span>
                  </div>
                  <em>Map</em>
                </div>
                <div className="func">
                  <div>
                    <strong>Wedding</strong>
                    <span>Sun 14 Feb · 10:30 AM</span>
                  </div>
                  <em>Map</em>
                </div>
                <div className="func">
                  <div>
                    <strong>Reception</strong>
                    <span>Sun 14 Feb · 7:00 PM</span>
                  </div>
                  <em>Map</em>
                </div>
                <div className="phone-rsvp">
                  <span>Joyfully joining</span>
                  <span>Can’t make it</span>
                </div>
              </div>
            </div>
          </div>
          <div className="float float-rsvp">
            <div className="tick">
              <Check />
            </div>
            <div>
              <strong>New reply</strong>
              <span>The Menon family · 4 guests</span>
            </div>
          </div>
          <div className="float float-count">
            <span>Headcount</span>
            <div>
              <strong>186</strong> attending
            </div>
            <div className="bar">
              <i />
            </div>
          </div>
        </div>
      </section>

      <section id="occasions" className="lp-occasions">
        <p>One place for every occasion</p>
        <div>
          {occasions.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section id="how" className="how">
        <div className="section-intro">
          <p>How it works</p>
          <h2>From idea to replies in three steps.</h2>
        </div>
        <div className="lp-steps">
          {steps.map((step) => (
            <article key={step.n}>
              <span>{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="features">
        <div className="split-head">
          <div className="section-intro">
            <p>Around the invitation</p>
            <h2>Everything the day needs, on one link.</h2>
          </div>
          <p>
            Photographs, a song, the venue, and a place for wishes. Guests stay in the browser.
            You keep the replies.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title}>
              <Icon name={feature.icon} />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="templates" className="templates">
        <div className="split-head">
          <div className="section-intro">
            <p>Templates</p>
            <h2>Designs that feel like the occasion.</h2>
          </div>
          <Link className="btn btn-gold" to="/open/gazal">
            See Gazal
          </Link>
        </div>
        <div className="template-grid">
          <Link className="template" to="/open/gazal">
            <div className="art art-gold" style={{ background: "#12352b" }}>
              <div>
                <span>Nikah</span>
                <strong>Gazal</strong>
                <em>An opening card, then the invitation</em>
              </div>
            </div>
            <div className="template-meta">
              <div>
                <strong>Gazal</strong>
                <span>Marriage</span>
              </div>
              <em className="tag">Free</em>
            </div>
          </Link>
          <Link className="template" to="/open/aurelia">
            <div className="art art-gold" style={{ background: "#0b1020" }}>
              <div>
                <span>Wedding</span>
                <strong>Aurelia</strong>
                <em>A title screen, then the celebration</em>
              </div>
            </div>
            <div className="template-meta">
              <div>
                <strong>Aurelia</strong>
                <span>Marriage</span>
              </div>
              <em className="tag">Free</em>
            </div>
          </Link>
        </div>
      </section>

      <section className="dashboard">
        <div className="dash-copy">
          <p>Studio</p>
          <h2>Know who’s coming, without collecting chats.</h2>
          <p className="dash-text">
            Guests reply on the invitation. Your studio shows how many said yes, and the wishes
            they left.
          </p>
          <Link className="btn btn-fill" to="/studio">
            Open the studio
          </Link>
        </div>
        <div className="panel">
          <div className="panel-bar">
            <i />
            <i />
            <i />
            <span>Anjali & Rahul · Wedding</span>
          </div>
          <div className="stats">
            <div>
              <span>Invited</span>
              <strong>320</strong>
            </div>
            <div className="stat-on">
              <span>Attending</span>
              <strong>186</strong>
            </div>
            <div>
              <span>Awaiting reply</span>
              <strong>94</strong>
            </div>
            <div>
              <span>Declined</span>
              <strong>40</strong>
            </div>
          </div>
          <div className="guest-table">
            <div className="guest-head">
              <span>Guest</span>
              <span>Group</span>
              <span>Guests</span>
              <span>Status</span>
            </div>
            {guests.map((guest) => (
              <div key={guest.name}>
                <strong>{guest.name}</strong>
                <span>{guest.group}</span>
                <span>{guest.count}</span>
                <em className={`pill pill-${guest.status.toLowerCase()}`}>{guest.status}</em>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div className="section-intro center">
          <p>Pricing</p>
          <h2>Pay once for a style. No subscription.</h2>
          <span>Gazal is free. Add the names, the Nikah, and the walima, then share the link.</span>
        </div>
        <div className="prices">
          <article>
            <div>
              <h3>Free</h3>
              <p>Gazal</p>
            </div>
            <strong>$0</strong>
            <ul>
              <li>Opening card and Nikah page</li>
              <li>Ceremony and walima</li>
              <li>Photographs, a song, and a map when you add them</li>
              <li>Replies on the page</li>
            </ul>
            <Link className="btn btn-line" to="/create/gazal?event=marriage">
              Start free
            </Link>
          </article>
        </div>
      </section>

      <section id="faq" className="faq">
        <div className="section-intro">
          <p>FAQ</p>
          <h2>Questions families ask.</h2>
        </div>
        <div>
          {faqs.map((item, index) => {
            const open = openFaq === index;
            return (
              <div key={item.q} className="faq-item">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <i className={open ? "on" : ""}>+</i>
                </button>
                {open ? <p>{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="finale">
        <div>
          <h2>Your celebration deserves more than a forwarded PDF.</h2>
          <p>The free wedding note is a real invitation. Upgrade when the day wants photographs and a map.</p>
        </div>
        <Link className="btn btn-white btn-lg" to="/create/gazal?event=marriage">
          Create your invitation
        </Link>
      </section>

      <footer className="lp-foot">
        <div className="foot-top">
          <div>
            <Link className="brand light" to="/">
              <Mark gold />
              <span>invitesready.com</span>
            </Link>
            <p>Invitations for the wedding, and for the days around it.</p>
          </div>
          <div className="foot-cols">
            <div>
              <span>Product</span>
              <a href="#templates">Templates</a>
              <a href="#pricing">Pricing</a>
              <a href="#features">Features</a>
              <Link to="/studio">Studio</Link>
            </div>
            <div>
              <span>Celebrations</span>
              <Link to="/c/marriage">Weddings</Link>
              <Link to="/c/reception">Receptions</Link>
              <Link to="/c/birthday">Birthdays</Link>
              <Link to="/c/housewarming">Housewarmings</Link>
            </div>
            <div>
              <span>Also</span>
              <Link to="/c/engagement">Engagements</Link>
              <Link to="/c/anniversary">Anniversaries</Link>
              <a href="#faq">FAQ</a>
              <a href="#how">How it works</a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 invitesready.com</span>
          <span>One free note. Every other style is bought once.</span>
        </div>
      </footer>
    </div>
  );
}

function Mark({ gold = false }: { gold?: boolean }) {
  const ring = gold ? "#C89B5B" : "#6B3A5B";
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="15" stroke={ring} strokeWidth="2.5" />
      <circle cx="18" cy="18" r="8" stroke="#C89B5B" strokeWidth="2" />
      <circle cx="18" cy="3" r="3" fill={gold ? "#C89B5B" : "#6B3A5B"} />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Diamond() {
  return (
    <svg width="120" height="18" viewBox="0 0 120 18" fill="none" aria-hidden="true">
      <path d="M0 9h44M76 9h44" stroke="#C89B5B" strokeWidth="1.2" />
      <path d="M60 1l8 8-8 8-8-8z" stroke="#C89B5B" strokeWidth="1.4" />
    </svg>
  );
}

function Icon({ name }: { name: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#6B3A5B",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  return (
    <div className="icon">
      {name === "calendar" ? (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ) : null}
      {name === "photo" ? (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="M21 16l-5-5-9 8" />
        </svg>
      ) : null}
      {name === "music" ? (
        <svg {...common}>
          <path d="M9 18V6l12-2v12" />
          <circle cx="7" cy="18" r="2.5" />
          <circle cx="19" cy="16" r="2.5" />
        </svg>
      ) : null}
      {name === "pin" ? (
        <svg {...common}>
          <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      ) : null}
      {name === "note" ? (
        <svg {...common}>
          <path d="M5 4h10l4 4v12H5z" />
          <path d="M15 4v4h4M8 12h8M8 16h5" />
        </svg>
      ) : null}
      {name === "once" ? (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M7 15h4" />
        </svg>
      ) : null}
    </div>
  );
}
