import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listTemplates } from "../api";
import { FavoriteHeart } from "../components/FavoriteHeart";
import { PlayingInvite } from "../components/shell/PlayingInvite";
import { EVENTS } from "../data/events";
import { TEMPLATES, formatPrice, withCatalogMeta } from "../data/templates";
import { useFavs } from "../lib/favorites";
import { useLibrary } from "../state";
import type { EventId, Template } from "../types";

const OCCASION_LABEL: Partial<Record<EventId, string>> = {
  marriage: "Wedding",
};

export function AccountTemplates() {
  const { owns, loadPurchases } = useLibrary();
  const { favs, toggle } = useFavs();
  const [catalog, setCatalog] = useState<Template[]>(TEMPLATES);
  const [ready, setReady] = useState(false);
  const [occasion, setOccasion] = useState<EventId | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  useEffect(() => {
    listTemplates()
      .then((rows) => setCatalog(rows.map(withCatalogMeta)))
      .catch(() => setCatalog(TEMPLATES))
      .finally(() => setReady(true));
  }, []);

  const occasions = useMemo(() => {
    return EVENTS.filter((event) => catalog.some((item) => item.events.includes(event.id)));
  }, [catalog]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((template) => {
      const occasionOk = occasion === "all" || template.events.includes(occasion);
      const textOk = !q || template.name.toLowerCase().includes(q) || template.description.toLowerCase().includes(q);
      return occasionOk && textOk;
    });
  }, [catalog, occasion, query]);

  return (
    <div className="rsvp-catalog">
      <p>Pick a design and start it in the editor. Publishing is free for now.</p>
      {/* <p>Pick a design and start it in the editor. You pay when you publish.</p> */}
      <div className="rsvp-catalog-tools" role="group" aria-label="Occasion">
        <button type="button" aria-pressed={occasion === "all"} className={occasion === "all" ? "on" : ""} onClick={() => setOccasion("all")}>All</button>
        {occasions.map((event) => (
          <button
            key={event.id}
            type="button"
            aria-pressed={occasion === event.id}
            className={occasion === event.id ? "on" : ""}
            onClick={() => setOccasion(event.id)}
          >
            {OCCASION_LABEL[event.id] ?? event.label}
          </button>
        ))}
      </div>
      <label className="rsvp-search">
        Search templates
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or style" />
      </label>
      <div className="rsvp-catalog-grid">
        {visible.map((template) => {
          const event = template.events[0] ?? "marriage";
          const owned = owns(template.id, template.free);
          return (
            <article className="rsvp-catalog-card" key={template.id}>
              <Link className="rsvp-catalog-shot" to={`/create/${template.id}?event=${event}&fresh=1`} aria-label={`Use ${template.name}`}>
                <PlayingInvite template={template} />
                {owned && !template.free ? <span className="rsvp-catalog-owned">Owned</span> : null}
              </Link>
              <FavoriteHeart className="overlay" liked={favs.includes(template.id)} name={template.name} onClick={() => toggle(template.id)} />
              <b>{template.name}</b>
              <small>{formatPrice(template)}</small>
              <Link to={`/create/${template.id}?event=${event}&fresh=1`}>Use this design</Link>
            </article>
          );
        })}
      </div>
      {ready && visible.length === 0 ? <p className="rsvp-none">No templates in this filter.</p> : null}
    </div>
  );
}
