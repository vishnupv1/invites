import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { AureliaInvite } from "../components/AureliaInvite";
import { GazalInvite } from "../components/GazalInvite";
import { getTemplateRecord, listEvents, listTemplates, type CatalogEvent } from "../api";
import { eventLabels, formatPrice, sampleFor } from "../data/templates";
import { useLibrary } from "../state";
import type { EventId, Template } from "../types";
import "./preview.css";

const FAVS = "vellum.template-favs.v1";

const VARIANTS = [
  { name: "Ivory & gold", bg: "#FAF7F2", fg: "#4A263E", accent: "#C89B5B" },
  { name: "Plum & gold", bg: "#4A263E", fg: "#FFFFFF", accent: "#C89B5B" },
  { name: "Rose & blush", bg: "#F7E3E5", fg: "#6E2A31", accent: "#C45B63" },
  { name: "Sage & ivory", bg: "#E6EDE7", fg: "#2E4433", accent: "#6F8B74" },
];

const VIEWS = [
  { id: "card", label: "Invite card", icon: "M4 3h16v18H4zM8 8h8M8 12h8M8 16h5" },
  { id: "phone", label: "Event page · mobile", icon: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" },
  { id: "desktop", label: "Event page · desktop", icon: "M3 4h18v12H3zM8 20h8M12 16v4" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];
type Lang = "en" | "ml" | "both";

function readFavs() {
  try {
    const raw = localStorage.getItem(FAVS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function splitNames(names: string) {
  const parts = names.split(/\s+&\s+/);
  if (parts.length < 2) return { first: names, second: "" };
  return { first: parts[0], second: parts.slice(1).join(" & ") };
}

function prettyDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function parseDate(text: string) {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function clock(text: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) return text;
  const hour = Number(match[1]);
  const mins = match[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${mins} ${suffix}`;
}

function countdown(text: string) {
  const date = parseDate(text);
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return [String(days), String(hours).padStart(2, "0"), String(mins).padStart(2, "0")];
}

function extras(template: Template) {
  const items = ["Invite card", "event page"];
  if (template.asks.photos) items.push("photo gallery");
  if (template.asks.audio) items.push("music");
  if (template.asks.location) items.push("map");
  items.push("RSVP");
  return items.join(", ");
}

export function TemplatePreview() {
  const { id } = useParams();
  const { owns } = useLibrary();
  const [template, setTemplate] = useState<Template | null>(null);
  const [catalog, setCatalog] = useState<Template[]>([]);
  const [events, setEvents] = useState<CatalogEvent[]>([]);
  const [missing, setMissing] = useState(false);
  const event = (template?.events[0] ?? "marriage") as EventId;
  const sample = template ? sampleFor(template, event) : null;
  const [view, setView] = useState<ViewId>("card");
  const [lang, setLang] = useState<Lang>("en");
  const [variant, setVariant] = useState(0);
  const [music, setMusic] = useState(false);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [favs, setFavs] = useState<string[]>(readFavs);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!id) return;
    setMissing(false);
    setTemplate(null);
    Promise.all([getTemplateRecord(id), listTemplates(), listEvents()])
      .then(([row, rows, eventRows]) => {
        const fields = sampleFor(row, row.events[0]);
        const parts = splitNames(fields.names);
        setTemplate(row);
        setCatalog(rows);
        setEvents(eventRows);
        setFirst(parts.first);
        setSecond(parts.second);
        setDate(prettyDate(fields.date));
        setVenue(fields.venue);
      })
      .catch(() => setMissing(true));
  }, [id]);

  useEffect(() => {
    localStorage.setItem(FAVS, JSON.stringify(favs));
  }, [favs]);

  const colour = VARIANTS[variant];
  const showEn = lang !== "ml";
  const showMl = lang !== "en";
  const n1 = first.trim() || "Name";
  const n2 = second.trim();
  const dateText = date.trim() || "Date";
  const venueText = venue.trim() || "Venue";
  const left = countdown(dateText);
  const liked = template ? favs.includes(template.id) : false;
  const owned = template ? owns(template.id, template.free) : false;
  const occasion = events.find((item) => item.id === event) ?? { id: event, label: event, cardLabel: event };
  const useTo = template ? (owned ? `/create/${template.id}?event=${event}` : `/template/${template.id}?event=${event}`) : "/templates";
  const useLabel = !template ? "" : owned ? "Use this template" : `Buy once · ${formatPrice(template)}`;

  const similar = useMemo(() => {
    if (!template) return [];
    return catalog.filter((item) => item.id !== template.id && item.events.some((eventId) => template.events.includes(eventId))).slice(0, 4);
  }, [catalog, template]);

  if (missing) return <Navigate to="/templates" replace />;
  if (!template || !sample) return <div className="pv" />;

  const functions = [
    { title: occasion.cardLabel, when: `${clock(sample.time)} · ${venueText}` },
    ...(sample.receptionTime
      ? [{ title: "Reception", when: `${clock(sample.receptionTime)} · ${sample.receptionVenue || venueText}` }]
      : []),
  ];

  const ink = { background: colour.bg, color: colour.fg, borderColor: colour.accent };
  const hostsEn = sample.hosts;
  const hostsMl = "കുടുംബങ്ങളുടെ അനുഗ്രഹത്തോടെ";
  const lineEn = sample.title;
  const lineMl = "നിങ്ങളെ സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു";

  function toggleFav() {
    if (!template) return;
    const templateId = template.id;
    setFavs((current) => (current.includes(templateId) ? current.filter((item) => item !== templateId) : [...current, templateId]));
    setToast(liked ? "Removed from favourites." : "Saved to your favourites.");
  }

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Preview link copied.");
    } catch {
      setToast(url);
    }
  }

  return (
    <div className="pv">
      <header className="pv-head">
        <div className="pv-id">
          <Link className="pv-back" to="/templates">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            All templates
          </Link>
          <div>
            <div className="pv-crumb">
              <Link to="/templates">Templates</Link> / {occasion.label}
            </div>
            <div className="pv-title">
              <h1>{template.name}</h1>
              <span className={template.free ? "pv-badge free" : "pv-badge gold"}>{template.free ? "Free" : "Premium"}</span>
            </div>
          </div>
        </div>
        <div className="pv-actions">
          <button type="button" className="pv-icon" aria-pressed={liked} aria-label={liked ? "Remove from favourites" : "Save to favourites"} onClick={toggleFav}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? "#C45B63" : "none"} stroke="#C45B63" strokeWidth="2" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
          </button>
          <button type="button" className="pv-share" onClick={share}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
            </svg>
            Share preview
          </button>
          <Link className="pv-use" to={useTo}>
            {useLabel}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="pv-body">
        <div className="pv-split">
          <section className="pv-stage" aria-label="Preview">
            <div className="pv-tools">
              <div className="pv-seg" role="group" aria-label="Preview type">
                {VIEWS.map((item) => (
                  <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={item.icon} />
                    </svg>
                    <span className="pv-long">{item.label}</span>
                    <span className="pv-short">{item.id === "phone" ? "Event page" : item.id === "card" ? "Invite card" : "Desktop"}</span>
                  </button>
                ))}
              </div>
              {template.asks.audio ? (
                <button type="button" className="pv-music" aria-pressed={music} onClick={() => { setMusic((on) => !on); setToast(music ? "Music off." : "A song plays on the shared invite once you add one."); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  {music ? "Music on" : "Play background music"}
                </button>
              ) : null}
            </div>

            <div className="pv-canvas">
              {template.style === "aurelia" ? (
                <AureliaInvite
                  fields={{
                    ...sample,
                    names: n2 ? `${n1} & ${n2}` : n1,
                    venue: venueText === "Venue" ? sample.venue : venueText,
                  }}
                />
              ) : null}
              {template.style === "gazal" ? (
                <GazalInvite
                  fields={{
                    ...sample,
                    names: n2 ? `${n1} & ${n2}` : n1,
                    venue: venueText === "Venue" ? sample.venue : venueText,
                  }}
                />
              ) : null}
              {template.style !== "gazal" && template.style !== "aurelia" && view === "card" ? (
                <div className="pv-card" style={{ ...ink, border: colour.bg === "#FAF7F2" ? "1px solid #E8DFD6" : undefined }}>
                  <div className="pv-card-in" style={{ borderColor: colour.accent, outlineColor: colour.accent }}>
                    <svg width="120" height="22" viewBox="0 0 120 22" fill="none" aria-hidden="true">
                      <path d="M0 11h42M78 11h42" stroke={colour.accent} strokeWidth="1.3" />
                      <path d="M60 2l9 9-9 9-9-9z" stroke={colour.accent} strokeWidth="1.5" />
                      <circle cx="60" cy="11" r="2.5" fill={colour.accent} />
                    </svg>
                    {showEn ? <span className="pv-kicker">{hostsEn}</span> : null}
                    {showMl ? <span className="pv-ml">{hostsMl}</span> : null}
                    <div>
                      <div className="pv-n1">{n1}</div>
                      {n2 ? <div className="pv-amp" style={{ color: colour.accent }}>&amp;</div> : null}
                      {n2 ? <div className="pv-n1">{n2}</div> : null}
                    </div>
                    {showEn ? <span className="pv-line">{lineEn}</span> : null}
                    {showMl ? <span className="pv-ml">{lineMl}</span> : null}
                    <span className="pv-band" style={{ borderColor: colour.accent }} />
                    <span className="pv-date">{dateText}</span>
                    <span className="pv-venue">{venueText}</span>
                  </div>
                </div>
              ) : null}

              {template.style !== "gazal" && template.style !== "aurelia" && view === "phone" ? (
                <div className="pv-phone">
                  <div className="pv-phone-in">
                    <div className="pv-cover" style={ink}>
                      {showEn ? <span className="pv-kicker">{hostsEn}</span> : null}
                      {showMl ? <span className="pv-ml">{hostsMl}</span> : null}
                      <h2>
                        {n1} {n2 ? <span className="pv-amp" style={{ color: colour.accent }}>&amp;</span> : null} {n2}
                      </h2>
                      <span>{dateText} · {venueText}</span>
                    </div>
                    <div className="pv-sheet">
                      {left ? (
                        <div className="pv-count">
                          <div><strong>{left[0]}</strong><span>Days</span></div>
                          <div><strong>{left[1]}</strong><span>Hours</span></div>
                          <div><strong>{left[2]}</strong><span>Mins</span></div>
                        </div>
                      ) : null}
                      <div className="pv-label">Schedule</div>
                      {functions.map((item) => (
                        <div className="pv-fn" key={item.title}>
                          <div><strong>{item.title}</strong><span>{item.when}</span></div>
                        </div>
                      ))}
                      <div className="pv-rsvp">
                        <span className="pv-yes">Joyfully joining</span>
                        <span className="pv-no">Can't make it</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {template.style !== "gazal" && template.style !== "aurelia" && view === "desktop" ? (
                <div className="pv-desk">
                  <div className="pv-chrome">
                    <span className="pv-dot" />
                    <span className="pv-dot" />
                    <span className="pv-dot" />
                    <span className="pv-url">invitesready.com/preview/{template.id}</span>
                  </div>
                  <div className="pv-desk-body">
                    <div className="pv-desk-cover" style={ink}>
                      {showEn ? <span className="pv-kicker">{hostsEn}</span> : null}
                      {showMl ? <span className="pv-ml">{hostsMl}</span> : null}
                      <h2>
                        {n1}
                        {n2 ? <><br /><span className="pv-amp" style={{ color: colour.accent, fontSize: 30 }}>&amp;</span><br />{n2}</> : null}
                      </h2>
                      <span className="pv-band" style={{ borderColor: colour.accent }} />
                      <strong>{dateText}</strong>
                    </div>
                    <div className="pv-desk-main">
                      <h2>You're invited</h2>
                      <p>{sample.message || `Join us at ${venueText}.`}</p>
                      <div>
                        {functions.map((item) => (
                          <div className="pv-row" key={item.title} style={{ marginBottom: 8 }}>
                            <strong>{item.title}</strong>
                            <span>{item.when}</span>
                          </div>
                        ))}
                      </div>
                      {template.asks.location ? <div className="pv-map">{sample.address || venueText}</div> : null}
                      <div className="pv-rsvp">
                        <span className="pv-yes">RSVP now</span>
                        <span className="pv-no">Add to calendar</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            <p className="pv-note">Preview updates as you type. Sample text is replaced with your own when you customise.</p>
          </section>

          <aside className="pv-side">
            <section className="pv-panel">
              <div className="pv-try">
              <div>
                <h2>Try it with your details</h2>
                <p className="hint">Nothing is saved until you use the template.</p>
              </div>
              <div className="pv-grid">
                <div className="pv-field">
                  <label htmlFor="pv-n1">First name</label>
                  <input id="pv-n1" value={first} onChange={(event) => setFirst(event.target.value)} />
                </div>
                <div className="pv-field">
                  <label htmlFor="pv-n2">Second name</label>
                  <input id="pv-n2" value={second} onChange={(event) => setSecond(event.target.value)} />
                </div>
              </div>
              <div className="pv-field">
                <label htmlFor="pv-date">Date</label>
                <input id="pv-date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <div className="pv-field">
                <label htmlFor="pv-venue">Venue</label>
                <input id="pv-venue" value={venue} onChange={(event) => setVenue(event.target.value)} />
              </div>
              </div>
              <div className="pv-lang">
                <span>Language</span>
                <div className="pv-langs" role="group" aria-label="Language">
                  {([["en", "English"], ["ml", "മലയാളം"], ["both", "Bilingual"]] as const).map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={lang === id} onClick={() => setLang(id)}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="pv-colours">
                <span>Colour · <span style={{ fontWeight: 500, color: "#716A6D" }}>{colour.name}</span></span>
                <div className="pv-swatches">
                  {VARIANTS.map((item, index) => (
                    <button key={item.name} type="button" aria-label={item.name} aria-pressed={variant === index} style={{ background: item.bg }} onClick={() => setVariant(index)}>
                      <i style={{ background: item.accent }} />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="pv-panel pv-about">
              <h2>About this design</h2>
              <p>{template.description}</p>
              <div className="pv-facts">
                <div><span>Best for</span><strong>{eventLabels(template)}</strong></div>
                <div><span>Languages</span><strong>English, Malayalam, bilingual</strong></div>
                <div><span>Includes</span><strong>{extras(template)}</strong></div>
                <div><span>Price</span><strong>{formatPrice(template)}</strong></div>
              </div>
              <div className="pv-lock">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A5A26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <span>
                  {template.free
                    ? "This design is free. Customise it, then share when you're ready."
                    : `One-time purchase of ${formatPrice(template)}. Try your details here, and pay only when you're ready to share.`}
                </span>
              </div>
              <Link className="pv-customise" to={useTo}>{owned ? "Customise this design" : useLabel}</Link>
            </section>
          </aside>
        </div>

        {similar.length ? (
          <section className="pv-similar">
            <div className="pv-similar-head">
              <h2>You might also like</h2>
              <Link to="/templates">See all templates</Link>
            </div>
            <div className="pv-like">
              {similar.map((item) => {
                const sampleEvent = item.events[0];
                return (
                  <Link key={item.id} to={`/preview/${item.id}`}>
                    <div className="pv-like-shot">
                      <InviteView template={item} fields={sampleFor(item, sampleEvent)} />
                    </div>
                    <div className="pv-like-meta">
                      <strong>{item.name}</strong>
                      <span className={item.free ? "pv-badge free" : "pv-badge gold"}>{item.free ? "Free" : "Premium"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <div className="pv-dock">
        <div>
          <div className="pv-dock-k">{template.free ? "Free" : "Premium"}</div>
          <div className="pv-dock-v">{owned ? "Ready to use" : template.free ? "Included" : "Pay when you share"}</div>
        </div>
        <Link to={useTo}>{owned ? "Use this template" : useLabel}</Link>
      </div>

      {toast ? (
        <div className="pv-toast" role="status">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9DB8A2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l4 4L19 7" />
          </svg>
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>Dismiss</button>
        </div>
      ) : null}
    </div>
  );
}
