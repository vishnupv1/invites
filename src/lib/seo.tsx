import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getEvent } from "../data/events";
import { getTemplate } from "../data/templates";

export const SITE = "https://invitesready.com";

const HOME_DESCRIPTION =
  "Design a wedding, nikah, baptism, or housewarming invitation, share one link, and collect RSVPs. Free to design. Premium templates are a one-time purchase.";

type Meta = { title: string; description: string; index: boolean };

function describe(pathname: string): Meta {
  if (pathname === "/") {
    return {
      title: "InvitesReady — digital invitations your guests can open and reply to",
      description: HOME_DESCRIPTION,
      index: true,
    };
  }
  if (pathname === "/browse" || pathname === "/templates") {
    return {
      title: "Invitation templates | InvitesReady",
      description: "Browse wedding, engagement, baptism, birthday, and housewarming invitation templates. Preview each design before you buy.",
      index: true,
    };
  }
  if (pathname === "/privacy") {
    return {
      title: "Privacy policy | InvitesReady",
      description: "How InvitesReady collects, uses, and stores account details, invitation content, guest replies, and payments.",
      index: true,
    };
  }
  if (pathname === "/terms") {
    return {
      title: "Terms of use | InvitesReady",
      description: "The terms for creating an account, designing an invitation, and buying a template on InvitesReady.",
      index: true,
    };
  }
  if (pathname === "/refunds") {
    return {
      title: "Refunds | InvitesReady",
      description: "When a one-time InvitesReady template purchase can be refunded, and how to ask.",
      index: true,
    };
  }
  if (pathname === "/contact") {
    return {
      title: "Contact | InvitesReady",
      description: "Contact InvitesReady about your account, a template purchase, or a published invitation.",
      index: true,
    };
  }

  const preview = pathname.match(/^\/(?:preview|template)\/([^/]+)$/);
  if (preview) {
    const template = getTemplate(preview[1]);
    if (template) {
      return {
        title: `${template.name} invitation template | InvitesReady`,
        description: template.free
          ? `Preview the ${template.name} invitation. This design is free to publish.`
          : `Preview the ${template.name} invitation. Buy it once, then use it for your celebration.`,
        index: true,
      };
    }
  }

  const category = pathname.match(/^\/c\/([^/]+)$/);
  if (category) {
    const event = getEvent(category[1]);
    if (event.id === category[1]) {
      return {
        title: `${event.label} invitations | InvitesReady`,
        description: `Invitation templates for a ${event.label.toLowerCase()}. Preview a design, then share one link with your guests.`,
        index: true,
      };
    }
  }

  return {
    title: "InvitesReady",
    description: HOME_DESCRIPTION,
    index: false,
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
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = describe(pathname);
    const url = `${SITE}${pathname}`;
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("robots", meta.index ? "index, follow" : "noindex, nofollow");
    setCanonical(url);
    setMeta("og:title", meta.title, "property");
    setMeta("og:description", meta.description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "InvitesReady", "property");
    setMeta("og:image", `${SITE}/covers/shaadi.jpg`, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setMeta("twitter:image", `${SITE}/covers/shaadi.jpg`);
  }, [pathname]);

  return null;
}
