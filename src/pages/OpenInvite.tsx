import { Link, Navigate, useParams } from "react-router-dom";
import { AnnaInvite } from "../components/AnnaInvite";
import { BaptismInvite } from "../components/BaptismInvite";
import { VivahInvite } from "../components/VivahInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { GazalInvite } from "../components/GazalInvite";
import { getTemplate, sampleFor } from "../data/templates";
import "./open-invite.css";

export function OpenInvite() {
  const { id } = useParams();
  const template = getTemplate(id);
  if (!template) return <Navigate to="/" replace />;
  const fields = sampleFor(template, template.events[0]);

  return (
    <div className="open-invite">
      <Link className="open-home" to="/">
        Back to home
      </Link>
      {template.style === "gazal" ? <GazalInvite fields={fields} /> : null}
      {template.style === "aurelia" ? <AureliaInvite fields={fields} /> : null}
      {template.style === "anna" ? <AnnaInvite fields={fields} /> : null}
      {template.style === "baptism" ? <BaptismInvite fields={fields} /> : null}
      {template.style === "vivah" ? <VivahInvite fields={fields} /> : null}
    </div>
  );
}
