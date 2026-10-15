export function templateFacts(template, phrase, occasions) {
  const languages = phrase?.languages?.length ? phrase.languages : ["English"];
  const included = (template.meta?.components || template.components || []).map((item) => item.label).filter(Boolean);
  const price = template.free || Number(template.price) === 0
    ? "Free to publish."
    : `Listed at ₹${Number(template.price)}, paid once.`;
  const suitable = occasions?.length ? occasions : [phrase?.occasion || "a celebration"];
  const includedLine = included.length ? included.join(", ") : "an animated opening, the details, and a reply";
  return {
    review: "TODO: review copy",
    included,
    suitable,
    languages,
    guestSees: template.description || `${template.name} opens in the browser.`,
    price: `${price} You can edit the page after sending, and guests keep the same link. TODO: review copy.`,
    faqs: [
      {
        q: `What is included in ${template.name}?`,
        a: `TODO: review copy. ${template.name} includes ${includedLine}. Guests open one link and RSVP in the browser. They do not need an app.`,
      },
      {
        q: `Who is ${template.name} suitable for?`,
        a: `TODO: review copy. It is suitable for ${suitable.join(", ")}. The wording is yours to edit.`,
      },
      {
        q: `What does ${template.name} cost?`,
        a: `TODO: review copy. ${price} The price is one-time, not per guest.`,
      },
    ],
  };
}
