import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ban, Copy, Download, KeyRound, RotateCcw, UserCheck, UserPlus, Users, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { Modal } from "@/components/dashboard/Modal";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState } from "@/components/dashboard/States";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { queries } from "@/lib/api/queries";
import type { User } from "@/lib/api/types";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import { capitalize } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_dashboard/users")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => pageHead("Users", "Manage RD4X users, roles, keys and account status."),
  component: UsersPage,
});

const ROLES = ["owner", "admin", "moderator", "support", "member"];
const STATUSES = ["active", "inactive", "pending", "banned"];

function UsersPage() {
  const { q: initialQ } = Route.useSearch();
  const { data, isLoading, isError, refetch } = useQuery(queries.users());
  const [q, setQ] = useState(initialQ ?? "");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<User | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter(
      (u) =>
        (role === "all" || u.role === role) &&
        (status === "all" || u.status === status) &&
        (!needle || u.username.includes(needle) || u.discordId.includes(needle) || u.email.includes(needle)),
    );
  }, [data, q, role, status]);

  const count = (st: string) => data?.filter((u) => u.status === st).length ?? 0;

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={u.username} hue={u.hue} status={u.status === "active" ? "online" : "offline"} />
          <div className="min-w-0">
            <p className="truncate font-medium">{u.username}</p>
            <p className="truncate text-xs text-muted-foreground md:hidden">{u.discordId}</p>
            <p className="hidden truncate text-xs text-muted-foreground md:block">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "discord", header: "Discord ID", hideBelow: "md", cell: (u) => <span className="font-mono text-xs text-muted-foreground">{u.discordId}</span> },
    { key: "role", header: "Role", hideBelow: "sm", cell: (u) => <StatusBadge value={u.role} dot={false} /> },
    { key: "status", header: "Status", cell: (u) => <StatusBadge value={u.status} /> },
    { key: "keys", header: "Keys", hideBelow: "lg", align: "right", cell: (u) => <span className="tabular">{u.keys}</span> },
    { key: "last", header: "Last activity", hideBelow: "lg", align: "right", cell: (u) => <span className="whitespace-nowrap text-muted-foreground">{timeAgo(u.lastActive)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Everyone with access to RD4X, synced from Discord."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => notify.success("Export started", "users.csv will download shortly.")}>
              <Download className="size-4" /> Export
            </Button>
            <Button size="sm" onClick={() => notify.info("Invite link copied", "Share it with the new member on Discord.")}>
              <UserPlus className="size-4" /> Invite
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard loading={isLoading} label="Total users" icon={Users} value={data?.length} delta={8.4} />
        <StatCard loading={isLoading} label="Active" icon={UserCheck} value={count("active")} delta={3.1} />
        <StatCard loading={isLoading} label="Pending" icon={UserPlus} value={count("pending")} hint="awaiting key" />
        <StatCard loading={isLoading} label="Banned" icon={UserX} value={count("banned")} delta={-2} invertDelta />
      </div>

      <FilterBar
        search={q}
        onSearchChange={setQ}
        placeholder="Search username, Discord ID or email"
        filters={[
          { id: "role", label: "Roles", value: role, onChange: setRole, options: ROLES.map((r) => ({ value: r, label: capitalize(r) })) },
          { id: "status", label: "Statuses", value: status, onChange: setStatus, options: STATUSES.map((r) => ({ value: r, label: capitalize(r) })) },
        ]}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          caption="Users"
          columns={columns}
          rows={rows}
          rowKey={(u) => u.id}
          loading={isLoading}
          onRowClick={setSelected}
          empty={
            <EmptyState
              icon={Users}
              title="No users match your filters"
              description="Try a different search term or clear the filters."
              action={<Button variant="outline" size="sm" onClick={() => { setQ(""); setRole("all"); setStatus("all"); }}>Clear filters</Button>}
            />
          }
        />
      )}

      <Modal
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title="User details"
        size="lg"
        footer={
          selected && (
            <>
              <Button variant="outline" size="sm" onClick={() => notify.success("HWID reset", `@${selected.username} can re-activate now.`)}>
                <RotateCcw className="size-4" /> Reset HWID
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { notify.warning("User banned", `@${selected.username} lost access.`); setSelected(null); }}>
                <Ban className="size-4" /> Ban user
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <UserAvatar name={selected.username} hue={selected.hue} size="lg" status={selected.status === "active" ? "online" : "offline"} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{selected.username}</p>
                <button
                  className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { navigator.clipboard?.writeText(selected.discordId); notify.success("Discord ID copied"); }}
                >
                  {selected.discordId} <Copy className="size-3" />
                </button>
                <div className="mt-2 flex gap-1.5">
                  <StatusBadge value={selected.role} dot={false} />
                  <StatusBadge value={selected.status} />
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              {[
                ["Email", selected.email],
                ["Country", selected.country],
                ["Keys", selected.keys],
                ["Executions", formatNumber(selected.executions)],
                ["Joined", formatDate(selected.joinedAt)],
                ["Last active", timeAgo(selected.lastActive)],
              ].map(([k, v]) => (
                <div key={k as string} className="bg-card p-3">
                  <dt className="text-[11px] text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="text-eyebrow mb-2">Keys</p>
              {selected.keys === 0 ? (
                <p className="rounded-lg border border-dashed border-border-strong p-4 text-center text-sm text-muted-foreground">No keys linked to this account.</p>
              ) : (
                <ul className="space-y-2">
                  {Array.from({ length: selected.keys }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                      <KeyRound className="size-4 text-primary" />
                      <span className="flex-1 truncate font-mono text-xs">RD4X-{selected.discordId.slice(i, i + 4)}-••••-••••</span>
                      <StatusBadge value={i === 2 ? "expired" : "active"} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const cap = (s: string) => capitalize(s);
