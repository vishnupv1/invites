import { useEffect, useRef, useState } from "react";
import { assetUrl } from "../api";
import { songFile } from "../data/music";
import "./song-control.css";

export function SongControl({ src }: { src: string }) {
  const own = useRef<HTMLAudioElement>(null);
  const want = useRef(true);
  const heard = useRef(false);
  const [on, setOn] = useState(true);

  function targets() {
    const file = songFile(src);
    const others = [...document.querySelectorAll("audio")].filter((node) => {
      if (node === own.current) return false;
      const url = node.currentSrc || node.getAttribute("src") || "";
      return url.includes(file);
    });
    if (others.length) {
      if (own.current && !own.current.paused) own.current.pause();
      return others;
    }
    return own.current ? [own.current] : [];
  }

  function play() {
    targets().forEach((node) => {
      node.muted = false;
      void node.play().then(() => {
        heard.current = true;
      }).catch(() => {});
    });
  }

  useEffect(() => {
    want.current = true;
    setOn(true);
    heard.current = false;
    play();
    const onGesture = () => {
      if (want.current) play();
    };
    document.addEventListener("pointerdown", onGesture);
    return () => document.removeEventListener("pointerdown", onGesture);
  }, [src]);

  function toggle() {
    const nodes = targets();
    const audible = nodes.some((node) => !node.paused && !node.muted);
    if (!heard.current || !audible) {
      want.current = true;
      setOn(true);
      play();
      return;
    }
    const next = !on;
    want.current = next;
    setOn(next);
    nodes.forEach((node) => {
      node.muted = !next;
      if (next) void node.play().catch(() => {});
    });
  }

  return (
    <>
      <button type="button" className="song-toggle" aria-pressed={on} aria-label={on ? "Mute music" : "Play music"} onClick={toggle}>
        {on ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="7" cy="18" r="2.4" />
            <circle cx="17" cy="16" r="2.4" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10v4h3l4 3V7L7 10H4z" fill="currentColor" stroke="none" />
            <path d="M16 10l4 4M20 10l-4 4" />
          </svg>
        )}
      </button>
      <audio ref={own} src={assetUrl(src)} loop preload="auto" />
    </>
  );
}
