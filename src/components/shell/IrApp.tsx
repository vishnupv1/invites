import type { ReactNode } from "react";
import "../../styles/tokens.css";
import "./shell.css";

export function IrApp({ children }: { children: ReactNode }) {
  return <div className="ir-app">{children}</div>;
}
