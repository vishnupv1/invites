import type { InviteFields } from "../types";

export function formatLongDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string) {
  if (!iso) return "Date to come";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(value: string) {
  if (!value) return "";
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function calendarUrl(fields: InviteFields) {
  if (!fields.date) return "";
  const [hourText, minuteText] = (fields.time || "18:00").split(":");
  const hour = String(hourText).padStart(2, "0");
  const minute = String(minuteText || "0").padStart(2, "0");
  const stamp = `${fields.date.replaceAll("-", "")}T${hour}${minute}00`;
  const endHour = String((Number(hour) + 3) % 24).padStart(2, "0");
  const end = `${fields.date.replaceAll("-", "")}T${endHour}${minute}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: fields.names || fields.title || "Invitation",
    dates: `${stamp}/${end}`,
    details: fields.message,
    location: [fields.venue, fields.address].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
