
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  useDeleteWikiPage,
  useIngestWikiUpload,
  useReloadWiki,
  useSaveWikiPage,
  useWikiLog,
  useWikiPage,
  useWikiPages,
} from "@/lib/queries";
import type { WikiCategory, WikiPageDetail } from "@/types/api";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIES: { value: WikiCategory; label: string }[] = [
  { value: "faq", label: "FAQ" },
  { value: "sop", label: "SOP" },
  { value: "policies", label: "政策" },
  { value: "products", label: "产品" },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

export default function WikiPage() {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pages");
  const fileRef = useRef<HTMLInputElement>(null);

  const pagesQuery = useWikiPages();
  const pageQuery = useWikiPage(selectedName);
  const logQuery = useWikiLog(activeTab === "log");

  const saveMutation = useSaveWikiPage();
  const deleteMutation = useDeleteWikiPage();
  const reloadMutation = useReloadWiki();
  const ingestMutation = useIngestWikiUpload();
  const [editCategory, setEditCategory] = useState<WikiCategory>("faq");
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const p = pageQuery.data;
    if (!p || p.name !== selectedName) return;
    setEditCategory(p.category);
    setEditSummary(p.summary);
    setEditContent(p.content);
  }, [pageQuery.data, selectedName]);

  const handleSave = async () => {
    if (!selectedName) return;
    try {
      await saveMutation.mutateAsync({
        name: selectedName,
        payload: {
          category: editCategory,
          summary: editSummary,
          content: editContent,
        },
      });
      toast.success("页面已保存");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "保存失败");
    }
  };

  const handleDelete = async () => {
    if (!selectedName) return;
    try {
      await deleteMutation.mutateAsync(selectedName);
      toast.success("页面已删除");
      setSelectedName(null);
      setEditContent("");
      setEditSummary("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "删除失败");
    }
  };

  const handleReload = async () => {
    try {
      const res = await reloadMutation.mutateAsync();
      toast.success(`索引已重载，共 ${res.page_count} 页`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "重载失败");
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const res = await ingestMutation.mutateAsync(file);
      toast.success(`摄入完成，写入 ${res.pages_written} 页`);
      void pagesQuery.refetch();
      void logQuery.refetch();
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "上传摄入失败";
      toast.error(message, { duration: 8000 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">业务知识库</h1>
          <p className="text-sm text-muted-foreground">
            管理 Wiki 页面与文档摄入
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleReload()}
            disabled={reloadMutation.isPending}
          >
            {reloadMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            重载索引
          </Button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".md,.txt,.html,.htm,.pdf,.doc,.docx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={ingestMutation.isPending}
          >
            {ingestMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            上传摄入
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pages">页面列表</TabsTrigger>
          <TabsTrigger value="log">摄入日志</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">全部页面</CardTitle>
                <CardDescription>
                  {pagesQuery.data
                    ? `共 ${pagesQuery.data.total} 页`
                    : "加载中…"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {pagesQuery.isLoading ? (
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : pagesQuery.isError ? (
                  <p className="p-4 text-sm text-destructive">加载失败</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>标题</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagesQuery.data?.items.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            暂无页面，请上传文档摄入
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagesQuery.data?.items.map((p) => (
                          <TableRow
                            key={p.name}
                            className={
                              selectedName === p.name
                                ? "bg-muted/50 cursor-pointer"
                                : "cursor-pointer"
                            }
                            onClick={() => setSelectedName(p.name)}
                          >
                            <TableCell className="font-mono text-xs">
                              {p.name}
                            </TableCell>
                            <TableCell>{p.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {CATEGORY_LABEL[p.category] ?? p.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {p.token_estimate}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4" />
                  {selectedName ? `编辑：${selectedName}` : "编辑器"}
                </CardTitle>
                <CardDescription>
                  {selectedName
                    ? "修改分类、摘要与 Markdown 正文"
                    : "从左侧选择页面进行编辑"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedName ? (
                  <p className="text-sm text-muted-foreground">
                    请选择左侧列表中的页面
                  </p>
                ) : pageQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : pageQuery.isError ? (
                  <p className="text-sm text-destructive">加载页面失败</p>
                ) : (
                  <WikiEditor
                    detail={pageQuery.data}
                    category={editCategory}
                    summary={editSummary}
                    content={editContent}
                    onCategoryChange={setEditCategory}
                    onSummaryChange={setEditSummary}
                    onContentChange={setEditContent}
                    onSave={() => void handleSave()}
                    onDelete={() => void handleDelete()}
                    saving={saveMutation.isPending}
                    deleting={deleteMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">摄入日志</CardTitle>
              <CardDescription>Wiki 文档摄入与处理记录</CardDescription>
            </CardHeader>
            <CardContent>
              {logQuery.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ScrollArea className="h-[480px] rounded-md border bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {logQuery.data?.log || "（暂无日志）"}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

function WikiEditor({
  detail,
  category,
  summary,
  content,
  onCategoryChange,
  onSummaryChange,
  onContentChange,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  detail?: WikiPageDetail;
  category: WikiCategory;
  summary: string;
  content: string;
  onCategoryChange: (v: WikiCategory) => void;
  onSummaryChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  return (
    <div className="space-y-4">
      {detail && (
        <p className="text-sm text-muted-foreground">
          {detail.title} · ~{detail.token_estimate} tokens
        </p>
      )}
      <div className="space-y-2">
        <Label>分类</Label>
        <Select
          value={category}
          onValueChange={(v) => onCategoryChange(v as WikiCategory)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>摘要</Label>
        <Input
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="索引一行描述"
        />
      </div>
      <div className="space-y-2">
        <Label>正文 (Markdown)</Label>
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={16}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          保存
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="size-4" />
              删除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作不可撤销，页面文件将从业务知识库中移除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
