import type { EventId, InviteFields, Template, TemplateMeta } from "../types";
import { SHAADI_LINES } from "../components/shaadi";
import { linesFor } from "./custom";
import { getEvent } from "./events";
import catalogMeta from "./template-meta.json" with { type: "json" };

const META = catalogMeta as Record<string, TemplateMeta>;

function sample(
  event: EventId,
  fields: Omit<InviteFields, "event" | "hostEmail" | "receptionTime" | "receptionVenue" | "receptionAddress" | "photos" | "audio" | "lat" | "lng" | "lines"> &
    Partial<Pick<InviteFields, "hostEmail" | "receptionTime" | "receptionVenue" | "receptionAddress" | "photos" | "audio" | "lat" | "lng" | "lines">>,
): InviteFields {
  return {
    event,
    hostEmail: "",
    receptionTime: "",
    receptionVenue: "",
    receptionAddress: "",
    photos: [],
    audio: "",
    lat: "",
    lng: "",
    lines: "",
    ...fields,
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "gazal",
    name: "Gazal",
    style: "gazal",
    price: 0,
    free: true,
    events: ["marriage"],
    tagline: "Nikah",
    description: "An emerald Nikah invitation. An opening card, the ceremony and walima, photographs if you add them, and a reply on the page.",
    asks: { photos: 4, audio: true, location: true },
    meta: META.gazal,
    samples: {
      marriage: sample("marriage", {
        hosts: "The Hashim & Rahman families",
        names: "Imran Hashim & Safa Rahman",
        title: "We joyfully invite you to the Nikah of our beloved children",
        detail: "",
        date: "2027-01-15",
        time: "11:00",
        venue: "Al Noor Masjid & Hall",
        address: "Main Road, Malappuram",
        message: "Your presence and duas mean the world to us. We would be honoured to have you with us as they begin their new life together.",
        dress: "Traditional and modest attire. Pastel shades welcome for the Walima.",
        rsvpBy: "2026-12-31",
        receptionTime: "19:00",
        receptionVenue: "Grand Palace Auditorium",
        receptionAddress: "NH Bypass, Malappuram",
      }),
    },
  },
  {
    id: "aurelia",
    name: "Aurelia",
    style: "aurelia",
    price: 0,
    free: true,
    events: ["marriage"],
    tagline: "Wedding",
    description: "A navy and gold wedding page. A title screen, the couple, the ceremony and reception, then wishes.",
    asks: { photos: 4, audio: true, location: true },
    meta: META.aurelia,
    samples: {
      marriage: sample("marriage", {
        hosts: "The Hashim & Rahman families",
        names: "Imran Hashim & Safa Rahman",
        title: "We joyfully invite you to the wedding of our beloved children",
        detail: "",
        date: "2027-01-15",
        time: "11:00",
        venue: "Al Noor Masjid & Hall",
        address: "Main Road, Malappuram",
        message: "Two souls, one heart. Your presence and wishes mean the world to us.",
        dress: "",
        rsvpBy: "2026-12-31",
        receptionTime: "19:00",
        receptionVenue: "Grand Palace Auditorium",
        receptionAddress: "NH Bypass, Malappuram",
      }),
    },
  },
  {
    id: "anna",
    name: "Anna",
    style: "anna",
    price: 1250,
    free: false,
    events: ["marriage"],
    tagline: "Garden wedding",
    description: "A cream garden wedding. Flip the card for the date, then the day, the venues, and a reply.",
    asks: { photos: 3, audio: true, location: true },
    meta: META.anna,
    samples: {
      marriage: sample("marriage", {
        hosts: "Together with their families",
        names: "Anna & Joel",
        title: "are getting married and would love for you to be there.",
        detail: "Kottayam, Kerala",
        date: "2027-05-08",
        time: "15:00",
        venue: "St. Joseph's Church",
        address: "Baker Junction, Kottayam",
        message: "From classmates to forever.",
        lines: linesFor("anna"),
        dress: "Sarees, lehengas, suits or linen. Earthy shades are welcome — please skip white and ivory.",
        rsvpBy: "2027-04-01",
        receptionTime: "19:00",
        receptionVenue: "Lakeside Convention Centre",
        receptionAddress: "Kumarakom Road, Kottayam",
      }),
    },
  },
  {
    id: "baptism",
    name: "Baptism",
    style: "baptism",
    price: 1299,
    free: false,
    events: ["baptism"],
    tagline: "Baptism",
    description: "A sky-blue baptism. A dove opens the invitation, then the day, the godparents, and a blessing.",
    asks: { photos: 4, audio: true, location: true },
    meta: META.baptism,
    samples: {
      baptism: sample("baptism", {
        hosts: "Jacob & Maria Thomas",
        names: "Ethan Joseph",
        title: "Please join us for the Holy Baptism of",
        detail: "beloved son of",
        date: "2027-03-14",
        time: "10:30",
        venue: "St. Mary's Church",
        address: "Pala",
        message: "Suffer the little children to come unto me, and forbid them not: for of such is the kingdom of God.",
        dress: "",
        rsvpBy: "2027-02-28",
        receptionTime: "12:30",
        receptionVenue: "Parish Hall",
        receptionAddress: "next to the church",
        lines: linesFor("baptism"),
      }),
    },
  },
  {
    id: "vivah",
    name: "Vivah",
    style: "vivah",
    price: 1500,
    free: false,
    events: ["marriage"],
    tagline: "Wedding",
    description: "A night-sky wedding. The doors open onto the Muhurtham, the celebrations, and a reply.",
    asks: { photos: 6, audio: true, location: true },
    meta: META.vivah,
    samples: {
      marriage: sample("marriage", {
        hosts: "the Menon & Nair families",
        names: "Karthik & Nandana",
        title: "request the honour of your presence",
        detail: "",
        date: "2027-02-12",
        time: "10:30",
        venue: "Sree Krishna Temple Auditorium",
        address: "Guruvayur",
        message: "From our pre-wedding shoot on the backwaters of Alleppey — a few favourite frames before the big day.",
        dress: "Kasavu, silks and jewel tones for the Muhurtham. Go bold and festive for the Sangeet.",
        lines: linesFor("vivah"),
        rsvpBy: "2027-01-15",
        receptionTime: "19:00",
        receptionVenue: "Grand Hyatt Bolgatty",
        receptionAddress: "Kochi",
      }),
    },
  },
  {
    id: "beach",
    name: "Beach",
    style: "beach",
    price: 2000,
    free: false,
    events: ["marriage"],
    tagline: "Wedding",
    description: "A bottle on the shore opens onto sunset vows, a beach reception, and a reply.",
    asks: { photos: 3, audio: true, location: true },
    meta: META.beach,
    samples: {
      marriage: sample("marriage", {
        hosts: "",
        names: "Rohan & Alisha",
        title: "are tying the knot by the sea",
        detail: "",
        date: "2027-03-20",
        time: "17:30",
        venue: "Cliff-top lawn",
        address: "Varkala",
        message: "Shuttles from the airport on Friday afternoon. Rooms are held at two cliff-top resorts — mention “Rohan & Alisha” when booking.",
        dress: "Light linens, flowing sarees and breezy dresses. Leave the heels at home — we'll be on sand!",
        lines: linesFor("beach"),
        rsvpBy: "2027-02-20",
        receptionTime: "19:30",
        receptionVenue: "Black Beach, below the cliff",
        receptionAddress: "Varkala",
      }),
    },
  },
  {
    id: "hearth",
    name: "Hearth",
    style: "home",
    price: 599,
    free: false,
    events: ["housewarming"],
    tagline: "Housewarming",
    description: "A front door opens onto a griha pravesh, a house tour, and a reply.",
    asks: { photos: 4, audio: true, location: true },
    meta: META.hearth,
    samples: {
      housewarming: sample("housewarming", {
        hosts: "",
        names: "Arun, Deepa & little Aadi",
        title: "invite you to bless our new home",
        detail: "As tradition goes, we'll boil milk in our new kitchen and let it overflow — a wish for a home that always brims with abundance, warmth and happiness. We'd love for you to be there when it bubbles over!",
        date: "2027-01-17",
        time: "06:30",
        venue: "Flat 4B, Green Meadows Villas",
        address: "Kakkanad",
        message: "No gifts please — just bring your blessings, your appetite and your best stories.",
        lines: linesFor("hearth"),
        dress: "",
        rsvpBy: "2027-01-10",
      }),
    },
  },
  {
    id: "shaadi",
    name: "Shaadi",
    style: "shaadi",
    price: 1500,
    free: false,
    events: ["marriage"],
    tagline: "Shaadi",
    description: "A palace wedding. The veil lifts onto six festivities, a photograph for every frame, and a reply.",
    asks: { photos: 12, audio: true, location: true },
    meta: META.shaadi,
    samples: {
      marriage: sample("marriage", {
        hosts: "Mrs. & Mr. Rajiv Sharma and Mrs. & Mr. Anil Malhotra",
        names: "Aarav Sharma & Ishita Malhotra",
        title: "शुभ विवाह",
        detail: "son of Meera & Rajiv Sharma · daughter of Nisha & Anil Malhotra",
        date: "2027-11-24",
        time: "20:30",
        venue: "The Aravalli Palace",
        address: "Lakeside, Udaipur",
        message: "With the blessings of both families, we invite you to the wedding of Aarav and Ishita.",
        dress: "",
        rsvpBy: "2027-10-25",
        lines: SHAADI_LINES,
      }),
    },
  },
  {
    id: "thiruvizha",
    name: "Thiruvizha",
    style: "thiruvizha",
    price: 1600,
    free: false,
    events: ["marriage"],
    tagline: "Tamil wedding",
    description: "A Tamil wedding. The kolam opens onto the muhurtham, the rituals and a reply — in English, Tamil, or both — with one nadaswaram.",
    asks: { photos: 4, audio: true, location: true },
    meta: META.thiruvizha,
    samples: {
      marriage: sample("marriage", {
        hosts: "The Iyer & Subramanian families",
        names: "Arjun & Meenakshi",
        title: "request the honour of your presence at the wedding of our children",
        detail: "அர்ஜுன் & மீனாட்சி",
        date: "2027-04-18",
        time: "09:15",
        venue: "Meenakshi Temple Mandapam",
        address: "Madurai",
        message: "With the blessings of our elders, we invite you to the thiruvizha of our children. Your presence will complete the day.",
        dress: "Kanjivaram silks and veshti. Temple jewellery welcome.\nகாஞ்சிபுரம் பட்டு, வேட்டி. கோவில் நகைகள் வரவேற்கப்படுகின்றன.",
        rsvpBy: "2027-03-20",
        receptionTime: "18:30",
        receptionVenue: "The Grand Pandhal",
        receptionAddress: "KK Nagar, Madurai",
        lines: linesFor("thiruvizha"),
      }),
    },
  },
  {
    id: "peace",
    name: "Peace",
    style: "peace",
    price: 999,
    free: false,
    events: ["marriage"],
    tagline: "Gift hamper",
    description: "A gift-hamper wedding. The ribbon opens onto the day, the story, the celebrations and a reply.",
    asks: { photos: 5, audio: true, location: true },
    meta: META.peace,
    samples: {
      marriage: sample("marriage", {
        hosts: "Together with their families",
        names: "Maya & Dev",
        title: "are getting married",
        detail: "Priya & Vivek",
        date: "2028-12-09",
        time: "17:00",
        venue: "The Glasshouse",
        address: "Bengaluru",
        message: "See you there",
        dress: "Black-tie optional in soft neutrals, blush and champagne.",
        rsvpBy: "2028-11-09",
        lines: linesFor("peace"),
      }),
    },
  },
];

