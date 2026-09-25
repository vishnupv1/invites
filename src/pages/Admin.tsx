import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLogin } from "./AdminLogin";
import { adminSummary, getToken, signOut, type AdminSummary } from "../api";
import { EVENTS } from "../data/events";
import { TEMPLATES } from "../data/templates";
import { formatShortDate } from "../lib/dates";
import "./admin.css";

const SECTIONS = ["Overview", "Templates", "Users", "Events", "Payments", "Settings"] as const;
type Section = (typeof SECTIONS)[number] | "More";

const MOBILE_NAV: { label: string; section: Section; icon: string }[] = [
  { label: "Overview", section: "Overview", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { label: "Templates", section: "Templates", icon: "M4 4h16v16H4zM4 9h16M9 9v11" },
  { label: "Users", section: "Users", icon: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6" },
  { label: "Events", section: "Events", icon: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" },
  { label: "More", section: "More", icon: "M5 12h.01M12 12h.01M19 12h.01" },
];

const ICONS: Record<(typeof SECTIONS)[number], string> = {
  Overview: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  Templates: "M4 4h16v16H4zM4 9h16M9 9v11",
  Users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c.8-4 3.6-6 7-6s6.2 2 7 6",
  Events: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
  Payments: "M2 6h20v12H2zM2 10h20M6 15h4",
  Settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

const SUBS: Record<Section, string> = {
  Overview: "Platform health at a glance.",
  Templates: "Invitation designs in the catalog.",
  Users: "Accounts that have signed up.",
  Events: "Invitations hosts have published.",
  Payments: "Template purchases recorded by the API.",
  Settings: "Who can open this console.",
  More: "Purchases and this console.",
};

const COLORS = ["#4A263E", "#C89B5B", "#6F8B74", "#C45B63", "#6B3A5B", "#2F4858"];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function weekKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return start.toISOString().slice(0, 10);
}

export function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [section, setSection] = useState<Section>("Overview");
  const [data, setData] = useState<AdminSummary | null>(null);
  const [tplQuery, setTplQuery] = useState("");
  const [occasion, setOccasion] = useState("All");
  const [userQuery, setUserQuery] = useState("");
  const [evFilter, setEvFilter] = useState<"All" | "Live" | "Completed">("All");

  useEffect(() => {
    if (!getToken()) {
      setChecked(true);
      return;
    }
    adminSummary()
      .then((summary) => {
        setData(summary);
        setUnlocked(true);
      })
      .catch(() => setUnlocked(false))
      .finally(() => setChecked(true));
  }, [unlocked]);

  const uses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of data?.events ?? []) counts.set(event.templateId, (counts.get(event.templateId) ?? 0) + 1);
    return counts;
  }, [data]);

  const weeks = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const user of data?.users ?? []) {
      const key = weekKey(user.joined);
      if (key) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8);
  }, [data]);
  const maxWeek = Math.max(1, ...weeks.map(([, count]) => count));

  const usedIds = new Set([...(data?.events ?? []).map((event) => event.templateId), ...(data?.purchases ?? []).map((row) => row.templateId)]);
  const occasions = ["All", ...EVENTS.map((event) => event.label)];
  const templates = TEMPLATES.filter((template) => {
    const occasionOk = occasion === "All" || template.events.some((id) => EVENTS.find((event) => event.id === id)?.label === occasion);
    const textOk = !tplQuery.trim() || template.name.toLowerCase().includes(tplQuery.trim().toLowerCase());
    return occasionOk && textOk && usedIds.has(template.id);
  });
  const users = (data?.users ?? []).filter((user) => {
    const q = userQuery.trim().toLowerCase();
    return !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
  });
  const live = (data?.events ?? []).filter((event) => {
    const date = new Date(`${event.date}T12:00:00`);
    return !Number.isNaN(date.getTime()) && date.getTime() >= Date.now() - 86_400_000;
  });
  const replies = (data?.events ?? []).reduce((sum, event) => sum + event.replies, 0);
  const yes = (data?.events ?? []).reduce((sum, event) => sum + event.yes, 0);
  const top = [...TEMPLATES].filter((template) => (uses.get(template.id) ?? 0) > 0).sort((a, b) => (uses.get(b.id) ?? 0) - (uses.get(a.id) ?? 0));

  if (!checked) return null;
  if (!unlocked || !data) {
    return <AdminLogin onReady={() => setUnlocked(true)} />;
  }

  function leave() {
    signOut();
    setData(null);
    setUnlocked(false);
  }

  const shownEvents = data.events.filter((event) => {
    const finished = new Date(`${event.date}T12:00:00`).getTime() < Date.now();
    if (evFilter === "Live") return !finished;
    if (evFilter === "Completed") return finished;
    return true;
  });

  return (
    <div className="console">
      <header className="adm-bar">
        <div>
          <span>
            Invites<em>Ready</em>
          </span>
          <span className="adm-badge">Admin</span>
        </div>
        <div className="adm-avatar" aria-hidden="true">{initials(data.admin.name)}</div>
      </header>
      <aside className="console-side">
        <Link className="console-brand" to="/">
          <div>
            <svg width="30" height="30" viewBox="0 0 38 38" fill="none" aria-hidden="true">
              <rect x="3" y="8" width="28" height="21" rx="4" stroke="#FFFFFF" strokeWidth="2.4" />
              <path d="M4 11l13 9 13-9" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" />
              <circle cx="29" cy="27" r="7.5" fill="#C89B5B" />
              <path d="M25.5 27l2.4 2.4 4.4-4.6" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>
              Invites<em>Ready</em>
            </span>
          </div>
          <span className="console-tag">Admin console</span>
        </Link>
        <nav aria-label="Admin">
          {SECTIONS.map((label) => (
            <button key={label} type="button" className={section === label ? "console-nav on" : "console-nav"} aria-current={section === label ? "page" : undefined} onClick={() => setSection(label)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={section === label ? "#211C1E" : "#CFC7CA"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ICONS[label]} />
              </svg>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="console-account">
          <div className="avatar" style={{ background: "#6B3A5B", color: "#fff" }}>{initials(data.admin.name)}</div>
          <div style={{ flexGrow: 1 }}>
            <strong>{data.admin.name}</strong>
            <small>Admin</small>
          </div>
          <button
            type="button"
            className="logout"
            aria-label="Sign out"
            onClick={leave}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B5ADB0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="M10 17l-5-5 5-5M5 12h11" />
            </svg>
          </button>
        </div>
      </aside>
      <main className="console-main">
        <div>
          <h1>{section}</h1>
          <p className="sub">{SUBS[section]}</p>
        </div>

        {section === "Overview" ? (
          <>
            <div className="kpis">
              <article className="kpi"><em>Total users</em><strong>{data.users.length}</strong></article>
              <article className="kpi"><em>Live events</em><strong>{live.length}</strong></article>
              <article className="kpi"><em>Replies</em><strong>{replies}</strong></article>
              <article className="kpi"><em>RSVP yes</em><strong>{replies ? `${Math.round((yes / replies) * 100)}%` : "—"}</strong></article>
            </div>
            <div className="split">
              <section className="panel grow">
                <h2>New sign-ups</h2>
                {weeks.length === 0 ? <p className="empty">No sign-ups yet.</p> : null}
                <div className="bars">
                  {weeks.map(([label, count]) => (
                    <div key={label}>
                      <span>{count}</span>
                      <i style={{ height: `${Math.max(8, (count / maxWeek) * 180)}px` }} />
                    </div>
                  ))}
                </div>
                <div className="weeks">
                  {weeks.map(([label]) => (
                    <span key={label}>{formatShortDate(label)}</span>
                  ))}
                </div>
              </section>
              <section className="panel side-card">
                <h2>Top templates</h2>
                {top.length === 0 ? <p className="empty">No templates published yet.</p> : null}
                {top.map((template) => (
                  <div key={template.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{template.name}</strong>
                    <span className="muted">{uses.get(template.id) ?? 0} published</span>
                  </div>
                ))}
              </section>
            </div>
          </>
        ) : null}

        {section === "Templates" ? (
          <>
            <div className="tools">
              <div className="filters">
                {occasions.map((label) => (
                  <button key={label} type="button" className={occasion === label ? "chip on" : "chip"} onClick={() => setOccasion(label)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="search">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#716A6D" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                <input type="search" placeholder="Search templates" value={tplQuery} onChange={(input) => setTplQuery(input.target.value)} />
              </div>
            </div>
            <div className="tpl-grid">
              {templates.map((template, index) => (
                <article className="tpl-card" key={template.id}>
                  <a href={`/template/${template.id}`} style={{ background: COLORS[index % COLORS.length] }}>
                    <span>{EVENTS.find((event) => template.events.includes(event.id))?.label}</span>
                    <strong>{template.name}</strong>
                  </a>
                  <div>
                    <strong>{template.name}</strong>
                    {template.free ? "Free" : `$${template.price}`} · {uses.get(template.id) ?? 0} published
                  </div>
                </article>
              ))}
            </div>
            {templates.length === 0 ? <p className="empty">No templates match.</p> : null}
          </>
        ) : null}

        {section === "Users" ? (
          <section className="panel">
            <div className="search">
              <input type="search" placeholder="Search name or email" value={userQuery} onChange={(input) => setUserQuery(input.target.value)} />
            </div>
            <div className="head-row" style={{ gridTemplateColumns: "2.2fr 0.7fr 1fr" }}><span>User</span><span>Events</span><span>Joined</span></div>
            {users.map((user) => (
              <div className="user-row" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <div className="muted">{user.email}</div>
                </div>
                <span>{user.events}</span>
                <span className="muted">{user.joined ? formatShortDate(user.joined.slice(0, 10)) : ""}</span>
              </div>
            ))}
            {users.length === 0 ? <p className="empty">No users match this view.</p> : null}
          </section>
        ) : null}

        {section === "Events" ? (
          <section className="panel">
            <div className="adm-ev-filters">
              {(["All", "Live", "Completed"] as const).map((label) => (
                <button key={label} type="button" className={evFilter === label ? "chip on" : "chip"} aria-pressed={evFilter === label} onClick={() => setEvFilter(label)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="head-row" style={{ gridTemplateColumns: "2fr 1.3fr 1fr 0.7fr 0.8fr auto" }}>
              <span>Event</span><span>Host</span><span>Date</span><span>Replies</span><span>Status</span><span />
            </div>
            {shownEvents.map((event) => {
              const finished = new Date(`${event.date}T12:00:00`).getTime() < Date.now();
              const template = TEMPLATES.find((item) => item.id === event.templateId);
              return (
                <div className="event-row" key={event.id}>
                  <div>
                    <strong>{event.name}</strong>
                    <div className="muted">{template?.name ?? event.templateId}</div>
                  </div>
                  <span className="muted">{event.host}</span>
                  <span className="muted">{formatShortDate(event.date)}</span>
                  <span>{event.replies}</span>
                  <span className={`pill ${finished ? "completed" : "live"}`}>{finished ? "Completed" : "Live"}</span>
                  <Link to={`/i/${event.code}`}>View</Link>
                </div>
              );
            })}
            {shownEvents.length === 0 ? <p className="empty">No invitations published yet.</p> : null}
          </section>
        ) : null}

        {section === "Payments" || section === "More" ? (
          <section className="panel">
            <div className="pay-kpis">
              <article className="pay-kpi"><em>Recorded purchases</em><strong>{data.purchases.length}</strong></article>
              <article className="pay-kpi"><em>Catalog total</em><strong>${data.purchases.reduce((sum, row) => sum + row.price, 0)}</strong></article>
            </div>
            {data.purchases.map((row) => (
              <div className="pay-row" key={row.id}>
                <strong>{TEMPLATES.find((item) => item.id === row.templateId)?.name ?? row.templateId}</strong>
                <span className="muted">{row.host}</span>
                <span>${row.price}</span>
                <span className="muted">{row.at ? formatShortDate(row.at.slice(0, 10)) : ""}</span>
              </div>
            ))}
            {data.purchases.length === 0 ? <p className="empty">No purchases yet.</p> : null}
          </section>
        ) : null}

        {section === "Settings" || section === "More" ? (
          <section className="panel">
            <h2>Admin</h2>
            <strong>{data.admin.name}</strong>
            <span className="muted">{data.admin.email}</span>
          </section>
        ) : null}
        {section === "More" ? (
          <button type="button" className="adm-out" onClick={leave}>
            Sign out
          </button>
        ) : null}
      </main>
      <nav className="adm-nav" aria-label="Admin">
        {MOBILE_NAV.map((item) => (
          <button key={item.label} type="button" className={section === item.section ? "on" : ""} aria-current={section === item.section ? "page" : undefined} onClick={() => setSection(item.section)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
