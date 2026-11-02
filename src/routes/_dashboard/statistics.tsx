import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Gauge, Play, Users } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartCard, chartTheme } from "@/components/dashboard/ChartCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ErrorState } from "@/components/dashboard/States";
import { queries } from "@/lib/api/queries";
import type { Range } from "@/lib/api/types";
import { formatCompact, formatNumber } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/statistics")({
  head: () => pageHead("Statistics", "Executions, success rate, active users and API response time analytics."),
  component: StatisticsPage,
});

const RANGES: { value: Range; label: string }[] = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

function StatisticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...queries.statistics(range),
    placeholderData: keepPreviousData,
  });
  const t = data?.totals;
  const total = data ? data.successFailure.reduce((s, x) => s + x.value, 0) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        description="Platform analytics across executions, users and API performance."
        actions={
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(v) => v && setRange(v as Range)}
            className="rounded-lg border border-border bg-card p-0.5"
            aria-label="Time range"
          >
            {RANGES.map((r) => (
              <ToggleGroupItem
                key={r.value}
                value={r.value}
                className="h-8 rounded-md px-3 font-mono text-xs data-[state=on]:bg-muted data-[state=on]:text-foreground"
              >
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className={cn("space-y-4 transition-opacity", isFetching && !isLoading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard loading={isLoading} label="Executions" icon={Play} value={t && formatCompact(t.executions.value)} delta={t?.executions.delta} />
            <StatCard loading={isLoading} label="Success rate" icon={CheckCircle2} value={t && `${t.successRate.value}%`} delta={t?.successRate.delta} />
            <StatCard loading={isLoading} label="Peak active users" icon={Users} value={t && formatNumber(t.activeUsers.value)} delta={t?.activeUsers.delta} />
            <StatCard loading={isLoading} label="Avg response" icon={Gauge} value={t && `${t.avgResponse.value}ms`} delta={t?.avgResponse.delta} invertDelta />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard className="lg:col-span-2" title="Executions" description="Total script executions" loading={isLoading}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.executions ?? []} margin={{ left: -8, right: 8, top: 4 }}>
                  <CartesianGrid {...chartTheme.grid} />
                  <XAxis dataKey="label" {...chartTheme.axis} minTickGap={20} />
                  <YAxis {...chartTheme.axis} tickFormatter={formatCompact} width={48} />
                  <Tooltip {...chartTheme.tooltip} formatter={(v: number) => formatNumber(v)} />
                  <Line type="monotone" dataKey="executions" name="Executions" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Success vs Failure" description="Execution outcomes" loading={isLoading}>
              <div className="relative h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip {...chartTheme.tooltip} formatter={(v: number) => formatNumber(v)} />
                    <Pie data={data?.successFailure ?? []} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="84%" paddingAngle={3} stroke="none">
                      <Cell fill="var(--chart-1)" />
                      <Cell fill="var(--chart-4)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold tabular">{t?.successRate.value}%</span>
                  <span className="text-xs text-muted-foreground">success</span>
                </div>
              </div>
              <div className="-mt-2 flex justify-center gap-5 text-xs text-muted-foreground">
                {data?.successFailure.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", i === 0 ? "bg-chart-1" : "bg-chart-4")} />
                    {s.name} <span className="text-foreground tabular">{((s.value / total) * 100).toFixed(1)}%</span>
                  </span>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Active Users" description="Unique users with at least one execution" loading={isLoading}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.activeUsers ?? []} margin={{ left: -8, right: 8, top: 4 }}>
                  <defs>
                    <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartTheme.grid} />
                  <XAxis dataKey="label" {...chartTheme.axis} minTickGap={20} />
                  <YAxis {...chartTheme.axis} tickFormatter={formatCompact} width={44} />
                  <Tooltip {...chartTheme.tooltip} formatter={(v: number) => formatNumber(v)} />
                  <Area type="monotone" dataKey="users" name="Active users" stroke="var(--chart-2)" strokeWidth={2} fill="url(#users)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="API Response Time"
              description="p50 and p95 latency in ms"
              loading={isLoading}
              actions={
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" /> p50</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-3" /> p95</span>
                </div>
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.responseTime ?? []} margin={{ left: -8, right: 8, top: 4 }} barGap={2}>
                  <CartesianGrid {...chartTheme.grid} />
                  <XAxis dataKey="label" {...chartTheme.axis} minTickGap={20} />
                  <YAxis {...chartTheme.axis} width={40} unit="ms" />
                  <Tooltip {...chartTheme.tooltip} formatter={(v: number) => `${v}ms`} />
                  <Bar dataKey="p50" name="p50" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="p95" name="p95" fill="var(--chart-3)" radius={[3, 3, 0, 0]} maxBarSize={14} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <DataTable
            caption="Top endpoints"
            loading={isLoading}
            rows={data?.topEndpoints ?? []}
            rowKey={(r) => r.endpoint}
            columns={[
              { key: "ep", header: "Endpoint", cell: (r) => <span className="font-mono text-xs">{r.endpoint}</span> },
              { key: "calls", header: "Calls", align: "right", cell: (r) => <span className="tabular">{formatCompact(r.calls)}</span> },
              { key: "p95", header: "p95", align: "right", hideBelow: "sm", cell: (r) => <span className="tabular text-muted-foreground">{r.p95}ms</span> },
              {
                key: "err",
                header: "Error rate",
                align: "right",
                cell: (r) => <span className={cn("tabular", r.errorRate > 1 ? "text-danger" : "text-success")}>{r.errorRate}%</span>,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
