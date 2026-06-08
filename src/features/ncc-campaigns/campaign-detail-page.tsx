
import { Link } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft, Play, Square } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api-client";
import {
  CALL_MODE_OPTIONS,
  RETRY_POLICY_OPTIONS,
  SIM_LINE_OPTIONS,
} from "@/lib/constants";
import {
  useCampaign,
  useCancelCampaign,
  useStartCampaign,
} from "@/lib/queries";
import {
  CampaignItemStatusBadge,
  CampaignStatusBadge,
} from "@/lib/status-badges";
import type { CampaignItemStatus, CampaignStatus } from "@/types/api";
import { useState } from "react";

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function CampaignDetailClient() {
  const params = useParams({ from: '/_authenticated/campaigns/$id' });
  const id = params.id;
  const { data, isLoading, error, refetch } = useCampaign(id);
  const startMutation = useStartCampaign();
  const cancelMutation = useCancelCampaign();
  const [cancelOpen, setCancelOpen] = useState(false);

  const campaign = data?.campaign;
  const items = data?.items ?? [];
  const stats = campaign?.stats ?? {};

  const canStart =
    campaign?.status === "draft" || campaign?.status === "paused";
  const canCancel =
    campaign?.status === "draft" ||
    campaign?.status === "queued" ||
    campaign?.status === "running" ||
    campaign?.status === "paused";

  async function handleStart() {
    try {
      await startMutation.mutateAsync(id);
      toast.success("活动已启动");
      void refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "启动失败");
    }
  }

  async function handleCancel() {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("活动已取消");
      setCancelOpen(false);
      void refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "取消失败");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/campaigns">
            <ArrowLeft className="size-4" />
            返回列表
          </Link>
        </Button>
        <p className="text-destructive">
          {error instanceof Error ? error.message : "活动不存在"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/campaigns">
              <ArrowLeft className="size-4" />
              外呼活动
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {campaign.name}
            </h1>
            <CampaignStatusBadge status={campaign.status as CampaignStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            共 {stats.total ?? items.length} 人 · 成功 {stats.succeeded ?? 0} ·
            失败 {stats.failed ?? 0} · 待处理 {stats.pending ?? 0}
          </p>
        </div>
        <div className="flex gap-2">
          {canStart && (
            <Button
              onClick={handleStart}
              disabled={startMutation.isPending}
            >
              <Play className="size-4" />
              {startMutation.isPending ? "启动中…" : "启动"}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => setCancelOpen(true)}
              disabled={cancelMutation.isPending}
            >
              <Square className="size-4" />
              取消活动
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>活动配置</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-muted-foreground">呼出方式：</span>
            {labelFor(CALL_MODE_OPTIONS, campaign.call_mode)}
          </div>
          <div>
            <span className="text-muted-foreground">呼出卡号：</span>
            {labelFor(SIM_LINE_OPTIONS, campaign.sim_line)}
          </div>
          <div>
            <span className="text-muted-foreground">失败策略：</span>
            {labelFor(RETRY_POLICY_OPTIONS, campaign.retry_policy)}
          </div>
          <div>
            <span className="text-muted-foreground">客服agent Profile：</span>
            {campaign.agent_profile_id || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">客服agent 类型覆盖：</span>
            {campaign.agent_kind_override || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">TTS 发音人：</span>
            {campaign.tts_voice_override || "默认"}
          </div>
          {campaign.task_brief && (
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-muted-foreground">任务目标：</span>
              {campaign.task_brief}
            </div>
          )}
          {campaign.opening_script && (
            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-muted-foreground">开场白：</span>
              {campaign.opening_script}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>通讯录</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>结果</TableHead>
              <TableHead>尝试次数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  暂无呼叫项
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.contact_name ?? "—"}</TableCell>
                  <TableCell>{item.phone ?? "—"}</TableCell>
                  <TableCell>
                    <CampaignItemStatusBadge
                      status={item.status as CampaignItemStatus}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.outcome_label ?? item.outcome_code ?? "—"}
                  </TableCell>
                  <TableCell>
                    {item.attempt_count}
                    {item.max_attempts != null ? ` / ${item.max_attempts}` : ""}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消活动？</AlertDialogTitle>
            <AlertDialogDescription>
              取消后，所有待处理的呼叫项将被标记为已取消，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "取消中…" : "确认取消"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
