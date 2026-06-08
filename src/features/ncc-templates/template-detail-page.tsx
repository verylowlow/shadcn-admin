
import { Link } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import { INDUSTRY_LABELS } from "@/lib/constants";
import {
  queryKeys,
  uploadTemplateFile,
  useTemplate,
  useUpdateTemplate,
} from "@/lib/queries";
import { INDUSTRY_OPTIONS, type Industry } from "@/types/api";

export function TemplateDetailClient() {
  const params = useParams({ from: '/_authenticated/templates/$id' });
  const id = params.id;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useTemplate(id);
  const updateMutation = useUpdateTemplate(id);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<Industry>("custom");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setIndustry(
      INDUSTRY_OPTIONS.includes(data.industry as Industry)
        ? (data.industry as Industry)
        : "custom",
    );
    setContent(data.content ?? "");
  }, [data]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("名称不能为空");
      return;
    }
    try {
      await updateMutation.mutateAsync({ name, industry, content });
      toast.success("已保存");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "保存失败");
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      await uploadTemplateFile(id, file);
      await qc.invalidateQueries({ queryKey: queryKeys.template(id) });
      toast.success("文件已上传");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/templates">
            <ArrowLeft className="size-4" />
            返回列表
          </Link>
        </Button>
        <p className="text-destructive">
          {error instanceof Error ? error.message : "模板不存在"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/templates">
              <ArrowLeft className="size-4" />
              话术模板
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          {data.source_file && (
            <p className="text-sm text-muted-foreground">
              来源文件：{data.source_file}
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="size-4" />
          {updateMutation.isPending ? "保存中…" : "保存"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">名称</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>行业</Label>
              <Select
                value={industry}
                onValueChange={(v) => v && setIndustry(v as Industry)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
              <Label>上传文件覆盖内容</Label>
              <p className="text-xs text-muted-foreground">
                支持 .md、.txt、.html
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt,.html,.htm"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" />
                {uploading ? "上传中…" : "选择文件"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模板内容</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="edit">
              <TabsList>
                <TabsTrigger value="edit">编辑</TabsTrigger>
                <TabsTrigger value="preview">预览</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={18}
                  className="font-mono text-sm"
                  placeholder="System Prompt 正文"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <div className="min-h-[360px] rounded-md border bg-muted/30 p-4">
                  {content.trim() ? (
                    <pre className="whitespace-pre-wrap text-sm">{content}</pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无内容</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
