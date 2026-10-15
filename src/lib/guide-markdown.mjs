function inline(text) {
  const parts = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ href: match[2], label: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function parseGuide(slug, raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Guide ${slug} is missing frontmatter`);
  const meta = {};
  for (const line of match[1].split("\n")) {
    const cut = line.indexOf(":");
    if (cut < 0) continue;
    const key = line.slice(0, cut).trim();
    const value = line.slice(cut + 1).trim();
    meta[key] = value === "false" ? false : value === "true" ? true : value;
  }
  const blocks = [];
  let list = null;
  const flush = () => {
    if (!list) return;
    blocks.push({ type: "ul", items: list });
    list = null;
  };
  for (const line of match[2].replace(/^\n+/, "").split("\n")) {
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("- ")) {
      list = list ?? [];
      list.push(inline(line.slice(2).trim()));
      continue;
    }
    flush();
    blocks.push({ type: "p", parts: inline(line.trim()) });
  }
  flush();
  if (!meta.title || !meta.description || !meta.date) {
    throw new Error(`Guide ${slug} needs title, description, and date`);
  }
  return {
    slug,
    path: `/guides/${slug}`,
    title: meta.title,
    seoTitle: meta.seoTitle || `${meta.title} | InvitesReady`,
    description: meta.description,
    date: meta.date,
    author: meta.author || "InvitesReady",
    index: meta.index !== false,
    blocks,
  };
}
