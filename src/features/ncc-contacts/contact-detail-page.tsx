
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ncc/page-header";
import { ErrorState, LoadingState } from "@/components/ncc/loading-state";
import { TagBadge, StatusBadge } from "@/components/ncc/status-badge";
import { ApiError } from "@/lib/api-client";
import {
  useContact,
  useDeleteContact,
  useTags,
  useUpdateContact,
} from "@/lib/queries";
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
import { Textarea } from "@/components/ui/textarea";

export function ContactDetailClient() {
  const params = useParams({ from: '/_authenticated/contacts/$id' });
  const id = params.id;
  const navigate = useNavigate();

  const contactQuery = useContact(id);
  const tagsQuery = useTags();
  const updateMutation = useUpdateContact(id);
  const deleteMutation = useDeleteContact();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [conversationSummary, setConversationSummary] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!contactQuery.data) return;
    const c = contactQuery.data;
    setName(c.name);
    setPhone(c.phone);
    setMemo(c.memo);
    setConversationSummary(c.conversation_summary ?? "");
    setSelectedTags(c.tags);
    setDirty(false);
  }, [contactQuery.data]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
    setDirty(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("姓名和电话不能为空");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        tags: selectedTags,
        memo,
        conversation_summary: conversationSummary,
      });
      toast.success("联系人已保存");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "保存失败");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("联系人已删除");
      void navigate({ to: '/contacts' });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "删除失败");
    }
  };

  if (contactQuery.isLoading) {
    return <LoadingState message="加载通讯录详情…" />;
  }

  if (contactQuery.isError || !contactQuery.data) {
    return (
      <ErrorState
        message="通讯录条目不存在或加载失败"
        onRetry={() => void contactQuery.refetch()}
      />
    );
  }

  const contact = contactQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader title="通讯录详情" description={`ID: ${contact.id}`}>
        <Link to="/contacts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4" />
            返回列表
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="size-4" />
              删除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除联系人？</AlertDialogTitle>
              <AlertDialogDescription>
                将永久删除「{contact.name}」（{contact.phone}），此操作不可撤销。
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
        <Button
          disabled={updateMutation.isPending || !dirty}
          onClick={() => void handleSave()}
        >
          {updateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          保存
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>编辑通讯录条目资料</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2">
                {(tagsQuery.data?.items ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    暂无标签，
                    <Link to="/contacts/tags" className="text-primary hover:underline">
                      去添加
                    </Link>
                  </p>
                ) : (
                  tagsQuery.data?.items.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={`rounded-md transition-opacity ${
                        selectedTags.includes(tag.name)
                          ? "ring-2 ring-primary ring-offset-1"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <TagBadge name={tag.name} color={tag.color} />
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="memo">备注</Label>
              <Textarea
                id="memo"
                value={memo}
                rows={3}
                onChange={(e) => {
                  setMemo(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="summary">对话摘要</Label>
              <Textarea
                id="summary"
                value={conversationSummary}
                rows={5}
                placeholder="AI 生成的对话摘要，可手动编辑"
                onChange={(e) => {
                  setConversationSummary(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>话务统计</CardTitle>
            <CardDescription>该条目的历史话务流水</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">总话务</span>
              <span className="text-2xl font-semibold tabular-nums">
                {contact.call_total ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">呼入</span>
              <StatusBadge
                status="inbound"
                label={`${contact.call_inbound ?? 0} 次`}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm text-muted-foreground">呼出</span>
              <StatusBadge
                status="outbound"
                label={`${contact.call_outbound ?? 0} 次`}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
