import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { NotFound } from "./Unauthorized";
// import { getTemplateRecord } from "../api";
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
import { Baptism2Invite } from "../components/Baptism2Invite";
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
import { LaceInvite } from "../components/LaceInvite";
import { GoaInvite } from "../components/GoaInvite";
import { LotusInvite } from "../components/LotusInvite";
import { RoseInvite } from "../components/RoseInvite";
import { FirstDanceInvite, firstDanceThemeOf } from "../components/FirstDanceInvite";
import { SatinBowInvite } from "../components/SatinBowInvite";
import { WeddingRideInvite } from "../components/WeddingRideInvite";
import { StarryFairytaleInvite } from "../components/StarryFairytaleInvite";
import { PeaceInvite } from "../components/PeaceInvite";
import { VivahInvite } from "../components/VivahInvite";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { SiteFooter } from "../components/SiteFooter";
import { getEvent } from "../data/events";
import { eventLabels, formatPrice, getTemplate, sampleFor, templatesFor } from "../data/templates";
import phrases from "../data/template-phrases.json" with { type: "json" };
import { primaryTopicForTemplate, templateSeo, topicsForTemplate } from "../data/topics";
import { templateFacts } from "../lib/template-facts.mjs";
import { annaThemeOf, baptism2ThemeOf, beachThemeOf, botanicaThemeOf, homeThemeOf, moonlitThemeOf, palaceThemeOf, pastalThemeOf, peaceThemeOf, pullThemeOf, shaadiThemeOf, thiruThemeOf, villaThemeOf, vivahThemeOf, weddingRideThemeOf } from "../lib/themes";
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
  twilight: { cover: "#2A221C", dot: "#E9D8B8" },
};

