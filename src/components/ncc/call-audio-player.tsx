"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE, getStoredAuth } from "@/lib/api-client";
import type { CallRecord } from "@/types/api";

interface CallAudioPlayerProps {
  call: CallRecord;
}

export function CallAudioPlayer({ call }: CallAudioPlayerProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setError(null);
      setSrc(null);

      if (call.audio_oss_url && !call.audio_local_path) {
        setSrc(call.audio_oss_url);
        return;
      }

      if (!call.audio_local_path && !call.audio_oss_url) {
        setError("暂无录音");
        return;
      }

      setLoading(true);
      try {
        const auth = getStoredAuth();
        const headers: HeadersInit = {};
        if (auth) headers.Authorization = `Basic ${auth}`;

        const res = await fetch(
          `${API_BASE}/calls/${encodeURIComponent(call.id)}/audio/stream`,
          { headers },
        );

        if (!res.ok) {
          if (call.audio_oss_url) {
            setSrc(call.audio_oss_url);
            return;
          }
          throw new Error(`加载失败 (${res.status})`);
        }

        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "录音加载失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [call.id, call.audio_local_path, call.audio_oss_url]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        加载录音…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  if (!src) return null;

  return (
    <audio controls className="w-full max-w-md" src={src} preload="metadata">
      您的浏览器不支持音频播放
    </audio>
  );
}
