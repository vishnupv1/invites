import { useEffect, useMemo, useState } from "react";
import { AccountTabs, LoggedInChrome, LoggedInFooter } from "../components/LoggedInChrome";
import { listGreetings } from "../api";
import { AccountHub, LoggedInHome } from "./LoggedInHome";
import { Spinner } from "../components/Loader";
import { Notice, type NoticeTone } from "../components/Notice";
import { useSession } from "../session";
import { useLibrary } from "../state";
import "./studio.css";

type Greeting = { id: string; name: string; note: string; attending: boolean; at: string };
type GuestRow = Greeting & { inviteId: string; eventName: string };
type Filter = "All" | "Attending" | "Declined";
type AccountView = "events" | "drafts" | "favorites" | "purchases" | "settings";

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

function whenLabel(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function Studio({ view = "dashboard" }: { view?: "dashboard" | "guests" | AccountView }) {
  const { invites, ready } = useLibrary();
  const { signedIn } = useSession();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: NoticeTone } | null>(null);
  const [roster, setRoster] = useState<GuestRow[]>([]);
  const [rosterReady, setRosterReady] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  return (
    <div className="board li-board">
      <LoggedInChrome />
      <div className="li-page">
        <main className={view === "dashboard" ? "li-main" : "li-main is-account"}>
          {view === "dashboard" ? <LoggedInHome onToast={(message, tone) => setToast({ message, tone: tone ?? "ok" })} /> : null}
          {view !== "dashboard" && view !== "guests" ? <AccountHub view={view} onToast={(message, tone) => setToast({ message, tone: tone ?? "ok" })} /> : null}
          {view === "guests" ? (
            <div className="li-guests">
              <div>
                <h1 className="li-title">Guests</h1>
                <span className="li-sub">Replies from every invitation.</span>
              </div>
              <AccountTabs />
              {!ready ? null : invites.length === 0 ? (
                <div className="li-empty">
                  <strong>Nothing here yet.</strong>
                  <p>Create an invitation and replies will show up here.</p>
                </div>
              ) : (
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
                  {!rosterReady ? (
                    <p className="empty wait-line" aria-busy="true">
                      <Spinner size="md" /> Loading replies…
                    </p>
                  ) : (
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
                  )}
                  <div className="foot">
                    <span>
                      Showing {rosterRows.length} of {eventFilter === "all" ? roster.length : roster.filter((row) => row.inviteId === eventFilter).length} replies
                    </span>
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </main>
        <LoggedInFooter />
      </div>
      {toast ? <Notice message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
