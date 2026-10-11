import { Link } from "react-router-dom";
import "./logo.css";

type Props = {
  to?: string;
  tone?: "ink" | "cream";
  linked?: boolean;
  className?: string;
};

export function Logo({ to = "/", tone = "ink", linked = true, className = "" }: Props) {
  const name = `ir-logo${tone === "cream" ? " is-cream" : ""}${className ? ` ${className}` : ""}`;
  const label = "InvitesReady";
  const word = tone === "cream" ? "/brand/logo-wordmark-light.png" : "/brand/logo-wordmark.png";
  const inner = (
    <>
      <img className="ir-logo-mark" src="/brand/logo-mark.png" alt="" />
      <img className="ir-logo-name" src={word} alt="InvitesReady" />
    </>
  );
  if (!linked) return <span className={name} aria-label={label}>{inner}</span>;
  return (
    <Link className={name} to={to} aria-label={label}>
      {inner}
    </Link>
  );
}
