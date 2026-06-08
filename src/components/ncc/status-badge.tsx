import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  running: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  queued: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400",
  cancelled: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  inbound: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  outbound: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style =
    STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";

  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-normal", style, className)}
    >
      {label ?? status}
    </Badge>
  );
}

interface TagBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

export function TagBadge({ name, color = "#64748b", className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
