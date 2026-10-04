import { useEffect, useState } from "react";

export const FAVS_KEY = "invitesready.template-favs.v1";
const EVENT = "invitesready-favs";

export function readFavs() {
  try {
    const raw = localStorage.getItem(FAVS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function writeFavs(ids: string[]) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}

export function useFavs() {
  const [favs, setFavs] = useState<string[]>(readFavs);

  useEffect(() => {
    const sync = () => setFavs(readFavs());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggle(id: string) {
    const next = favs.includes(id) ? favs.filter((item) => item !== id) : [...favs, id];
    setFavs(next);
    writeFavs(next);
    return next.includes(id);
  }

  return { favs, toggle };
}
