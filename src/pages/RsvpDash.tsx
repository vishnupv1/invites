import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getInviteRecord, listGreetings, signOut, updateHostName } from "../api";
import { LiveShare } from "../components/LiveShare";
import { Spinner } from "../components/Loader";
import { packOf } from "../data/custom";
import { getTemplate } from "../data/templates";
import { formatShortDate } from "../lib/dates";
import { guestInviteUrl } from "../lib/share";
import { useSession } from "../session";
import { useLibrary } from "../state";
import { Logo } from "../components/shell/Logo";
import { CheckIcon, EventsIcon, GridIcon, GuestsIcon, HeartIcon, OverviewIcon, PencilIcon, ReceiptIcon, SettingsIcon, ShareIcon } from "../components/shell/marks";
import { LibraryPane } from "./LibraryPane";
import { AccountTemplates } from "./Templates";
import "./rsvp-dash.css";

type Greeting = { id: string; name: string; note: string; attending: boolean; at: string };
type Pane = "overview" | "guests" | "wishes" | "settings" | "events" | "drafts" | "favorites" | "purchases" | "templates";
const LIBRARY_TITLE: Partial<Record<Pane, string>> = {
  events: "My events",
  drafts: "Saved drafts",
  favorites: "Favorites",
  purchases: "Purchases",
};
const JUMPS = [
  { to: "/templates", label: "Templates" },
  { to: "/events", label: "Events" },
  { to: "/drafts", label: "Drafts" },
  { to: "/favorites", label: "Favorites" },
  { to: "/purchases", label: "Purchases" },
];
const SETTINGS_KEY = "invitesready.settings.v1";
const NOTICE_ROWS = [
  ["Email me when a guest replies", "Not available yet. Replies stay on the Guests page."],
  ["Daily WhatsApp summary", "Not available yet. There is no WhatsApp sender."],
  ["Product news & offers", "Not available yet."],
] as const;

const TONES = [
  { background: "#E6EFE9", color: "#0E4D3C" },
  { background: "#FBEBD1", color: "#9A6418" },
  { background: "#F5DDD6", color: "#C8442A" },
];

function initialsOf(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";
}

function countdown(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((parsed.getTime() - today.getTime()) / 86_400_000);
  if (diff > 1) return `${diff} days to go`;
  if (diff === 1) return "1 day to go";
  if (diff === 0) return "today";
  return "";
}

function functionNames(templateId: string, lines: string | undefined) {
  if (lines?.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(lines) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (item && typeof item === "object" ? String((item as { name?: string }).name ?? "").trim() : ""))
          .filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return (packOf(templateId, lines).programme ?? []).map((item) => item.title.trim()).filter(Boolean);
}

function whenLabel(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function readDeviceSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as { phone?: string; lang?: string }) : {};
    return { phone: parsed.phone ?? "", lang: parsed.lang ?? "en" };
  } catch {
    return { phone: "", lang: "en" };
  }
}

function SettingsForm() {
  const { host } = useSession();
  const stored = readDeviceSettings();
  const [name, setName] = useState(host?.name ?? "");
  const [phone, setPhone] = useState(stored.phone);
  const [lang, setLang] = useState(stored.lang);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setName(host?.name ?? "");
  }, [host?.name]);

  async function save() {
    const next = name.trim();
    if (!next) {
      setNote("Enter your full name.");
      return;
    }
    setSaving(true);
    try {
      if (next !== (host?.name ?? "").trim()) await updateHostName(next);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ phone, lang }));
      setNote("Saved. Phone and language stay on this device.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not save your name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="rsvp-settings" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className="rsvp-panel">
        <h2>Profile</h2>
        <label className="rsvp-field">
          <span>Full name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} />
        </label>
        <label className="rsvp-field">
          <span>Email</span>
          <input type="email" value={host?.email ?? ""} readOnly />
        </label>
        <label className="rsvp-field">
          <span>WhatsApp number</span>
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91" autoComplete="tel" />
        </label>
      </div>
      <div className="rsvp-panel">
        <h2>Notifications</h2>
        {NOTICE_ROWS.map(([label, detail]) => (
          <div key={label} className="rsvp-pref">
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
            <span className="rsvp-track" aria-hidden="true"><i /></span>
          </div>
        ))}
        <label className="rsvp-field">
          <span>Language</span>
          <select value={lang} onChange={(event) => setLang(event.target.value)}>
            <option value="en">English</option>
            <option value="ml">Malayalam</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
          </select>
        </label>
      </div>
      <div className="rsvp-settings-save">
        <button type="submit" className="rsvp-save" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        {note ? <p className="rsvp-note">{note}</p> : null}
      </div>
    </form>
  );
}

