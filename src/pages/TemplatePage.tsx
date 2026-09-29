import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../session";
import { AppMenu } from "../components/AppMenu";
import { AnnaInvite, type AnnaTheme } from "../components/AnnaInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { BaptismInvite, type BaptismTheme } from "../components/BaptismInvite";
import { BeachInvite, type BeachTheme } from "../components/BeachInvite";
import { Checkout } from "../components/Checkout";
import { GazalInvite } from "../components/GazalInvite";
import { HomeInvite, type HomeTheme } from "../components/HomeInvite";
import { InviteView } from "../components/InviteView";
import { ShaadiInvite, type ShaadiTheme } from "../components/ShaadiInvite";
import { ThiruvizhaInvite, type ThiruvizhaLang, type ThiruvizhaTheme } from "../components/ThiruvizhaInvite";
import { PeaceInvite, type PeaceTheme } from "../components/PeaceInvite";
import { VivahInvite, type VivahTheme } from "../components/VivahInvite";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { getEvent } from "../data/events";
import { eventLabels, formatPrice, getTemplate, sampleFor, templatesFor } from "../data/templates";
import { useLibrary } from "../state";
import type { EventId, InviteFields, Template } from "../types";
import "./purchase.css";

const TONES: Record<string, { cover: string; dot: string }> = {
  terracotta: { cover: "#F6F0E6", dot: "#A44B32" },
  plum: { cover: "#4A263E", dot: "#D9B26A" },
  emerald: { cover: "#12352B", dot: "#D9B26A" },
  sky: { cover: "#DCEBF7", dot: "#2F5E8A" },
  rose: { cover: "#F6DCE2", dot: "#9B4A5E" },
  midnight: { cover: "#1B2433", dot: "#D9B26A" },
  rani: { cover: "#4A0D1F", dot: "#F5D77A" },
  ivory: { cover: "#F6EFE4", dot: "#7A1633" },
  blush: { cover: "#F8E6E4", dot: "#C27A78" },
  noir: { cover: "#1C1718", dot: "#E8C987" },
  sage: { cover: "#E4EBE3", dot: "#6E8A72" },
};

function annaThemeOf(swatch: string): AnnaTheme {
  if (swatch === "emerald") return "sage";
  if (swatch === "midnight") return "dusk";
  return "terracotta";
}
function homeThemeOf(swatch: string): HomeTheme {
  if (swatch === "rose") return "sunset";
  if (swatch === "midnight") return "night";
  return "day";
}
function beachThemeOf(swatch: string): BeachTheme {
  if (swatch === "sky") return "tropical";
  if (swatch === "plum") return "dusk";
  return "sunset";
}
function vivahThemeOf(swatch: string): VivahTheme {
  if (swatch === "emerald") return "emerald";
  if (swatch === "plum") return "royal";
  return "midnight";
}
function shaadiThemeOf(swatch: string): ShaadiTheme {
  if (swatch === "emerald") return "emerald";
  if (swatch === "ivory") return "ivory";
  return "rani";
}
function peaceThemeOf(swatch: string): PeaceTheme {
  if (swatch === "noir") return "noir";
  if (swatch === "sage") return "sage";
  return "blush";
}
function thiruThemeOf(swatch: string): ThiruvizhaTheme {
  if (swatch === "ivory") return "ivory";
  if (swatch === "emerald") return "emerald";
  return "rani";
}
function baptismThemeOf(swatch: string): BaptismTheme {
  if (swatch === "rose") return "blush";
  if (swatch === "emerald") return "sage";
  return "sky";
}

