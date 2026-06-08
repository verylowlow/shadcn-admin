
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ncc/page-header";
import { ErrorState, LoadingState } from "@/components/ncc/loading-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ApiError } from "@/lib/api-client";
import { useInboundSettings, useSaveInboundSettings } from "@/lib/queries";
import type { InboundSettings } from "@/types/api";

export default function InboundSettingsPage() {
  const { data, isLoading, error, refetch } = useInboundSettings();
  const saveMutation = useSaveInboundSettings();
  const [form, setForm] = useState<InboundSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const patch = (p: Partial<InboundSettings>) =>
    setForm((f) => (f ? { ...f, ...p } : f));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      const res = await saveMutation.mutateAsync({
        inbound_auto_answer: form.inbound_auto_answer,
        inbound_policy: form.inbound_policy,
        inbound_allowlist_contact_only: form.inbound_allowlist_contact_only,
        inbound_default_agent_profile_alias:
          form.inbound_default_agent_profile_alias,
        inbound_opening_script: form.inbound_opening_script,
        inbound_default_system_prompt: form.inbound_default_system_prompt,
        inbound_voice_url: form.inbound_voice_url,
        inbound_status_callback_url: form.inbound_status_callback_url,
      });
      toast.success(res.message || "接听设置已保存");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "保存失败");
    }
  }

  if (isLoading && !form) {
    return <LoadingState message="加载接听设置…" />;
  }
  if (error && !form) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "加载失败"}
        onRetry={() => refetch()}
      />
    );
  }
  if (!form) return null;

  const profileOptions = form.profile_options ?? data?.profile_options ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="接听设置"
        description="写入 data/admin_settings.json，与环境变量合并；环境变量优先。"
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>接听策略</CardTitle>
            <CardDescription>控制是否自动接听及来电白名单</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>自动接听</Label>
                <p className="text-xs text-muted-foreground">
                  NEWCALLCALL_INBOUND_AUTO_ANSWER
                </p>
              </div>
              <Switch
                checked={form.inbound_auto_answer}
                onCheckedChange={(v) => patch({ inbound_auto_answer: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>来电策略</Label>
              <Select
                value={form.inbound_policy}
                onValueChange={(v) =>
                  v && patch({ inbound_policy: v as InboundSettings["inbound_policy"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">disabled — 全部拒接</SelectItem>
                  <SelectItem value="allowlist">allowlist — 白名单</SelectItem>
                  <SelectItem value="open">open — 任意号码</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label>仅通讯录可接入（allowlist 模式）</Label>
                <p className="text-xs text-muted-foreground">
                  关闭时 allowlist 等同开放接入
                </p>
              </div>
              <Switch
                checked={form.inbound_allowlist_contact_only}
                onCheckedChange={(v) =>
                  patch({ inbound_allowlist_contact_only: v })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>默认 Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>默认接听 Profile（别名）</Label>
            <Select
              value={form.inbound_default_agent_profile_alias || "__none__"}
              onValueChange={(v) =>
                patch({
                  inbound_default_agent_profile_alias:
                    !v || v === "__none__" ? "" : v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择 Profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  （无 — 使用硬编码 llm_prompt）
                </SelectItem>
                {profileOptions.map((p) => (
                  <SelectItem key={p.alias} value={p.alias}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>话术默认值</CardTitle>
            <CardDescription>
              Profile 未配置时生效；有 Profile 时 Profile 优先
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>默认 System Prompt</Label>
              <Textarea
                rows={6}
                value={form.inbound_default_system_prompt}
                onChange={(e) =>
                  patch({ inbound_default_system_prompt: e.target.value })
                }
                placeholder="留空则使用系统设置中的默认 System Prompt"
              />
            </div>
            <div className="space-y-2">
              <Label>默认开场白</Label>
              <Textarea
                rows={3}
                value={form.inbound_opening_script}
                onChange={(e) =>
                  patch({ inbound_opening_script: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook（可选）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>来电 Voice URL</Label>
              <Input
                type="url"
                value={form.inbound_voice_url}
                onChange={(e) => patch({ inbound_voice_url: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                接通时 POST；若返回 TwiML Stream 则走 OpenClaw
              </p>
            </div>
            <div className="space-y-2">
              <Label>状态回调 URL</Label>
              <Input
                type="url"
                value={form.inbound_status_callback_url}
                onChange={(e) =>
                  patch({ inbound_status_callback_url: e.target.value })
                }
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                事件：answered / completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          保存接听设置
        </Button>
      </form>
    </div>
  );
}
