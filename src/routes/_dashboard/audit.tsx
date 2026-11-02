import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState } from "@/components/dashboard/States";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { queries } from "@/lib/api/queries";
import type { AuditEvent } from "@/lib/api/types";
import { formatDateTime, timeAgo } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_dashboard/audit")({
  head: () => pageHead("Audit Log", "Every administrative action on RD4X with timestamp, actor, target and status."),
  component: AuditPage,
});

const SCOPES = ["user", "key", "ticket", "release", "settings", "hwid", "auth"];

function AuditPage() {
  const { data, isLoading, isError, refetch } = useQuery(queries.audit());
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data ?? []).filter(
      (e) =>
        (scope === "all" || e.action.startsWith(`${scope}.`)) &&
        (status === "all" || e.status === status) &&
        (!n || e.action.includes(n) || e.target.toLowerCase().includes(n) || e.user.includes(n) || e.ip.includes(n)),
    );
  }, [data, q, scope, status]);

  const columns: Column<AuditEvent>[] = [
    {
      key: "ts",
      header: "Timestamp",
      cell: (e) => (
        <div className="whitespace-nowrap">
          <p className="font-mono text-xs">{formatDateTime(e.timestamp)}</p>
          <p className="text-[11px] text-muted-foreground">{timeAgo(e.timestamp)}</p>
        </div>
      ),
    },
    {
      key: "user",
      header: "User",
      hideBelow: "sm",
      cell: (e) => (
        <div className="flex items-center gap-2">
          <UserAvatar name={e.user} hue={e.hue} size="xs" />
          <span className="whitespace-nowrap text-sm">{e.user}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (e) => (
        <code className="whitespace-nowrap rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px] text-foreground/90">
          {e.action}
        </code>
      ),
    },
    { key: "target", header: "Target", hideBelow: "md", cell: (e) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{e.target}</span> },
    { key: "status", header: "Status", cell: (e) => <StatusBadge value={e.status} /> },
    { key: "ip", header: "IP", hideBelow: "xl", align: "right", cell: (e) => <span className="font-mono text-xs text-muted-foreground">{e.ip}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit"
        description="Immutable log of administrative actions."
        actions={
          <Button variant="outline" size="sm" onClick={() => notify.success("Export queued", `${rows.length} events → audit.csv`)}>
            <Download className="size-4" /> Export
          </Button>
        }
      />
      <FilterBar
        search={q}
        onSearchChange={setQ}
        placeholder="Search action, target, user or IP"
        filters={[
          { id: "scope", label: "Actions", value: scope, onChange: setScope, options: SCOPES.map((s) => ({ value: s, label: s })) },
          { id: "status", label: "Statuses", value: status, onChange: setStatus, options: ["success", "warning", "failed"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) },
        ]}
      />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          caption="Audit events"
          columns={columns}
          rows={rows}
          rowKey={(e) => e.id}
          loading={isLoading}
          pageSize={12}
          empty={<EmptyState icon={ScrollText} title="No events found" description="No audit events match these filters." />}
        />
      )}
    </div>
  );
}
