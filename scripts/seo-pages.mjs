import fs from "node:fs";
import path from "node:path";

const SITE = "https://invitesready.com";
const root = path.resolve(import.meta.dirname, "..");
const BRAND_IMAGE = `${SITE}/covers/shaadi.jpg`;
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
  ["/", seoCopy.pages["/"].title, HOME_DESCRIPTION],
  ["/how", "How digital invitations work | InvitesReady", "Pick a template, add your details, and share one link. Guests open it in the browser and RSVP without an app."],
  ["/features", "Invitation features | InvitesReady", "RSVPs, guest groups, reminders, a photo wall, and password-protected pages for wedding and family invitations."],
  ["/faq", "Invitation questions | InvitesReady", "Guests do not need an app. You can design before you sign up, edit after sending, and keep the address private."],
  ["/occasions", seoCopy.pages["/occasions"].title, seoCopy.pages["/occasions"].description],
  ["/browse", seoCopy.pages["/browse"].title, seoCopy.pages["/browse"].description],
  ["/privacy", "Privacy policy | InvitesReady", "How InvitesReady collects, uses, and stores account details, invitation content, guest replies, and payments."],
  ["/terms", "Terms of use | InvitesReady", "The terms for creating an account, designing an invitation, and buying a template on InvitesReady."],
  ["/refunds", "Refunds | InvitesReady", "When a one-time InvitesReady template purchase can be refunded, and how to ask."],
  ["/contact", "Contact | InvitesReady", "Contact InvitesReady about your account, a template purchase, or a published invitation."],
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
    const related = templates.filter(
      (other) => other.id !== template.id && other.events.some((event) => template.events.includes(event)),
    );
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

function pageHtml(base, page, templates, events) {
  const url = `${SITE}${canonicalPath(page)}`;
  let html = base;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(page.title)}</title>`);
  html = replaceMeta(html, "name", "description", page.description);
  html = replaceMeta(html, "name", "robots", "index, follow");
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = replaceMeta(html, "property", "og:title", page.title);
  html = replaceMeta(html, "property", "og:description", page.description);
  html = replaceMeta(html, "property", "og:url", url);
  html = replaceMeta(html, "property", "og:image", page.image);
  html = replaceMeta(html, "name", "twitter:title", page.title);
  html = replaceMeta(html, "name", "twitter:description", page.description);
  html = replaceMeta(html, "name", "twitter:image", page.image);
  const json = JSON.stringify(graphFor(page, templates), null, 2);
  html = html.replace(
    /<script id="site-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="site-jsonld" type="application/ld+json">\n${json}\n    </script>`,
  );
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyFor(page, templates, events)}</div>`);
  return html;
}

function fallbackHtml(base) {
  let html = base;
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
  const list = STATIC.map(([pathname, title, description]) => ({
    path: pathname,
    title,
    heading: pathname === "/" ? "Invitations your guests open, answer and remember." : undefined,
    description,
    image: BRAND_IMAGE,
  }));
  for (const template of templates) {
    const line = seoCopy.templates[template.id];
    const description = line?.description ?? (template.free
      ? `Preview the ${template.name} invitation. This design is free to publish.`
      : `Preview the ${template.name} invitation. Buy it once, then use it for your celebration.`);
    const image = `${SITE}/covers/${template.id}.jpg`;
    for (const prefix of ["template"]) {
      list.push({
        path: `/${prefix}/${template.id}`,
        canonical: `/template/${template.id}`,
        title: line?.title ?? `${template.name} invitation template | InvitesReady`,
        heading: line?.heading ?? `${template.name} invitation template`,
        description,
        image,
        template,
      });
    }
  }
  for (const topic of seoCopy.topics) {
    list.push({
      path: topic.path,
      title: topic.title,
      heading: topic.heading,
      description: topic.lead,
      image: BRAND_IMAGE,
      topic,
    });
  }
  for (const event of events) {
    if (!templates.some((template) => template.events.includes(event.id))) continue;
    const line = seoCopy.categories[event.id];
    list.push({
      path: `/c/${event.id}`,
      title: line?.title ?? `${event.label} invitations | InvitesReady`,
      description: line?.lead ?? `Invitation templates for a ${event.label.toLowerCase()}. Preview a design, then share one link with your guests.`,
      image: BRAND_IMAGE,
      event,
    });
  }
  return list;
}

function writeSitemap(list) {
  const urls = list
    .filter((page) => canonicalPath(page) === page.path)
    .map((page) => `  <url><loc>${SITE}${page.path}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
  const dist = path.join(root, "dist/sitemap.xml");
  if (fs.existsSync(path.dirname(dist))) fs.writeFileSync(dist, xml);
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
    if (page.path === "/") {
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
writeSitemap(list);
prerender(list, templates, events);
console.log(`SEO: ${list.length} public URLs`);
