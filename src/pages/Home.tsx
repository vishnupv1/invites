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
import { TEMPLATES, getTemplate, sampleFor, withCatalogMeta } from "../data/templates";
import { trackNamesEntered } from "../lib/analytics";
import { saveCoupleNames } from "../lib/couple-names";
import type { Template } from "../types";
import "./shell-home.css";

const FEATURED = ["bloom", "hansa", "moonlit", "palace", "villa", "grandoor"];

const STEPS = [
  ["01", "Pick a design", "Choose an opening. You can try it before you create an account."],
  ["02", "Add your details", "Names, functions, photos and music. The preview updates as you type."],
  ["03", "Publish and share", "Pay when you publish, then send one link. Guests open it in the browser."],
];

const FAQS = [
  ["Do guests need an app?", "No. They open your link in the browser and can reply from that page."],
  ["When do I pay?", "When you publish. Designing and previewing do not need an account."],
  ["Can I edit after sharing?", "Yes. The link stays the same, and guests see the latest version."],
];

function rupee(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function lowestPaid(templates: Template[]) {
  const prices = templates.map((item) => item.price).filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

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

  useEffect(() => {
    listTemplates()
      .then((rows) => setCatalog(rows.map(withCatalogMeta)))
      .catch(() => setCatalog(TEMPLATES));
  }, []);

  useEffect(() => {
    const id = focus === "occasions" ? "templates" : focus || hash.replace(/^#/, "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [focus, hash, catalog]);

  const byId = new Map(catalog.map((item) => [item.id, item]));
  const featured = FEATURED.map((id) => byId.get(id) ?? getTemplate(id)).filter((item): item is Template => Boolean(item));
  const lead = featured[0] ?? catalog[0];
  const second = featured[1];
  const from = lowestPaid(catalog);
  const namesInMarquee = catalog.map((item) => item.name);

  function onNames(event: FormEvent) {
    event.preventDefault();
    const value = names.trim();
    if (value) {
      saveCoupleNames(value);
      trackNamesEntered();
    }
    if (lead) navigate(`/create/${lead.id}`);
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
                Your wedding, <span className="ir-em">unsealed</span> on every phone.
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
                  <b className="ir-display ir-hero-price">{from > 0 ? `From ${rupee(from)}` : "Free"}</b>
                  <span>{from > 0 ? "one-time, pay at publish" : "to try a design"}</span>
                </p>
                <p className="ir-hero-stat-wide">
                  <b className="ir-display">Pay later</b>
                  <span>design before you sign in</span>
                </p>
              </div>
            </div>

            <form className="ir-namecard" onSubmit={onNames}>
              <UnderlineField label="Try it with your names" value={names} onChange={setNames} placeholder="Bride & groom" name="couple" autoComplete="name" />
              <button className="ir-namecard-go" type="submit" aria-label="Try it with your names">
                <ArrowIcon />
              </button>
              <p className="ir-namecard-chips">Free to try · No sign-up · Pay at publish</p>
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
                  <b>{template.price > 0 ? rupee(template.price) : "Free"}</b>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="how" className="ir-home-sec">
          <h2 className="ir-display">How it works</h2>
          <ol className="ir-steps">
            {STEPS.map(([n, title, text]) => (
              <li key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="ir-priceband">
          <p className="ir-overline">Pricing</p>
          <h2 className="ir-display">{from > 0 ? `From ${rupee(from)}` : "Free to try"}</h2>
          <p>One-time, when you publish. Designing and previewing stay free.</p>
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
            {FAQS.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="ir-home-foot">
          <Link to="/browse">Templates</Link>
          <Link to="/how">How it works</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/refunds">Refunds</Link>
        </footer>

        <div className="ir-home-sticky">
          <StickyFooterCTA href="/browse" label="Browse templates" note="Free until you publish" />
        </div>
      </div>
    </IrApp>
  );
}
