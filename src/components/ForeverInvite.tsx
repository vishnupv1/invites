import { useEffect, useRef, useState, type FormEvent } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { packOf } from "../data/custom";
import { calendarUrl, formatLongDate, formatTime } from "../lib/dates";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./forever.css";

const ART = "/forever";

type Reply = { name: string; note: string; attending: boolean };
type Phase = "closed" | "open";

/** Leaves and blossoms seated on the branches of the tree artwork. */
const CANOPY: { left: number; top: number; bloom: boolean; delay: number; rot: number; sprig?: boolean }[] = [
  { left: 9.6, top: 35.6, bloom: false, delay: 1.3, rot: -11 },
  { left: 2.2, top: 48.9, bloom: true, delay: 1.56, rot: -33 },
  { left: 17.8, top: 18.0, bloom: false, delay: 0.93, rot: 6, sprig: true },
  { left: 13.5, top: 34.8, bloom: true, delay: 1.28, rot: 36 },
  { left: 13.7, top: 46.3, bloom: false, delay: 1.52, rot: -32 },
  { left: 17.5, top: 61.2, bloom: true, delay: 1.8, rot: -6 },
  { left: 28.5, top: 14.1, bloom: false, delay: 0.85, rot: -17 },
  { left: 21.5, top: 23.2, bloom: true, delay: 1.04, rot: 19 },
  { left: 20.0, top: 38.1, bloom: false, delay: 1.35, rot: -30, sprig: true },
  { left: 22.1, top: 53.6, bloom: true, delay: 1.68, rot: 28 },
  { left: 39.4, top: 9.8, bloom: false, delay: 0.76, rot: -26 },
  { left: 36.8, top: 18.1, bloom: true, delay: 0.93, rot: 1 },
  { left: 36.7, top: 35.8, bloom: false, delay: 1.3, rot: -16 },
  { left: 36.5, top: 53.3, bloom: true, delay: 1.67, rot: -24 },
  { left: 41.5, top: 12.4, bloom: false, delay: 0.81, rot: 30, sprig: true },
  { left: 40.9, top: 26.2, bloom: true, delay: 1.1, rot: -33 },
  { left: 40.8, top: 40.1, bloom: false, delay: 1.39, rot: 16, sprig: true },
  { left: 45.5, top: 51.9, bloom: true, delay: 1.64, rot: -10 },
  { left: 44.1, top: 63.8, bloom: false, delay: 1.89, rot: -16 },
  { left: 51.5, top: 9.5, bloom: true, delay: 0.75, rot: -12 },
  { left: 56.5, top: 26.2, bloom: false, delay: 1.1, rot: -5 },
  { left: 50.5, top: 34.3, bloom: true, delay: 1.27, rot: 12 },
  { left: 55.6, top: 52.6, bloom: false, delay: 1.65, rot: -29 },
  { left: 50.4, top: 62.0, bloom: true, delay: 1.85, rot: -2 },
  { left: 68.0, top: 9.4, bloom: false, delay: 0.75, rot: -31, sprig: true },
  { left: 66.9, top: 19.4, bloom: true, delay: 0.96, rot: -23 },
  { left: 67.3, top: 36.1, bloom: false, delay: 1.31, rot: -7 },
  { left: 63.3, top: 51.4, bloom: true, delay: 1.63, rot: -15 },
  { left: 77.8, top: 14.2, bloom: false, delay: 0.85, rot: -8 },
  { left: 78.0, top: 17.8, bloom: true, delay: 0.92, rot: 38 },
  { left: 75.2, top: 42.0, bloom: false, delay: 1.43, rot: -8, sprig: true },
  { left: 74.8, top: 46.8, bloom: true, delay: 1.53, rot: -14 },
  { left: 74.7, top: 57.2, bloom: false, delay: 1.75, rot: -30 },
  { left: 89.6, top: 19.6, bloom: true, delay: 0.96, rot: -28 },
  { left: 86.6, top: 35.1, bloom: false, delay: 1.29, rot: -26, sprig: true },
  { left: 86.0, top: 47.3, bloom: true, delay: 1.54, rot: -33 },
  { left: 90.0, top: 36.1, bloom: false, delay: 1.31, rot: 21 },
  { left: 90.3, top: 52.3, bloom: true, delay: 1.65, rot: -34 },
];

