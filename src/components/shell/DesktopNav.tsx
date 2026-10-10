import { Link } from "react-router-dom";
import { EnvelopeMark } from "./marks";

type NavLink = { href: string; label: string };

const LINKS: NavLink[] = [
  { href: "/browse", label: "Templates" },
  { href: "/how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "For planners" },
];

type Props = {
  tone?: "paper" | "emerald";
  links?: NavLink[];
};

export function DesktopNav({ tone = "paper", links = LINKS }: Props) {
  return (
    <header className={`ir-nav${tone === "emerald" ? " is-emerald" : ""}`}>
      <Link className="ir-logo" to="/">
        <span className="ir-logo-mark">
          <EnvelopeMark />
        </span>
        <span className="ir-logo-name ir-display">InvitesReady</span>
      </Link>
      <nav className="ir-nav-links" aria-label="Primary">
        {links.map((link) => (
          <Link key={link.href} to={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ir-nav-actions">
        <Link className="ir-nav-signin" to="/login">
          Sign in
        </Link>
        <Link className="ir-nav-try" to="/browse">
          Try free
        </Link>
      </div>
    </header>
  );
}
