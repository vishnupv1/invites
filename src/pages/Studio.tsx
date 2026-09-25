import { useState } from "react";
import { Link } from "react-router-dom";
import { PreviewModal } from "../components/PreviewModal";
import { TEMPLATES, getTemplate } from "../data/templates";
import { formatShortDate } from "../lib/dates";
import { useLibrary } from "../state";
import type { EventId } from "../types";

export function Studio() {
  const { owned, invites } = useLibrary();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewEvent, setPreviewEvent] = useState<EventId>("marriage");
  const preview = getTemplate(previewId ?? undefined);
  const unlocked = TEMPLATES.filter((template) => template.free || owned.includes(template.id));

  return (
    <section className="studio">
      <p className="eyebrow">Studio</p>
      <h1>Your templates and links</h1>
      <h2>Owned</h2>
      <ul className="plain">
        {unlocked.map((template) => (
          <li key={template.id}>
            <span>
              {template.name}
              {template.free ? " · free demo" : " · bought once"}
            </span>
            <span className="row-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setPreviewId(template.id);
                  setPreviewEvent(template.events[0]);
                }}
              >
                Preview
              </button>
              <Link to={`/template/${template.id}`}>New invite</Link>
            </span>
          </li>
        ))}
      </ul>
      <h2>Published</h2>
      {invites.length === 0 ? (
        <p className="lede">Nothing published yet. The free demo is ready when you are.</p>
      ) : (
        <ul className="plain">
          {invites.map((invite) => {
            const template = getTemplate(invite.templateId);
            const yes = invite.yes ?? 0;
            const replies = invite.replies ?? 0;
            return (
              <li key={invite.id}>
                <span>
                  <strong>{invite.names}</strong>
                  <small>
                    {template?.name} · {formatShortDate(invite.date)} · {yes} yes of {replies}
                  </small>
                </span>
                <Link to={`/i/${invite.code}`}>Open link</Link>
              </li>
            );
          })}
        </ul>
      )}
      {preview ? (
        <PreviewModal
          template={preview}
          event={previewEvent}
          onEvent={setPreviewEvent}
          onClose={() => setPreviewId(null)}
        />
      ) : null}
    </section>
  );
}
