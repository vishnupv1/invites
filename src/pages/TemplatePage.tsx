import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../session";
import { AppMenu } from "../components/AppMenu";
import { AnnaInvite } from "../components/AnnaInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { BaptismInvite } from "../components/BaptismInvite";
import { BeachInvite } from "../components/BeachInvite";
import { BotanicaInvite } from "../components/BotanicaInvite";
import { Checkout } from "../components/Checkout";
import { GazalInvite } from "../components/GazalInvite";
import { GrandDoorInvite } from "../components/GrandDoorInvite";
import { GrandEnvelopeInvite } from "../components/GrandEnvelopeInvite";
import { HeavenlyInvite } from "../components/HeavenlyInvite";
import { PullInvite } from "../components/PullInvite";
import { InlandInvite } from "../components/InlandInvite";
import { HomeInvite } from "../components/HomeInvite";
import { InviteView } from "../components/InviteView";
import { ShaadiInvite } from "../components/ShaadiInvite";
import { ThiruvizhaInvite, type ThiruvizhaLang } from "../components/ThiruvizhaInvite";
import { PastalInvite } from "../components/PastalInvite";
import { PalaceInvite } from "../components/PalaceInvite";
import { MoonlitInvite } from "../components/MoonlitInvite";
import { VillaInvite } from "../components/VillaInvite";
import { PeaceInvite } from "../components/PeaceInvite";
import { VivahInvite } from "../components/VivahInvite";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { getEvent } from "../data/events";
import { eventLabels, formatPrice, getTemplate, sampleFor, templatesFor, designCtaLabel } from "../data/templates";
import { templateSeo, topicForTemplate } from "../data/topics";
import { annaThemeOf, beachThemeOf, botanicaThemeOf, homeThemeOf, moonlitThemeOf, palaceThemeOf, pastalThemeOf, peaceThemeOf, pullThemeOf, shaadiThemeOf, thiruThemeOf, villaThemeOf, vivahThemeOf } from "../lib/themes";
import { useLibrary } from "../state";
import type { EventId, InviteFields, Template } from "../types";
import { formatShortDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { trackTemplatePreview } from "../lib/analytics";
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
  gold: { cover: "#1E120A", dot: "#E6C27A" },
  burgundy: { cover: "#4A0716", dot: "#F3DDA8" },
  post: { cover: "#CFE2F2", dot: "#C8342B" },
  wine: { cover: "#1A0C0A", dot: "#E8C987" },
};

function GuestPreview({ template, fields, swatch, lang }: { template: Template; fields: InviteFields; swatch: string; lang: ThiruvizhaLang }) {
  switch (template.style) {
    case "gazal":
      return <GazalInvite fields={fields} />;
    case "aurelia":
      return <AureliaInvite fields={fields} />;
    case "anna":
      return <AnnaInvite fields={fields} theme={annaThemeOf(swatch)} />;
    case "baptism":
      return <BaptismInvite fields={fields} demo />;
    case "vivah":
      return <VivahInvite fields={fields} theme={vivahThemeOf(swatch)} demo />;
    case "beach":
      return <BeachInvite fields={fields} theme={beachThemeOf(swatch)} />;
    case "botanica":
      return <BotanicaInvite fields={fields} theme={botanicaThemeOf(swatch)} />;
    case "heavenly":
      return <HeavenlyInvite fields={fields} demo />;
    case "grandoor":
      return <GrandDoorInvite fields={fields} demo />;
    case "grandenvelope":
      return <GrandEnvelopeInvite fields={fields} demo autoPlay />;
    case "pull":
      return <PullInvite fields={fields} theme={pullThemeOf(swatch)} demo />;
    case "inland":
      return <InlandInvite fields={fields} demo autoOpen />;
    case "pastal":
      return <PastalInvite fields={fields} theme={pastalThemeOf(swatch)} />;
    case "palace":
      return <PalaceInvite fields={fields} theme={palaceThemeOf(swatch)} />;
    case "moonlit":
      return <MoonlitInvite fields={fields} theme={moonlitThemeOf(swatch)} />;
    case "villa":
      return <VillaInvite fields={fields} theme={villaThemeOf(swatch)} />;
    case "home":
      return <HomeInvite fields={fields} theme={homeThemeOf(swatch)} demo />;
    case "shaadi":
      return <ShaadiInvite fields={fields} theme={shaadiThemeOf(swatch)} />;
    case "thiruvizha":
      return <ThiruvizhaInvite fields={fields} theme={thiruThemeOf(swatch)} lang={lang} />;
    case "peace":
      return <PeaceInvite fields={fields} theme={peaceThemeOf(swatch)} demo />;
    default:
      return <InviteView template={template} fields={fields} />;
  }
}

