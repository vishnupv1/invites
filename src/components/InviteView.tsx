import type { InviteFields, Template } from "../types";
import { GazalInvite } from "./GazalInvite";
import { getEvent } from "../data/events";
import { formatLongDate, formatTime } from "../lib/dates";

function Occasion({ fields, script }: { fields: InviteFields; script?: boolean }) {
  const event = getEvent(fields.event);
  const detail =
    fields.detail && event.detailLabel
      ? event.id === "birthday"
        ? `Turning ${fields.detail}`
        : event.id === "anniversary"
          ? `${fields.detail} years`
          : fields.detail
      : fields.detail;
  return (
    <>
      <p className="kicker">{event.cardLabel}</p>
      {fields.hosts ? <p className="hosts">{fields.hosts}</p> : null}
      <h2 className={script ? "script" : undefined}>{fields.names}</h2>
      {detail ? <p className="detail-line">{detail}</p> : null}
      {fields.title ? <p className="title">{fields.title}</p> : null}
    </>
  );
}

function When({ fields }: { fields: InviteFields }) {
  return (
    <div className="when">
      <span>{formatLongDate(fields.date)}</span>
      {fields.time ? <span>{formatTime(fields.time)}</span> : null}
    </div>
  );
}

function Where({ fields }: { fields: InviteFields }) {
  return (
    <div className="where">
      <strong>{fields.venue}</strong>
      {fields.address ? <span>{fields.address}</span> : null}
    </div>
  );
}

function Garden({ fields }: { fields: InviteFields }) {
  return (
    <article className="card garden">
      <svg className="sprig left" viewBox="0 0 80 80" aria-hidden="true">
        <path d="M10 70 C30 50 28 30 48 12" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <ellipse cx="36" cy="34" rx="8" ry="4" transform="rotate(-30 36 34)" fill="currentColor" opacity="0.35" />
        <ellipse cx="24" cy="50" rx="7" ry="3.5" transform="rotate(-50 24 50)" fill="currentColor" opacity="0.5" />
      </svg>
      <svg className="sprig right" viewBox="0 0 80 80" aria-hidden="true">
        <path d="M70 70 C50 50 52 30 32 12" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <ellipse cx="44" cy="34" rx="8" ry="4" transform="rotate(30 44 34)" fill="currentColor" opacity="0.35" />
        <ellipse cx="56" cy="50" rx="7" ry="3.5" transform="rotate(50 56 50)" fill="currentColor" opacity="0.5" />
      </svg>
      <Occasion fields={fields} script />
      <When fields={fields} />
      <Where fields={fields} />
      <p className="message">{fields.message}</p>
      <footer>
        {fields.dress ? <span>{fields.dress}</span> : null}
        {fields.rsvpBy ? <span>Reply by {formatLongDate(fields.rsvpBy)}</span> : null}
      </footer>
    </article>
  );
}

function Midnight({ fields }: { fields: InviteFields }) {
  return (
    <article className="card midnight">
      <Occasion fields={fields} />
      <div className="rule" />
      <When fields={fields} />
      <Where fields={fields} />
      <p className="message">{fields.message}</p>
      <footer>
        {fields.dress ? <span>{fields.dress}</span> : null}
        {fields.rsvpBy ? <span>RSVP {formatLongDate(fields.rsvpBy)}</span> : null}
      </footer>
    </article>
  );
}

function Marigold({ fields }: { fields: InviteFields }) {
  return (
    <article className="card marigold">
      <div className="frame">
        <p className="mark">॥</p>
        <Occasion fields={fields} />
        <When fields={fields} />
        <Where fields={fields} />
        <p className="message">{fields.message}</p>
        <footer>
          {fields.dress ? <span>{fields.dress}</span> : null}
          {fields.rsvpBy ? <span>Kindly reply by {formatLongDate(fields.rsvpBy)}</span> : null}
        </footer>
      </div>
    </article>
  );
}

function Confetti({ fields }: { fields: InviteFields }) {
  const age = fields.event === "birthday" && fields.detail ? fields.detail : "";
  return (
    <article className="card confetti">
      <span className="dot a" />
      <span className="dot b" />
      <span className="dot c" />
      <p className="kicker">{getEvent(fields.event).cardLabel}</p>
      {age ? <p className="day">{age}</p> : null}
      {fields.hosts ? <p className="hosts">{fields.hosts}</p> : null}
      <h2>{fields.names}</h2>
      {fields.title ? <p className="title">{fields.title}</p> : null}
      <When fields={fields} />
      <Where fields={fields} />
      <p className="message">{fields.message}</p>
      <footer>
        {fields.dress ? <span>{fields.dress}</span> : null}
        {fields.rsvpBy ? <span>Tell us by {formatLongDate(fields.rsvpBy)}</span> : null}
      </footer>
    </article>
  );
}

function Table({ fields }: { fields: InviteFields }) {
  const date = fields.date ? new Date(`${fields.date}T12:00:00`) : null;
  const month = date
    ? date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    : "";
  const day = date ? date.getDate() : "";
  return (
    <article className="card table-card">
      <div className="date-block">
        <span>{month}</span>
        <strong>{day}</strong>
      </div>
      <div>
        <Occasion fields={fields} />
        <p className="time-line">{formatTime(fields.time)}</p>
        <Where fields={fields} />
        <p className="message">{fields.message}</p>
        <footer>
          {fields.dress ? <span>{fields.dress}</span> : null}
          {fields.rsvpBy ? <span>Reply by {formatLongDate(fields.rsvpBy)}</span> : null}
        </footer>
      </div>
    </article>
  );
}

function Palette({ fields, tone }: { fields: InviteFields; tone: string }) {
  return (
    <article className={`card tone tone-${tone}`}>
      <Occasion fields={fields} script={tone === "promise"} />
      <When fields={fields} />
      <Where fields={fields} />
      <p className="message">{fields.message}</p>
      <footer>
        {fields.dress ? <span>{fields.dress}</span> : null}
        {fields.rsvpBy ? <span>Reply by {formatLongDate(fields.rsvpBy)}</span> : null}
      </footer>
    </article>
  );
}

export function InviteView({ template, fields }: { template: Template; fields: InviteFields }) {
  switch (template.style) {
    case "gazal":
      return <GazalInvite fields={fields} quiet />;
    case "garden":
      return <Garden fields={fields} />;
    case "midnight":
      return <Midnight fields={fields} />;
    case "marigold":
      return <Marigold fields={fields} />;
    case "confetti":
      return <Confetti fields={fields} />;
    case "table":
      return <Table fields={fields} />;
    default:
      return <Palette fields={fields} tone={template.style} />;
  }
}
