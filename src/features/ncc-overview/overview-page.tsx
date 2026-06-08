
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Phone,
  Target,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ncc/page-header";
import { ErrorState, TableSkeleton } from "@/components/ncc/loading-state";
import { StatusBadge } from "@/components/ncc/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  useDashboardActiveCampaigns,
  useDashboardRecentCalls,
  useDashboardStats,
} from "@/lib/queries";

const STAT_CARDS = [
  {
    key: "total_calls" as const,
    label: "话务流水总数",
    icon: Phone,
    description: "历史累计话务流水",
  },
  {
    key: "total_contacts" as const,
    label: "通讯录",
    icon: Users,
    description: "通讯录人数",
  },
  {
    key: "active_campaigns" as const,
    label: "进行中活动",
    icon: Target,
    description: "运行中 + 排队中",
  },
  {
    key: "running_campaigns" as const,
    label: "运行中",
    icon: Activity,
    description: "正在外呼的活动",
  },
];

export default function DashboardPage() {
  const stats = useDashboardStats();
  const recentCalls = useDashboardRecentCalls(5);
  const activeCampaigns = useDashboardActiveCampaigns(5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="仪表盘"
        description="话务流水统计、最近话务与进行中的外呼活动概览"
      />

      {stats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map(({ key }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardDescription>—</CardDescription>
                <CardTitle className="text-3xl tabular-nums">—</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : stats.isError ? (
        <ErrorState
          message="无法加载统计数据"
          onRetry={() => void stats.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, description }) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>{label}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-3xl tabular-nums">
                  {stats.data?.[key]?.toLocaleString() ?? "0"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{description}</p>
                {key === "active_campaigns" && stats.data ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    排队 {stats.data.queued_campaigns} 个
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">最近话务流水</CardTitle>
              <CardDescription>最近 5 条话务流水</CardDescription>
            </div>
            <Link to="/calls">
              <Button variant="outline" size="sm">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCalls.isLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : recentCalls.isError ? (
              <ErrorState
                message="无法加载最近话务流水"
                onRetry={() => void recentCalls.refetch()}
              />
            ) : recentCalls.data?.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                暂无话务流水
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>对方</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">时长</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCalls.data?.items.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="max-w-[140px] truncate font-medium">
                        {call.peer_display}
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
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {call.duration_display}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">进行中活动</CardTitle>
              <CardDescription>运行中或排队中的外呼活动</CardDescription>
            </div>
            <Link to="/campaigns">
              <Button variant="outline" size="sm">
                查看全部
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeCampaigns.isLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : activeCampaigns.isError ? (
              <ErrorState
                message="无法加载活动列表"
                onRetry={() => void activeCampaigns.refetch()}
              />
            ) : activeCampaigns.data?.items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                暂无进行中的活动
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">进度</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCampaigns.data?.items.map((campaign) => {
                    const done = campaign.succeeded + campaign.failed;
                    const progress =
                      campaign.total > 0
                        ? Math.round((done / campaign.total) * 100)
                        : 0;
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="max-w-[160px] truncate font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {campaign.succeeded}/{campaign.total}
                          <span className="ml-1 text-xs">({progress}%)</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
