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
