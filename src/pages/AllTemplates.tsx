import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, Sparkle } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { SkeletonCards } from "../components/CardSkeleton";
import { InviteView } from "../components/InviteView";
import { listEvents, listTemplates, type CatalogEvent } from "../api";
import { EVENTS } from "../data/events";
import { TEMPLATES, eventLabels, formatPrice, getTemplate, sampleFor, withCatalogMeta } from "../data/templates";
import type { InviteFields, Template } from "../types";
import "./all-templates.css";

type StyleTag = "Animated" | "Traditional" | "Royal" | "Modern" | "Minimal";
type PriceFilter = "All" | "Free" | "Paid";
type SortId = "popular" | "new" | "low" | "high" | "az";

const STYLES: StyleTag[] = ["Animated", "Traditional", "Royal", "Modern", "Minimal"];
const SORTS: { id: SortId; label: string }[] = [
  { id: "popular", label: "Most popular" },
  { id: "new", label: "Newest" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
  { id: "az", label: "Name: A–Z" },
];

const FEAT: Record<StyleTag, string> = {
  Animated: "Animated opening guests can tap",
  Traditional: "Traditional motifs and colours",
  Royal: "Gold-foil royal styling",
  Modern: "Clean, modern typography",
  Minimal: "Calm, minimal layout",
};

const LOOK: Record<string, { styles: StyleTag[]; pop: number; added: number; isNew?: boolean; tags: string; swatches: string[] }> = {
  peace: { styles: ["Animated", "Modern"], pop: 98, added: 12, isNew: true, tags: "gift hamper blush pink modern box", swatches: ["#E9B3B0", "#16131A", "#A9BCA3"] },
  shaadi: { styles: ["Animated", "Traditional", "Royal"], pop: 95, added: 11, isNew: true, tags: "veil maroon marigold royal", swatches: ["#7A1633", "#125A45", "#F6E7CC"] },
  vivah: { styles: ["Animated", "Royal"], pop: 90, added: 6, tags: "palace doors midnight navy stars", swatches: ["#0B1424", "#3A0B16", "#0A241C"] },
  thiruvizha: { styles: ["Traditional"], pop: 80, added: 5, tags: "temple maroon lamps tamil", swatches: ["#4A101E", "#2A1A0A", "#14352B"] },
  anna: { styles: ["Minimal", "Modern"], pop: 84, added: 4, tags: "garden editorial cream terracotta script", swatches: ["#F6F0E6", "#DCE3D3", "#D8E0E8"] },
  aurelia: { styles: ["Traditional"], pop: 88, added: 3, tags: "navy gold envelope seal wedding", swatches: ["#0B1424", "#4A263E", "#12352B"] },
  gazal: { styles: ["Traditional"], pop: 87, added: 2, tags: "emerald nikah gold seal walima", swatches: ["#12352B", "#C6A15B", "#F6F0E6"] },
  beach: { styles: ["Animated", "Modern"], pop: 86, added: 9, tags: "beach sunset sea waves bottle coral shore", swatches: ["#F7B38A", "#BCE4F3", "#C88BA8"] },
  heavenly: { styles: ["Animated", "Royal"], pop: 92, added: 14, isNew: true, tags: "palace doors lanterns gold petals world walk through", swatches: ["#1E120A", "#E6C27A", "#F7A8B8"] },
  grandoor: { styles: ["Animated", "Royal"], pop: 96, added: 17, isNew: true, tags: "palace doors blush lanterns udaipur lake grand door", swatches: ["#120608", "#E8C987", "#F7A8B8"] },
  pull: { styles: ["Animated", "Royal"], pop: 94, added: 15, isNew: true, tags: "curtain rope velvet gold wedding pull", swatches: ["#4A0716", "#10243F", "#0E3424", "#3A1638"] },
  inland: { styles: ["Animated"], pop: 91, added: 16, isNew: true, tags: "birthday inland letter tear balloons party kochi", swatches: ["#CFE2F2", "#C8342B", "#F2B33D"] },
  botanica: { styles: ["Animated", "Minimal"], pop: 82, added: 13, isNew: true, tags: "floral frames roses sage blush", swatches: ["#FBF3EA", "#EEF2E8", "#1E2238"] },
  baptism: { styles: ["Animated", "Minimal"], pop: 79, added: 7, tags: "baptism dove sky blue clouds baby", swatches: ["#DCEBF7", "#F6DCE2", "#DCE8D9"] },
  hearth: { styles: ["Animated", "Modern"], pop: 77, added: 8, tags: "house home mint door key", swatches: ["#DDEFE8", "#FBD9B6", "#34456E"] },
};

const COLLECTIONS: { id: string; title: string; thumbs: string[]; styles: StyleTag[]; price: PriceFilter; tone: string }[] = [
  { id: "animated", title: "Animated favourites", thumbs: ["peace", "shaadi", "vivah"], styles: ["Animated"], price: "All", tone: "animated" },
  { id: "free", title: "Free to use", thumbs: ["gazal", "aurelia"], styles: [], price: "Free", tone: "free" },
  { id: "royal", title: "Royal & traditional", thumbs: ["shaadi", "thiruvizha", "vivah"], styles: ["Traditional"], price: "All", tone: "royal" },
  { id: "modern", title: "Modern & minimal", thumbs: ["botanica", "anna", "peace"], styles: ["Modern"], price: "All", tone: "modern" },
];

const SAVED_KEY = "invitesready-saved-templates";

function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function look(id: string) {
  return LOOK[id] ?? { styles: [] as StyleTag[], pop: 0, added: 0, tags: "", swatches: ["#FBF8F5", "#D81B60", "#2A1527"] };
}

function useHref(template: Template, occasion = "all") {
  const event = occasion !== "all" && template.events.includes(occasion as Template["events"][number])
    ? occasion
    : template.events[0];
  return `/create?template=${template.id}&event=${event}`;
}

export function AllTemplates() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<CatalogEvent[]>(EVENTS);
  const [catalog, setCatalog] = useState<Template[]>(TEMPLATES);
  const [catalogReady, setCatalogReady] = useState(false);
  const [occasion, setOccasion] = useState("all");
  const [price, setPrice] = useState<PriceFilter>("All");
  const [styles, setStyles] = useState<StyleTag[]>([]);
  const [sort, setSort] = useState<SortId>("popular");
  const [sortOpen, setSortOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [savedOnly, setSavedOnly] = useState(false);
  const [collection, setCollection] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(routeId ?? null);
  const [demo, setDemo] = useState(false);
  const [broken, setBroken] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents(EVENTS));
    listTemplates()
      .then((rows) => setCatalog(rows.map(withCatalogMeta)))
      .catch(() => setCatalog(TEMPLATES))
      .finally(() => setCatalogReady(true));
  }, []);

  useEffect(() => {
    if (!catalogReady) return;
    if (!routeId) {
      setPreviewId(null);
      setDemo(false);
      return;
    }
    if (catalog.some((item) => item.id === routeId)) {
      setPreviewId(routeId);
      return;
    }
    navigate("/browse", { replace: true });
  }, [routeId, catalog, catalogReady, navigate]);

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    if (!sortOpen) return;
    function onDoc(event: MouseEvent) {
      if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sortOpen]);

  useEffect(() => {
    if (!sheet && !previewId && !demo) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (demo) {
        setDemo(false);
        return;
      }
      setSheet(false);
      closePreview();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheet, previewId, demo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = catalog.filter((template) => {
      const extra = look(template.id);
      const labels = template.events.map((id) => events.find((event) => event.id === id)?.label ?? "");
      const priceOk = price === "All" || (price === "Free" ? template.free : !template.free);
      const styleOk = styles.every((style) => extra.styles.includes(style));
      const savedOk = !savedOnly || saved.includes(template.id);
      const text = `${template.name} ${template.tagline} ${template.description} ${labels.join(" ")} ${extra.tags} ${extra.styles.join(" ")}`.toLowerCase();
      return priceOk && styleOk && savedOk && (!q || text.includes(q));
    });
    const list = base.filter((template) => occasion === "all" || template.events.includes(occasion as Template["events"][number]));
    const sorted = [...list].sort((a, b) => {
      if (sort === "popular") return look(b.id).pop - look(a.id).pop || a.name.localeCompare(b.name);
      if (sort === "new") return look(b.id).added - look(a.id).added || a.name.localeCompare(b.name);
      if (sort === "low") return a.price - b.price || a.name.localeCompare(b.name);
      if (sort === "high") return b.price - a.price || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
    return { base, sorted };
  }, [catalog, events, query, occasion, price, styles, savedOnly, saved, sort]);

  const preview = catalog.find((template) => template.id === previewId) ?? null;
  const sortLabel = SORTS.find((item) => item.id === sort)?.label ?? "Most popular";
  const activeCount = (price !== "All" ? 1 : 0) + styles.length + (sort !== "popular" ? 1 : 0);

  function closePreview() {
    setDemo(false);
    setPreviewId(null);
    if (!routeId) return;
    if ((location.state as { fromBrowse?: boolean } | null)?.fromBrowse) navigate(-1);
    else navigate("/browse", { replace: true });
  }

  function markBroken(id: string) {
    setBroken((current) => (current.includes(id) ? current : [...current, id]));
  }

  function toggleStyle(style: StyleTag) {
    setCollection(null);
    setStyles((current) => (current.includes(style) ? current.filter((item) => item !== style) : [...current, style]));
  }

  function pickCollection(id: string) {
    if (collection === id) {
      setCollection(null);
      setStyles([]);
      setPrice("All");
      return;
    }
    const next = COLLECTIONS.find((item) => item.id === id);
    if (!next) return;
    setCollection(id);
    setStyles(next.styles);
    setPrice(next.price);
    setOccasion("all");
  }

  function resetFilters() {
    setQuery("");
    setOccasion("all");
    setPrice("All");
    setStyles([]);
    setSavedOnly(false);
    setSort("popular");
    setCollection(null);
    setSortOpen(false);
  }

  function toggleSaved(id: string) {
    setSaved((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function cover(template: Template) {
    const tone = look(template.id).swatches[0];
    if (broken.includes(template.id)) {
      return <span className="cat-fallback" style={{ background: tone }}>{template.name}</span>;
    }
    return (
      <img
        src={`/covers/${template.id}.jpg`}
        alt=""
        onError={() => markBroken(template.id)}
      />
    );
  }

  return (
    <div className="cat">
      <header className="cat-nav">
        <Brand />
        <nav className="cat-links" aria-label="Main">
          <Link to="/browse" aria-current="page">Templates</Link>
          <Link to="/how">How it works</Link>
          <Link to="/features">Features</Link>
          <Link to="/faq">FAQ</Link>
        </nav>
        <div className="cat-nav-actions">
          <Link className="cat-login" to="/login">Log in</Link>
          <Link className="cat-create" to="/create">Create invite</Link>
        </div>
        <button type="button" className="cat-burger" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
          {menu ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          )}
        </button>
      </header>
      {menu ? (
        <nav className="cat-menu" aria-label="Menu">
          <Link to="/browse" onClick={() => setMenu(false)}>Templates</Link>
          <Link to="/how" onClick={() => setMenu(false)}>How it works</Link>
          <Link to="/features" onClick={() => setMenu(false)}>Features</Link>
          <Link to="/faq" onClick={() => setMenu(false)}>FAQ</Link>
          <Link to="/login" onClick={() => setMenu(false)}>Log in</Link>
          <Link className="cat-create" to="/create" onClick={() => setMenu(false)}>Create invite — free</Link>
        </nav>
      ) : null}

      <main>
        <section className="cat-hero">
          <div>
            <span className="cat-kicker">Templates</span>
            <h1>
              Find the invite that feels like <em>you.</em>
            </h1>
            <p>
              {catalog.length} hand-crafted designs for weddings, nikahs, baptisms and housewarmings. Preview any one free, customise it in minutes.
            </p>
          </div>
          <div className="cat-search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A7880" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <label htmlFor="cat-search">Search templates</label>
            <input
              id="cat-search"
              type="search"
              placeholder={'Search “gold”, “beach”, “floral”…'}
              value={query}
              onChange={(input) => setQuery(input.target.value)}
            />
            {query ? (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                ×
              </button>
            ) : null}
          </div>
        </section>

        <section className="cat-cols" aria-label="Collections">
          {COLLECTIONS.map((item) => {
            const count = catalog.filter((template) => (item.price === "Free" ? template.free : item.styles.every((style) => look(template.id).styles.includes(style)))).length;
            return (
              <button key={item.id} type="button" className={`cat-col ${item.tone}${collection === item.id ? " on" : ""}`} aria-pressed={collection === item.id} onClick={() => pickCollection(item.id)}>
                <span className="cat-col-imgs">
                  {item.thumbs.map((id) => {
                    const template = catalog.find((row) => row.id === id);
                    const tone = look(id).swatches[0];
                    return broken.includes(id) || !template ? (
                      <span key={id} style={{ background: tone }} />
                    ) : (
                      <img key={id} src={`/covers/${id}.jpg`} alt="" onError={() => markBroken(id)} />
                    );
                  })}
                </span>
                <span className="cat-col-copy">
                  <strong>{item.title}</strong>
                  <small>{count} templates</small>
                </span>
              </button>
            );
          })}
        </section>

        <section className="cat-bar">
          <div className="cat-occ" role="tablist" aria-label="Occasion">
            <button type="button" role="tab" aria-selected={occasion === "all"} className={occasion === "all" ? "on" : ""} onClick={() => { setOccasion("all"); setCollection(null); }}>
              All <span>{filtered.base.length}</span>
            </button>
            {events.map((event) => {
              const count = filtered.base.filter((template) => template.events.includes(event.id as Template["events"][number])).length;
              const on = occasion === event.id;
              const disabled = count === 0 && !on;
              return (
                <button
                  key={event.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={on ? "on" : ""}
                  disabled={disabled}
                  onClick={() => { setOccasion(event.id); setCollection(null); }}
                >
                  {event.label} <span>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="cat-filters-desk">
            <div className="cat-seg" role="group" aria-label="Price">
              {(["All", "Free", "Paid"] as const).map((label) => (
                <button key={label} type="button" className={price === label ? "on" : ""} aria-pressed={price === label} onClick={() => { setPrice(label); setCollection(null); }}>
                  {label}
                </button>
              ))}
            </div>
            <i className="cat-rule" />
            {STYLES.map((style) => (
              <button key={style} type="button" className={`cat-style${styles.includes(style) ? " on" : ""}`} aria-pressed={styles.includes(style)} onClick={() => toggleStyle(style)}>
                {style}
              </button>
            ))}
            <button type="button" className={`cat-saved${savedOnly ? " on" : ""}`} aria-pressed={savedOnly} onClick={() => setSavedOnly((on) => !on)}>
              <Heart size={14} aria-hidden="true" fill={savedOnly ? "currentColor" : "none"} /> {saved.length}
            </button>
            <div className="cat-sort-wrap">
            <span className="cat-count">{filtered.sorted.length === 1 ? "1 template" : `${filtered.sorted.length} templates`}</span>
            <div className="cat-sort" ref={sortRef}>
              <button type="button" aria-haspopup="listbox" aria-expanded={sortOpen} onClick={() => setSortOpen((open) => !open)}>
                Sort: {sortLabel}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B5A62" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 10l5 5 5-5" />
                </svg>
              </button>
              {sortOpen ? (
                <div role="listbox" aria-label="Sort">
                  {SORTS.map((item) => (
                    <button key={item.id} type="button" role="option" aria-selected={sort === item.id} className={sort === item.id ? "on" : ""} onClick={() => { setSort(item.id); setSortOpen(false); }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            </div>
          </div>

          <div className="cat-filters-mob">
            <button type="button" className="cat-filters-btn" onClick={() => setSheet(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filters
              {activeCount > 0 ? <span>{activeCount}</span> : null}
            </button>
            <button type="button" className={`cat-saved${savedOnly ? " on" : ""}`} aria-pressed={savedOnly} onClick={() => setSavedOnly((on) => !on)}>
              <Heart size={14} aria-hidden="true" fill={savedOnly ? "currentColor" : "none"} /> {saved.length}
            </button>
            <span className="cat-count">{filtered.sorted.length === 1 ? "1 template" : `${filtered.sorted.length} templates`}</span>
          </div>
        </section>

        <section className="cat-grid-wrap">
          {filtered.sorted.length === 0 ? (
            <div className="cat-grid" role="status" aria-busy="true" aria-label="Loading templates">
              <span className="skel-sr">Loading</span>
              <SkeletonCards count={8} />
            </div>
          ) : (
            <div className="cat-grid">
              {filtered.sorted.map((template, index) => {
                const extra = look(template.id);
                const loved = saved.includes(template.id);
                const labels = eventLabels(template);
                const first = events.find((event) => event.id === template.events[0])?.label ?? labels;
                return (
                  <article className="cat-card" key={template.id} style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}>
                    <div className="cat-thumb">
                      <Link className="cat-thumb-hit" to={`/browse/${template.id}`} state={{ fromBrowse: true }} aria-label={`Preview ${template.name}`}>
                        {cover(template)}
                      </Link>
                      <div className="cat-badges">
                        <span className={template.free ? "free" : "prem"}>{template.free ? "Free" : "Premium"}</span>
                        {extra.isNew ? <span className="new">New</span> : null}
                      </div>
                      <button type="button" className={`cat-heart${loved ? " on" : ""}`} aria-pressed={loved} aria-label={`${loved ? "Remove" : "Save"} ${template.name}`} onClick={() => toggleSaved(template.id)}>
                        <Heart size={18} aria-hidden="true" fill={loved ? "currentColor" : "none"} />
                      </button>
                      <div className="cat-hover">Quick preview</div>
                    </div>
                    <div className="cat-info">
                      <div className="cat-name-row">
                        <strong>{template.name}</strong>
                        <span className={template.free ? "free" : ""}>{formatPrice(template)}</span>
                      </div>
                      <span className="cat-line desk">{labels}</span>
                      <span className="cat-line mob">{formatPrice(template)} · {first}</span>
                      <div className="cat-actions">
                        <Link className="cat-preview" to={`/browse/${template.id}`} state={{ fromBrowse: true }}>Preview</Link>
                        <Link to={useHref(template, occasion)}>Use</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="cat-help">
            <div>
              <strong>Can’t find your style?</strong>
              <span>Every template can be recoloured, re-fonted and translated in the editor.</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="cat-foot">
        <Brand light />
        <nav aria-label="Footer">
          <Link to="/browse">Templates</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refunds">Refunds</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <small>© 2026 InvitesReady.com</small>
      </footer>

      {sheet ? (
        <div className="cat-sheet-back" onClick={() => setSheet(false)}>
          <div role="dialog" aria-label="Filters" className="cat-sheet" onClick={(event) => event.stopPropagation()}>
            <span className="cat-grab" />
            <div className="cat-sheet-head">
              <strong>Filters</strong>
              <button type="button" onClick={resetFilters}>Reset</button>
            </div>
            <span className="cat-sheet-label">Price</span>
            <div className="cat-sheet-prices" role="group" aria-label="Price">
              {(["All", "Free", "Paid"] as const).map((label) => (
                <button key={label} type="button" className={price === label ? "on" : ""} aria-pressed={price === label} onClick={() => { setPrice(label); setCollection(null); }}>
                  {label}
                </button>
              ))}
            </div>
            <span className="cat-sheet-label">Style</span>
            <div className="cat-sheet-styles">
              {STYLES.map((style) => (
                <button key={style} type="button" className={`cat-style${styles.includes(style) ? " on" : ""}`} aria-pressed={styles.includes(style)} onClick={() => toggleStyle(style)}>
                  {style}
                </button>
              ))}
            </div>
            <span className="cat-sheet-label">Sort by</span>
            <div className="cat-sheet-sorts">
              {SORTS.map((item) => (
                <button key={item.id} type="button" className={sort === item.id ? "on" : ""} aria-pressed={sort === item.id} onClick={() => setSort(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className="cat-sheet-go" onClick={() => setSheet(false)}>
              Show {filtered.sorted.length === 1 ? "1 template" : `${filtered.sorted.length} templates`}
            </button>
          </div>
        </div>
      ) : null}

      {preview && demo ? (
        <CatalogDemo template={preview} href={useHref(preview, occasion)} label="Use this template" onClose={() => setDemo(false)} />
      ) : null}

      {preview ? (
        <div className="cat-modal-back" onClick={closePreview}>
          <div role="dialog" aria-label={`${preview.name} preview`} className="cat-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="cat-modal-x" aria-label="Close preview" onClick={closePreview}>×</button>
            <div className="cat-phone-well">
              <div className="cat-phone">
                {cover(preview)}
              </div>
            </div>
            <div className="cat-modal-copy">
              <div className="cat-badges static">
                <span className={preview.free ? "free" : "prem"}>{preview.free ? "Free" : "Premium"}</span>
                {look(preview.id).styles.includes("Animated") ? <span className="anim"><Sparkle size={12} aria-hidden="true" /> Animated</span> : null}
              </div>
              <h2>{preview.name}</h2>
              <span className="cat-modal-meta">{eventLabels(preview)}</span>
              <p>{preview.description}</p>
              <ul>
                {look(preview.id).styles.map((style) => (
                  <li key={style}><Check size={15} strokeWidth={2.6} aria-hidden="true" />{FEAT[style]}</li>
                ))}
                <li><Check size={15} strokeWidth={2.6} aria-hidden="true" />RSVP, maps, countdown and wishes</li>
                <li><Check size={15} strokeWidth={2.6} aria-hidden="true" />Share on WhatsApp — no app for guests</li>
              </ul>
              <div className="cat-swatches">
                <span>Colour themes</span>
                {look(preview.id).swatches.map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </div>
              <div className="cat-modal-price">
                <strong>{formatPrice(preview)}</strong>
                <span>{preview.free ? "free forever, with a small credit" : "one-time for your event, no subscription"}</span>
              </div>
              <div className="cat-modal-actions">
                <Link to={useHref(preview)}>Use this template</Link>
                <button type="button" className="ghost" onClick={() => setDemo(true)}>Open live demo</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CatalogDemo({ template, onClose, href, label, fields }: { template: Template; onClose: () => void; href?: string; label?: string; fields?: InviteFields }) {
  const source = getTemplate(template.id) ?? template;
  const shown = fields ?? sampleFor(source, source.events[0]);
  return (
    <div className="cat-demo" role="dialog" aria-label={`${source.name} live demo`}>
      <div className="cat-demo-bar">
        {href && label ? <Link className="cat-demo-use" to={href}>{label}</Link> : null}
        <button type="button" className="cat-demo-x" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <InviteView template={source} fields={shown} live demo />
    </div>
  );
}
