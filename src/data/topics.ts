import seoCopy from "./seo-copy.json" with { type: "json" };

export type SeoLine = {
  heading: string;
  title: string;
  description: string;
  lead: string;
};

export type Topic = {
  id: string;
  path: string;
  label: string;
  heading: string;
  title: string;
  description: string;
  lead: string;
  templates: string[];
  related: string[];
};

export type CategoryCopy = {
  title: string;
  description: string;
  lead: string;
};

type SeoCopy = {
  pages: Record<string, { title: string; description: string }>;
  categories: Record<string, CategoryCopy>;
  templates: Record<string, SeoLine>;
  topics: Topic[];
};

const copy = seoCopy as SeoCopy;

export const SEO_PAGES = copy.pages;
export const SEO_CATEGORIES = copy.categories;
export const SEO_TEMPLATES = copy.templates;
export const TOPICS: Topic[] = copy.topics;

export function topicByPath(pathname: string) {
  return TOPICS.find((topic) => topic.path === pathname);
}

export function topicForTemplate(id: string) {
  return TOPICS.find((topic) => topic.templates.includes(id));
}

export function templateSeo(id: string) {
  return SEO_TEMPLATES[id];
}
