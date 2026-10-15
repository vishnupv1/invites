import { Link } from "react-router-dom";
import { publishedTopics } from "../data/topics";

const SITE = [
  ["/browse", "Templates"],
  ["/how", "How it works"],
  ["/faq", "Questions"],
  ["/occasions", "Celebrations"],
  ["/guides", "Guides"],
  ["/contact", "Contact"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/refunds", "Refunds"],
] as const;

export function SiteFooter({ variant = "home" }: { variant?: "home" | "legal" }) {
  const occasions = publishedTopics();
  return (
    <footer className={variant === "home" ? "ir-home-foot" : undefined}>
      <nav aria-label="Celebrations">
        {occasions.map((topic) => (
          <Link key={topic.id} to={topic.path}>{topic.label}</Link>
        ))}
      </nav>
      <nav aria-label={variant === "legal" ? "Footer" : "InvitesReady"}>
        {SITE.map(([href, label]) => (
          <Link key={href} to={href}>{label}</Link>
        ))}
      </nav>
      {variant === "legal" ? <small>© 2026 InvitesReady.com</small> : null}
    </footer>
  );
}
