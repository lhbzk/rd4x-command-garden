import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Send,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ChatThread } from "@/components/dashboard/ChatThread";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/dashboard/States";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { currentAdmin, staffMembers } from "@/lib/api";
import { queries } from "@/lib/api/queries";
import type { Ticket, TicketStatus } from "@/lib/api/types";
import { timeAgo } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/tickets")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => pageHead("Tickets", "Support tickets with priorities, assignments and live conversations."),
  component: TicketsPage,
});

function TicketsPage() {
  const { id: initialId } = Route.useSearch();
  const { data, isLoading, isError, refetch } = useQuery(queries.tickets());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialId);
  const [mobileView, setMobileView] = useState<"list" | "chat">(initialId ? "chat" : "list");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  useEffect(() => {
    if (data) setTickets(data);
  }, [data]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        (status === "all" || t.status === status) &&
        (priority === "all" || t.priority === priority) &&
        (!n || t.subject.toLowerCase().includes(n) || t.id.toLowerCase().includes(n) || t.user.username.includes(n)),
    );
  }, [tickets, q, status, priority]);

  const selected = tickets.find((t) => t.id === selectedId) ?? filtered[0];
  const by = (st: TicketStatus) => tickets.filter((t) => t.status === st).length;
  const high = tickets.filter((t) => (t.priority === "high" || t.priority === "urgent") && t.status !== "closed" && t.status !== "resolved").length;

  const update = (id: string, patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)));

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets" description="Support queue across Discord and the RD4X client." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard loading={isLoading} label="Open" icon={Inbox} value={by("open")} delta={-12.5} invertDelta />
        <StatCard loading={isLoading} label="Pending" icon={Clock} value={by("pending")} hint="awaiting user" />
        <StatCard loading={isLoading} label="Resolved" icon={CheckCircle2} value={by("resolved") + by("closed")} delta={18} />
        <StatCard loading={isLoading} label="High Priority" icon={AlertTriangle} value={high} hint="needs attention" />
      </div>

      <FilterBar
        search={q}
        onSearchChange={setQ}
        placeholder="Search tickets, IDs or users"
        filters={[
          { id: "status", label: "Statuses", value: status, onChange: setStatus, options: ["open", "pending", "resolved", "closed"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
          { id: "priority", label: "Priorities", value: priority, onChange: setPriority, options: ["urgent", "high", "medium", "low"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
        ]}
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="surface-card grid min-h-[620px] overflow-hidden lg:h-[calc(100dvh-12rem)] lg:min-h-[560px] lg:grid-cols-[360px_1fr]">
          {/* List */}
          <div className={cn("flex min-h-0 flex-col border-border lg:border-r", mobileView === "chat" && "hidden lg:flex")}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Queue</p>
              <span className="text-xs text-muted-foreground tabular">{filtered.length} tickets</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-3"><LoadingSkeleton count={7} /></div>
              ) : filtered.length === 0 ? (
                <EmptyState icon={LifeBuoy} title="No tickets found" description="Nothing matches the current filters." />
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(t.id);
                          setMobileView("chat");
                        }}
                        className={cn(
                          "relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40",
                          selected?.id === t.id && "bg-muted/50",
                        )}
                      >
                        {selected?.id === t.id && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
                        <UserAvatar name={t.user.username} hue={t.user.hue} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground">{t.id}</span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(t.updatedAt)}</span>
                          </div>
                          <p className="mt-0.5 truncate text-sm font-medium">{t.subject}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {t.messages[t.messages.length - 1]?.content}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <StatusBadge value={t.status} />
                            <StatusBadge value={t.priority} dot={false} />
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className={cn("flex min-h-0 flex-col", mobileView === "list" && "hidden lg:flex")}>
            {isLoading ? (
              <LoadingSkeleton variant="chat" />
            ) : !selected ? (
              <EmptyState icon={MessageSquare} title="Select a ticket" description="Pick a conversation from the queue to start replying." className="m-auto" />
            ) : (
              <Conversation
                key={selected.id}
                ticket={selected}
                onBack={() => setMobileView("list")}
                onUpdate={(patch) => update(selected.id, patch)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Conversation({
  ticket,
  onBack,
  onUpdate,
}: {
  ticket: Ticket;
  onBack: () => void;
  onUpdate: (patch: Partial<Ticket>) => void;
}) {
  const [reply, setReply] = useState("");
  const closed = ticket.status === "closed" || ticket.status === "resolved";

  const send = () => {
    const content = reply.trim();
    if (!content) return;
    onUpdate({
      status: ticket.status === "open" ? "pending" : ticket.status,
      messages: [
        ...ticket.messages,
        {
          id: `msg_${Date.now()}`,
          author: currentAdmin.username,
          authorRole: "staff",
          hue: 185,
          content,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setReply("");
    notify.success("Reply sent", `${ticket.user.username} will be notified on Discord.`);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <Button variant="ghost" size="icon" className="-ml-1 size-8 lg:hidden" onClick={onBack} aria-label="Back to tickets">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ticket.subject}</p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{ticket.id}</span> · {ticket.category} · opened by {ticket.user.username} {timeAgo(ticket.createdAt)}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <StatusBadge value={ticket.status} />
          <StatusBadge value={ticket.priority} dot={false} />
          <div className="ml-auto flex gap-2 sm:ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <UserPlus className="size-3.5" />
                  <span className="max-w-[90px] truncate">{ticket.assignee ?? "Assign"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Assign to</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {staffMembers.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={() => {
                      onUpdate({ assignee: s });
                      notify.success("Ticket assigned", `${ticket.id} → @${s}`);
                    }}
                  >
                    <UserAvatar name={s} hue={s.length * 40} size="xs" /> {s}
                    {ticket.assignee === s && <CheckCircle2 className="ml-auto size-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {closed ? (
              <Button variant="outline" size="sm" className="h-8" onClick={() => { onUpdate({ status: "open" }); notify.info("Ticket reopened", ticket.id); }}>
                Reopen
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-8" onClick={() => { onUpdate({ status: "closed" }); notify.success("Ticket closed", `${ticket.id} archived to transcripts.`); }}>
                <XCircle className="size-3.5" /> Close
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-[320px] flex-1 overflow-y-auto">
        <ChatThread messages={ticket.messages} />
      </div>

      <div className="border-t border-border p-3 sm:p-4">
        {closed ? (
          <p className="rounded-lg bg-muted/40 py-3 text-center text-sm text-muted-foreground">
            This ticket is {ticket.status}. Reopen it to reply.
          </p>
        ) : (
          <div className="rounded-xl border border-input bg-background/50 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/30">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
              }}
              placeholder={`Reply to ${ticket.user.username}…`}
              className="min-h-[72px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">⌘ + Enter to send</span>
              <Button size="sm" className="ml-auto h-8" onClick={send} disabled={!reply.trim()}>
                <Send className="size-3.5" /> Reply
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
