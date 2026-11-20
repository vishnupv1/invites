import { useRef, useState } from "react";
import { assetUrl } from "../api";
import "./song-control.css";

export function SongControl({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <>
      <button type="button" className="song-toggle" aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"} onClick={() => void toggle()}>
        {playing ? "Pause" : "Music"}
      </button>
      <audio ref={audioRef} src={assetUrl(src)} loop preload="none" onEnded={() => setPlaying(false)} />
    </>
  );
}
