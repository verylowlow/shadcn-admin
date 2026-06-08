
import { Link } from "@tanstack/react-router";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Tag, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ncc/pagination";
import { TagBadge } from "@/components/ncc/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import {
  CALL_MODE_OPTIONS,
  EDGE_VOICE_OPTIONS,
  RETRY_POLICY_OPTIONS,
  SIM_LINE_OPTIONS,
  VOLC_VOICE_OPTIONS,
} from "@/lib/constants";
import {
  fetchContactsByTag,
  useAgentKinds,
  useAgents,
  useContacts,
  useCreateCampaign,
  useSettings,
  useStartCampaign,
  useTags,
  useTemplates,
} from "@/lib/queries";
import type { Contact } from "@/types/api";

type PromptMode = "template" | "custom";

const PICKER_PAGE_SIZE = 100;

function mergeContactsIntoCache(
  prev: Map<string, Contact>,
  items: Contact[],
): Map<string, Contact> {
  const next = new Map(prev);
  for (const c of items) next.set(c.id, c);
  return next;
}

export default function CampaignNewPage() {
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });

  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contactCache, setContactCache] = useState<Map<string, Contact>>(
    () => new Map(),
  );
  const [callMode, setCallMode] = useState("conversation");
  const [simLine, setSimLine] = useState("sim1");
  const [retryPolicy, setRetryPolicy] = useState("none");
  const [agentKindOverride, setAgentKindOverride] = useState("");
  const [agentProfileId, setAgentProfileId] = useState("");
  const [ttsVoiceOverride, setTtsVoiceOverride] = useState("");
  const [promptMode, setPromptMode] = useState<PromptMode>("template");
  const [industryTemplateId, setIndustryTemplateId] = useState("");
  const [customSysprompt, setCustomSysprompt] = useState("");
  const [taskBrief, setTaskBrief] = useState("");
  const [openingScript, setOpeningScript] = useState("您好,电话已接通...");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contactSearchInput, setContactSearchInput] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set());
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagPick, setTagPick] = useState("");
  const [tagLoading, setTagLoading] = useState(false);

  const { data: seedContacts } = useContacts({ page: 1, size: PICKER_PAGE_SIZE });
  const {
    data: pickerContacts,
    isLoading: pickerLoading,
    isError: pickerError,
    refetch: refetchPicker,
  } = useContacts(
    {
      q: contactSearch || undefined,
      page: pickerPage,
      size: PICKER_PAGE_SIZE,
    },
    { enabled: pickerOpen },
  );
  const { data: templatesData } = useTemplates();
  const { data: agentsData } = useAgents();
  const { data: kindsData } = useAgentKinds();
  const { data: settingsData } = useSettings();
  const { data: tagsData } = useTags();
  const createMutation = useCreateCampaign();
  const startMutation = useStartCampaign();

  useEffect(() => {
    if (!seedContacts?.items.length) return;
    setContactCache((prev) => mergeContactsIntoCache(prev, seedContacts.items));
  }, [seedContacts]);

  useEffect(() => {
    if (!pickerContacts?.items.length) return;
    setContactCache((prev) => mergeContactsIntoCache(prev, pickerContacts.items));
  }, [pickerContacts]);

  useEffect(() => {
    const raw = new URL(href, window.location.origin).searchParams.get("ids");
    if (!raw) return;
    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length) setSelectedIds(new Set(ids));
  }, [href]);

  const tagColorMap = useMemo(
    () => Object.fromEntries((tagsData?.items ?? []).map((t) => [t.name, t.color])),
    [tagsData?.items],
  );

  const voiceOptions = useMemo(() => {
    const engine = settingsData?.tts_engine ?? "edge";
    return engine === "edge" ? EDGE_VOICE_OPTIONS : VOLC_VOICE_OPTIONS;
  }, [settingsData?.tts_engine]);

  const defaultVoiceLabel = useMemo(() => {
    const engine = settingsData?.tts_engine ?? "edge";
    const voice =
      engine === "edge"
        ? settingsData?.tts_voice
        : settingsData?.volc_tts_voice;
    return voice || "系统默认";
  }, [settingsData]);

  const selectedContacts = useMemo(
    () =>
      [...selectedIds].map((id) => {
        const cached = contactCache.get(id);
        return cached ?? { id, name: "未知联系人", phone: "—", tags: [], memo: "" };
      }),
    [selectedIds, contactCache],
  );

  function openPicker() {
    setPickerSelection(new Set(selectedIds));
    setContactSearchInput("");
    setContactSearch("");
    setPickerPage(1);
    setPickerOpen(true);
  }

  function confirmPicker() {
    setSelectedIds(new Set(pickerSelection));
    setPickerOpen(false);
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPickerSelection((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function clearSelected() {
    setSelectedIds(new Set());
    setPickerSelection(new Set());
  }

  const runPickerSearch = useCallback(() => {
    setContactSearch(contactSearchInput.trim());
    setPickerPage(1);
  }, [contactSearchInput]);

  async function confirmTagSelect() {
    if (!tagPick) {
      toast.error("请选择标签");
      return;
    }
    setTagLoading(true);
    try {
      const res = await fetchContactsByTag(tagPick);
      if (res.items.length === 0) {
        toast.message(`标签「${tagPick}」下暂无联系人`);
        return;
      }
      setContactCache((prev) => mergeContactsIntoCache(prev, res.items));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const c of res.items) next.add(c.id);
        return next;
      });
      setPickerSelection((prev) => {
        const next = new Set(prev);
        for (const c of res.items) next.add(c.id);
        return next;
      });
      toast.success(`已加入标签「${tagPick}」下 ${res.items.length} 人`);
      setTagDialogOpen(false);
      setTagPick("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "按标签选择失败");
    } finally {
      setTagLoading(false);
    }
  }

  async function submit(andStart: boolean) {
    if (!name.trim()) {
      toast.error("请填写活动名称");
      return;
    }
    const contact_ids = [...selectedIds].map((id) => id.trim()).filter(Boolean);
    if (!contact_ids.length) {
      toast.error("请至少选择一位通讯录联系人");
      return;
    }
    if (
      promptMode === "template" &&
      (!industryTemplateId || industryTemplateId === "__none__")
    ) {
      toast.error("请选择话术模板");
      return;
    }
    if (promptMode === "custom" && !customSysprompt.trim()) {
      toast.error("请填写自定义 System Prompt");
      return;
    }

    const body = {
      name: name.trim(),
      contact_ids,
      call_mode: callMode,
      sim_line: simLine,
      retry_policy: retryPolicy,
      task_brief: taskBrief.trim() || null,
      opening_script: openingScript.trim() || null,
      agent_profile_id: agentProfileId || null,
      agent_kind_override: agentKindOverride || null,
      tts_voice_override: ttsVoiceOverride || null,
      industry_template_id:
        promptMode === "template" &&
        industryTemplateId &&
        industryTemplateId !== "__none__"
          ? industryTemplateId
          : null,
      custom_sysprompt:
        promptMode === "custom" ? customSysprompt.trim() || null : null,
    };

    try {
      const created = await createMutation.mutateAsync(body);
      if (andStart) {
        await startMutation.mutateAsync(created.id);
        toast.success("活动已创建并启动");
      } else {
        toast.success("活动已创建（草稿）");
      }
      navigate({ to: '/campaigns/$id', params: { id: created.id } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "创建失败");
    }
  }

  const pickerItems = pickerContacts?.items ?? [];
  const isSubmitting = createMutation.isPending || startMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/campaigns">
            <ArrowLeft className="size-4" />
            外呼活动列表
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">新建外呼活动</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">活动名称</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>目标客户</Label>
              <span className="text-sm text-muted-foreground">
                已选 {selectedIds.size} 人
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={openPicker}>
                <Users className="size-4" />
                从通讯录选择
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTagDialogOpen(true)}
              >
                <Tag className="size-4" />
                按标签添加
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={clearSelected}
                >
                  清空已选
                </Button>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {selectedContacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.phone}
                      </p>
                      {c.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <TagBadge
                              key={t}
                              name={t}
                              color={tagColorMap[t] ?? "#64748b"}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`移除 ${c.name}`}
                      onClick={() => removeSelected(c.id)}
                    >
                      <X className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {selectedIds.size === 0 && (
              <p className="text-sm text-muted-foreground">
                尚未选择联系人，可手动勾选或按标签批量添加
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>呼出方式</Label>
              <Select value={callMode} onValueChange={(v) => v && setCallMode(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_MODE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>呼出卡号</Label>
              <Select value={simLine} onValueChange={(v) => v && setSimLine(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIM_LINE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>失败策略</Label>
              <Select value={retryPolicy} onValueChange={(v) => v && setRetryPolicy(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETRY_POLICY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>客服agent 类型</Label>
              <Select
                value={agentKindOverride || "__default__"}
                onValueChange={(v) =>
                  setAgentKindOverride(v && v !== "__default__" ? v : "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">（默认）</SelectItem>
                  {(kindsData?.kinds ?? []).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>客服agent Profile</Label>
              <Select
                value={agentProfileId || "__none__"}
                onValueChange={(v) =>
                  setAgentProfileId(v && v !== "__none__" ? v : "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">（无）</SelectItem>
                  {(agentsData?.items ?? [])
                    .filter(
                      (a) =>
                        !a.usage ||
                        a.usage === "both" ||
                        a.usage === "outbound",
                    )
                    .map((a) => (
                      <SelectItem
                        key={a.id}
                        value={a.alias || a.name || a.id}
                      >
                        {a.alias || a.name} ({a.kind})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                TTS 发音人（{settingsData?.tts_engine ?? "edge"}）
              </Label>
              <Select
                value={ttsVoiceOverride || "__default__"}
                onValueChange={(v) =>
                  setTtsVoiceOverride(v && v !== "__default__" ? v : "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">
                    默认 {defaultVoiceLabel}
                  </SelectItem>
                  {voiceOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>话术来源（二选一）</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="prompt_mode"
                  checked={promptMode === "template"}
                  onChange={() => setPromptMode("template")}
                />
                话术模板
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="prompt_mode"
                  checked={promptMode === "custom"}
                  onChange={() => setPromptMode("custom")}
                />
                自定义 System Prompt
              </label>
            </div>
            {promptMode === "template" ? (
              <Select
                value={industryTemplateId || "__none__"}
                onValueChange={(v) =>
                  setIndustryTemplateId(v && v !== "__none__" ? v : "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择模板" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">（请选择）</SelectItem>
                  {(templatesData?.items ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} [{t.industry}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Textarea
                value={customSysprompt}
                onChange={(e) => setCustomSysprompt(e.target.value)}
                rows={4}
                placeholder="自定义 System Prompt"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-brief">
              本次任务目标
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                （会拼入 System Prompt）
              </span>
            </Label>
            <Textarea
              id="task-brief"
              value={taskBrief}
              onChange={(e) => setTaskBrief(e.target.value)}
              rows={3}
              placeholder="例如：确认客户是否有续费意向…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opening-script">开场白</Label>
            <Textarea
              id="opening-script"
              value={openingScript}
              onChange={(e) => setOpeningScript(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => submit(false)} disabled={isSubmitting}>
          {isSubmitting ? "提交中…" : "创建（草稿）"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => submit(true)}
          disabled={isSubmitting}
        >
          创建并启动
        </Button>
        <Button variant="outline" asChild>
          <Link to="/campaigns">取消</Link>
        </Button>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>选择通讯录联系人</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="搜索姓名、电话或标签"
                value={contactSearchInput}
                onChange={(e) => setContactSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runPickerSearch()}
              />
            </div>
            <Button type="button" variant="secondary" onClick={runPickerSearch}>
              搜索
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
            {pickerLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : pickerError ? (
              <div className="space-y-2 p-4 text-center">
                <p className="text-sm text-destructive">加载联系人失败</p>
                <Button size="sm" variant="outline" onClick={() => void refetchPicker()}>
                  重试
                </Button>
              </div>
            ) : pickerItems.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {contactSearch
                  ? "无匹配联系人，请调整搜索条件"
                  : "通讯录为空，请先在通讯录页添加联系人"}
              </p>
            ) : (
              <ul className="divide-y">
                {pickerItems.map((c) => {
                  const checked = pickerSelection.has(c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-muted/50">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            setPickerSelection((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(c.id);
                              else next.delete(c.id);
                              return next;
                            });
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium">{c.name}</span>
                          <span className="ml-2 text-muted-foreground">
                            {c.phone}
                          </span>
                          {c.tags.length > 0 && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {c.tags.join(", ")}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {pickerContacts && pickerContacts.total > PICKER_PAGE_SIZE && (
            <Pagination
              page={pickerContacts.page}
              size={pickerContacts.size}
              total={pickerContacts.total}
              onPageChange={setPickerPage}
            />
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Badge variant="secondary">已勾选 {pickerSelection.size} 人</Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPickerOpen(false)}>
                取消
              </Button>
              <Button onClick={confirmPicker}>
                确定
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>按标签添加联系人</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>选择标签</Label>
            {(tagsData?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                暂无标签，
                <Link to="/contacts/tags" className="text-primary hover:underline">
                  去标签管理添加
                </Link>
              </p>
            ) : (
              <Select value={tagPick || "__none__"} onValueChange={(v) => setTagPick(v === "__none__" ? "" : (v ?? ""))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">请选择</SelectItem>
                  {tagsData?.items.map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              将把该标签下所有联系人加入已选列表（可与手动勾选叠加）
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              取消
            </Button>
            <Button
              disabled={tagLoading || !tagPick}
              onClick={() => void confirmTagSelect()}
            >
              {tagLoading ? "加载中…" : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
