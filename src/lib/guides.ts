import { parseGuide, type GuideBlock, type GuidePart } from "./guide-markdown.mjs";

const files = import.meta.glob("../../content/guides/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type { GuideBlock, GuidePart };

export type Guide = {
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

export function loadGuides(): Guide[] {
  return Object.entries(files)
    .map(([file, raw]) => {
      const slug = file.split("/").pop()?.replace(/\.md$/, "") ?? "";
      return parseGuide(slug, raw);
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function guideBySlug(slug: string | undefined) {
  return loadGuides().find((guide) => guide.slug === slug);
}
