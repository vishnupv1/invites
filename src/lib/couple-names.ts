const KEY = "ir-couple-names";

export type CoupleNames = { bride: string; groom: string };

export function saveCoupleNames(raw: string) {
  const parts = raw.split(/\s+(?:&|and)\s+/i).map((part) => part.trim()).filter(Boolean);
  const value: CoupleNames = { bride: parts[0] ?? "", groom: parts[1] ?? "" };
  const json = JSON.stringify(value);
  try {
    localStorage.setItem(KEY, json);
  } catch {
    /* Instagram and Facebook in-app browsers can block storage. */
  }
  try {
    sessionStorage.setItem(KEY, json);
  } catch {
    /* sessionStorage is the fallback when localStorage throws. */
  }
}

export function readCoupleNames(): CoupleNames | null {
  const stores = [localStorage, sessionStorage];
  for (const store of stores) {
    try {
      const raw = store.getItem(KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CoupleNames;
      if (parsed && typeof parsed.bride === "string" && parsed.bride) return { bride: parsed.bride, groom: parsed.groom ?? "" };
    } catch {
      /* ignore a broken or blocked store */
    }
  }
  return null;
}
