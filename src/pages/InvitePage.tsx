import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicInvite, sendGreeting } from "../api";
import { InviteSite } from "../components/InviteSite";
import { Spinner } from "../components/Loader";
import { getTemplate } from "../data/templates";
import { decodeInvite } from "../lib/codec";
import type { InviteFields, Template } from "../types";

export function InvitePage() {
  const { code = "" } = useParams();
  const legacy = useMemo(() => decodeInvite(code), [code]);
  const [loaded, setLoaded] = useState<{ template: Template; fields: InviteFields; swatch: string; greetings: { name: string; note: string }[] } | null>(
    legacy && getTemplate(legacy.t) ? { template: getTemplate(legacy.t)!, fields: legacy.f, swatch: "", greetings: [] } : null,
  );
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (legacy) return;
    getPublicInvite(code)
      .then((invite) => {
        const template = getTemplate(invite.templateId);
        if (!template) setMissing(true);
        else setLoaded({ template, fields: invite.fields, swatch: invite.swatch ?? "", greetings: invite.greetings ?? [] });
      })
      .catch(() => setMissing(true));
  }, [code, legacy]);

  if (missing || (!legacy && !loaded)) {
    if (!loaded && !missing) return <main className="public missing" aria-busy="true"><p className="wait-line"><Spinner size="md" /> Opening the invitation…</p></main>;
    return (
      <main className="public missing">
        <h1>This invitation link is incomplete.</h1>
        <Link to="/">Back to invitesready</Link>
      </main>
    );
  }

  if (!loaded) return <main className="public missing" aria-busy="true"><p className="wait-line"><Spinner size="md" /> Opening the invitation…</p></main>;

  return (
    <InviteSite
      template={loaded.template}
      fields={loaded.fields}
      swatch={loaded.swatch}
      wishes={loaded.greetings}
      onReply={legacy ? undefined : (reply) => sendGreeting(code, reply)}
    />
  );
}
