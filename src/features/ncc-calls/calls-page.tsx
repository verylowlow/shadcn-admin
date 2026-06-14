
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ncc/page-header";
import { ErrorState, TableSkeleton } from "@/components/ncc/loading-state";
import { StatusBadge } from "@/components/ncc/status-badge";
import { useCallsList } from "@/lib/queries";
import { formatDateTime } from "@/lib/call-format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

const DIRECTION_OPTIONS = [
  { value: "all", label: "全部方向" },
  { value: "inbound", label: "呼入" },
  { value: "outbound", label: "呼出" },
];

export default function CallsPage() {
  const [direction, setDirection] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useCallsList({
    direction: direction === "all" ? undefined : direction,
    page,
    size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="话务流水"
        description="查看历史与进行中的话务流水"
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">话务流水列表</CardTitle>
            <CardDescription>
              {data ? `共 ${data.total} 条记录` : "加载中…"}
            </CardDescription>
          </div>
          <Select
            value={direction}
            onValueChange={(v) => {
              setDirection(v ?? "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="方向筛选" />
            </SelectTrigger>
            <SelectContent>
              {DIRECTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={7} />
            </div>
          ) : isError ? (
            <ErrorState
              message="无法加载话务流水"
              onRetry={() => void refetch()}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>对方</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="hidden md:table-cell">开始时间</TableHead>
                    <TableHead className="text-right">时长</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted-foreground"
                      >
                        暂无话务流水
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.items.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="max-w-[160px] truncate font-medium">
                          {call.peer_display || call.from_uri || call.id.slice(0, 12)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={call.direction}
                            label={call.direction_label}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={call.status}
                            label={call.status_label}
                          />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {formatDateTime(call.started_at) ||
                            call.started_at_display ||
                            "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {call.duration_display}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/calls/$id" params={{ id: call.id }}>详情</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 页
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      下一页
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
