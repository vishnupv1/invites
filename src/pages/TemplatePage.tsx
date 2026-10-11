import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getTemplateRecord } from "../api";
import { FavoriteHeart } from "../components/FavoriteHeart";
import { BackIcon, HeartIcon, PlayIcon, SparkIcon } from "../components/shell/marks";
import { IrApp } from "../components/shell/IrApp";
import { PlayingInvite } from "../components/shell/PlayingInvite";
import { PrimaryButton } from "../components/shell/PrimaryButton";
import { StickyFooterCTA } from "../components/shell/StickyFooterCTA";
import { useFavs } from "../lib/favorites";
import { useSession } from "../session";
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
import { HansaInvite } from "../components/HansaInvite";
import { BloomInvite } from "../components/BloomInvite";
import { PeaceInvite } from "../components/PeaceInvite";
import { VivahInvite } from "../components/VivahInvite";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { getEvent } from "../data/events";
import { eventLabels, formatPrice, getTemplate, sampleFor, templatesFor } from "../data/templates";
import { templateSeo, topicForTemplate } from "../data/topics";
import { annaThemeOf, beachThemeOf, botanicaThemeOf, homeThemeOf, moonlitThemeOf, palaceThemeOf, pastalThemeOf, peaceThemeOf, pullThemeOf, shaadiThemeOf, thiruThemeOf, villaThemeOf, vivahThemeOf } from "../lib/themes";
import { useLibrary } from "../state";
import type { EventId, InviteFields, Template } from "../types";
import { formatShortDate } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { trackTemplatePreview } from "../lib/analytics";
import "./purchase.css";
import "./shell-detail.css";

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
    case "hansa":
      return <HansaInvite fields={fields} />;
    case "bloom":
      return <BloomInvite fields={fields} />;
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

