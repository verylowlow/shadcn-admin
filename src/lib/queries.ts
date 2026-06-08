"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiFetch, getStoredAuth, API_BASE } from "@/lib/api-client";
import type {
  AdminSettings,
  AdminSettingsSaveResponse,
  AgentCreatePayload,
  AgentKindsResponse,
  AgentListResponse,
  AgentProfile,
  AgentUpdatePayload,
  InboundSettings,
  InboundSettingsSaveResponse,
  CampaignCreatePayload,
  CampaignDetailResponse,
  CampaignListResponse,
  CampaignSummary,
  Contact,
  ContactCreateInput,
  ContactImportResult,
  ContactListResponse,
  ContactUpdateInput,
  DashboardActiveCampaigns,
  DashboardRecentCalls,
  DashboardStats,
  Tag,
  TagCreateInput,
  TagListResponse,
  TagUpdateInput,
  Template,
  TemplateCreatePayload,
  TemplateListResponse,
  TemplateUpdatePayload,
  StaticClipsConfigResponse,
  StaticClipsSavePayload,
  StaticClipsSaveResponse,
  CallDetailResponse,
  CallListResponse,
  CallMetricsSummaryResponse,
  CallRecord,
  WikiIngestResponse,
  WikiLogResponse,
  WikiPageDetail,
  WikiPageListResponse,
  WikiPageSavePayload,
  WikiRefreshClipsResponse,
  WikiReloadResponse,
  WikiTtsInfoResponse,
} from "@/types/api";

export type ContactListParams = {
  q?: string;
  tag?: string[];
  page?: number;
  size?: number;
};

function buildQuery(
  params: Record<string, string | number | string[] | undefined>,
) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, v);
    } else {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const queryKeys = {
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    recentCalls: (size: number) => ["dashboard", "recent-calls", size] as const,
    activeCampaigns: (size: number) =>
      ["dashboard", "active-campaigns", size] as const,
  },
  templates: ["templates"] as const,
  template: (id: string) => ["templates", id] as const,
  staticClips: ["templates", "static-clips"] as const,
  campaigns: (status?: string) => ["campaigns", status ?? "all"] as const,
  campaign: (id: string) => ["campaigns", id] as const,
  agents: ["agents"] as const,
  agentKinds: ["agents", "kinds"] as const,
  contacts: (params?: ContactListParams) => ["contacts", params ?? {}] as const,
  contact: (id: string) => ["contacts", "detail", id] as const,
  settings: ["settings"] as const,
  inboundSettings: ["inbound-settings"] as const,
  tags: ["tags"] as const,
  wiki: {
    pages: ["wiki", "pages"] as const,
    page: (name: string) => ["wiki", "pages", name] as const,
    log: ["wiki", "log"] as const,
    ttsInfo: ["wiki", "tts-info"] as const,
  },
  calls: {
    list: (params: { direction?: string; page: number }) =>
      ["calls", "list", params] as const,
    detail: (id: string) => ["calls", id] as const,
    metrics: (id: string) => ["calls", id, "metrics"] as const,
  },
};

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: () => apiFetch<TemplateListResponse>("/templates"),
  });
}

export function useTemplate(
  id: string,
  options?: Omit<UseQueryOptions<Template>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.template(id),
    queryFn: () => apiFetch<Template>(`/templates/${id}`),
    enabled: Boolean(id) && id !== "placeholder",
    ...options,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TemplateCreatePayload) =>
      apiFetch<{ id: string }>("/templates", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}

