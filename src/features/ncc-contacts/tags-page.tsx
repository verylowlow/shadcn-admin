
import { useState } from "react";
import { Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ncc/page-header";
import { ErrorState, TableSkeleton } from "@/components/ncc/loading-state";
import { TagBadge } from "@/components/ncc/status-badge";
import { ApiError } from "@/lib/api-client";
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from "@/lib/queries";
import type { Tag } from "@/types/api";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_COLOR = "#64748b";

function ColorPickerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value.startsWith("#") ? value : DEFAULT_COLOR}
        onChange={(e) => onChange(e.target.value)}
        className="size-10 cursor-pointer rounded-md border bg-transparent p-1"
        aria-label="选择颜色"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#64748b"
        className="font-mono"
      />
      <TagBadge name="预览" color={value || DEFAULT_COLOR} />
    </div>
  );
}

export default function TagsPage() {
  const tagsQuery = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  const resetForm = () => {
    setName("");
    setColor(DEFAULT_COLOR);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setName(tag.name);
    setColor(tag.color || DEFAULT_COLOR);
    setEditTag(tag);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("标签名称不能为空");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        color: color || DEFAULT_COLOR,
      });
      toast.success("标签已创建");
      setCreateOpen(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "创建失败");
    }
  };

  const handleUpdate = async () => {
    if (!editTag || !name.trim()) {
      toast.error("标签名称不能为空");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editTag.id,
        name: name.trim(),
        color: color || DEFAULT_COLOR,
      });
      toast.success("标签已更新");
      setEditTag(null);
      resetForm();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "更新失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteTag) return;
    try {
      await deleteMutation.mutateAsync(deleteTag.id);
      toast.success("标签已删除");
      setDeleteTag(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "删除失败");
    }
  };

  const dialogOpen = createOpen || Boolean(editTag);
  const isEdit = Boolean(editTag);

  return (
    <div className="space-y-6">
      <PageHeader title="标签管理" description="为通讯录分类，支持自定义颜色">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新建标签
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="size-4" />
            全部标签
          </CardTitle>
          <CardDescription>
            共 {tagsQuery.data?.items.length ?? 0} 个标签
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tagsQuery.isLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : tagsQuery.isError ? (
            <ErrorState
              message="无法加载标签列表"
              onRetry={() => void tagsQuery.refetch()}
            />
          ) : tagsQuery.data?.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">还没有标签</p>
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                创建第一个标签
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>预览</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="hidden sm:table-cell">颜色</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tagsQuery.data?.items.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <TagBadge
                        name={tag.name}
                        color={tag.color || DEFAULT_COLOR}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell className="hidden font-mono text-sm text-muted-foreground sm:table-cell">
                      {tag.color || DEFAULT_COLOR}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="编辑"
                          onClick={() => openEdit(tag)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="删除"
                          onClick={() => setDeleteTag(tag)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditTag(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "编辑标签" : "新建标签"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tag-name">名称</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VIP"
                maxLength={32}
              />
            </div>
            <div className="space-y-2">
              <Label>颜色</Label>
              <ColorPickerInput value={color} onChange={setColor} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditTag(null);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button
              disabled={createMutation.isPending || updateMutation.isPending}
              onClick={() =>
                void (isEdit ? handleUpdate() : handleCreate())
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {isEdit ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTag)}
        onOpenChange={(open) => !open && setDeleteTag(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除标签「{deleteTag?.name}」。已关联的通讯录条目不会删除，但会失去此标签。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDelete()}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
