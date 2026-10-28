import { useEffect, useRef, useState, type FormEvent, type TouchEvent } from "react";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import type { InviteFields } from "../types";
import "./village.css";

type Reply = { name: string; note: string; attending: boolean };

const ART = "/village";
const CHAPTERS = ["The Invitation", "Our Story", "Wedding Events", "The Venue", "Travel & Stay", "Our Memories", "RSVP", "A Note from Us", "See You There"];
const STORY_ART = [`${ART}/photo-1.webp`, `${ART}/story-2.webp`, `${ART}/story-3.webp`];
const EVENT_ICONS = [`${ART}/icon-meet.webp`, `${ART}/icon-haldi.webp`, `${ART}/icon-wedding.webp`, `${ART}/icon-reception.webp`];
const WAY_ICONS = [`${ART}/icon-car.webp`, `${ART}/icon-train.webp`, `${ART}/icon-plane.webp`];
const STAY_ICONS = [`${ART}/icon-stay.webp`, `${ART}/icon-bus.webp`, `${ART}/icon-places.webp`, `${ART}/icon-sadya.webp`];
const SHOTS = [
  { src: "photo-1.webp", label: "first glance", turn: -2.5 },
  { src: "photo-2.webp", label: "by the palms", turn: 2 },
  { src: "photo-3.webp", label: "on the water", turn: -1.5 },
  { src: "story-2.webp", label: "the village", turn: 2.5 },
];

function pairOf(names: string) {
  const parts = names.split("&").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { first: names.trim(), second: "" };
  return { first: parts.slice(0, -1).join(" & "), second: parts[parts.length - 1] };
}

function villageDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${date.getDate()}  |  ${month}  |  ${date.getFullYear()}`;
}

function replyBy(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

function Frame() {
  return (
    <>
      <img className="vl-garland is-l" src={`${ART}/garland-l.webp`} alt="" />
      <img className="vl-garland is-r" src={`${ART}/garland-r.webp`} alt="" />
    </>
  );
}

function Heading({ kicker, title, delay = "0.05s" }: { kicker?: string; title: string; delay?: string }) {
  return (
    <>
      {kicker ? <span className="vl-a vl-kicker" style={{ ["--d" as string]: delay }}>{kicker}</span> : null}
      <h2 className="vl-h vl-a" style={{ ["--d" as string]: "0.16s" }}>{title}</h2>
      <img className="vl-a vl-rule" style={{ ["--d" as string]: "0.28s" }} src={`${ART}/divider.webp`} alt="" />
    </>
  );
}

export function VillageInvite({
  fields,
  quiet = false,
  wishes,
  onReply,
}: {
  fields: InviteFields;
  quiet?: boolean;
  wishes?: { name: string; note: string }[];
  onReply?: (reply: Reply) => void | Promise<void>;
}) {
  useFonts("Cormorant Garamond", "Great Vibes", "Jost");
  const pack = packOf("village", fields.lines);
  const couple = pairOf(fields.names);
  const live = Boolean(onReply);
  const letter = (fields.message || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const beats = pack.story ?? [];
  const events = pack.programme ?? [];
  const ways = pack.facts ?? [];
  const stays = pack.rooms ?? [];
  const photos = SHOTS.map((shot, index) => ({
    ...shot,
    url: fields.photos?.[index] ? assetUrl(fields.photos[index]) : live ? "" : `${ART}/${shot.src}`,
  })).filter((shot) => shot.url);
  const dateLine = villageDate(fields.date);
  const replyLine = replyBy(fields.rsvpBy);
  const mapQuery = fields.lat && fields.lng
    ? `${fields.lat},${fields.lng}`
    : [fields.venue, fields.address].filter(Boolean).join(" ");
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery || "Guruvayur Kerala")}`;

  const trackRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [begun, setBegun] = useState(false);
  const [page, setPage] = useState(0);
  const [music, setMusic] = useState(false);
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(2);
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [nameError, setNameError] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [light, setLight] = useState(-1);

  function go(next: number) {
    const index = Math.max(0, Math.min(CHAPTERS.length - 1, next));
    const track = trackRef.current;
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: quiet ? "auto" : "smooth" });
    setPage(index);
  }

  useEffect(() => {
    if (!begun) return;
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      setPage((current) => (current === index ? current : index));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [begun]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (light >= 0) {
        if (event.key === "Escape") setLight(-1);
        if (event.key === "ArrowRight") setLight((value) => (value + 1) % photos.length);
        if (event.key === "ArrowLeft") setLight((value) => (value + photos.length - 1) % photos.length);
        return;
      }
      if (!begun) {
        if (event.key === "Enter" || event.key === "ArrowRight") setBegun(true);
        return;
      }
      if (event.key === "ArrowRight") go(page + 1);
      if (event.key === "ArrowLeft") go(page - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function beginFromSwipe(event: TouchEvent) {
    const point = event.changedTouches[0];
    const start = touch.current;
    touch.current = null;
    if (!point || !start) return;
    if (start.x - point.clientX > 48 || start.y - point.clientY > 64) setBegun(true);
  }

  async function toggleMusic(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    const node = audioRef.current;
    if (!node) {
      setToast("Add a song from the editor to play it here.");
      return;
    }
    try {
      if (music) {
        node.pause();
        setMusic(false);
      } else {
        await node.play();
        setMusic(true);
      }
    } catch {
      setToast("Music could not play in this browser.");
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Invite link copied.");
    } catch {
      setToast("Copy the link from the address bar to share it.");
    }
  }

  function openCalendar() {
    const url = calendarUrl(fields);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const yes = attend === "yes";
    try {
      await onReply?.({
        name: name.trim(),
        note: yes ? `${guests} ${guests === 1 ? "guest" : "guests"}` : "",
        attending: yes,
      });
      setDone(true);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not send that reply.");
    }
  }

  const musicButton = (
    <button type="button" className={`vl-music${music ? " is-on" : ""}`} aria-pressed={music} aria-label={music ? "Pause music" : "Play music"} onClick={toggleMusic}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="7" cy="18" r="2.4" fill="currentColor" />
        <circle cx="17" cy="16" r="2.4" fill="currentColor" />
      </svg>
    </button>
  );

  return (
    <article className="vl" data-motion={quiet ? "off" : "on"}>
      {fields.audio ? <audio ref={audioRef} src={assetUrl(fields.audio)} loop preload="none" /> : null}
      {begun ? (
        <>
          <div className="vl-track" ref={trackRef}>
            <section className="vl-page vl-invite" data-on={page === 0 ? "1" : "0"} aria-label="Page 2 of 10: The Invitation">
              <div className="vl-scene" style={{ backgroundImage: `url(${ART}/invite.webp)` }} />
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit vl-invite-fit">
                  <div className="vl-invite-copy">
                    {fields.hosts ? <span className="vl-a vl-kicker" style={{ ["--d" as string]: "0.1s" }}>{fields.hosts}</span> : null}
                    <h2 className="vl-script vl-a" style={{ ["--d" as string]: "0.2s" }}>{couple.first}</h2>
                    {couple.second ? <span className="vl-amp vl-a" style={{ ["--d" as string]: "0.32s" }}>&</span> : null}
                    {couple.second ? <h2 className="vl-script vl-a" style={{ ["--d" as string]: "0.4s" }}>{couple.second}</h2> : null}
                    {fields.title ? <p className="vl-a vl-lead" style={{ ["--d" as string]: "0.52s" }}>{fields.title}</p> : null}
                  </div>
                  <div className="vl-invite-when vl-a" style={{ ["--d" as string]: "0.7s" }}>
                    {dateLine ? <strong>{dateLine}</strong> : null}
                    {fields.venue ? <span>{fields.venue}</span> : null}
                    {fields.address ? <em>{fields.address}</em> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="vl-page vl-paper" data-on={page === 1 ? "1" : "0"} aria-label="Page 3 of 10: Our Story">
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit">
                  <Heading kicker="A journey that feels like home" title="Our Story" />
                  <div className="vl-story">
                    {beats.map((beat, index) => (
                      <figure key={`${beat.title}-${index}`} className="vl-a vl-beat" style={{ ["--d" as string]: `${0.4 + index * 0.12}s` }}>
                        {STORY_ART[index] ? <img src={STORY_ART[index]} alt="" /> : null}
                        <figcaption>
                          <strong>{beat.title}</strong>
                          {beat.year ? <em>{beat.year}</em> : null}
                          {beat.text ? <span>{beat.text}</span> : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="vl-page vl-paper" data-on={page === 2 ? "1" : "0"} aria-label="Page 4 of 10: Wedding Events">
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit">
                  <Heading kicker="Of love, tradition and family" title="Wedding Events" />
                  <p className="vl-a vl-lead" style={{ ["--d" as string]: "0.34s" }}>Join us for a celebration of love, tradition and family.</p>
                  <div className="vl-events">
                    {events.map((item, index) => (
                      <article key={`${item.title}-${index}`} className="vl-a vl-event" style={{ ["--d" as string]: `${0.42 + index * 0.08}s` }}>
                        <img src={EVENT_ICONS[index % EVENT_ICONS.length]} alt="" />
                        <div>
                          <strong>{item.title}</strong>
                          <em>{[item.kick, item.time].filter(Boolean).join(" · ")}</em>
                          {item.text ? <span>{item.text}</span> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="vl-page vl-paper" data-on={page === 3 ? "1" : "0"} aria-label="Page 5 of 10: The Venue">
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit">
                  <Heading title="Wedding Venue" />
                  <img className="vl-a vl-venue-photo" style={{ ["--d" as string]: "0.3s" }} src={`${ART}/venue.webp`} alt="" />
                  <div className="vl-a vl-venue-name" style={{ ["--d" as string]: "0.4s" }}>
                    <img src={`${ART}/icon-pin.webp`} alt="" />
                    <div>
                      {fields.venue ? <strong>{fields.venue}</strong> : null}
                      {fields.address ? <span>{fields.address}</span> : null}
                    </div>
                  </div>
                  <a className="vl-a vl-button" style={{ ["--d" as string]: "0.5s" }} href={mapHref} target="_blank" rel="noopener noreferrer">View on Google Maps</a>
                  {ways.length ? (
                    <div className="vl-ways">
                      {ways.map((item, index) => (
                        <article key={item.label} className="vl-a" style={{ ["--d" as string]: `${0.58 + index * 0.06}s` }}>
                          <img src={WAY_ICONS[index % WAY_ICONS.length]} alt="" />
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="vl-page vl-paper" data-on={page === 4 ? "1" : "0"} aria-label="Page 6 of 10: Travel and Stay">
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit">
                  <Heading kicker="Make your stay comfortable" title="Travel & Stay" />
                  <div className="vl-stays">
                    {stays.map((item, index) => (
                      <article key={`${item.name}-${index}`} className="vl-a vl-stay" style={{ ["--d" as string]: `${0.36 + index * 0.08}s` }}>
                        <img src={STAY_ICONS[index % STAY_ICONS.length]} alt="" />
                        <div>
                          {item.label ? <em>{item.label}</em> : null}
                          <strong>{item.name}</strong>
                          {item.text ? <span>{item.text}</span> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                  <img className="vl-a vl-footer-boat" style={{ ["--d" as string]: "0.8s" }} src={`${ART}/boat-sm.webp`} alt="" />
                </div>
              </div>
            </section>

            <section className="vl-page vl-paper" data-on={page === 5 ? "1" : "0"} aria-label="Page 7 of 10: Our Memories">
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit">
                  <Heading kicker="A few glimpses from our journey" title="Our Memories" />
                  {photos.length ? (
                    <div className="vl-mem">
                      {photos.map((shot, index) => (
                        <button
                          key={shot.label}
                          type="button"
                          className="vl-a vl-shot"
                          style={{ ["--d" as string]: `${0.36 + index * 0.08}s`, ["--turn" as string]: `${shot.turn}deg` }}
                          aria-label={`Open photo: ${shot.label}`}
                          onClick={() => setLight(index)}
                        >
                          <img src={shot.url} alt="" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="vl-lead">Photographs will be here.</p>
                  )}
                  <img className="vl-a vl-footer-boat" style={{ ["--d" as string]: "0.8s" }} src={`${ART}/boat-sm.webp`} alt="" />
                </div>
              </div>
            </section>

            <section className="vl-page vl-paper" data-on={page === 6 ? "1" : "0"} aria-label="Page 8 of 10: RSVP">
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit">
                  <Heading kicker={replyLine ? `Kindly RSVP by ${replyLine}` : "Kindly reply"} title="Will You Be There?" />
                  <div className="vl-a vl-card" style={{ ["--d" as string]: "0.36s" }}>
                    {done ? (
                      <div className="vl-done">
                        <strong>{attend === "yes" ? "We will see you there" : "We will miss you"}</strong>
                        <p>
                          {attend === "yes"
                            ? `Thank you, ${name.trim()}. ${guests} ${guests === 1 ? "place is" : "places are"} saved for you.`
                            : `Thank you for telling us, ${name.trim()}.`}
                        </p>
                        <button type="button" className="vl-button" onClick={() => setDone(false)}>Change my reply</button>
                      </div>
                    ) : (
                      <form className="vl-form" onSubmit={submit}>
                        <label htmlFor="vl-name">Your name</label>
                        <input id="vl-name" className={nameError ? "is-bad" : ""} value={name} placeholder="Your name" onChange={(event) => { setName(event.target.value); setNameError(false); }} />
                        {nameError ? <span className="vl-err">Please write your name.</span> : null}
                        <label htmlFor="vl-guests">Number of guests</label>
                        <select id="vl-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                            <option key={count} value={count}>{count}</option>
                          ))}
                        </select>
                        <div className="vl-choice">
                          <label className={attend === "yes" ? "is-on" : ""}>
                            <input type="radio" name="vl-attend" checked={attend === "yes"} onChange={() => setAttend("yes")} />
                            Attending
                          </label>
                          <label className={attend === "no" ? "is-on" : ""}>
                            <input type="radio" name="vl-attend" checked={attend === "no"} onChange={() => setAttend("no")} />
                            Not attending
                          </label>
                        </div>
                        <button type="submit" className="vl-button">Confirm RSVP</button>
                      </form>
                    )}
                  </div>
                  <img className="vl-a vl-footer-boat is-tiny" style={{ ["--d" as string]: "0.7s" }} src={`${ART}/boat-sm.webp`} alt="" />
                </div>
              </div>
            </section>

            <section className="vl-page vl-paper" data-on={page === 7 ? "1" : "0"} aria-label="Page 9 of 10: A Note from Us">
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit">
                  <Heading title="A Note from Us" />
                  <div className="vl-note-art">
                    <img className="vl-a vl-lamp" style={{ ["--d" as string]: "0.3s" }} src={`${ART}/lamp.webp`} alt="" />
                    <div className="vl-letter">
                      {letter.map((paragraph, index) => (
                        <p key={paragraph} className="vl-a" style={{ ["--d" as string]: `${0.4 + index * 0.08}s` }}>{paragraph}</p>
                      ))}
                      <span className="vl-a vl-sign" style={{ ["--d" as string]: "0.7s" }}>With love,</span>
                      {fields.names ? <strong className="vl-a vl-script is-sign" style={{ ["--d" as string]: "0.82s" }}>{fields.names}</strong> : null}
                      {wishes?.length ? (
                        <ul className="vl-wishes">
                          {wishes.map((wish) => (
                            <li key={`${wish.name}-${wish.note}`}>
                              <p>{wish.note}</p>
                              {wish.name ? <span>{wish.name}</span> : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <img className="vl-a vl-umbrella" style={{ ["--d" as string]: "0.3s" }} src={`${ART}/umbrella.webp`} alt="" />
                  </div>
                </div>
              </div>
            </section>

            <section className="vl-page vl-close" data-on={page === 8 ? "1" : "0"} aria-label="Page 10 of 10: See You There">
              <div className="vl-scene" style={{ backgroundImage: `url(${ART}/closing.webp)` }} />
              <Frame />
              <div className="vl-scroll">
                <div className="vl-fit vl-close-fit">
                  <h2 className="vl-script vl-a" style={{ ["--d" as string]: "0.1s" }}>See You There!</h2>
                  <p className="vl-a vl-lead" style={{ ["--d" as string]: "0.24s" }}>Let’s create beautiful memories together</p>
                  {dateLine ? <span className="vl-a vl-tag" style={{ ["--d" as string]: "0.36s" }}>{dateLine}</span> : null}
                  {fields.names ? <strong className="vl-a vl-script is-sign" style={{ ["--d" as string]: "0.48s" }}>{fields.names}</strong> : null}
                  <div className="vl-a vl-actions" style={{ ["--d" as string]: "0.6s" }}>
                    <button type="button" className="vl-button" onClick={openCalendar}>Add to calendar</button>
                    <button type="button" className="vl-button is-ghost" onClick={share}>Share invite</button>
                  </div>
                  <a className="vl-a vl-made" style={{ ["--d" as string]: "0.74s" }} href={madeWithHref("village")}>Made with InvitesReady</a>
                </div>
              </div>
            </section>
          </div>
          {musicButton}
          <nav className="vl-chrome" aria-label="Invitation pages">
            <button type="button" className="vl-arrow" aria-label="Previous page" disabled={page === 0} onClick={() => go(page - 1)}>‹</button>
            <div className="vl-dots">
              {CHAPTERS.map((label, index) => (
                <button key={label} type="button" className={index === page ? "is-on" : ""} aria-label={label} aria-current={index === page ? "true" : undefined} onClick={() => go(index)} />
              ))}
            </div>
            <button type="button" className="vl-arrow" aria-label="Next page" disabled={page === CHAPTERS.length - 1} onClick={() => go(page + 1)}>›</button>
          </nav>
          {light >= 0 && photos[light] ? (
            <div className="vl-light" role="dialog" aria-modal="true" aria-label="Photo">
              <button type="button" className="vl-light-x" aria-label="Close photo" onClick={() => setLight(-1)}>×</button>
              <img src={photos[light].url} alt="" />
              <div className="vl-light-row">
                <button type="button" aria-label="Previous photo" onClick={() => setLight((value) => (value + photos.length - 1) % photos.length)}>‹</button>
                <span>{photos[light].label}</span>
                <button type="button" aria-label="Next photo" onClick={() => setLight((value) => (value + 1) % photos.length)}>›</button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <section
          className="vl-open"
          data-on="1"
          onClick={() => setBegun(true)}
          onTouchStart={(event) => {
            const point = event.touches[0];
            if (point) touch.current = { x: point.clientX, y: point.clientY };
          }}
          onTouchEnd={beginFromSwipe}
        >
          <div className="vl-scene is-ken" style={{ backgroundImage: `url(${ART}/opening.webp)` }} />
          <img className="vl-birds" src={`${ART}/birds.webp`} alt="" />
          <Frame />
          <div className="vl-open-copy">
            <h1 className="vl-a" style={{ ["--d" as string]: "0.15s" }}>You’re Invited</h1>
            <p className="vl-a" style={{ ["--d" as string]: "0.4s" }}>A journey of two hearts begins</p>
          </div>
          <div className="vl-play-wrap">
            <button type="button" className="vl-play" aria-label="Tap to begin" onClick={() => setBegun(true)}>
              <span />
            </button>
            <em>Tap to begin</em>
          </div>
          {musicButton}
        </section>
      )}
      {toast ? (
        <div className="vl-toast" role="status">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")}>OK</button>
        </div>
      ) : null}
    </article>
  );
}
