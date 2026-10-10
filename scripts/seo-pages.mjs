import fs from "node:fs";
import path from "node:path";
import { generatedTemplateSeo } from "../src/lib/template-seo.mjs";
import { writeShareImages } from "./og-images.mjs";

const SITE = "https://invitesready.com";
const root = path.resolve(import.meta.dirname, "..");
const HOME_IMAGE = `${SITE}/og/home.jpg`;
const BROWSE_IMAGE = `${SITE}/og/browse.jpg`;
const seoCopy = JSON.parse(fs.readFileSync(path.join(root, "src/data/seo-copy.json"), "utf8"));
const HOME_DESCRIPTION = seoCopy.pages["/"].description;

const FAQS = [
  ["Do my guests need an app or an account?", "No. Guests open your link in any browser and RSVP in one tap — it works on basic phones too."],
  ["Can I design before signing up?", "Yes. Pick a template and customise it as a guest. We only ask you to log in when you publish, and your draft comes with you."],
  ["Can different guests see different functions?", "Yes. Put guests into groups and choose which functions each group sees."],
  ["Is our family information private?", "Pages can be password-protected, and the address can stay hidden until a guest says yes."],
  ["Can I edit after sending?", "Of course — every guest sees the latest version through the same link."],
];

const STATIC = [
  ["/", seoCopy.pages["/"].title, HOME_DESCRIPTION, HOME_IMAGE],
  ["/how", "How digital invitations work | InvitesReady", "Pick a template, add your details, and share one link. Guests open it in the browser and RSVP without an app.", HOME_IMAGE],
  ["/features", "Invitation features | InvitesReady", "RSVPs, guest groups, reminders, a photo wall, and password-protected pages for wedding and family invitations.", HOME_IMAGE],
  ["/faq", "Invitation questions | InvitesReady", "Guests do not need an app. You can design before you sign up, edit after sending, and keep the address private.", HOME_IMAGE],
  ["/occasions", seoCopy.pages["/occasions"].title, seoCopy.pages["/occasions"].description, HOME_IMAGE],
  ["/browse", seoCopy.pages["/browse"].title, seoCopy.pages["/browse"].description, BROWSE_IMAGE],
  ["/privacy", "Privacy policy | InvitesReady", "How InvitesReady collects, uses, and stores account details, invitation content, guest replies, and payments.", HOME_IMAGE],
  ["/terms", "Terms of use | InvitesReady", "The terms for creating an account, designing an invitation, and buying a template on InvitesReady.", HOME_IMAGE],
  ["/refunds", "Refunds | InvitesReady", "When a one-time InvitesReady template purchase can be refunded, and how to ask.", HOME_IMAGE],
  ["/contact", "Contact | InvitesReady", "Contact InvitesReady about your account, a template purchase, or a published invitation.", HOME_IMAGE],
];

function readTemplates() {
  const src = fs.readFileSync(path.join(root, "src/data/templates.ts"), "utf8");
  return src
    .split(/\n  \{\n/)
    .slice(1)
    .map((chunk) => {
      const id = chunk.match(/id: "([^"]+)"/)?.[1];
      const name = chunk.match(/name: "([^"]+)"/)?.[1];
      const price = Number(chunk.match(/price: (\d+)/)?.[1] ?? 0);
      const description = chunk.match(/description: "([^"]+)"/)?.[1] ?? "";
      const head = chunk.slice(0, chunk.indexOf("meta:"));
      const free = /free: true/.test(head);
      const eventsBlock = head.match(/events: \[([^\]]+)\]/)?.[1] ?? "";
      const events = [...eventsBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      return { id, name, price, description, free, events };
    })
    .filter((template) => template.id && template.name);
}

function readEvents() {
  const src = fs.readFileSync(path.join(root, "src/data/events.ts"), "utf8");
  return [...src.matchAll(/id: "([^"]+)",\s*label: "([^"]+)"/g)].map((match) => ({
    id: match[1],
    label: match[2],
  }));
}

