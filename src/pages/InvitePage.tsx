import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicInvite, sendGreeting } from "../api";
import { InviteSite } from "../components/InviteSite";
import { getTemplate } from "../data/templates";
import { decodeInvite } from "../lib/codec";
import type { InviteFields, Template } from "../types";

export function InvitePage() {
  const { code = "" } = useParams();
  const legacy = useMemo(() => decodeInvite(code), [code]);
  const [loaded, setLoaded] = useState<{ template: Template; fields: InviteFields; greetings: { name: string; note: string }[] } | null>(
    legacy && getTemplate(legacy.t) ? { template: getTemplate(legacy.t)!, fields: legacy.f, greetings: [] } : null,
  );
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (legacy) return;
    getPublicInvite(code)
      .then((invite) => {
        const template = getTemplate(invite.templateId);
        if (!template) setMissing(true);
        else setLoaded({ template, fields: invite.fields, greetings: invite.greetings ?? [] });
      })
      .catch(() => setMissing(true));
  }, [code, legacy]);

  if (missing || (!legacy && !loaded)) {
    if (!loaded && !missing) return <main className="public missing">Opening the invitation…</main>;
    return (
      <main className="public missing">
        <h1>This invitation link is incomplete.</h1>
        <Link to="/">Back to Vellum</Link>
      </main>
    );
  }

  if (!loaded) return <main className="public missing">Opening the invitation…</main>;

  return (
    <InviteSite
      template={loaded.template}
      fields={loaded.fields}
      wishes={loaded.greetings}
      onReply={legacy ? undefined : (reply) => sendGreeting(code, reply)}
    />
  );
}
