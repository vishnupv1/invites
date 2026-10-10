const BRAND = " | InvitesReady";

export function priceLabel(template) {
  if (template.free || Number(template.price) === 0) return "Free";
  return `₹${Number(template.price)} one-time`;
}

function occasionWord(template) {
  const event = template.events?.[0];
  if (event === "baptism") return "Baptism";
  if (event === "birthday") return "Birthday";
  if (event === "housewarming") return "Housewarming";
  if (template.tagline === "Nikah") return "Nikah";
  return "Wedding";
}

function hookFor(template, occasion) {
  const tagline = (template.tagline || "").trim();
  if (tagline && tagline.toLowerCase() !== occasion.toLowerCase() && tagline.length <= 16) return tagline;
  const sentence = (template.description || "").split(/[.!]/)[0] || "";
  const words = sentence.replace(/[^A-Za-z0-9' -]/g, "").trim().split(/\s+/).slice(0, 2).join(" ");
  return words || "Animated";
}

function fitTitle(name, hook, occasion) {
  const tail = ` ${occasion} Invitation${BRAND}`;
  const full = `${name} – ${hook}${tail}`;
  if (full.length <= 60) return full;
  const room = 60 - `${name} – ${tail}`.length;
  if (room >= 4) {
    const cut = hook.slice(0, room).replace(/\s+\S*$/, "").trim();
    if (cut.length >= 3) return `${name} – ${cut}${tail}`;
  }
  const bare = `${name}${tail}`;
  return bare.length <= 60 ? bare : `${name} Invitation${BRAND}`.slice(0, 60).trim();
}

function fitDescription(template) {
  const price = priceLabel(template);
  const tail = `Animated opening, RSVP on the page, share on WhatsApp. ${price}.`;
  const opening = (template.description || `${template.name} invitation`).replace(/\s+/g, " ").trim();
  const full = `${opening} ${tail}`;
  if (full.length <= 155) return full;
  const short = `${template.name} invitation. ${tail}`;
  return short.length <= 155 ? short : short.slice(0, 155).trim();
}

export function generatedTemplateSeo(template) {
  const occasion = occasionWord(template);
  const hook = hookFor(template, occasion);
  const description = fitDescription(template);
  return {
    heading: `${template.name} ${occasion.toLowerCase()} invitation`,
    title: fitTitle(template.name, hook, occasion),
    description,
    lead: (template.description || description).trim(),
  };
}
