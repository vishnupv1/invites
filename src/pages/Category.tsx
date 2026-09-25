import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PreviewModal } from "../components/PreviewModal";
import { InviteView } from "../components/InviteView";
import { getEvent } from "../data/events";
import { formatPrice, getTemplate, sampleFor, templatesFor } from "../data/templates";
import { useLibrary } from "../state";
import type { EventId } from "../types";

export function Category() {
  const { id } = useParams();
  const event = getEvent(id);
  const styles = templatesFor(id);
  const { owns } = useLibrary();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const known = id && styles.length > 0;

  if (!known) return <Navigate to="/" replace />;

  return (
    <section className="shop">
      <Link className="back" to="/#categories">
        All celebrations
      </Link>
      <div className="section-head">
        <h1>{event.label}</h1>
        <p>Styles made for this celebration. Preview one before you use it.</p>
      </div>
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
                <InviteView template={template} fields={sampleFor(template, id)} />
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
                  <Link className="solid" to={`/template/${template.id}?event=${id}`}>
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