export function TemplatePage() {
  useFonts("Noto Sans Tamil");
  const { id } = useParams();
  const [params] = useSearchParams();
  const template = getTemplate(id);
  useEffect(() => {
    if (!template) return;
    trackTemplatePreview(template);
  }, [template]);
  const { owns, purchase } = useLibrary();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<"phone" | "desk">(() =>
    window.matchMedia("(max-width: 720px)").matches ? "phone" : "desk",
  );
  const [swatchFor, setSwatchFor] = useState<{ id: string; swatch: string } | null>(null);
  const [lang, setLang] = useState<ThiruvizhaLang>("both");
  const { signedIn, host, ready } = useSession();
  const account = ready && signedIn;
  const hostName = host?.name ?? "";
  const requested = params.get("event") as EventId | null;
  const [picked, setPicked] = useState<EventId | null>(null);
  const event =
    template && picked && template.events.includes(picked)
      ? picked
      : template && requested && template.events.includes(requested)
        ? requested
        : template?.events[0];

  if (!template || !event) return <Navigate to="/browse" replace />;
  const owned = account && owns(template.id, template.free);
  const createTo = `/create/${template.id}?event=${event}`;
  if (owned) return <Navigate to="/templates" replace />;
  const catalogTo = account ? "/templates" : "/browse";
  const previewTo = account ? `/preview/${template.id}?event=${event}` : `/browse/${template.id}`;

  const swatch = swatchFor?.id === template.id ? swatchFor.swatch : template.meta.defaultTheme;
  const themeName = template.meta.themes.find((item) => item.id === swatch)?.name;
  const fields = sampleFor(template, event);
  const others = templatesFor(event).filter((item) => item.id !== template.id).slice(0, 4);
  const tamil = template.style === "thiruvizha";
  const seo = templateSeo(template.id);
  const topic = topicForTemplate(template.id);

  return (
    <div className={account ? "board buy-board is-account" : "board buy-board"}>
      {account ? <AppMenu current="/templates" name={hostName} signedIn /> : null}
    <div className="buy">
      <div className="buy-bar">
      <header className="buy-head">
        <div className="buy-id">
          <Link className="buy-back" to={catalogTo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A1527" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <Link className="buy-ghost" to="/faq">
            FAQ
          </Link>
          <Link className="buy-ghost" to="/#pricing">
            Pricing
          </Link>
          <Link className="buy-ghost" to={previewTo}>
            Preview
          </Link>
          <Link className="buy-solid" to={createTo}>
            {designCtaLabel(template)}
          </Link>
        </div>
      </header>
      <Breadcrumbs
        className="buy-crumbs"
        items={account
          ? [{ label: "Dashboard", to: "/studio" }, { label: "Templates", to: "/templates" }, { label: template.name }]
          : [{ label: "Home", to: "/" }, ...(topic ? [{ label: topic.label, to: topic.path }] : [{ label: "Templates", to: "/browse" }]), { label: template.name }]}
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
            <Link className="buy-solid buy-under" to={createTo}>
              {designCtaLabel(template)}
            </Link>
          </section>

          <aside className="buy-panel">
            <div>
              {seo ? <p className="buy-search">{seo.heading}</p> : null}
              <p className="buy-kicker">One-time purchase</p>
              <p className="buy-price">{formatPrice(template)}</p>
            </div>
            <p className="buy-lede">{template.description}</p>
            {seo ? <p className="buy-note">{seo.lead}</p> : null}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D81B60" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12l4 4L19 7" />
                    </svg>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <p className="buy-help">
              <Link to="/#pricing">Pricing</Link>
              <Link to="/faq">FAQ</Link>
            </p>

            <div className="buy-lock">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A5A26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <span>Design free. Pay {formatPrice(template)} once when you publish. Razorpay collects the payment.</span>
            </div>

            <div className="buy-actions">
              <Link className="buy-solid" to={createTo}>
                {designCtaLabel(template)}
              </Link>
              <button className="buy-ghost" type="button" onClick={() => setOpen(true)}>
                Buy now · {formatPrice(template)}
              </button>
            </div>
          </aside>
        </div>

        {others.length ? (
          <section className="buy-more">
            <div className="buy-more-head">
              <h2>More for {getEvent(event).label.toLowerCase()}</h2>
              <Link to="/browse">See all templates</Link>
            </div>
            <div className="buy-like">
              {others.map((item) => (
                <Link key={item.id} to={`/template/${item.id}?event=${event}`}>
                  <div className="buy-like-shot">
                    <img src={`/covers/${item.id}.jpg`} alt={`${item.name} invitation`} />
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
          <Link className="buy-solid" to={createTo}>
            {designCtaLabel(template)}
          </Link>
        </div>
      )}

      {open ? (
        <Checkout
          template={template}
          detail={[fields.names, getEvent(event).label, fields.date ? formatShortDate(fields.date) : ""].filter(Boolean).join(" · ")}
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
