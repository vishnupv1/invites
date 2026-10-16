import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { sendFeedback } from "../api";
import { SiteFooter } from "../components/SiteFooter";
import { DesktopNav } from "../components/shell/DesktopNav";
import { IrApp } from "../components/shell/IrApp";
import { PrimaryButton } from "../components/shell/PrimaryButton";
import { useSession } from "../session";
import "./feedback.css";

const RATINGS = [
  { value: 1, label: "Not for me" },
  { value: 2, label: "Could be better" },
  { value: 3, label: "It was fine" },
  { value: 4, label: "Really good" },
  { value: 5, label: "Loved it" },
] as const;

const TOPICS = [
  { id: "designs", label: "Designs" },
  { id: "editor", label: "Editor" },
  { id: "sharing", label: "Sharing" },
  { id: "replies", label: "Replies" },
  { id: "payments", label: "Payments" },
  { id: "other", label: "Something else" },
] as const;

type TopicId = (typeof TOPICS)[number]["id"];

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function Feedback() {
  const { host, signedIn } = useSession();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [topic, setTopic] = useState<TopicId | "">("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const stars = useRef<(HTMLButtonElement | null)[]>([]);
  const thanksRef = useRef<HTMLHeadingElement>(null);
  const noteId = useId();
  const shown = hover || rating;
  const caption = shown ? RATINGS[shown - 1].label : "Choose a star";

  useEffect(() => {
    setName((current) => current || host?.name || "");
    setEmail((current) => current || host?.email || "");
  }, [host?.name, host?.email]);

  useEffect(() => {
    if (sent) thanksRef.current?.focus();
  }, [sent]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    if (!rating) {
      setError("Choose a star.");
      stars.current[0]?.focus();
      return;
    }
    const nextEmail = email.trim();
    if (nextEmail && !looksLikeEmail(nextEmail)) {
      setError("Check the email address.");
      return;
    }
    if (message.trim().length > 1000) {
      setError("Keep the note under 1,000 characters.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await sendFeedback({
        rating,
        topic: topic || "general",
        message: message.trim(),
        name: name.trim(),
        email: nextEmail,
      });
      setSent(true);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "";
      if (reason instanceof TypeError || message === "Request failed.") {
        setError("Could not reach InvitesReady. Check your connection and try again.");
      } else {
        setError(message || "Could not send that. Try again.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <IrApp>
      <div className="fb-page">
        <DesktopNav />
        <main className="fb">
          {sent ? (
            <section className="fb-card ir-rise">
              <p className="ir-overline">Received</p>
              <h1 className="ir-display" tabIndex={-1} ref={thanksRef}>Thank you</h1>
              <p className="fb-lede">Your {rating}-star note is with us. It helps the next invitation feel better.</p>
              <PrimaryButton href={signedIn ? "/studio" : "/"}>{signedIn ? "Back to your invitations" : "Back home"}</PrimaryButton>
            </section>
          ) : (
            <form className="fb-card ir-rise" onSubmit={(event) => { void submit(event); }}>
              <p className="ir-overline">A note for us</p>
              <h1 className="ir-display">How did InvitesReady do?</h1>
              <p className="fb-lede">Rate the experience, then tell us what to keep or change. One sentence is enough.</p>

              <fieldset className="fb-stars">
                <legend className="ir-overline">Your rating</legend>
                <div
                  className="fb-star-row"
                  role="radiogroup"
                  aria-label="Your rating"
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                    event.preventDefault();
                    const delta = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1;
                    const next = rating === 0 ? (delta > 0 ? 1 : 5) : Math.min(5, Math.max(1, rating + delta));
                    setRating(next);
                    setError("");
                    stars.current[next - 1]?.focus();
                  }}
                >
                  {RATINGS.map((item) => {
                    const on = item.value <= shown;
                    const selected = rating === item.value;
                    return (
                      <button
                        key={item.value}
                        ref={(node) => {
                          stars.current[item.value - 1] = node;
                        }}
                        type="button"
                        role="radio"
                        className={on ? "fb-star is-on" : "fb-star"}
                        aria-checked={selected}
                        aria-label={`${item.value} ${item.value === 1 ? "star" : "stars"}, ${item.label}`}
                        tabIndex={selected || (rating === 0 && item.value === 1) ? 0 : -1}
                        onClick={() => {
                          setRating(item.value);
                          setError("");
                        }}
                        onPointerEnter={(event) => {
                          if (event.pointerType === "mouse") setHover(item.value);
                        }}
                        onPointerLeave={() => setHover(0)}
                      >
                        <Star size={34} strokeWidth={1.6} fill={on ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                <p className="fb-caption" aria-live="polite">{caption}</p>
              </fieldset>

              <fieldset className="fb-topics">
                <legend className="ir-overline">What is this about?</legend>
                <div>
                  {TOPICS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={topic === item.id ? "is-on" : ""}
                      aria-pressed={topic === item.id}
                      onClick={() => setTopic((current) => (current === item.id ? "" : item.id))}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="fb-note" htmlFor={noteId}>
                <span className="ir-overline">Your note</span>
                <textarea
                  id={noteId}
                  value={message}
                  maxLength={1000}
                  placeholder="The editor, a design, a reply that got stuck…"
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>

              <div className="fb-who">
                <label>
                  <span className="ir-overline">Name</span>
                  <input value={name} autoComplete="name" maxLength={120} onChange={(event) => setName(event.target.value)} />
                </label>
                <label>
                  <span className="ir-overline">Email</span>
                  <input type="email" value={email} autoComplete="email" maxLength={200} onChange={(event) => setEmail(event.target.value)} />
                </label>
              </div>

              {error ? <p className="fb-error" role="alert">{error}</p> : null}
              <PrimaryButton type="submit" disabled={sending}>{sending ? "Sending…" : "Send feedback"}</PrimaryButton>
            </form>
          )}
        </main>
        <SiteFooter variant="legal" />
      </div>
    </IrApp>
  );
}
