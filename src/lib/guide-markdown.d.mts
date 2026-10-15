export type GuidePart = { text: string } | { href: string; label: string };

export type GuideBlock =
  | { type: "h2"; text: string }
  | { type: "p"; parts: GuidePart[] }
  | { type: "ul"; items: GuidePart[][] };

export type ParsedGuide = {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  date: string;
  author: string;
  index: boolean;
  blocks: GuideBlock[];
};

export function parseGuide(slug: string, raw: string): ParsedGuide;
