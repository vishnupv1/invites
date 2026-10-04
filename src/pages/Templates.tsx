import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listEvents, listTemplates, type CatalogEvent } from "../api";
import { formatPrice } from "../data/templates";
import { useLibrary } from "../state";
import { LoggedInChrome } from "../components/LoggedInChrome";
import { SkeletonCards } from "../components/CardSkeleton";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FavoriteHeart } from "../components/FavoriteHeart";
import { useFavs } from "../lib/favorites";
import type { Template } from "../types";
import "./studio.css";
import "./templates.css";

export function Templates() {
  const { owned } = useLibrary();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<CatalogEvent[]>([]);
  const [catalog, setCatalog] = useState<Template[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [occasion, setOccasion] = useState("all");
  const [price, setPrice] = useState<"All" | "Free" | "Paid">("All");
  const [favsOnly, setFavsOnly] = useState(false);
  const [sort, setSort] = useState("name");
  const { favs, toggle } = useFavs();
  const navigate = useNavigate();

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]));
    listTemplates()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setCatalogReady(true));
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog.filter((template) => {
      const labels = template.events.map((id) => events.find((event) => event.id === id)?.label ?? "");
      const occasionOk = occasion === "all" || template.events.includes(occasion as Template["events"][number]);
      const priceOk = price === "All" || (price === "Free" ? template.free : !template.free);
      const favOk = !favsOnly || favs.includes(template.id);
      const text = `${template.name} ${template.tagline} ${template.description} ${labels.join(" ")}`.toLowerCase();
      return occasionOk && priceOk && favOk && (!q || text.includes(q));
    });
    if (sort === "price") return [...list].sort((a, b) => a.price - b.price);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, events, query, occasion, price, favsOnly, favs, sort]);

  return (
    <div className="board">
      <LoggedInChrome />
      <main className="tpl-main">
        <Breadcrumbs items={[{ label: "Dashboard", to: "/studio" }, { label: "Templates" }]} />
        <div className="tpl-mobile-title">
          <h1>Templates</h1>
          <button type="button" className={favsOnly ? "tpl-fav on" : "tpl-fav"} aria-pressed={favsOnly} onClick={() => setFavsOnly((value) => !value)}>
            <span className="fav-mark" aria-hidden="true">♥</span>
            {favs.length}
          </button>
        </div>
        <div className="tpl-head">
          <div className="tpl-title">
            <h1>Choose a template</h1>
            <p>Every design in the catalog. Preview one, then use it for an invitation.</p>
          </div>
          <button type="button" className="tpl-fav tpl-fav-mobile" aria-pressed={favsOnly} onClick={() => setFavsOnly((value) => !value)}>
            <span className="fav-mark" aria-hidden="true">♥</span>
            {favs.length}
          </button>
          <div className="tpl-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <label htmlFor="t-search" className="search label" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Search templates
            </label>
            <input id="t-search" type="search" placeholder="Search templates" value={query} onChange={(input) => setQuery(input.target.value)} />
          </div>
        </div>

        <div className="tpl-filters">
          <FilterMenu
            label="Category"
            value={occasion}
            options={[{ id: "all", label: "All categories" }, ...events.map((event) => ({ id: event.id, label: event.label }))]}
            onChange={setOccasion}
          />
          <div className="tpl-row">
            <div className="tpl-chips">
              <div className="tpl-seg" role="group" aria-label="Price">
                {(["All", "Free", "Paid"] as const).map((label) => (
                  <button key={label} type="button" className={price === label ? "on" : ""} aria-pressed={price === label} onClick={() => setPrice(label)}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" className={favsOnly ? "tpl-fav on" : "tpl-fav"} aria-pressed={favsOnly} onClick={() => setFavsOnly((value) => !value)}>
                Favourites · {favs.length}
              </button>
            </div>
            <div className="tpl-sort">
              <span className="tpl-count">{items.length === 1 ? "1 template" : `${items.length} templates`}</span>
              <FilterMenu
                className="compact"
                label="Sort"
                value={sort}
                options={[
                  { id: "name", label: "A–Z" },
                  { id: "price", label: "Price" },
                ]}
                onChange={setSort}
              />
            </div>
          </div>
        </div>

        {!catalogReady ? (
          <div className="tpl-grid" role="status" aria-busy="true" aria-label="Loading templates">
            <span className="skel-sr">Loading</span>
            <SkeletonCards count={8} cover="studio" />
          </div>
        ) : items.length === 0 ? (
          <div className="tpl-empty">
            <h2>No templates match</h2>
            <p>Try another category, or clear your filters.</p>
            <button
              type="button"
              className="tpl-clear"
              onClick={() => {
                setOccasion("all");
                setPrice("All");
                setFavsOnly(false);
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="tpl-grid">
            {items.map((template) => {
              const event = template.events[0];
              const liked = favs.includes(template.id);
              const bought = owned.includes(template.id);
              const label = events.find((item) => item.id === event)?.label ?? "";
              return (
                <article className={bought ? "tpl-card bought" : "tpl-card"} key={template.id}>
                  <div className="tpl-cover">
                    <button type="button" className="tpl-shot" aria-label={`Preview ${template.name}`} onClick={() => navigate(`/preview/${template.id}`)}>
                      <img src={`/covers/${template.id}.jpg`} alt="" />
                    </button>
                    {bought ? <span className="tpl-owned">Purchased</span> : null}
                    <FavoriteHeart className="overlay" liked={liked} name={template.name} onClick={() => toggle(template.id)} />
                  </div>
                  <div className="tpl-meta">
                    <div>
                      <strong>{template.name}</strong>
                      <span>
                        {label} · {bought ? "Purchased" : formatPrice(template)}
                      </span>
                    </div>
                    <button type="button" onClick={() => navigate(`/preview/${template.id}`)}>
                      Preview
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterMenu({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((item) => item.id === value)?.label ?? "";

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`tpl-menu${className ? ` ${className}` : ""}${open ? " is-open" : ""}`} ref={root}>
      <span className="tpl-menu-label">{label}</span>
      <div className="tpl-menu-box">
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((current) => !current)}>
          <span>{current}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5A62" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </button>
        {open ? (
          <div role="listbox" aria-label={label}>
            {options.map((item) => {
              const on = item.id === value;
              return (
                <button key={item.id} type="button" role="option" aria-selected={on} className={on ? "on" : ""} onClick={() => { onChange(item.id); setOpen(false); }}>
                  <span aria-hidden="true">{on ? "✓" : ""}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
