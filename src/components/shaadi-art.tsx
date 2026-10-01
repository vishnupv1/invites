import { Music, Music2, Sparkle } from "lucide-react";
import type { ShaadiEventKind } from "./shaadi";

const MANDALA = "M100 4c14 34 14 64 0 96-14-32-14-62 0-96zM196 100c-34 14-64 14-96 0 32-14 62-14 96 0zM100 196c-14-34-14-64 0-96 14 32 14 62 0 96zM4 100c34-14 64-14 96 0-32 14-62 14-96 0zM168 32c-10 32-32 54-68 68 14-36 36-58 68-68zM168 168c-32-10-54-32-68-68 36 14 58 36 68 68zM32 168c10-32 32-54 68-68-14 36-36 58-68 68zM32 32c32 10 54 32 68 68-36-14-58-36-68-68z";

const BEADS = ["#F4A300", "#FFB800", "#E86A10"];
const PETALS = ["#F4A300", "#FFB800", "#E86A10", "#C2185B", "#F5D77A"];

export function Mandala({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <g stroke="#F5D77A" strokeWidth="0.5" fill="none">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="78" />
        <circle cx="100" cy="100" r="52" />
        <circle cx="100" cy="100" r="26" />
        <path d={MANDALA} />
        <path d="M100 22l6 12-6 12-6-12zM178 100l-12 6-12-6 12-6zM100 178l-6-12 6-12 6 12zM22 100l12-6 12 6-12 6z" fill="#F5D77A" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

export function Flourish() {
  return (
    <svg className="sh-flourish" viewBox="0 0 320 30" aria-hidden="true">
      <path d="M4 15C60 15 90 2 140 15l20-10 20 10c50-13 80 0 136 0M160 5l8 10-8 10-8-10z" />
    </svg>
  );
}

export function Toran({ count = 9 }: { count?: number }) {
  return (
    <div className="sh-toran" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const beads = 4 + ((index * 7) % 4);
        return (
          <div key={index} className="sh-strand" style={{ animationDuration: `${2.4 + (index % 4) * 0.4}s`, animationDelay: `${index * -0.3}s` }}>
            <span className="sh-strand-line" style={{ height: 10 + (index % 3) * 8 }} />
            {Array.from({ length: beads }, (_, bead) => (
              <span
                key={bead}
                className="sh-bead"
                style={{ background: `radial-gradient(circle at 35% 35%, #FFE08A, ${BEADS[(index + bead) % 3]} 60%, #B34A00 100%)` }}
              />
            ))}
            <span className="sh-strand-tip" />
          </div>
        );
      })}
    </div>
  );
}

export function Stars({ count = 14 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="sh-star"
          style={{
            left: `${(index * 137) % 90 + 5}%`,
            top: `${(index * 89) % 72 + 10}%`,
            animationDuration: `${2 + (index % 4) * 0.5}s`,
            animationDelay: `${index * 0.25}s`,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function Petals({ count = 16 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="sh-petal"
          style={{
            left: `${(index * 71) % 100}%`,
            animationDuration: `${8 + (index % 5) * 1.6}s`,
            animationDelay: `${index * -0.9}s`,
          }}
          aria-hidden="true"
        >
          <span style={{ animationDuration: `${2.6 + (index % 3)}s` }}>
            <svg width={12 + (index % 3) * 5} height={12 + (index % 3) * 5} viewBox="0 0 20 20">
              <path d="M10 1C15 5 17 11 10 19 3 11 5 5 10 1z" fill={PETALS[index % 5]} />
            </svg>
          </span>
        </span>
      ))}
    </>
  );
}

function Flame() {
  return (
    <svg width="16" height="24" viewBox="0 0 16 24" aria-hidden="true">
      <g className="sh-flame">
        <path d="M8 1c3 6 6 9 6 14a6 6 0 0 1-12 0c0-5 3-8 6-14z" fill="#FFB347" />
        <path d="M8 9c1.5 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1.5-4 3-7z" fill="#FFF1B8" />
      </g>
    </svg>
  );
}

export function Diyas({ count = 7 }: { count?: number }) {
  return (
    <div className="sh-diyas" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="sh-diya">
          <span className="sh-ignite" style={{ animationDelay: `${0.6 + index * 0.25}s` }}>
            <Flame />
          </span>
          <svg width="40" height="18" viewBox="0 0 40 18">
            <path d="M2 2h36c-2 10-9 14-18 14S4 12 2 2z" fill="#C9772F" stroke="#F5D77A" strokeWidth="1.5" />
          </svg>
        </span>
      ))}
    </div>
  );
}