function escapeAttr(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function escapeText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function canonicalPath(page) {
  return page.canonical ?? page.path;
}

const SITE_LINKS = [
  ["/browse", "Browse templates"],
  ["/how", "How it works"],
  ["/features", "Features"],
  ["/faq", "Questions"],
  ["/occasions", "Celebrations"],
  ["/contact", "Contact"],
];

function linkList(links) {
  const items = links.map(([href, label]) => `<li><a href="${escapeAttr(href)}">${escapeText(label)}</a></li>`);
  return `<ul>${items.join("")}</ul>`;
}

function priceText(template) {
  return template.free ? "Free to publish" : `₹${template.price.toLocaleString("en-IN")}, paid once`;
}

function templateLinks(templates) {
  return linkList(templates.map((template) => [`/template/${template.id}`, `${template.name} invitation template`]));
}

function relatedTemplates(template, templates) {
  const sameEvent = templates.filter(
    (other) => other.id !== template.id && other.events.some((event) => template.events.includes(event)),
  );
  const pool = sameEvent.length ? sameEvent : templates.filter((other) => other.id !== template.id);
  const place = templates.findIndex((item) => item.id === template.id);
  const next = pool.findIndex((other) => templates.findIndex((item) => item.id === other.id) > place);
  const start = next === -1 ? Math.max(0, pool.length - 3) : next;
  return [...pool.slice(start), ...pool.slice(0, start)].slice(0, 3);
}

function dayOf(file) {
  if (!fs.existsSync(file)) return null;
  return new Date(fs.statSync(file).mtime).toISOString().slice(0, 10);
}

function templateLastmod(template) {
  return dayOf(path.join(root, "public/covers", `${template.id}.jpg`))
    || dayOf(path.join(root, "src/data/templates.ts"))
    || new Date().toISOString().slice(0, 10);
}

function lineFor(template) {
  const stored = seoCopy.templates[template.id];
  if (stored?.title && stored?.description && stored?.heading) return stored;
  console.warn(`SEO: generated copy for ${template.id}`);
  return generatedTemplateSeo(template);
}

function bodyFor(page, templates, events) {
  const heading = page.heading ?? page.title.replace(/ \| InvitesReady$/, "");
  const parts = [`<h1>${escapeText(heading)}</h1>`, `<p>${escapeText(page.description)}</p>`];
  if (page.template) {
    const template = page.template;
    if (template.description) parts.push(`<p>${escapeText(template.description)}</p>`);
    parts.push(`<p>${escapeText(priceText(template))}</p>`);
    parts.push(`<img src="${escapeAttr(page.image)}" alt="${escapeAttr(`${template.name} invitation template cover`)}" width="600" height="800" />`);
    const occasions = events.filter((event) => template.events.includes(event.id));
    if (occasions.length) {
      parts.push("<h2>Occasions</h2>", linkList(occasions.map((event) => [`/c/${event.id}`, `${event.label} invitations`])));
    }
    const related = relatedTemplates(template, templates);
    parts.push(`<p><a href="/browse">Browse invitation templates</a></p>`);
    if (related.length) parts.push("<h2>Related templates</h2>", templateLinks(related));
  } else if (page.event) {
    const matches = templates.filter((template) => template.events.includes(page.event.id));
    const items = matches.map(
      (template) =>
        `<li><a href="/template/${escapeAttr(template.id)}">${escapeText(template.name)}</a> — ${escapeText(template.description || priceText(template))}</li>`,
    );
    parts.push("<h2>Templates</h2>", `<ul>${items.join("")}</ul>`);
  } else if (page.topic) {
    const templatesForTopic = page.topic.templates
      .map((id) => templates.find((template) => template.id === id))
      .filter(Boolean);
    const items = templatesForTopic.map(
      (template) =>
        `<li><a href="/template/${escapeAttr(template.id)}">${escapeText(template.name)}</a> — ${escapeText(template.description || priceText(template))}</li>`,
    );
    parts.push("<h2>Templates</h2>", `<ul>${items.join("")}</ul>`);
    const related = (page.topic.related ?? [])
      .map((itemPath) => seoCopy.topics.find((topic) => topic.path === itemPath))
      .filter(Boolean);
    if (related.length) {
      parts.push("<h2>Related</h2>", linkList(related.map((topic) => [topic.path, topic.heading])));
    }
  } else if (page.path === "/" || page.path === "/browse") {
    parts.push("<h2>Invitation templates</h2>", templateLinks(templates));
  }
  parts.push(`<nav aria-label="InvitesReady">${linkList(SITE_LINKS)}</nav>`);
  return `<div class="seo-shell">${parts.join("")}</div>`;
}

function replaceMeta(html, attribute, key, content) {
  const pattern = new RegExp(`(<meta[^>]*${attribute}="${key}"[^>]*content=")[^"]*(")`);
  if (!pattern.test(html)) throw new Error(`Missing meta ${attribute}=${key}`);
  return html.replace(pattern, `$1${escapeAttr(content)}$2`);
}

function organization() {
  return {
    "@type": "Organization",
    name: "InvitesReady",
    url: `${SITE}/`,
    email: "hello@invitesready.com",
    logo: `${SITE}/brand/mark.png`,
  };
}

function faqEntity() {
  return {
    "@type": "FAQPage",
    mainEntity: FAQS.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

function graphFor(page, templates) {
  const graph = [organization()];
  if (page.path === "/") {
    graph.push({
      "@type": "WebSite",
      name: "InvitesReady",
      url: `${SITE}/`,
      description: "Digital invitations for a wedding, nikah, shaadi, Tamil wedding, baptism, or housewarming. Design one, share the link, and collect replies.",
    });
    graph.push(faqEntity());
    graph.push({
      "@type": "ItemList",
      name: "Invitation templates",
      itemListElement: templates.map((template, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE}/template/${template.id}`,
        name: template.name,
      })),
    });
  } else if (page.path === "/faq") {
    graph.push(faqEntity());
  } else if (page.template) {
    graph.push({
      "@type": "Product",
      name: `${page.template.name} invitation template`,
      description: page.description,
      image: page.image,
      brand: { "@type": "Brand", name: "InvitesReady" },
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: String(page.template.price),
        availability: "https://schema.org/InStock",
        url: `${SITE}/template/${page.template.id}`,
      },
    });
  } else if (page.event) {
    const matches = templates.filter((template) => template.events.includes(page.event.id));
    graph.push({
      "@type": "CollectionPage",
      name: page.title,
      description: page.description,
      url: `${SITE}${page.path}`,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: matches.map((template, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE}/template/${template.id}`,
          name: template.name,
        })),
      },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

const ICON_LINKS = [
  '<link rel="icon" href="/favicon-v2.ico" sizes="48x48">',
  '<link rel="icon" type="image/png" href="/favicon-v2-48.png" sizes="48x48">',
  '<link rel="icon" type="image/png" href="/favicon-v2.png" sizes="192x192">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
].join("\n    ");

function ensureIcons(html) {
  const stripped = html.replace(/\n\s*<link rel="(?:shortcut icon|icon|apple-touch-icon)"[^>]*>/g, "");
  if (!stripped.includes("<head>")) throw new Error("Missing <head>");
  return stripped.replace("<head>", `<head>\n    ${ICON_LINKS}`);
}

function pageHtml(base, page, templates, events) {
  const url = `${SITE}${canonicalPath(page)}`;
  let html = ensureIcons(base);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(page.title)}</title>`);
  html = replaceMeta(html, "name", "description", page.description);
  html = replaceMeta(html, "name", "robots", "index, follow");
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = replaceMeta(html, "property", "og:title", page.title);
  html = replaceMeta(html, "property", "og:description", page.description);
  html = replaceMeta(html, "property", "og:url", url);
  html = replaceMeta(html, "property", "og:image", page.image);
  html = replaceMeta(html, "property", "og:image:width", "1200");
  html = replaceMeta(html, "property", "og:image:height", "630");
  html = replaceMeta(html, "name", "twitter:title", page.title);
  html = replaceMeta(html, "name", "twitter:description", page.description);
  html = replaceMeta(html, "name", "twitter:image", page.image);
  const json = JSON.stringify(graphFor(page, templates), null, 2);
  html = html.replace(
    /<script id="site-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="site-jsonld" type="application/ld+json">\n${json}\n    </script>`,
  );
  html = replaceRoot(html, bodyFor(page, templates, events));
  return html;
}

function replaceRoot(html, body) {
  const token = '<div id="root">';
  const start = html.indexOf(token);
  if (start < 0) throw new Error("Missing #root");
  let depth = 0;
  for (let index = start; index < html.length; index += 1) {
    if (html.startsWith("<div", index)) depth += 1;
    else if (html.startsWith("</div>", index)) {
      depth -= 1;
      if (depth === 0) {
        const end = index + "</div>".length;
        return `${html.slice(0, start)}<div id="root">${body}</div>${html.slice(end)}`;
      }
    }
  }
  throw new Error("Unclosed #root");
}

function fallbackHtml(base) {
  let html = ensureIcons(base);
  html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>InvitesReady</title>");
  html = replaceMeta(html, "name", "robots", "noindex, nofollow");
  html = html.replace(/\s*<link rel="canonical" href="[^"]*" \/>/, "");
  html = html.replace(
    /\s*<script id="site-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/,
    "",
  );
  return html;
}

function pages(templates, events) {
  const copyDay = dayOf(path.join(root, "src/data/seo-copy.json")) || new Date().toISOString().slice(0, 10);
  const list = STATIC.map(([pathname, title, description, image]) => ({
    path: pathname,
    title,
    heading: pathname === "/" ? "Invitations your guests open, answer and remember." : pathname === "/browse" ? "Invitation templates" : undefined,
    description,
    image,
    lastmod: copyDay,
  }));
  const headings = new Set();
  for (const template of templates) {
    const line = lineFor(template);
    if (headings.has(line.heading)) throw new Error(`SEO: duplicate H1 for ${template.id}`);
    headings.add(line.heading);
    if (line.title.length > 60) throw new Error(`SEO: title too long for ${template.id} (${line.title.length})`);
    if (line.description.length > 155) throw new Error(`SEO: description too long for ${template.id} (${line.description.length})`);
    const shared = {
      canonical: `/template/${template.id}`,
      title: line.title,
      heading: line.heading,
      description: line.description,
      image: `${SITE}/og/${template.id}.jpg`,
      template,
      lastmod: templateLastmod(template),
    };
    list.push({ ...shared, path: `/template/${template.id}` });
    list.push({ ...shared, path: `/browse/${template.id}` });
  }
  for (const topic of seoCopy.topics) {
    list.push({
      path: topic.path,
      title: topic.title,
      heading: topic.heading,
      description: topic.lead,
      image: HOME_IMAGE,
      topic,
      lastmod: copyDay,
    });
  }
  for (const event of events) {
    if (!templates.some((template) => template.events.includes(event.id))) continue;
    const line = seoCopy.categories[event.id];
    list.push({
      path: `/c/${event.id}`,
      title: line?.title ?? `${event.label} invitations | InvitesReady`,
      description: line?.lead ?? `Invitation templates for a ${event.label.toLowerCase()}. Preview a design, then share one link with your guests.`,
      image: HOME_IMAGE,
      event,
      lastmod: copyDay,
    });
  }
  return list;
}

function writeSitemap(list) {
  const urls = list
    .filter((page) => canonicalPath(page) === page.path)
    .map((page) => `  <url><loc>${SITE}${page.path}</loc><lastmod>${page.lastmod}</lastmod></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
  const dist = path.join(root, "dist/sitemap.xml");
  if (fs.existsSync(path.dirname(dist))) fs.writeFileSync(dist, xml);
}

function assertTemplateHtml(html, page) {
  if (!page.template || !page.path.startsWith("/template/")) return;
  const id = page.template.id;
  const canonical = `${SITE}/template/${id}`;
  const problems = [];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const description = html.match(/name="description"[^>]*content="([^"]*)"/)?.[1] ?? "";
  if (!title || title.length > 60) problems.push(`title ${title.length}`);
  if (!description || description.length > 155) problems.push(`description ${description.length}`);
  if (!/RSVP/.test(description) || !/WhatsApp/.test(description)) problems.push("description missing RSVP or WhatsApp");
  if (page.template.free || page.template.price === 0) {
    if (!description.endsWith("Free.")) problems.push("description missing Free");
  } else if (!description.includes(`₹${page.template.price} one-time`)) {
    problems.push("description missing price");
  }
  if (!html.includes(`rel="canonical" href="${canonical}"`)) problems.push("canonical");
  if (!html.includes('property="og:type" content="website"')) problems.push("og:type");
  if (!html.includes(`property="og:url" content="${canonical}"`)) problems.push("og:url");
  if (!html.includes(`property="og:image" content="${SITE}/og/${id}.jpg"`)) problems.push("og:image");
  if (!html.includes('property="og:image:width" content="1200"')) problems.push("og:image:width");
  if (!html.includes('property="og:image:height" content="630"')) problems.push("og:image:height");
  if (!html.includes('name="twitter:card" content="summary_large_image"')) problems.push("twitter:card");
  if (!html.includes(`name="twitter:image" content="${SITE}/og/${id}.jpg"`)) problems.push("twitter:image");
  if (!html.includes(`<h1>${escapeText(page.heading)}</h1>`)) problems.push("h1");
  if (!html.includes('"@type": "Product"')) problems.push("product");
  if (!html.includes('"priceCurrency": "INR"')) problems.push("INR");
  if (!html.includes(`"price": "${page.template.price}"`)) problems.push("schema price");
  if (!html.includes('https://schema.org/InStock')) problems.push("availability");
  if (!html.includes('href="/browse"')) problems.push("browse link");
  const related = [...html.matchAll(/href="\/template\/([^"]+)"/g)].map((match) => match[1]);
  if (related.length !== 3) problems.push(`related ${related.length}`);
  if (problems.length) throw new Error(`SEO HTML ${id}: ${problems.join(", ")}`);
}

function prerender(list, templates, events) {
  const indexPath = path.join(root, "dist/index.html");
  if (!fs.existsSync(indexPath)) return;
  const base = fs.readFileSync(indexPath, "utf8");
  if (!base.includes('id="site-jsonld"')) {
    console.log("SEO: dist/index.html has no metadata yet, skipped HTML pages");
    return;
  }
  fs.writeFileSync(path.join(root, "dist/app.html"), fallbackHtml(base));
  for (const page of list) {
    const html = pageHtml(base, page, templates, events);
    assertTemplateHtml(html, page);
    if (page.path.startsWith("/browse/") && page.template) {
      const canonical = `${SITE}/template/${page.template.id}`;
      if (!html.includes(`rel="canonical" href="${canonical}"`)) {
        throw new Error(`SEO HTML ${page.path} canonical is not ${canonical}`);
      }
    }
    if (page.path === "/") {
      for (const link of ICON_LINKS.split("\n")) {
        if (!html.includes(link.trim())) throw new Error(`Homepage is missing ${link.trim()}`);
      }
      fs.writeFileSync(indexPath, html);
      continue;
    }
    const dir = path.join(root, "dist", page.path.slice(1));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
  }
}

const templates = readTemplates();
const events = readEvents();
const list = pages(templates, events);
await writeShareImages(root, templates);
writeSitemap(list);
prerender(list, templates, events);
console.log(`SEO: ${list.length} public URLs`);
