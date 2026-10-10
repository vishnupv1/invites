import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "./marks";

type Variant = "primary" | "marigold" | "whatsapp" | "outline";

type Props = {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ children, variant = "primary", href, type = "button", onClick, disabled }: Props) {
  const className = `ir-btn ir-btn-${variant}`;
  const inner = (
    <>
      <span className="ir-btn-label">{children}</span>
      <span className="ir-btn-tile" aria-hidden="true">
        <ArrowIcon />
      </span>
    </>
  );
  if (href && !disabled) {
    if (href.startsWith("/")) {
      return (
        <Link className={className} to={href} onClick={onClick}>
          {inner}
        </Link>
      );
    }
    return (
      <a className={className} href={href} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button className={className} type={type} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}