export function Elephant() {
  return (
    <svg width="110" height="82" viewBox="0 0 160 120" aria-hidden="true">
      <g className="sh-bob">
        <ellipse cx="80" cy="62" rx="48" ry="32" fill="#2A0712" />
        <circle cx="124" cy="48" r="22" fill="#2A0712" />
        <g className="sh-trunk">
          <path d="M138 56c10 10 12 26 6 40-2 4-8 3-7-1 4-12 2-24-6-32z" fill="#2A0712" />
        </g>
        <path d="M112 40c-10-4-16 6-12 16 4 8 14 6 18-2z" fill="#3B0B1A" />
        <rect x="44" y="84" width="12" height="30" rx="4" fill="#2A0712" />
        <rect x="64" y="84" width="12" height="30" rx="4" fill="#2A0712" />
        <rect x="92" y="84" width="12" height="30" rx="4" fill="#2A0712" />
        <rect x="108" y="82" width="12" height="32" rx="4" fill="#2A0712" />
        <path d="M52 36h56l-6 36H58z" fill="#C2185B" />
        <path d="M52 36h56l-6 36H58z" fill="none" stroke="#F5D77A" strokeWidth="2.5" />
        <path d="M60 72l4 8 4-8 4 8 4-8 4 8 4-8 4 8 4-8 4 8 4-8" stroke="#F5D77A" strokeWidth="2" fill="none" />
        <rect x="66" y="18" width="30" height="20" rx="6" fill="#F4A300" stroke="#F5D77A" strokeWidth="2" />
        <path d="M81 18V8M74 8h14" stroke="#F5D77A" strokeWidth="2" />
        <circle cx="128" cy="44" r="2.5" fill="#F5D77A" />
      </g>
    </svg>
  );
}

export function Havan({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 30 36" aria-hidden="true">
      <g className="sh-flame sh-flame-tall">
        <path d="M15 2c4 8 11 12 11 21a11 11 0 0 1-22 0c0-6 4-9 6-13 1 4 3 6 5 6-2-5-2-9 0-14z" fill="#F4A300" />
        <path d="M15 14c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3-1-2-1-4 0-7z" fill="#FFE08A" />
      </g>
    </svg>
  );
}

