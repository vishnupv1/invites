import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Heart, Sparkle } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { PublicHeader } from "../components/PublicHeader";
import { SkeletonCards } from "../components/CardSkeleton";
import { InviteView } from "../components/InviteView";
import { listEvents, listTemplates, type CatalogEvent } from "../api";
import { EVENTS } from "../data/events";
import { TEMPLATES, designCtaLabel, eventLabels, formatPrice, getTemplate, sampleFor, withCatalogMeta } from "../data/templates";
import { trackTemplatePreview } from "../lib/analytics";
import type { InviteFields, Template } from "../types";
import "./all-templates.css";

type StyleTag = "Animated" | "Traditional" | "Royal" | "Modern" | "Minimal";

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
  grandenvelope: { styles: ["Animated", "Royal"], pop: 97, added: 18, isNew: true, tags: "envelope wax seal burgundy gold munnar flap parchment", swatches: ["#1A0C0A", "#6E2032", "#E8C987"] },
  palace: { styles: ["Animated", "Royal"], pop: 99, added: 20, isNew: true, tags: "paper palace drapes roses jaipur plaque ribbon doors", swatches: ["#F3E2D8", "#6E4A42"] },
  bloom: { styles: ["Animated", "Modern"], pop: 103, added: 24, isNew: true, tags: "bloom letter floral seal envelope jaipur garden pastels wreath", swatches: ["#FBF3EE", "#B9786E"] },
  hansa: { styles: ["Animated", "Royal"], pop: 102, added: 23, isNew: true, tags: "moonlight swans lake udaipur seal envelope lilies", swatches: ["#E4E0E6", "#4A4E68"] },
  villa: { styles: ["Animated", "Royal"], pop: 101, added: 22, isNew: true, tags: "tuscany villa lemon olive garden chianti destination wedding", swatches: ["#F7F1E6", "#66703F"] },
  moonlit: { styles: ["Animated", "Royal"], pop: 100, added: 21, isNew: true, tags: "moonlit jharokha lantern lake udaipur night gold diya", swatches: ["#0B1226", "#E9BE6A"] },
  pull: { styles: ["Animated", "Royal"], pop: 94, added: 15, isNew: true, tags: "curtain rope velvet gold wedding pull", swatches: ["#4A0716", "#10243F", "#0E3424", "#3A1638"] },
  inland: { styles: ["Animated"], pop: 91, added: 16, isNew: true, tags: "birthday inland letter tear balloons party kochi", swatches: ["#CFE2F2", "#C8342B", "#F2B33D"] },
  botanica: { styles: ["Animated", "Minimal"], pop: 82, added: 13, isNew: true, tags: "floral frames roses sage blush", swatches: ["#FBF3EA", "#EEF2E8", "#1E2238"] },
  baptism: { styles: ["Animated", "Minimal"], pop: 79, added: 7, tags: "baptism dove sky blue clouds baby", swatches: ["#DCEBF7", "#F6DCE2", "#DCE8D9"] },
  hearth: { styles: ["Animated", "Modern"], pop: 77, added: 8, tags: "house home mint door key", swatches: ["#DDEFE8", "#FBD9B6", "#34456E"] },
};

const SAVED_KEY = "invitesready-saved-templates";
type PriceFilter = "All" | "Free" | "Paid";

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
  return `/create/${template.id}?event=${event}`;
}

export function AllTemplates() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState<CatalogEvent[]>(EVENTS);
  const [catalog, setCatalog] = useState<Template[]>(TEMPLATES);
  const [catalogReady, setCatalogReady] = useState(false);
  const [occasion, setOccasion] = useState("all");
  const [price, setPrice] = useState<PriceFilter>("All");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState<string[]>(readSaved);
  const [previewId, setPreviewId] = useState<string | null>(routeId ?? null);
  const [demo, setDemo] = useState(false);
  const [broken, setBroken] = useState<string[]>([]);

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
    const preview = previewId ? catalog.find((item) => item.id === previewId) ?? getTemplate(previewId) : undefined;
    if (preview) trackTemplatePreview(preview);
  }, [previewId, catalog]);

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    if (!categoryOpen) return;
    function onPointer(event: PointerEvent) {
      if (!categoryRef.current?.contains(event.target as Node)) setCategoryOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setCategoryOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [categoryOpen]);

  useEffect(() => {
    if (!previewId && !demo) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (demo) {
        setDemo(false);
        return;
      }
      closePreview();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [previewId, demo]);

  const filtered = useMemo(() => {
    const list = catalog.filter((template) => {
      const occasionOk = occasion === "all" || template.events.includes(occasion as Template["events"][number]);
      const priceOk = price === "All" || (price === "Free" ? template.free : !template.free);
      return occasionOk && priceOk;
    });
    return [...list].sort((a, b) => look(b.id).pop - look(a.id).pop || a.name.localeCompare(b.name));
  }, [catalog, occasion, price]);

  const preview = catalog.find((template) => template.id === previewId) ?? null;

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
        className={template.id === "moonlit" ? "is-moonlit" : template.id === "palace" ? "is-palace" : undefined}
        src={`/covers/${template.id}.jpg`}
        alt=""
        onError={() => markBroken(template.id)}
      />
    );
  }

  return (
    <div className="cat">
      <PublicHeader />

      <main>
        <section className="cat-hero">
          <span className="cat-kicker">Templates</span>
          <h1>
            Find the invite that feels like <em>you.</em>
          </h1>
          <p>Preview any design free. Pay once when you publish. Guests RSVP with no app.</p>
          <div className="cat-tools">
            <div className="cat-seg" role="group" aria-label="Price">
              {(["All", "Free", "Paid"] as const).map((label) => (
                <button key={label} type="button" className={price === label ? "on" : ""} aria-pressed={price === label} onClick={() => setPrice(label)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="cat-category" ref={categoryRef}>
              <span id="cat-category-label">Category</span>
              <div className={`cat-category-menu${categoryOpen ? " is-open" : ""}`}>
                <button type="button" aria-haspopup="listbox" aria-expanded={categoryOpen} aria-labelledby="cat-category-label" onClick={() => setCategoryOpen((open) => !open)}>
                  <span>{events.find((event) => event.id === occasion)?.label ?? "All"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 10l5 5 5-5" />
                  </svg>
                </button>
                {categoryOpen ? (
                  <div role="listbox" aria-labelledby="cat-category-label">
                    {[{ id: "all", label: "All" }, ...events].map((event) => {
                      const on = occasion === event.id;
                      return (
                        <button
                          key={event.id}
                          type="button"
                          role="option"
                          aria-selected={on}
                          className={on ? "on" : ""}
                          onClick={() => {
                            setOccasion(event.id);
                            setCategoryOpen(false);
                          }}
                        >
                          <span aria-hidden="true">{on ? <Check size={14} strokeWidth={2.8} /> : null}</span>
                          {event.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="cat-grid-wrap">
          {filtered.length === 0 ? (
            <div className="cat-grid" role="status" aria-busy="true" aria-label="Loading templates">
              <span className="skel-sr">Loading</span>
              <SkeletonCards count={8} />
            </div>
          ) : (
            <div className="cat-grid">
              {filtered.map((template, index) => {
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
        <Brand />
        <nav aria-label="Footer">
          <Link to="/browse">Templates</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refunds">Refunds</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <small>© 2026 InvitesReady.com</small>
      </footer>

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
                <Link to={useHref(preview)}>{designCtaLabel(preview)}</Link>
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

