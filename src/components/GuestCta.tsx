import { Link } from "react-router-dom";
import { trackGuestCtaClick } from "../lib/analytics";
import { madeWithHref } from "../lib/share";
import "./guest-cta.css";

export function GuestCta({ templateName, templateId }: { templateName?: string; templateId?: string }) {
  return (
    <aside className="guest-cta">
      <p>Loved this invitation?</p>
      <Link to={madeWithHref(templateId)} onClick={() => trackGuestCtaClick(templateName)}>
        Create yours in minutes →
      </Link>
    </aside>
  );
}
