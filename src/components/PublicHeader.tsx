import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../session";
import "./public-header.css";

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="132" fill="#C5E0D2" />
      <path d="M256 244C256 244 176 182 176 140C176 110 199 90 225 90C242 90 252 101 256 110C260 101 270 90 287 90C313 90 336 110 336 140C336 182 256 244 256 244Z" fill="#1C3A2A" />
      <path d="M104 236L256 348L408 236" fill="none" stroke="#1C3A2A" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PublicHeader() {
  const { signedIn, host } = useSession();
  const { pathname } = useLocation();
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
      <Link className="ph-logo" to="/" aria-label="InvitesReady">
        <Mark />
        <span>invitesready</span>
      </Link>
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
          <Link className="ph-login" to={signedIn ? "/studio" : "/login"}>
            {signedIn ? account : "Log in"}
          </Link>
        )}
        <Link className="ph-pill" to="/browse">See the designs</Link>
      </div>
    </header>
  );
}
