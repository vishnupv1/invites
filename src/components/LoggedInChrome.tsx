import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listEvents, listTemplates, signOut, type CatalogEvent } from "../api";
import { EVENTS } from "../data/events";
import { TEMPLATES } from "../data/templates";
import { useFavs } from "../lib/favorites";
import { useSession } from "../session";
import { useLibrary } from "../state";
import type { EventId, Template } from "../types";
import "../pages/studio.css";
import "../pages/logged-in.css";

function orderEvents(rows: CatalogEvent[]) {
  const order = new Map(EVENTS.map((event, index) => [event.id, index]));
  return [...rows].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

const MENU = [
  { id: "events", label: "My events", to: "/events", icon: "M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM12 11l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" },
  { id: "drafts", label: "Saved drafts", to: "/drafts", icon: "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1zM12 7v6M9 10h6" },
  { id: "favorites", label: "My favorites", to: "/favorites", icon: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 16s-4-2.6-4-5.3A2.2 2.2 0 0 1 12 9.5a2.2 2.2 0 0 1 4 1.2c0 2.7-4 5.3-4 5.3z" },
  { id: "purchases", label: "Purchases", to: "/purchases", icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" },
  { id: "settings", label: "Settings", to: "/settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" },
] as const;

function initialsOf(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function Mark() {
  return (
    <svg className="li-mark" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="lgv4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8FB9A0" />
          <stop offset=".4" stopColor="#6F9A82" />
          <stop offset=".7" stopColor="#1C3A2A" />
          <stop offset="1" stopColor="#1C3A2A" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="132" fill="url(#lgv4)" />
      <path d="M256 244 C256 244 176 182 176 140 C176 110 199 90 225 90 C242 90 252 101 256 110 C260 101 270 90 287 90 C313 90 336 110 336 140 C336 182 256 244 256 244 Z" fill="#FFFFFF" />
      <path d="M104 236 L256 348 L408 236" fill="none" stroke="#FFFFFF" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LoggedInChrome() {
  const { pathname } = useLocation();
  const { host } = useSession();
  const { invites, owned } = useLibrary();
  const { favs } = useFavs();
  const [menu, setMenu] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [sheetCat, setSheetCat] = useState<string | null>(null);
  const [events, setEvents] = useState<CatalogEvent[]>(EVENTS);
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const name = host?.name?.trim() || "Your account";
  const initials = initialsOf(host?.name ?? "") || "?";
  const counts: Record<string, number> = {
    events: invites.filter((invite) => invite.status !== "draft").length,
    drafts: invites.filter((invite) => invite.status === "draft").length,
    favorites: favs.length,
    purchases: owned.length,
  };
  const openCat = events.find((event) => event.id === mega);
  const openDesigns = openCat ? templates.filter((template) => template.events.includes(openCat.id as EventId)) : [];

  useEffect(() => {
    const id = "font-outfit";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    listEvents()
      .then((rows) => {
        if (rows.length) setEvents(orderEvents(rows));
      })
      .catch(() => undefined);
    listTemplates()
      .then((rows) => {
        if (rows.length) setTemplates(rows);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setMenu(false);
    setMega(null);
    setSheet(false);
    setSheetCat(null);
  }, [pathname]);

  useEffect(() => {
    if (!menu && !mega && !sheet) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenu(false);
        setMega(null);
        setSheet(false);
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if ([...document.querySelectorAll(".li-bar")].some((node) => node.contains(target))) return;
      setMenu(false);
      setMega(null);
      setSheet(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menu, mega, sheet]);

  return (
    <header className={`li-bar${mega ? " is-open" : ""}`}>
      <div className="li-bar-row">
        <div className="li-brand-side">
          <button type="button" className="li-burger" aria-label="Browse categories" aria-expanded={sheet} onClick={() => { setSheet((value) => !value); setMenu(false); setMega(null); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link className="li-logo" to="/studio" aria-label="InvitesReady home">
            <Mark />
            <span>Invites<span>Ready</span></span>
          </Link>
        </div>

        <nav className="li-cats" aria-label="Categories">
          {events.map((event) => (
            <button key={event.id} type="button" className={mega === event.id ? "on" : ""} aria-expanded={mega === event.id} onClick={() => { setMega((value) => (value === event.id ? null : event.id)); setMenu(false); setSheet(false); }}>
              {event.label}
            </button>
          ))}
        </nav>

        <div className="li-actions">
          <Link className="li-search" to="/templates" aria-label="Search templates">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </Link>
          <div className="li-avatar-wrap">
            <button type="button" className={`li-avatar${menu ? " on" : ""}`} aria-label="Your account" aria-haspopup="menu" aria-expanded={menu} onClick={() => { setMenu((value) => !value); setMega(null); setSheet(false); }}>
              {initials}
            </button>
            {menu ? (
              <div className="li-menu" role="menu" aria-label="Account">
                <div className="li-menu-who">
                  <span className="li-avatar sm">{initials}</span>
                  <span>
                    <strong>{name}</strong>
                    <small>Free plan</small>
                  </span>
                </div>
                {MENU.map((item) => {
                  const count = counts[item.id] ?? 0;
                  const on = pathname === item.to;
                  return (
                    <Link key={item.id} role="menuitem" className={on ? "on" : ""} to={item.to} aria-current={on ? "page" : undefined}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={item.icon} />
                      </svg>
                      <span>{item.label}</span>
                      {count > 0 ? <em>{count}</em> : null}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  role="menuitem"
                  className="li-logout"
                  onClick={() => {
                    void signOut().finally(() => window.location.assign("/"));
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  <span>Log out</span>
                </button>
              </div>
            ) : null}
          </div>
          <Link className="li-premium" to="/templates">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
              <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z" />
            </svg>
            Go Premium
          </Link>
        </div>
      </div>

      {openCat ? (
        <div className="li-mega" role="region" aria-label={openCat.label}>
          {openDesigns.length ? openDesigns.map((template) => (
            <Link key={template.id} to={`/template/${template.id}`}>
              <img src={`/covers/${template.id}.jpg`} alt="" />
              <span>{template.name}</span>
            </Link>
          )) : (
            <p className="li-mega-empty">No designs in this category yet.</p>
          )}
        </div>
      ) : null}

      {sheet ? (
        <div className="li-sheet">
          {events.map((event) => {
            const designs = templates.filter((template) => template.events.includes(event.id as EventId));
            const open = sheetCat === event.id;
            return (
              <div key={event.id} className={open ? "is-open" : ""}>
                <button type="button" className="li-sheet-cat" aria-expanded={open} onClick={() => setSheetCat((value) => (value === event.id ? null : event.id))}>
                  {event.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3949B" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
                {open ? (
                  <div className="li-sheet-designs">
                    {designs.length ? designs.map((template) => (
                      <Link key={template.id} to={`/template/${template.id}`}>
                        <img src={`/covers/${template.id}.jpg`} alt="" />
                        <span>{template.name}</span>
                      </Link>
                    )) : (
                      <p>No designs in this category yet.</p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
          <Link className="li-premium li-premium-sheet" to="/templates">Go Premium</Link>
        </div>
      ) : null}
    </header>
  );
}

export function LoggedInFooter() {
  return (
    <footer className="li-foot">
      <span>© {new Date().getFullYear()} InvitesReady.com</span>
      <span>
        <a href="mailto:hello@invitesready.com">Help</a>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </span>
    </footer>
  );
}