export function useUpdateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TemplateUpdatePayload) =>
      apiFetch<{ id: string; ok: boolean }>(`/templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.templates });
      qc.invalidateQueries({ queryKey: queryKeys.template(id) });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.templates }),
  });
}

export function useStaticClipsConfig() {
  return useQuery({
    queryKey: queryKeys.staticClips,
    queryFn: () =>
      apiFetch<StaticClipsConfigResponse>("/templates/static-clips"),
  });
}

export function useSaveStaticClips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StaticClipsSavePayload) =>
      apiFetch<StaticClipsSaveResponse>("/templates/static-clips", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.staticClips });
    },
  });
}

export async function uploadTemplateFile(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<{ ok: boolean; chars: number }>(`/templates/${id}/upload`, {
    method: "POST",
    body: formData,
  });
}

export function useCampaigns(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return useQuery({
    queryKey: queryKeys.campaigns(status),
    queryFn: () => apiFetch<CampaignListResponse>(`/campaigns${qs}`),
  });
}

export function useCampaign(
  id: string,
  options?: Omit<UseQueryOptions<CampaignDetailResponse>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.campaign(id),
    queryFn: () => apiFetch<CampaignDetailResponse>(`/campaigns/${id}`),
    enabled: Boolean(id) && id !== "placeholder",
    ...options,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CampaignCreatePayload) =>
      apiFetch<CampaignSummary>("/campaigns", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.campaigns() }),
  });
}

export function useStartCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean; status: string }>(`/campaigns/${id}/start`, {
        method: "POST",
      }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.campaigns() });
      qc.invalidateQueries({ queryKey: queryKeys.campaign(id) });
    },
  });
}

export function useCancelCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/campaigns/${id}/cancel`, { method: "POST" }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.campaigns() });
      qc.invalidateQueries({ queryKey: queryKeys.campaign(id) });
    },
  });
}

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => apiFetch<AgentListResponse>("/agents"),
  });
}

export function useAgentKinds() {
  return useQuery({
    queryKey: queryKeys.agentKinds,
    queryFn: () => apiFetch<AgentKindsResponse>("/agents/kinds"),
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AgentCreatePayload) =>
      apiFetch<AgentProfile>("/agents", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents }),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AgentUpdatePayload }) =>
      apiFetch<AgentProfile>(`/agents/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/agents/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents }),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => apiFetch<DashboardStats>("/dashboard/stats"),
  });
}

export function useDashboardRecentCalls(size = 5) {
  return useQuery({
    queryKey: queryKeys.dashboard.recentCalls(size),
    queryFn: () =>
      apiFetch<DashboardRecentCalls>(`/dashboard/recent-calls?size=${size}`),
  });
}

export function useDashboardActiveCampaigns(size = 5) {
  return useQuery({
    queryKey: queryKeys.dashboard.activeCampaigns(size),
    queryFn: () =>
      apiFetch<DashboardActiveCampaigns>(
        `/dashboard/active-campaigns?size=${size}`,
      ),
  });
}

export function useContacts(
  params?: ContactListParams,
  options?: Pick<UseQueryOptions<ContactListResponse>, "enabled">,
) {
  const qs = buildQuery({
    q: params?.q,
    tag: params?.tag,
    page: params?.page ?? 1,
    size: params?.size ?? 20,
  });
  return useQuery({
    queryKey: queryKeys.contacts(params),
    queryFn: () => apiFetch<ContactListResponse>(`/contacts${qs}`),
    enabled: options?.enabled ?? true,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contact(id),
    queryFn: () => apiFetch<Contact>(`/contacts/${id}`),
    enabled: Boolean(id) && id !== "placeholder",
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ContactCreateInput) =>
      apiFetch<Contact>("/contacts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ContactUpdateInput) =>
      apiFetch<Contact>(`/contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.contact(id), data);
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useImportContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const auth = getStoredAuth();
      const headers = new Headers({ Accept: "application/json" });
      if (auth) headers.set("Authorization", `Basic ${auth}`);
      const res = await fetch(`${API_BASE}/contacts/import`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          typeof body === "object" &&
          body !== null &&
          "detail" in body &&
          typeof (body as { detail: unknown }).detail === "string"
            ? (body as { detail: string }).detail
            : res.statusText;
        throw new Error(msg);
      }
      return res.json() as Promise<ContactImportResult>;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useSettings(
  options?: Omit<UseQueryOptions<AdminSettings>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiFetch<AdminSettings>("/settings"),
    ...options,
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<AdminSettings>) =>
      apiFetch<AdminSettingsSaveResponse>("/settings", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.settings, data.effective);
    },
  });
}

export function useInboundSettings() {
  return useQuery({
    queryKey: queryKeys.inboundSettings,
    queryFn: () => apiFetch<InboundSettings>("/inbound-settings"),
  });
}

