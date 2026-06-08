export const INDUSTRY_OPTIONS = [
  "education",
  "medical",
  "delivery",
  "media",
  "custom",
] as const;

export type Industry = (typeof INDUSTRY_OPTIONS)[number];

export type Template = {
  id: string;
  name: string;
  industry: string;
  content?: string;
  source_file?: string | null;
};

export type TemplateListResponse = {
  items: Template[];
};

export type TemplateCreatePayload = {
  name: string;
  industry: string;
  content?: string;
};

export type TemplateUpdatePayload = {
  name?: string;
  industry?: string;
  content?: string;
};

export type CampaignStatus =
  | "draft"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export type CampaignItemStatus =
  | "pending"
  | "calling"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

export type CampaignStats = {
  total?: number;
  succeeded?: number;
  failed?: number;
  pending?: number;
};

export type CampaignSummary = {
  id: string;
  name: string;
  status: CampaignStatus;
  stats?: CampaignStats | null;
  created_at?: string | null;
};

export type CampaignListResponse = {
  items: CampaignSummary[];
};

export type CampaignCreatePayload = {
  name: string;
  contact_ids: string[];
  call_mode?: string;
  agent_profile_id?: string | null;
  agent_kind_override?: string | null;
  industry_template_id?: string | null;
  custom_sysprompt?: string | null;
  task_brief?: string | null;
  opening_script?: string | null;
  sim_line?: string;
  tts_voice_override?: string | null;
  retry_policy?: string;
};

export type CampaignDetail = {
  id: string;
  name: string;
  status: CampaignStatus;
  call_mode: string;
  sim_line: string;
  retry_policy: string;
  industry_template_id?: string | null;
  custom_sysprompt?: string | null;
  task_brief?: string | null;
  opening_script?: string | null;
  agent_profile_id?: string | null;
  agent_kind_override?: string | null;
  tts_voice_override?: string | null;
  created_at?: string | null;
  started_at?: string | null;
  stats?: CampaignStats;
};

export type CampaignItem = {
  id: string;
  contact_id: string;
  contact_name?: string | null;
  phone?: string | null;
  status: CampaignItemStatus;
  outcome_code?: string | null;
  outcome_label?: string | null;
  attempt_count: number;
  max_attempts?: number;
};

export type CampaignDetailResponse = {
  campaign: CampaignDetail;
  items: CampaignItem[];
};

export type AgentProfileUsage = "outbound" | "inbound" | "both";

export type AgentProfile = {
  id: string;
  name: string;
  alias: string;
  usage: AgentProfileUsage;
  kind: string;
  config_json: Record<string, unknown>;
};

export type AgentListResponse = {
  items: AgentProfile[];
  total: number;
};

export type AgentKindsResponse = {
  kinds: string[];
};

export type AgentCreatePayload = {
  name: string;
  alias?: string | null;
  usage?: AgentProfileUsage;
  kind: string;
  config_json?: Record<string, unknown>;
};

export type AgentUpdatePayload = {
  name?: string;
  alias?: string;
  usage?: AgentProfileUsage;
  kind?: string;
  config_json?: Record<string, unknown>;
};

export type InboundPolicy = "disabled" | "allowlist" | "open";

export type InboundProfileOption = {
  alias: string;
  id: string;
  kind: string;
  label: string;
};

export type InboundSettings = {
  inbound_auto_answer: boolean;
  inbound_policy: InboundPolicy;
  inbound_allowlist_contact_only: boolean;
  inbound_default_agent_profile_alias: string;
  inbound_opening_script: string;
  inbound_default_system_prompt: string;
  inbound_voice_url: string;
  inbound_status_callback_url: string;
  profile_options?: InboundProfileOption[];
};

export type InboundSettingsSaveResponse = {
  ok: boolean;
  message: string;
  effective: InboundSettings;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  memo: string;
  conversation_summary?: string;
  call_total?: number;
  call_inbound?: number;
  call_outbound?: number;
};

export type ContactListResponse = {
  items: Contact[];
  total: number;
  page: number;
  size: number;
};

export type ContactCreateInput = {
  name: string;
  phone: string;
  tags?: string[];
  memo?: string;
};

export type ContactUpdateInput = {
  name?: string;
  phone?: string;
  tags?: string[];
  memo?: string;
  conversation_summary?: string;
};

export type ContactImportResult = {
  imported: number;
  skipped?: number;
  errors?: string[];
};

/** Dashboard */
export type DashboardStats = {
  total_calls: number;
  total_contacts: number;
  active_campaigns: number;
  running_campaigns: number;
  queued_campaigns: number;
};

export type CallRow = {
  id: string;
  direction: string;
  direction_label: string;
  from_uri: string;
  to_uri: string;
  peer_display: string;
  status: string;
  status_label: string;
  started_at_display: string;
  duration_display: string;
  duration_seconds: number | null;
  has_audio: boolean;
  summary: string;
  contact_id: string | null;
  campaign_id: string | null;
  outcome_code: string | null;
  outcome_label: string;
  agent_profile_id: string | null;
  end_reason: string | null;
};

export type CampaignRow = {
  id: string;
  name: string;
  status: string;
  total: number;
  succeeded: number;
  failed: number;
  pending: number;
  created_at: string | null;
};

export type DashboardRecentCalls = { items: CallRow[] };
export type DashboardActiveCampaigns = { items: CampaignRow[] };

