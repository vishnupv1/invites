import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { PreviewModal } from "../components/PreviewModal";
import { getHost, getToken, signOut } from "../api";
import { EVENTS } from "../data/events";
import { TEMPLATES, formatPrice, getTemplate, sampleFor } from "../data/templates";
import { formatShortDate } from "../lib/dates";
import { useLibrary } from "../state";
import type { EventId, SavedInvite, Template } from "../types";
import "./studio.css";

export function Studio() {
  const { owned, invites, ready } = useLibrary();
  const signedIn = Boolean(getToken());
  const [hostName, setHostName] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewEvent, setPreviewEvent] = useState<EventId>("marriage");
  const [copied, setCopied] = useState("");
  const preview = getTemplate(previewId ?? undefined);
  const unlocked = TEMPLATES.filter((template) => template.free || owned.includes(template.id));
  const replies = invites.reduce((sum, invite) => sum + (invite.replies ?? 0), 0);
  const attending = invites.reduce((sum, invite) => sum + (invite.yes ?? 0), 0);
  const first = hostName.trim().split(" ")[0];

  useEffect(() => {
    if (!signedIn) return;
    getHost()
      .then((host) => setHostName(host.name))
      .catch(() => setHostName(""));
  }, [signedIn]);

  async function copyLink(invite: SavedInvite) {
    const url = `${window.location.origin}/i/${invite.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(invite.id);
    } catch {
      setCopied("");
    }
  }

  return (
    <div className="dash">
      <header className="dash-nav">
        <Link className="dash-brand" to="/">
          Invites<em>Ready</em>
        </Link>
        <nav>
          <Link to="/#occasions">Celebrations</Link>
          <Link to="/c/marriage">Templates</Link>
          <Link to="/studio">Dashboard</Link>
        </nav>
        {signedIn ? (
          <button
            type="button"
            onClick={() => {
              signOut();
              window.location.assign("/");
            }}
          >
            Log out
          </button>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </header>

      <section className="dash-hero">
        <div>
          <p>Dashboard</p>
          <h1>{signedIn && first ? `Hello, ${first}.` : "Your invitations."}</h1>
          <p className="dash-lede">
            {signedIn
              ? "Start a new invitation, open one you already published, or use a style you own."
              : "Log in to see the invitations on your account. The free wedding note is ready either way."}
          </p>
          <div className="dash-actions">
            <Link className="dash-fill" to="/c/marriage">
              Create invitation
            </Link>
            {!signedIn ? (
              <Link className="dash-line" to="/login">
                Log in
              </Link>
            ) : null}
          </div>
        </div>
        <div className="dash-stats">
          <article>
            <span>Invitations</span>
            <strong>{invites.length}</strong>
          </article>
          <article className="on">
            <span>Attending</span>
            <strong>{attending}</strong>
          </article>
          <article>
            <span>Replies</span>
            <strong>{replies}</strong>
          </article>
          <article>
            <span>Styles</span>
            <strong>{unlocked.length}</strong>
          </article>
        </div>
      </section>

      <section className="dash-block">
        <div className="dash-head">
          <div>
            <p>Make one</p>
            <h2>Choose the celebration.</h2>
          </div>
        </div>
        <div className="dash-occasions">
          {EVENTS.map((event) => (
            <Link key={event.id} to={`/c/${event.id}`}>
              {event.cardLabel}
            </Link>
          ))}
        </div>
      </section>

      <section className="dash-block">
        <div className="dash-head">
          <div>
            <p>Published</p>
            <h2>Invitations you’ve made.</h2>
          </div>
          <Link className="dash-line" to="/c/marriage">
            Create invitation
          </Link>
        </div>
        {!ready ? <p className="dash-empty">Loading your invitations…</p> : null}
        {ready && invites.length === 0 ? (
          <div className="dash-empty-card">
            <h3>Nothing published yet.</h3>
            <p>The free wedding note is a real invitation. Names, a date, and a link you can send.</p>
            <Link className="dash-fill" to="/create/garden?event=marriage">
              Write the free note
            </Link>
          </div>
        ) : null}
        <div className="dash-grid">
          {invites.map((invite) => {
            const template = getTemplate(invite.templateId);
            if (!template) return null;
            const event = (invite.event || template.events[0]) as EventId;
            const fields = {
              ...sampleFor(template, event),
              names: invite.names,
              title: invite.title || sampleFor(template, event).title,
              date: invite.date,
            };
            return (
              <article key={invite.id} className="dash-invite">
                <div className="dash-thumb">
                  {invite.cover ? <img src={invite.cover} alt="" /> : <InviteView template={template} fields={fields} />}
                </div>
                <div className="dash-meta">
                  <div>
                    <strong>{invite.names}</strong>
                    <span>
                      {template.name} · {formatShortDate(invite.date)}
                    </span>
                  </div>
                  <p>
                    {invite.yes ?? 0} yes of {invite.replies ?? 0} replies
                  </p>
                  <div className="dash-row">
                    <Link to={`/i/${invite.code}`}>Open</Link>
                    <button type="button" onClick={() => copyLink(invite)}>
                      {copied === invite.id ? "Copied" : "Copy link"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dash-block dash-gallery">
        <div className="dash-head">
          <div>
            <p>Gallery</p>
            <h2>Styles on your account.</h2>
          </div>
          <Link className="dash-gold" to="/c/marriage">
            Browse more
          </Link>
        </div>
        <div className="dash-grid">
          {unlocked.map((template) => (
            <StyleCard
              key={template.id}
              template={template}
              onPreview={() => {
                setPreviewId(template.id);
                setPreviewEvent(template.events[0]);
              }}
            />
          ))}
        </div>
      </section>

      {preview ? (
        <PreviewModal template={preview} event={previewEvent} onEvent={setPreviewEvent} onClose={() => setPreviewId(null)} />
      ) : null}
    </div>
  );
}

function StyleCard({ template, onPreview }: { template: Template; onPreview: () => void }) {
  const event = template.events[0];
  return (
    <article className="dash-style">
      <button type="button" className="dash-thumb" onClick={onPreview}>
        <InviteView template={template} fields={sampleFor(template, event)} />
      </button>
      <div className="dash-meta">
        <div>
          <strong>{template.name}</strong>
          <span>{template.tagline}</span>
        </div>
        <em>{formatPrice(template)}</em>
        <div className="dash-row">
          <button type="button" onClick={onPreview}>
            Preview
          </button>
          <Link to={`/create/${template.id}?event=${event}`}>Use</Link>
        </div>
      </div>
    </article>
  );
}
