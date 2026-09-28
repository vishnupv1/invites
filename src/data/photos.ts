import type { TemplateShot } from "../types";

export type PhotoNote = { title: string; text: string };

export function photoNotes(raw: string | undefined, shots: TemplateShot[]): PhotoNote[] {
  const saved = parseNotes(raw);
  return shots.map((shot, index) => {
    const row = saved[index];
    return {
      title: typeof row?.title === "string" ? row.title : shot.label,
      text: typeof row?.text === "string" ? row.text : shot.text ?? "",
    };
  });
}

export function notesJson(notes: PhotoNote[]) {
  return JSON.stringify(notes.map((item) => ({ title: item.title, text: item.text })));
}

/** Keep captions lined up with photographs when a slot is added or removed. */
export function spliceNotes(raw: string | undefined, shots: TemplateShot[], index: number, remove: number, insert?: PhotoNote) {
  const notes = photoNotes(raw, shots);
  if (insert) notes.splice(index, remove, insert);
  else notes.splice(index, remove);
  return notesJson(notes);
}

function parseNotes(raw: string | undefined): Partial<PhotoNote>[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => (item && typeof item === "object" ? (item as Partial<PhotoNote>) : {}));
  } catch {
    return [];
  }
}
