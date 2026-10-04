import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTemplates } from "../api";
import { AccountTabs } from "../components/LoggedInChrome";
import { getEvent } from "../data/events";
import { formatPrice } from "../data/templates";
import { useFavs } from "../lib/favorites";
import { formatShortDate } from "../lib/dates";
import { useSession } from "../session";
import { useLibrary } from "../state";
import type { SavedInvite, Template } from "../types";

const TRENDING = ["botanica", "peace", "shaadi", "beach"];
const SPARKLES = [
  { left: "8%", top: "20%", size: 22, delay: "0s" },
  { left: "88%", top: "12%", size: 18, delay: "0.4s" },
  { left: "94%", top: "70%", size: 26, delay: "0.8s" },
  { left: "4%", top: "78%", size: 16, delay: "1.1s" },
  { left: "50%", top: "2%", size: 14, delay: "0.2s" },
];

function replyLine(invite: SavedInvite) {
  const yes = invite.yes ?? 0;
  const replies = invite.replies ?? 0;
  const waiting = Math.max(0, replies - yes);
  if (!replies) return "No replies yet";
  return `${replies} replied · ${yes} attending · ${waiting} still waiting`;
}

export function LoggedInHome({ onToast }: { onToast: (message: string) => void }) {
  const { host } = useSession();
  const { invites } = useLibrary();
  const { favs, toggle } = useFavs();
  const [catalog, setCatalog] = useState<Template[]>([]);
  const first = host?.name?.trim().split(/\s+/)[0];
  const live = invites.find((invite) => invite.status !== "draft");
  const trending = TRENDING.map((id) => catalog.find((template) => template.id === id)).filter((template): template is Template => Boolean(template));
  const cards = trending.length ? trending : catalog.slice(0, 4);

  useEffect(() => {
    listTemplates().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  return (
    <>
      <section className="li-hero">
        <div className="li-hero-copy">
          <h1 className="li-h1">Ready to <em>celebrate</em>{first ? `, ${first}` : ""}?</h1>
          <p>Every celebration starts with the perfect invite. Pick a design, add your details and share it on WhatsApp in minutes.</p>
          <div className="li-row">
            <Link className="li-btn primary" to="/templates">Browse templates</Link>
            <Link className="li-btn ghost" to="/events">My events</Link>
          </div>
        </div>
        <div className="li-art" aria-hidden="true">
          <div className="li-blob" />
          <img className="back" src="/covers/botanica.jpg" alt="" />
          <img className="front" src="/covers/peace.jpg" alt="" />
          {SPARKLES.map((spark) => (
            <span key={spark.left} className="li-spark" style={{ left: spark.left, top: spark.top, fontSize: spark.size, animationDelay: spark.delay }}>♥</span>
          ))}
        </div>
      </section>

      {live ? (
        <section className="li-strip">
          <img src={live.cover || `/covers/${live.templateId}.jpg`} alt="" />
          <div>
            <span className="li-kicker">YOUR EVENT IS LIVE</span>
            <strong>{live.names} · {formatShortDate(live.date)}</strong>
            <span className="li-muted">{replyLine(live)}</span>
          </div>
          <Link className="li-btn dark" to={`/create/${live.templateId}?invite=${live.id}`}>Manage</Link>
        </section>
      ) : null}

      <section className="li-ways">
        <h2 className="li-h2">Create your invitation, <em>your way</em></h2>
        <div className="li-way-row">
          <Link className="li-way hero" to="/templates">
            <span className="li-way-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
              </svg>
            </span>
            <span>
              <strong>Pick a template</strong>
              <small>Hundreds of designs for every occasion, ready to personalise.</small>
            </span>
          </Link>
          <Link className="li-way plain" to="/create">
            <span className="li-way-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D81B60" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span>
              <strong>Start from scratch</strong>
              <small>A blank canvas with your names, dates and venue.</small>
            </span>
          </Link>
        </div>
      </section>

      <section className="li-trend">
        <h2 className="li-h2 center">Explore what’s <em>trending</em></h2>
        <div className="li-trend-grid">
          {cards.map((template) => {
            const liked = favs.includes(template.id);
            return (
              <article className="li-card" key={template.id}>
                <div className="li-shot">
                  <Link to={`/template/${template.id}`}>
                    <img src={`/covers/${template.id}.jpg`} alt={`${template.name} template`} />
                  </Link>
                  <button
                    type="button"
                    className={liked ? "li-heart on" : "li-heart"}
                    aria-pressed={liked}
                    aria-label={liked ? `Remove ${template.name} from favorites` : `Save ${template.name}`}
                    onClick={() => {
                      const now = toggle(template.id);
                      onToast(now ? `${template.name} saved to My favorites.` : `${template.name} removed from favorites.`);
                    }}
                  >
                    ♥
                  </button>
                </div>
                <div className="li-card-meta">
                  <strong>{template.name}</strong>
                  <span>{formatPrice(template)}</span>
                </div>
              </article>
            );
          })}
        </div>
        <Link className="li-btn ghost li-center" to="/templates">See all templates</Link>
      </section>
    </>
  );
}

const SETTINGS_KEY = "invitesready.settings.v1";
const TOGGLES = [
  ["Email me when a guest replies", "One email per reply"],
  ["Daily WhatsApp summary", "A short recap every evening"],
  ["Product news & offers", "New templates and discounts"],
] as const;

function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as { phone?: string; toggles?: boolean[]; lang?: string }) : {};
    return {
      phone: parsed.phone ?? "",
      toggles: Array.isArray(parsed.toggles) && parsed.toggles.length === 3 ? parsed.toggles : [true, true, false],
      lang: parsed.lang ?? "en",
    };
  } catch {
    return { phone: "", toggles: [true, true, false], lang: "en" };
  }
}

