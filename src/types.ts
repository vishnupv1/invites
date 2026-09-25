export type EventId =
  | "marriage"
  | "reception"
  | "birthday"
  | "anniversary"
  | "engagement"
  | "housewarming";

export type InviteFields = {
  event: EventId;
  hosts: string;
  names: string;
  title: string;
  detail: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  message: string;
  dress: string;
  rsvpBy: string;
  hostEmail: string;
  receptionTime: string;
  receptionVenue: string;
  receptionAddress: string;
  photos: string[];
  audio: string;
  lat: string;
  lng: string;
};

export type TemplateAsks = {
  photos: number;
  audio: boolean;
  location: boolean;
};

export type TemplateStyle =
  | "garden"
  | "midnight"
  | "marigold"
  | "confetti"
  | "table"
  | "banquet"
  | "lantern"
  | "spark"
  | "years"
  | "promise"
  | "hearth";

export type Template = {
  id: string;
  name: string;
  style: TemplateStyle;
  price: number;
  free: boolean;
  events: EventId[];
  tagline: string;
  description: string;
  asks: TemplateAsks;
  samples: Partial<Record<EventId, InviteFields>>;
};

export type SavedInvite = {
  id: string;
  templateId: string;
  code: string;
  names: string;
  title: string;
  date: string;
  createdAt: string;
  replies?: number;
  yes?: number;
  event?: string;
  cover?: string;
  venue?: string;
  time?: string;
  receptionVenue?: string;
  receptionTime?: string;
};

export type Rsvp = {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
  note: string;
  at: string;
};

export type InvitePayload = {
  t: string;
  f: InviteFields;
};
