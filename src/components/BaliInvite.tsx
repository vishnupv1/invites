import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { useFonts } from "../lib/fonts";
import { InstagramLink } from "./InstagramLink";
import { madeWithHref } from "../lib/share";
import "./bali.css";

const ART = "/bali";

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "go" | "open";

function coupleOf(names: string) {
  const [left, right] = names.split(/\s*&\s*/);
  return { left: (left || names).trim(), right: (right || "").trim() };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function momentOf(fields: InviteFields) {
  const date = new Date(`${fields.date || "2027-04-18"}T${fields.time || "17:00"}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function longDate(value: Date | null) {
  if (!value) return "";
  return value.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function shortTime(value: Date | null) {
  if (!value) return "";
  return value.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function downloadCalendar(when: Date, names: string, place: string) {
  const end = new Date(when.getTime() + 3 * 60 * 60 * 1000);
  const stamp = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, "\\$&");
  const payload = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bali Romance//Engagement//EN",
    "BEGIN:VEVENT",
    `UID:bali-${when.getTime()}@invitation.local`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(when)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${names} Engagement`)}`,
    `LOCATION:${esc(place)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  const url = URL.createObjectURL(new Blob([payload.join("\r\n")], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "engagement.ics";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BaliInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Allura");
  const couple = coupleOf(fields.names || "Kelly & Daniel");
  const names = [couple.left, couple.right].filter(Boolean).join(" & ");
  const when = momentOf(fields);
  const place = [fields.venue, fields.address].filter(Boolean).join(", ") || "Uluwatu, Bali";
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
  const photos = Array.from({ length: 6 }, (_, index) => {
    const item = fields.photos?.[index];
    return item ? assetUrl(item) : "";
  });
  const story = fields.message || "Now we want to celebrate our next chapter with you.";

  const scrollRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const timer = useRef(0);
  const pageRef = useRef(0);
  const lock = useRef(false);
  const readyRef = useRef(false);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [page, setPage] = useState(0);
  const [still, setStill] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [attend, setAttend] = useState<"" | "yes" | "no">("");
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const going = phase !== "closed";
  const ready = phase === "open";
  readyRef.current = ready;
  const yes = attend !== "no";
  const remaining = when ? Math.max(0, Math.floor((when.getTime() - now) / 1000)) : 0;
  const clock = `${Math.floor(remaining / 86400)} days · ${Math.floor(remaining / 3600) % 24}h · ${Math.floor(remaining / 60) % 60}m · ${remaining % 60}s`;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  useEffect(() => {
    if (!ready || quiet) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ready, quiet]);

  function goTo(next: number) {
    const max = readyRef.current ? 5 : 0;
    const target = Math.max(0, Math.min(max, next));
    if (target === pageRef.current || lock.current) return;
    lock.current = true;
    pageRef.current = target;
    setPage(target);
    window.setTimeout(() => { lock.current = false; }, 900);
  }

  function showNext() {
    if (!readyRef.current || pageRef.current !== 0) return;
    goTo(1);
  }

  useLayoutEffect(() => {
    const node = scrollRef.current?.querySelector<HTMLElement>(".is-on");
    if (node) node.scrollTop = 0;
  }, [page]);

  useEffect(() => {
    if (page !== 2) return;
    const id = window.requestAnimationFrame(() => {
      setSeen((current) => (current.toast ? current : { ...current, toast: true }));
    });
    return () => window.cancelAnimationFrame(id);
  }, [page]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || quiet) return;
    const atEdge = (node: HTMLElement, delta: number, top: number) => {
      if (node.scrollHeight <= node.clientHeight + 2) return true;
      if (delta > 0) return top + node.clientHeight >= node.scrollHeight - 2;
      return top <= 2;
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const node = root.querySelector<HTMLElement>(".is-on");
      if (!node || !atEdge(node, event.deltaY, node.scrollTop)) return;
      event.preventDefault();
      if (Math.abs(event.deltaY) < 12) return;
      goTo(pageRef.current + (event.deltaY > 0 ? 1 : -1));
    };
    let startY = 0;
    let startTop = 0;
    const onStart = (event: TouchEvent) => {
      startY = event.touches[0].clientY;
      startTop = root.querySelector<HTMLElement>(".is-on")?.scrollTop ?? 0;
    };
    const onEnd = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      const dy = startY - event.changedTouches[0].clientY;
      if (Math.abs(dy) < 48) return;
      const node = root.querySelector<HTMLElement>(".is-on");
      if (!node || !atEdge(node, dy, startTop)) return;
      goTo(pageRef.current + (dy > 0 ? 1 : -1));
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchend", onEnd);
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchend", onEnd);
    };
  }, [quiet]);

  useEffect(() => {
    if (!ready || quiet) return;
    const reduced = still || prefersReducedMotion();
    if (reduced) {
      const id = window.setTimeout(showNext, 400);
      return () => window.clearTimeout(id);
    }
    const scooter = scrollRef.current?.querySelector<HTMLElement>(".br-scooter");
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      showNext();
    };
    const onEnd = (event: Event) => {
      if (!(event instanceof AnimationEvent) || event.animationName !== "br-ride") return;
      go();
    };
    scooter?.addEventListener("animationend", onEnd);
    const fallback = window.setTimeout(go, 5900);
    return () => {
      scooter?.removeEventListener("animationend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [ready, quiet, still]);

  function openInvite() {
    if (phase !== "closed") return;
    const reduced = still || prefersReducedMotion();
    setPhase("go");
    timer.current = window.setTimeout(() => setPhase("open"), reduced ? 0 : 1800);
  }

  function replay() {
    window.clearTimeout(timer.current);
    lock.current = false;
    pageRef.current = 0;
    setPage(0);
    setPhase("closed");
    setSeen({});
    openRef.current?.focus();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const guest = name.trim();
    if (guest.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!attend) {
      setError("Please choose whether you will join us.");
      return;
    }
    const count = attend === "yes" ? Math.min(10, Math.max(1, guests)) : 0;
    const message = [count ? `Guests: ${count}` : "", note.trim()].filter(Boolean).join("\n");
    setBusy(true);
    setError("");
    try {
      await onReply?.({ name: guest, note: message, attending: attend === "yes" });
    } catch {
      setError("Unable to send. Please try again.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setMenu(false);
    setSent(true);
  }

  return (
    <div className={`br${going ? " is-open" : ""}${ready ? " is-ready" : ""}${quiet ? " is-quiet" : ""}${still ? " is-still" : ""}`}>
      <div className="br-scroll" ref={scrollRef}>
        <section className={`br-road${page === 0 ? " is-on" : ""}`} id="opening">
          <div className="br-art">
            <div className="br-world">
              <img className="br-bg" src={`${ART}/road.webp`} alt="" />
              <img className="br-scooter" src={`${ART}/scooter.png`} alt="" />
            </div>
            <img className="br-branch is-left" src={`${ART}/branch-left.png`} alt="" />
            <img className="br-branch is-right" src={`${ART}/branch-right.png`} alt="" />
            <div className="br-copy br-hero">
              <small>{fields.hosts || "We are getting engaged"}</small>
              <h1>{fields.title || "Save the Date"}</h1>
              <p>{longDate(when)}</p>
              <p>{place}</p>
            </div>
            <button ref={openRef} className="br-open" type="button" aria-label="Open invitation" onClick={openInvite}>
              <img className="br-fan is-1" src={`${ART}/fan-left.png`} alt="" />
              <img className="br-fan is-2" src={`${ART}/fan-left.png`} alt="" />
              <span>Tap to open ♡</span>
            </button>
            <button className="br-cue" type="button" onClick={showNext}>
              Discover our story ↓
            </button>
          </div>
        </section>

        {ready ? (
          <>
            <section className={`br-scene br-beach${page === 1 ? " is-on" : ""}`} id="proposal" data-scene="proposal">
              <div className="br-art">
                <img className="br-bg" src={`${ART}/beach.webp`} alt="" />
                <div className="br-copy br-story">
                  <small>The moment</small>
                  <h2>She said yes!</h2>
                </div>
                <img className="br-man" src={`${ART}/proposal-man.png`} alt="" />
                <img className="br-woman" src={`${ART}/proposal-woman.png`} alt="" />
                <img className="br-leaf" src={`${ART}/foliage.png`} alt="" />
              </div>
              <aside className="br-aside">
                <h2>It started with a yes.</h2>
                <p>{story}</p>
                <button type="button" onClick={() => goTo(2)}>Continue</button>
              </aside>
            </section>

            <section className={`br-scene${page === 2 ? " is-on" : ""}${seen.toast ? " is-seen" : ""}`} data-scene="toast">
              <div className="br-art">
                <img className="br-bg" src={`${ART}/beach.webp`} alt="" />
                <div className="br-copy br-story">
                  <h2>Cheers to us!</h2>
                </div>
                <div className="br-coco is-1">
                  <img src={`${ART}/coconut-left.png`} alt="" />
                  <span>{couple.left}</span>
                </div>
                <div className="br-coco is-2">
                  <img src={`${ART}/coconut-right.png`} alt="" />
                  <span>{couple.right}</span>
                </div>
              </div>
              <aside className="br-aside">
                <h2>To love and adventure</h2>
                <p>Join us for a tropical celebration.</p>
                <button type="button" onClick={() => goTo(3)}>Continue</button>
              </aside>
            </section>

            <section className={`br-scene${page === 3 ? " is-on" : ""}`} data-scene="dance">
              <div className="br-art">
                <img className="br-bg" src={`${ART}/stage.webp`} alt="" />
                <div className="br-copy br-dance">
                  <h2>Let&apos;s dance</h2>
                </div>
                <div className="br-pair">
                  <img className="br-dm" src={`${ART}/dance-man.png`} alt="" />
                  <img className="br-dw" src={`${ART}/dance-woman.png`} alt="" />
                </div>
              </div>
              <aside className="br-aside">
                <small>The celebration</small>
                <h2>{place}</h2>
                <p>{longDate(when)}</p>
                <p>{shortTime(when)}</p>
                <div className="br-tools">
                  <a className="br-link br-tool" href={maps} target="_blank" rel="noopener">Open in maps</a>
                  <button className="br-tool" type="button" onClick={() => when && downloadCalendar(when, names, place)}>Add to calendar</button>
                </div>
                <button type="button" onClick={() => goTo(4)}>Continue</button>
              </aside>
            </section>

            <section className={`br-gallery${page === 4 ? " is-on" : ""}`} data-scene="gallery">
              <small>Our photographs</small>
              <h2>Us, so far</h2>
              <div className="br-grid">
                {photos.map((src, index) => src
                  ? <img key={index} src={src} alt="" />
                  : <span key={index} />)}
              </div>
              <button type="button" onClick={() => goTo(5)}>Continue</button>
            </section>

            <section className={`br-details${page === 5 ? " is-on" : ""}`}>
              <small>Counting down</small>
              <h2>Until we celebrate</h2>
              <p className="br-count" aria-live="off">{clock}</p>
              <h2>RSVP</h2>
              {sent ? (
                <>
                  <p className="br-status" role="status">Thank you. Your reply was sent.</p>
                  <button className="br-tool" type="button" onClick={() => { setSent(false); setError(""); }}>Edit response</button>
                </>
              ) : (
                <form className="br-form" onSubmit={submit}>
                  <label>
                    Your name
                    <input name="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
                  </label>
                  <div className={`br-menu${menu ? " is-open" : ""}`} ref={menuRef}>
                    <span id="br-reply">Will you join us?</span>
                    <button type="button" aria-labelledby="br-reply" aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
                      {attend === "yes" ? "Accept" : attend === "no" ? "Decline" : "Select"}
                      <i aria-hidden="true" />
                    </button>
                    {menu ? (
                      <ul role="listbox" aria-labelledby="br-reply">
                        {([["yes", "Accept"], ["no", "Decline"]] as const).map(([value, label]) => (
                          <li key={value}>
                            <button type="button" role="option" aria-selected={attend === value} onClick={() => { setAttend(value); setMenu(false); }}>
                              {label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {yes ? (
                    <label>
                      Guests
                      <input name="guests" type="number" min={1} max={10} required value={guests} onChange={(event) => setGuests(Number(event.target.value))} />
                    </label>
                  ) : null}
                  <label>
                    Message
                    <textarea name="message" value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  {error ? <p className="br-status" role="status">{error}</p> : null}
                  <button className="br-tool" type="submit" disabled={busy}>{busy ? "Sending…" : "Send RSVP"}</button>
                </form>
              )}
              <footer className="br-foot">
                <h2>{names}</h2>
                <div className="br-tools">
                  <button className="br-tool" type="button" onClick={replay}>Replay invitation</button>
                  <button className="br-tool" type="button" aria-pressed={still} onClick={() => setStill((value) => !value)}>Reduce motion</button>
                </div>
                <a className="br-made" href={madeWithHref("bali")}>Made with InvitesReady</a>
                <InstagramLink className="br-made" />
              </footer>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