function editedLabel(iso: string) {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "Saved draft";
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 0) return "Edited today";
  if (days === 1) return "Edited yesterday";
  if (days < 7) return `Edited ${days} days ago`;
  if (days < 14) return "Edited last week";
  return `Edited ${formatShortDate(iso.slice(0, 10))}`;
}

function eventMeta(invite: SavedInvite) {
  const event = invite.event ? getEvent(invite.event)?.label : "";
  return [event, formatShortDate(invite.date), invite.venue].filter(Boolean).join(" · ");
}

function rsvpLine(invite: SavedInvite) {
  if (invite.status === "draft") return "Not published yet";
  const yes = invite.yes ?? 0;
  const replies = invite.replies ?? 0;
  const waiting = Math.max(0, replies - yes);
  if (!replies) return "No replies yet";
  return `${yes} attending · ${waiting} waiting`;
}

export function AccountHub({
  view,
  onToast,
}: {
  view: "events" | "drafts" | "favorites" | "purchases" | "settings";
  onToast: (message: string) => void;
}) {
  const { host } = useSession();
  const { invites, ready, owned } = useLibrary();
  const { favs, toggle } = useFavs();
  const [catalog, setCatalog] = useState<Template[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [phone, setPhone] = useState(() => readSettings().phone);
  const [toggles, setToggles] = useState(() => readSettings().toggles);
  const [lang, setLang] = useState(() => readSettings().lang);
  const titles = {
    events: ["My events", "Your invitations and their replies"],
    drafts: ["Saved drafts", "Pick up right where you left off"],
    favorites: ["My favorites", "Templates you’ve saved for later"],
    purchases: ["Purchases", "Your receipts and invoices"],
    settings: ["Settings", "Your profile and notifications"],
  } as const;
  const drafts = invites.filter((invite) => invite.status === "draft");
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
    const url = `${window.location.origin}/i/${invite.code}`;
    try {
      await navigator.clipboard.writeText(url);
      onToast("Invite link copied.");
    } catch {
      onToast(url);
    }
  }

  return (
    <>
      <div>
        <h1 className="li-title">{titles[view][0]}</h1>
        <span className="li-sub">{titles[view][1]}</span>
      </div>
      <AccountTabs />

      {view === "events" ? (
        <div className="li-events">
          {ready
            ? invites.map((invite) => {
                const draft = invite.status === "draft";
                return (
                  <article className="li-event" key={invite.id}>
                    <img src={invite.cover || `/covers/${invite.templateId}.jpg`} alt="" />
                    <div>
                      <span className={draft ? "li-pill draft" : "li-pill live"}>{draft ? "Draft" : "Live"}</span>
                      <strong>{invite.names || "Untitled event"}</strong>
                      <span className="li-muted">{eventMeta(invite)}</span>
                      <span>{rsvpLine(invite)}</span>
                      <div className="li-actions-row">
                        <Link className="li-btn-sm primary" to={`/create/${invite.templateId}?invite=${invite.id}`}>
                          {draft ? "Continue editing" : "Manage"}
                        </Link>
                        {draft ? (
                          <Link className="li-btn-sm ghost" to={`/preview/${invite.templateId}`}>Preview</Link>
                        ) : (
                          <button type="button" className="li-btn-sm ghost" onClick={() => void share(invite)}>Share</button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            : null}
          <Link className="li-new" to="/templates">
            <b>+</b>
            <strong>Create a new event</strong>
            <span className="li-muted">Start from any template</span>
          </Link>
        </div>
      ) : null}

      {view === "drafts" ? (
        drafts.length && ready ? (
          <div className="li-tiles">
            {drafts.map((invite) => (
              <article className="li-tile" key={invite.id}>
                <div className="li-shot">
                  <img src={invite.cover || `/covers/${invite.templateId}.jpg`} alt="" />
                </div>
                <strong>{invite.names || "Untitled draft"}</strong>
                <span className="li-muted">{editedLabel(invite.createdAt)}</span>
                <Link className="li-btn-sm primary" to={`/create/${invite.templateId}?invite=${invite.id}`}>Continue</Link>
              </article>
            ))}
          </div>
        ) : ready ? (
          <div className="li-empty">
            <strong>No saved drafts</strong>
            <p>Designs you start and keep unpublished are saved here.</p>
            <Link className="li-btn-sm primary" to="/templates">Browse templates</Link>
          </div>
        ) : null
      ) : null}

      {view === "favorites" ? (
        !catalogReady ? null : favoriteTemplates.length ? (
          <div className="li-tiles">
            {favoriteTemplates.map((template) => {
              const event = template.events[0] ?? "marriage";
              const destination = template.free || owned.includes(template.id) ? `/create/${template.id}?event=${event}` : `/template/${template.id}`;
              return (
                <article className="li-tile" key={template.id}>
                  <div className="li-shot">
                    <img src={`/covers/${template.id}.jpg`} alt="" />
                    <button
                      type="button"
                      className="li-heart on"
                      aria-label={`Remove ${template.name} from favorites`}
                      onClick={() => {
                        toggle(template.id);
                        onToast(`${template.name} removed from favorites.`);
                      }}
                    >
                      ♥
                    </button>
                  </div>
                  <div className="li-tile-meta">
                    <strong>{template.name}</strong>
                    <span>{formatPrice(template)}</span>
                  </div>
                  <Link className="li-btn-sm primary" to={destination}>Use this design</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="li-empty">
            <strong>No favorites yet</strong>
            <p>Tap the ♥ on any template to save it here.</p>
            <Link className="li-btn-sm primary" to="/studio">Explore trending</Link>
          </div>
        )
      ) : null}

      {view === "purchases" ? (
        !catalogReady ? null : purchased.length ? (
          <>
            <div className="li-purchases">
              {purchased.map((template) => {
                const event = template.events[0] ?? "marriage";
                return (
                  <div className="li-purchase" key={template.id}>
                    <div>
                      <strong>{template.name}</strong>
                      <small>{getEvent(event)?.label ?? "Invitation"} · Premium invite</small>
                    </div>
                    <span className="amt">{formatPrice(template)}</span>
                    <span className="li-pill paid">Paid</span>
                    <Link className="li-btn-sm ghost" to={`/create/${template.id}?event=${event}`}>Use this design</Link>
                  </div>
                );
              })}
            </div>
            <p className="li-help">
              Need help with a payment? <a href="mailto:hello@invitesready.com">Contact support</a>
            </p>
          </>
        ) : (
          <div className="li-empty">
            <strong>No purchases yet</strong>
            <p>Templates you buy show up here, ready to use again.</p>
            <Link className="li-btn-sm primary" to="/templates">Browse templates</Link>
          </div>
        )
      ) : null}

      {view === "settings" ? (
        <>
          <div className="li-settings">
            <div className="li-panel">
              <h2>Profile</h2>
              <label className="li-field">
                <span>Full name</span>
                <input value={host?.name ?? ""} readOnly />
              </label>
              <label className="li-field">
                <span>Email</span>
                <input type="email" value={host?.email ?? ""} readOnly />
              </label>
              <label className="li-field">
                <span>WhatsApp number</span>
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91" />
              </label>
            </div>
            <div className="li-panel">
              <h2>Notifications</h2>
              {TOGGLES.map(([label, sub], index) => {
                const on = toggles[index];
                return (
                  <button
                    key={label}
                    type="button"
                    className="li-switch"
                    role="switch"
                    aria-checked={on}
                    onClick={() => setToggles((current) => current.map((value, item) => (item === index ? !value : value)))}
                  >
                    <span>
                      <strong>{label}</strong>
                      <small>{sub}</small>
                    </span>
                    <span className={on ? "li-track on" : "li-track"}><i /></span>
                  </button>
                );
              })}
              <label className="li-field">
                <span>Language</span>
                <select value={lang} onChange={(event) => setLang(event.target.value)}>
                  <option value="en">English</option>
                  <option value="ml">Malayalam</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                </select>
              </label>
            </div>
          </div>
          <div className="li-save">
            <button
              type="button"
              className="li-btn primary"
              onClick={() => {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify({ phone, toggles, lang }));
                onToast("Settings saved.");
              }}
            >
              Save changes
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
