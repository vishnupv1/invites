import { Link } from "react-router-dom";
import { AccountMenu } from "./AccountMenu";
import { Brand } from "./Brand";
import { MobileDock } from "./MobileDock";
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
        <Brand light />
        <nav aria-label="Main">
          {NAV.map((item) => {
            const on = item.href === current;
            return (
              <Link key={item.label} className={on ? "nav-item on" : "nav-item"} to={item.href} aria-current={on ? "page" : undefined}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={on ? "#2A1527" : "#F3BBCF"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

      <MobileDock />
    </>
  );
}
