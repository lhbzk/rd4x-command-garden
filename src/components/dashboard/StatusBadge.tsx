import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "primary" | "neutral";

const TONES: Record<string, Tone> = {
  // users
  active: "success",
  inactive: "neutral",
  banned: "danger",
  pending: "warning",
  // tickets
  open: "info",
  resolved: "success",
  closed: "neutral",
  // priority
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
  // incidents
  critical: "danger",
  major: "warning",
  minor: "info",
  investigating: "danger",
  identified: "warning",
  monitoring: "info",
  // audit/keys
  success: "success",
  failed: "danger",
  warning: "warning",
  expired: "warning",
  revoked: "danger",
  // health
  operational: "success",
  degraded: "warning",
  down: "danger",
  // releases
  stable: "success",
  beta: "info",
  hotfix: "warning",
  // roles
  owner: "primary",
  admin: "primary",
  moderator: "info",
  support: "neutral",
  member: "neutral",
};

const DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
};

/** Status-aware badge: maps any known status/priority/role string to a semantic tone. */
export function StatusBadge({
  value,
  tone,
  dot = true,
  pulse,
  className,
  children,
}: {
  value: string;
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = tone ?? TONES[value] ?? "neutral";
  return (
    <Badge variant={t} className={cn("capitalize", className)}>
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && (
            <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", DOT[t])} />
          )}
          <span className={cn("relative inline-flex size-1.5 rounded-full", DOT[t])} />
        </span>
      )}
      {children ?? value}
    </Badge>
  );
}
