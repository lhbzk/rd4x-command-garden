import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock, Plus, ShieldAlert, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/dashboard/States";
import { queries } from "@/lib/api/queries";
import type { Incident } from "@/lib/api/types";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { capitalize } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/incidents")({
  head: () => pageHead("Incidents", "Active and resolved incidents, uptime and service status for RD4X."),
  component: IncidentsPage,
});

const SEVERITY_RING = { critical: "border-l-danger", major: "border-l-warning", minor: "border-l-info" };

function IncidentsPage() {
  const { data, isLoading, isError, refetch } = useQuery(queries.incidents());
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data?.incidents ?? []).filter(
      (i) =>
        (severity === "all" || i.severity === severity) &&
        (status === "all" || (status === "active" ? i.status !== "resolved" : i.status === "resolved")) &&
        (!n || i.title.toLowerCase().includes(n) || i.service.toLowerCase().includes(n)),
    );
  }, [data, q, severity, status]);

  const active = data?.incidents.filter((i) => i.status !== "resolved") ?? [];
  const resolved = data?.incidents.filter((i) => i.status === "resolved") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Track outages and degradations across RD4X services."
        actions={
          <Button size="sm" variant="outline" onClick={() => notify.info("Incident draft created", "Fill in details to notify users.")}>
            <Plus className="size-4" /> Report incident
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard loading={isLoading} label="Active incidents" icon={ShieldAlert} value={active.length} hint={active.length ? "in progress" : "all clear"} />
        <StatCard loading={isLoading} label="Resolved (90d)" icon={CheckCircle2} value={resolved.length} />
        <StatCard loading={isLoading} label="Uptime (90d)" icon={Activity} value={data && `${data.uptime}%`} delta={0.01} />
        <StatCard loading={isLoading} label="Mean time to resolve" icon={Timer} value={data && `${data.mttrMinutes}m`} delta={-9} invertDelta />
      </div>

      <Panel title="Uptime" description="Last 90 days · all services" bodyClassName="p-4 sm:p-5">
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        ) : (
          <>
            <div className="flex h-10 items-stretch gap-[2px]">
              {data?.uptimeDays.map((d, i) => (
                <Tooltip key={d.date}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "flex-1 rounded-[2px] transition-opacity hover:opacity-70",
                        i < 45 && "hidden sm:block",
                        d.status === "up" ? "bg-success/70" : d.status === "degraded" ? "bg-warning" : "bg-danger",
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatDate(d.date)} · {d.status === "up" ? "Operational" : d.status === "degraded" ? "Degraded" : "Outage"}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span><span className="sm:hidden">45</span><span className="hidden sm:inline">90</span> days ago</span>
              <span className="tabular">{data?.uptime}% uptime</span>
              <span>Today</span>
            </div>
          </>
        )}
      </Panel>

      <FilterBar
        search={q}
        onSearchChange={setQ}
        placeholder="Search incidents or services"
        filters={[
          { id: "sev", label: "Severities", value: severity, onChange: setSeverity, options: ["critical", "major", "minor"].map((v) => ({ value: v, label: capitalize(v) })) },
          { id: "status", label: "Statuses", value: status, onChange: setStatus, options: [{ value: "active", label: "Active" }, { value: "resolved", label: "Resolved" }] },
        ]}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : list.length === 0 ? (
        <div className="surface-card">
          <EmptyState icon={CheckCircle2} title="No incidents found" description="Everything matching these filters is running smoothly." />
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((i) => (
            <IncidentCard key={i.id} incident={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident: i }: { incident: Incident }) {
  const live = i.status !== "resolved";
  return (
    <article className={cn("surface-card border-l-2 p-4 sm:p-5 fade-up", SEVERITY_RING[i.severity])}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={i.severity} dot={false} />
            <StatusBadge value={i.status} pulse={live} />
            <span className="font-mono text-[11px] text-muted-foreground">{i.id}</span>
          </div>
          <h3 className="mt-2 text-sm font-semibold sm:text-base">{i.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {i.service} · started {timeAgo(i.startedAt)}
            {i.resolvedAt && ` · resolved in ${Math.round((+new Date(i.resolvedAt) - +new Date(i.startedAt)) / 60000)}m`}
          </p>
        </div>
        {live && (
          <Button size="sm" variant="outline" className="h-8" onClick={() => notify.success("Incident resolved", i.title)}>
            Mark resolved
          </Button>
        )}
      </div>
      <ol className="mt-4 space-y-3 border-t border-border pt-4">
        {i.updates.map((u, idx) => (
          <li key={idx} className="relative flex gap-3 pl-1">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", idx === 0 ? "bg-foreground" : "bg-muted-foreground/40")} />
            <div className="min-w-0">
              <p className="text-xs">
                <span className="font-medium capitalize">{u.status}</span>
                <span className="ml-2 text-muted-foreground"><Clock className="mr-1 inline size-3" />{formatDateTime(u.at)}</span>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{u.message}</p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
