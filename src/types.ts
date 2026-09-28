export type EventId =
  | "marriage"
  | "reception"
  | "birthday"
  | "anniversary"
  | "engagement"
  | "housewarming"
  | "baptism";

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
  /** JSON list of festivities: day, name, hindi, when, venue, dress. */
  lines?: string;
};

export type TemplateAsks = {
  photos: number;
  audio: boolean;
  location: boolean;
};

export type ComponentId =
  | "opening"
  | "hosts"
  | "names"
  | "line"
  | "detail"
  | "message"
  | "when"
  | "ceremony"
  | "reception"
  | "dress"
  | "gallery"
  | "countdown"
  | "story"
  | "travel"
  | "programme"
  | "house"
  | "gift"
  | "rsvp"
  | "wishes"
  | "music";

export type TemplateComponent = {
  id: ComponentId;
  label: string;
  configurable: boolean;
  fields: (keyof InviteFields)[];
};

export type TemplateTheme = {
  id: string;
  name: string;
};

export type TemplateShot = {
  label: string;
};

export type NameShape = "couple" | "child" | "family";

export type TemplateMeta = {
  names: NameShape;
  components: TemplateComponent[];
  themes: TemplateTheme[];
  defaultTheme: string;
  shots: TemplateShot[];
  ceremony: string;
  reception?: string;
  rsvp: { meal: boolean; song: boolean; maxGuests: number };
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
  | "hearth"
  | "gazal"
  | "aurelia"
  | "anna"
  | "baptism"
  | "vivah"
  | "beach"
  | "home"
  | "shaadi";

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
  meta: TemplateMeta;
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
