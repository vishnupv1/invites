import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon, BackIcon, CheckIcon, CopyIcon, PeopleIcon, ShareIcon, StoryIcon } from "./shell/marks";
import "./live-share.css";

type Props = {
  names: string;
  priceLabel: string;
  link: string;
  when?: string;
  onClose: () => void;
};

const PETALS = ["#E9A23B", "#F6D29A", "#C8442A", "#FFFDF8"];

function shownLink(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function guestPath(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function LiveShare({ names, priceLabel, link, when, onClose }: Props) {
  const [step, setStep] = useState<"live" | "share">("live");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("You're invited.");
  const pretty = shownLink(link);
  const paidLine = priceLabel === "Free"
    ? `${names}'s invitation is ready for the family group.`
    : `${priceLabel} paid. ${names}'s invitation is ready for the family group.`;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function openWhatsApp() {
    const body = message.includes(link) ? message : `${message}\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
  }

  if (step === "share") {
    return (
      <div className="lv-share" role="dialog" aria-label="Share">
        <div className="lv-sheet">
          <header className="lv-bar">
            <button type="button" className="lv-back" aria-label="Back" onClick={() => setStep("live")}><BackIcon /></button>
            <div>
              <h1>Share</h1>
              <small>Send it to the family group</small>
            </div>
          </header>
          <div className="lv-body">
            <div className="lv-wa">
              <div className="lv-bub">
                <div className="lv-card">
                  <span className="lv-mini">
                    <iframe title="" src={guestPath(link)} tabIndex={-1} />
                  </span>
                  <p>{when ? `${names} · ${when}` : names}</p>
                  <small>{pretty} · Tap to open</small>
                </div>
                <div className="lv-bub-text">{message}</div>
              </div>
            </div>
            <label className="lv-msg">
              Your message
              <textarea value={message} aria-label="Message" onChange={(event) => setMessage(event.target.value)} />
            </label>
            <div className="lv-apps">
              <button type="button" onClick={openWhatsApp}><i className="is-wa"><img src="/whatsapp.png" alt="" width={20} height={20} /></i>WhatsApp</button>
              <button type="button" onClick={openWhatsApp}><i className="gp"><PeopleIcon /></i>Groups</button>
              <button type="button" onClick={openWhatsApp}><i className="st"><StoryIcon /></i>Story</button>
              <button type="button" onClick={() => { void copy(message.includes(link) ? message : `${message}\n${link}`); }}><i><CopyIcon /></i>Copy</button>
            </div>
          </div>
          <footer className="lv-foot">
            <button type="button" className="lv-go is-wa" onClick={openWhatsApp}>
              <span>Send on WhatsApp</span><b><ArrowIcon /></b>
            </button>
            <Link to="/guests" className="lv-done" onClick={onClose}>Done — see RSVPs</Link>
          </footer>
          {copied ? <div className="lv-toast">Link copied</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="lv-live" role="dialog" aria-label="Invitation is live">
      <div className="lv-sheet won">
        {PETALS.map((color, index) => (
          <span key={color + index} className="lv-petal" style={{ left: `${8 + index * 22}%`, background: color, animationDelay: `${index * 0.18}s` }} />
        ))}
        <div className="lv-body">
          <div className="lv-seal" aria-hidden="true"><CheckIcon /></div>
          <h2>It’s <i>live.</i></h2>
          <p>{paidLine}</p>
          <div className="lv-phone">
            <iframe title="" src={guestPath(link)} tabIndex={-1} />
          </div>
          <div className="lv-link">
            <span>{pretty}</span>
            <button type="button" onClick={() => { void copy(link); }}>{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
        <footer className="lv-foot">
          <button type="button" className="lv-go gold" onClick={() => setStep("share")}>
            <span>Share on WhatsApp</span><b><ArrowIcon /></b>
          </button>
          <Link to="/studio" className="lv-go line" onClick={onClose}>
            <span>Open my dashboard</span><b><ShareIcon /></b>
          </Link>
        </footer>
        {copied ? <div className="lv-toast">Link copied</div> : null}
      </div>
    </div>
  );
}
