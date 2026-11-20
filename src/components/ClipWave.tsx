import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { CLIP_SECONDS, clock } from "../data/music";
import "./clip-wave.css";

const BARS = 64;
const cache = new Map<string, number[]>();

function sample(buffer: AudioBuffer, bars: number) {
  const channel = buffer.getChannelData(0);
  const block = Math.max(1, Math.floor(channel.length / bars));
  const peaks: number[] = [];
  for (let index = 0; index < bars; index += 1) {
    let sum = 0;
    let count = 0;
    const from = index * block;
    for (let step = 0; step < block; step += 24) {
      sum += Math.abs(channel[from + step] || 0);
      count += 1;
    }
    peaks.push(count ? sum / count : 0);
  }
  const loudest = Math.max(...peaks, 0.01);
  return peaks.map((peak) => peak / loudest);
}

function mix(amount: number) {
  const stops: [number, number, number][] = [
    [255, 138, 24],
    [255, 45, 120],
    [160, 70, 255],
  ];
  const scaled = Math.min(1, Math.max(0, amount)) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const blend = scaled - index;
  const from = stops[index];
  const to = stops[index + 1];
  const color = from.map((channel, channelIndex) => Math.round(channel + (to[channelIndex] - channel) * blend));
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export function ClipWave({
  src,
  start,
  duration,
  playing,
  audioRef,
  onStart,
  onToggle,
}: {
  src: string;
  start: number;
  duration: number;
  playing: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  onStart: (start: number) => void;
  onToggle: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[]>(() => cache.get(src) ?? []);
  const [head, setHead] = useState(start);
  const length = duration > CLIP_SECONDS ? duration : Math.max(duration, CLIP_SECONDS);
  const maxStart = Math.max(0, length - CLIP_SECONDS);
  const windowRatio = Math.min(1, CLIP_SECONDS / length);

  useEffect(() => {
    const saved = cache.get(src);
    if (saved) {
      setPeaks(saved);
      return;
    }
    let cancel = false;
    void (async () => {
      try {
        const data = await fetch(src).then((response) => response.arrayBuffer());
        const context = new AudioContext();
        const audio = await context.decodeAudioData(data.slice(0));
        await context.close();
        const next = sample(audio, BARS);
        cache.set(src, next);
        if (!cancel) setPeaks(next);
      } catch {
        if (!cancel) setPeaks(Array.from({ length: BARS }, () => 0.4));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [src]);

  useEffect(() => {
    if (!playing) {
      setHead(start);
      return;
    }
    let frame = 0;
    const tick = () => {
      setHead(audioRef.current?.currentTime ?? start);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, start, audioRef]);

  function moveTo(clientX: number, grabRatio: number) {
    const track = trackRef.current;
    if (!track || maxStart <= 0) return;
    const rect = track.getBoundingClientRect();
    const fraction = (clientX - rect.left) / rect.width - grabRatio;
    const next = Math.round(Math.min(maxStart, Math.max(0, fraction * length)));
    onStart(next);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (maxStart <= 0) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const press = (event.clientX - rect.left) / rect.width;
    const windowStart = start / length;
    const inside = press >= windowStart && press <= windowStart + windowRatio;
    const grab = inside ? press - windowStart : windowRatio / 2;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX, grab);
    function onMove(move: PointerEvent) {
      moveTo(move.clientX, grab);
    }
    function onUp(up: PointerEvent) {
      event.currentTarget.releasePointerCapture(up.pointerId);
      event.currentTarget.removeEventListener("pointermove", onMove);
      event.currentTarget.removeEventListener("pointerup", onUp);
    }
    event.currentTarget.addEventListener("pointermove", onMove);
    event.currentTarget.addEventListener("pointerup", onUp);
  }

  const bars = peaks.length ? peaks : Array.from({ length: BARS }, () => 0.25);
  const end = Math.min(start + CLIP_SECONDS, length);
  const headRatio = length > 0 ? Math.min(1, Math.max(0, head / length)) : 0;
  const headInside = head >= start && head <= end;

  return (
    <div className="clip-wave">
      <span className="clip-len" aria-hidden="true">30s</span>
      <div
        className="clip-track"
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="30 second clip"
        aria-valuemin={0}
        aria-valuemax={Math.round(maxStart)}
        aria-valuenow={start}
        aria-valuetext={`${clock(start)} to ${clock(end)}`}
        onPointerDown={onPointerDown}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") onStart(Math.min(maxStart, start + 1));
          if (event.key === "ArrowLeft") onStart(Math.max(0, start - 1));
        }}
      >
        <span className="clip-bars" aria-hidden="true">
          {bars.map((peak, index) => {
            const at = (index + 0.5) / bars.length;
            const inside = at >= start / length && at <= end / length;
            const tint = inside ? (at - start / length) / windowRatio : 0;
            return (
              <i
                key={index}
                style={{
                  height: `${Math.max(18, peak * 100)}%`,
                  background: inside ? mix(tint) : "rgba(44,27,34,.35)",
                }}
              />
            );
          })}
        </span>
        <span className="clip-window" style={{ left: `${(start / length) * 100}%`, width: `${windowRatio * 100}%` }} />
        {playing && headInside ? <span className="clip-head" style={{ left: `${headRatio * 100}%` }} /> : null}
      </div>
      <button type="button" className={playing ? "clip-pause" : "clip-pause is-play"} aria-label={playing ? "Pause clip" : "Play clip"} onClick={onToggle}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d={playing ? "M7 5h4v14H7zM13 5h4v14h-4z" : "M8 5l11 7-11 7z"} />
        </svg>
      </button>
    </div>
  );
}
