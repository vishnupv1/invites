import { useEffect, useRef, type ReactNode } from "react";
import "../../styles/tokens.css";
import "./shell.css";

export function IrApp({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const items = [...node.querySelectorAll<HTMLElement>(".ir-reveal")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((item) => item.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { root: null, threshold: 0.18 });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return <div className="ir-app" ref={root}>{children}</div>;
}
