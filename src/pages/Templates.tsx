import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart } from "lucide-react";
import { listEvents, listTemplates, type CatalogEvent } from "../api";
import { formatPrice } from "../data/templates";
import { useLibrary } from "../state";
import { LoggedInChrome } from "../components/LoggedInChrome";
import { CatalogDemo } from "./AllTemplates";
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
  const [demo, setDemo] = useState<Template | null>(null);
  const { favs, toggle } = useFavs();

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]));
    listTemplates()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setCatalogReady(true));
  }, []);

  useEffect(() => {
    if (!demo) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDemo(null);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [demo]);

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
            <Heart className="fav-mark" size={16} aria-hidden="true" fill={favsOnly ? "currentColor" : "none"} />
            {favs.length}
          </button>
        </div>
        <div className="tpl-head">
          <div className="tpl-title">
            <h1>Choose a template</h1>
            <p>Every design in the catalog. Preview one, then use it for an invitation.</p>
          </div>
          <button type="button" className="tpl-fav tpl-fav-mobile" aria-pressed={favsOnly} onClick={() => setFavsOnly((value) => !value)}>
            <Heart className="fav-mark" size={16} aria-hidden="true" fill={favsOnly ? "currentColor" : "none"} />
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
          <div className="tpl-filter-line">
            <FilterMenu
              label="Category"
              value={occasion}
              options={[{ id: "all", label: "All categories" }, ...events.map((event) => ({ id: event.id, label: event.label }))]}
              onChange={setOccasion}
            />
            <FilterMenu
              icon
              className="icon"
              label="Price"
              value={price.toLowerCase()}
              options={[
                { id: "all", label: "All" },
                { id: "free", label: "Free" },
                { id: "paid", label: "Paid" },
              ]}
              onChange={(id) => setPrice(id === "free" ? "Free" : id === "paid" ? "Paid" : "All")}
            />
          </div>
          <div className="tpl-row">
            <div className="tpl-chips">
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
                    <button type="button" className="tpl-shot" aria-label={`Open ${template.name}`} onClick={() => setDemo(template)}>
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
                    <button type="button" onClick={() => setDemo(template)}>
                      Live demo
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      {demo ? <CatalogDemo template={demo} href={`/create/${demo.id}?event=${demo.events[0]}`} label="Customise this" onClose={() => setDemo(null)} /> : null}
    </div>
  );
}

function FilterMenu({
  label,
  value,
  options,
  onChange,
  className = "",
  icon = false,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  className?: string;
  icon?: boolean;
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

  const set = icon && value !== options[0]?.id;
  return (
    <div className={`tpl-menu${className ? ` ${className}` : ""}${open ? " is-open" : ""}${set ? " is-set" : ""}`} ref={root}>
      <span className="tpl-menu-label">{label}</span>
      <div className="tpl-menu-box">
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={icon ? `${label}, ${current}` : label} onClick={() => setOpen((current) => !current)}>
          {icon ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          ) : (
            <>
              <span>{current}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B5A62" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </>
          )}
        </button>
        {open ? (
          <div role="listbox" aria-label={label}>
            {options.map((item) => {
              const on = item.id === value;
              return (
                <button key={item.id} type="button" role="option" aria-selected={on} className={on ? "on" : ""} onClick={() => { onChange(item.id); setOpen(false); }}>
                  <span aria-hidden="true">{on ? <Check size={14} strokeWidth={2.8} /> : null}</span>
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
