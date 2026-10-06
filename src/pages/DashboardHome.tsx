import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../api";
import { SkeletonGrid } from "../components/CardSkeleton";
import { getEvent } from "../data/events";
import { getTemplate } from "../data/templates";
import { formatShortDate, formatTime } from "../lib/dates";
import { guestInviteUrl, whatsAppShareHref } from "../lib/share";
import { trackShareWhatsApp } from "../lib/analytics";
import type { SavedInvite } from "../types";
import { useFonts } from "../lib/fonts";

export type DashGreeting = { id: string; name: string; note: string; attending: boolean; at: string };
type GuestFilter = "all" | "attending" | "declined";
type Section = "guests" | "schedule" | "activity";

const AVATARS = ["#D81B60", "#F23F78", "#2E8B57", "#FF7380", "#8E1550"];
const THUMBS: Record<string, { bg: string; fg: string }> = {
  beach: { bg: "#F7B38A", fg: "#1E3A44" },
  botanica: { bg: "#F3E3D6", fg: "#3A2E2A" },
  heavenly: { bg: "#1E120A", fg: "#F3D9A0" },
  grandoor: { bg: "#120608", fg: "#F3DDA8" },
  grandenvelope: { bg: "#1A0C0A", fg: "#F3DDA8" },
  pull: { bg: "#4A0716", fg: "#F3DDA8" },
  inland: { bg: "#CFE2F2", fg: "#C8342B" },
  shaadi: { bg: "#4A0D1F", fg: "#F5D77A" },
  hearth: { bg: "#DDEFE8", fg: "#2E2A25" },
  home: { bg: "#DDEFE8", fg: "#2E2A25" },
  gazal: { bg: "#12352B", fg: "#FFFFFF" },
  vivah: { bg: "#FAF7F2", fg: "#4A263E" },
  thiruvizha: { bg: "#FAF7F2", fg: "#4A263E" },
  peace: { bg: "#F6E4E8", fg: "#4A263E" },
  aurelia: { bg: "#F3ECF1", fg: "#4A263E" },
  anna: { bg: "#F6F0E6", fg: "#A44B32" },
  baptism: { bg: "#E7F0F4", fg: "#1E3A44" },
};

