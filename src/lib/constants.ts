import type { CampaignItemStatus, CampaignStatus, Industry } from "@/types/api";

export const INDUSTRY_LABELS: Record<Industry, string> = {
  education: "教育",
  medical: "医疗",
  delivery: "配送",
  media: "传媒",
  custom: "自定义",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "草稿",
  queued: "排队中",
  running: "进行中",
  paused: "已暂停",
  completed: "已完成",
  cancelled: "已取消",
};

export const CAMPAIGN_ITEM_STATUS_LABELS: Record<CampaignItemStatus, string> = {
  pending: "待呼叫",
  calling: "呼叫中",
  succeeded: "成功",
  failed: "失败",
  skipped: "跳过",
  cancelled: "已取消",
};

export const CALL_MODE_OPTIONS = [
  { value: "conversation", label: "对话模式" },
  { value: "notify", label: "仅通知" },
] as const;

export const SIM_LINE_OPTIONS = [
  { value: "sim1", label: "SIM 卡 1" },
  { value: "sim2", label: "SIM 卡 2" },
  { value: "dual_random", label: "双卡随机" },
] as const;

export const RETRY_POLICY_OPTIONS = [
  { value: "none", label: "失败即不再呼叫" },
  { value: "no_answer_retry_max2", label: "无人接听最多重试 2 次" },
] as const;

export const EDGE_VOICE_OPTIONS = [
  { value: "zh-CN-XiaoxiaoNeural", label: "晓晓（女声）" },
  { value: "zh-CN-YunxiNeural", label: "云希（男声）" },
  { value: "zh-CN-YunyangNeural", label: "云扬（男声）" },
  { value: "zh-CN-XiaoyiNeural", label: "晓伊（女声）" },
] as const;

export const VOLC_VOICE_OPTIONS = [
  {
    value: "zh_female_shuangkuaisisi_moon_bigtts",
    label: "zh_female_shuangkuaisisi_moon_bigtts",
  },
  {
    value: "zh_male_wennuanahu_moon_bigtts",
    label: "zh_male_wennuanahu_moon_bigtts",
  },
  {
    value: "zh_female_gaolengyujie_moon_bigtts",
    label: "zh_female_gaolengyujie_moon_bigtts",
  },
] as const;
