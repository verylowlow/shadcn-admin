import type { CallRecord, CallStageMetric } from "@/types/api";

const STATUS_LABELS: Record<string, string> = {
  pending: "待接通",
  running: "通话中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
};

const DIRECTION_LABELS: Record<string, string> = {
  inbound: "呼入",
  outbound: "呼出",
};

const END_REASON_LABELS: Record<string, string> = {
  normal: "正常结束",
  hangup: "挂断",
  no_answer: "无人接听",
  busy: "占线",
  timeout: "超时",
  error: "系统错误",
  rejected: "拒接",
  not_connected: "无法接通",
  stream_end: "媒体流结束",
  orphan_reaped: "会话回收",
  dial_timeout: "外呼超时",
  shutdown: "服务关闭",
  interrupted: "进程中断",
};

const ROLE_LABELS: Record<string, string> = {
  user: "用户",
  assistant: "客服",
};

/** Parse API timestamps; naive ISO strings are treated as UTC. */
export function parseApiDateTime(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const normalized = /[zZ]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function formatDateTime(iso: string | null | undefined): string {
  const d = parseApiDateTime(iso);
  if (!d) return iso ? iso : "—";
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatTime(iso: string | null | undefined): string {
  const d = parseApiDateTime(iso);
  if (!d) return "";
  return d.toLocaleTimeString("zh-CN", { hour12: false });
}

export function formatDuration(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
  answeredAt?: string | null,
): string {
  if (!startedAt || !endedAt) return "—";
  const start = parseApiDateTime(answeredAt || startedAt);
  const end = parseApiDateTime(endedAt);
  if (!start || !end) return "—";
  const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function directionLabel(direction: string): string {
  return DIRECTION_LABELS[direction] ?? direction;
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function endReasonLabel(
  endReason: string | null | undefined,
  status: string,
): string {
  if (!endReason) {
    if (status === "running") return "进行中";
    if (status === "pending") return "待接通";
    return "—";
  }
  return END_REASON_LABELS[endReason] ?? endReason;
}

export function callMetaFromRecord(call: CallRecord) {
  const peer =
    call.direction === "inbound" ? call.from_uri : call.to_uri;
  return {
    peerDisplay: peer || "—",
    directionLabel: directionLabel(call.direction),
    statusLabel: statusLabel(call.status),
    startedAtDisplay: formatDateTime(call.started_at),
    endedAtDisplay: formatDateTime(call.ended_at),
    answeredAtDisplay: formatDateTime(call.answered_at),
    durationDisplay: formatDuration(
      call.started_at,
      call.ended_at,
      call.answered_at,
    ),
    endReasonDisplay: endReasonLabel(call.end_reason, call.status),
    hasAudio: Boolean(call.audio_local_path || call.audio_oss_url),
  };
}

export function groupMetricsByTurn(
  metrics: CallStageMetric[],
): Array<[number, CallStageMetric[]]> {
  const map = new Map<number, CallStageMetric[]>();
  for (const m of metrics) {
    const list = map.get(m.turn_seq) ?? [];
    list.push(m);
    map.set(m.turn_seq, list);
  }
  return [...map.entries()].sort(([a], [b]) => a - b);
}
