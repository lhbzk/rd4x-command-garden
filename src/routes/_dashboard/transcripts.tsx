import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThread } from "@/components/dashboard/ChatThread";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/dashboard/States";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { queries } from "@/lib/api/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/transcripts")({
  head: () => pageHead("Transcripts", "Archived support conversations from closed RD4X tickets."),
  component: TranscriptsPage,
});

function TranscriptsPage() {
  const { data, isLoading, isError, refetch } = useQuery(queries.transcripts());
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data ?? []).filter(
      (t) =>
        !n ||
        t.subject.toLowerCase().includes(n) ||
        t.id.toLowerCase().includes(n) ||
        t.ticketId.toLowerCase().includes(n) ||
        t.user.includes(n) ||
        t.messages.some((m) => m.content.toLowerCase().includes(n)),
    );
  }, [data, q]);
  const selected = list.find((t) => t.id === selectedId) ?? list[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Transcripts" description="Read-only archive of closed ticket conversations." />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="surface-card grid min-h-[620px] overflow-hidden lg:h-[calc(100dvh-12rem)] lg:min-h-[560px] lg:grid-cols-[340px_1fr]">
          <div className={cn("flex min-h-0 flex-col lg:border-r lg:border-border", mobileView === "chat" && "hidden lg:flex")}>
            <div className="border-b border-border p-3">
              <SearchBar value={q} onChange={setQ} placeholder="Search transcripts and messages" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-3"><LoadingSkeleton count={7} /></div>
              ) : list.length === 0 ? (
                <EmptyState icon={FileText} title="No transcripts found" description="Try another keyword." />
              ) : (
                <ul className="divide-y divide-border">
                  {list.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedId(t.id); setMobileView("chat"); }}
                        className={cn("relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40", selected?.id === t.id && "bg-muted/50")}
                      >
                        {selected?.id === t.id && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
                        <UserAvatar name={t.user} hue={t.hue} />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2 text-[11px] text-muted-foreground">
                            <span className="font-mono">{t.id}</span>
                            <span>{formatDate(t.closedAt)}</span>
                          </div>
                          <p className="mt-0.5 truncate text-sm font-medium">{t.subject}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="size-3" /> {t.messages.length} messages · {t.user}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={cn("flex min-h-0 flex-col", mobileView === "list" && "hidden lg:flex")}>
            {isLoading ? (
              <LoadingSkeleton variant="chat" />
            ) : !selected ? (
              <EmptyState icon={FileText} title="No transcript selected" className="m-auto" />
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
                  <Button variant="ghost" size="icon" className="-ml-1 size-8 lg:hidden" onClick={() => setMobileView("list")} aria-label="Back to transcripts">
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{selected.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{selected.ticketId}</span> · handled by @{selected.staff} · closed {formatDateTime(selected.closedAt)}
                    </p>
                  </div>
                  <div className="hidden gap-1.5 sm:flex">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-border-strong px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => notify.success("Transcript downloaded", `${selected.id}.html`)}>
                    <Download className="size-3.5" /> <span className="hidden sm:inline">Download</span>
                  </Button>
                </div>
                <div className="min-h-[320px] flex-1 overflow-y-auto">
                  <ChatThread messages={selected.messages} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
