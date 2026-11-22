import { useEffect, useState } from "react";
import type { InviteFields } from "../types";
import { assetUrl } from "../api";
import { InstagramLink } from "./InstagramLink";
import { useFonts } from "../lib/fonts";
import { madeWithHref } from "../lib/share";
import "./sage.css";

type Phase = "closed" | "opening" | "open" | "print";

function stamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[2]}/${match[3]}/${match[1]}`;
}

export function SageInvite({ fields, quiet = false }: { fields: InviteFields; quiet?: boolean }) {
  useFonts("Great Vibes", "Cormorant Garamond", "Jost");
  const [phase, setPhase] = useState<Phase>(quiet ? "print" : "closed");
  const photo = (fields.photos ?? []).map((item) => (item ? assetUrl(item) : "")).find(Boolean) || "";
  const place = [fields.venue, fields.address].filter(Boolean).join(" · ");
  const date = stamp(fields.date || "");

  useEffect(() => {
    if (phase !== "opening") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("print");
      return;
    }
    const openAt = window.setTimeout(() => setPhase("open"), 3100);
    return () => window.clearTimeout(openAt);
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const printAt = window.setTimeout(() => setPhase("print"), 480);
    return () => window.clearTimeout(printAt);
  }, [phase]);

  function openInvite() {
    if (phase !== "closed") return;
    setPhase("opening");
  }

  const lifting = phase === "opening" || phase === "open" || phase === "print";
  const revealed = phase === "open" || phase === "print";

  return (
    <div className={`sa${lifting ? " is-opening" : ""}${revealed ? " is-open" : ""}${phase === "print" ? " is-print" : ""}${quiet ? " is-quiet" : ""}`}>
      <div className="sa-stage">
        <div className="sa-paper" />
        <section className="sa-invite" aria-label="Wedding announcement">
          <div className="sa-lang" aria-hidden="true">🇬🇧 EN ⌄</div>
          <div className="sa-identity">
            <div className="sa-eyebrow">{fields.title || "We're getting married"}</div>
            <h1 className="sa-names">{fields.names || "Ana & Luka"}</h1>
            <div className="sa-dispenser">
              <div className="sa-mask">
                <div className="sa-polaroid">
                  <div className="sa-photo">
                    {photo ? <img src={photo} alt="" /> : <div className="sa-placeholder">Your couple photo</div>}
                  </div>
                  {date ? <div className="sa-date">{date}</div> : null}
                </div>
              </div>
              <img className="sa-slot" src="/sage/gold-slot.webp" alt="" />
            </div>
          </div>
          {place ? <p className="sa-place">{place}</p> : null}
          <button className="sa-replay" type="button" onClick={() => setPhase("closed")}>↻ Replay</button>
          <div className="sa-credit">
            <a href={madeWithHref("sage")}>Made with InvitesReady</a>
            <InstagramLink />
          </div>
        </section>
        {phase === "closed" || phase === "opening" ? (
          <div className="sa-env">
            <div className="sa-sheet">
              <img className="fit sa-front" src="/bloom/envelope.webp" alt="" />
              <div className="sa-flap">
                <img src="/bloom/flap.webp" alt="" />
                <span className="sa-flap-back" />
              </div>
              <img className="sa-bow" src="/sage/ivory-bow.webp" alt="" />
              <div className="sa-env-copy">
                <span>A letter for you, with love</span>
                <strong>{fields.names || "Ana & Luka"}</strong>
              </div>
              {phase === "closed" ? <span className="sa-tap">TAP TO OPEN</span> : null}
            </div>
            {phase === "closed" ? (
              <button type="button" className="sa-hit" aria-label="Open invitation" onClick={openInvite} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
