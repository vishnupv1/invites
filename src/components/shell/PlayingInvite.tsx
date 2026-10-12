import { useEffect, useRef, useState } from "react";
import { InviteView } from "../InviteView";
import { sampleFor } from "../../data/templates";
import type { Template } from "../../types";
import { TemplatePreview } from "./TemplatePreview";

const OPENER = /^(break the seal|open invitation|open the invitation|tear open|untie the ribbon|light the lantern|pull the rope|open the doors|enter the invitation|lift the veil|open the door|open your gift|reveal the date|tap the bottle)/i;

function controlName(button: HTMLButtonElement) {
  return (button.getAttribute("aria-label") || button.textContent || "").replace(/\s+/g, " ").trim();
}

export function PlayingInvite({ template }: { template: Template }) {
  const root = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [take, setTake] = useState(0);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
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
    const observer = new IntersectionObserver(update, { rootMargin: "120px", threshold: 0 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      targets.forEach((target) => target.removeEventListener("scroll", update));
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (!seen) return;
    const node = root.current;
    if (!node) return;
    let play = 0;
    let again = 0;
    let tries = 0;
    const attempt = () => {
      node.querySelectorAll<HTMLElement>("button, a, input, textarea").forEach((control) => {
        control.tabIndex = -1;
      });
      const opener = [...node.querySelectorAll("button")].find((button) => OPENER.test(controlName(button)));
      if (!opener && tries < 30) {
        tries += 1;
        play = window.setTimeout(attempt, 40);
        return;
      }
      opener?.click();
      again = window.setTimeout(() => setTake((value) => value + 1), 4500);
    };
    play = window.setTimeout(attempt, 80);
    return () => {
      window.clearTimeout(play);
      window.clearTimeout(again);
    };
  }, [seen, take, template.id]);

  return (
    <div
      ref={root}
      className="ir-play"
      aria-hidden="true"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {seen ? (
        <TemplatePreview label="" radius={0} interactive fit="contain">
          <InviteView key={take} template={template} fields={sampleFor(template, template.events[0])} live />
        </TemplatePreview>
      ) : (
        <img src={`/covers/${template.id}.jpg`} alt="" />
      )}
    </div>
  );
}
