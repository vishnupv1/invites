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
  return template.free ? "Free" : `$${template.price}`;
}

export function eventLabels(template: Template) {
  return template.events.map((id) => getEvent(id).label).join(" · ");
}
