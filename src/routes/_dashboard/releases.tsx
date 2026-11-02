import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bug, Calendar, Download, Loader2, Package, Plus, Rocket, Sparkles, Tag, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/dashboard/Modal";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/dashboard/States";
import { createRelease, currentAdmin } from "@/lib/api";
import { queries } from "@/lib/api/queries";
import type { Release, ReleaseChannel } from "@/lib/api/types";
import { formatCompact, formatDate, timeAgo } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/releases")({
  head: () => pageHead("Releases", "Version history, changelogs and publishing for RD4X releases."),
  component: ReleasesPage,
});

const CHANGE_ICON = { feature: Sparkles, fix: Bug, improvement: Wrench };
const CHANGE_CLS = { feature: "text-primary", fix: "text-danger", improvement: "text-info" };

function ReleasesPage() {
  const { data, isLoading, isError, refetch } = useQuery(queries.releases());
  const [open, setOpen] = useState(false);
  const stable = data?.find((r) => r.channel !== "beta");
  const latest = data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Releases"
        description="Ship and track every RD4X client version."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New release
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard loading={isLoading} label="Current version" icon={Tag} value={stable && <span className="font-mono">v{stable.version}</span>} hint={stable?.channel} />
        <StatCard loading={isLoading} label="Last release" icon={Calendar} value={latest && timeAgo(latest.date)} hint={latest && formatDate(latest.date)} />
        <StatCard loading={isLoading} label="Total releases" icon={Package} value={data?.length} hint="since V10" />
        <StatCard loading={isLoading} label="Downloads" icon={Download} value={data && formatCompact(data.reduce((s, r) => s + r.downloads, 0))} delta={11.3} />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingSkeleton variant="cards" count={4} />
      ) : !data?.length ? (
        <EmptyState icon={Rocket} title="No releases yet" description="Publish your first version to start the timeline." action={<Button size="sm" onClick={() => setOpen(true)}>New release</Button>} />
      ) : (
        <ol className="relative space-y-4 pl-6 sm:pl-8">
          <span className="absolute bottom-2 left-[7px] top-2 w-px bg-border sm:left-[11px]" />
          {data.map((r, i) => (
            <li key={r.id} className="relative fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <span
                className={cn(
                  "absolute -left-6 top-5 size-[15px] rounded-full border-[3px] border-background sm:-left-8 sm:size-[23px] sm:border-[6px]",
                  i === 0 ? "bg-primary" : "bg-muted-foreground/40",
                )}
              />
              <ReleaseCard release={r} latest={i === 0} />
            </li>
          ))}
        </ol>
      )}

      <CreateReleaseModal open={open} onOpenChange={setOpen} />
    </div>
  );
}

function ReleaseCard({ release: r, latest }: { release: Release; latest: boolean }) {
  return (
    <article className={cn("surface-card p-4 sm:p-5", latest && "glow-primary")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-base font-semibold">v{r.version}</h3>
            <StatusBadge value={r.channel} dot={false} />
            {latest && <StatusBadge value="latest" tone="primary" pulse>Latest</StatusBadge>}
          </div>
          <p className="mt-1 text-sm text-foreground/90">{r.title}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{formatDate(r.date)}</p>
          <p className="mt-0.5">by @{r.author} · {formatCompact(r.downloads)} downloads</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 border-t border-border pt-4">
        {r.changes.map((c, i) => {
          const Icon = CHANGE_ICON[c.type];
          return (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Icon className={cn("mt-0.5 size-4 shrink-0", CHANGE_CLS[c.type])} />
              <span className="text-muted-foreground">
                <span className="mr-1.5 font-mono text-[11px] uppercase text-foreground/70">{c.type}</span>
                {c.text}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function CreateReleaseModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<ReleaseChannel>("stable");
  const [notes, setNotes] = useState("");
  const valid = /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version) && title.trim().length > 2;

  const mutation = useMutation({
    mutationFn: createRelease,
    onSuccess: (rel) => {
      qc.setQueryData<Release[]>(queries.releases().queryKey, (old) => [rel, ...(old ?? [])]);
      notify.success(`v${rel.version} published`, `Released to the ${rel.channel} channel.`);
      onOpenChange(false);
      setVersion(""); setTitle(""); setNotes(""); setChannel("stable");
    },
    onError: () => notify.error("Couldn't publish release", "The RD4X API rejected the request."),
  });

  const submit = () =>
    mutation.mutate({
      version,
      title,
      channel,
      author: currentAdmin.username,
      changes: notes
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const m = l.match(/^(fix|feature|improvement):\s*(.+)$/i);
          return m ? { type: m[1]!.toLowerCase() as "fix", text: m[2]! } : { type: "improvement" as const, text: l };
        }),
    });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create release"
      description="Publish a new RD4X client version."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!valid || mutation.isPending} onClick={submit}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            Publish release
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="rel-version">Version</Label>
            <Input id="rel-version" className="font-mono" placeholder="10.3.0" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as ReleaseChannel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="hotfix">Hotfix</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rel-title">Title</Label>
          <Input id="rel-title" placeholder="What's in this release?" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rel-notes">Changelog</Label>
          <Textarea
            id="rel-notes"
            rows={5}
            className="font-mono text-xs"
            placeholder={"feature: New script hub\nfix: Crash on startup\nimprovement: Faster cold start"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">One change per line. Prefix with feature:, fix: or improvement:</p>
        </div>
      </div>
    </Modal>
  );
}
