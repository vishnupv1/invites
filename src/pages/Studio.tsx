import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getHost, getToken, listGreetings, signOut } from "../api";
import { getEvent } from "../data/events";
import { formatShortDate, formatTime } from "../lib/dates";
import { useLibrary } from "../state";
import type { SavedInvite } from "../types";
import "./studio.css";

type Greeting = { id: string; name: string; note: string; attending: boolean; at: string };
type Filter = "All" | "Attending" | "Declined";

const NAV = [
  { label: "Dashboard", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { label: "My events", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { label: "Guests", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6M17 11a3 3 0 1 0 0-6M19 15c1.8.6 2.8 2.5 3 5" },
  { label: "Templates", icon: "M4 4h16v16H4zM4 9h16M9 9v11", href: "/templates" },
];

const AVATARS = ["#6B3A5B", "#C89B5B", "#6F8B74", "#4A263E", "#8A5A7A"];

function initialsOf(name: string) {
  return name
    .replace(/^The /, "")
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function greetingHour() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function daysUntil(iso: string) {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

function countdown(iso: string) {
  const days = daysUntil(iso);
  if (days === null) return "";
  if (days > 1) return `${days} days to go`;
  if (days === 1) return "Tomorrow";
  if (days === 0) return "Today";
  return "Event finished";
}

function whenLabel(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Icon({ d, color }: { d: string; color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Studio() {
  const { invites, ready } = useLibrary();
  const signedIn = Boolean(getToken());
  const [hostName, setHostName] = useState("");
  const [nav, setNav] = useState("Dashboard");
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [replies, setReplies] = useState<Greeting[]>([]);

  useEffect(() => {
    if (!signedIn) return;
    getHost()
      .then((host) => setHostName(host.name))
      .catch(() => setHostName(""));
  }, [signedIn]);

  const selected = invites.find((invite) => invite.id === selectedId) ?? invites[0];

  useEffect(() => {
    if (!selected?.code) {
      setReplies([]);
      return;
    }
    listGreetings(selected.code)
      .then(setReplies)
      .catch(() => setReplies([]));
  }, [selected?.code]);

  const guests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return replies.filter((reply) => {
      const statusOk = filter === "All" || (filter === "Attending" ? reply.attending : !reply.attending);
      const textOk = !q || reply.name.toLowerCase().includes(q) || reply.note.toLowerCase().includes(q);
      return statusOk && textOk;
    });
  }, [replies, filter, query]);

  const attending = replies.filter((reply) => reply.attending).length;
  const declined = replies.length - attending;
  const wishes = replies.filter((reply) => reply.note.trim()).length;
  const first = hostName.trim().split(" ")[0];

  function count(label: Filter) {
    if (label === "All") return replies.length;
    if (label === "Attending") return attending;
    return declined;
  }

  async function share(invite: SavedInvite) {
    const url = `${window.location.origin}/i/${invite.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Invite link copied.");
    } catch {
      setToast(url);
    }
  }

  return (
    <div className="board">
      <aside className="side">
        <Link className="brand" to="/">
          <svg width="34" height="34" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <rect x="3" y="8" width="28" height="21" rx="4" stroke="#FFFFFF" strokeWidth="2.4" />
            <path d="M4 11l13 9 13-9" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" />
            <circle cx="29" cy="27" r="7.5" fill="#C89B5B" />
            <path d="M25.5 27l2.4 2.4 4.4-4.6" stroke="#4A263E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            Invites<em>Ready</em>
          </span>
        </Link>
        <nav aria-label="Main">
          {NAV.map((item) =>
            item.href ? (
              <Link key={item.label} className="nav-item" to={item.href}>
                <Icon d={item.icon} color="#E3D3DC" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className={nav === item.label ? "nav-item on" : "nav-item"}
                aria-current={nav === item.label ? "page" : undefined}
                onClick={() => {
                  setNav(item.label);
                  document.getElementById(item.label === "Guests" ? "guests" : "events")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Icon d={item.icon} color={nav === item.label ? "#211C1E" : "#E3D3DC"} />
                <span>{item.label}</span>
              </button>
            ),
          )}
        </nav>
        <div className="side-foot">
          <div className="account">
            <div className="avatar">{initialsOf(hostName) || "?"}</div>
            <div className="who">
              <strong>{signedIn && hostName ? hostName : "Log in"}</strong>
              <small>{signedIn ? "Your account" : "Not signed in"}</small>
            </div>
            {signedIn ? (
              <button
                type="button"
                className="logout"
                aria-label="Log out"
                onClick={() => {
                  signOut();
                  window.location.assign("/");
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDB8C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                  <path d="M10 17l-5-5 5-5M5 12h11" />
                </svg>
              </button>
            ) : (
              <Link className="logout" to="/login" aria-label="Log in">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDB8C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                  <path d="M10 17l5-5-5-5M15 12H4" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="dash-top">
          <div className="dash-hello">
            <div className="avatar">{initialsOf(hostName) || "?"}</div>
            <div>
              <div className="dash-greet">{signedIn ? greetingHour() : "Your invitations"}</div>
              <div className="dash-name">{signedIn && first ? first : "Log in"}</div>
            </div>
          </div>
        </div>
        <div className="top">
          <div>
            <h1>{signedIn && first ? `${greetingHour()}, ${first}` : "Your invitations"}</h1>
            <p>{signedIn ? "Here's how your celebrations are coming along." : "Log in to see the invitations on your account."}</p>
          </div>
          <div className="top-actions">
            <Link className="create" to="/templates">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create invite
            </Link>
          </div>
        </div>

        {!signedIn ? (
          <section className="panel empty-card">
            <h2>Log in to open your dashboard.</h2>
            <Link className="create" to="/login">
              Log in
            </Link>
          </section>
        ) : null}

        {signedIn && !ready ? <p className="empty">Loading your invitations…</p> : null}

        {signedIn && ready && invites.length === 0 ? (
          <section className="panel empty-card">
            <h2>Nothing published yet.</h2>
            <p>Create an invitation and the guest replies will show up here.</p>
            <Link className="create" to="/templates">
              Create invite
            </Link>
          </section>
        ) : null}

        {signedIn && selected ? (
          <>
            <div className="dash-chips" id="events">
              {invites.map((invite) => (
                <button
                  key={invite.id}
                  type="button"
                  className={invite.id === selected.id ? "on" : ""}
                  aria-pressed={invite.id === selected.id}
                  onClick={() => {
                    setSelectedId(invite.id);
                    setFilter("All");
                    setQuery("");
                  }}
                >
                  {invite.names}
                </button>
              ))}
            </div>
            <div className="events">
              {invites.map((invite) => {
                const finished = (daysUntil(invite.date) ?? 0) < 0;
                return (
                  <button
                    key={invite.id}
                    type="button"
                    className={invite.id === selected.id ? "event-card on" : "event-card"}
                    aria-pressed={invite.id === selected.id}
                    onClick={() => {
                      setSelectedId(invite.id);
                      setFilter("All");
                      setQuery("");
                    }}
                  >
                    <span className="thumb" style={{ background: AVATARS[invites.indexOf(invite) % AVATARS.length] }}>
                      {initialsOf(invite.names) || "•"}
                    </span>
                    <div>
                      <strong>{invite.names}</strong>
                      <small>{formatShortDate(invite.date)}</small>
                    </div>
                    <span className={`pill ${finished ? "completed" : "live"}`}>{finished ? "Completed" : "Live"}</span>
                  </button>
                );
              })}
            </div>

            <InviteDetail invite={selected} replies={replies} attending={attending} declined={declined} wishes={wishes} onShare={() => share(selected)} />

            <div className="columns">
              <section className="panel guests" id="guests">
                <div className="guests-head">
                  <h3>Guest replies</h3>
                  <div className="search">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                    <label htmlFor="guest-search">Search guests</label>
                    <input id="guest-search" type="search" placeholder="Search guests" value={query} onChange={(input) => setQuery(input.target.value)} />
                  </div>
                </div>
                <div className="filters">
                  {(["All", "Attending", "Declined"] as Filter[]).map((label) => (
                    <button
                      key={label}
                      type="button"
                      className={filter === label ? "filter on" : "filter"}
                      aria-pressed={filter === label}
                      onClick={() => setFilter(label)}
                    >
                      {label} <span>{count(label)}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <div className="table-head">
                    <span>Guest</span>
                    <span>Note</span>
                    <span>Status</span>
                    <span>When</span>
                  </div>
                  {guests.map((guest, index) => (
                    <div className="row" key={guest.id}>
                      <div className="who">
                        <span className="guest-av" style={{ background: AVATARS[index % AVATARS.length] }}>
                          {initialsOf(guest.name)}
                        </span>
                        <strong>{guest.name}</strong>
                      </div>
                      <span className="muted">{guest.note || "—"}</span>
                      <span className={`pill ${guest.attending ? "attending" : "declined"}`}>{guest.attending ? "Attending" : "Declined"}</span>
                      <span className="muted">{whenLabel(guest.at)}</span>
                    </div>
                  ))}
                  {guests.length === 0 ? <div className="empty">No replies yet.</div> : null}
                </div>
                <div className="foot">
                  <span>
                    Showing {guests.length} of {replies.length} replies
                  </span>
                </div>
              </section>

              <div className="rail">
                <section className="panel">
                  <h3>Recent replies</h3>
                  {replies.length === 0 ? <p className="empty">No replies yet.</p> : null}
                  {replies.slice(0, 6).map((reply) => (
                    <div className="activity" key={reply.id}>
                      <i style={{ background: reply.attending ? "#6F8B74" : "#C45B63" }} />
                      <div>
                        <p>
                          {reply.name} {reply.attending ? "is attending" : "declined"}
                          {reply.note ? ` — ${reply.note}` : ""}
                        </p>
                        <small>{whenLabel(reply.at)}</small>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </>
        ) : null}
      </main>

      <nav className="dash-nav" aria-label="Main">
        <Link to="/studio" aria-current="page">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11l9-7 9 7v9H3z" />
            <path d="M9 20v-6h6v6" />
          </svg>
          Home
        </Link>
        <Link to="/templates">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16v16H4zM4 9h16M9 9v11" />
          </svg>
          Templates
        </Link>
        <Link className="dash-plus" to="/templates" aria-label="Create invite">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        <a href="#guests">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6" />
          </svg>
          Guests
        </a>
        {signedIn ? (
          <button
            type="button"
            onClick={() => {
              signOut();
              window.location.assign("/");
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
            Log out
          </button>
        ) : (
          <Link to="/login">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
            Log in
          </Link>
        )}
      </nav>

      {toast ? (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}

function InviteDetail({
  invite,
  replies,
  attending,
  declined,
  wishes,
  onShare,
}: {
  invite: SavedInvite;
  replies: Greeting[];
  attending: number;
  declined: number;
  wishes: number;
  onShare: () => void;
}) {
  const finished = (daysUntil(invite.date) ?? 0) < 0;
  const event = invite.event ? getEvent(invite.event) : undefined;
  const functions = [
    invite.time || invite.venue
      ? { name: event && invite.event ? event.label : "Celebration", when: [formatShortDate(invite.date), formatTime(invite.time ?? "")].filter(Boolean).join(" · "), place: invite.venue }
      : null,
    invite.receptionTime || invite.receptionVenue
      ? { name: "Reception", when: formatTime(invite.receptionTime ?? ""), place: invite.receptionVenue }
      : null,
  ].filter((item): item is { name: string; when: string; place: string | undefined } => Boolean(item));

  return (
    <>
      <section className="event-head">
        <div>
          <div className="title-row">
            <h2>{invite.names}</h2>
            <span className={`pill ${finished ? "completed" : "live"}`}>{finished ? "Completed" : "Live"}</span>
          </div>
          <div className="meta-row">
            <span>{formatShortDate(invite.date)}</span>
            {invite.venue ? <span>{invite.venue}</span> : null}
            {countdown(invite.date) ? <span className="countdown">{countdown(invite.date)}</span> : null}
          </div>
        </div>
        <div className="head-actions">
          <a className="dash-wa" href={`https://wa.me/?text=${encodeURIComponent(`${invite.names} ${window.location.origin}/i/${invite.code}`)}`} target="_blank" rel="noreferrer">
            Share on WhatsApp
          </a>
          <Link className="line" to={`/i/${invite.code}`}>
            View page
          </Link>
          <button type="button" className="whatsapp" onClick={onShare}>
            Copy link
          </button>
        </div>
      </section>

      <div className="stats">
        <article className="stat">
          <em>Replies</em>
          <strong>{replies.length}</strong>
        </article>
        <article className="stat on">
          <em>Attending</em>
          <strong>{attending}</strong>
        </article>
        <article className="stat">
          <em>Declined</em>
          <strong>{declined}</strong>
        </article>
        <article className="stat">
          <em>Notes</em>
          <strong>{wishes}</strong>
        </article>
      </div>

      {functions.length > 0 ? (
        <section className="panel fn-list">
          <h3>On the invitation</h3>
          {functions.map((item) => (
            <div className="fn" key={item.name}>
              <div className="fn-top">
                <strong>{item.name}</strong>
                <span>{item.when}</span>
              </div>
              {item.place ? <small>{item.place}</small> : null}
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
