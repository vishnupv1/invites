import { useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { GazalInvite } from "../components/GazalInvite";
import { getEvent } from "../data/events";
import { getTemplate, sampleFor } from "../data/templates";
import { assetUrl, createInvite, ensureSession, getToken, uploadMedia } from "../api";
import { searchPlaces, type PlaceHit } from "../lib/media";
import { useLibrary } from "../state";
import type { EventId, InviteFields } from "../types";

const textFields: (keyof InviteFields)[] = [
  "hosts",
  "names",
  "title",
  "detail",
  "date",
  "time",
  "venue",
  "address",
  "message",
  "dress",
  "rsvpBy",
  "hostEmail",
  "receptionTime",
  "receptionVenue",
  "receptionAddress",
];

export function Editor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const template = getTemplate(id);
  const { owns, remember } = useLibrary();
  const starting = template ? sampleFor(template, params.get("event") ?? undefined) : null;
  const [draft, setDraft] = useState<InviteFields | null>(starting);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);

  if (!template || !draft) return <Navigate to="/" replace />;
  if (!owns(template.id, template.free)) return <Navigate to={`/template/${template.id}`} replace />;

  const event = getEvent(draft.event);

  function chooseEvent(next: EventId) {
    if (!template) return;
    setDraft((current) => {
      const fresh = sampleFor(template, next);
      if (!current) return fresh;
      return {
        ...fresh,
        date: current.date,
        time: current.time,
        venue: current.venue,
        address: current.address,
        rsvpBy: current.rsvpBy,
        hostEmail: current.hostEmail,
      };
    });
    setLink("");
  }

  function update(key: keyof InviteFields, value: string) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function label(key: keyof InviteFields) {
    if (key === "hosts") return event.hostsLabel;
    if (key === "names") return event.namesLabel;
    if (key === "title") return event.titleLabel;
    if (key === "detail") return event.detailLabel;
    if (key === "dress") return draft?.event === "marriage" || draft?.event === "reception" ? "Attire" : "Dress";
    if (key === "message") return "Note to guests";
    if (key === "rsvpBy") return "Reply by";
    if (key === "hostEmail") return "Your email for replies";
    if (key === "date") return "Date";
    if (key === "time") return "Time";
    if (key === "venue") return "Venue";
    if (key === "receptionTime") return "Reception time";
    if (key === "receptionVenue") return "Reception venue";
    if (key === "receptionAddress") return "Reception address";
    return "Address";
  }

  async function publishLink() {
    if (!draft || !template) return;
    if (!draft.names.trim() || !draft.date) {
      setError("Add the names and a date before publishing.");
      return;
    }
    try {
      if (!getToken()) {
        const email = draft.hostEmail.includes("@") ? draft.hostEmail : `host-${crypto.randomUUID()}@vellum.local`;
        await ensureSession(email, draft.hosts || draft.names);
      }
      const saved = await createInvite(template.id, draft);
      remember(saved);
      setError("");
      setLink(`${window.location.origin}/i/${saved.code}`);
      setCopied(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish.");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  const shown = textFields.filter((key) => {
    if (key === "detail" && !event.detailLabel) return false;
    if (key.startsWith("reception") && (template.free || draft.event !== "marriage")) return false;
    return true;
  });

  return (
    <section className="editor">
      <div>
        <Link className="back" to={`/template/${template.id}?event=${draft.event}`}>
          {template.name}
        </Link>
        <h1>{event.label}</h1>
        <p className="lede">The card is written for this occasion. Switch it and the wording changes.</p>
        <div className="chips" role="group" aria-label="Occasion">
          {template.events.map((id) => (
            <button key={id} type="button" className={id === draft.event ? "chip on" : "chip"} onClick={() => chooseEvent(id)}>
              {getEvent(id).label}
            </button>
          ))}
        </div>
        <div className="form-grid">
          {shown.map((key) => (
            <label key={key} className={key === "message" || key === "address" ? "wide" : ""}>
              {label(key)}
              {key === "message" ? (
                <textarea value={draft[key]} rows={3} onChange={(event) => update(key, event.target.value)} />
              ) : (
                <input
                  type={key === "date" || key === "rsvpBy" ? "date" : key === "time" ? "time" : "text"}
                  value={draft[key]}
                  onChange={(event) => update(key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        {template.asks.photos > 0 ? (
          <fieldset className="extra-ask">
            <legend>Photos · up to {template.asks.photos}</legend>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = "";
                try {
                  if (!getToken()) {
                    const email = draft.hostEmail.includes("@") ? draft.hostEmail : `host-${crypto.randomUUID()}@vellum.local`;
                    await ensureSession(email, draft.hosts || "Host");
                  }
                  const next = [...(draft.photos ?? [])];
                  for (const file of files) {
                    if (next.length >= template.asks.photos) break;
                    next.push(await uploadMedia(file));
                  }
                  setDraft((current) => (current ? { ...current, photos: next } : current));
                  setError("");
                } catch (reason) {
                  setError(reason instanceof Error ? reason.message : "Could not add that photo.");
                }
              }}
            />
            <div className="photo-row">
              {(draft.photos ?? []).map((photo, index) => (
                <button
                  key={photo.slice(0, 32) + index}
                  type="button"
                  className="photo-thumb"
                  onClick={() =>
                    setDraft((current) =>
                      current ? { ...current, photos: current.photos.filter((_, item) => item !== index) } : current,
                    )
                  }
                >
                  <img src={assetUrl(photo)} alt="" />
                  Remove
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        {template.asks.audio ? (
          <fieldset className="extra-ask">
            <legend>Audio, if you have it</legend>
            <input
              type="file"
              accept="audio/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                try {
                  if (!getToken()) {
                    const email = draft.hostEmail.includes("@") ? draft.hostEmail : `host-${crypto.randomUUID()}@vellum.local`;
                    await ensureSession(email, draft.hosts || "Host");
                  }
                  const audio = await uploadMedia(file);
                  setDraft((current) => (current ? { ...current, audio } : current));
                  setError("");
                } catch (reason) {
                  setError(reason instanceof Error ? reason.message : "Could not add that audio.");
                }
              }}
            />
            <input
              type="url"
              placeholder="Or paste a link to a song"
              value={draft.audio.startsWith("http") ? draft.audio : ""}
              onChange={(event) => setDraft((current) => (current ? { ...current, audio: event.target.value } : current))}
            />
            {draft.audio ? (
              <button type="button" className="ghost" onClick={() => setDraft((current) => (current ? { ...current, audio: "" } : current))}>
                Remove audio
              </button>
            ) : (
              <p>Leave this empty if you don’t have a song.</p>
            )}
          </fieldset>
        ) : null}
        {template.asks.location ? (
          <fieldset className="extra-ask">
            <legend>Location</legend>
            <div className="link-box">
              <input
                value={placeQuery}
                placeholder="Search a venue or address"
                onChange={(event) => setPlaceQuery(event.target.value)}
              />
              <button
                type="button"
                className="ghost"
                onClick={async () => {
                  if (!placeQuery.trim()) return;
                  setSearching(true);
                  try {
                    setPlaces(await searchPlaces(placeQuery.trim()));
                    setError("");
                  } catch (reason) {
                    setError(reason instanceof Error ? reason.message : "Could not search places.");
                  } finally {
                    setSearching(false);
                  }
                }}
              >
                {searching ? "Searching" : "Search"}
              </button>
            </div>
            <ul className="place-list">
              {places.map((place) => (
                <li key={`${place.lat}-${place.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      const venue = place.label.split(",")[0];
                      setDraft((current) =>
                        current
                          ? { ...current, venue: venue.trim(), address: place.label, lat: place.lat, lng: place.lng }
                          : current,
                      );
                      setPlaces([]);
                    }}
                  >
                    {place.label}
                  </button>
                </li>
              ))}
            </ul>
            {draft.lat ? <p>Selected: {draft.address}</p> : null}
          </fieldset>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="solid" type="button" onClick={publishLink}>
          Publish invite link
        </button>
        {link ? (
          <div className="link-box">
            <input readOnly value={link} />
            <button className="ghost" type="button" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </button>
            <a className="ghost" href={link}>
              Open
            </a>
          </div>
        ) : null}
      </div>
      <div className="preview">
        {template.style === "gazal" ? <GazalInvite fields={draft} /> : <InviteView template={template} fields={draft} />}
      </div>
    </section>
  );
}
