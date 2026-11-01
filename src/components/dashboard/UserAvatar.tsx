import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-[11px]",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

/** Deterministic avatar generated from the user's hue (Discord avatars plug in via `src`). */
export function UserAvatar({
  name,
  hue = 200,
  size = "sm",
  src,
  status,
  className,
}: {
  name: string;
  hue?: number;
  size?: keyof typeof sizes;
  src?: string;
  status?: "online" | "idle" | "offline";
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img src={src} alt={name} className={cn("rounded-full object-cover", sizes[size])} />
      ) : (
        <span
          aria-hidden
          className={cn(
            "inline-flex items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-border-strong",
            sizes[size],
          )}
          style={{
            background: `linear-gradient(140deg, oklch(0.42 0.09 ${hue}), oklch(0.26 0.05 ${hue + 30}))`,
            color: `oklch(0.94 0.04 ${hue})`,
          }}
        >
          {initials(name)}
        </span>
      )}
      {status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card",
            status === "online" && "bg-success",
            status === "idle" && "bg-warning",
            status === "offline" && "bg-muted-foreground",
          )}
        />
      )}
    </span>
  );
}
