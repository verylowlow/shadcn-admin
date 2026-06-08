"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredAuth } from "@/lib/api-client";
import type { CallEvent } from "@/types/api";

export type CallEventsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

function getWsBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const customHost = import.meta.env.VITE_WS_HOST;
  if (customHost) {
    return `${protocol}//${customHost}`;
  }
  // Dev: Next.js on :3000, WebSocket served by FastAPI on :8080
  if (
    import.meta.env.MODE === "development" &&
    window.location.port === "5173"
  ) {
    return `${protocol}//${window.location.hostname}:8080`;
  }
  return `${protocol}//${window.location.host}`;
}

export function useCallEvents(callId: string | null, enabled: boolean) {
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [status, setStatus] =
    useState<CallEventsConnectionStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (!enabled || !callId) {
      setStatus("idle");
      return;
    }

    const auth = getStoredAuth();
    if (!auth) {
      setStatus("error");
      return;
    }

    const base = getWsBaseUrl();
    const url = `${base}/admin/ws/call/${encodeURIComponent(callId)}/events?auth=${encodeURIComponent(auth)}`;

    setStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as CallEvent;
        if (data.type === "ping") return;
        setEvents((prev) => [...prev.slice(-199), data]);
      } catch {
        // ignore malformed payloads
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [callId, enabled]);

  return { events, status, clearEvents };
}
