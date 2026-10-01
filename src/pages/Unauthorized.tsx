import { Link, useLocation } from "react-router-dom";
import { Brand } from "../components/Brand";
import "./legal.css";

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/studio";
}

export function Unauthorized() {
  const location = useLocation();
  const next = safeNext((location.state as { from?: string } | null)?.from);

  return (
    <div className="legal">
      <header className="legal-bar">
        <Brand />
        <nav aria-label="Account">
          <Link to="/">Home</Link>
          <Link to="/browse">Templates</Link>
        </nav>
      </header>
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
