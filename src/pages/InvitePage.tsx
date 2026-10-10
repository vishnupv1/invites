import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicInvite, sendGreeting } from "../api";
import { GuestCta } from "../components/GuestCta";
import { InviteSite } from "../components/InviteSite";
import { Spinner } from "../components/Loader";
import { getTemplate } from "../data/templates";
import { trackRsvpSubmit } from "../lib/analytics";
import { decodeInvite } from "../lib/codec";
import type { InviteFields, Template } from "../types";

export function InvitePage() {
  const { code = "" } = useParams();
  const legacy = useMemo(() => decodeInvite(code), [code]);
  const [loaded, setLoaded] = useState<{ template: Template; fields: InviteFields; swatch: string; greetings: { name: string; note: string; attending?: boolean }[] } | null>(
    legacy && getTemplate(legacy.t) ? { template: getTemplate(legacy.t)!, fields: legacy.f, swatch: "", greetings: [] } : null,
  );
  const [missing, setMissing] = useState<"incomplete" | "missing" | "failed" | null>(code.length < 4 ? "incomplete" : null);

  useEffect(() => {
    if (loaded?.fields.names) document.title = `${loaded.fields.names} | InvitesReady`;
  }, [loaded]);

  useEffect(() => {
    if (legacy || code.length < 4) return;
    getPublicInvite(code)
      .then((invite) => {
        const template = getTemplate(invite.templateId);
        if (!template) setMissing("missing");
        else setLoaded({ template, fields: invite.fields, swatch: invite.swatch ?? "", greetings: invite.greetings ?? [] });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "";
        setMissing(message === "Invitation not found." ? "missing" : "failed");
      });
  }, [code, legacy]);

  if (missing || (!legacy && !loaded)) {
    if (!loaded && !missing) return <main className="public missing" aria-busy="true"><p className="wait-line"><Spinner size="md" /> Opening the invitation…</p></main>;
    const heading = missing === "incomplete"
      ? "This invitation link is incomplete."
      : missing === "failed"
        ? "We couldn’t open that invitation."
        : "We couldn’t find that invitation.";
    return (
      <main className="public missing">
        <h1>{heading}</h1>
        <p>{missing === "missing" ? "Check the link, or ask the host to send it again." : "Check the link and try again."}</p>
        <Link to="/">Back to invitesready</Link>
      </main>
    );
  }

  if (!loaded) return <main className="public missing" aria-busy="true"><p className="wait-line"><Spinner size="md" /> Opening the invitation…</p></main>;

  return (
    <div className="guest-page">
      <InviteSite
        template={loaded.template}
        fields={loaded.fields}
        swatch={loaded.swatch}
        wishes={loaded.greetings}
        onReply={legacy ? undefined : async (reply) => {
          await sendGreeting(code, reply);
          trackRsvpSubmit(reply.attending ? "yes" : "no", loaded.template);
        }}
      />
      <GuestCta templateName={loaded.template.name} templateId={loaded.template.id} />
    </div>
  );
}
