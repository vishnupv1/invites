import { Link, useLocation } from "react-router-dom";
import { useSession } from "../../session";
import { Logo } from "./Logo";

type NavLink = { href: string; label: string };

const LINKS: NavLink[] = [
  { href: "/browse", label: "Templates" },
  { href: "/how", label: "How it works" },
  { href: "/contact", label: "For planners" },
];

type Props = {
  tone?: "paper" | "emerald";
  links?: NavLink[];
};

function linkOn(href: string, path: string) {
  if (href === "/browse") return path === "/browse" || path.startsWith("/browse/") || path === "/templates";
  return path === href;
}

export function DesktopNav({ tone = "emerald", links = LINKS }: Props) {
  const { pathname } = useLocation();
  const { signedIn } = useSession();
  return (
    <header className={`ir-nav${tone === "emerald" ? " is-emerald" : ""}`}>
      <Logo tone={tone === "emerald" ? "cream" : "ink"} />
      <nav className="ir-nav-links" aria-label="Primary">
        {links.map((link) => (
          <Link key={link.href} className={linkOn(link.href, pathname) ? "is-on" : ""} to={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="ir-nav-actions">
        <Link className="ir-nav-signin" to={signedIn ? "/studio" : "/login"}>
          {signedIn ? "Dashboard" : "Sign in"}
        </Link>
        <Link className="ir-nav-try" to="/browse">
          Try free
        </Link>
      </div>
    </header>
  );
}
