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
  { title: "Nourishment", text: "To share food, home, and the work of keeping one another well." },
  { title: "Strength", text: "To stand together in health and in hardship." },
  { title: "Prosperity", text: "To build a life that is generous beyond the two of you." },
  { title: "Family", text: "To honour the people who brought you here." },
  { title: "Children", text: "To welcome the next generation with patience." },
  { title: "Seasons", text: "To stay through the bright years and the quiet ones." },
  { title: "Friendship", text: "To remain companions, in this life and after." },
];

export function festivitiesOf(lines: string | undefined): ShaadiFunction[] {
  if (!lines?.trim()) return SHAADI_FUNCTIONS.map((item) => ({ ...item }));
  try {
    const parsed = JSON.parse(lines) as unknown;
    if (!Array.isArray(parsed)) return SHAADI_FUNCTIONS.map((item) => ({ ...item }));
    return parsed.map((item, index) => {
      const fallback = SHAADI_FUNCTIONS[index];
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        day: String(row.day ?? fallback?.day ?? ""),
        name: String(row.name ?? fallback?.name ?? ""),
        hindi: String(row.hindi ?? fallback?.hindi ?? ""),
        when: String(row.when ?? fallback?.when ?? ""),
        venue: String(row.venue ?? fallback?.venue ?? ""),
        dress: String(row.dress ?? fallback?.dress ?? ""),
      };
    });
  } catch {
    return SHAADI_FUNCTIONS.map((item) => ({ ...item }));
  }
}

export function shaadiDays(items: ShaadiFunction[]) {
  const days: { label: string; items: { item: ShaadiFunction; index: number }[] }[] = [];
  items.forEach((item, index) => {
    const label = item.day || "Celebrations";
    const found = days.find((day) => day.label === label);
    if (found) found.items.push({ item, index });
    else days.push({ label, items: [{ item, index }] });
  });
  return days;
}
