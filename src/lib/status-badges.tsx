"use client";

import { Badge } from "@/components/ui/badge";
import {
  CAMPAIGN_ITEM_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  INDUSTRY_LABELS,
} from "@/lib/constants";
import type { CampaignItemStatus, CampaignStatus } from "@/types/api";
import { INDUSTRY_OPTIONS, type Industry } from "@/types/api";

export function industryLabel(industry: string): string {
  if (INDUSTRY_OPTIONS.includes(industry as Industry)) {
    return INDUSTRY_LABELS[industry as Industry];
  }
  return industry;
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const variant =
    status === "running" || status === "queued"
      ? "default"
      : status === "completed"
        ? "secondary"
        : status === "cancelled"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{CAMPAIGN_STATUS_LABELS[status] ?? status}</Badge>;
}

export function CampaignItemStatusBadge({ status }: { status: CampaignItemStatus }) {
  const variant =
    status === "succeeded"
      ? "secondary"
      : status === "failed"
        ? "destructive"
        : status === "calling"
          ? "default"
          : "outline";

  return (
    <Badge variant={variant}>
      {CAMPAIGN_ITEM_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function IndustryBadge({ industry }: { industry: string }) {
  return <Badge variant="outline">{industryLabel(industry)}</Badge>;
}
