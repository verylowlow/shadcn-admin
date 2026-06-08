
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Plus, Search, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ncc/page-header";
import { Pagination } from "@/components/ncc/pagination";
import { ErrorState, TableSkeleton } from "@/components/ncc/loading-state";
import { TagBadge, StatusBadge } from "@/components/ncc/status-badge";
import { ApiError } from "@/lib/api-client";
import {
  useContacts,
  useCreateContact,
  useImportContacts,
  useTags,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const tagsQuery = useTags();
  const contactsQuery = useContacts({
    q,
    tag: tagFilter ? [tagFilter] : undefined,
    page,
    size: PAGE_SIZE,
  });
  const createMutation = useCreateContact();
  const importMutation = useImportContacts();

  const tagColorMap = Object.fromEntries(
    (tagsQuery.data?.items ?? []).map((t) => [t.name, t.color]),
  );

  const handleSearch = () => {
    setQ(searchInput.trim());
    setPage(1);
  };

  const resetCreateForm = () => {
    setName("");
    setPhone("");
    setMemo("");
    setSelectedTags([]);
  };

  const handleCreate = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("姓名和电话不能为空");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        tags: selectedTags,
        memo: memo.trim(),
      });
      toast.success("联系人已创建");
      setCreateOpen(false);
      resetCreateForm();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "创建失败");
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importMutation.mutateAsync(file);
      toast.success(`已导入 ${result.imported} 条联系人`);
      setPage(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "导入失败");
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="通讯录"
        description="管理通讯录条目、标签筛选与批量导入"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          disabled={importMutation.isPending}
          onClick={() => fileRef.current?.click()}
        >
          {importMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          导入 CSV/Excel
        </Button>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              新建联系人
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>新建联系人</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="create-name">姓名</Label>
                <Input
                  id="create-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="张三"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">电话</Label>
                <Input
                  id="create-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="13800138000"
                />
              </div>
              <div className="space-y-2">
                <Label>标签</Label>
                <div className="flex flex-wrap gap-2">
                  {(tagsQuery.data?.items ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      暂无标签，请先在标签管理中添加
                    </p>
                  ) : (
                    tagsQuery.data?.items.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`rounded-md px-2 py-1 text-xs transition-opacity ${
                          selectedTags.includes(tag.name)
                            ? "ring-2 ring-primary ring-offset-1"
                            : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        <TagBadge name={tag.name} color={tag.color} />
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-memo">备注</Label>
                <Textarea
                  id="create-memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button
                disabled={createMutation.isPending}
                onClick={() => void handleCreate()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">筛选</CardTitle>
          <CardDescription>按姓名、电话或标签搜索</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="搜索姓名或电话…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select
              value={tagFilter || "__all__"}
              onValueChange={(v) => {
                if (!v) return;
                setTagFilter(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="全部标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部标签</SelectItem>
                {(tagsQuery.data?.items ?? []).map((tag) => (
                  <SelectItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {contactsQuery.isLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : contactsQuery.isError ? (
            <ErrorState
              message="无法加载通讯录"
              onRetry={() => void contactsQuery.refetch()}
            />
          ) : contactsQuery.data?.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">通讯录为空</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                添加第一位联系人
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead className="hidden md:table-cell">备注</TableHead>
                    <TableHead className="text-right">话务统计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsQuery.data?.items.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Link
                          to="/contacts/$id"
                          params={{ id: contact.id }}
                          className="font-medium hover:underline"
                        >
                          {contact.name}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {contact.phone}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : (
                            contact.tags.map((t) => (
                              <TagBadge
                                key={t}
                                name={t}
                                color={tagColorMap[t] ?? "#64748b"}
                              />
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell text-muted-foreground">
                        {contact.memo || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <StatusBadge
                            status="inbound"
                            label={`呼入 ${contact.call_inbound ?? 0}`}
                          />
                          <StatusBadge
                            status="outbound"
                            label={`呼出 ${contact.call_outbound ?? 0}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {contactsQuery.data ? (
                <Pagination
                  className="mt-4"
                  page={contactsQuery.data.page}
                  size={contactsQuery.data.size}
                  total={contactsQuery.data.total}
                  onPageChange={setPage}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
