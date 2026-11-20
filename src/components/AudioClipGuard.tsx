import { useEffect } from "react";
import { CLIP_SECONDS, SONGS, clipStart, librarySong } from "../data/music";

/** Keeps a library song inside the chosen 30 second window, including players that loop. */
export function AudioClipGuard({ src }: { src: string }) {
  useEffect(() => {
    const chosen = librarySong(src);
    const chosenStart = clipStart(src);

    function windowFor(url: string) {
      const song = SONGS.find((item) => url.includes(item.src));
      if (!song) return null;
      const start = chosen && song.src === chosen.src ? chosenStart : 0;
      return { start, end: start + CLIP_SECONDS };
    }

    function fromEvent(event: Event) {
      const node = event.target;
      if (!(node instanceof HTMLAudioElement)) return null;
      const clip = windowFor(node.currentSrc || node.src);
      return clip ? { node, clip } : null;
    }

    function onPlay(event: Event) {
      const found = fromEvent(event);
      if (!found) return;
      const { node, clip } = found;
      if (node.currentTime < clip.start - 0.3 || node.currentTime >= clip.end - 0.2) {
        node.currentTime = clip.start;
      }
    }

    function replay(node: HTMLAudioElement, start: number) {
      node.currentTime = start;
      if (node.paused) void node.play().catch(() => {});
    }

    function onTime(event: Event) {
      const found = fromEvent(event);
      if (!found) return;
      const { node, clip } = found;
      if (node.currentTime >= clip.end - 0.12) replay(node, clip.start);
      else if (node.currentTime < clip.start - 0.35) node.currentTime = clip.start;
    }

    function onEnded(event: Event) {
      const found = fromEvent(event);
      if (!found) return;
      replay(found.node, found.clip.start);
    }

    document.addEventListener("play", onPlay, true);
    document.addEventListener("timeupdate", onTime, true);
    document.addEventListener("ended", onEnded, true);
    return () => {
      document.removeEventListener("play", onPlay, true);
      document.removeEventListener("timeupdate", onTime, true);
      document.removeEventListener("ended", onEnded, true);
    };
  }, [src]);

  return null;
}
