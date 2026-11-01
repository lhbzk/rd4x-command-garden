import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity as ActivityIcon,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LifeBuoy,
  Play,
  Rocket,
  Server,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartCard, chartTheme } from "@/components/dashboard/ChartCard";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ErrorState, LoadingSkeleton } from "@/components/dashboard/States";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { queries } from "@/lib/api/queries";
import type { Activity } from "@/lib/api/types";
import { formatCompact, formatNumber, timeAgo } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/overview")({
  head: () => pageHead("Overview", "Key metrics, executions, recent activity and system health for RD4X."),
  component: OverviewPage,
});

const KIND_ICON: Record<Activity["kind"], typeof KeyRound> = {
  key: KeyRound,
  ticket: LifeBuoy,
  release: Rocket,
  user: UserPlus,
  system: ShieldCheck,
};

function OverviewPage() {
  const { data, isLoading, isError, refetch } = useQuery(queries.overview());
  const s = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace · Production"
        title="Overview"
        description="Real-time snapshot of the RD4X platform."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/statistics">
                <ActivityIcon className="size-4" /> Statistics
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/releases">
                <Rocket className="size-4" /> New release
              </Link>
            </Button>
          </>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StatCard loading={isLoading} label="Total Users" icon={Users} value={s && formatNumber(s.totalUsers.value)} delta={s?.totalUsers.delta} hint="vs last month" />
            <StatCard loading={isLoading} label="Active Users" icon={UserCheck} value={s && formatNumber(s.activeUsers.value)} delta={s?.activeUsers.delta} hint="last 24h" />
            <StatCard loading={isLoading} label="Total Executions" icon={Play} value={s && formatCompact(s.totalExecutions.value)} delta={s?.totalExecutions.delta} hint="this month" />
            <StatCard loading={isLoading} label="Success Rate" icon={CheckCircle2} value={s && `${s.successRate.value}%`} delta={s?.successRate.delta} hint="7d avg" />
            <StatCard loading={isLoading} label="Open Tickets" icon={LifeBuoy} value={s && s.openTickets.value} delta={s?.openTickets.delta} invertDelta hint="vs last week" />
            <StatCard loading={isLoading} label="Active Keys" icon={KeyRound} value={s && formatNumber(s.activeKeys.value)} delta={s?.activeKeys.delta} hint="licensed" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Executions"
              description="Daily script executions over the last 14 days"
              loading={isLoading}
              height={300}
              actions={
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" /> Executions</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-4" /> Failures</span>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.executions} margin={{ left: -8, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="exec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartTheme.grid} />
                  <XAxis dataKey="label" {...chartTheme.axis} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis {...chartTheme.axis} tickFormatter={formatCompact} width={48} />
                  <Tooltip {...chartTheme.tooltip} formatter={(v: number) => formatNumber(v)} />
                  <Area type="monotone" dataKey="executions" name="Executions" stroke="var(--chart-1)" strokeWidth={2} fill="url(#exec)" />
                  <Area type="monotone" dataKey="failures" name="Failures" stroke="var(--chart-4)" strokeWidth={1.5} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <Panel
              title="System Health"
              description="Live service status"
              actions={<Server className="size-4 text-muted-foreground" />}
            >
              {isLoading ? (
                <div className="p-4"><LoadingSkeleton count={5} /></div>
              ) : (
                <ul className="divide-y divide-border">
                  {data?.health.map((h) => (
                    <li key={h.service} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          h.status === "operational" ? "bg-success" : h.status === "degraded" ? "bg-warning animate-pulse" : "bg-danger",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{h.service}</p>
                        <p className="text-xs text-muted-foreground tabular">{h.uptime}% uptime · {h.latency}ms</p>
                      </div>
                      <StatusBadge value={h.status} dot={false} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Recent Activity" description="Latest events across the platform"
              actions={<Button variant="ghost" size="sm" className="h-7 text-xs" asChild><Link to="/audit">View audit <ArrowRight className="size-3" /></Link></Button>}
            >
              {isLoading ? (
                <div className="p-4"><LoadingSkeleton count={6} /></div>
              ) : (
                <ul className="px-4 py-2 sm:px-5">
                  {data?.recentActivity.map((a, i) => {
                    const Icon = KIND_ICON[a.kind];
                    return (
                      <li key={a.id} className="relative flex gap-3 py-2.5">
                        {i < (data.recentActivity.length - 1) && (
                          <span className="absolute left-4 top-11 h-[calc(100%-2rem)] w-px bg-border" />
                        )}
                        <span className="relative">
                          <UserAvatar name={a.user} hue={a.hue} />
                          <span className="absolute -bottom-1 -right-1 inline-flex size-4 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                            <Icon className="size-2.5" />
                          </span>
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-sm">
                            <span className="font-medium">{a.user}</span>{" "}
                            <span className="text-muted-foreground">{a.action}</span>{" "}
                            {a.target && <span className="font-mono text-xs text-foreground/90">{a.target}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{timeAgo(a.at)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title="Recent Tickets" description="Newest support conversations"
              actions={<Button variant="ghost" size="sm" className="h-7 text-xs" asChild><Link to="/tickets">All tickets <ArrowRight className="size-3" /></Link></Button>}
            >
              {isLoading ? (
                <div className="p-4"><LoadingSkeleton count={5} /></div>
              ) : (
                <ul className="divide-y divide-border">
                  {data?.recentTickets.map((t) => (
                    <li key={t.id}>
                      <Link
                        to="/tickets"
                        search={{ id: t.id }}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5"
                      >
                        <UserAvatar name={t.user.username} hue={t.user.hue} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.subject}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="font-mono">{t.id}</span> · {t.user.username} · {timeAgo(t.updatedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                          <StatusBadge value={t.priority} dot={false} className="hidden sm:inline-flex" />
                          <StatusBadge value={t.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
