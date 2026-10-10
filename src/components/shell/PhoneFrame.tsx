import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  label?: string;
};

export function PhoneFrame({ children, label = "Phone preview" }: Props) {
  return (
    <div className="ir-phone" aria-label={label}>
      <div className="ir-phone-screen">{children}</div>
    </div>
  );
}
