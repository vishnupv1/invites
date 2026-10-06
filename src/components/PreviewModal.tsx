import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvent } from "../data/events";
import { sampleFor, designCtaLabel } from "../data/templates";
import { trackTemplatePreview } from "../lib/analytics";
import type { EventId, Template } from "../types";
import { InviteSite } from "./InviteSite";

type Props = {
  template: Template;
  event: EventId;
  onEvent: (event: EventId) => void;
  onClose: () => void;
};

export function PreviewModal({ template, event, onEvent, onClose }: Props) {
  const active = template.events.includes(event) ? event : template.events[0];
  useEffect(() => {
    trackTemplatePreview(template);
  }, [template]);

  return (
    <div className="site-preview" role="dialog" aria-modal="true" aria-label={`${template.name} preview`}>
      <div className="preview-toolbar">
        <div className="chips">
          {template.events.map((id) => (
            <button key={id} type="button" className={id === active ? "chip on" : "chip"} onClick={() => onEvent(id)}>
              {getEvent(id).label}
            </button>
          ))}
        </div>
        <div className="shop-actions">
          <Link className="solid" to={`/create/${template.id}?event=${active}`} onClick={onClose}>
            {designCtaLabel(template)}
          </Link>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <InviteSite template={template} fields={sampleFor(template, active)} demo />
    </div>
  );
}
