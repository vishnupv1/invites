import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PublicHeader } from "../components/PublicHeader";
import "./legal.css";

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/studio";
}

export function Unauthorized() {
  const location = useLocation();
  const next = safeNext((location.state as { from?: string } | null)?.from);

  return (
    <div className="legal">
      <PublicHeader />
      <main>
        <h1>This page is for your account</h1>
        <p className="legal-lede">
          Dashboard, events, guests, purchases, and your templates open only after you sign in.
        </p>
        <div className="legal-actions">
          <Link className="legal-go" to={`/login?next=${encodeURIComponent(next)}`}>
            Log in
          </Link>
          <Link to="/">Back to home</Link>
        </div>
      </main>
    </div>
  );
}

export function NotFound() {
  useEffect(() => {
    document.title = "Page not found | InvitesReady";
  }, []);

  return (
    <div className="legal">
      <PublicHeader />
      <main>
        <h1>We couldn’t find that page</h1>
        <p className="legal-lede">The address may be mistyped, or the page may have moved.</p>
        <div className="legal-actions">
          <Link className="legal-go" to="/">Back to home</Link>
          <Link to="/browse">Browse designs</Link>
        </div>
      </main>
    </div>
  );
}
