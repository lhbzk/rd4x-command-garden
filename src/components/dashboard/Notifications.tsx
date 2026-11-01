import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, LifeBuoy, Rocket, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { queries } from "@/lib/api/queries";
import type { AppNotification } from "@/lib/api/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState, LoadingSkeleton } from "./States";

const ICONS = {
  ticket: { icon: LifeBuoy, cls: "text-info bg-info/10 border-info/20" },
  incident: { icon: ShieldAlert, cls: "text-danger bg-danger/10 border-danger/20" },
  release: { icon: Rocket, cls: "text-primary bg-primary/10 border-primary/20" },
  security: { icon: ShieldCheck, cls: "text-warning bg-warning/10 border-warning/20" },
};

export function NotificationItem({
  n,
  onClick,
}: {
  n: AppNotification;
  onClick?: () => void;
}) {
  const { icon: Icon, cls } = ICONS[n.kind];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <span className={cn("mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border", cls)}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn("text-sm", n.read ? "text-muted-foreground" : "font-medium")}>{n.title}</span>
          {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.description}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground/70">{timeAgo(n.at)}</span>
      </span>
    </button>
  );
}

export function NotificationsMenu() {
  const { data, isLoading } = useQuery(queries.notifications());
  const [items, setItems] = useState<AppNotification[]>([]);
  useEffect(() => {
    if (data) setItems(data);
  }, [data]);
  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="surface-float w-[min(92vw,380px)] rounded-xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={unread === 0}
            onClick={() => setItems((xs) => xs.map((n) => ({ ...n, read: true })))}
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        </div>
        <div className="max-h-[380px] divide-y divide-border overflow-y-auto">
          {isLoading ? (
            <div className="p-3">
              <LoadingSkeleton count={3} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Bell} title="You're all caught up" description="New alerts will show up here." />
          ) : (
            items.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                onClick={() => setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
