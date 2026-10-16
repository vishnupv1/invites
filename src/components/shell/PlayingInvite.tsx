import { useEffect, useRef, useState } from "react";
import type { Template } from "../../types";

const PHONE_WIDTH = 390;

export function PlayingInvite({ template }: { template: Template }) {
  const root = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setScale(node.clientWidth / PHONE_WIDTH || 0);
      setSeen(rect.width > 0 && rect.bottom > -120 && rect.top < window.innerHeight + 120);
    };
    update();
    const targets: EventTarget[] = [window];
    let parent = node.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY)) targets.push(parent);
      parent = parent.parentElement;
    }
    targets.forEach((target) => target.addEventListener("scroll", update, { passive: true }));
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
      targets.forEach((target) => target.removeEventListener("scroll", update));
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={root} className="ir-play" aria-hidden="true">
      {seen && scale > 0 ? (
        <iframe
          title=""
          src={`/embed/${template.id}`}
          tabIndex={-1}
          style={{ transform: `scale(${scale})` }}
        />
      ) : (
        <img src={`/covers/${template.id}.webp`} alt="" />
      )}
    </div>
  );
}
