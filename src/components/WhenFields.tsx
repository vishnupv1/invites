import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatLongDate, formatShortDate, formatTime } from "../lib/dates";
import "./when-fields.css";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MINUTES = [0, 15, 30, 45];

type Period = "AM" | "PM";

function parseIso(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function compose(hour12: number, minute: number, period: Period) {
  const hour = (hour12 % 12) + (period === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function partsOf(value: string) {
  const parsed = parseTime(value);
  if (!parsed) return { hour12: 4, minute: 0, period: "PM" as Period, set: false };
  return {
    hour12: parsed.hour % 12 || 12,
    minute: parsed.minute,
    period: (parsed.hour >= 12 ? "PM" : "AM") as Period,
    set: true,
  };
}

function monthCells(year: number, month: number) {
  const start = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: start }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function usePopover(open: boolean, onClose: () => void, revision: string) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const anchor = anchorRef.current;
    const pop = popRef.current;
    if (!anchor || !pop) return;

    function place() {
      const rect = anchor!.getBoundingClientRect();
      const box = pop!.getBoundingClientRect();
      const margin = 12;
      const panel = anchor!.closest(".ed-panel")?.getBoundingClientRect();
      const rail = document.querySelector(".ed-rail")?.getBoundingClientRect();
      const railBlocksBottom = Boolean(rail && rail.width > rail.height && rail.top > window.innerHeight * 0.5);
      const maxBottom = (railBlocksBottom && rail ? rail.top : window.innerHeight) - margin;
      const minLeft = Math.max(margin, panel ? panel.left + 8 : margin);
      const maxRight = Math.min(window.innerWidth - margin, panel ? panel.right - 8 : window.innerWidth - margin);
      let left = rect.left;
      if (left + box.width > maxRight) left = maxRight - box.width;
      if (left < minLeft) left = minLeft;
      const maxHeight = Math.max(180, maxBottom - margin);
      let top = rect.bottom + 8;
      const above = rect.top - box.height - 8;
      if (top + box.height > maxBottom && above >= margin) top = above;
      if (top + Math.min(box.height, maxHeight) > maxBottom) top = Math.max(margin, maxBottom - Math.min(box.height, maxHeight));
      setPos((current) => (
        current && current.top === top && current.left === left && current.maxHeight === maxHeight
          ? current
          : { top, left, maxHeight }
      ));
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, revision]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || popRef.current?.contains(target)) return;
      onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return { anchorRef, popRef, pos };
}

function CalendarIcon() {
  return (
    <svg className="when-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="when-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

export function DateField({ id, label, value, onChange }: { id?: string; label: string; value: string; onChange: (value: string) => void }) {
  const dialogId = useId();
  const selected = parseIso(value);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const date = selected ?? new Date();
    return { year: date.getFullYear(), month: date.getMonth() };
  });
  const close = useCallback(() => setOpen(false), []);
  const pop = usePopover(open, close, `${cursor.year}-${cursor.month}`);
  const shown = value ? formatShortDate(value) : "";
  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  function toggle() {
    if (!open) {
      const date = selected ?? new Date();
      setCursor({ year: date.getFullYear(), month: date.getMonth() });
    }
    setOpen((current) => !current);
  }

  function shift(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className="when" ref={pop.anchorRef}>
      <button
        id={id}
        type="button"
        className="when-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={shown ? `${label}, ${shown}` : label}
        onClick={toggle}
      >
        <span className={shown ? undefined : "when-ph"}>{shown || "Choose a date"}</span>
        <CalendarIcon />
      </button>
      {open
        ? createPortal(
            <div
              id={dialogId}
              ref={pop.popRef}
              className="when-pop"
              role="dialog"
              aria-label={label}
              style={{ top: pop.pos?.top ?? 0, left: pop.pos?.left ?? 0, maxHeight: pop.pos?.maxHeight, visibility: pop.pos ? "visible" : "hidden" }}
            >
              <div className="when-head">
                <button type="button" className="when-nav" aria-label="Previous month" onClick={() => shift(-1)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 6l-6 6 6 6" />
                  </svg>
                </button>
                <span className="when-month">{MONTHS[cursor.month]} {cursor.year}</span>
                <button type="button" className="when-nav" aria-label="Next month" onClick={() => shift(1)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
              <div className="when-week" aria-hidden="true">
                {WEEKDAYS.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
              </div>
              <div className="when-days">
                {monthCells(cursor.year, cursor.month).map((day, index) => {
                  if (!day) return <span key={`empty-${index}`} />;
                  const iso = toIso(cursor.year, cursor.month, day);
                  const on = iso === value;
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`when-day${on ? " is-on" : ""}${iso === todayIso && !on ? " is-today" : ""}`}
                      aria-pressed={on}
                      aria-label={formatLongDate(iso)}
                      onClick={() => {
                        onChange(iso);
                        setOpen(false);
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function TimeField({ id, label, value, onChange }: { id?: string; label: string; value: string; onChange: (value: string) => void }) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const pop = usePopover(open, close, value);
  const parts = partsOf(value);
  const shown = value ? formatTime(value) : "";
  const minutes = parts.set && !MINUTES.includes(parts.minute) ? [...MINUTES, parts.minute].sort((a, b) => a - b) : MINUTES;

  function choose(next: { hour12?: number; minute?: number; period?: Period }) {
    onChange(compose(next.hour12 ?? parts.hour12, next.minute ?? parts.minute, next.period ?? parts.period));
  }

  return (
    <div className="when" ref={pop.anchorRef}>
      <button
        id={id}
        type="button"
        className="when-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={shown ? `${label}, ${shown}` : label}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={shown ? undefined : "when-ph"}>{shown || "Choose a time"}</span>
        <ClockIcon />
      </button>
      {open
        ? createPortal(
            <div
              id={dialogId}
              ref={pop.popRef}
              className="when-pop when-time"
              role="dialog"
              aria-label={label}
              style={{ top: pop.pos?.top ?? 0, left: pop.pos?.left ?? 0, maxHeight: pop.pos?.maxHeight, visibility: pop.pos ? "visible" : "hidden" }}
            >
              <p className={shown ? "when-read" : "when-read is-empty"}>{shown || "Choose a time"}</p>
              <div className="when-period">
                {(["AM", "PM"] as const).map((period) => (
                  <button key={period} type="button" aria-pressed={parts.set && parts.period === period} onClick={() => choose({ period })}>
                    {period}
                  </button>
                ))}
              </div>
              <p className="when-cap">Hour</p>
              <div className="when-hours">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                  <button key={hour} type="button" className="when-choice" aria-pressed={parts.set && parts.hour12 === hour} onClick={() => choose({ hour12: hour })}>
                    {hour}
                  </button>
                ))}
              </div>
              <p className="when-cap">Minute</p>
              <div className="when-hours">
                {minutes.map((minute) => (
                  <button key={minute} type="button" className="when-choice" aria-pressed={parts.set && parts.minute === minute} onClick={() => choose({ minute })}>
                    {String(minute).padStart(2, "0")}
                  </button>
                ))}
              </div>
              <button type="button" className="when-done" onClick={close}>Done</button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
