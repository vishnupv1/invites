import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SEO_PAGES, topicByPath, templateSeo } from "../data/topics";
import { redirectTarget } from "../data/paths";
import { getTemplate } from "../data/templates";
import phrases from "../data/template-phrases.json" with { type: "json" };
import { trackPageView } from "./analytics";
import { generatedTemplateSeo } from "./template-seo.mjs";
import { guideBySlug } from "./guides";

export const SITE = "https://invitesready.com";

const HOME_DESCRIPTION = SEO_PAGES["/"].description;

const HOME_IMAGE = `${SITE}/og/home.jpg`;
const BROWSE_IMAGE = `${SITE}/og/browse.jpg`;

type Meta = { title: string; description: string; index: boolean; image: string; imageAlt?: string; canonical?: string };

function describe(pathname: string): Meta {
  if (pathname === "/") {
    return {
      title: SEO_PAGES["/"].title,
      description: HOME_DESCRIPTION,
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/how") {
    return {
      title: "How Digital Wedding Invitations Work | InvitesReady",
      description: "How a digital invitation works: pick a template, add your details in the browser, and share one link. Guests RSVP with no app.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/features") {
    return {
      title: "Digital Invitation Features – RSVP & WhatsApp | InvitesReady",
      description: "Digital invitation features: one link, RSVP with no app, a schedule of functions, photos, and WhatsApp sharing for weddings and family events.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/faq") {
    return {
      title: "Digital Invitation FAQs – RSVP, WhatsApp, Editing | InvitesReady",
      description: "Answers on digital invitations: no app, RSVP on the link, editing after sending, WhatsApp sharing, languages, and what the one-time price includes.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/occasions") {
    return {
      title: SEO_PAGES["/occasions"].title,
      description: SEO_PAGES["/occasions"].description,
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/guides") {
    return {
      title: SEO_PAGES["/guides"].title,
      description: SEO_PAGES["/guides"].description,
      index: true,
      image: HOME_IMAGE,
    };
  }
  const guideMatch = pathname.match(/^\/guides\/([^/]+)$/);
  if (guideMatch) {
    const guide = guideBySlug(guideMatch[1]);
    if (guide) {
      return {
        title: guide.seoTitle,
        description: guide.description,
        index: guide.index,
        image: HOME_IMAGE,
        canonical: guide.path,
      };
    }
  }
  if (pathname === "/browse" || pathname === "/templates") {
    return {
      title: SEO_PAGES["/browse"].title,
      description: SEO_PAGES["/browse"].description,
      index: pathname === "/browse",
      image: pathname === "/browse" ? BROWSE_IMAGE : HOME_IMAGE,
    };
  }
  if (pathname === "/privacy") {
    return {
      title: "Privacy policy | InvitesReady",
      description: "How InvitesReady collects, uses, and stores account details, invitation content, guest replies, and payments.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/terms") {
    return {
      title: "Terms of use | InvitesReady",
      description: "The terms for creating an account, designing an invitation, and buying a template on InvitesReady.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/refunds") {
    return {
      title: "Refunds | InvitesReady",
      description: "When a one-time InvitesReady template purchase can be refunded, and how to ask.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/contact") {
    return {
      title: "Contact | InvitesReady",
      description: "Contact InvitesReady about your account, a template purchase, or a published invitation.",
      index: true,
      image: HOME_IMAGE,
    };
  }

  const preview = pathname.match(/^\/(?:preview|template|browse)\/([^/]+)$/);
  if (preview) {
    const template = getTemplate(preview[1]);
    if (template) {
      const accountOnly = pathname.startsWith("/preview/");
      const stored = templateSeo(template.id);
      const generated = generatedTemplateSeo(template, phrases[template.id as keyof typeof phrases]);
      const line = {
        title: generated.title,
        description: generated.description,
        heading: stored?.heading ?? generated.heading,
      };
      return {
        title: line.title,
        description: line.description,
        index: !accountOnly,
        image: `${SITE}/og/${template.id}.jpg`,
        canonical: `/template/${template.id}`,
      };
    }
  }

  const redirected = redirectTarget(pathname);
  if (redirected) {
    return {
      title: "InvitesReady",
      description: HOME_DESCRIPTION,
      index: false,
      image: HOME_IMAGE,
      canonical: redirected,
    };
  }

  if (pathname.startsWith("/embed/")) {
    return { title: "Invitation preview | InvitesReady", description: HOME_DESCRIPTION, index: false, image: HOME_IMAGE };
  }
  if (pathname === "/design-check") {
    return { title: "Design check | InvitesReady", description: "Internal gallery of shell components.", index: false, image: HOME_IMAGE };
  }
  if (pathname === "/login") {
    return { title: "Log in | InvitesReady", description: HOME_DESCRIPTION, index: false, image: HOME_IMAGE };
  }
  if (pathname === "/create" || pathname.startsWith("/create/")) {
    return { title: "Design your invitation | InvitesReady", description: HOME_DESCRIPTION, index: false, image: HOME_IMAGE };
  }
  if (pathname === "/studio") {
    return { title: "Your invitations | InvitesReady", description: HOME_DESCRIPTION, index: false, image: HOME_IMAGE };
  }
  const studioTitles: Record<string, string> = {
    "/events": "My events | InvitesReady",
    "/drafts": "Saved drafts | InvitesReady",
    "/favorites": "My favorites | InvitesReady",
    "/guests": "Guests | InvitesReady",
    "/wishes": "Wishes | InvitesReady",
    "/purchases": "Purchases | InvitesReady",
    "/settings": "Settings | InvitesReady",
  };
  if (studioTitles[pathname]) {
    return { title: studioTitles[pathname], description: HOME_DESCRIPTION, index: false, image: HOME_IMAGE };
  }
  if (pathname.startsWith("/i/")) {
    return { title: "Guest invitation | InvitesReady", description: HOME_DESCRIPTION, index: false, image: HOME_IMAGE };
  }

  const topic = topicByPath(pathname);
  if (topic) {
    return {
      title: topic.title,
      description: topic.description,
      index: topic.index !== false,
      image: `${SITE}/og/occasion-${topic.id}.jpg`,
      imageAlt: `${topic.label} digital invitation`,
    };
  }

  return {
    title: "InvitesReady",
    description: HOME_DESCRIPTION,
    index: false,
    image: HOME_IMAGE,
  };
}

function setMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

export function PageMeta() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const meta = describe(path);
    const url = `${SITE}${meta.canonical ?? path}`;
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("robots", meta.index ? "index, follow" : "noindex, nofollow");
    setCanonical(url);
    setMeta("og:title", meta.title, "property");
    setMeta("og:description", meta.description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "InvitesReady", "property");
    setMeta("og:image", meta.image, "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("og:image:alt", meta.imageAlt || meta.title, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setMeta("twitter:image", meta.image);
    setMeta("twitter:image:alt", meta.imageAlt || meta.title);
    trackPageView(`${path}${search}${hash}`, meta.title, path.startsWith("/i/") ? "guest" : undefined);
  }, [pathname, search, hash]);

  return null;
}
