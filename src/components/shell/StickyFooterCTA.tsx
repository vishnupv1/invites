import type { ReactNode } from "react";
import { PrimaryButton } from "./PrimaryButton";

type Props = {
  label: string;
  href?: string;
  onClick?: () => void;
  note?: ReactNode;
  variant?: "primary" | "marigold" | "whatsapp" | "outline";
};

export function StickyFooterCTA({ label, href, onClick, note, variant = "primary" }: Props) {
  return (
    <div className="ir-sticky">
      <PrimaryButton variant={variant} href={href} onClick={onClick}>
        {label}
      </PrimaryButton>
      {note ? <p className="ir-sticky-note">{note}</p> : null}
    </div>
  );
}