export function EventMark({ kind }: { kind: ShaadiEventKind }) {
  if (kind === "haldi") {
    return (
      <>
        <span className="sh-splash" />
        <svg width="46" height="40" viewBox="0 0 46 40" aria-hidden="true">
          <path d="M4 14h38c-2 14-10 22-19 22S6 28 4 14z" fill="#8B5A2B" stroke="#F5D77A" strokeWidth="1.5" />
          <ellipse cx="23" cy="14" rx="19" ry="5" fill="#FFC107" />
          <circle cx="16" cy="12" r="2" fill="#FFE082" />
          <circle cx="28" cy="13" r="1.6" fill="#FFE082" />
        </svg>
      </>
    );
  }
  if (kind === "mehendi") {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <path className="sh-leaf" d="M24 44C12 36 8 24 14 12c6 6 10 14 10 32zM24 44c12-8 16-20 10-32-6 6-10 14-10 32z" />
        <circle cx="24" cy="10" r="3" stroke="#9CCC65" strokeWidth="1.8" fill="none" />
        <path className="sh-leaf" d="M24 14v30" />
      </svg>
    );
  }
  if (kind === "sangeet") {
    return (
      <>
        <svg className="sh-dhol" width="48" height="40" viewBox="0 0 48 40" aria-hidden="true">
          <rect x="8" y="10" width="32" height="22" rx="10" fill="#C2185B" stroke="#F5D77A" strokeWidth="1.5" />
          <path d="M12 10l6 22M20 10l6 22M28 10l6 22" stroke="#F5D77A" strokeWidth="1" />
          <ellipse cx="8" cy="21" rx="3" ry="11" fill="#F5D77A" />
          <ellipse cx="40" cy="21" rx="3" ry="11" fill="#F5D77A" />
        </svg>
        <span className="sh-note sh-note-a" aria-hidden="true"><Music2 className="glyph" /></span>
        <span className="sh-note sh-note-b" aria-hidden="true"><Music className="glyph" /></span>
      </>
    );
  }
  if (kind === "baraat") {
    return (
      <div className="sh-bob">
        <svg width="54" height="44" viewBox="0 0 54 44" aria-hidden="true">
          <path d="M10 30c0-10 8-16 18-16h8l6-8 4 2-3 8c4 2 6 6 6 10v4H10z" fill="#FFF4E0" />
          <path d="M14 30v12M22 30v12M36 30v12M44 30v12" stroke="#FFF4E0" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 14h16v10H18z" fill="#C2185B" stroke="#F5D77A" strokeWidth="1.2" />
          <circle cx="44" cy="10" r="1.5" fill="#4A0D1F" />
        </svg>
      </div>
    );
  }
  if (kind === "pheras") {
    return (
      <>
        <span className="sh-orbit sh-orbit-icon"><i /></span>
        <Havan />
      </>
    );
  }
  if (kind === "reception") {
    return (
      <>
        <svg width="50" height="50" viewBox="0 0 50 50" aria-hidden="true">
          <path d="M25 2v8M10 18h30M14 18l-4 12h30l-4-12" stroke="#F5D77A" strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="36" r="3" fill="#F5D77A" />
          <circle cx="25" cy="38" r="3" fill="#F5D77A" />
          <circle cx="38" cy="36" r="3" fill="#F5D77A" />
        </svg>
        <span className="sh-spark sh-spark-a" aria-hidden="true"><Sparkle className="glyph" /></span>
        <span className="sh-spark sh-spark-b" aria-hidden="true"><Sparkle className="glyph" /></span>
      </>
    );
  }
  return <Havan />;
}

export function Palace() {
  return (
    <svg viewBox="0 0 520 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="520" height="190" fill="#F6B26B" />
      <circle className="sh-glow" cx="400" cy="90" r="36" fill="#FFE8B0" />
      <path d="M60 190V110h40l20-30 20 30h40V70l30-30 30 30v40h40l20-30 20 30h40v80z" fill="#6D1B30" />
      <path d="M110 190v-30a10 10 0 0 1 20 0v30M200 190v-44a15 15 0 0 1 30 0v44M300 190v-30a10 10 0 0 1 20 0v30M380 190v-30a10 10 0 0 1 20 0v30" fill="#FFD27A" />
      <rect y="190" width="520" height="110" fill="#1E5E78" />
      <g className="sh-ripple-lake">
        <path d="M60 196h360v8H60z" fill="#6D1B30" opacity="0.4" />
        <path d="M110 206h20v10h-20zM200 206h30v14h-30zM300 206h20v10h-20z" fill="#FFD27A" opacity="0.35" />
      </g>
      <path className="sh-ripple-line" d="M0 250c40-8 80 8 120 0s80-8 120 0 80 8 120 0 80-8 160 0" />
    </svg>
  );
}

export function Rangoli() {
  return (
    <svg className="sh-rangoli" width="130" height="130" viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" strokeWidth="3">
        <circle cx="100" cy="100" r="80" stroke="#F4A300" />
        <circle cx="100" cy="100" r="56" stroke="#C2185B" />
        <circle cx="100" cy="100" r="30" stroke="#F5D77A" />
      </g>
      <path d="M100 20c10 24 10 44 0 80-10-36-10-56 0-80zM180 100c-24 10-44 10-80 0 36-10 56-10 80 0zM100 180c-10-24-10-44 0-80 10 36 10 56 0 80zM20 100c24-10 44-10 80 0-36 10-56 10-80 0z" fill="#F4A300" fillOpacity="0.8" />
      <circle cx="100" cy="100" r="10" fill="#C2185B" />
    </svg>
  );
}

export function Arch() {
  return (
    <svg className="sh-arch-line" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
      <path d="M20 596V230C20 110 110 40 200 12c90 28 180 98 180 218v366" />
      <path d="M36 596V236C36 124 118 60 200 32c82 28 164 92 164 204v360" />
    </svg>
  );
}
