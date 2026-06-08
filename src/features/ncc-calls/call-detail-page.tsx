
import { Link } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { ArrowLeft, Radio } from "lucide-react";
import { CallAudioPlayer } from "@/components/ncc/call-audio-player";
import { ErrorState, LoadingState } from "@/components/ncc/loading-state";
import { PageHeader } from "@/components/ncc/page-header";
import { StatusBadge } from "@/components/ncc/status-badge";
import { useCallEvents } from "@/hooks/use-call-events";
import {
  callMetaFromRecord,
  formatTime,
  roleLabel,
} from "@/lib/call-format";
import { agentProfileLabel } from "@/lib/agent-display";
import { hasAudio, useAgents, useCallDetail } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{children}</dd>
    </div>
  );
}

export function CallDetailClient() {
  const params = useParams({ from: '/_authenticated/calls/$id' });
  const id = params.id;

  const detailQuery = useCallDetail(id);
  const { data: agentsData } = useAgents();
  const isRunning = detailQuery.data?.call.status === "running";
  const { events, status: wsStatus } = useCallEvents(id, isRunning);

  if (detailQuery.isLoading) {
    return <LoadingState message="加载话务流水详情…" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        message="话务流水不存在或加载失败"
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  const { call, turns } = detailQuery.data;
  const meta = callMetaFromRecord(call);
  const liveEvents = events.filter((e) => e.type !== "ping");

  return (
    <div className="space-y-6">
      <PageHeader
        title="话务流水详情"
        description={
          <span className="font-mono text-xs text-muted-foreground">
            {call.id}
          </span>
        }
      >
        <Link to="/calls">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4" />
            返回列表
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <dl className="space-y-3">
              <DetailRow label="方向">
                <StatusBadge
                  status={call.direction}
                  label={meta.directionLabel}
                />
              </DetailRow>
              <DetailRow label="状态">
                <StatusBadge status={call.status} label={meta.statusLabel} />
              </DetailRow>
              <DetailRow label="主叫">
                <span className="font-mono text-xs">{call.from_uri || "—"}</span>
              </DetailRow>
              <DetailRow label="被叫">
                <span className="font-mono text-xs">{call.to_uri || "—"}</span>
              </DetailRow>
              <DetailRow label="对方">
                <span className="font-mono text-xs">{meta.peerDisplay}</span>
              </DetailRow>
              <DetailRow label="通话时长">{meta.durationDisplay}</DetailRow>
              <DetailRow label="开始时间">{meta.startedAtDisplay}</DetailRow>
              {call.answered_at && (
                <DetailRow label="接通时间">{meta.answeredAtDisplay}</DetailRow>
              )}
              {call.ended_at && (
                <DetailRow label="结束时间">{meta.endedAtDisplay}</DetailRow>
              )}
              <DetailRow label="结束原因">
                {meta.endReasonDisplay}
                {call.end_reason && call.end_reason !== meta.endReasonDisplay && (
                  <span className="ml-1 text-muted-foreground">
                    ({call.end_reason})
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Agent">
                {call.agent_profile_id ? (
                  <Link
                    to="/agents"
                    className="text-primary hover:underline"
                  >
                    {agentProfileLabel(
                      agentsData?.items,
                      call.agent_profile_id,
                    )}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="联系人">
                {call.contact_id ? (
                  <Link
                    to="/contacts/$id"
                    params={{ id: call.contact_id }}
                    className="text-primary hover:underline"
                  >
                    {call.contact_id}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="外呼活动">
                {call.campaign_id ? (
                  <Link
                    to="/campaigns/$id"
                    params={{ id: call.campaign_id }}
                    className="text-primary hover:underline"
                  >
                    {call.campaign_id}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
            </dl>
            {call.summary?.trim() && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-medium">通话摘要</h3>
                <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                  {call.summary.trim()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">录音回放</CardTitle>
            <CardDescription>
              {meta.hasAudio
                ? "通话录音（WAV）"
                : "通话结束后若启用了录音，WAV 会保存在本地或上传 OSS"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasAudio(call) ? (
              <CallAudioPlayer call={call} />
            ) : (
              <p className="text-sm text-muted-foreground">暂无录音文件</p>
            )}
          </CardContent>
        </Card>
      </div>

      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="size-4 text-blue-500" />
              实时事件
            </CardTitle>
            <CardDescription>
              WebSocket{" "}
              {wsStatus === "connected"
                ? "已连接"
                : wsStatus === "connecting"
                  ? "连接中…"
                  : wsStatus === "error"
                    ? "连接失败"
                    : "未连接"}
              ，对话记录在通话结束后写入下方列表
            </CardDescription>
          </CardHeader>
          <CardContent>
            {liveEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">等待实时事件…</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                {[...liveEvents].reverse().slice(0, 30).map((ev, i) => (
                  <li
                    key={`${ev.ts}-${i}`}
                    className="rounded-md border bg-muted/30 px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground">
                      {ev.type}
                    </span>
                    {ev.text && (
                      <p className="mt-1 whitespace-pre-wrap">{ev.text}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">对话文字记录</CardTitle>
          <CardDescription>
            VoiceSession 在每轮 user / assistant 发言时写入 CallTurn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {turns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isRunning ? "通话进行中，暂无完整轮次记录…" : "暂无对话记录"}
            </p>
          ) : (
            <div className="space-y-3">
              {turns.map((turn) => {
                const isUser = turn.role === "user";
                return (
                  <div
                    key={turn.seq}
                    className={cn(
                      "flex",
                      isUser ? "justify-start" : "justify-end",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-4 py-3 text-sm",
                        isUser
                          ? "bg-muted text-foreground"
                          : "bg-primary/10 text-foreground",
                      )}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {roleLabel(turn.role)}
                        </span>
                        {turn.started_at && (
                          <span>{formatTime(turn.started_at)}</span>
                        )}
                        <span>#{turn.seq}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{turn.text || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
