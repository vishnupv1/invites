import { useEffect, useRef, useState, type ReactNode } from "react";

const STAGE_WIDTH = 390;
const STAGE_HEIGHT = 844;

type Props = {
  children: ReactNode;
  label: string;
  radius?: number;
  /** When false, the embedded invite cannot be tabbed or clicked. Full-screen preview turns this on. */
  interactive?: boolean;
  /** "width" fills the frame width. "contain" fits the whole invitation without cropping or stretching. */
  fit?: "width" | "contain";
};

export function TemplatePreview({ children, label, radius = 28, interactive = false, fit = "width" }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      const widthScale = element.clientWidth / STAGE_WIDTH || 1;
      if (fit !== "contain") {
        setScale(widthScale);
        setOffset({ x: 0, y: 0 });
        return;
      }
      const next = Math.min(widthScale, element.clientHeight / STAGE_HEIGHT || widthScale);
      setScale(next);
      setOffset({
        x: (element.clientWidth - STAGE_WIDTH * next) / 2,
        y: (element.clientHeight - STAGE_HEIGHT * next) / 2,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit]);

  return (
    <div ref={frame} className="ir-preview" style={{ borderRadius: radius }} role="img" aria-label={label}>
      <div
        className="ir-preview-stage"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        inert={interactive ? undefined : true}
        aria-hidden={interactive ? undefined : true}
      >
        {children}
      </div>
    </div>
  );
}
