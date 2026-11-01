import { AlertTriangle, Inbox, RotateCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center fade-up", className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
        <span className="relative inline-flex size-12 items-center justify-center rounded-2xl border border-border-strong bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this data",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "surface-card flex flex-col items-center justify-center px-6 py-12 text-center fade-up",
        className,
      )}
    >
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border border-danger/25 bg-danger/10 text-danger">
        <AlertTriangle className="size-5" />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message ?? "Something went wrong while contacting the RD4X API."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="size-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

type SkeletonVariant = "stats" | "table" | "chart" | "list" | "chat" | "cards";

export function LoadingSkeleton({
  variant = "list",
  count,
  className,
}: {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}) {
  if (variant === "stats") {
    return (
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", className)}>
        {Array.from({ length: count ?? 4 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "table") {
    return (
      <div className={cn("surface-card overflow-hidden", className)}>
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-3.5 w-40" />
        </div>
        {Array.from({ length: count ?? 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="hidden h-5 w-16 sm:block" />
            <Skeleton className="hidden h-3.5 w-20 md:block" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "chart") {
    return (
      <div className={cn("surface-card p-5", className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-48" />
        <Skeleton className="mt-6 h-56 w-full" />
      </div>
    );
  }
  if (variant === "chat") {
    return (
      <div className={cn("space-y-5 p-5", className)}>
        {Array.from({ length: count ?? 4 }).map((_, i) => (
          <div key={i} className={cn("flex gap-3", i % 2 && "flex-row-reverse")}>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className={cn("h-16 rounded-2xl", i % 2 ? "w-1/2" : "w-2/3")} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "cards") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: count ?? 3 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: count ?? 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1 py-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
