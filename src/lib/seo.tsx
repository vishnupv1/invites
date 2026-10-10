import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getEvent } from "../data/events";
import { SEO_CATEGORIES, SEO_PAGES, topicByPath, templateSeo } from "../data/topics";
import { getTemplate, templatesFor } from "../data/templates";
import { trackPageView } from "./analytics";
import { generatedTemplateSeo } from "./template-seo.mjs";

export const SITE = "https://invitesready.com";

const HOME_DESCRIPTION = SEO_PAGES["/"].description;

const HOME_IMAGE = `${SITE}/og/home.jpg`;
const BROWSE_IMAGE = `${SITE}/og/browse.jpg`;

type Meta = { title: string; description: string; index: boolean; image: string; canonical?: string };

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
      title: "How digital invitations work | InvitesReady",
      description: "Pick a template, add your details, and share one link. Guests open it in the browser and RSVP without an app.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/features") {
    return {
      title: "Invitation features | InvitesReady",
      description: "RSVPs, a guest list, and a photo wall for wedding and family invitations.",
      index: true,
      image: HOME_IMAGE,
    };
  }
  if (pathname === "/faq") {
    return {
      title: "Invitation questions | InvitesReady",
      description: "Guests do not need an app. You can design before you sign up, edit after sending, and keep the address private.",
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
      const line = templateSeo(template.id) ?? generatedTemplateSeo(template);
      return {
        title: line.title,
        description: line.description,
        index: !accountOnly,
        image: `${SITE}/og/${template.id}.jpg`,
        canonical: `/template/${template.id}`,
      };
    }
  }

  const category = pathname.match(/^\/c\/([^/]+)$/);
  if (category) {
    const event = getEvent(category[1]);
    if (event.id === category[1] && templatesFor(event.id).length > 0) {
      const line = SEO_CATEGORIES[event.id];
      return {
        title: line?.title ?? `${event.label} invitations | InvitesReady`,
        description: line?.description ?? `Invitation templates for a ${event.label.toLowerCase()}. Preview a design, then share one link with your guests.`,
        index: true,
        image: HOME_IMAGE,
      };
    }
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
    return { title: topic.title, description: topic.description, index: true, image: HOME_IMAGE };
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
    const meta = describe(pathname);
    const url = `${SITE}${meta.canonical ?? pathname}`;
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
    setMeta("og:image:alt", meta.title, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setMeta("twitter:image", meta.image);
    setMeta("twitter:image:alt", meta.title);
    trackPageView(`${pathname}${search}${hash}`, meta.title, pathname.startsWith("/i/") ? "guest" : undefined);
  }, [pathname, search, hash]);

  return null;
}
