export type ShaadiTheme = "rani" | "emerald" | "ivory";

export type ShaadiFunction = {
  day: string;
  name: string;
  hindi: string;
  when: string;
  venue: string;
  dress: string;
};

/** Story frames, then one photograph per festivity, then the palace. Order is the editor slot order. */
export const SHAADI_SHOTS = [
  "First meeting",
  "Roka",
  "Engagement",
  "Pre-wedding",
  "Family",
  "Haldi",
  "Mehendi",
  "Sangeet",
  "Baraat",
  "Pheras",
  "Reception",
  "The palace",
] as const;

export const SHAADI_STORY_COUNT = 5;

export const SHAADI_FUNCTIONS: ShaadiFunction[] = [
  { day: "Day One · 22 November", name: "Haldi", hindi: "हल्दी", when: "Mon 22 Nov · 11:00 AM", venue: "Poolside Courtyard", dress: "Shades of yellow" },
  { day: "Day One · 22 November", name: "Mehendi", hindi: "मेहंदी", when: "Mon 22 Nov · 4:00 PM", venue: "The Garden Pavilion", dress: "Greens & florals" },
  { day: "Day Two · 23 November", name: "Sangeet", hindi: "संगीत", when: "Tue 23 Nov · 7:30 PM", venue: "Durbar Hall", dress: "Glam & sparkle" },
  { day: "Day Three · 24 November", name: "Baraat", hindi: "बारात", when: "Wed 24 Nov · 6:00 PM", venue: "From the Palace Gates", dress: "Safa & festive" },
  { day: "Day Three · 24 November", name: "Pheras", hindi: "फेरे", when: "Wed 24 Nov · 8:30 PM", venue: "Lakeside Mandap", dress: "Traditional Indian" },
  { day: "Day Three · 24 November", name: "Reception", hindi: "स्वागत समारोह", when: "Wed 24 Nov · 10:30 PM", venue: "The Mirror Terrace", dress: "Black tie Indian" },
];

export const SHAADI_LINES = JSON.stringify(SHAADI_FUNCTIONS);

export const SHAADI_VOWS = [
  { title: "Nourishment", text: "We promise to care for each other and our home, sharing every meal and every blessing." },
  { title: "Strength", text: "We promise to grow strong together — in body, mind and spirit — and to face life side by side." },
  { title: "Prosperity", text: "We promise to build our future honestly and share whatever fortune comes our way." },
  { title: "Family", text: "We promise to love and respect each other’s families as our very own." },
  { title: "Children", text: "We pray to be blessed with children and promise to raise them with kindness." },
  { title: "Seasons", text: "We promise to stay together through every season of life, in health and in hardship." },
  { title: "Friendship", text: "We promise to remain lifelong friends, partners and companions, forever." },
];

export type ShaadiEventKind = "haldi" | "mehendi" | "sangeet" | "baraat" | "pheras" | "reception" | "other";

export function eventKind(name: string): ShaadiEventKind {
  const label = name.toLowerCase();
  if (label.includes("haldi")) return "haldi";
  if (label.includes("meh")) return "mehendi";
  if (label.includes("sang")) return "sangeet";
  if (label.includes("bara") || label.includes("barat")) return "baraat";
  if (label.includes("pher")) return "pheras";
  if (label.includes("reception") || label.includes("swagat")) return "reception";
  return "other";
}

export const EVENT_LOOK: Record<ShaadiEventKind, { c1: string; c2: string; ink: string }> = {
  haldi: { c1: "#F4B400", c2: "#8A5A00", ink: "#2A1A00" },
  mehendi: { c1: "#6FA83F", c2: "#2F5A1A", ink: "#FFFFFF" },
  sangeet: { c1: "#C2185B", c2: "#5E0A2C", ink: "#FFFFFF" },
  baraat: { c1: "#E86A10", c2: "#6E2C00", ink: "#FFFFFF" },
  pheras: { c1: "#D32F2F", c2: "#5A0F0F", ink: "#FFFFFF" },
  reception: { c1: "#C9982E", c2: "#3A2A08", ink: "#2A1A00" },
  other: { c1: "#C9982E", c2: "#3A2A08", ink: "#2A1A00" },
};

export function shaadiPhotoShots(lines: string | undefined, shots: { label: string; text?: string }[]): { label: string; text?: string }[] {
  const festivities = festivitiesOf(lines);
  return [
    ...shots.slice(0, SHAADI_STORY_COUNT),
    ...festivities.map((item, index) => ({ label: item.name.trim() || `Celebration ${index + 1}` })),
    shots.at(-1) ?? { label: "The palace" },
  ];
}

export function festivitiesOf(lines: string | undefined): ShaadiFunction[] {
  if (!lines?.trim()) return SHAADI_FUNCTIONS.map((item) => ({ ...item }));
  try {
    const parsed = JSON.parse(lines) as unknown;
    if (!Array.isArray(parsed)) return SHAADI_FUNCTIONS.map((item) => ({ ...item }));
    return parsed.map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        day: String(row.day ?? ""),
        name: String(row.name ?? ""),
        hindi: String(row.hindi ?? ""),
        when: String(row.when ?? ""),
        venue: String(row.venue ?? ""),
        dress: String(row.dress ?? ""),
      };
    });
  } catch {
    return SHAADI_FUNCTIONS.map((item) => ({ ...item }));
  }
}

export function shaadiDays(items: ShaadiFunction[]) {
  const days: { label: string; items: { item: ShaadiFunction; index: number }[] }[] = [];
  items.forEach((item, index) => {
    if (!item.name.trim()) return;
    const label = item.day || "Celebrations";
    const found = days.find((day) => day.label === label);
    if (found) found.items.push({ item, index });
    else days.push({ label, items: [{ item, index }] });
  });
  return days;
}
