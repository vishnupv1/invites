import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { getHost, getToken, listEvents, listTemplates, signOut, type CatalogEvent } from "../api";
import { formatPrice, sampleFor } from "../data/templates";
import type { Template } from "../types";
import "./studio.css";
import "./templates.css";

const FAVS = "vellum.template-favs.v1";

const NAV = [
  { label: "Dashboard", href: "/studio", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { label: "My events", href: "/studio", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { label: "Guests", href: "/studio", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6" },
  { label: "Templates", href: "/templates", icon: "M4 4h16v16H4zM4 9h16M9 9v11" },
];

function initialsOf(name: string) {
  return name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function readFavs() {
  try {
    const raw = localStorage.getItem(FAVS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function Templates() {
  const signedIn = Boolean(getToken());
  const [hostName, setHostName] = useState("");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<CatalogEvent[]>([]);
  const [catalog, setCatalog] = useState<Template[]>([]);
  const [occasion, setOccasion] = useState("all");
  const [price, setPrice] = useState<"All" | "Free" | "Paid">("All");
  const [favsOnly, setFavsOnly] = useState(false);
  const [sort, setSort] = useState("name");
  const [favs, setFavs] = useState<string[]>(readFavs);
  const navigate = useNavigate();

  useEffect(() => {
    if (!signedIn) return;
    getHost()
      .then((host) => setHostName(host.name))
      .catch(() => setHostName(""));
  }, [signedIn]);

  useEffect(() => {
    localStorage.setItem(FAVS, JSON.stringify(favs));
  }, [favs]);

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]));
    listTemplates().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog.filter((template) => {
      const labels = template.events.map((id) => events.find((event) => event.id === id)?.label ?? "");
      const occasionOk = occasion === "all" || template.events.includes(occasion as Template["events"][number]);
      const priceOk = price === "All" || (price === "Free" ? template.free : !template.free);
      const favOk = !favsOnly || favs.includes(template.id);
      const text = `${template.name} ${template.tagline} ${template.description} ${labels.join(" ")}`.toLowerCase();
      return occasionOk && priceOk && favOk && (!q || text.includes(q));
    });
    if (sort === "price") return [...list].sort((a, b) => a.price - b.price);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, events, query, occasion, price, favsOnly, favs, sort]);

  function toggleFav(id: string) {
    setFavs((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="board">
      <aside className="side">
        <Link className="brand" to="/">
          <svg width="34" height="34" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <rect x="3" y="8" width="28" height="21" rx="4" stroke="#FFFFFF" strokeWidth="2.4" />
            <path d="M4 11l13 9 13-9" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" />
            <circle cx="29" cy="27" r="7.5" fill="#C89B5B" />
            <path d="M25.5 27l2.4 2.4 4.4-4.6" stroke="#4A263E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            Invites<em>Ready</em>
          </span>
        </Link>
        <nav aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.label} className={item.href === "/templates" ? "nav-item on" : "nav-item"} to={item.href} aria-current={item.href === "/templates" ? "page" : undefined}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={item.href === "/templates" ? "#211C1E" : "#E3D3DC"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <div className="account">
            <div className="avatar">{initialsOf(hostName) || "?"}</div>
            <div className="who">
              <strong>{signedIn && hostName ? hostName : "Log in"}</strong>
              <small>{signedIn ? "Your account" : "Not signed in"}</small>
            </div>
            {signedIn ? (
              <button type="button" className="logout" aria-label="Log out" onClick={() => { signOut(); window.location.assign("/"); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDB8C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                  <path d="M10 17l-5-5 5-5M5 12h11" />
                </svg>
              </button>
            ) : (
              <Link className="logout" to="/login" aria-label="Log in">
                Log in
              </Link>
            )}
          </div>
        </div>
      </aside>

      <main className="tpl-main">
        <div className="tpl-mobile-title">
          <h1>Templates</h1>
          <button type="button" className={favsOnly ? "tpl-fav on" : "tpl-fav"} aria-pressed={favsOnly} onClick={() => setFavsOnly((value) => !value)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={favsOnly ? "#C45B63" : "none"} stroke="#C45B63" strokeWidth="2" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {favs.length}
          </button>
        </div>
        <div className="tpl-head">
          <div className="tpl-title">
            <h1>Choose a template</h1>
            <p>Every design in the catalog. Preview one, then use it for an invitation.</p>
          </div>
          <button type="button" className="tpl-fav tpl-fav-mobile" aria-pressed={favsOnly} onClick={() => setFavsOnly((value) => !value)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={favsOnly ? "#C45B63" : "none"} stroke="#C45B63" strokeWidth="2" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
            {favs.length}
          </button>
          <div className="tpl-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <label htmlFor="t-search" className="search label" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Search templates
            </label>
            <input id="t-search" type="search" placeholder="Search templates" value={query} onChange={(input) => setQuery(input.target.value)} />
          </div>
        </div>

        <div className="tpl-filters">
          <div className="tpl-occ-scroll">
            <button type="button" className={occasion === "all" ? "on" : ""} aria-pressed={occasion === "all"} onClick={() => setOccasion("all")}>
              All
            </button>
            {events.map((event) => (
              <button key={event.id} type="button" className={occasion === event.id ? "on" : ""} aria-pressed={occasion === event.id} onClick={() => setOccasion(event.id)}>
                {event.label}
              </button>
            ))}
          </div>
          <div className="tpl-occasion">
            <label htmlFor="t-occasion">Occasion</label>
            <select id="t-occasion" value={occasion} onChange={(input) => setOccasion(input.target.value)}>
              <option value="all">All</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.label}
                </option>
              ))}
            </select>
          </div>
          <div className="tpl-row">
            <div className="tpl-chips">
              <div className="tpl-seg" role="group" aria-label="Price">
                {(["All", "Free", "Paid"] as const).map((label) => (
                  <button key={label} type="button" className={price === label ? "on" : ""} aria-pressed={price === label} onClick={() => setPrice(label)}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" className={favsOnly ? "tpl-fav on" : "tpl-fav"} aria-pressed={favsOnly} onClick={() => setFavsOnly((value) => !value)}>
                Favourites · {favs.length}
              </button>
            </div>
            <div className="tpl-sort">
              <span className="tpl-count">{items.length === 1 ? "1 template" : `${items.length} templates`}</span>
              <label htmlFor="t-sort">Sort</label>
              <select id="t-sort" value={sort} onChange={(input) => setSort(input.target.value)}>
                <option value="name">A–Z</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="tpl-empty">
            <h2>No templates match</h2>
            <p>Try another occasion, or clear your filters.</p>
            <button
              type="button"
              className="tpl-clear"
              onClick={() => {
                setOccasion("all");
                setPrice("All");
                setFavsOnly(false);
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="tpl-grid">
            {items.map((template) => {
              const event = template.events[0];
              const liked = favs.includes(template.id);
              const label = events.find((item) => item.id === event)?.label ?? "";
              return (
                <article className="tpl-card" key={template.id}>
                  <div style={{ position: "relative" }}>
                    <button type="button" className="tpl-shot" aria-label={`Preview ${template.name}`} onClick={() => navigate(`/preview/${template.id}`)}>
                      <InviteView template={template} fields={sampleFor(template, event)} />
                    </button>
                    <button type="button" className="tpl-heart" aria-label={liked ? `Remove ${template.name} from favourites` : `Save ${template.name}`} aria-pressed={liked} onClick={() => toggleFav(template.id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "#C45B63" : "none"} stroke="#C45B63" strokeWidth="2" aria-hidden="true">
                        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                      </svg>
                    </button>
                  </div>
                  <div className="tpl-meta">
                    <div>
                      <strong>{template.name}</strong>
                      <span>
                        {label} · {formatPrice(template)}
                      </span>
                    </div>
                    <button type="button" onClick={() => navigate(`/preview/${template.id}`)}>
                      Preview
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <nav className="dash-nav" aria-label="Main">
        <Link to="/studio">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11l9-7 9 7v9H3z" />
            <path d="M9 20v-6h6v6" />
          </svg>
          Home
        </Link>
        <Link to="/templates" aria-current="page">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16v16H4zM4 9h16M9 9v11" />
          </svg>
          Templates
        </Link>
        <Link className="dash-plus" to="/templates" aria-label="Create invite">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        <Link to="/studio#guests">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6" />
          </svg>
          Guests
        </Link>
        {signedIn ? (
          <button
            type="button"
            onClick={() => {
              signOut();
              window.location.assign("/");
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
            Log out
          </button>
        ) : (
          <Link to="/login">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
            Log in
          </Link>
        )}
      </nav>
    </div>
  );
}
