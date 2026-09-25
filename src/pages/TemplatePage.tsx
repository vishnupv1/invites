import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Checkout } from "../components/Checkout";
import { InviteView } from "../components/InviteView";
import { PreviewModal } from "../components/PreviewModal";
import { getEvent } from "../data/events";
import { eventLabels, formatPrice, getTemplate, sampleFor } from "../data/templates";
import { useLibrary } from "../state";
import type { EventId } from "../types";

export function TemplatePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const template = getTemplate(id);
  const { owns, purchase } = useLibrary();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const requested = params.get("event") as EventId | null;
  const [picked, setPicked] = useState<EventId | null>(null);
  const event =
    template && picked && template.events.includes(picked)
      ? picked
      : template && requested && template.events.includes(requested)
        ? requested
        : template?.events[0];

  if (!template || !event) return <Navigate to="/" replace />;
  const owned = owns(template.id, template.free);
  const createTo = `/create/${template.id}?event=${event}`;

  return (
    <section className="detail">
      <div className="detail-preview">
        <InviteView template={template} fields={sampleFor(template, event)} />
      </div>
      <div>
        <Link className="back" to={`/#shop`}>
          All templates
        </Link>
        <p className="eyebrow">{template.free ? "Free demo" : "One-time purchase"}</p>
        <h1>{template.name}</h1>
        <p className="lede">{template.description}</p>
        <p className="occasions">{eventLabels(template)}</p>
        <div className="chips" role="group" aria-label="Personalize for">
          {template.events.map((id) => (
            <button key={id} type="button" className={id === event ? "chip on" : "chip"} onClick={() => setPicked(id)}>
              {getEvent(id).label}
            </button>
          ))}
        </div>
        <p className="price">{owned && !template.free ? "Owned" : formatPrice(template)}</p>
        <div className="hero-actions">
          <button type="button" className="ghost" onClick={() => setPreview(true)}>
            Preview
          </button>
        {owned ? (
          <Link className="solid" to={createTo}>
            {template.free ? "Use this version" : "Create this invite"}
          </Link>
        ) : (
          <button className="solid" type="button" onClick={() => setOpen(true)}>
            Buy once · ${template.price}
          </button>
        )}
        </div>
      </div>
      {open ? (
        <Checkout
          template={template}
          onClose={() => setOpen(false)}
          onPurchased={async () => {
            await purchase(template.id);
            navigate(createTo);
          }}
        />
      ) : null}
      {preview ? (
        <PreviewModal
          template={template}
          event={event}
          onEvent={setPicked}
          onClose={() => setPreview(false)}
        />
      ) : null}
    </section>
  );
}
