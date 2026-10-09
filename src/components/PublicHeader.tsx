import { Link } from "react-router-dom";
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
  return (
    <header className="ph">
      <Link className="ph-logo" to="/" aria-label="InvitesReady">
        <Mark />
        <span>invitesready</span>
      </Link>
      <nav className="ph-links" aria-label="Main">
        <Link to="/browse">Templates</Link>
        <Link to="/how">How it works</Link>
        <Link to="/faq">FAQs</Link>
      </nav>
      <Link className="ph-pill" to="/browse">See the designs</Link>
    </header>
  );
}
