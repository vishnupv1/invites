import { useState } from "react";
import { InviteView } from "../components/InviteView";
import { BreadcrumbBar } from "../components/shell/BreadcrumbBar";
import { DesktopNav } from "../components/shell/DesktopNav";
import { IrApp } from "../components/shell/IrApp";
import { PhoneFrame } from "../components/shell/PhoneFrame";
import { PrimaryButton } from "../components/shell/PrimaryButton";
import { Segmented } from "../components/shell/Segmented";
import { StickyFooterCTA } from "../components/shell/StickyFooterCTA";
import { TemplatePreview } from "../components/shell/TemplatePreview";
import { TextLink } from "../components/shell/TextLink";
import { Toggle } from "../components/shell/Toggle";
import { TopBar } from "../components/shell/TopBar";
import { UnderlineField } from "../components/shell/UnderlineField";
import { getTemplate, sampleFor } from "../data/templates";
import "./design-check.css";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "both", label: "Both" },
] as const;

export default function DesignCheck() {
  const [names, setNames] = useState("");
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]["value"]>("en");
  const [haldi, setHaldi] = useState(true);
  const template = getTemplate("bloom");
  const fields = template ? sampleFor(template, template.events[0]) : null;

  return (
    <IrApp>
      <div className="ir-check">
        <DesktopNav tone="paper" />
        <div className="ir-check-band">
          <DesktopNav tone="emerald" />
        </div>
        <TopBar
          tone="emerald"
          title="Make it yours"
          backHref="/browse"
          action={<TextLink href="/browse" onDark>Preview</TextLink>}
        />
        <BreadcrumbBar
          backHref="/browse"
          items={[
            { label: "Templates", href: "/browse" },
            { label: "Bloom Letter", href: "/template/bloom" },
            { label: "Make it yours" },
          ]}
        />

        <div className="ir-check-body">
          <header className="ir-rise">
            <p className="ir-overline">Shell gallery</p>
            <h1 className="ir-display">
              Components for the <span className="ir-em">new</span> shell.
            </h1>
            <p className="ir-check-lead">Internal page. Not linked from the site, and not in the sitemap.</p>
          </header>

          <section className="ir-check-block ir-rise">
            <h2 className="ir-overline">Primary button</h2>
            <div className="ir-check-stack">
              <PrimaryButton>Browse templates</PrimaryButton>
              <PrimaryButton variant="marigold">Try it with your names</PrimaryButton>
              <PrimaryButton variant="whatsapp">Share on WhatsApp</PrimaryButton>
              <PrimaryButton variant="outline">Open dashboard</PrimaryButton>
            </div>
          </section>

          <section className="ir-check-block ir-rise">
            <h2 className="ir-overline">Text link</h2>
            <TextLink href="/browse">Browse templates</TextLink>
          </section>

          <section className="ir-check-block ir-rise">
            <h2 className="ir-overline">Underline field</h2>
            <UnderlineField label="Try it with your names" value={names} onChange={setNames} placeholder="Bride & groom" name="names" autoComplete="name" />
          </section>

          <section className="ir-check-block ir-rise">
            <h2 className="ir-overline">Segmented</h2>
            <Segmented label="Invitation language" value={language} options={[...LANGUAGES]} onChange={setLanguage} />
          </section>

          <section className="ir-check-block ir-rise">
            <h2 className="ir-overline">Toggle</h2>
            <div className="ir-check-row">
              <span>Haldi</span>
              <Toggle label="Haldi" pressed={haldi} onChange={setHaldi} />
            </div>
          </section>

          <section className="ir-check-block ir-rise">
            <h2 className="ir-overline">Template preview</h2>
            {template && fields ? (
              <PhoneFrame label={`${template.name} in a phone frame`}>
                <TemplatePreview label={`${template.name} preview`} radius={34}>
                  <InviteView template={template} fields={fields} />
                </TemplatePreview>
              </PhoneFrame>
            ) : (
              <p>Bloom Letter is not in the catalog.</p>
            )}
          </section>
        </div>

        <div className="ir-check-sticky-demo">
          <p className="ir-overline">Sticky footer</p>
          <div className="ir-check-sticky-scroll">
          <p>Scroll this panel. The button stays on the paper.</p>
          <div className="ir-check-sticky-spacer" />
          <StickyFooterCTA label="Next — functions" note="Autosaved on this phone" />
          </div>
        </div>
      </div>
    </IrApp>
  );
}
