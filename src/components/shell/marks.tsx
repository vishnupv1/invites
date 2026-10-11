import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M14.5 9h-11M8 4.5 3.5 9 8 13.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EnvelopeMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7.5 12 13l8-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function OverviewIcon() {
  return <Icon><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" /></Icon>;
}

export function GuestsIcon() {
  return <Icon><path d="M5 7h14M5 12h14M5 17h9" /></Icon>;
}

export function CheckIcon() {
  return <Icon><path d="M5 12.5 9.2 17 19 7" /></Icon>;
}

export function HeartIcon() {
  return <Icon><path d="M12 19s-6.2-3.8-6.2-8.1A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.2 2.7C18.2 15.2 12 19 12 19z" /></Icon>;
}

export function PencilIcon() {
  return <Icon><path d="M4 20h4l10.2-10.2a1.8 1.8 0 0 0 0-2.6l-.4-.4a1.8 1.8 0 0 0-2.6 0L5 16.9V20z" /></Icon>;
}

export function SettingsIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21" />
    </Icon>
  );
}

export function GridIcon() {
  return <Icon><path d="M5 5h5.5v5.5H5zM13.5 5H19v5.5h-5.5zM5 13.5h5.5V19H5zM13.5 13.5H19V19h-5.5z" /></Icon>;
}

export function EventsIcon() {
  return <Icon><path d="M6 5.5h12v13H6zM6 9.5h12M9 3.5v3M15 3.5v3" /></Icon>;
}

export function ReceiptIcon() {
  return <Icon><path d="M7 4h10v16l-2-1.2L13 20l-2-1.2L9 20l-2-1.2V4zM9.5 8.5h5M9.5 12h5" /></Icon>;
}

export function ShareIcon() {
  return <Icon><path d="M8 16 16 8M10 8h6v6" /></Icon>;
}

export function PlayIcon() {
  return <Icon><path d="M9 7.5v9l8-4.5z" /></Icon>;
}

export function SparkIcon() {
  return <Icon><path d="M12 4.5v15M4.5 12h15M7 7l10 10M17 7 7 17" /></Icon>;
}

export function PeopleIcon() {
  return <Icon><circle cx="9" cy="9" r="2.4" /><circle cx="16" cy="10" r="2" /><path d="M4.8 17.5c.6-2.2 2.3-3.4 4.2-3.4s3.6 1.2 4.2 3.4M13.2 14.4c1.4-.3 2.8.3 3.6 1.6" /></Icon>;
}

export function StoryIcon() {
  return <Icon><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.4" /></Icon>;
}

export function LockIcon() {
  return <Icon><rect x="6" y="11" width="12" height="9" rx="1.6" /><path d="M8.5 11V8.2a3.5 3.5 0 0 1 7 0V11" /></Icon>;
}

export function CopyIcon() {
  return <Icon><path d="M9 9h9v11H9zM6 15V5h9" /></Icon>;
}
