import { Link } from "react-router-dom";
import { trackGuestCtaClick } from "../lib/analytics";
import { guestCtaHref } from "../lib/share";
import "./guest-cta.css";

export function GuestCta({ templateName, campaign }: { templateName?: string; campaign?: string }) {
  return (
    <aside className="guest-cta">
      <p>Loved this invitation?</p>
      <Link to={guestCtaHref(campaign)} onClick={() => trackGuestCtaClick(templateName)}>
        Create yours in minutes →
      </Link>
    </aside>
  );
}
