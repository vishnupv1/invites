export function claimCallback(gate: { taken: boolean }) {
  if (gate.taken) return false;
  gate.taken = true;
  return true;
}

export function safeErrorCode(raw: unknown) {
  if (typeof raw !== "string") return undefined;
  const code = raw.trim().slice(0, 40);
  if (!/^[A-Za-z0-9_.:-]{1,40}$/.test(code)) return undefined;
  return code;
}

export function saveDraftEvent(input: {
  reachedServer: boolean;
  ok: boolean;
  inviteId?: string;
  templateId?: string;
  status?: string;
}) {
  if (!input.reachedServer || !input.ok || !input.inviteId || !input.templateId) return null;
  if (input.status === "live") return null;
  return {
    name: "save_draft" as const,
    key: input.inviteId,
    params: { template_id: input.templateId },
  };
}

export function outcomeEvent(
  outcome: "cancelled" | "failed" | "purchase_recorded" | "purchase_rejected",
  facts: { templateId: string; value: number; currency: string; errorCode?: string },
) {
  const base = {
    template_id: facts.templateId,
    value: facts.value,
    currency: facts.currency,
  };
  if (outcome === "cancelled") return { name: "payment_cancelled" as const, params: base };
  if (outcome === "failed") {
    const errorCode = safeErrorCode(facts.errorCode);
    return {
      name: "payment_failed" as const,
      params: errorCode ? { ...base, error_code: errorCode } : base,
    };
  }
  if (outcome === "purchase_recorded") return { name: "purchase" as const, params: base };
  return null;
}

export function rememberOnce(seen: Set<string>, name: string, key: string) {
  const id = `${name}:${key}`;
  if (seen.has(id)) return false;
  seen.add(id);
  return true;
}
