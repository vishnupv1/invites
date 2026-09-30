import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listEvents, listTemplates, type CatalogEvent } from "../api";
import { EVENTS } from "../data/events";
import { TEMPLATES, eventLabels, formatPrice, withCatalogMeta } from "../data/templates";
import type { Template } from "../types";
import "./all-templates.css";

const FALLBACK: Record<string, string> = {
  gazal: "#12352B",
  aurelia: "#0B1424",
  anna: "#F6F0E6",
  baptism: "#DCEBF7",
  vivah: "#4A0D1F",
  beach: "#F7B38A",
  hearth: "#DDEFE8",
  shaadi: "#4A0D1F",
  thiruvizha: "#7A1633",
  peace: "#F8E6E4",
  botanica: "#F3E3D6",
};

function Logo({ light = false }: { light?: boolean }) {
  const ring = light ? "#FAF7F2" : "#6B3A5B";
  return (
    <Link className="cat-logo" to="/" aria-label="invitesready.com">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <circle cx="18" cy="19" r="14" stroke={ring} strokeWidth="2.6" />
        <circle cx="18" cy="19" r="8" stroke="#C89B5B" strokeWidth="2.4" />
        <circle cx="18" cy="4" r="2.6" fill={ring} />
      </svg>
      <span>invitesready.com</span>
    </Link>
  );
}

export function AllTemplates() {
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<CatalogEvent[]>(EVENTS);
  const [catalog, setCatalog] = useState<Template[]>(TEMPLATES);
  const [occasion, setOccasion] = useState("all");
  const [price, setPrice] = useState<"All" | "Free" | "Paid">("All");
  const [sort, setSort] = useState("name");
  const [broken, setBroken] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents(EVENTS));
    listTemplates()
      .then((rows) => setCatalog(rows.map(withCatalogMeta)))
      .catch(() => setCatalog(TEMPLATES));
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog.filter((template) => {
      const labels = template.events.map((id) => events.find((event) => event.id === id)?.label ?? "");
      const occasionOk = occasion === "all" || template.events.includes(occasion as Template["events"][number]);
      const priceOk = price === "All" || (price === "Free" ? template.free : !template.free);
      const text = `${template.name} ${template.tagline} ${template.description} ${labels.join(" ")}`.toLowerCase();
      return occasionOk && priceOk && (!q || text.includes(q));
    });
    if (sort === "price") return [...list].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, events, query, occasion, price, sort]);

  function clearFilters() {
    setOccasion("all");
    setPrice("All");
    setQuery("");
  }

  return (
    <div className="cat">
      <header className="cat-nav">
        <Logo />
        <nav className="cat-links" aria-label="Main">
          <Link to="/browse" aria-current="page">
            Templates
          </Link>
          <Link to="/#how">How it works</Link>
          <Link to="/#features">Features</Link>
          <Link to="/#pricing">Pricing</Link>
          <Link to="/#faq">FAQ</Link>
        </nav>
        <div className="cat-nav-actions">
          <Link className="cat-login" to="/login">
            Log in
          </Link>
          <Link className="cat-create" to="/create">
            Create invite
          </Link>
        </div>
        <button type="button" className="cat-burger" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
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
        <nav className="cat-menu" aria-label="Menu">
          <Link to="/browse" onClick={() => setMenu(false)}>
            Templates
          </Link>
          <Link to="/#how" onClick={() => setMenu(false)}>
            How it works
          </Link>
          <Link to="/#features" onClick={() => setMenu(false)}>
            Features
          </Link>
          <Link to="/#pricing" onClick={() => setMenu(false)}>
            Pricing
          </Link>
          <Link to="/#faq" onClick={() => setMenu(false)}>
            FAQ
          </Link>
          <Link to="/login" onClick={() => setMenu(false)}>
            Log in
          </Link>
          <Link className="cat-create" to="/create" onClick={() => setMenu(false)}>
            Create invite — free
          </Link>
        </nav>
      ) : null}

      <main className="cat-main">
        <div className="cat-intro">
          <span className="cat-kicker">Templates</span>
          <h1>All templates</h1>
          <p>Wedding, nikah, baptism, birthday and housewarming designs. Preview one, then use it for your invitation.</p>
        </div>

        <div className="cat-tools">
          <div className="cat-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <label htmlFor="cat-search">Search templates</label>
            <input id="cat-search" type="search" placeholder="Search templates" value={query} onChange={(input) => setQuery(input.target.value)} />
          </div>
          <div className="cat-occ" role="group" aria-label="Occasion">
            <button type="button" className={occasion === "all" ? "on" : ""} aria-pressed={occasion === "all"} onClick={() => setOccasion("all")}>
              All
            </button>
            {events.map((event) => (
              <button key={event.id} type="button" className={occasion === event.id ? "on" : ""} aria-pressed={occasion === event.id} onClick={() => setOccasion(event.id)}>
                {event.label}
              </button>
            ))}
          </div>
          <div className="cat-bar">
            <div className="cat-seg" role="group" aria-label="Price">
              {(["All", "Free", "Paid"] as const).map((label) => (
                <button key={label} type="button" className={price === label ? "on" : ""} aria-pressed={price === label} onClick={() => setPrice(label)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="cat-sort">
              <span>{items.length === 1 ? "1 template" : `${items.length} templates`}</span>
              <label htmlFor="cat-sort">Sort</label>
              <select id="cat-sort" value={sort} onChange={(input) => setSort(input.target.value)}>
                <option value="name">A–Z</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="cat-empty">
            <h2>No templates match</h2>
            <p>Try another occasion, or clear the search.</p>
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="cat-grid">
            {items.map((template) => {
              const event = template.events[0];
              const tone = FALLBACK[template.id] ?? "#F6F0E6";
              const ink = tone === "#F6F0E6" || tone === "#DCEBF7" || tone === "#DDEFE8" || tone === "#F7B38A" || tone === "#F8E6E4" || tone === "#F3E3D6" ? "#211C1E" : "#F6E8C8";
              return (
                <article className="cat-card" key={template.id}>
                  <Link className="cat-shot" to={`/preview/${template.id}`} style={{ background: tone, color: ink }}>
                    {broken.includes(template.id) ? (
                      <span className="cat-fallback">{template.name}</span>
                    ) : (
                      <img
                        src={`/covers/${template.id}.jpg`}
                        alt=""
                        onError={() => setBroken((current) => (current.includes(template.id) ? current : [...current, template.id]))}
                      />
                    )}
                    <span className={template.free ? "cat-badge free" : "cat-badge"}>{template.free ? "Free" : "Premium"}</span>
                  </Link>
                  <div className="cat-meta">
                    <div>
                      <strong>{template.name}</strong>
                      <span>
                        {eventLabels(template)} · {formatPrice(template)}
                      </span>
                    </div>
                    <Link to={`/preview/${template.id}`}>Preview</Link>
                  </div>
                  <Link className="cat-use" to={template.free ? `/create/${template.id}?event=${event}` : `/template/${template.id}?event=${event}`}>
                    {template.free ? "Use this design" : `Buy once · ${formatPrice(template)}`}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="cat-foot">
        <Logo light />
        <nav aria-label="Footer">
          <Link to="/browse">Templates</Link>
          <Link to="/#pricing">Pricing</Link>
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
