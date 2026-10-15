import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteInvite, listTemplates } from "../api";
import { FavoriteHeart } from "../components/FavoriteHeart";
import { Spinner } from "../components/Loader";
import { getEvent } from "../data/events";
import { formatPrice } from "../data/templates";
import { useFavs } from "../lib/favorites";
import { formatShortDate } from "../lib/dates";
import { guestInviteUrl } from "../lib/share";
import { useLibrary } from "../state";
import type { SavedInvite, Template } from "../types";

type View = "events" | "drafts" | "favorites" | "purchases";

function editedLabel(iso: string) {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "Saved draft";
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 0) return "Edited today";
  if (days === 1) return "Edited yesterday";
  if (days < 7) return `Edited ${days} days ago`;
  return `Edited ${formatShortDate(iso.slice(0, 10))}`;
}

function eventMeta(invite: SavedInvite) {
  const event = invite.event ? getEvent(invite.event)?.label : "";
  return [event, formatShortDate(invite.date), invite.venue].filter(Boolean).join(" · ");
}

export function LibraryPane({ view }: { view: View }) {
  const { invites, ready, owned, forget } = useLibrary();
  const { favs, toggle } = useFavs();
  const [catalog, setCatalog] = useState<Template[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState("");
  const [busy, setBusy] = useState(false);
  const drafts = invites.filter((invite) => invite.status === "draft");
  const published = invites.filter((invite) => invite.status !== "draft");
  const favoriteTemplates = favs.map((id) => catalog.find((template) => template.id === id)).filter((template): template is Template => Boolean(template));
  const purchased = owned.map((id) => catalog.find((template) => template.id === id)).filter((template): template is Template => Boolean(template));

  useEffect(() => {
    if (view !== "favorites" && view !== "purchases") return;
    listTemplates()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setCatalogReady(true));
  }, [view]);

  async function share(invite: SavedInvite) {
    const url = guestInviteUrl(invite.code, invite.templateId);
    try {
      await navigator.clipboard.writeText(url);
      setNote("Invite link copied.");
    } catch {
      setNote(url);
    }
  }

  async function remove(invite: SavedInvite) {
    if (pending !== invite.id) {
      setPending(invite.id);
      setNote("");
      return;
    }
    setBusy(true);
    try {
      await deleteInvite(invite.id);
      forget(invite.id);
      setPending("");
      setNote(`${invite.names || "Event"} deleted.`);
    } catch (reason) {
      setNote(reason instanceof Error ? reason.message : "Could not delete that event.");
    } finally {
      setBusy(false);
    }
  }

  function removeActions(invite: SavedInvite) {
    const confirming = pending === invite.id;
    return confirming ? (
      <>
        <button type="button" disabled={busy} onClick={() => setPending("")}>Cancel</button>
        <button type="button" className="is-danger is-confirm" disabled={busy} onClick={() => void remove(invite)}>{busy ? "Deleting…" : invite.status === "draft" ? "Delete draft" : "Delete event"}</button>
      </>
    ) : (
      <button type="button" className="is-danger" onClick={() => void remove(invite)}>Delete</button>
    );
  }

  if (view === "events") {
    return (
      <div className="rsvp-lib">
        {!ready ? <p className="rsvp-wait"><Spinner size="md" /> Loading your events…</p> : null}
        {published.map((invite) => (
          <article className="rsvp-lib-card" key={invite.id}>
            <img src={invite.cover || `/covers/${invite.templateId}.jpg`} alt="" />
            <div>
              <span className="rsvp-pill yes">{invite.status === "live" ? "Live" : "Saved"}</span>
              <b>{invite.names || "Untitled event"}</b>
              {eventMeta(invite) ? <small>{eventMeta(invite)}</small> : null}
              <div className="rsvp-lib-actions">
                {pending === invite.id ? null : (
                  <>
                    <Link to={`/create/${invite.templateId}?invite=${invite.id}`}>Edit</Link>
                    <button type="button" onClick={() => void share(invite)}>Share</button>
                  </>
                )}
                {removeActions(invite)}
              </div>
            </div>
          </article>
        ))}
        {ready ? (
          <Link className="rsvp-lib-new" to="/templates">
            <b>+</b>
            <span>New invitation</span>
          </Link>
        ) : null}
        {note ? <p className="rsvp-note">{note}</p> : null}
      </div>
    );
  }

  if (view === "drafts") {
    if (!ready) return <p className="rsvp-wait"><Spinner size="md" /> Loading your drafts…</p>;
    if (!drafts.length) {
      return (
        <div className="rsvp-empty">
          <h1>No saved drafts</h1>
          <p>Designs you start and leave unpublished stay here.</p>
          <Link className="rsvp-go" to="/templates">Browse templates</Link>
        </div>
      );
    }
    return (
      <div className="rsvp-lib is-tiles">
        {drafts.map((invite) => (
          <article className="rsvp-lib-tile" key={invite.id}>
            <img src={invite.cover || `/covers/${invite.templateId}.jpg`} alt="" />
            <b>{invite.names || "Untitled draft"}</b>
            <small>{editedLabel(invite.createdAt)}</small>
            <div className="rsvp-lib-actions">
              {pending === invite.id ? null : <Link to={`/create/${invite.templateId}?invite=${invite.id}`}>Continue</Link>}
              {removeActions(invite)}
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (view === "favorites") {
    if (!catalogReady) return <p className="rsvp-wait"><Spinner size="md" /> Loading your favorites…</p>;
    if (!favoriteTemplates.length) {
      return (
        <div className="rsvp-empty">
          <h1>No favorites yet</h1>
          <p>Save a template from its page and it will wait here.</p>
          <Link className="rsvp-go" to="/templates">Browse templates</Link>
        </div>
      );
    }
    return (
      <div className="rsvp-lib is-tiles">
        {favoriteTemplates.map((template) => {
          const event = template.events[0] ?? "marriage";
          return (
            <article className="rsvp-lib-tile" key={template.id}>
              <img src={`/covers/${template.id}.jpg`} alt="" />
              <FavoriteHeart liked name={template.name} onClick={() => toggle(template.id)} />
              <b>{template.name}</b>
              <small>{formatPrice(template)}</small>
              <Link to={`/create/${template.id}?event=${event}`}>Use this design</Link>
            </article>
          );
        })}
      </div>
    );
  }

  if (!catalogReady) return <p className="rsvp-wait"><Spinner size="md" /> Loading your purchases…</p>;
  if (!purchased.length) {
    return (
      <div className="rsvp-empty">
        <h1>No purchases yet</h1>
        <p>Templates you buy show up here, ready to use again.</p>
        <Link className="rsvp-go" to="/templates">Browse templates</Link>
      </div>
    );
  }
  return (
    <div className="rsvp-lib">
      {purchased.map((template) => {
        const event = template.events[0] ?? "marriage";
        return (
          <article className="rsvp-lib-card" key={template.id}>
            <img src={`/covers/${template.id}.jpg`} alt="" />
            <div>
              <b>{template.name}</b>
              <small>{getEvent(event)?.label ?? "Invitation"} · {formatPrice(template)}</small>
              <div className="rsvp-lib-actions">
                <Link to={`/create/${template.id}?event=${event}`}>Use this design</Link>
              </div>
            </div>
          </article>
        );
      })}
      <p className="rsvp-note">Need help with a payment? <a href="mailto:invitesreadyforyou@gmail.com">Contact support</a></p>
    </div>
  );
}