function GardenBg({ name }: { name: string }) {
  return (
    <>
      <img className="gf-bg is-mobile" src={`${ART}/m-${name}.webp`} alt="" />
      <img className="gf-bg is-desk" src={`${ART}/d-${name}.webp`} alt="" />
    </>
  );
}

const FLOWERS: Record<string, string> = {
  lavender: "sprig-lavender.webp",
  rose: "sprig-rose.webp",
  jasmine: "sprig-jasmine.webp",
  peony: "sprig-peony.webp",
  bloom: "sprig-bloom.webp",
};

/** Seats across the whole bowl, both sides first, so the basket fills evenly. */
const BOWL = [
  [30, 10], [70, 12], [50, 16], [38, 8], [62, 14],
  [34, 22], [66, 20], [46, 24], [56, 18], [42, 14],
  [58, 8], [48, 6], [36, 18], [64, 24], [52, 22],
  [40, 12], [60, 16], [32, 16], [68, 8], [44, 20],
];

function stem(index: number, src: string) {
  const [left, bottom] = BOWL[index % BOWL.length];
  return {
    id: `${index}-${src}-${Math.random().toString(36).slice(2, 7)}`,
    src,
    left,
    bottom,
    rot: ((index * 17) % 34) - 17,
  };
}

function coupleOf(names: string) {
  const [left, right] = names.split(/\s*&\s*/);
  return { left: (left || names).trim(), right: (right || "").trim() };
}

