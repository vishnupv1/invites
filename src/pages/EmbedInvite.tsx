import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { getTemplate, sampleFor } from "../data/templates";

const OPENER = /^(break the seal|open invitation|open the invitation|tear open|untie the ribbon|light the lantern|pull the rope|open the doors|enter the invitation|lift the veil|open the door|open your gift|reveal the date|tap the bottle)/i;

function controlName(button: HTMLButtonElement) {
  return (button.getAttribute("aria-label") || button.textContent || "").replace(/\s+/g, " ").trim();
}

/** A phone-sized document. Viewport units inside match a 390×844 phone, same as the editor’s mobile preview. */
export function EmbedInvite() {
  const { id } = useParams();
  const template = getTemplate(id);
  const root = useRef<HTMLDivElement>(null);
  const [take, setTake] = useState(0);

  useEffect(() => {
    document.documentElement.classList.add("ir-embed");
    return () => document.documentElement.classList.remove("ir-embed");
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || !template) return;
    let play = 0;
    let again = 0;
    let tries = 0;
    const attempt = () => {
      const opener = [...node.querySelectorAll("button")].find((button) => OPENER.test(controlName(button)));
      if (!opener && tries < 40) {
        tries += 1;
        play = window.setTimeout(attempt, 50);
        return;
      }
      opener?.click();
      again = window.setTimeout(() => setTake((value) => value + 1), 7000);
    };
    play = window.setTimeout(attempt, 400);
    return () => {
      window.clearTimeout(play);
      window.clearTimeout(again);
    };
  }, [take, template]);

  if (!template) return null;
  return (
    <div ref={root}>
      <InviteView key={take} template={template} fields={sampleFor(template, template.events[0])} live />
    </div>
  );
}