function GuestPreview({ template, fields, swatch, lang }: { template: Template; fields: InviteFields; swatch: string; lang: ThiruvizhaLang }) {
  switch (template.style) {
    case "gazal":
      return <GazalInvite fields={fields} quiet />;
    case "aurelia":
      return <AureliaInvite fields={fields} quiet />;
    case "anna":
      return <AnnaInvite fields={fields} quiet theme={annaThemeOf(swatch)} />;
    case "baptism":
      return <BaptismInvite fields={fields} quiet theme={baptismThemeOf(swatch)} />;
    case "vivah":
      return <VivahInvite fields={fields} quiet theme={vivahThemeOf(swatch)} />;
    case "beach":
      return <BeachInvite fields={fields} quiet theme={beachThemeOf(swatch)} />;
    case "home":
      return <HomeInvite fields={fields} quiet theme={homeThemeOf(swatch)} />;
    case "shaadi":
      return <ShaadiInvite fields={fields} theme={shaadiThemeOf(swatch)} />;
    case "thiruvizha":
      return <ThiruvizhaInvite fields={fields} theme={thiruThemeOf(swatch)} lang={lang} />;
    case "peace":
      return <PeaceInvite fields={fields} theme={peaceThemeOf(swatch)} />;
    default:
      return <InviteView template={template} fields={fields} />;
  }
}

