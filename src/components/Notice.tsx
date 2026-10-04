import { useEffect, useRef } from "react";
import "./notice.css";

export type NoticeTone = "ok" | "warn" | "bad";

export function Notice({
  message,
  tone = "ok",
  onClose,
}: {
  message: string;
  tone?: NoticeTone;
  onClose: () => void;
}) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const timer = window.setTimeout(() => close.current(), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <div className={`notice ${tone}`} role={tone === "ok" ? "status" : "alert"}>
      <span className="notice-mark" aria-hidden="true">
        {tone === "bad" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M7 7l10 10M17 7L7 17" />
          </svg>
        ) : tone === "warn" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M12 7v6M12 17h.01" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l4 4L19 7" />
          </svg>
        )}
      </span>
      <p>{message}</p>
      <button type="button" aria-label="Dismiss" onClick={onClose}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
