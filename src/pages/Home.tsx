import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { DesktopNav } from "../components/shell/DesktopNav";
import { IrApp } from "../components/shell/IrApp";
import { PhoneFrame } from "../components/shell/PhoneFrame";
import { PrimaryButton } from "../components/shell/PrimaryButton";
import { StickyFooterCTA } from "../components/shell/StickyFooterCTA";
import { PlayingInvite } from "../components/shell/PlayingInvite";
import { TemplatePreview } from "../components/shell/TemplatePreview";
import { UnderlineField } from "../components/shell/UnderlineField";
import { ArrowIcon } from "../components/shell/marks";
import { listTemplates } from "../api";
import facts from "../data/site-facts.json" with { type: "json" };
import pageCopy from "../data/page-copy.json" with { type: "json" };
import { publishedTopics } from "../data/topics";
import { SiteFooter } from "../components/SiteFooter";
import { TEMPLATES, getTemplate, sampleFor, withCatalogMeta } from "../data/templates";
import { trackNamesEntered } from "../lib/analytics";
import { saveCoupleNames } from "../lib/couple-names";
import type { Template } from "../types";
import "./shell-home.css";

const FEATURED = ["lotus", "goa", "lace", "rose", "bloom", "hansa", "moonlit", "palace"];

const STEPS = facts.steps;
const FAQS = facts.faqs;

// function rupee(amount: number) {
//   return `₹${amount.toLocaleString("en-IN")}`;
// }
//
// function lowestPaid(templates: Template[]) {
//   const prices = templates.map((item) => item.price).filter((price) => price > 0);
//   return prices.length ? Math.min(...prices) : 0;
// }

function descriptor(template: Template) {
  const line = template.description.split(".")[0]?.trim() ?? template.tagline;
  return line.length > 48 ? `${line.slice(0, 46).trim()}…` : line;
}

function HeroPhone({ template, className = "" }: { template: Template; className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [take, setTake] = useState(0);

  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    let play = 0;
    let again = 0;
    let tries = 0;
    const attempt = () => {
      const opener = [...root.querySelectorAll("button")].find((button) => {
        const label = button.getAttribute("aria-label") ?? "";
        return /^(break the seal|open invitation|open the invitation|tear open|untie the ribbon|light the lantern|pull the rope|open the doors|enter the invitation|lift the veil|open the door|open your gift)/i.test(label);
      });
      if (!opener) {
        if (tries < 30) {
          tries += 1;
          play = window.setTimeout(attempt, 40);
        }
        return;
      }
      opener.click();
      again = window.setTimeout(() => setTake((value) => value + 1), 3000);
    };
    play = window.setTimeout(attempt, 40);
    return () => {
      window.clearTimeout(play);
      window.clearTimeout(again);
    };
  }, [take, template.id]);

  return (
    <div ref={frame} className={`ir-hero-phone${className ? ` ${className}` : ""}`}>
      <PhoneFrame label={`${template.name} preview`}>
        <div aria-hidden="true">
          <TemplatePreview label={`${template.name} preview`} radius={34} interactive>
            <InviteView key={take} template={template} fields={sampleFor(template, template.events[0])} live />
          </TemplatePreview>
        </div>
      </PhoneFrame>
    </div>
  );
}