function heroDate(iso: string) {
  const date = new Date(`${iso || "2027-12-12"}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ForeverInvite({ fields, quiet = false, onReply }: {
  fields: InviteFields;
  quiet?: boolean;
  onReply?: (reply: Reply) => void | Promise<unknown>;
}) {
  useFonts("Cormorant Garamond", "DM Sans");
  const pack = packOf("forever", fields.lines);
  const couple = coupleOf(fields.names || "Aarav & Meera");
  const longDate = formatLongDate(fields.date);
  const stamp = heroDate(fields.date);
  const scrollRef = useRef<HTMLDivElement>(null);
  const potRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>(quiet ? "open" : "closed");
  const [now, setNow] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [attend, setAttend] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [bouquet, setBouquet] = useState<ReturnType<typeof stem>[]>([]);
  const [falls, setFalls] = useState<{ id: number; src: string; x: number }[]>([]);
  const run = useRef(0);
  const seen = useRef(new Set<string>());

  const programme = pack.programme?.length
    ? pack.programme
    : [
        { title: "Vivah", time: formatTime(fields.time), text: [fields.venue, fields.address].filter(Boolean).join(", "), note: fields.dress, kick: longDate },
      ];
  const [picked, setPicked] = useState<string[]>(() => programme.map((item) => item.title));
  const photos = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : "")).filter(Boolean);
  const mapsQuery = [fields.venue, fields.address].filter(Boolean).join(", ");
  const maps = mapsQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}` : "";
  const calendar = calendarUrl(fields);
  const target = new Date(`${fields.date || "2027-12-12"}T${fields.time || "10:00"}:00+05:30`).getTime();
  const remaining = Number.isNaN(target) ? 0 : Math.max(0, target - now);
  const units = [
    Math.floor(remaining / 86400000),
    Math.floor(remaining / 3600000) % 24,
    Math.floor(remaining / 60000) % 60,
    Math.floor(remaining / 1000) % 60,
  ];
  const open = phase === "open";

  useEffect(() => {
    if (quiet) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quiet]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>(".gf-reveal")];
    if (quiet || prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { root, threshold: 0.2 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [quiet, photos.length, programme.length, open]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !open) return;
    let alive = true;
    const token = run.current;

    async function collect(type: string) {
      const src = `${ART}/${FLOWERS[type]}`;
      const motion = !quiet && !prefersReducedMotion();
      for (let step = 0; step < 5; step += 1) {
        if (!alive || token !== run.current) return;
        if (!motion) {
          setBouquet((current) => [...current, stem(current.length, src)]);
          continue;
        }
        const x = 34 + Math.random() * 32;
        const id = token * 100000 + step * 1000 + Math.floor(Math.random() * 999);
        setFalls((current) => [...current, { id, src, x }]);
        await new Promise((resolve) => window.setTimeout(resolve, 1350));
        if (!alive || token !== run.current) return;
        setFalls((current) => current.filter((item) => item.id !== id));
        setBouquet((current) => [...current, stem(current.length, src)]);
      }
    }

    const watcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const type = (entry.target as HTMLElement).dataset.flower || "";
        if (!FLOWERS[type] || seen.current.has(type)) return;
        seen.current.add(type);
        void collect(type);
      });
    }, { root, threshold: 0.42 });
    root.querySelectorAll<HTMLElement>("[data-flower]").forEach((section) => watcher.observe(section));
    return () => {
      alive = false;
      watcher.disconnect();
    };
  }, [open, quiet, photos.length]);

  function grow() {
    if (phase !== "closed") return;
    setPhase("open");
  }

  function replay() {
    run.current += 1;
    seen.current.clear();
    setBouquet([]);
    setFalls([]);
    setPhase("closed");
    scrollRef.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    window.setTimeout(() => potRef.current?.focus({ preventScroll: true }), 0);
  }

  function toggleEvent(title: string) {
    setPicked((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    const yes = attend === "yes";
    if (yes && !picked.length) {
      setError("Please choose at least one celebration.");
      return;
    }
    const message = [
      note.trim(),
      yes ? `${guests} guest${guests === 1 ? "" : "s"}` : "",
      yes ? picked.join(", ") : "",
    ].filter(Boolean).join(" · ");
    try {
      await onReply?.({ name: name.trim(), note: message, attending: yes });
    } catch {
      setError("Could not send that reply. Try again.");
      return;
    }
    setError("");
    setSent(true);
  }

  const names = (
    <>
      {couple.left}
      {couple.right ? <> <em>&</em> {couple.right}</> : null}
    </>
  );

  return (
    <div className={`gf${open ? " is-open" : ""}${quiet ? " is-quiet" : ""}`}>
      <div className="gf-scroll" ref={scrollRef}>
        <section className="gf-open" aria-labelledby="gf-title">
          <GardenBg name="opening" />
          <div className="gf-mark">
            <p className="gf-kicker">The Garden of Forever</p>
            <p className="gf-seed">Every love begins with a seed</p>
          </div>
          <div className="gf-stage">
            <div className="gf-grow">
            <img className="gf-tree" src={`${ART}/tree.webp`} alt="" />
            {CANOPY.map((sprig) => (
              <img
                className={`gf-sprout${sprig.bloom ? " is-bloom" : sprig.sprig ? " is-sprig" : ""}`}
                key={`${sprig.left}-${sprig.top}`}
                src={`${ART}/${sprig.bloom ? "sprig-bloom.webp" : sprig.sprig ? "sprig-branch.webp" : "sprig-leaf.webp"}`}
                alt=""
                style={{ left: `${sprig.left}%`, top: `${sprig.top}%`, ["--rot" as string]: `${sprig.rot}deg`, transitionDelay: `${(0.35 + (1 - sprig.top / 100) * 2.2).toFixed(2)}s` }}
              />
            ))}
            </div>
          </div>
          <div className="gf-invite">
            {open ? (
              <>
                <p className="gf-kicker">{fields.hosts || "Together with our families"}</p>
                <h1 id="gf-title">{names}</h1>
                <p className="gf-italic">{fields.title || "Every love begins with a seed"}</p>
                <p className="gf-date">{stamp}</p>
              </>
            ) : (
              <p id="gf-title" className="gf-prompt">Tap anywhere, and let it bloom.</p>
            )}
          </div>
          {open ? null : (
            <button ref={potRef} className="gf-hit" type="button" aria-label="Tap anywhere, and let it bloom" onClick={grow} />
          )}
        </section>

        <section className="gf-scene" data-flower="lavender">
          <GardenBg name="lavender" />
          <div className="gf-panel gf-reveal">
            <img className="gf-sprig is-bouquet" src={`${ART}/lavender-bouquet.webp`} alt="" />
            <p className="gf-kicker">Lavender</p>
            <h2>A love in bloom</h2>
            <div className="gf-wreaths">
              <div className="gf-wreath">
                <img src={`${ART}/frame-lavender.webp`} alt="" />
                <strong>{couple.left}</strong>
              </div>
              {couple.right ? (
                <div className="gf-wreath">
                  <img src={`${ART}/frame-rose.webp`} alt="" />
                  <strong>{couple.right}</strong>
                </div>
              ) : null}
            </div>
            <p>{fields.message || "Together with our families, we invite you to celebrate our wedding."}</p>
            <p className="gf-date">{stamp}</p>
          </div>
        </section>

        <section className="gf-scene" data-flower="rose">
          <GardenBg name="rose" />
          <div className="gf-panel gf-reveal">
            <img className="gf-sprig is-rose" src={`${ART}/sprig-rose.webp`} alt="" />
            <p className="gf-kicker">Rose</p>
            <h2>Days of joy</h2>
            <div className="gf-cards">
              {programme.map((item, index) => (
                <article className="gf-card" key={`${item.title}-${index}`}>
                  <p className="gf-kicker">{item.kick}</p>
                  <h3>{item.title}</h3>
                  {item.time ? <p>{item.time}</p> : null}
                  {item.text ? <p>{item.text}</p> : null}
                  {item.note ? <p className="gf-fine">{item.note}</p> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="gf-scene" data-flower="jasmine">
          <GardenBg name="jasmine" />
          <div className="gf-panel gf-reveal">
            <img className="gf-sprig" src={`${ART}/sprig-jasmine.webp`} alt="" />
            <p className="gf-kicker">Jasmine</p>
            <h2>Our cherished memories</h2>
            {photos.length ? (
              <div className="gf-viewer">
                <button type="button" aria-label="Previous image" onClick={() => setPhoto((photo + photos.length - 1) % photos.length)}>‹</button>
                <img className="gf-shot" src={photos[photo]} alt="" />
                <button type="button" aria-label="Next image" onClick={() => setPhoto((photo + 1) % photos.length)}>›</button>
              </div>
            ) : (
              <p>Held here, and in every season after.</p>
            )}
          </div>
        </section>

        <section className="gf-scene" id="gf-join" data-flower="peony">
          <GardenBg name="peony" />
          <div className="gf-panel gf-reveal">
            <img className="gf-sprig is-peony" src={`${ART}/sprig-peony.webp`} alt="" />
            <p className="gf-kicker">Peony</p>
            <h2>Until we say forever</h2>
            <div className="gf-clock" role="timer" aria-label="Countdown to the wedding">
              {["Days", "Hours", "Min", "Sec"].map((label, index) => (
                <div key={label}>
                  <strong>{String(units[index]).padStart(2, "0")}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="gf-fine">{remaining <= 0 ? "Our celebration has begun." : "Counting the days until we celebrate."}</p>
            <h3>{fields.venue || "The wedding venue"}</h3>
            {fields.address ? <p>{fields.address}</p> : null}
            <p>{[longDate, formatTime(fields.time)].filter(Boolean).join(" · ")}</p>
            {fields.receptionVenue ? <p className="gf-fine">Reception {formatTime(fields.receptionTime)} · {fields.receptionVenue}</p> : null}
            {fields.dress ? <p className="gf-fine">{fields.dress}</p> : null}
            <div className="gf-actions">
              {maps ? <a className="gf-btn is-fill" href={maps} target="_blank" rel="noopener noreferrer">Directions</a> : null}
              {calendar ? <a className="gf-btn" href={calendar} target="_blank" rel="noopener noreferrer">Save the date</a> : null}
            </div>

            <h2 className="gf-ask">Will you join us?</h2>
            <div className="gf-rsvp">
              {sent ? (
                <div className="gf-thanks">
                  <h3>{attend === "yes" ? `With joy, ${name.trim()}.` : `Thank you, ${name.trim()}.`}</h3>
                  <p>{attend === "yes" ? "We look forward to celebrating with you." : "Thank you for letting us know."}</p>
                  <button className="gf-btn" type="button" onClick={() => setSent(false)}>Edit response</button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <label className="gf-field" htmlFor="gf-name">
                    <span>Your full name</span>
                    <input id="gf-name" value={name} maxLength={100} required autoComplete="name" placeholder="Your full name" onChange={(event) => setName(event.target.value)} />
                  </label>
                  <fieldset>
                    <legend>Will you attend?</legend>
                    <div className="gf-choice">
                      <label className={attend === "yes" ? "is-on" : ""}>
                        <input type="radio" name="gf-attend" checked={attend === "yes"} onChange={() => setAttend("yes")} />
                        <span>Joyfully accept</span>
                      </label>
                      <label className={attend === "no" ? "is-on" : ""}>
                        <input type="radio" name="gf-attend" checked={attend === "no"} onChange={() => setAttend("no")} />
                        <span>Regretfully decline</span>
                      </label>
                    </div>
                  </fieldset>
                  {attend === "yes" ? (
                    <>
                      <label className="gf-field" htmlFor="gf-guests">
                        <span>Number of guests</span>
                        <select id="gf-guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>
                          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                            <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                          ))}
                        </select>
                      </label>
                      <fieldset>
                        <legend>Celebrations you will attend</legend>
                        <div className="gf-picks">
                          {programme.map((item) => (
                            <label className={picked.includes(item.title) ? "is-on" : ""} key={item.title}>
                              <input type="checkbox" checked={picked.includes(item.title)} onChange={() => toggleEvent(item.title)} />
                              <span>{item.title}</span>
                              <small>{[item.kick, item.time].filter(Boolean).join(" · ")}</small>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  ) : null}
                  <label className="gf-field" htmlFor="gf-note">
                    <span>A message for the couple</span>
                    <textarea id="gf-note" rows={4} maxLength={500} placeholder="Your blessings and wishes..." value={note} onChange={(event) => setNote(event.target.value)} />
                  </label>
                  <p className="gf-error" role="alert">{error}</p>
                  <button className="gf-send" type="submit">Send my response</button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="gf-scene gf-close" data-flower="bloom">
          <GardenBg name="closing" />
          <div className="gf-panel gf-reveal">
            <p className="gf-kicker">With love and gratitude</p>
            <h2>Together, we bloom.</h2>
            <p className="gf-names">{names}</p>
            <button className="gf-btn" type="button" onClick={replay}>Grow our garden again</button>
            <a className="gf-made" href={madeWithHref("forever")}>Made with InvitesReady</a>
          </div>
        </section>
      </div>

      <div className={`gf-catch${open && (bouquet.length || falls.length) ? " is-on" : ""}`} aria-hidden="true">
        <img src={`${ART}/basket.webp`} alt="" />
        <div className="gf-drop">
          {falls.map((fall) => (
            <img key={fall.id} className="gf-fall" src={fall.src} alt="" style={{ left: `${fall.x}%` }} />
          ))}
        </div>
        <div className="gf-bouquet">
          {bouquet.map((flower) => (
            <img key={flower.id} src={flower.src} alt="" style={{ left: `${flower.left}%`, bottom: `${flower.bottom}%`, ["--r" as string]: `${flower.rot}deg` }} />
          ))}
        </div>
        <img className="gf-rim" src={`${ART}/basket.webp`} alt="" />
      </div>
    </div>
  );
}
