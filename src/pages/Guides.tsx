import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { DesktopNav } from "../components/shell/DesktopNav";
import { IrApp } from "../components/shell/IrApp";
import { guideBySlug, loadGuides, type GuidePart } from "../lib/guides";
import { NotFound } from "./Unauthorized";
import "./legal.css";

function Parts({ parts }: { parts: GuidePart[] }) {
  return parts.map((part, index) => {
    if ("href" in part) {
      return part.href.startsWith("/")
        ? <Link key={index} to={part.href}>{part.label}</Link>
        : <a key={index} href={part.href}>{part.label}</a>;
    }
    return <span key={index}>{part.text}</span>;
  });
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <IrApp>
      <DesktopNav />
      <div className="legal">
        <main>{children}</main>
        <SiteFooter variant="legal" />
      </div>
    </IrApp>
  );
}

export function GuidesIndex() {
  const guides = loadGuides();
  return (
    <Frame>
      <nav aria-label="Breadcrumb"><Link to="/">Home</Link>{" › "}Guides</nav>
      <h1>Wedding invitation guides</h1>
      <p className="legal-lede">Outlines for wording, WhatsApp messages, cost, and RSVPs. TODO: write the articles.</p>
      <ul>
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link to={guide.path}>{guide.title}</Link>
            {" — "}
            {guide.description}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function GuideArticle() {
  const { slug } = useParams();
  const guide = guideBySlug(slug);
  if (!guide) return <NotFound />;
  return (
    <Frame>
      <nav aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        {" › "}
        <Link to="/guides">Guides</Link>
        {" › "}
        {guide.title}
      </nav>
      <h1>{guide.title}</h1>
      <p className="legal-lede">{guide.description}</p>
      <p>{guide.author} · <time dateTime={guide.date}>{guide.date}</time></p>
      {guide.blocks.map((block, index) => {
        if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => <li key={itemIndex}><Parts parts={item} /></li>)}
            </ul>
          );
        }
        return <p key={index}><Parts parts={block.parts} /></p>;
      })}
    </Frame>
  );
}