function GuestPreview({ template, fields, swatch, lang }: { template: Template; fields: InviteFields; swatch: string; lang: ThiruvizhaLang }) {
  switch (template.style) {
    case "gazal":
      return <GazalInvite fields={fields} />;
    case "aurelia":
      return <AureliaInvite fields={fields} />;
    case "anna":
      return <AnnaInvite fields={fields} theme={annaThemeOf(swatch)} />;
    case "baptism2":
      return <Baptism2Invite fields={fields} theme={baptism2ThemeOf(swatch)} demo />;
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
    case "lace":
      return <LaceInvite fields={fields} />;
    case "goa":
      return <GoaInvite fields={fields} />;
    case "lotus":
      return <LotusInvite fields={fields} />;
    case "rose":
      return <RoseInvite fields={fields} />;
    case "firstdance":
      return <FirstDanceInvite fields={fields} theme={firstDanceThemeOf(swatch)} />;
    case "satinbow":
      return <SatinBowInvite fields={fields} />;
    case "starryfairytale":
      return <StarryFairytaleInvite fields={fields} />;
    case "weddingride":
      return <WeddingRideInvite fields={fields} theme={weddingRideThemeOf(swatch)} />;
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

function TemplateFacts({ template, occasions }: { template: Template; occasions: string[] }) {
  const facts = templateFacts(template, phrases[template.id as keyof typeof phrases], occasions);
  return (
    <section className="occasion-copy">
      <h2>What's included</h2>
      <ul>
        {facts.included.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <h2>Suitable for</h2>
      <p>{facts.suitable.join(", ")}</p>
      <h2>Languages</h2>
      <p>{facts.languages.join(", ")}</p>
      <h2>What guests see</h2>
      <p>{facts.guestSees}</p>
      <h2>Price</h2>
      <p>{facts.price}</p>
      <h2>Questions</h2>
      {facts.faqs.map((item) => (
        <details key={item.q} open>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </section>
  );
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
  // const [livePrice, setLivePrice] = useState<number | null>(null);
  // useEffect(() => {
  //   if (!id) return;
  //   let cancel = false;
  //   getTemplateRecord(id)
  //     .then((row) => {
  //       if (!cancel && typeof row.price === "number") setLivePrice(row.price);
  //     })
  //     .catch(() => undefined);
  //   return () => {
  //     cancel = true;
  //   };
  // }, [id]);
  const { owns, purchase, grant, loadPurchases } = useLibrary();
  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);
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
  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    let play = 0;
    let tries = 0;
    const attempt = () => {
      const opener = [...root.querySelectorAll("button")].find((button) => {
        const label = (button.getAttribute("aria-label") || button.textContent || "").replace(/\s+/g, " ").trim();
        return /^(break the seal|open invitation|open the invitation|tear open|untie the ribbon|light the lantern|pull the rope|open the doors|enter the invitation|lift the veil|open the door|open your gift|reveal the date|tap the bottle)/i.test(label);
      });
      if (!opener && tries < 30) {
        tries += 1;
        play = window.setTimeout(attempt, 40);
        return;
      }
      opener?.click();
    };
    play = window.setTimeout(attempt, 300);
    return () => window.clearTimeout(play);
  }, [id, swatchFor, lang, picked]);
  const event =
    template && picked && template.events.includes(picked)
      ? picked
      : template && requested && template.events.includes(requested)
        ? requested
        : template?.events[0];

  if (!template || !event) return <NotFound />;
  const owned = account && owns(template.id, template.free);
  const createTo = `/create/${template.id}?event=${event}&from=template&fresh=1`;
  if (owned && !library) return <Navigate to="/templates" replace />;
  const catalogTo = "/browse";
  const previewTo = `/browse/${template.id}`;

  const swatch = swatchFor?.id === template.id ? swatchFor.swatch : template.meta.defaultTheme;
  const themeName = template.meta.themes.find((item) => item.id === swatch)?.name;
  const fields = sampleFor(template, event);
  const others = templatesFor(event).filter((item) => item.id !== template.id).slice(0, 4);
  const tamil = template.style === "thiruvizha";
  const seo = templateSeo(template.id);
  const occasionTopics = topicsForTemplate(template.id);
  const topic = primaryTopicForTemplate(template.id);
  const crumbs = [
    { label: "Home", to: "/" },
    ...(topic ? [{ label: topic.label, to: topic.path }] : [{ label: "Templates", to: "/browse" }]),
    { label: template.name },
  ];
  // const amount = livePrice ?? template.price;
  // const priceLabel = amount === 0 ? "Free" : `₹${amount.toLocaleString("en-IN")}`;
  const priceLabel = "Free";
  /*
  {owned ? null : (
    <>
      <div className="buy-lock">
        <span>Design free. Pay {formatPrice(template)} once when you publish. Razorpay collects the payment.</span>
      </div>
      <button className="buy-ghost" type="button" onClick={() => setOpen(true)}>
        Buy now · {formatPrice(template)}
      </button>
    </>
  )}
  <span>{amount === 0 ? "to publish" : "one-time"}</span>
  */
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
        <p>
          <Link to="/">Home</Link>
          <span>›</span>
          {topic ? <Link to={topic.path}>{topic.label}</Link> : <Link to={catalogTo}>Templates</Link>}
          <span>›</span>
          {template.name}
        </p>
        <button className="ir-detail-save-desk" type="button" aria-pressed={favs.includes(template.id)} onClick={() => toggle(template.id)}>
          <HeartIcon /> {favs.includes(template.id) ? "Saved" : "Save"}
        </button>
      </header>
      <div className="ir-detail-scroll">
      <div className="ir-detail-stage">
        <Link className="ir-detail-back" to={catalogTo} aria-label="Back to templates"><BackIcon /></Link>
        <FavoriteHeart className="ir-detail-save" liked={favs.includes(template.id)} name={template.name} onClick={() => toggle(template.id)} />
        <div ref={previewRef} className={device === "desk" ? "ir-detail-frame is-desk" : "ir-detail-frame"}>
          <GuestPreview key={`${template.id}-${swatch}-${lang}-${event}`} template={template} fields={fields} swatch={swatch} lang={lang} />
        </div>
        <p className="ir-detail-pill"><PlayIcon /> Playing the opening</p>
      </div>
      <div className="ir-detail-info">
        <Breadcrumbs className="ir-detail-crumbs" items={account
          ? [{ label: "Dashboard", to: "/studio" }, { label: "Templates", to: "/templates" }, { label: template.name }]
          : crumbs} separator="›" />
        <div className="ir-detail-head">
          <div>
            <p className="ir-detail-kicker">{getEvent(event).label}</p>
            <h1 className="ir-display">{template.name}</h1>
            <p className="ir-detail-blurb">{blurb}</p>
            <p className="ir-detail-lead">{template.description}</p>
            {occasionTopics.length ? (
              <nav className="topic-links" aria-label="Occasions">
                {occasionTopics.map((item) => (
                  <Link key={item.id} to={item.path}>{item.label}</Link>
                ))}
              </nav>
            ) : null}
          </div>
          <p className="ir-detail-price">
            <b className="ir-display">{priceLabel}</b>
            <span>to publish</span>
            {/* <span>{amount === 0 ? "to publish" : "one-time"}</span> */}
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
        <TemplateFacts template={template} occasions={occasionTopics.map((item) => item.label)} />
        <details className="ir-detail-more">
          <summary>More options</summary>
          {seo ? <p>{seo.lead}</p> : null}
          <p>{template.description}</p>
          {occasionTopics.length > 1 ? (
            <p className="buy-help">
              {occasionTopics.map((item) => (
                <Link key={item.id} to={item.path}>{item.label}</Link>
              ))}
            </p>
          ) : null}
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

            {/*
              Prices paused. Restore the buy block:
              owned ? null : buy-lock "Design free. Pay formatPrice(template) once when you publish. Razorpay collects the payment."
              and the button "Buy now · formatPrice(template)" that calls setOpen(true).
            */}
        </details>

        {others.length ? (
          <section className="buy-more">
            <div className="buy-more-head">
              <h2>More for {getEvent(event).label.toLowerCase()}</h2>
              <Link to={catalogTo}>See all templates</Link>
            </div>
            <div className="buy-like">
              {others.map((item) => (
                <Link key={item.id} to={`/template/${item.id}`}>
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
        <SiteFooter />
      </div>
      </div>

      {open ? null : (
        <StickyFooterCTA href={createTo} label="Try it with your names" note="Free to publish" />
      )}
      {/* Restore: note="Free to try — you only pay when you publish" */}

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