export function initialsOf(name: string) {
  return name
    .replace(/^The /, "")
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function daysUntil(iso: string) {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

function daysLabel(iso: string) {
  const days = daysUntil(iso);
  if (days === null) return "";
  if (days > 1) return `${days} days to go`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return "Completed";
}

function greetingHour() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ago(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return formatShortDate(iso.slice(0, 10));
}

function publicUrl(code: string, campaign?: string) {
  return guestInviteUrl(code, campaign);
}

function publicPath(code: string, campaign?: string) {
  return guestInviteUrl(code, campaign).replace(/^https?:\/\//, "");
}

function scheduleOf(invite: SavedInvite) {
  const event = invite.event ? getEvent(invite.event) : undefined;
  const items: { name: string; when: string; venue: string }[] = [];
  if (invite.date || invite.time || invite.venue) {
    items.push({
      name: event?.label || "Celebration",
      when: [formatShortDate(invite.date), formatTime(invite.time ?? "")].filter(Boolean).join(" · "),
      venue: invite.venue || "Venue to be shared",
    });
  }
  if (invite.receptionTime || invite.receptionVenue) {
    items.push({
      name: "Reception",
      when: [formatShortDate(invite.date), formatTime(invite.receptionTime ?? "")].filter(Boolean).join(" · "),
      venue: invite.receptionVenue || "Venue to be shared",
    });
  }
  return items;
}

export function EventSwitcher({
  invites,
  selectedId,
  open,
  query,
  onQuery,
  onToggle,
  onPick,
  variant,
}: {
  invites: SavedInvite[];
  selectedId: string;
  open: boolean;
  query: string;
  onQuery: (value: string) => void;
  onToggle: () => void;
  onPick: (id: string) => void;
  variant: "side" | "bar";
}) {
  const selected = invites.find((invite) => invite.id === selectedId) ?? invites[0];
  const q = query.trim().toLowerCase();
  const matched = invites.filter((invite) => !q || invite.names.toLowerCase().includes(q));
  const groups = [
    { label: "Upcoming", items: matched.filter((invite) => (daysUntil(invite.date) ?? 0) >= 0).sort((a, b) => a.date.localeCompare(b.date)) },
    { label: "Past", items: matched.filter((invite) => (daysUntil(invite.date) ?? 0) < 0).sort((a, b) => b.date.localeCompare(a.date)) },
  ].filter((group) => group.items.length);

  if (!selected) return null;
  const finished = (daysUntil(selected.date) ?? 0) < 0;

  return (
    <div className={variant === "side" ? "dv-switch" : "dv-bar-switch"}>
      {variant === "side" ? <span className="dv-kicker">Current event</span> : null}
      <button
        type="button"
        className={variant === "side" ? "dv-switch-btn" : "dv-bar-btn"}
        aria-expanded={open}
        aria-haspopup={variant === "side" ? "listbox" : "dialog"}
        onClick={onToggle}
      >
        <span className="dv-av" style={{ background: AVATARS[Math.max(0, invites.indexOf(selected)) % AVATARS.length] }}>
          {initialsOf(selected.names) || "•"}
        </span>
        <span className="dv-switch-copy">
          <span className="dv-switch-name">
            {selected.names}
            {variant === "bar" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 10l5 5 5-5" />
              </svg>
            ) : null}
          </span>
          <span className="dv-switch-meta">{variant === "bar" ? "Switch event" : finished ? "Completed" : formatShortDate(selected.date)}</span>
        </span>
        {variant === "side" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D9C6D1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 10l5 5 5-5" />
          </svg>
        ) : null}
      </button>
      {open && variant === "side" ? (
        <div className="dv-switch-pop" role="listbox" aria-label="Your events">
          <SwitcherList query={query} onQuery={onQuery} groups={groups} selectedId={selected.id} onPick={onPick} />
        </div>
      ) : null}
      {open && variant === "bar" ? (
        <div className="dv-sheet" onClick={onToggle}>
          <div className="dv-sheet-card" role="dialog" aria-label="Your events" onClick={(event) => event.stopPropagation()}>
            <div className="dv-sheet-head">
              <span>Your events</span>
              <button type="button" onClick={onToggle}>
                Done
              </button>
            </div>
            <SwitcherList query={query} onQuery={onQuery} groups={groups} selectedId={selected.id} onPick={onPick} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SwitcherList({
  query,
  onQuery,
  groups,
  selectedId,
  onPick,
}: {
  query: string;
  onQuery: (value: string) => void;
  groups: { label: string; items: SavedInvite[] }[];
  selectedId: string;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <input type="search" aria-label="Search events" placeholder="Search events" value={query} onChange={(input) => onQuery(input.target.value)} />
      {groups.map((group) => (
        <div key={group.label} className="dv-group">
          <span>{group.label}</span>
          {group.items.map((invite) => {
            const on = invite.id === selectedId;
            const kind = invite.event ? getEvent(invite.event)?.label : "Event";
            return (
              <button key={invite.id} type="button" role="option" aria-selected={on} className={on ? "on" : ""} onClick={() => onPick(invite.id)}>
                <span className="dv-av sm" style={{ background: AVATARS[Math.abs(invite.names.length) % AVATARS.length] }}>
                  {initialsOf(invite.names) || "•"}
                </span>
                <span>
                  <b>{invite.names}</b>
                  <small>
                    {formatShortDate(invite.date)} · {kind}
                  </small>
                </span>
                {on ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D81B60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l4 4L19 7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}
      {groups.length === 0 ? <p className="dv-none">No events match.</p> : null}
      <Link to="/templates">+ New event</Link>
    </>
  );
}

export function DashboardHome({
  signedIn,
  ready,
  hostName,
  invite,
  replies,
  onToast,
}: {
  signedIn: boolean;
  ready: boolean;
  hostName: string;
  invite?: SavedInvite;
  replies: DashGreeting[];
  onToast: (message: string) => void;
}) {
  useFonts("Allura");
  const [filter, setFilter] = useState<GuestFilter>("all");
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<Section>("guests");
  const first = hostName.trim().split(" ")[0];

  useEffect(() => {
    setFilter("all");
    setQuery("");
    setSection("guests");
  }, [invite?.id]);

  const attending = replies.filter((reply) => reply.attending).length;
  const declined = replies.length - attending;
  const notes = replies.filter((reply) => reply.note.trim()).length;
  const percent = replies.length ? Math.round((attending / replies.length) * 100) : 0;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return replies.filter((reply) => {
      const statusOk = filter === "all" || (filter === "attending" ? reply.attending : !reply.attending);
      const textOk = !q || reply.name.toLowerCase().includes(q) || reply.note.toLowerCase().includes(q);
      return statusOk && textOk;
    });
  }, [replies, filter, query]);

  if (!signedIn) {
    return (
      <section className="dv-empty-card">
        <h2>Log in to open your dashboard.</h2>
        <Link to="/login">Log in</Link>
      </section>
    );
  }
  if (!ready) return <SkeletonGrid count={4} />;
  if (!invite) {
    return (
      <section className="dv-empty-card">
        <h2>Nothing published yet.</h2>
        <p>Create an invitation and the guest replies will show up here.</p>
        <Link to="/templates">Create invite</Link>
      </section>
    );
  }

  const template = getTemplate(invite.templateId);
  const tone = THUMBS[invite.templateId] ?? { bg: "#F3ECF1", fg: "#4A263E" };
  const light = tone.fg !== "#FFFFFF" && tone.fg !== "#F5D77A";
  const finished = (daysUntil(invite.date) ?? 0) < 0;
  const cover = invite.cover ? assetUrl(invite.cover) : "";
  const url = publicUrl(invite.code, invite.templateId);
  const path = publicPath(invite.code, invite.templateId);
  const functions = scheduleOf(invite);
  const activity = [...replies].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 4);
  const tabs: { id: GuestFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: replies.length },
    { id: "attending", label: "Attending", count: attending },
    { id: "declined", label: "Declined", count: declined },
  ];
  const draftMode = invite.status === "draft";
  const editTo = `/create/${invite.templateId}?invite=${invite.id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      onToast(`Link copied: ${path}`);
    } catch {
      onToast(url);
    }
  }

  function shareWhatsApp() {
    trackShareWhatsApp(template?.name);
    window.open(whatsAppShareHref(url), "_blank", "noopener");
    onToast("Opening WhatsApp with your invitation…");
  }

  async function downloadQr() {
    const image = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&format=png&data=${encodeURIComponent(url)}`;
    try {
      const response = await fetch(image);
      if (!response.ok) throw new Error("qr");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${invite?.code || "invitation"}-qr.png`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(image, "_blank", "noopener");
    }
    onToast("QR code downloaded.");
  }

  return (
    <div className="dv-home">
      <header className="dv-head">
        <div>
          <p className="dv-hello">{first ? `${greetingHour()}, ${first}` : greetingHour()}</p>
          <h1>{invite.names}</h1>
        </div>
        <div className="dv-head-actions">
          {draftMode ? null : <Link to={`/i/${invite.code}`}>View invite</Link>}
          <Link to={editTo}>Edit</Link>
          <Link className="go" to="/templates">
            + Create invite
          </Link>
        </div>
      </header>

      <section className="dv-hero">
        {cover ? (
          <img className="dv-thumb" src={cover} alt="" />
        ) : (
          <div className="dv-thumb script" style={{ background: tone.bg, color: tone.fg, border: light ? "1px solid #E8DFD6" : "none" }}>
            <span>{(invite.event ? getEvent(invite.event).label : "Invitation").toUpperCase()}</span>
            <b>{invite.names}</b>
          </div>
        )}
        <div className="dv-hero-copy">
          <div className="dv-hero-line">
            <span className={draftMode ? "dv-status draft" : finished ? "dv-status done" : "dv-status"}>{draftMode ? "Draft" : finished ? "Completed" : "Live"}</span>
            <span className="dv-template">{template?.name || "Invitation"} template</span>
            <strong className="dv-mobile-name">{invite.names}</strong>
          </div>
          <div className="dv-meta">
            <strong>{formatShortDate(invite.date)}</strong>
            {invite.venue ? <span>{invite.venue}</span> : null}
            {daysLabel(invite.date) ? <b>{daysLabel(invite.date)}</b> : null}
          </div>
          {draftMode ? (
            <div className="dv-link">
              <span>Draft · publish once to share it</span>
            </div>
          ) : (
            <div className="dv-link">
              <span>{path}</span>
              <button type="button" onClick={() => void copyLink()}>
                Copy
              </button>
            </div>
          )}
        </div>
        {draftMode ? (
          <div className="dv-hero-actions">
            <Link className="view" to={editTo}>
              Edit invitation
            </Link>
          </div>
        ) : (
        <div className="dv-hero-actions">
          <button type="button" className="wa" onClick={shareWhatsApp}>
            <img src="/whatsapp.png" alt="" width={18} height={18} />
            <span className="wide">Share on WhatsApp</span>
            <span className="short">WhatsApp</span>
          </button>
          <button type="button" className="qr" onClick={() => void downloadQr()}>
            Download QR
          </button>
          <Link className="view" to={`/i/${invite.code}`}>
            View invite
          </Link>
        </div>
        )}
      </section>

      {replies.length > 0 ? (
        <section className="dv-stats">
          <div className="dv-ring">
            <div>
              <svg width="76" height="76" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#D81B60"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * percent) / 100}
                />
              </svg>
              <b>{percent}%</b>
            </div>
            <div>
              <span>Attending</span>
              <strong>
                {attending} <em>of {replies.length}</em>
              </strong>
            </div>
          </div>
          <div className="dv-stat-row">
            <article>
              <span>
                <i style={{ background: "#6F8B74" }} />
                Attending
              </span>
              <strong>{attending}</strong>
              <small>{attending === 1 ? "1 reply" : `${attending} replies`}</small>
            </article>
            <article>
              <span>
                <i style={{ background: "#D81B60" }} />
                Notes
              </span>
              <strong>{notes}</strong>
              <small>left a message</small>
            </article>
            <article>
              <span>
                <i style={{ background: "#C45B63" }} />
                Declined
              </span>
              <strong>{declined}</strong>
              <small>sent regrets</small>
            </article>
          </div>
        </section>
      ) : (
        <section className="dv-share">
          <div>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D81B60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </div>
          <div>
            <strong>No replies yet</strong>
            <p>Share your invitation link and RSVPs will appear here the moment guests reply.</p>
          </div>
          <button type="button" onClick={shareWhatsApp}>
            Share invitation
          </button>
        </section>
      )}

      <div className="dv-secs" role="tablist" aria-label="Sections">
        {(
          [
            ["guests", "Guests"],
            ["schedule", "Schedule"],
            ["activity", "Activity"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={section === id} className={section === id ? "on" : ""} onClick={() => setSection(id)}>
            {label}
          </button>
        ))}
      </div>

      <section className="dv-grid">
        <div className={section === "guests" ? "dv-panel dv-guests" : "dv-panel dv-guests dv-desk"}>
          <div className="dv-guests-head">
            <h2>Guests</h2>
            <label className="dv-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9396" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <span>Search guests</span>
              <input type="search" placeholder="Search guests" value={query} onChange={(input) => setQuery(input.target.value)} />
            </label>
          </div>
          <div className="dv-tabs" role="tablist" aria-label="Filter guests">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" role="tab" aria-selected={filter === tab.id} className={filter === tab.id ? "on" : ""} onClick={() => setFilter(tab.id)}>
                {tab.label} <span>{tab.count}</span>
              </button>
            ))}
          </div>
          {rows.length > 0 ? (
            <div className="dv-table">
              <div className="dv-thead">
                <span>Guest</span>
                <span>Note</span>
                <span>Status</span>
              </div>
              {rows.map((guest, index) => (
                <div className="dv-row" key={guest.id}>
                  <span className="dv-guest">
                    <span className="dv-av round" style={{ background: AVATARS[index % AVATARS.length] }}>
                      {initialsOf(guest.name)}
                    </span>
                    <span>
                      <b>{guest.name}</b>
                      <small>{ago(guest.at)}</small>
                    </span>
                  </span>
                  <span className="dv-note">{guest.note.trim() || "—"}</span>
                  <span className={guest.attending ? "dv-pill yes" : "dv-pill no"}>{guest.attending ? "Attending" : "Declined"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dv-blank">
              <strong>{replies.length ? "No guests match" : "No guests yet"}</strong>
              <span>{replies.length ? "Try a different name or filter." : "Guests appear here as soon as they RSVP on your invitation."}</span>
            </div>
          )}
        </div>

        <div className="dv-side-col">
          <div className={section === "schedule" ? "dv-panel" : "dv-panel dv-desk"}>
            <h2>Schedule</h2>
            {functions.length === 0 ? <p className="dv-muted">Add a date and venue on the invitation.</p> : null}
            <div className="dv-fns">
              {functions.map((item, index) => (
                <div className="dv-fn" key={item.name}>
                  <div>
                    <i />
                    {index < functions.length - 1 ? <span /> : null}
                  </div>
                  <div>
                    <b>{item.name}</b>
                    <small>
                      {item.when}
                      {item.venue ? ` · ${item.venue}` : ""}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <Link className="dv-edit" to={editTo}>
              Edit functions
            </Link>
          </div>
          <div className={section === "activity" ? "dv-panel dv-grow" : "dv-panel dv-grow dv-desk"}>
            <h2>Recent activity</h2>
            {activity.length === 0 ? <p className="dv-muted">Replies and notes from guests will show up here.</p> : null}
            {activity.map((item) => {
              const noted = Boolean(item.note.trim());
              return (
                <div className="dv-act" key={item.id}>
                  <i style={{ background: noted ? "#D81B60" : item.attending ? "#2E8B57" : "#C8392B" }} />
                  <div>
                    <p>
                      <strong>{item.name}</strong> {noted ? `left a note: “${item.note.trim()}”` : item.attending ? "is attending" : "can't make it"}
                    </p>
                    <small>{ago(item.at)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
