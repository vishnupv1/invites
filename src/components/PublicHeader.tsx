import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./shell/Logo";
import { useSession } from "../session";
import "./public-header.css";

export function PublicHeader() {
  const { signedIn, host } = useSession();
  const { pathname, search, hash } = useLocation();
  const onAuth = pathname === "/login";
  const account = host?.name?.split(" ")[0] || "Account";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="ph">
      <Logo />
      <nav className={open ? "ph-links is-open" : "ph-links"} id="public-nav" aria-label="Main">
        <Link to="/browse">Templates</Link>
        <Link to="/how">How it works</Link>
        <Link to="/faq">FAQs</Link>
      </nav>
      <div className="ph-actions">
        <button
          type="button"
          className="ph-burger"
          aria-expanded={open}
          aria-controls="public-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        {onAuth ? null : (
          <Link className="ph-login" to={signedIn ? "/studio" : { pathname: "/login", search: `?next=${encodeURIComponent(`${pathname}${search}${hash}`)}` }}>
            {signedIn ? account : "Log in"}
          </Link>
        )}
        <Link className="ph-pill" to="/browse">See the designs</Link>
      </div>
    </header>
  );
}
