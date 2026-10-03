import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getEvent } from "../data/events";
import { getTemplate, templatesFor } from "../data/templates";
import { trackPageView } from "./analytics";

export const SITE = "https://invitesready.com";

const HOME_DESCRIPTION =
  "Design a digital invitation for a wedding, nikah, baptism, or housewarming. Start free, or pick a premium design, then share one link for RSVPs.";

const BRAND_IMAGE = `${SITE}/covers/shaadi.jpg`;

type Meta = { title: string; description: string; index: boolean; image: string; canonical?: string };

function describe(pathname: string): Meta {
  if (pathname === "/") {
    return {
      title: "Digital invitations your guests can open and reply to | InvitesReady",
      description: HOME_DESCRIPTION,
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/how") {
    return {
      title: "How digital invitations work | InvitesReady",
      description: "Pick a template, add your details, and share one link. Guests open it in the browser and RSVP without an app.",
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/features") {
    return {
      title: "Invitation features | InvitesReady",
      description: "RSVPs, guest groups, reminders, a photo wall, and password-protected pages for wedding and family invitations.",
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/faq") {
    return {
      title: "Invitation questions | InvitesReady",
      description: "Guests do not need an app. You can design before you sign up, edit after sending, and keep the address private.",
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/occasions") {
    return {
      title: "Wedding, baptism, and housewarming invitations | InvitesReady",
      description: "Digital invitations for weddings, nikah, engagements, baptisms, birthdays, anniversaries, and housewarmings.",
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/browse" || pathname === "/templates") {
    return {
      title: "Invitation templates | InvitesReady",
      description: "Browse wedding, engagement, baptism, birthday, and housewarming invitation templates. Preview each design before you buy.",
      index: pathname === "/browse",
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/privacy") {
    return {
      title: "Privacy policy | InvitesReady",
      description: "How InvitesReady collects, uses, and stores account details, invitation content, guest replies, and payments.",
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/terms") {
    return {
      title: "Terms of use | InvitesReady",
      description: "The terms for creating an account, designing an invitation, and buying a template on InvitesReady.",
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/refunds") {
    return {
      title: "Refunds | InvitesReady",
      description: "When a one-time InvitesReady template purchase can be refunded, and how to ask.",
      index: true,
      image: BRAND_IMAGE,
    };
  }
  if (pathname === "/contact") {
    return {
      title: "Contact | InvitesReady",
      description: "Contact InvitesReady about your account, a template purchase, or a published invitation.",
      index: true,
      image: BRAND_IMAGE,
    };
  }

  const preview = pathname.match(/^\/(?:preview|template|browse)\/([^/]+)$/);
  if (preview) {
    const template = getTemplate(preview[1]);
    if (template) {
      const onBrowse = pathname.startsWith("/browse/");
      const accountOnly = pathname.startsWith("/preview/");
      return {
        title: `${template.name} invitation template | InvitesReady`,
        description: template.free
          ? `Preview the ${template.name} invitation. This design is free to publish.`
          : `Preview the ${template.name} invitation. Buy it once, then use it for your celebration.`,
        index: !accountOnly,
        image: `${SITE}/covers/${template.id}.jpg`,
        canonical: onBrowse ? `/browse/${template.id}` : `/template/${template.id}`,
      };
    }
  }

  const category = pathname.match(/^\/c\/([^/]+)$/);
  if (category) {
    const event = getEvent(category[1]);
    if (event.id === category[1] && templatesFor(event.id).length > 0) {
      return {
        title: `${event.label} invitations | InvitesReady`,
        description: `Invitation templates for a ${event.label.toLowerCase()}. Preview a design, then share one link with your guests.`,
        index: true,
        image: BRAND_IMAGE,
      };
    }
  }

  if (pathname === "/login") {
    return { title: "Log in | InvitesReady", description: HOME_DESCRIPTION, index: false, image: BRAND_IMAGE };
  }
  if (pathname === "/create" || pathname.startsWith("/create/")) {
    return { title: "Design your invitation | InvitesReady", description: HOME_DESCRIPTION, index: false, image: BRAND_IMAGE };
  }
  if (pathname === "/studio" || pathname === "/events" || pathname === "/guests" || pathname === "/purchases") {
    return { title: "Your invitations | InvitesReady", description: HOME_DESCRIPTION, index: false, image: BRAND_IMAGE };
  }
  if (pathname.startsWith("/i/")) {
    return { title: "Guest invitation | InvitesReady", description: HOME_DESCRIPTION, index: false, image: BRAND_IMAGE };
  }

  return {
    title: "InvitesReady",
    description: HOME_DESCRIPTION,
    index: false,
    image: BRAND_IMAGE,
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
