import { useEffect, useRef, useState, type ReactNode } from "react";

const STAGE_WIDTH = 390;

type Props = {
  children: ReactNode;
  label: string;
  radius?: number;
  /** When false, the embedded invite cannot be tabbed or clicked. Full-screen preview turns this on. */
  interactive?: boolean;
};

export function TemplatePreview({ children, label, radius = 28, interactive = false }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setScale(element.clientWidth / STAGE_WIDTH || 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frame} className="ir-preview" style={{ borderRadius: radius }} role="img" aria-label={label}>
      <div
        className="ir-preview-stage"
        style={{ transform: `scale(${scale})` }}
        inert={interactive ? undefined : true}
        aria-hidden={interactive ? undefined : true}
      >
        {children}
      </div>
    </div>
  );
}
