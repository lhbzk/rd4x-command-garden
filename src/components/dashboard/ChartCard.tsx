import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  description,
  actions,
  loading,
  height = 280,
  className,
  children,
  footer,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  height?: number;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className={cn("surface-card flex min-w-0 flex-col fade-up", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="mt-auto min-w-0 shrink-0 px-2 pb-3 pt-4 sm:px-3" style={{ height }}>
        {loading ? (
          <div className="flex h-full items-end gap-1.5 px-3 pb-6">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${30 + ((i * 37) % 60)}%` }}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
      {footer && <footer className="border-t border-border px-4 py-3 sm:px-5">{footer}</footer>}
    </section>
  );
}

/** Shared recharts styling so every chart reads from the design tokens. */
export const chartTheme = {
  grid: { stroke: "var(--border)", strokeDasharray: "3 3", vertical: false },
  axis: {
    stroke: "var(--muted-foreground)",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
  },
  tooltip: {
    cursor: { fill: "color-mix(in oklab, var(--foreground) 5%, transparent)", stroke: "var(--border-strong)" },
    contentStyle: {
      background: "var(--popover)",
      border: "1px solid var(--border-strong)",
      borderRadius: 10,
      fontSize: 12,
      color: "var(--foreground)",
      boxShadow: "var(--shadow-float)",
    },
    labelStyle: { color: "var(--muted-foreground)", marginBottom: 4 },
    itemStyle: { color: "var(--foreground)", padding: 0 },
  },
};
