
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import { INDUSTRY_LABELS } from "@/lib/constants";
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplates,
} from "@/lib/queries";
import { IndustryBadge } from "@/lib/status-badges";
import { INDUSTRY_OPTIONS, type Industry } from "@/types/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaticClipsPanel } from "@/components/ncc/static-clips-panel";

export default function TemplatesPage() {
  const [mainTab, setMainTab] = useState("templates");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createIndustry, setCreateIndustry] = useState<Industry>("education");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const { data, isLoading, error } = useTemplates();
  const createMutation = useCreateTemplate();
  const deleteMutation = useDeleteTemplate();

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (industryFilter === "all") return items;
    return items.filter((t) => t.industry === industryFilter);
  }, [data?.items, industryFilter]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const industry = createIndustry;
    const content = String(fd.get("content") ?? "");
    if (!name || !industry) {
      toast.error("请填写名称和行业");
      return;
    }
    try {
      await createMutation.mutateAsync({ name, industry, content });
      toast.success("模板已创建");
      setCreateOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "创建失败");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("模板已删除");
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "删除失败");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">话术模板</h1>
          <p className="text-sm text-muted-foreground">
            管理话术模板与 TTS 静态开场白/垫句缓存
          </p>
        </div>
        {mainTab === "templates" ? (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              新建模板
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新建话术模板</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input id="name" name="name" required placeholder="例如：教育续费话术" />
              </div>
              <div className="space-y-2">
                <Label>行业</Label>
                <Select
                  value={createIndustry}
                  onValueChange={(v) => v && setCreateIndustry(v as Industry)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择行业" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {INDUSTRY_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">内容（Markdown / 纯文本）</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={6}
                  placeholder="在此输入模板正文，也可创建后上传文件"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中…" : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        ) : null}
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="templates">话术模板</TabsTrigger>
          <TabsTrigger value="tts-cache">TTS 缓存</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-6">
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">行业筛选</Label>
        <Select
          value={industryFilter}
          onValueChange={(v) => v && setIndustryFilter(v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {INDUSTRY_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {INDUSTRY_LABELS[opt]}
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
              <TableHead>行业</TableHead>
              <TableHead>来源文件</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  暂无模板
                </TableCell>
              </TableRow>
            )}
            {filtered.map((tpl) => (
              <TableRow key={tpl.id}>
                <TableCell>
                  <Link
                    to="/templates/$id"
                    params={{ id: tpl.id }}
                    className="font-medium hover:underline"
                  >
                    {tpl.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <IndustryBadge industry={tpl.industry} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {tpl.source_file || (tpl.content?.trim() ? "内联内容" : "—")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/templates/$id" params={{ id: tpl.id }}>编辑</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteId(tpl.id);
                        setDeleteName(tpl.name);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除模板？</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除「{deleteName}」。若仍有外呼活动引用此模板，删除将被拒绝。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "删除中…" : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </TabsContent>

        <TabsContent value="tts-cache" className="mt-4">
          <StaticClipsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
