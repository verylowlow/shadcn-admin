"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { isOpenClawKind } from "@/lib/agent-profile-config";

export type AgentProfileFormState = {
  name: string;
  alias: string;
  usage: string;
  kind: string;
  cfg_system_prompt: string;
  cfg_opening_script: string;
  cfg_model: string;
  cfg_base_url: string;
  cfg_api_key: string;
  cfg_temperature: string;
  cfg_max_tokens: string;
  cfg_history_turns: string;
  cfg_use_rag: boolean;
  cfg_twiml_url: string;
  cfg_stream_url: string;
  cfg_call_mode: string;
};

export function emptyAgentForm(kind = "llm_prompt"): AgentProfileFormState {
  return {
    name: "",
    alias: "",
    usage: "both",
    kind,
    cfg_system_prompt: "",
    cfg_opening_script: "",
    cfg_model: "",
    cfg_base_url: "",
    cfg_api_key: "",
    cfg_temperature: "",
    cfg_max_tokens: "",
    cfg_history_turns: "",
    cfg_use_rag: false,
    cfg_twiml_url: "",
    cfg_stream_url: "",
    cfg_call_mode: "",
  };
}

type Props = {
  form: AgentProfileFormState;
  kinds: string[];
  onChange: (next: AgentProfileFormState) => void;
};

export function AgentProfileFormFields({ form, kinds, onChange }: Props) {
  const set = (patch: Partial<AgentProfileFormState>) =>
    onChange({ ...form, ...patch });
  const openclaw = isOpenClawKind(form.kind);

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label htmlFor="agent-name">显示名称</Label>
        <Input
          id="agent-name"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="agent-alias">别名（唯一，下拉与设置中使用）</Label>
        <Input
          id="agent-alias"
          value={form.alias}
          onChange={(e) => set({ alias: e.target.value })}
          required
          placeholder="例如 inbound_cs"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>业务用途</Label>
          <Select
            value={form.usage}
            onValueChange={(v) => v && set({ usage: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outbound">外呼</SelectItem>
              <SelectItem value="inbound">接听</SelectItem>
              <SelectItem value="both">通用</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Agent 类型 (kind)</Label>
          <Select
            value={form.kind}
            onValueChange={(v) => v && set({ kind: v })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              {kinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>System Prompt</Label>
        <Textarea
          value={form.cfg_system_prompt}
          onChange={(e) => set({ cfg_system_prompt: e.target.value })}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>开场白</Label>
        <Textarea
          value={form.cfg_opening_script}
          onChange={(e) => set({ cfg_opening_script: e.target.value })}
          rows={2}
        />
      </div>
      {!openclaw && (
        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm font-medium">LLM / Hermes</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>模型</Label>
              <Input
                value={form.cfg_model}
                onChange={(e) => set({ cfg_model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>温度</Label>
              <Input
                type="number"
                step="0.1"
                value={form.cfg_temperature}
                onChange={(e) => set({ cfg_temperature: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input
              value={form.cfg_base_url}
              onChange={(e) => set({ cfg_base_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={form.cfg_api_key}
              onChange={(e) => set({ cfg_api_key: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.cfg_use_rag}
              onCheckedChange={(v) => set({ cfg_use_rag: v })}
            />
            <Label>启用 RAG</Label>
          </div>
        </div>
      )}
      {openclaw && (
        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm font-medium">OpenClaw</p>
          <div className="space-y-2">
            <Label>TwiML / Webhook URL</Label>
            <Input
              type="url"
              value={form.cfg_twiml_url}
              onChange={(e) => set({ cfg_twiml_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Stream URL（可选）</Label>
            <Input
              type="url"
              value={form.cfg_stream_url}
              onChange={(e) => set({ cfg_stream_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Call mode</Label>
            <Select
              value={form.cfg_call_mode || "__default__"}
              onValueChange={(v) =>
                set({ cfg_call_mode: !v || v === "__default__" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">（默认）</SelectItem>
                <SelectItem value="conversation">conversation</SelectItem>
                <SelectItem value="notify">notify</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
