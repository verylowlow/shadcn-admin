
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AgentProfileFormFields,
  emptyAgentForm,
  type AgentProfileFormState,
} from "@/components/ncc/agent-profile-form-fields";
import { ApiError } from "@/lib/api-client";
import {
  configFromForm,
  configPreviewText,
  configToForm,
  USAGE_LABELS,
} from "@/lib/agent-profile-config";
import {
  useAgentKinds,
  useAgents,
  useCreateAgent,
  useDeleteAgent,
  useUpdateAgent,
} from "@/lib/queries";
import type { AgentProfile } from "@/types/api";

function agentToForm(agent: AgentProfile): AgentProfileFormState {
  const kind = agent.kind || "llm_prompt";
  const cfg = configToForm(agent.config_json, kind);
  return {
    ...emptyAgentForm(kind),
    name: agent.name,
    alias: agent.alias || agent.name,
    usage: agent.usage || "both",
    kind,
    cfg_system_prompt: cfg.cfg_system_prompt ?? "",
    cfg_opening_script: cfg.cfg_opening_script ?? "",
    cfg_model: cfg.cfg_model ?? "",
    cfg_base_url: cfg.cfg_base_url ?? "",
    cfg_api_key: cfg.cfg_api_key ?? "",
    cfg_temperature: cfg.cfg_temperature ?? "",
    cfg_max_tokens: cfg.cfg_max_tokens ?? "",
    cfg_history_turns: cfg.cfg_history_turns ?? "",
    cfg_use_rag: cfg.cfg_use_rag === "on",
    cfg_twiml_url: cfg.cfg_twiml_url ?? "",
    cfg_stream_url: cfg.cfg_stream_url ?? "",
    cfg_call_mode: cfg.cfg_call_mode ?? "",
  };
}

function formToPayload(form: AgentProfileFormState) {
  const alias = form.alias.trim() || form.name.trim();
  return {
    name: form.name.trim(),
    alias,
    usage: form.usage as AgentProfile["usage"],
    kind: form.kind,
    config_json: configFromForm(
      {
        ...form,
        cfg_use_rag: form.cfg_use_rag,
      },
      form.kind,
    ),
  };
}

export default function AgentsPage() {
  const { data, isLoading, error } = useAgents();
  const { data: kindsData } = useAgentKinds();
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgentProfile | null>(null);
  const [form, setForm] = useState<AgentProfileFormState>(emptyAgentForm());
  const [deleteTarget, setDeleteTarget] = useState<AgentProfile | null>(null);

  const kinds = kindsData?.kinds ?? [];

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyAgentForm(kinds[0] ?? "llm_prompt"), kind: kinds[0] ?? "" });
    setDialogOpen(true);
  }

  function openEdit(agent: AgentProfile) {
    setEditing(agent);
    setForm(agentToForm(agent));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.kind) {
      toast.error("请填写名称和类型");
      return;
    }
    const alias = form.alias.trim() || form.name.trim();
    if (!alias) {
      toast.error("请填写别名");
      return;
    }

    const payload = formToPayload(form);

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: payload });
        toast.success("Agent Profile 已更新");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Agent Profile 已创建");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "保存失败");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("已删除");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "删除失败");
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent 管理</h1>
          <p className="text-sm text-muted-foreground">
            按外呼/接听区分用途；表单配置自动保存为 JSON，无需手写 config
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新建 Profile
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "加载失败"}
        </p>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>别名</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>用途</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>配置摘要</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  暂无 Agent Profile
                </TableCell>
              </TableRow>
            )}
            {data?.items?.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">
                  {agent.alias || agent.name}
                </TableCell>
                <TableCell>{agent.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {USAGE_LABELS[agent.usage] ?? agent.usage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{agent.kind}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                  {configPreviewText(agent.config_json)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(agent)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(agent)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "编辑 Agent Profile" : "新建 Agent Profile"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AgentProfileFormFields
              form={form}
              kinds={kinds}
              onChange={setForm}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "保存中…" : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除「{deleteTarget?.alias || deleteTarget?.name}」
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "删除中…" : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
