import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary",
        className ?? "size-8",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[60%]" aria-hidden>
        <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".45" />
      </svg>
    </span>
  );
}

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold tracking-tight">RD4X</span>
          <span className="rounded border border-border-strong px-1 font-mono text-[10px] text-muted-foreground">
            V10
          </span>
        </span>
      )}
    </span>
  );
}
