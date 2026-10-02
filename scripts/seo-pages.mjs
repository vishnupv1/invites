import fs from "node:fs";
import path from "node:path";

const SITE = "https://invitesready.com";
const root = path.resolve(import.meta.dirname, "..");
const BRAND_IMAGE = `${SITE}/covers/shaadi.jpg`;
const HOME_DESCRIPTION =
  "Customize a digital poster for a wedding, nikah, baptism, or housewarming. Start free, or pick a premium design, then share one link for RSVPs.";

const FAQS = [
  ["Do my guests need an app or an account?", "No. Guests open your link in any browser and RSVP in one tap — it works on basic phones too."],
  ["Can I design before signing up?", "Yes. Pick a template and customise it as a guest. We only ask you to log in when you publish, and your draft comes with you."],
  ["Can different guests see different functions?", "Yes. Put guests into groups and choose which functions each group sees."],
  ["Is our family information private?", "Pages can be password-protected, and the address can stay hidden until a guest says yes."],
  ["Can I edit after sending?", "Of course — every guest sees the latest version through the same link."],
];

const STATIC = [
  ["/", "Customize digital posters — free or premium | InvitesReady", HOME_DESCRIPTION],
  ["/how", "How digital invitations work | InvitesReady", "Pick a template, add your details, and share one link. Guests open it in the browser and RSVP without an app."],
  ["/features", "Invitation features | InvitesReady", "RSVPs, guest groups, reminders, a photo wall, and password-protected pages for wedding and family invitations."],
  ["/pricing", "Invitation pricing | InvitesReady", "Design for free. Publish a free template at no cost, or buy a premium invitation once for your celebration."],
  ["/faq", "Invitation questions | InvitesReady", "Guests do not need an app. You can design before you sign up, edit after sending, and keep the address private."],
  ["/occasions", "Wedding, baptism, and housewarming invitations | InvitesReady", "Digital invitations for weddings, nikah, engagements, baptisms, birthdays, anniversaries, and housewarmings."],
  ["/browse", "Invitation templates | InvitesReady", "Browse wedding, engagement, baptism, birthday, and housewarming invitation templates. Preview each design before you buy."],
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
      description: "Digital invitations for weddings and other celebrations. Design one, share the link, and collect replies.",
    });
    graph.push(faqEntity());
    graph.push({
      "@type": "ItemList",
      name: "Invitation templates",
      itemListElement: templates.map((template, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE}/preview/${template.id}`,
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
        url: `${SITE}/preview/${page.template.id}`,
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
          url: `${SITE}/preview/${template.id}`,
          name: template.name,
        })),
      },
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function pageHtml(base, page, templates) {
  let html = base;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(page.title)}</title>`);
  html = replaceMeta(html, "name", "description", page.description);
  html = replaceMeta(html, "name", "robots", "index, follow");
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}${page.path === "/" ? "/" : page.path}$2`);
  html = replaceMeta(html, "property", "og:title", page.title);
  html = replaceMeta(html, "property", "og:description", page.description);
  html = replaceMeta(html, "property", "og:url", `${SITE}${page.path === "/" ? "/" : page.path}`);
  html = replaceMeta(html, "property", "og:image", page.image);
  html = replaceMeta(html, "name", "twitter:title", page.title);
  html = replaceMeta(html, "name", "twitter:description", page.description);
  html = replaceMeta(html, "name", "twitter:image", page.image);
  const json = JSON.stringify(graphFor(page, templates), null, 2);
  html = html.replace(
    /<script id="site-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="site-jsonld" type="application/ld+json">\n${json}\n    </script>`,
  );
  if (page.path !== "/") html = html.replace(/<noscript id="seo-fallback">[\s\S]*?<\/noscript>\s*/, "");
  return html;
}

function pages(templates, events) {
  const list = STATIC.map(([pathname, title, description]) => ({
    path: pathname,
    title,
    description,
    image: BRAND_IMAGE,
  }));
  for (const template of templates) {
    const description = template.free
      ? `Preview the ${template.name} invitation. This design is free to publish.`
      : `Preview the ${template.name} invitation. Buy it once, then use it for your celebration.`;
    const image = `${SITE}/covers/${template.id}.jpg`;
    for (const prefix of ["preview", "template"]) {
      list.push({
        path: `/${prefix}/${template.id}`,
        title: `${template.name} invitation template | InvitesReady`,
        description,
        image,
        template,
      });
    }
  }
  for (const event of events) {
    if (!templates.some((template) => template.events.includes(event.id))) continue;
    list.push({
      path: `/c/${event.id}`,
      title: `${event.label} invitations | InvitesReady`,
      description: `Invitation templates for a ${event.label.toLowerCase()}. Preview a design, then share one link with your guests.`,
      image: BRAND_IMAGE,
      event,
    });
  }
  return list;
}

function writeSitemap(list) {
  const urls = list
    .map((page) => `  <url><loc>${SITE}${page.path === "/" ? "/" : page.path}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
  const dist = path.join(root, "dist/sitemap.xml");
  if (fs.existsSync(path.dirname(dist))) fs.writeFileSync(dist, xml);
}

function prerender(list, templates) {
  const indexPath = path.join(root, "dist/index.html");
  if (!fs.existsSync(indexPath)) return;
  const base = fs.readFileSync(indexPath, "utf8");
  if (!base.includes('id="site-jsonld"')) {
    console.log("SEO: dist/index.html has no metadata yet, skipped HTML pages");
    return;
  }
  for (const page of list) {
    const html = pageHtml(base, page, templates);
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
prerender(list, templates);
console.log(`SEO: ${list.length} public URLs`);
