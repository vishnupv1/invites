import { Link, useLocation } from "react-router-dom";

const TABS = [
  { href: "/studio", label: "Home", icon: "M3 11l9-8 9 8v10H3z" },
  { href: "/events", label: "Events", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { href: "/guests", label: "Guests", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c1-4 4-6 7-6s6 2 7 6" },
  { href: "/purchases", label: "Purchases", icon: "M6 7h12l-1.2 13H7.2zM9 7V6a3 3 0 0 1 6 0v1" },
  { href: "/templates", label: "Templates", icon: "M4 4h16v16H4zM4 9h16M9 9v11" },
];

export function MobileDock() {
  const { pathname } = useLocation();
  return (
    <nav className="dash-nav" aria-label="Main">
      {TABS.map((tab) => {
        const on = pathname === tab.href;
        return (
          <Link key={tab.href} to={tab.href} aria-current={on ? "page" : undefined}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