export function Home({ focus }: { focus?: string }) {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [names, setNames] = useState("");
  const [catalog, setCatalog] = useState<Template[]>(TEMPLATES);
  const [showSticky, setShowSticky] = useState(false);
  const nameCard = useRef<HTMLFormElement>(null);

  useEffect(() => {
    listTemplates()
      .then((rows) => setCatalog(rows.map(withCatalogMeta)))
      .catch(() => setCatalog(TEMPLATES));
  }, []);

  useEffect(() => {
    const card = nameCard.current;
    if (!card) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowSticky(entry.intersectionRatio === 0);
    }, { threshold: [0, 0.6, 1] });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = focus || hash.replace(/^#/, "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [focus, hash, catalog]);

  if (focus === "how" || focus === "features") {
    const heading = focus === "how" ? "How digital wedding invitations work" : "What a digital invitation includes";
    const paragraphs = focus === "how" ? pageCopy.how : pageCopy.features;
    return (
      <IrApp>
        <div className="ir-home">
          <DesktopNav tone="emerald" />
          <section id={focus} className="ir-home-sec">
            <h1 className="ir-display">{heading}</h1>
            {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {focus === "how" ? (
              <ol className="ir-steps">
                {STEPS.map((step) => (
                  <li key={step.n}>
                    <span>{step.n}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="ir-plain">
                {facts.features.map((line) => <li key={line}>{line}</li>)}
              </ul>
            )}
            <p>
              <Link to="/wedding">Digital wedding invitations</Link>
              {" · "}
              <Link to="/faq">Questions</Link>
              {" · "}
              <Link to="/browse">Browse templates</Link>
            </p>
          </section>
          <SiteFooter />
        </div>
      </IrApp>
    );
  }

  if (focus === "faq") {
    return (
      <IrApp>
        <div className="ir-home">
          <DesktopNav tone="emerald" />
          <section id="faq" className="ir-home-sec">
            <h1 className="ir-display">Questions about digital invitations</h1>
            <div className="ir-faqs">
              {FAQS.map((item) => (
                <details key={item.q} open>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>
          <SiteFooter />
        </div>
      </IrApp>
    );
  }

  const byId = new Map(catalog.map((item) => [item.id, item]));
  const featured = FEATURED.map((id) => byId.get(id) ?? getTemplate(id)).filter((item): item is Template => Boolean(item));
  const lead = featured[0] ?? catalog[0];
  const second = featured[1];
  // const from = lowestPaid(catalog);
  const namesInMarquee = catalog.map((item) => item.name);

  function onNames(event: FormEvent) {
    event.preventDefault();
    const value = names.trim();
    if (value) {
      saveCoupleNames(value);
      trackNamesEntered();
    }
    if (lead) navigate(`/create/${lead.id}?fresh=1`);
  }

  return (
    <IrApp>
      <div className="ir-home">
        <DesktopNav tone="emerald" />
        <header className="ir-hero is-emerald">
          <div className="ir-hero-main">
            <div className="ir-hero-copy">
              <p className="ir-overline ir-hero-kicker">Wedding invitations · India</p>
              <h1 className="ir-display">
                Animated digital invitations for <span className="ir-em">weddings</span> and every celebration
              </h1>
              <p className="ir-hero-sub">
                An invitation guests open like a real card — envelope, seal and all. Shared on WhatsApp, with RSVPs for every function.
              </p>
            </div>

            <div className="ir-hero-stage">
              {lead ? <HeroPhone template={lead} /> : null}
              {second ? <HeroPhone template={second} className="ir-hero-phone-back" /> : null}
              <div className="ir-hero-stats">
                <p>
                  <b className="ir-display">5 min</b>
                  <span>to make yours</span>
                </p>
                <p>
                  <b className="ir-display ir-hero-price">Free</b>
                  {/* <b className="ir-display ir-hero-price">{from > 0 ? `From ${rupee(from)}` : "Free"}</b> */}
                  <span>to publish</span>
                  {/* <span>{from > 0 ? "one-time, pay at publish" : "to try a design"}</span> */}
                </p>
                <p className="ir-hero-stat-wide">
                  <b className="ir-display">Free</b>
                  {/* <b className="ir-display">Pay later</b> */}
                  <span>every design, for now</span>
                  {/* <span>design before you sign in</span> */}
                </p>
              </div>
            </div>

            <form className="ir-namecard" ref={nameCard} onSubmit={onNames}>
              <UnderlineField label="Try it with your names" value={names} onChange={setNames} placeholder="Bride & groom" name="couple" autoComplete="name" />
              <button className="ir-namecard-go" type="submit" aria-label="Try it with your names">
                <ArrowIcon />
              </button>
              <p className="ir-namecard-chips">Free to try · No sign-up · Free to publish</p>
              {/* <p className="ir-namecard-chips">Free to try · No sign-up · Pay at publish</p> */}
            </form>
          </div>
        </header>

        <div className="ir-marquee" aria-hidden="true">
          <div>
            {[...namesInMarquee, ...namesInMarquee].map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </div>
        </div>

        <section id="templates" className="ir-home-sec">
          <h2 className="ir-display">Explore templates</h2>
          <div className="ir-home-grid">
            {featured.map((template) => (
              <Link key={template.id} className="ir-home-card" to={`/template/${template.id}`}>
                <span className="ir-home-shot">
                  <PlayingInvite template={template} />
                </span>
                <span className="ir-home-card-name">{template.name}</span>
                <span className="ir-home-card-meta">
                  {descriptor(template)}
                  <b>Free</b>
                  {/* <b>{template.price > 0 ? rupee(template.price) : "Free"}</b> */}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="how" className="ir-home-sec">
          <h2 className="ir-display">How it works</h2>
          <ol className="ir-steps">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span>{step.n}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="ir-priceband">
          <p className="ir-overline">Pricing</p>
          <h2 className="ir-display">Free</h2>
          {/* <h2 className="ir-display">{from > 0 ? `From ${rupee(from)}` : "Free to try"}</h2> */}
          <p>Every design is free to publish for now.</p>
          {/* <p>One-time, when you publish. Designing and previewing stay free.</p> */}
          <PrimaryButton href="/browse">Browse templates</PrimaryButton>
        </section>

        <section id="features" className="ir-home-sec">
          <h2 className="ir-display">What guests get</h2>
          <ul className="ir-plain">
            <li>They open one link. No app and no account.</li>
            <li>Each function can have its own time, place and dress.</li>
            <li>Replies come back on the same invitation.</li>
          </ul>
        </section>

        <section id="faq" className="ir-home-sec">
          <h2 className="ir-display">Questions</h2>
          <div className="ir-faqs">
            {FAQS.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="occasions" className="ir-home-sec">
          <h2 className="ir-display">Celebrations</h2>
          <ul className="ir-plain">
            {publishedTopics().map((topic) => (
              <li key={topic.id}>
                <Link to={topic.path}>{topic.label}</Link>
                {" — "}
                {topic.description}
                {` · ${topic.templates.length} ${topic.templates.length === 1 ? "template" : "templates"}`}
              </li>
            ))}
          </ul>
        </section>

        <SiteFooter />

        {showSticky ? (
          <div className="ir-home-sticky">
            <StickyFooterCTA href="/browse" label="Browse templates" note="Free to publish" />
            {/* <StickyFooterCTA href="/browse" label="Browse templates" note="Free until you publish" /> */}
          </div>
        ) : null}
      </div>
    </IrApp>
  );
}
