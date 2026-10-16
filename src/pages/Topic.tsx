import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { PreviewModal } from "../components/PreviewModal";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { OccasionArticle } from "../components/OccasionArticle";
import { formatPrice, getTemplate, sampleFor, designCtaLabel, compareTemplatesNewestFirst } from "../data/templates";
import { topicByPath, TOPICS } from "../data/topics";
import { InlandInvite } from "../components/InlandInvite";
import { PlayingInvite } from "../components/shell/PlayingInvite";
import { useLibrary } from "../state";
import type { EventId } from "../types";

export function Topic() {
  const { pathname } = useLocation();
  const topic = topicByPath(pathname);
  const { owns } = useLibrary();
  const [previewId, setPreviewId] = useState<string | null>(null);
  if (!topic) return <Navigate to="/browse" replace />;

  const templates = topic.templates.map((id) => getTemplate(id)).filter((item) => item != null).sort(compareTemplatesNewestFirst);
  const related = topic.related.map((path) => TOPICS.find((item) => item.path === path)).filter((item) => item != null);
  const parent = topic.path !== "/wedding" && topic.related.includes("/wedding")
    ? TOPICS.find((item) => item.path === "/wedding")
    : undefined;
  const crumbs = [
    { label: "Home", to: "/" },
    ...(parent ? [{ label: parent.label, to: parent.path }] : []),
    { label: topic.label },
  ];
  const preview = previewId ? getTemplate(previewId) : undefined;

  return (
    <section className="shop">
      <Breadcrumbs items={crumbs} separator="›" />
      <div className="section-head topic-head">
        <div>
          <h1>{topic.heading}</h1>
          <p className="topic-lead">{topic.lead}</p>
        </div>
      </div>
      {topic.id === "birthday" && templates[0] ? (
        <div className="topic-demo">
          <InlandInvite fields={sampleFor(templates[0], "birthday")} demo autoOpen />
          <Link className="solid" to={`/create/${templates[0].id}?fresh=1`}>{designCtaLabel(templates[0])}</Link>
        </div>
      ) : null}
      {related.length ? (
        <nav className="topic-links" aria-label="Related celebrations">
          {related.map((item) => (
            <Link key={item.id} to={item.path}>{item.heading}</Link>
          ))}
        </nav>
      ) : null}
      <div className="grid">
        {templates.map((template) => {
          const event = template.events[0];
          const owned = owns(template.id, template.free);
          return (
            <article key={template.id} className="shop-card">
              <div
                className="mini-preview"
                role="button"
                tabIndex={0}
                aria-label={`Preview ${template.name}`}
                onClick={() => setPreviewId(template.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreviewId(template.id);
                  }
                }}
              >
                <PlayingInvite template={template} />
              </div>
              <div className="shop-copy">
                <div className="shop-top">
                  <h3><Link to={`/template/${template.id}`}>{template.name}</Link></h3>
                  <span className={template.free ? "pill free" : "pill"}>{formatPrice(template)}</span>
                </div>
                <p>{template.tagline}</p>
                <small>{template.description}</small>
                <div className="shop-actions">
                  <button type="button" className="ghost" onClick={() => setPreviewId(template.id)}>
                    Preview
                  </button>
                  <Link className="solid" to={owned ? `/create?template=${template.id}&event=${event}` : `/template/${template.id}`}>
                    {owned ? "Use" : "Details"}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <OccasionArticle id={topic.id} />
      {preview ? (
        <PreviewModal
          template={preview}
          event={preview.events[0] as EventId}
          onEvent={() => undefined}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
    </section>
  );
}
