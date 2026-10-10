import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BackIcon } from "./marks";

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backHref?: string;
  action?: ReactNode;
  tone?: "paper" | "emerald";
};

export function TopBar({ title, subtitle, onBack, backHref = "/", action, tone = "paper" }: Props) {
  const backClass = "ir-back";
  const back = backHref && !onBack ? (
    <Link className={backClass} to={backHref} aria-label="Back">
      <BackIcon />
    </Link>
  ) : (
    <button className={backClass} type="button" aria-label="Back" onClick={onBack}>
      <BackIcon />
    </button>
  );
  return (
    <header className={`ir-topbar${tone === "emerald" ? " is-emerald" : ""}`}>
      {back}
      <div className="ir-topbar-copy">
        <p className="ir-topbar-title ir-display">{title}</p>
        {subtitle ? <p className="ir-topbar-sub">{subtitle}</p> : null}
      </div>
      {action ? <div className="ir-topbar-action">{action}</div> : null}
    </header>
  );
}