function Reply({ row, index }: { row: Greeting; index: number }) {
  const tone = TONES[index % TONES.length];
  const detail = [row.note.trim(), whenLabel(row.at)].filter(Boolean).join(" · ");
  return (
    <div className="rsvp-who">
      <span className="rsvp-av" style={tone}>{initialsOf(row.name)}</span>
      <div>
        <b>{row.name}</b>
        {detail ? <small>{detail}</small> : null}
      </div>
      <span className={row.attending ? "rsvp-pill yes" : "rsvp-pill no"}>{row.attending ? "Coming" : "Can’t come"}</span>
    </div>
  );
}

export function RsvpDash({ mode = "overview" }: { mode?: Pane }) {
  const { host } = useSession();
  const { invites, ready } = useLibrary();
  const [picked, setPicked] = useState("");
  const [rows, setRows] = useState<Greeting[]>([]);
  const [rowsReady, setRowsReady] = useState(false);
  const [functions, setFunctions] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pane = mode;
  const libraryTitle = LIBRARY_TITLE[pane];
  const ordered = useMemo(() => {
    return [...invites].sort((a, b) => {
      const live = Number(b.status === "live") - Number(a.status === "live");
      if (live) return live;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }, [invites]);
  const selected = ordered.find((invite) => invite.id === picked) ?? ordered[0];
  const first = host?.name?.trim().split(/\s+/)[0] || "";
  const template = selected ? getTemplate(selected.templateId) : undefined;
  const attending = rows.filter((row) => row.attending).length;
  const declined = rows.length - attending;
  const counts = functions.map((name) => rows.filter((row) => row.attending && row.note.toLowerCase().includes(name.toLowerCase())).length);
  const showFunctions = functions.length > 0 && (attending === 0 || counts.some((count) => count > 0));
  const maxCount = Math.max(1, ...counts);
  const wishes = rows.filter((row) => row.note.trim());
  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return row.name.toLowerCase().includes(q) || row.note.toLowerCase().includes(q);
  });
  const latest = rows.slice(0, 4);

  useEffect(() => {
    if (!selected?.code) return;
    let cancel = false;
    setRowsReady(false);
    listGreetings(selected.code)
      .then((list) => {
        if (!cancel) setRows(list);
      })
      .catch(() => {
        if (!cancel) setRows([]);
      })
      .finally(() => {
        if (!cancel) setRowsReady(true);
      });
    getInviteRecord(selected.id)
      .then((record) => {
        if (!cancel) setFunctions(functionNames(selected.templateId, record.fields.lines));
      })
      .catch(() => {
        if (!cancel) setFunctions([]);
      });
    return () => {
      cancel = true;
    };
  }, [selected?.id, selected?.code, selected?.templateId]);

  function exportReplies() {
    const lines = ["name,status,note,when", ...rows.map((row) => {
      const cells = [row.name, row.attending ? "Coming" : "Can't come", row.note, row.at];
      return cells.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(",");
    })];
    const file = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(selected?.names || "replies").replace(/\s+/g, "-").toLowerCase()}-rsvps.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!moreOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [moreOpen]);

  const liveText = selected?.status === "live"
    ? ["Live", countdown(selected.date)].filter(Boolean).join(" · ")
    : "Not live yet";

  return (
    <div className="rsvp-dash">
      <aside className="rsvp-side">
        <Logo className="rsvp-mark" to="/studio" />
        <Link className={pane === "overview" ? "on" : ""} to="/studio"><OverviewIcon /> Overview</Link>
        <Link className={pane === "guests" ? "on" : ""} to="/guests"><GuestsIcon /> Guests</Link>
        <Link to="/studio"><CheckIcon /> RSVPs</Link>
        <Link className={pane === "wishes" ? "on" : ""} to="/wishes"><HeartIcon /> Wishes</Link>
        {selected ? <Link to={`/create/${selected.templateId}?invite=${selected.id}`}><PencilIcon /> Edit invitation</Link> : <span className="off"><PencilIcon /> Edit invitation</span>}
        <Link className={pane === "settings" ? "on" : ""} to="/settings"><SettingsIcon /> Settings</Link>
        <Link className={pane === "templates" ? "on" : ""} to="/templates"><GridIcon /> Templates</Link>
        <Link className={pane === "events" ? "on" : ""} to="/events"><EventsIcon /> Events</Link>
        <Link className={pane === "drafts" ? "on" : ""} to="/drafts"><PencilIcon /> Drafts</Link>
        <Link className={pane === "favorites" ? "on" : ""} to="/favorites"><HeartIcon /> Favorites</Link>
        <Link className={pane === "purchases" ? "on" : ""} to="/purchases"><ReceiptIcon /> Purchases</Link>
        {selected && template ? (
          <div className="rsvp-card">
            <b>{template.name}</b>
            {selected.status === "live" ? "Live" : "Draft"}
          </div>
        ) : null}
      </aside>
      <div className="rsvp-main">
        <div className="rsvp-more-bar">
          <Logo className="rsvp-mark" to="/studio" />
          <div className="rsvp-menu" ref={menuRef}>
            <button
              type="button"
              className="rsvp-burger"
              aria-expanded={moreOpen}
              aria-label={moreOpen ? "Close menu" : "Menu"}
              onClick={() => setMoreOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
            {moreOpen ? (
              <nav aria-label="More">
                {JUMPS.map((item) => (
                  <Link key={item.to} to={item.to} className={item.to === `/${pane}` ? "on" : ""} onClick={() => setMoreOpen(false)}>{item.label}</Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    void signOut().finally(() => window.location.assign("/"));
                  }}
                >
                  Log out
                </button>
              </nav>
            ) : null}
          </div>
        </div>
        {!ready ? (
          <p className="rsvp-wait" aria-busy="true"><Spinner size="md" /> Loading your invitation…</p>
        ) : !selected && pane !== "settings" && pane !== "templates" && !libraryTitle ? (
          <div className="rsvp-empty">
            <h1>Your dashboard</h1>
            <p>Publish an invitation and replies will land here.</p>
            <Link className="rsvp-go" to="/templates">Browse templates</Link>
          </div>
        ) : (
          <>
            <header className="rsvp-top">
              <div>
                <small>{first ? `Namaste, ${first}` : "Namaste"}</small>
                {pane === "settings" ? null : <h1>{libraryTitle ?? (pane === "templates" ? "Templates" : selected?.names || "Your invitation")}</h1>}
              </div>
              {selected && !libraryTitle && pane !== "settings" && pane !== "templates" ? (
                <>
                  <Link className="rsvp-chip line rsvp-text" to={`/create/${selected.templateId}?invite=${selected.id}`}><PencilIcon /> Edit</Link>
                  <button type="button" className="rsvp-chip rsvp-text" onClick={() => setShareOpen(true)}><ShareIcon /> Share</button>
                  <Link className="rsvp-round rsvp-icon" aria-label="Edit" to={`/create/${selected.templateId}?invite=${selected.id}`}><PencilIcon /></Link>
                  <button type="button" className="rsvp-round rsvp-icon" aria-label="Share" onClick={() => setShareOpen(true)}><ShareIcon /></button>
                </>
              ) : null}
            </header>
            {!libraryTitle && pane !== "settings" && pane !== "templates" && ordered.length > 1 ? (
              <div className="rsvp-switch" role="tablist" aria-label="Invitations">
                {ordered.map((invite) => (
                  <button key={invite.id} type="button" className={invite.id === selected?.id ? "on" : ""} aria-pressed={invite.id === selected?.id} onClick={() => setPicked(invite.id)}>
                    {invite.names || "Untitled"}
                  </button>
                ))}
              </div>
            ) : null}
            {pane === "overview" && selected ? (
              <>
                <div className="rsvp-live">
                  <i />
                  <div>
                    {liveText}
                    <small>{window.location.host}/i/{selected.code}</small>
                  </div>
                  <Link to={`/i/${selected.code}`}>View</Link>
                </div>
                <div className="rsvp-stats">
                  <div><b>{rows.length}</b>replied</div>
                  <div><b>{attending}</b>attending</div>
                  <div><b>{declined}</b>can’t come</div>
                </div>
                <div className={showFunctions ? "rsvp-cols" : "rsvp-cols is-single"}>
                  {showFunctions ? (
                    <div>
                      <div className="rsvp-label"><span>By function</span><span>guests</span></div>
                      {functions.map((name, index) => (
                        <div className="rsvp-fn" key={`${name}-${index}`}>
                          <span>{name}</span>
                          <span className="tr"><i style={{ width: `${(counts[index] / maxCount) * 100}%` }} /></span>
                          <em>{counts[index]}</em>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div>
                    <div className="rsvp-label">
                      <span>Latest replies</span>
                      {rows.length ? <button type="button" onClick={exportReplies}>Export</button> : <span />}
                    </div>
                    <div className="rsvp-rep">
                      {!rowsReady ? <p className="rsvp-wait"><Spinner size="md" /> Loading replies…</p> : null}
                      {rowsReady && latest.length === 0 ? <p className="rsvp-none">No replies yet.</p> : null}
                      {latest.map((row, index) => <Reply key={row.id} row={row} index={index} />)}
                    </div>
                    {rows.length > latest.length ? <Link className="rsvp-more" to="/guests">See all replies</Link> : null}
                  </div>
                </div>
              </>
            ) : null}
            {pane === "guests" && selected ? (
              <>
                <label className="rsvp-search">
                  Search guests
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guests" />
                </label>
                <div className="rsvp-rep">
                  {!rowsReady ? <p className="rsvp-wait"><Spinner size="md" /> Loading replies…</p> : null}
                  {rowsReady && filtered.length === 0 ? <p className="rsvp-none">No replies yet.</p> : null}
                  {filtered.map((row, index) => <Reply key={row.id} row={row} index={index} />)}
                </div>
              </>
            ) : null}
            {pane === "wishes" && selected ? (
              <div className="rsvp-rep">
                {!rowsReady ? <p className="rsvp-wait"><Spinner size="md" /> Loading wishes…</p> : null}
                {rowsReady && wishes.length === 0 ? <p className="rsvp-none">No wishes yet.</p> : null}
                {wishes.map((row, index) => <Reply key={row.id} row={row} index={index} />)}
              </div>
            ) : null}
            {pane === "templates" ? <AccountTemplates /> : null}
            {libraryTitle ? <LibraryPane view={pane as "events" | "drafts" | "favorites" | "purchases"} /> : null}
            {pane === "settings" ? <SettingsForm /> : null}
          </>
        )}
      </div>
      <nav className="rsvp-nav" aria-label="Dashboard">
        <Link className={pane === "overview" ? "on" : ""} to="/studio"><i><OverviewIcon /></i>Overview</Link>
        <Link className={pane === "guests" ? "on" : ""} to="/guests"><i><GuestsIcon /></i>Guests</Link>
        <Link className={pane === "wishes" ? "on" : ""} to="/wishes"><i><HeartIcon /></i>Wishes</Link>
        <Link className={pane === "settings" ? "on" : ""} to="/settings"><i><SettingsIcon /></i>Settings</Link>
      </nav>
      {shareOpen && selected ? (
        <LiveShare
          names={selected.names || "Your invitation"}
          priceLabel="Free"
          // priceLabel={!template || template.free ? "Free" : formatPrice(template)}
          link={guestInviteUrl(selected.code, selected.templateId)}
          when={selected.date ? formatShortDate(selected.date) : ""}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}