export function useSaveInboundSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<InboundSettings>) =>
      apiFetch<InboundSettingsSaveResponse>("/inbound-settings", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.inboundSettings, data.effective);
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => apiFetch<TagListResponse>("/tags"),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TagCreateInput) =>
      apiFetch<Tag>("/tags", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: TagUpdateInput & { id: string }) =>
      apiFetch<Tag>(`/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/tags/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tags });
    },
  });
}

export async function fetchContactIdsByTag(tag: string) {
  return apiFetch<{ contact_ids: string[]; count: number }>(
    `/contacts/ids-by-tags?tag=${encodeURIComponent(tag)}`,
  );
}

export async function fetchContactsByTag(tag: string) {
  return apiFetch<ContactListResponse>(
    `/contacts${buildQuery({ tag: [tag], page: 1, size: 100 })}`,
  );
}

export function useWikiPages() {
  return useQuery({
    queryKey: queryKeys.wiki.pages,
    queryFn: () => apiFetch<WikiPageListResponse>("/wiki/pages"),
  });
}

export function useWikiPage(name: string | null) {
  return useQuery({
    queryKey: queryKeys.wiki.page(name ?? ""),
    queryFn: () =>
      apiFetch<WikiPageDetail>(`/wiki/pages/${encodeURIComponent(name!)}`),
    enabled: Boolean(name),
  });
}

export function useWikiLog(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wiki.log,
    queryFn: () => apiFetch<WikiLogResponse>("/wiki/log"),
    enabled,
  });
}

export function useWikiTtsInfo(enabled = true) {
  return useQuery({
    queryKey: queryKeys.wiki.ttsInfo,
    queryFn: () => apiFetch<WikiTtsInfoResponse>("/wiki/tts-info"),
    enabled,
  });
}

export function useSaveWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      payload,
    }: {
      name: string;
      payload: WikiPageSavePayload;
    }) =>
      apiFetch<{ ok: boolean; name: string }>(
        `/wiki/pages/${encodeURIComponent(name)}`,
        { method: "PUT", body: JSON.stringify(payload) },
      ),
    onSuccess: (_data, { name }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.wiki.pages });
      void qc.invalidateQueries({ queryKey: queryKeys.wiki.page(name) });
    },
  });
}

export function useDeleteWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<{ ok: boolean }>(`/wiki/pages/${encodeURIComponent(name)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.wiki.pages });
    },
  });
}

export function useReloadWiki() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<WikiReloadResponse>("/wiki/reload", { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.wiki.pages });
    },
  });
}

export function useIngestWikiUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch<WikiIngestResponse>("/wiki/ingest-upload", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.wiki.pages });
      void qc.invalidateQueries({ queryKey: queryKeys.wiki.log });
    },
  });
}

export function useRefreshStaticClips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<WikiRefreshClipsResponse>("/wiki/refresh-static-clips", {
        method: "POST",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.wiki.ttsInfo });
    },
  });
}

export function useCallsList(params: {
  direction?: string;
  page: number;
  size?: number;
}) {
  const { direction, page, size = 20 } = params;
  const qs = buildQuery({ direction, page, size });
  return useQuery({
    queryKey: queryKeys.calls.list({ direction, page }),
    queryFn: () => apiFetch<CallListResponse>(`/calls${qs}`),
  });
}

export function useCallDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.calls.detail(id),
    queryFn: () =>
      apiFetch<CallDetailResponse>(`/calls/${encodeURIComponent(id)}`),
    enabled: Boolean(id) && id !== "placeholder",
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.call.status === "running") return 5000;
      return false;
    },
  });
}

export function useCallMetrics(id: string) {
  return useQuery({
    queryKey: queryKeys.calls.metrics(id),
    queryFn: () =>
      apiFetch<CallMetricsSummaryResponse>(
        `/calls/${encodeURIComponent(id)}/metrics`,
      ),
    enabled: Boolean(id) && id !== "placeholder",
  });
}

export function hasAudio(call: CallRecord): boolean {
  return Boolean(call.audio_local_path || call.audio_oss_url);
}
