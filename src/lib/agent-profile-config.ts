/** Build / parse AgentProfile.config_json from form fields (mirrors backend). */

export type AgentKind =
  | "llm_prompt"
  | "hermes_openai"
  | "openclaw_stream"
  | "openclaw_realtime";

const COMMON_FIELDS: [string, string][] = [
  ["cfg_system_prompt", "system_prompt"],
  ["cfg_opening_script", "opening_script"],
];

const LLM_FIELDS: [string, string][] = [
  ["cfg_model", "model"],
  ["cfg_base_url", "base_url"],
  ["cfg_api_key", "api_key"],
  ["cfg_temperature", "temperature"],
  ["cfg_max_tokens", "max_tokens"],
  ["cfg_history_turns", "history_turns"],
  ["cfg_use_rag", "use_rag"],
];

const OPENCLAW_FIELDS: [string, string][] = [
  ["cfg_twiml_url", "twiml_url"],
  ["cfg_stream_url", "stream_url"],
  ["cfg_call_mode", "call_mode"],
];

export function fieldsForKind(kind: string): [string, string][] {
  if (kind.startsWith("openclaw")) {
    return [...COMMON_FIELDS, ...OPENCLAW_FIELDS];
  }
  return [...COMMON_FIELDS, ...LLM_FIELDS];
}

export function configFromForm(
  form: Record<string, string | boolean | undefined>,
  kind: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [formKey, cfgKey] of fieldsForKind(kind)) {
    const raw = form[formKey];
    if (raw === undefined) continue;
    if (cfgKey === "use_rag") {
      out[cfgKey] = raw === true || raw === "on" || raw === "true" || raw === "1";
      continue;
    }
    if (cfgKey === "temperature") {
      const s = String(raw).trim();
      if (s) out[cfgKey] = parseFloat(s);
      continue;
    }
    if (cfgKey === "max_tokens" || cfgKey === "history_turns") {
      const s = String(raw).trim();
      if (s) out[cfgKey] = parseInt(s, 10);
      continue;
    }
    const s = String(raw).trim();
    if (s) out[cfgKey] = s;
  }
  return out;
}

export function configToForm(
  config: Record<string, unknown> | undefined,
  kind: string,
): Record<string, string> {
  const cfg = config ?? {};
  const out: Record<string, string> = {};
  for (const [formKey, cfgKey] of fieldsForKind(kind)) {
    const val = cfg[cfgKey];
    if (val === undefined || val === null) {
      out[formKey] = "";
    } else if (typeof val === "boolean") {
      out[formKey] = val ? "on" : "";
    } else {
      out[formKey] = String(val);
    }
  }
  return out;
}

export function configPreviewText(
  config: Record<string, unknown> | undefined,
  maxLen = 80,
): string {
  const cfg = config ?? {};
  const sp = String(cfg.system_prompt ?? "").trim();
  const op = String(cfg.opening_script ?? "").trim();
  const parts: string[] = [];
  if (sp) parts.push(sp.length > 40 ? `prompt:${sp.slice(0, 40)}…` : `prompt:${sp}`);
  if (op) parts.push(op.length > 24 ? `开场:${op.slice(0, 24)}…` : `开场:${op}`);
  if (!parts.length) {
    const s = JSON.stringify(cfg);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  }
  const text = parts.join(" | ");
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

export const USAGE_LABELS: Record<string, string> = {
  outbound: "外呼",
  inbound: "接听",
  both: "通用",
};

export function isOpenClawKind(kind: string): boolean {
  return kind.startsWith("openclaw");
}
