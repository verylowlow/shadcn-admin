
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useSaveSettings, useSettings } from "@/lib/queries";
import type { AdminSettings } from "@/types/api";
import { ApiError } from "@/lib/api-client";

const EDGE_VOICES = [
  { value: "zh-CN-XiaoxiaoNeural", label: "晓晓（女声）" },
  { value: "zh-CN-YunxiNeural", label: "云希（男声）" },
  { value: "zh-CN-YunyangNeural", label: "云扬（男声）" },
  { value: "zh-CN-XiaoyiNeural", label: "晓伊（女声）" },
];

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SecretField({
  label,
  hint,
  value,
  configured,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  configured?: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="password"
        value={value}
        placeholder={placeholder ?? (configured ? "留空则保持不变" : "请输入")}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      {configured ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">已配置</p>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  const { data, isLoading, isError, refetch } = useSettings();
  const saveMutation = useSaveSettings();
  const [form, setForm] = useState<Partial<AdminSettings>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(data);
      setDirty(false);
    }
  }, [data]);

  const set = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      delete payload._override_keys;
      delete payload._settings_file;
      delete payload.volc_access_token_configured;
      delete payload.volc_tts_api_key_configured;
      delete payload.llm_api_key_configured;

      const result = await saveMutation.mutateAsync(payload);
      toast.success(result.message || "设置已保存");
      setForm(result.effective);
      setDirty(false);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "保存失败";
      toast.error(msg);
    }
  };

  if (isLoading) return <LoadingState message="加载系统设置…" />;
  if (isError || !data) {
    return (
      <ErrorState message="无法加载系统设置" onRetry={() => void refetch()} />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        description="修改后立即生效，无需重启服务。密钥留空则保持原值。"
      >
        <Button
          onClick={() => void handleSave()}
          disabled={saveMutation.isPending || !dirty}
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          保存设置
        </Button>
      </PageHeader>

      {form._override_keys && form._override_keys.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          已覆盖 {form._override_keys.length} 项配置
          {form._settings_file ? ` · ${form._settings_file}` : ""}
        </p>
      ) : null}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>语音合成 (TTS)</CardTitle>
            <CardDescription>文字转语音引擎与音色配置</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>TTS 引擎</Label>
              <Select
                value={form.tts_engine ?? "edge"}
                onValueChange={(v) =>
                  v && set("tts_engine", v as AdminSettings["tts_engine"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edge">Edge TTS</SelectItem>
                  <SelectItem value="volc">火山 TTS</SelectItem>
                  <SelectItem value="volc_ws">火山 TTS (WebSocket)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.tts_engine === "edge" ? (
              <div className="space-y-2">
                <Label>Edge 音色</Label>
                <Select
                  value={form.tts_voice ?? ""}
                  onValueChange={(v) => v && set("tts_voice", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择音色" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDGE_VOICES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>火山 App ID</Label>
                  <Input
                    value={form.volc_app_id ?? ""}
                    onChange={(e) => set("volc_app_id", e.target.value)}
                  />
                </div>
                <SecretField
                  label="火山 Access Token"
                  value={form.volc_access_token ?? ""}
                  configured={form.volc_access_token_configured}
                  onChange={(v) => set("volc_access_token", v)}
                />
                <SecretField
                  label="火山 TTS API Key"
                  value={form.volc_tts_api_key ?? ""}
                  configured={form.volc_tts_api_key_configured}
                  onChange={(v) => set("volc_tts_api_key", v)}
                />
                <div className="space-y-2">
                  <Label>Resource ID</Label>
                  <Input
                    value={form.volc_tts_resource_id ?? "seed-tts-1.0"}
                    onChange={(e) => set("volc_tts_resource_id", e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>火山音色 ID</Label>
                  <Input
                    value={form.volc_tts_voice ?? ""}
                    placeholder="如 zh_female_shuangkuaisisi_moon_bigtts"
                    onChange={(e) => set("volc_tts_voice", e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>语音识别 (STT)</CardTitle>
            <CardDescription>语音转文字引擎</CardDescription>
          </CardHeader>
          <CardContent className="max-w-sm">
            <div className="space-y-2">
              <Label>STT 引擎</Label>
              <Select
                value={form.stt_engine ?? "whisper"}
                onValueChange={(v) =>
                  v && set("stt_engine", v as AdminSettings["stt_engine"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whisper">Whisper</SelectItem>
                  <SelectItem value="volc">火山</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>大语言模型 (LLM)</CardTitle>
            <CardDescription>对话生成与推理参数</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>API Base URL</Label>
              <Input
                value={form.llm_base_url ?? ""}
                placeholder="https://api.openai.com/v1"
                onChange={(e) => set("llm_base_url", e.target.value)}
              />
            </div>
            <SecretField
              label="API Key"
              value={form.llm_api_key ?? ""}
              configured={form.llm_api_key_configured}
              onChange={(v) => set("llm_api_key", v)}
            />
            <div className="space-y-2">
              <Label>模型</Label>
              <Input
                value={form.llm_model ?? ""}
                onChange={(e) => set("llm_model", e.target.value)}
              />
            </div>
            <NumberField
              label="Temperature"
              hint="0–2，越高越随机"
              value={form.llm_temperature ?? 0.2}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => set("llm_temperature", v)}
            />
            <NumberField
              label="Max Tokens"
              hint="单次回复最大 token 数"
              value={form.llm_max_tokens ?? 80}
              min={16}
              max={512}
              onChange={(v) => set("llm_max_tokens", v)}
            />
            <NumberField
              label="Flush Min Chars"
              hint="流式输出最小字符数"
              value={form.llm_flush_min_chars ?? 0}
              min={0}
              max={64}
              onChange={(v) => set("llm_flush_min_chars", v)}
            />
            <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
              <div>
                <Label>启用 Thinking</Label>
                <p className="text-xs text-muted-foreground">
                  允许模型输出思考过程（若模型支持）
                </p>
              </div>
              <Switch
                checked={form.llm_enable_thinking ?? false}
                onCheckedChange={(v) => set("llm_enable_thinking", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>语音活动检测 (VAD)</CardTitle>
            <CardDescription>静音检测与帧窗口参数</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="最小静音时长 (ms)"
              value={form.vad_min_silence_duration_ms ?? 180}
              min={100}
              max={1000}
              onChange={(v) => set("vad_min_silence_duration_ms", v)}
            />
            <NumberField
              label="最小语音时长 (ms)"
              value={form.vad_min_speech_duration_ms ?? 150}
              min={50}
              max={1000}
              onChange={(v) => set("vad_min_speech_duration_ms", v)}
            />
            <NumberField
              label="阈值"
              value={form.vad_threshold ?? 0.5}
              min={0.1}
              max={0.95}
              step={0.05}
              onChange={(v) => set("vad_threshold", v)}
            />
            <NumberField
              label="低阈值"
              value={form.vad_threshold_low ?? 0.3}
              min={0.05}
              max={0.9}
              step={0.05}
              onChange={(v) => set("vad_threshold_low", v)}
            />
            <NumberField
              label="帧窗口大小"
              value={form.vad_frame_window_size ?? 5}
              min={2}
              max={15}
              onChange={(v) => set("vad_frame_window_size", v)}
            />
            <NumberField
              label="帧窗口投票数"
              value={form.vad_frame_window_votes ?? 3}
              min={1}
              max={15}
              onChange={(v) => set("vad_frame_window_votes", v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>语音交互</CardTitle>
            <CardDescription>打断、填充音与部分识别稳定性</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumberField
              label="部分结果最小稳定 (ms)"
              value={form.voice_partial_min_stable_ms ?? 150}
              min={50}
              max={2000}
              onChange={(v) => set("voice_partial_min_stable_ms", v)}
            />
            <NumberField
              label="部分结果最小字符"
              value={form.voice_partial_min_chars ?? 4}
              min={2}
              max={20}
              onChange={(v) => set("voice_partial_min_chars", v)}
            />
            <NumberField
              label="打断最小帧数"
              value={form.barge_in_min_frames ?? 1}
              min={1}
              max={30}
              onChange={(v) => set("barge_in_min_frames", v)}
            />
            <NumberField
              label="打断宽限 (ms)"
              value={form.barge_in_grace_ms ?? 200}
              min={0}
              max={1000}
              onChange={(v) => set("barge_in_grace_ms", v)}
            />
            <NumberField
              label="打断 VAD 阈值提升"
              value={form.barge_in_vad_threshold_boost ?? 0.2}
              min={0}
              max={0.4}
              step={0.05}
              onChange={(v) => set("barge_in_vad_threshold_boost", v)}
            />
            <NumberField
              label="填充音延迟 (ms)"
              value={form.filler_delay_ms ?? 1200}
              min={200}
              max={2000}
              onChange={(v) => set("filler_delay_ms", v)}
            />
            <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2 lg:col-span-3">
              <div>
                <Label>挂断意图检测</Label>
                <p className="text-xs text-muted-foreground">
                  识别用户挂断意图并结束通话
                </p>
              </div>
              <Switch
                checked={form.hangup_intent_enabled ?? true}
                onCheckedChange={(v) => set("hangup_intent_enabled", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>路径与队列</CardTitle>
            <CardDescription>业务知识库、缓存目录与外呼队列策略</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>业务知识库目录</Label>
              <Input
                value={form.wiki_dir ?? "data/wiki"}
                onChange={(e) => set("wiki_dir", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>TTS 缓存目录</Label>
              <Input
                value={form.tts_cache_dir ?? "data/tts_cache"}
                onChange={(e) => set("tts_cache_dir", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>外呼队列优先级</Label>
              <Select
                value={form.outbound_queue_priority ?? "manual_first"}
                onValueChange={(v) =>
                  v &&
                  set(
                    "outbound_queue_priority",
                    v as AdminSettings["outbound_queue_priority"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_first">手动优先</SelectItem>
                  <SelectItem value="scheduled_first">定时优先</SelectItem>
                  <SelectItem value="alternate_1_1">交替 1:1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>日志级别</Label>
              <Select
                value={form.log_level ?? "INFO"}
                onValueChange={(v) =>
                  v && set("log_level", v as AdminSettings["log_level"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] as const).map(
                    (level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <Separator className="sm:col-span-2" />
            <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
              <div>
                <Label>保存后刷新静态语音片段</Label>
                <p className="text-xs text-muted-foreground">
                  重新生成系统提示音等预缓存 TTS 文件
                </p>
              </div>
              <Switch
                checked={form.refresh_static_clips ?? false}
                onCheckedChange={(v) => set("refresh_static_clips", v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pb-6">
        <Button
          onClick={() => void handleSave()}
          disabled={saveMutation.isPending || !dirty}
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          保存设置
        </Button>
      </div>
    </div>
  );
}
