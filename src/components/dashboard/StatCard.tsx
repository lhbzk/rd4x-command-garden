import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  hint,
  invertDelta,
  loading,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | undefined;
  icon?: LucideIcon;
  hint?: string | undefined;
  /** When true, a negative delta is good (e.g. open tickets going down). */
  invertDelta?: boolean;
  loading?: boolean | undefined;
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  const good = invertDelta ? !positive : positive;
  return (
    <div className={cn("surface-card group relative overflow-hidden p-4 sm:p-5 fade-up", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground sm:text-[13px]">{label}</p>
        {Icon && (
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground transition-colors group-hover:text-primary">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ) : (
        <>
          <div className="mt-2 text-xl font-semibold tracking-tight tabular sm:text-2xl">{value}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium tabular",
                  good ? "text-success" : "text-danger",
                )}
              >
                {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(delta)}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        </>
      )}
    </div>
  );
}