export function getTemplate(id: string | undefined) {
  return TEMPLATES.find((template) => template.id === id);
}

export function templatesFor(eventId: string | undefined) {
  return TEMPLATES.filter((template) => template.events.includes(eventId as EventId));
}

export function sampleFor(template: Template, eventId: string | undefined) {
  const event = template.events.includes(eventId as EventId) ? (eventId as EventId) : template.events[0];
  return { ...(template.samples[event] as InviteFields) };
}

export function withCatalogMeta(template: Omit<Template, "meta"> & { meta?: TemplateMeta }): Template {
  const local = META[template.id];
  const incoming = template.meta?.components?.length ? template.meta : undefined;
  const meta = incoming
    ? { ...local, ...incoming, shots: incoming.shots?.length ? incoming.shots : local?.shots ?? [] }
    : local;
  return {
    ...template,
    meta: meta ?? {
      names: "couple",
      components: [],
      themes: [],
      defaultTheme: "",
      shots: [],
      ceremony: "Ceremony",
      rsvp: { meal: false, song: false, maxGuests: 4 },
    },
  };
}

export function usesField(template: Template, field: keyof InviteFields) {
  return template.meta.components.some((item) => item.configurable && item.fields.includes(field));
}

export function hasComponent(template: Template, id: Template["meta"]["components"][number]["id"]) {
  return template.meta.components.some((item) => item.id === id);
}

export function formatPrice(template: Template) {
  return template.free ? "Free" : `₹${template.price.toLocaleString("en-IN")}`;
}

export function eventLabels(template: Template) {
  return template.events.map((id) => getEvent(id).label).join(" · ");
}
