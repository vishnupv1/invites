import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { InviteView } from "../components/InviteView";
import { getTemplate, sampleFor } from "../data/templates";

/** A phone-sized document. Viewport units inside match a 390×844 phone, same as the editor’s mobile preview. */
export function EmbedInvite() {
  const { id } = useParams();
  const template = getTemplate(id);

  useEffect(() => {
    document.documentElement.classList.add("ir-embed");
    return () => document.documentElement.classList.remove("ir-embed");
  }, []);

  if (!template) return null;
  return <InviteView template={template} fields={sampleFor(template, template.events[0])} live />;
}
