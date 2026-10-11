import { Logo } from "./shell/Logo";

export function Brand({ light = false, linked = true }: { light?: boolean; linked?: boolean }) {
  return <Logo tone={light ? "cream" : "ink"} linked={linked} />;
}
