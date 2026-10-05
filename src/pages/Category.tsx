import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PreviewModal } from "../components/PreviewModal";
import { getEvent } from "../data/events";
import { SEO_CATEGORIES, TOPICS } from "../data/topics";
import { formatPrice, getTemplate, templatesFor } from "../data/templates";
import { useLibrary } from "../state";
import { Breadcrumbs } from "../components/Breadcrumbs";
import type { EventId } from "../types";

function categoryHeading(id: string, label: string) {
  if (id === "marriage") return "Digital wedding invitations";
  if (id === "baptism") return "Baptism invitations";
  if (id === "housewarming") return "Housewarming invitations";
  if (id === "birthday") return "Birthday invitations";
  return label;
}

export function Category() {
  const { id } = useParams();
  const event = getEvent(id);
  const styles = templatesFor(id);
  const { owns } = useLibrary();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const known = id && styles.length > 0;

  if (!known) return <Navigate to="/" replace />;

  const line = SEO_CATEGORIES[event.id];
  const related = event.id === "marriage"
    ? TOPICS.filter((topic) => topic.id === "nikah" || topic.id === "shaadi" || topic.id === "tamil-wedding" || topic.id === "wedding")
    : TOPICS.filter((topic) => topic.templates.some((id) => styles.some((template) => template.id === id)));

  return (
    <section className="shop">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Celebrations", to: "/occasions" }, { label: event.label }]} />
      <div className="section-head topic-head">
        <div>
          <h1>{line ? categoryHeading(event.id, event.label) : event.label}</h1>
          <p className="topic-lead">{line?.lead ?? "Styles made for this celebration. Preview one before you use it."}</p>
        </div>
      </div>
      {related.length ? (
        <nav className="topic-links" aria-label="Related celebrations">
          {related.map((topic) => (
            <Link key={topic.id} to={topic.path}>{topic.heading}</Link>
          ))}
        </nav>
      ) : null}
      <div className="grid">
        {styles.map((template) => {
          const owned = owns(template.id, template.free);
          return (
            <article key={template.id} className="shop-card">
              <button
                type="button"
                className="mini-preview"
                aria-label={`Preview ${template.name}`}
                onClick={() => setPreviewId(template.id)}
              >
                <img src={`/covers/${template.id}.jpg`} alt={`${template.name} invitation`} />
              </button>
              <div className="shop-copy">
                <div className="shop-top">
                  <h3>{template.name}</h3>
                  <span className={template.free ? "pill free" : "pill"}>{formatPrice(template)}</span>
                </div>
                <p>{template.tagline}</p>
                <small>{owned && !template.free ? "Owned" : template.description}</small>
                <div className="shop-actions">
                  <button type="button" className="ghost" onClick={() => setPreviewId(template.id)}>
                    Preview
                  </button>
                  <Link className="solid" to={owned ? `/create?template=${template.id}&event=${id}` : `/template/${template.id}?event=${id}`}>
                    {owned ? "Use" : "Details"}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {previewId && getTemplate(previewId) ? (
        <PreviewModal
          template={getTemplate(previewId)!}
          event={id as EventId}
          onEvent={() => undefined}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
    </section>
  );
}
