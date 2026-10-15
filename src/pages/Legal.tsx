import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { DesktopNav } from "../components/shell/DesktopNav";
import { IrApp } from "../components/shell/IrApp";
import pages from "../data/legal-pages.json" with { type: "json" };
import "./legal.css";

export const CONTACT_EMAIL = "invitesreadyforyou@gmail.com";

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "links"; items: { href: string; label: string }[] };

function rich(text: string) {
  const parts = text.split(/(\{\{email\}\}|\{\{refund-policy\}\})/g);
  return parts.map((part, index) => {
    if (part === "{{email}}") return <a key={index} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
    if (part === "{{refund-policy}}") return <Link key={index} to="/refunds">refund policy</Link>;
    return part;
  });
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return blocks.map((block, index) => {
    if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
    if (block.type === "ul") return <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
    if (block.type === "links") {
      return (
        <p key={index}>
          {block.items.map((item, itemIndex) => (
            <span key={item.href}>
              {itemIndex ? " · " : null}
              <Link to={item.href}>{item.label}</Link>
            </span>
          ))}
        </p>
      );
    }
    return <p key={index}>{rich(block.text)}</p>;
  });
}

function LegalPage({ path }: { path: keyof typeof pages }) {
  const page = pages[path];
  return (
    <Frame title={page.title} lede={page.lede}>
      <Blocks blocks={page.blocks as Block[]} />
    </Frame>
  );
}

function Frame({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <IrApp>
      <DesktopNav />
      <div className="legal">
      <main>
        <h1>{title}</h1>
        <p className="legal-lede">{lede}</p>
        {children}
      </main>
      <SiteFooter variant="legal" />
      </div>
    </IrApp>
  );
}

export function Privacy() {
  return <LegalPage path="/privacy" />;
}

export function Terms() {
  return <LegalPage path="/terms" />;
}

export function Refunds() {
  return <LegalPage path="/refunds" />;
}

export function Contact() {
  return <LegalPage path="/contact" />;
}
