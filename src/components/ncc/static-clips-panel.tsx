"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  useSaveStaticClips,
  useStaticClipsConfig,
} from "@/lib/queries";
import type { StaticClipItem } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const GROUP_LABEL: Record<string, string> = {
  greeting: "开场白",
  filler: "垫句",
  other: "其他",
};

export function StaticClipsPanel() {
  const configQuery = useStaticClipsConfig();
  const saveMutation = useSaveStaticClips();
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!configQuery.data?.clips) return;
    const next: Record<string, string> = {};
    for (const c of configQuery.data.clips) {
      next[c.key] = c.text;
    }
    setDraft(next);
  }, [configQuery.data?.clips]);

  const clips = configQuery.data?.clips ?? [];
  const byGroup = (group: string) =>
    clips.filter((c) => c.group === group);

  async function handleSave() {
    const payload: StaticClipItem[] = clips.map((c) => ({
      ...c,
      text: (draft[c.key] ?? c.text).trim(),
    }));
    for (const item of payload) {
      if (!item.text) {
        toast.error(`「${item.key}」文案不能为空`);
        return;
      }
    }
    try {
      await saveMutation.mutateAsync({ clips: payload });
      toast.success("静态话术已保存并重新生成缓存");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "保存失败");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">TTS 静态缓存</CardTitle>
            <CardDescription>
              配置默认开场白与垫句文案；保存后将按当前 TTS 引擎重新合成
              .bin 缓存。外呼活动未填写「开场白」时使用外呼默认开场白。
            </CardDescription>
          </div>
          <Button
            onClick={() => void handleSave()}
            disabled={saveMutation.isPending || configQuery.isLoading}
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            保存并刷新
          </Button>
        </CardHeader>
        <CardContent>
          {configQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : configQuery.data ? (
            <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">TTS 引擎</dt>
                <dd className="font-medium">{configQuery.data.tts_engine}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">编解码</dt>
                <dd className="font-medium">{configQuery.data.codec}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">发音人</dt>
                <dd className="font-medium">
                  {configQuery.data.volc_tts_voice || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">缓存就绪</dt>
                <dd>
                  <Badge
                    variant={
                      configQuery.data.cache_ready ? "secondary" : "destructive"
                    }
                  >
                    {configQuery.data.cache_ready ? "是" : "否"}
                  </Badge>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">指纹</dt>
                <dd className="break-all font-mono text-xs">
                  {configQuery.data.fingerprint_current}
                </dd>
              </div>
            </dl>
          ) : null}
        </CardContent>
      </Card>

      {(["greeting", "filler", "other"] as const).map((group) => {
        const items = byGroup(group);
        if (items.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-base">{GROUP_LABEL[group]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.key} className="space-y-2">
                  <Label htmlFor={`clip-${item.key}`}>{item.label}</Label>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                  <Textarea
                    id={`clip-${item.key}`}
                    rows={2}
                    value={draft[item.key] ?? item.text}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [item.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
