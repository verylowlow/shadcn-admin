
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/call-format";
import { useCampaigns } from "@/lib/queries";
import { CampaignStatusBadge } from "@/lib/status-badges";
import type { CampaignStatus } from "@/types/api";
import { useState } from "react";

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "全部状态" },
  ...Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const status = statusFilter === "all" ? undefined : statusFilter;
  const { data, isLoading, error } = useCampaigns(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">外呼活动</h1>
          <p className="text-sm text-muted-foreground">
            批量外呼任务，支持草稿、启动与取消
          </p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new">
            <Plus className="size-4" />
            新建活动
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "加载失败"}
        </p>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>进度</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  暂无活动
                </TableCell>
              </TableRow>
            )}
            {data?.items?.map((c) => {
              const stats = c.stats ?? {};
              const total = stats.total ?? 0;
              const done = (stats.succeeded ?? 0) + (stats.failed ?? 0);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to="/campaigns/$id"
                      params={{ id: c.id }}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={c.status as CampaignStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {total > 0 ? `${done}/${total}` : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(c.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/campaigns/$id" params={{ id: c.id }}>详情</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
