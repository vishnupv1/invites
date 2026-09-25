import { Link, Navigate, useParams } from "react-router-dom";
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
    </div>
  );
}