export function TemplatePage({ library = false }: { library?: boolean }) {
  useFonts("Noto Sans Tamil");
  const { id } = useParams();
  const [params] = useSearchParams();
  const template = getTemplate(id);
  useEffect(() => {
    if (!template) return;
    trackTemplatePreview(template);
  }, [template]);
  const { favs, toggle } = useFavs();
  const [livePrice, setLivePrice] = useState<number | null>(null);
  useEffect(() => {
    if (!id) return;
    let cancel = false;
    getTemplateRecord(id)
      .then((row) => {
        if (!cancel && typeof row.price === "number") setLivePrice(row.price);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [id]);
  const { owns, purchase, grant } = useLibrary();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<"phone" | "desk">(() =>
    window.matchMedia("(max-width: 720px)").matches ? "phone" : "desk",
  );
  const [swatchFor, setSwatchFor] = useState<{ id: string; swatch: string } | null>(null);
  const [lang, setLang] = useState<ThiruvizhaLang>("both");
  const { signedIn, ready } = useSession();
  const account = ready && signedIn;
  const requested = params.get("event") as EventId | null;
  const [picked, setPicked] = useState<EventId | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [openingTake, setOpeningTake] = useState(0);
  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    const play = window.setTimeout(() => {
      const opener = [...root.querySelectorAll("button")].find((button) => {
        const label = button.getAttribute("aria-label") ?? "";
        return /^(break the seal|open invitation|open the invitation|tear open|untie the ribbon|light the lantern|pull the rope|open the doors|enter the invitation|lift the veil|open the door|open your gift)/i.test(label);
      });
      opener?.click();
    }, 300);
    const close = window.setTimeout(() => setOpeningTake((take) => take + 1), 2300);
    return () => {
      window.clearTimeout(play);
      window.clearTimeout(close);
    };
  }, [id, swatchFor, lang, picked, openingTake]);
  const event =
    template && picked && template.events.includes(picked)
      ? picked
      : template && requested && template.events.includes(requested)
        ? requested
        : template?.events[0];

  if (!template || !event) return <Navigate to="/browse" replace />;
  const owned = account && owns(template.id, template.free);
  const createTo = `/create/${template.id}?event=${event}`;
  if (owned && !library) return <Navigate to="/templates" replace />;
  const catalogTo = account ? "/templates" : "/browse";
  const previewTo = `/browse/${template.id}`;

  const swatch = swatchFor?.id === template.id ? swatchFor.swatch : template.meta.defaultTheme;
  const themeName = template.meta.themes.find((item) => item.id === swatch)?.name;
  const fields = sampleFor(template, event);
  const others = templatesFor(event).filter((item) => item.id !== template.id).slice(0, 4);
  const tamil = template.style === "thiruvizha";
  const seo = templateSeo(template.id);
  const topic = topicForTemplate(template.id);
  const amount = livePrice ?? template.price;
  const priceLabel = amount === 0 ? "Free" : `₹${amount.toLocaleString("en-IN")}`;
  const sentence = template.description.split(".")[0]?.trim() || template.tagline;
  const blurb = sentence.length > 42 ? `${sentence.slice(0, 40).trim()}…` : sentence;
  const included = [
    "Animated opening",
    "Unlimited guests",
    "RSVP per function",
    "Maps & directions",
    "Photos & music",
    "Free edits forever",
  ];

  return (
    <IrApp>
    <div className="ir-detail">
      <header className="ir-detail-bar">
        <Link className="ir-detail-bar-back" to={catalogTo} aria-label="Back to templates"><BackIcon /></Link>
        <p><Link to={catalogTo}>Templates</Link> <span>/</span> {template.name}</p>
        <button className="ir-detail-save-desk" type="button" aria-pressed={favs.includes(template.id)} onClick={() => toggle(template.id)}>
          <HeartIcon /> {favs.includes(template.id) ? "Saved" : "Save"}
        </button>
      </header>
      <div className="ir-detail-scroll">
      <div className="ir-detail-stage">
        <Link className="ir-detail-back" to={catalogTo} aria-label="Back to templates"><BackIcon /></Link>
        <FavoriteHeart className="ir-detail-save" liked={favs.includes(template.id)} name={template.name} onClick={() => toggle(template.id)} />
        <div ref={previewRef} className={device === "desk" ? "ir-detail-frame is-desk" : "ir-detail-frame"}>
          <GuestPreview key={openingTake} template={template} fields={fields} swatch={swatch} lang={lang} />
        </div>
        <p className="ir-detail-pill"><PlayIcon /> Playing the opening</p>
      </div>
      <div className="ir-detail-info">
        <div className="ir-detail-head">
          <div>
            <p className="ir-detail-kicker">{getEvent(event).label}</p>
            <h1 className="ir-display">{template.name}</h1>
            <p className="ir-detail-blurb">{blurb}</p>
            <p className="ir-detail-lead">{template.description}</p>
          </div>
          <p className="ir-detail-price">
            <b className="ir-display">{priceLabel}</b>
            <span>{amount === 0 ? "to publish" : "one-time"}</span>
          </p>
        </div>
        <ul className="ir-detail-inc">
          {included.map((item) => (
            <li key={item}><SparkIcon />{item}</li>
          ))}
        </ul>
        <div className="ir-detail-cta">
          <PrimaryButton href={createTo}>Try it with your names</PrimaryButton>
          <p>No sign-up needed to try</p>
        </div>
        <details className="ir-detail-more">
          <summary>More options</summary>
          {seo ? <p>{seo.lead}</p> : null}
          <p>{template.description}</p>
          <Breadcrumbs
            items={account
              ? [{ label: "Dashboard", to: "/studio" }, { label: "Templates", to: "/templates" }, { label: template.name }]
              : [{ label: "Home", to: "/" }, ...(topic ? [{ label: topic.label, to: topic.path }] : [{ label: "Templates", to: "/browse" }]), { label: template.name }]}
          />
          <div className="buy-seg" role="group" aria-label="Invitation size">
            <button type="button" aria-pressed={device === "phone"} onClick={() => setDevice("phone")}>Mobile</button>
            <button type="button" aria-pressed={device === "desk"} onClick={() => setDevice("desk")}>Desktop</button>
          </div>
          <Link to={previewTo}>Open the full page</Link>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

            {owned ? null : (
              <>
                <div className="buy-lock">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C3A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  <span>Design free. Pay {formatPrice(template)} once when you publish. Razorpay collects the payment.</span>
                </div>
                <button className="buy-ghost" type="button" onClick={() => setOpen(true)}>
                  Buy now · {formatPrice(template)}
                </button>
              </>
            )}
        </details>

        {others.length ? (
          <section className="buy-more">
            <div className="buy-more-head">
              <h2>More for {getEvent(event).label.toLowerCase()}</h2>
              <Link to={catalogTo}>See all templates</Link>
            </div>
            <div className="buy-like">
              {others.map((item) => (
                <Link key={item.id} to={`/template/${item.id}?event=${event}`}>
                  <div className="buy-like-shot">
                    <PlayingInvite template={item} />
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
      </div>

      {open ? null : (
        <StickyFooterCTA href={createTo} label="Try it with your names" note="Free to try — you only pay when you publish" />
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
          onEntitled={async () => {
            grant(template.id);
            navigate(createTo);
          }}
        />
      ) : null}
    </div>
    </IrApp>
  );
}
