import type { EventId, InviteFields, Template } from "../types";
import { getEvent } from "./events";

function sample(
  event: EventId,
  fields: Omit<InviteFields, "event" | "hostEmail" | "receptionTime" | "receptionVenue" | "receptionAddress" | "photos" | "audio" | "lat" | "lng"> &
    Partial<Pick<InviteFields, "hostEmail" | "receptionTime" | "receptionVenue" | "receptionAddress" | "photos" | "audio" | "lat" | "lng">>,
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
    asks: { photos: 4, audio: true, location: true },
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
    samples: {
      baptism: sample("baptism", {
        hosts: "Jacob & Maria Thomas",
        names: "Ethan Joseph",
        title: "Please join us for the Holy Baptism of",
        detail: "",
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
        message: "",
        dress: "Kasavu, silks and jewel tones for the Muhurtham. Go bold and festive for the Sangeet.",
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
    asks: { photos: 6, audio: true, location: true },
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
        message: "",
        dress: "Light linens, flowing sarees and breezy dresses. Leave the heels at home — we'll be on sand!",
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
    samples: {
      housewarming: sample("housewarming", {
        hosts: "",
        names: "Arun, Deepa & little Aadi",
        title: "invite you to bless our new home",
        detail: "",
        date: "2027-01-17",
        time: "06:30",
        venue: "Flat 4B, Green Meadows Villas",
        address: "Kakkanad",
        message: "",
        dress: "",
        rsvpBy: "2027-01-10",
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

export function formatPrice(template: Template) {
  return template.free ? "Free" : `₹${template.price.toLocaleString("en-IN")}`;
}

export function eventLabels(template: Template) {
  return template.events.map((id) => getEvent(id).label).join(" · ");
}
