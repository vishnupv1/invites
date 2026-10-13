import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listTemplates } from "../api";
import { DesktopNav } from "../components/shell/DesktopNav";
import { PlayingInvite } from "../components/shell/PlayingInvite";
import { IrApp } from "../components/shell/IrApp";
import { TopBar } from "../components/shell/TopBar";
import { EVENTS } from "../data/events";
import { TEMPLATES, withCatalogMeta } from "../data/templates";
import { trackTemplatePreview } from "../lib/analytics";
import type { EventId, Template } from "../types";
import "./shell-browse.css";

const OCCASION_LABEL: Partial<Record<EventId, string>> = {
  marriage: "Wedding",
};

// type PriceFilter = "all" | "free" | "paid";
//
// function rupee(amount: number) {
//   return `₹${amount.toLocaleString("en-IN")}`;
// }

function descriptor(template: Template) {
  const line = template.description.split(".")[0]?.trim() ?? template.tagline;
  return line.length > 42 ? `${line.slice(0, 40).trim()}…` : line;
}

export function BrowsePage({ backHref = "/" }: { backHref?: string }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Template[]>(TEMPLATES);
  const [ready, setReady] = useState(false);
  const [occasion, setOccasion] = useState<EventId | "all">("all");
  // const [price, setPrice] = useState<PriceFilter>("all");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    listTemplates()
      .then((rows) => setCatalog(rows.map(withCatalogMeta)))
      .catch(() => setCatalog(TEMPLATES))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !routeId) return;
    const match = catalog.find((item) => item.id === routeId);
    if (!match) {
      navigate("/browse", { replace: true });
      return;
    }
    trackTemplatePreview(match);
  }, [ready, routeId, catalog, navigate]);

  const occasions = useMemo(() => {
    return EVENTS.filter((event) => catalog.some((item) => item.events.includes(event.id)));
  }, [catalog]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((template) => {
      const occasionOk = occasion === "all" || template.events.includes(occasion);
      // const priceOk = price === "all" || (price === "free" ? template.price === 0 || template.free : template.price > 0 && !template.free);
      const priceOk = true;
      const textOk = !q || template.name.toLowerCase().includes(q) || template.description.toLowerCase().includes(q);
      return occasionOk && priceOk && textOk;
    });
  }, [catalog, occasion, query]);

  return (
    <IrApp>
      <div className="ir-browse">
        <DesktopNav />
        <div className="ir-browse-mobilebar">
          <TopBar
            title="Templates"
            subtitle="Tap one to watch it open."
            backHref={backHref}
            action={
              <button className="ir-browse-search" type="button" aria-expanded={searching} aria-label="Search templates" onClick={() => setSearching((value) => !value)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16.5 20 20.5" />
                </svg>
              </button>
            }
          />
          {searching ? (
            <label className="ir-browse-query">
              <span className="ir-overline">Search</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or style" />
            </label>
          ) : null}
          <div className="ir-browse-tabs" role="tablist" aria-label="Occasion">
            <button type="button" role="tab" aria-selected={occasion === "all"} className={occasion === "all" ? "is-on" : ""} onClick={() => setOccasion("all")}>
              All
            </button>
            {occasions.map((event) => (
              <button
                key={event.id}
                type="button"
                role="tab"
                aria-selected={occasion === event.id}
                className={occasion === event.id ? "is-on" : ""}
                onClick={() => setOccasion(event.id)}
              >
                {OCCASION_LABEL[event.id] ?? event.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ir-browse-body">
        <aside className="ir-browse-side">
          <p className="ir-overline">Occasion</p>
          <div className="ir-browse-side-list">
            <button type="button" aria-pressed={occasion === "all"} onClick={() => setOccasion("all")}>All</button>
            {occasions.map((event) => (
              <button key={event.id} type="button" aria-pressed={occasion === event.id} onClick={() => setOccasion(event.id)}>
                {OCCASION_LABEL[event.id] ?? event.label}
              </button>
            ))}
          </div>
          {/* <p className="ir-overline">Price</p>
          <div className="ir-browse-side-list">
            {(["all", "free", "paid"] as const).map((item) => (
              <button key={item} type="button" aria-pressed={price === item} onClick={() => setPrice(item)}>
                {item === "all" ? "Any price" : item === "free" ? "Free" : "Paid"}
              </button>
            ))}
          </div> */}
          <label className="ir-browse-query">
            <span className="ir-overline">Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or style" />
          </label>
        </aside>

        <div className="ir-browse-grid">
          {visible.map((template) => (
            <Link key={template.id} className={template.id === routeId ? "ir-browse-card is-current" : "ir-browse-card"} to={`/template/${template.id}`}>
              <span className="ir-browse-shot">
                <PlayingInvite template={template} />
              </span>
              <span className="ir-browse-name">
                <span>{template.name}</span>
                <b>Free</b>
                {/* <b>{template.price > 0 ? rupee(template.price) : "Free"}</b> */}
              </span>
              <span className="ir-browse-desc">{descriptor(template)}</span>
            </Link>
          ))}
          {ready && visible.length === 0 ? <p className="ir-browse-empty">No templates in this filter.</p> : null}
        </div>
        </div>
      </div>
    </IrApp>
  );
}
