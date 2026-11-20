export const CLIP_SECONDS = 30;

export const SONGS = [
  { name: "Indian Wedding", by: "Jonas Blakewood", src: "/music/indian-wedding.mp3" },
  { name: "Indian Hindi", by: "Sub Clair", src: "/music/indian-hindi.mp3" },
  { name: "Indian Wedding", by: "Monda Music", src: "/music/indian-wedding-monda.mp3" },
  { name: "Indian Classical", by: "India Happy", src: "/music/indian-classical.mp3" },
  { name: "Ullam paadum", by: "Ullam Paadum", src: "/music/ullam-paaadum.mp3" },
] as const;

export function songFile(src: string) {
  return src.split("#")[0];
}

export function librarySong(src: string) {
  const file = songFile(src);
  return SONGS.find((song) => song.src === file);
}

export function clipStart(src: string) {
  const match = /#t=(\d+)/.exec(src);
  const start = match ? Number(match[1]) : 0;
  return Number.isFinite(start) && start > 0 ? Math.round(start) : 0;
}

export function withClip(file: string, start: number) {
  return `${songFile(file)}#t=${Math.max(0, Math.round(start))}`;
}

export function clock(seconds: number) {
  const value = Math.max(0, Math.round(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}