/** Settings */
export type SttEngine = "whisper" | "volc";
export type TtsEngine = "edge" | "volc" | "volc_ws";
export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type OutboundQueuePriority =
  | "manual_first"
  | "scheduled_first"
  | "alternate_1_1";

export type AdminSettings = {
  stt_engine: SttEngine;
  tts_engine: TtsEngine;
  tts_voice: string;
  volc_app_id: string;
  volc_access_token: string;
  volc_tts_api_key: string;
  volc_tts_resource_id: string;
  volc_tts_voice: string;
  llm_base_url: string;
  llm_api_key: string;
  llm_model: string;
  llm_temperature: number;
  llm_max_tokens: number;
  llm_flush_min_chars: number;
  llm_enable_thinking: boolean;
  vad_min_silence_duration_ms: number;
  vad_min_speech_duration_ms: number;
  vad_threshold: number;
  vad_threshold_low: number;
  vad_frame_window_size: number;
  vad_frame_window_votes: number;
  voice_partial_min_stable_ms: number;
  voice_partial_min_chars: number;
  barge_in_min_frames: number;
  barge_in_grace_ms: number;
  barge_in_vad_threshold_boost: number;
  filler_delay_ms: number;
  hangup_intent_enabled: boolean;
  wiki_dir: string;
  tts_cache_dir: string;
  log_level: LogLevel;
  outbound_queue_priority: OutboundQueuePriority;
  refresh_static_clips?: boolean;
  volc_access_token_configured?: boolean;
  volc_tts_api_key_configured?: boolean;
  llm_api_key_configured?: boolean;
  _override_keys?: string[];
  _settings_file?: string;
};

export type AdminSettingsSaveResponse = {
  ok: boolean;
  message: string;
  override_keys: string[];
  static_clips: {
    refreshed: boolean;
    fingerprint?: string;
    ready?: boolean;
  };
  effective: AdminSettings;
};

/** Tags */
export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type TagListResponse = { items: Tag[] };

export type TagCreateInput = {
  name: string;
  color?: string;
};

export type TagUpdateInput = {
  name?: string;
  color?: string;
};

/** Wiki */
export type WikiCategory = "faq" | "sop" | "policies" | "products";

export type WikiPageSummary = {
  name: string;
  title: string;
  summary: string;
  category: WikiCategory;
  path: string;
  token_estimate: number;
  content?: string;
};

export type WikiPageListResponse = {
  items: WikiPageSummary[];
  total: number;
};

export type WikiPageDetail = WikiPageSummary & {
  content: string;
};

export type WikiPageSavePayload = {
  category: WikiCategory;
  content: string;
  summary: string;
};

export type WikiReloadResponse = {
  ok: boolean;
  page_count: number;
};

export type WikiIngestResponse = {
  ok: boolean;
  pages_written: number;
  log_entry: string;
  page_count: number;
};

export type WikiLogResponse = {
  log: string;
};

export type WikiTtsInfoResponse = {
  tts_engine: string;
  volc_tts_voice: string;
  volc_tts_resource_id: string;
  codec: string;
  fingerprint_current: string;
  fingerprint_stored: string;
  needs_refresh: boolean;
  clip_files: number;
};

export type WikiRefreshClipsResponse = {
  ok: boolean;
  ready: boolean;
  clips_expected: number;
  fingerprint: string;
};

/** Static TTS clips (话术模板 → TTS 缓存) */
export type StaticClipItem = {
  key: string;
  label: string;
  description: string;
  group: string;
  text: string;
  default_text: string;
};

export type StaticClipsConfigResponse = {
  clips: StaticClipItem[];
  tts_engine: string;
  volc_tts_voice: string;
  volc_tts_resource_id: string;
  codec: string;
  fingerprint_current: string;
  fingerprint_stored: string;
  needs_refresh: boolean;
  clip_files: number;
  cache_ready: boolean;
};

export type StaticClipsSavePayload = {
  clips: { key: string; text: string }[];
};

export type StaticClipsSaveResponse = {
  ok: boolean;
  ready: boolean;
  fingerprint: string;
  clips: StaticClipItem[];
};

/** Calls */
export type CallRecord = {
  id: string;
  direction: string;
  from_uri: string;
  to_uri: string;
  status: string;
  end_reason?: string | null;
  started_at?: string | null;
  answered_at?: string | null;
  ended_at?: string | null;
  audio_local_path?: string | null;
  audio_oss_url?: string | null;
  agent_profile_id?: string | null;
  contact_id?: string | null;
  campaign_id?: string | null;
  summary?: string | null;
};

export type CallTurn = {
  seq: number;
  role: string;
  text: string;
  started_at?: string | null;
  ended_at?: string | null;
};

export type CallStageMetric = {
  turn_seq: number;
  stage: string;
  ts_ms: number;
};

export type CallDetailResponse = {
  call: CallRecord;
  turns: CallTurn[];
  metrics: CallStageMetric[];
};

export type CallListResponse = {
  items: CallRow[];
  total: number;
  page: number;
  size: number;
};

export type MetricsStageEntry = {
  stage: string;
  ts_ms: number;
};

export type MetricsTurnSummary = {
  turn_seq: number;
  stages: MetricsStageEntry[];
};

export type CallMetricsSummaryResponse = {
  call_id: string;
  turns: MetricsTurnSummary[];
};

/** WebSocket call events */
export type CallEventType =
  | "stt.partial"
  | "stt.final"
  | "tts.sentence_start"
  | "ping";

export type CallEvent = {
  type: CallEventType | string;
  call_id: string;
  ts: number;
  text?: string;
  [key: string]: unknown;
};
