import defaults from "./custom-defaults.json" with { type: "json" };

export type StoryBeat = { year: string; title: string; text: string };
export type ProgrammeItem = { time: string; title: string; text: string };
export type RoomItem = { label: string; name: string; text: string; note: string };
export type PersonItem = { name: string; role: string };
export type FactItem = { label: string; value: string };
export type FaqItem = { q: string; a: string };

export type CustomPack = {
  story?: StoryBeat[];
  programme?: ProgrammeItem[];
  rooms?: RoomItem[];
  people?: PersonItem[];
  facts?: FactItem[];
  faqs?: FaqItem[];
  sangeetTime?: string;
  sangeetVenue?: string;
  caption?: string;
  travelFrom?: string;
  travelKm?: string;
  airport?: string;
  stay?: string;
  gift?: string;
};

const DEFAULTS = defaults as Record<string, CustomPack>;

function mergeList<T extends object>(fallback: T[] | undefined, incoming: unknown): T[] | undefined {
  if (!fallback) return undefined;
  if (!Array.isArray(incoming)) return fallback.map((item) => ({ ...item }));
  return incoming.map((item, index) => ({ ...(fallback[index] ?? {}), ...(item && typeof item === "object" ? item : {}) })) as T[];
}

export function packOf(id: string, lines: string | undefined): CustomPack {
  const base = DEFAULTS[id];
  if (!base) return {};
  if (!lines?.trim() || lines.trim().startsWith("[")) {
    return {
      ...base,
      story: base.story?.map((item) => ({ ...item })),
      programme: base.programme?.map((item) => ({ ...item })),
      rooms: base.rooms?.map((item) => ({ ...item })),
      people: base.people?.map((item) => ({ ...item })),
      facts: base.facts?.map((item) => ({ ...item })),
      faqs: base.faqs?.map((item) => ({ ...item })),
    };
  }
  try {
    const parsed = JSON.parse(lines) as CustomPack;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return packOf(id, "");
    return {
      ...base,
      ...parsed,
      story: mergeList(base.story, parsed.story),
      programme: mergeList(base.programme, parsed.programme),
      rooms: mergeList(base.rooms, parsed.rooms),
      people: mergeList(base.people, parsed.people),
      facts: mergeList(base.facts, parsed.facts),
      faqs: mergeList(base.faqs, parsed.faqs),
    };
  } catch {
    return packOf(id, "");
  }
}

export function linesFor(id: string) {
  return DEFAULTS[id] ? JSON.stringify(DEFAULTS[id]) : "";
}