export function TemplatePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const template = getTemplate(id);
  const { owns, purchase } = useLibrary();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<"phone" | "desk">(() =>
    window.matchMedia("(max-width: 720px)").matches ? "phone" : "desk",
  );
  const [swatchFor, setSwatchFor] = useState<{ id: string; swatch: string } | null>(null);
  const [lang, setLang] = useState<ThiruvizhaLang>("both");
  const { signedIn, host } = useSession();
  const hostName = host?.name ?? "";
  const requested = params.get("event") as EventId | null;
  const [picked, setPicked] = useState<EventId | null>(null);
  const event =
    template && picked && template.events.includes(picked)
      ? picked
      : template && requested && template.events.includes(requested)
        ? requested
        : template?.events[0];

  if (!template || !event) return <Navigate to="/templates" replace />;
  const owned = owns(template.id, template.free);
  const createTo = `/create/${template.id}?event=${event}`;
  if (owned) return <Navigate to="/templates" replace />;

  const swatch = swatchFor?.id === template.id ? swatchFor.swatch : template.meta.defaultTheme;
  const themeName = template.meta.themes.find((item) => item.id === swatch)?.name;
  const fields = sampleFor(template, event);
  const others = templatesFor(event).filter((item) => item.id !== template.id).slice(0, 4);
  const tamil = template.style === "thiruvizha";

  return (
    <div className="board buy-board">
      <AppMenu current="/templates" name={hostName} signedIn={signedIn} />
    <div className="buy">
      <div className="buy-bar">
      <header className="buy-head">
        <div className="buy-id">
          <Link className="buy-back" to="/templates">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#211C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Templates
          </Link>
          <div className="buy-title">
            <h1>{template.name}</h1>
            <span className="buy-badge">{template.free ? "Free" : "Premium"}</span>
          </div>
        </div>
        <div className="buy-head-actions">
          <Link className="buy-ghost" to={`/preview/${template.id}?event=${event}`}>
            Preview
          </Link>
          <button className="buy-solid" type="button" onClick={() => setOpen(true)}>
            Buy once · {formatPrice(template)}
          </button>
        </div>
      </header>
      <Breadcrumbs
        className="buy-crumbs"
        items={[{ label: "Dashboard", to: "/studio" }, { label: "Templates", to: "/templates" }, { label: template.name }]}
      />
      </div>

      <div className="buy-body">
        <div className="buy-split">
          <section className="buy-stage" aria-label="Invitation">
            <div className="buy-tools">
              <div className="buy-seg" role="group" aria-label="Invitation size">
                <button type="button" aria-pressed={device === "phone"} onClick={() => setDevice("phone")}>
                  Mobile
                </button>
                <button type="button" aria-pressed={device === "desk"} onClick={() => setDevice("desk")}>
                  Desktop
                </button>
              </div>
              <p>The page a guest opens.</p>
            </div>
            <div className={device === "desk" ? "buy-screen is-desk" : "buy-screen"}>
              <GuestPreview template={template} fields={fields} swatch={swatch} lang={lang} />
            </div>
          </section>

          <aside className="buy-panel">
            <div>
              <p className="buy-kicker">One-time purchase</p>
              <p className="buy-price">{formatPrice(template)}</p>
            </div>
            <p className="buy-lede">{template.description}</p>
            <dl className="buy-facts">
              <div>
                <dt>Best for</dt>
                <dd>{eventLabels(template)}</dd>
              </div>
              <div>
                <dt>Sample</dt>
                <dd>{fields.names}</dd>
              </div>
              {tamil ? (
                <div>
                  <dt>Languages</dt>
                  <dd>English, Tamil, or both</dd>
                </div>
              ) : null}
              {template.asks.audio ? (
                <div>
                  <dt>Music</dt>
                  <dd>{tamil ? "One nadaswaram" : "One track"}</dd>
                </div>
              ) : null}
            </dl>

            {template.events.length > 1 ? (
              <div className="buy-block">
                <span>Occasion</span>
                <div className="buy-langs" role="group" aria-label="Occasion">
                  {template.events.map((item) => (
                    <button key={item} type="button" aria-pressed={item === event} onClick={() => setPicked(item)}>
                      {getEvent(item).label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {template.meta.themes.length > 1 ? (
              <div className="buy-block">
                <span>Colour{themeName ? ` · ${themeName}` : ""}</span>
                <div className="buy-swatches" role="group" aria-label="Colour">
                  {template.meta.themes.map((item) => {
                    const tone = TONES[item.id] ?? { cover: "#F6F0E6", dot: "#6B3A5B" };
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={item.name}
                        aria-pressed={swatch === item.id}
                        style={{ background: tone.cover }}
                        onClick={() => setSwatchFor({ id: template.id, swatch: item.id })}
                      >
                        <i style={{ background: tone.dot }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {tamil ? (
              <div className="buy-block">
                <span>Language</span>
                <div className="buy-langs" role="group" aria-label="Language">
                  {(
                    [
                      ["en", "English"],
                      ["ta", "தமிழ்"],
                      ["both", "Both"],
                    ] as const
                  ).map(([item, label]) => (
                    <button key={item} type="button" aria-pressed={lang === item} onClick={() => setLang(item)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="buy-block">
              <h2>In this design</h2>
              <ul className="buy-list">
                {template.meta.components.map((item) => (
                  <li key={item.id}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B3A5B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12l4 4L19 7" />
                    </svg>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="buy-lock">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A5A26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <span>Pay {formatPrice(template)} once, then add your names, photos and wording. Demo checkout — nothing is charged.</span>
            </div>

            <div className="buy-actions">
              <button className="buy-solid" type="button" onClick={() => setOpen(true)}>
                Buy once · {formatPrice(template)}
              </button>
              <Link className="buy-ghost" to={`/preview/${template.id}?event=${event}`}>
                Open the full preview
              </Link>
            </div>
          </aside>
        </div>

        {others.length ? (
          <section className="buy-more">
            <div className="buy-more-head">
              <h2>More for {getEvent(event).label.toLowerCase()}</h2>
              <Link to="/templates">See all templates</Link>
            </div>
            <div className="buy-like">
              {others.map((item) => (
                <Link key={item.id} to={`/template/${item.id}?event=${event}`}>
                  <div className="buy-like-shot">
                    <img src={`/covers/${item.id}.jpg`} alt="" />
                  </div>
                  <div className="buy-like-meta">
                    <strong>{item.name}</strong>
                    <span>{formatPrice(item)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {open ? null : (
        <div className="buy-dock">
          <div>
            <span className="buy-dock-k">One-time</span>
            <span className="buy-dock-v">{formatPrice(template)}</span>
          </div>
          <button className="buy-solid" type="button" onClick={() => setOpen(true)}>
            Buy once
          </button>
        </div>
      )}

      {open ? (
        <Checkout
          template={template}
          onClose={() => setOpen(false)}
          onPurchased={async (coupon, payment) => {
            await purchase(template.id, coupon, payment);
            navigate(createTo);
          }}
        />
      ) : null}
    </div>
    </div>
  );
}
