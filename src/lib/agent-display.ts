import type { AgentProfile } from "@/types/api";

export function agentProfileLabel(
  agents: AgentProfile[] | undefined,
  profileId: string | null | undefined,
): string {
  if (!profileId) return "—";
  const list = agents ?? [];
  const byId = list.find((a) => a.id === profileId);
  if (byId) {
    const alias = byId.alias || byId.name;
    return `${alias} (${byId.kind})`;
  }
  const byAlias = list.find((a) => (a.alias || a.name) === profileId);
  if (byAlias) {
    return `${byAlias.alias || byAlias.name} (${byAlias.kind})`;
  }
  return profileId;
}

export function filterAgentsByUsage(
  agents: AgentProfile[],
  usage: "outbound" | "inbound",
): AgentProfile[] {
  return agents.filter(
    (a) => !a.usage || a.usage === "both" || a.usage === usage,
  );
}
