import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, LifeBuoy, Rocket, ScrollText, Search as SearchIcon, Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/dashboard/States";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { queries } from "@/lib/api/queries";
import { formatDate, timeAgo } from "@/lib/format";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/search")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
  }),
  head: () => pageHead("Search", "Search across RD4X users, tickets, keys, releases and audit events."),
  component: SearchPage,
});

const SUGGESTIONS = ["kairo", "RD4X", "hwid", "10.2", "TK-1045", "key.revoke"];
type Cat = "all" | "users" | "tickets" | "keys" | "releases" | "audit";

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [input, setInput] = useState(q);
  const [cat, setCat] = useState<Cat>("all");
  const { data, isLoading, isError, refetch } = useQuery(queries.search(q));

  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    const id = setTimeout(() => {
      if (input !== q) navigate({ search: { q: input || undefined }, replace: true });
    }, 280);
    return () => clearTimeout(id);
  }, [input, q, navigate]);

  const counts = data
    ? { users: data.users.length, tickets: data.tickets.length, keys: data.keys.length, releases: data.releases.length, audit: data.audit.length }
    : null;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const show = (c: Exclude<Cat, "all">) => (cat === "all" || cat === c) && (counts?.[c] ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Find anything across the RD4X workspace." />
      <SearchBar size="lg" value={input} onChange={setInput} autoFocus placeholder="Search users, tickets, keys, releases, audit events…" />

      {!q ? (
        <div className="surface-card">
          <EmptyState
            icon={SearchIcon}
            title="Start typing to search"
            description="Search by username, Discord ID, ticket ID, key, version or audit action."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="rounded-full border border-border-strong px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                    {s}
                  </button>
                ))}
              </div>
            }
          />
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : total === 0 ? (
        <div className="surface-card">
          <EmptyState icon={SearchIcon} title={`No results for “${q}”`} description="Check the spelling or try a broader term." />
        </div>
      ) : (
        <>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {(["all", "users", "tickets", "keys", "releases", "audit"] as Cat[]).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  cat === c ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c === "audit" ? "Audit events" : c}
                <span className="ml-1.5 tabular opacity-70">{c === "all" ? total : counts?.[c]}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {show("users") && (
              <Group icon={Users} title="Users" count={counts!.users}>
                {data!.users.map((u) => (
                  <Row key={u.id}>
                    <Link to="/users" search={{ q: u.username }} className="flex items-center gap-3">
                      <UserAvatar name={u.username} hue={u.hue} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.username}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{u.discordId}</p>
                      </div>
                      <StatusBadge value={u.role} dot={false} />
                    </Link>
                  </Row>
                ))}
              </Group>
            )}
            {show("tickets") && (
              <Group icon={LifeBuoy} title="Tickets" count={counts!.tickets}>
                {data!.tickets.map((t) => (
                  <Row key={t.id}>
                    <Link to="/tickets" search={{ id: t.id }} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                      <p className="min-w-0 flex-1 truncate text-sm">{t.subject}</p>
                      <StatusBadge value={t.status} />
                    </Link>
                  </Row>
                ))}
              </Group>
            )}
            {show("keys") && (
              <Group icon={KeyRound} title="Keys" count={counts!.keys}>
                {data!.keys.map((k) => (
                  <Row key={k.key}>
                    <div className="flex items-center gap-3">
                      <KeyRound className="size-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs">{k.key}</p>
                        <p className="text-xs text-muted-foreground">{k.owner} · {k.plan}</p>
                      </div>
                      <StatusBadge value={k.status} />
                    </div>
                  </Row>
                ))}
              </Group>
            )}
            {show("releases") && (
              <Group icon={Rocket} title="Releases" count={counts!.releases}>
                {data!.releases.map((r) => (
                  <Row key={r.id}>
                    <Link to="/releases" className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">v{r.version}</span>
                      <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{r.title}</p>
                      <span className="hidden text-xs text-muted-foreground sm:inline">{formatDate(r.date)}</span>
                    </Link>
                  </Row>
                ))}
              </Group>
            )}
            {show("audit") && (
              <Group icon={ScrollText} title="Audit events" count={counts!.audit}>
                {data!.audit.map((e) => (
                  <Row key={e.id}>
                    <Link to="/audit" className="flex items-center gap-3">
                      <code className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">{e.action}</code>
                      <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{e.target}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(e.timestamp)}</span>
                    </Link>
                  </Row>
                ))}
              </Group>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Group({ icon: Icon, title, count, children }: { icon: typeof Users; title: string; count: number; children: React.ReactNode }) {
  return (
    <Panel
      title={title}
      actions={
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" /> {count}
        </span>
      }
    >
      <ul className="divide-y divide-border">{children}</ul>
    </Panel>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <li className="px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">{children}</li>;
}
