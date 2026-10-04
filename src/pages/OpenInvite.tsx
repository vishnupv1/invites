import { Link, Navigate, useParams } from "react-router-dom";
import { AnnaInvite } from "../components/AnnaInvite";
import { BaptismInvite } from "../components/BaptismInvite";
import { BeachInvite } from "../components/BeachInvite";
import { BotanicaInvite } from "../components/BotanicaInvite";
import { HeavenlyInvite } from "../components/HeavenlyInvite";
import { PullInvite } from "../components/PullInvite";
import { InlandInvite } from "../components/InlandInvite";
import { HomeInvite } from "../components/HomeInvite";
import { VivahInvite } from "../components/VivahInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { GazalInvite } from "../components/GazalInvite";
import { ThiruvizhaInvite } from "../components/ThiruvizhaInvite";
import { PeaceInvite } from "../components/PeaceInvite";
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
      {template.style === "baptism" ? <BaptismInvite fields={fields} demo /> : null}
      {template.style === "vivah" ? <VivahInvite fields={fields} demo /> : null}
      {template.style === "beach" ? <BeachInvite fields={fields} /> : null}
      {template.style === "botanica" ? <BotanicaInvite fields={fields} /> : null}
      {template.style === "heavenly" ? <HeavenlyInvite fields={fields} demo /> : null}
      {template.style === "pull" ? <PullInvite fields={fields} demo /> : null}
      {template.style === "inland" ? <InlandInvite fields={fields} demo /> : null}
      {template.style === "home" ? <HomeInvite fields={fields} demo /> : null}
      {template.style === "thiruvizha" ? <ThiruvizhaInvite fields={fields} /> : null}
      {template.style === "peace" ? <PeaceInvite fields={fields} demo /> : null}
    </div>
  );
}
