import { Link } from "react-router-dom";
import { AccountMenu } from "./AccountMenu";
import "../pages/studio.css";

const NAV = [
  { label: "Dashboard", href: "/studio", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { label: "My events", href: "/events", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { label: "Guests", href: "/guests", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6" },
  { label: "Purchases", href: "/purchases", icon: "M6 7h12l-1.2 13H7.2zM9 7V6a3 3 0 0 1 6 0v1" },
  { label: "Templates", href: "/templates", icon: "M4 4h16v16H4zM4 9h16M9 9v11" },
];

function initialsOf(name: string) {
  return name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export function AppMenu({ current, name, signedIn }: { current: string; name: string; signedIn: boolean }) {
  return (
    <>
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
          {NAV.map((item) => {
            const on = item.href === current;
            return (
              <Link key={item.label} className={on ? "nav-item on" : "nav-item"} to={item.href} aria-current={on ? "page" : undefined}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={on ? "#211C1E" : "#E3D3DC"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="account">
            <AccountMenu name={name} signedIn={signedIn}>{initialsOf(name) || "?"}</AccountMenu>
            <div className="who">
              <strong>{signedIn && name ? name : "Log in"}</strong>
              <small>{signedIn ? "Your account" : "Not signed in"}</small>
            </div>
          </div>
        </div>
      </aside>

      <nav className="dash-nav" aria-label="Main">
        <Link to="/studio" aria-current={current === "/studio" ? "page" : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11l9-7 9 7v9H3z" />
            <path d="M9 20v-6h6v6" />
          </svg>
          Home
        </Link>
        <Link to="/templates" aria-current={current === "/templates" ? "page" : undefined}>
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
        <Link to="/guests">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6" />
          </svg>
          Guests
        </Link>
        <Link to="/purchases">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l-1.2 13H7.2zM9 7V6a3 3 0 0 1 6 0v1" />
          </svg>
          Purchases
        </Link>
      </nav>
    </>
  );
}
