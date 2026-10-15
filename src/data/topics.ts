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
  index?: boolean;
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

const OCCASION_ORDER = ["wedding", "shaadi", "nikah", "tamil-wedding", "birthday", "baptism", "baby-shower", "housewarming"];

export function publishedTopics() {
  const rank = new Map(OCCASION_ORDER.map((id, index) => [id, index]));
  return TOPICS.filter((topic) => topic.index !== false).sort(
    (a, b) => (rank.get(a.id) ?? 50) - (rank.get(b.id) ?? 50),
  );
}

export function topicByPath(pathname: string) {
  return TOPICS.find((topic) => topic.path === pathname);
}

export function topicsForTemplate(id: string) {
  return publishedTopics().filter((topic) => topic.templates.includes(id));
}

export function primaryTopicForTemplate(id: string) {
  const topics = topicsForTemplate(id);
  return topics.find((topic) => topic.id === "wedding") ?? topics[0];
}

export function topicForTemplate(id: string) {
  return primaryTopicForTemplate(id);
}

export function templateSeo(id: string) {
  return SEO_TEMPLATES[id];
}
