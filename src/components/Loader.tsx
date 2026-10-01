import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./loader.css";

export function hold(ms = 800) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function Spinner({ size = "sm", tone = "ink" }: { size?: "sm" | "md"; tone?: "ink" | "paper" }) {
  return <span className={`spin ${size}${tone === "paper" ? " paper" : ""}`} aria-hidden="true" />;
}

type Phase = "idle" | "loading" | "done";

export function SmartButton({
  phase = "idle",
  idle,
  loading = "Publishing…",
  done = "Published!",
  className,
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  phase?: Phase;
  idle: ReactNode;
  loading?: ReactNode;
  done?: ReactNode;
}) {
  return (
    <button
      {...props}
      type={type}
      className={`smart-btn ${phase}${className ? ` ${className}` : ""}`}
      disabled={disabled || phase !== "idle"}
      aria-busy={phase === "loading" || undefined}
    >
      {phase === "loading" ? (
        <span className="smart-face">
          <Spinner tone="paper" />
          {loading}
        </span>
      ) : phase === "done" ? (
        <span className="smart-face">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l4 4L19 7" />
          </svg>
          {done}
        </span>
      ) : (
        <span className="smart-face">{idle}</span>
      )}
    </button>
  );
}
