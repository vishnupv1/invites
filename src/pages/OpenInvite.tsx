import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { AnnaInvite } from "../components/AnnaInvite";
import { Baptism2Invite } from "../components/Baptism2Invite";
import { BeachInvite } from "../components/BeachInvite";
import { BotanicaInvite } from "../components/BotanicaInvite";
import { GrandDoorInvite } from "../components/GrandDoorInvite";
import { GrandEnvelopeInvite } from "../components/GrandEnvelopeInvite";
import { HeavenlyInvite } from "../components/HeavenlyInvite";
import { PullInvite } from "../components/PullInvite";
import { InlandInvite } from "../components/InlandInvite";
import { HomeInvite } from "../components/HomeInvite";
import { VivahInvite } from "../components/VivahInvite";
import { AureliaInvite } from "../components/AureliaInvite";
import { GazalInvite } from "../components/GazalInvite";
import { ThiruvizhaInvite } from "../components/ThiruvizhaInvite";
import { PastalInvite } from "../components/PastalInvite";
import { PalaceInvite } from "../components/PalaceInvite";
import { MoonlitInvite } from "../components/MoonlitInvite";
import { VillaInvite } from "../components/VillaInvite";
import { HansaInvite } from "../components/HansaInvite";
import { BloomInvite } from "../components/BloomInvite";
import { LaceInvite } from "../components/LaceInvite";
import { GoaInvite } from "../components/GoaInvite";
import { LotusInvite } from "../components/LotusInvite";
import { RoseInvite } from "../components/RoseInvite";
import { FirstDanceInvite } from "../components/FirstDanceInvite";
import { SatinBowInvite } from "../components/SatinBowInvite";
import { TempleBellsInvite } from "../components/TempleBellsInvite";
import { JournalInvite } from "../components/JournalInvite";
import { PeacockInvite } from "../components/PeacockInvite";
import { BackwaterInvite } from "../components/BackwaterInvite";
import { BlockbusterInvite } from "../components/BlockbusterInvite";
import { WeddingRideInvite } from "../components/WeddingRideInvite";
import { StarryFairytaleInvite } from "../components/StarryFairytaleInvite";
import { PeaceInvite } from "../components/PeaceInvite";
import { getTemplate, sampleFor } from "../data/templates";
import { trackTemplatePreview } from "../lib/analytics";
import "./open-invite.css";

export function OpenInvite() {
  const { id } = useParams();
  const template = getTemplate(id);
  useEffect(() => {
    if (template) trackTemplatePreview(template);
  }, [template]);
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
      {template.style === "baptism2" ? <Baptism2Invite fields={fields} demo /> : null}
      {template.style === "vivah" ? <VivahInvite fields={fields} demo /> : null}
      {template.style === "beach" ? <BeachInvite fields={fields} /> : null}
      {template.style === "botanica" ? <BotanicaInvite fields={fields} /> : null}
      {template.style === "heavenly" ? <HeavenlyInvite fields={fields} demo /> : null}
      {template.style === "grandoor" ? <GrandDoorInvite fields={fields} demo /> : null}
      {template.style === "grandenvelope" ? <GrandEnvelopeInvite fields={fields} demo autoPlay /> : null}
      {template.style === "pull" ? <PullInvite fields={fields} demo /> : null}
      {template.style === "inland" ? <InlandInvite fields={fields} demo autoOpen /> : null}
      {template.style === "home" ? <HomeInvite fields={fields} demo /> : null}
      {template.style === "thiruvizha" ? <ThiruvizhaInvite fields={fields} /> : null}
      {template.style === "peace" ? <PeaceInvite fields={fields} demo /> : null}
      {template.style === "pastal" ? <PastalInvite fields={fields} /> : null}
      {template.style === "palace" ? <PalaceInvite fields={fields} /> : null}
      {template.style === "moonlit" ? <MoonlitInvite fields={fields} /> : null}
      {template.style === "villa" ? <VillaInvite fields={fields} /> : null}
      {template.style === "hansa" ? <HansaInvite fields={fields} /> : null}
      {template.style === "bloom" ? <BloomInvite fields={fields} /> : null}
      {template.style === "lace" ? <LaceInvite fields={fields} /> : null}
      {template.style === "goa" ? <GoaInvite fields={fields} /> : null}
      {template.style === "lotus" ? <LotusInvite fields={fields} /> : null}
      {template.style === "rose" ? <RoseInvite fields={fields} /> : null}
      {template.style === "firstdance" ? <FirstDanceInvite fields={fields} /> : null}
      {template.style === "satinbow" ? <SatinBowInvite fields={fields} /> : null}
      {template.style === "templebells" ? <TempleBellsInvite fields={fields} /> : null}
      {template.style === "journal" ? <JournalInvite fields={fields} /> : null}
      {template.style === "peacock" ? <PeacockInvite fields={fields} /> : null}
      {template.style === "blockbuster" ? <BlockbusterInvite fields={fields} /> : null}
      {template.style === "backwater" ? <BackwaterInvite fields={fields} /> : null}
      {template.style === "weddingride" ? <WeddingRideInvite fields={fields} /> : null}
      {template.style === "starryfairytale" ? <StarryFairytaleInvite fields={fields} /> : null}
    </div>
  );
}
