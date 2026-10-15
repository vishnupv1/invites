const BRAND = " | InvitesReady";
const TITLE_LIMIT = 70;

export function priceLabel(template) {
  if (template.free || Number(template.price) === 0) return "Free";
  return `₹${Number(template.price)} one-time`;
}

function capitalise(value) {
  if (!value) return "Wedding";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fitTitle(name, style, occasion, priceBit) {
  const price = ` (${priceBit})`;
  let words = String(style || "Animated").split(/\s+/).filter(Boolean);
  while (words.length) {
    const title = `${name} – ${words.join(" ")} ${occasion} Invitation${price}${BRAND}`;
    if (title.length <= TITLE_LIMIT) return title;
    words.pop();
  }
  const bare = `${name} – ${occasion} Invitation${price}${BRAND}`;
  if (bare.length <= TITLE_LIMIT) return bare;
  const short = `${name} Invitation${price}${BRAND}`;
  return short.length <= TITLE_LIMIT ? short : short.slice(0, TITLE_LIMIT).trim();
}

function fitDescription(template, occasion) {
  const price = template.free || Number(template.price) === 0 ? "Free." : `₹${Number(template.price)} one-time.`;
  const tail = `Animated opening, RSVP on the page, share on WhatsApp. ${price}`;
  const keyword = capitalise(occasion);
  const named = `${keyword} invitation, ${template.name}. ${tail}`;
  if (named.length <= 155) return named;
  const plain = `${keyword} invitation. ${tail}`;
  return plain.length <= 155 ? plain : plain.slice(0, 155).trim();
}

export function generatedTemplateSeo(template, extra = {}) {
  const occasion = extra.occasion || (template.events?.[0] === "baptism"
    ? "Baptism"
    : template.events?.[0] === "birthday"
      ? "Birthday"
      : template.events?.[0] === "housewarming"
        ? "Housewarming"
        : template.tagline === "Nikah"
          ? "Nikah"
          : "Wedding");
  const style = extra.style || "Animated";
  const priceBit = template.free || Number(template.price) === 0 ? "Free" : `₹${Number(template.price)}`;
  const description = fitDescription(template, occasion);
  return {
    heading: `${template.name} ${occasion.toLowerCase()} invitation`,
    title: fitTitle(template.name, style, occasion, priceBit),
    description,
    lead: (template.description || description).trim(),
  };
}
