import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listGreetings, listTemplates, signOut } from "../api";
import { DashboardHome, EventSwitcher } from "./DashboardHome";
import { useSession } from "../session";
import { getEvent } from "../data/events";
import { formatPrice } from "../data/templates";
import { formatShortDate } from "../lib/dates";
import { useLibrary } from "../state";
import { AccountMenu } from "../components/AccountMenu";
import { SkeletonGrid } from "../components/CardSkeleton";
import { Spinner } from "../components/Loader";
import { Brand } from "../components/Brand";
import { Breadcrumbs } from "../components/Breadcrumbs";
import type { SavedInvite, Template } from "../types";
import "./studio.css";

type Greeting = { id: string; name: string; note: string; attending: boolean; at: string };
type GuestRow = Greeting & { inviteId: string; eventName: string };
type Filter = "All" | "Attending" | "Declined";

const NAV = [
  { label: "Dashboard", href: "/studio", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { label: "My events", href: "/events", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { label: "Guests", href: "/guests", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c1-4 4-6 7-6s6 2 7 6M17 11a3 3 0 1 0 0-6M22 21c-.5-3-2-5-4-5.5" },
  { label: "Purchases", href: "/purchases", icon: "M6 7h12l-1.2 13H7.2zM9 7V6a3 3 0 0 1 6 0v1" },
  { label: "Templates", href: "/templates", icon: "M4 4h16v16H4zM4 9h16M9 9v11" },
];

const AVATARS = ["#D81B60", "#F23F78", "#2E8B57", "#8E1550", "#FF7380"];

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

export function Studio({ view = "dashboard" }: { view?: "dashboard" | "events" | "guests" | "purchases" }) {
  const { pathname } = useLocation();
  const { invites, ready, owned } = useLibrary();
  const { signedIn, host } = useSession();
  const hostName = host?.name ?? "";
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [replies, setReplies] = useState<Greeting[]>([]);
  const [roster, setRoster] = useState<GuestRow[]>([]);
  const [rosterReady, setRosterReady] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");
  const [catalog, setCatalog] = useState<Template[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [evQuery, setEvQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (!switchOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSwitchOpen(false);
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if ([...document.querySelectorAll(".dv-switch, .dv-bar-switch, .dv-sheet")].some((node) => node.contains(target))) return;
      setSwitchOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [switchOpen]);

  useEffect(() => {
    if (view !== "purchases") return;
    listTemplates()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setCatalogReady(true));
  }, [view]);

  const selected = invites.find((invite) => invite.id === selectedId) ?? invites[0];

  useEffect(() => {
    if (view === "guests" || !selected?.code) {
      setReplies([]);
      return;
    }
    listGreetings(selected.code)
      .then(setReplies)
      .catch(() => setReplies([]));
  }, [view, selected?.code]);

  useEffect(() => {
    if (view !== "guests" || !signedIn || !ready) return;
    let cancel = false;
    setRosterReady(false);
    Promise.all(
      invites.map(async (invite) => {
        const rows = await listGreetings(invite.code).catch(() => [] as Greeting[]);
        return rows.map((row) => ({ ...row, inviteId: invite.id, eventName: invite.names }));
      }),
    ).then((groups) => {
      if (cancel) return;
      setRoster(groups.flat().sort((a, b) => (a.at < b.at ? 1 : -1)));
      setRosterReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [view, signedIn, ready, invites]);

  const rosterRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster.filter((reply) => {
      const eventOk = eventFilter === "all" || reply.inviteId === eventFilter;
      const statusOk = filter === "All" || (filter === "Attending" ? reply.attending : !reply.attending);
      const textOk = !q || reply.name.toLowerCase().includes(q) || reply.note.toLowerCase().includes(q) || reply.eventName.toLowerCase().includes(q);
      return eventOk && statusOk && textOk;
    });
  }, [roster, eventFilter, filter, query]);

  const first = hostName.trim().split(" ")[0];

  async function share(invite: SavedInvite) {
    const url = `${window.location.origin}/i/${invite.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Invite link copied.");
    } catch {
      setToast(url);
    }
  }

  const purchased = owned
    .map((id) => catalog.find((template) => template.id === id))
    .filter((template): template is Template => Boolean(template));
  const pageTitle = view === "purchases" ? "Purchases" : view === "events" ? "My events" : view === "guests" ? "Guests" : signedIn && first ? `${greetingHour()}, ${first}` : "Your invitations";
  const pageLede = view === "purchases" ? "Templates you've bought, ready to use again." : view === "events" ? "The invitations on your account." : view === "guests" ? "Replies from every invitation." : signedIn ? "Here's how your celebrations are coming along." : "Log in to see the invitations on your account.";

  function pickEvent(id: string) {
    setSelectedId(id);
    setFilter("All");
    setQuery("");
    setSwitchOpen(false);
    setEvQuery("");
  }

  return (
    <div className={view === "dashboard" ? "board dv-board" : "board"}>
      <aside className="side">
        <Brand light />
        {view === "dashboard" && signedIn && invites.length > 0 ? (
          <EventSwitcher
            variant="side"
            invites={invites}
            selectedId={selected?.id ?? ""}
            open={switchOpen}
            query={evQuery}
            onQuery={setEvQuery}
            onToggle={() => setSwitchOpen((value) => !value)}
            onPick={pickEvent}
          />
        ) : null}
        <nav aria-label="Main">
          {NAV.map((item) => {
            const current = pathname === item.href;
            return (
              <Link key={item.label} className={current ? "nav-item on" : "nav-item"} to={item.href} aria-current={current ? "page" : undefined}>
                <Icon d={item.icon} color={current ? "#2A1527" : "#F3BBCF"} />
                <span>{item.label}</span>
                {item.label === "Guests" && view === "dashboard" && replies.length > 0 ? <span className="badge">{replies.length}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="account">
            <AccountMenu name={hostName} signedIn={signedIn}>{initialsOf(hostName) || "?"}</AccountMenu>
            <div className="who">
              <strong>{signedIn && hostName ? (view === "dashboard" ? hostName.trim().split(" ")[0] : hostName) : "Log in"}</strong>
              <small>{signedIn ? (view === "dashboard" ? "Account & settings" : "Your account") : "Not signed in"}</small>
            </div>
          </div>
        </div>
      </aside>

      {view === "dashboard" ? (
        <header className="dv-mobile-bar">
          {signedIn && invites.length > 0 ? (
            <EventSwitcher
              variant="bar"
              invites={invites}
              selectedId={selected?.id ?? ""}
              open={switchOpen}
              query={evQuery}
              onQuery={setEvQuery}
              onToggle={() => setSwitchOpen((value) => !value)}
              onPick={pickEvent}
            />
          ) : (
            <Brand />
          )}
          <Link className="dv-plus" to="/templates" aria-label="Create invite">
            +
          </Link>
        </header>
      ) : null}

      <main className="main">
        {view === "dashboard" ? (
          <DashboardHome signedIn={signedIn} ready={ready} hostName={hostName} invite={selected} replies={replies} onToast={setToast} />
        ) : (
          <>
        <Breadcrumbs
          items={[
            { label: "Dashboard", to: "/studio" },
            { label: view === "purchases" ? "Purchases" : view === "events" ? "My events" : "Guests" },
          ]}
        />
        <div className="dash-top">
          <div className="dash-hello">
            <AccountMenu name={hostName} signedIn={signedIn}>{initialsOf(hostName) || "?"}</AccountMenu>
            <div>
              <div className="dash-greet">{signedIn ? greetingHour() : "Your invitations"}</div>
              <div className="dash-name">{view === "purchases" ? "Purchases" : view === "events" ? "My events" : view === "guests" ? "Guests" : signedIn && first ? first : "Log in"}</div>
            </div>
          </div>
        </div>
        <div className="top">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageLede}</p>
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
          </>
        )}

        {view !== "dashboard" && !signedIn ? (
          <section className="panel empty-card">
            <h2>{view === "purchases" ? "Log in to see your purchases." : view === "events" ? "Log in to see your events." : view === "guests" ? "Log in to see your guests." : "Log in to open your dashboard."}</h2>
            <Link className="create" to="/login">
              Log in
            </Link>
          </section>
        ) : null}

        {view !== "dashboard" && signedIn && !ready ? <SkeletonGrid count={4} cover="studio" /> : null}

        {view !== "dashboard" && signedIn && ready && invites.length === 0 && view !== "purchases" ? (
          <section className="panel empty-card">
            <h2>Nothing here yet.</h2>
            <p>{view === "events" ? "Start an invitation and it will show up here, including drafts." : view === "guests" ? "Create an invitation and replies will show up here." : "Create an invitation and the guest replies will show up here."}</p>
            <Link className="create" to="/templates">
              Create invite
            </Link>
          </section>
        ) : null}

        {signedIn && ready && invites.length > 0 && view === "events" ? (
          <div className="my-events">
            {invites.map((invite, index) => {
              const draftMode = invite.status === "draft";
              const finished = !draftMode && (daysUntil(invite.date) ?? 0) < 0;
              const editTo = `/create/${invite.templateId}?invite=${invite.id}`;
              return (
                <article className="my-event" key={invite.id}>
                  <div className="my-event-top">
                    <span className="thumb" style={{ background: AVATARS[index % AVATARS.length] }}>
                      {initialsOf(invite.names) || "•"}
                    </span>
                    <div>
                      <strong>{invite.names}</strong>
                      <small>{[formatShortDate(invite.date), invite.venue].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className={`pill ${draftMode ? "draft" : finished ? "completed" : "live"}`}>{draftMode ? "Draft" : finished ? "Completed" : "Live"}</span>
                  </div>
                  {countdown(invite.date) ? <span className="countdown">{countdown(invite.date)}</span> : null}
                  <div className="head-actions">
                    {draftMode ? null : (
                      <Link className="line" to={`/i/${invite.code}`}>
                        View page
                      </Link>
                    )}
                    <Link className="line" to={editTo}>
                      Edit
                    </Link>
                    {draftMode ? null : (
                      <button type="button" className="whatsapp" onClick={() => share(invite)}>
                        Copy link
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {signedIn && ready && invites.length > 0 && view === "guests" ? (
          <section className="panel guests">
            <div className="guests-head">
              <h3>Guest list</h3>
              <div className="search">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <label htmlFor="guest-search">Search guests</label>
                <input id="guest-search" type="search" placeholder="Search guests" value={query} onChange={(input) => setQuery(input.target.value)} />
              </div>
            </div>
            <div className="guest-events">
              <button type="button" className={eventFilter === "all" ? "filter on" : "filter"} aria-pressed={eventFilter === "all"} onClick={() => setEventFilter("all")}>
                All events <span>{roster.length}</span>
              </button>
              {invites.map((invite) => (
                <button
                  key={invite.id}
                  type="button"
                  className={eventFilter === invite.id ? "filter on" : "filter"}
                  aria-pressed={eventFilter === invite.id}
                  onClick={() => setEventFilter(invite.id)}
                >
                  {invite.names} <span>{roster.filter((row) => row.inviteId === invite.id).length}</span>
                </button>
              ))}
            </div>
            <div className="filters">
              {(["All", "Attending", "Declined"] as Filter[]).map((label) => {
                const scoped = eventFilter === "all" ? roster : roster.filter((row) => row.inviteId === eventFilter);
                const total = label === "All" ? scoped.length : scoped.filter((row) => (label === "Attending" ? row.attending : !row.attending)).length;
                return (
                  <button key={label} type="button" className={filter === label ? "filter on" : "filter"} aria-pressed={filter === label} onClick={() => setFilter(label)}>
                    {label} <span>{total}</span>
                  </button>
                );
              })}
            </div>
            {!rosterReady ? <p className="empty wait-line" aria-busy="true"><Spinner size="md" /> Loading replies…</p> : null}
            {rosterReady ? (
              <div className="guest-table">
                <div className="table-head">
                  <span>Guest</span>
                  <span>Event</span>
                  <span>Note</span>
                  <span>Status</span>
                  <span>When</span>
                </div>
                {rosterRows.map((guest, index) => (
                  <div className="row" key={`${guest.inviteId}-${guest.id}`}>
                    <div className="who">
                      <span className="guest-av" style={{ background: AVATARS[index % AVATARS.length] }}>
                        {initialsOf(guest.name)}
                      </span>
                      <strong>{guest.name}</strong>
                    </div>
                    <span className="muted">{guest.eventName}</span>
                    <span className="muted">{guest.note || "—"}</span>
                    <span className={`pill ${guest.attending ? "attending" : "declined"}`}>{guest.attending ? "Attending" : "Declined"}</span>
                    <span className="muted">{whenLabel(guest.at)}</span>
                  </div>
                ))}
                {rosterRows.length === 0 ? <div className="empty">No replies yet.</div> : null}
              </div>
            ) : null}
            <div className="foot">
              <span>
                Showing {rosterRows.length} of {eventFilter === "all" ? roster.length : roster.filter((row) => row.inviteId === eventFilter).length} replies
              </span>
            </div>
          </section>
        ) : null}


        {signedIn && ready && view === "purchases" ? (
          !catalogReady ? (
            <SkeletonGrid count={4} cover="studio" />
          ) : purchased.length === 0 ? (
            <section className="panel empty-card">
              <h2>No purchases yet.</h2>
              <p>Templates you buy show up here, ready to use again.</p>
              <Link className="create" to="/templates">
                Browse templates
              </Link>
            </section>
          ) : (
            <div className="purchase-grid">
              {purchased.map((template) => {
                const event = template.events[0];
                return (
                  <article className="purchase-card" key={template.id}>
                    <img src={`/covers/${template.id}.jpg`} alt="" />
                    <div>
                      <strong>{template.name}</strong>
                      <small>{[event ? getEvent(event)?.label : "", formatPrice(template)].filter(Boolean).join(" · ")}</small>
                    </div>
                    <span className="pill pending">Purchased</span>
                    <Link className="line" to={`/create/${template.id}?event=${event ?? "marriage"}`}>
                      Use template
                    </Link>
                  </article>
                );
              })}
            </div>
          )
        ) : null}
      </main>

      {view === "dashboard" ? (
        <nav className="dv-tabbar" aria-label="Main">
          <Link to="/studio" aria-current="page">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 11l9-8 9 8v10H3z" />
            </svg>
            Home
          </Link>
          <Link to="/events">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" />
            </svg>
            Events
          </Link>
          <Link to="/guests">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c1-4 4-6 7-6s6 2 7 6" />
            </svg>
            Guests
          </Link>
          <button type="button" className={accountOpen ? "on" : ""} onClick={() => setAccountOpen((value) => !value)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3 22c1-5 5-7 9-7s8 2 9 7" />
            </svg>
            Account
          </button>
        </nav>
      ) : null}
      {accountOpen && view === "dashboard" ? (
        <div className="dv-account">
          <strong>{signedIn && hostName ? hostName : "Not signed in"}</strong>
          {signedIn ? (
            <button
              type="button"
              onClick={() => {
                void signOut().finally(() => window.location.assign("/"));
              }}
            >
              Log out
            </button>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </div>
      ) : null}
      {view === "dashboard" ? null : <nav className="dash-nav" aria-label="Main">
        <Link to="/studio">
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
        <Link to="/guests" aria-current={view === "guests" ? "page" : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6" />
          </svg>
          Guests
        </Link>
        <Link to="/purchases" aria-current={view === "purchases" ? "page" : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 7h12l-1.2 13H7.2zM9 7V6a3 3 0 0 1 6 0v1" />
          </svg>
          Purchases
        </Link>
      </nav>}

      {toast ? (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>
            OK
          </button>
        </div>
      ) : null}
    </div>
  );
}
