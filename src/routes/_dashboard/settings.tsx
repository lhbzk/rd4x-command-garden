import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, Check, Laptop, Loader2, Palette, Server, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ErrorState, LoadingSkeleton } from "@/components/dashboard/States";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { currentAdmin, saveSettings } from "@/lib/api";
import { apiInfo, mockControls } from "@/lib/api/client";
import { queries } from "@/lib/api/queries";
import type { Settings } from "@/lib/api/types";
import { timeAgo } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "system", label: "System", icon: Server },
] as const;
type TabId = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/_dashboard/settings")({
  validateSearch: (s: Record<string, unknown>): { tab?: TabId } => ({
    tab: TABS.some((t) => t.id === s.tab) ? (s.tab as TabId) : undefined,
  }),
  head: () => pageHead("Settings", "Workspace, profile, security, notification, appearance and system settings."),
  component: SettingsPage,
});

const ACCENTS = [
  { id: "aqua", label: "Aqua", value: "oklch(0.84 0.12 185)" },
  { id: "ice", label: "Ice", value: "oklch(0.8 0.1 235)" },
  { id: "lime", label: "Lime", value: "oklch(0.88 0.16 128)" },
  { id: "amber", label: "Amber", value: "oklch(0.83 0.14 75)" },
  { id: "mono", label: "Mono", value: "oklch(0.92 0.005 255)" },
];

function SettingsPage() {
  const { tab = "general" } = Route.useSearch();
  const navigate = useNavigate({ from: "/settings" });
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(queries.settings());
  const [form, setForm] = useState<Settings | null>(null);
  const [failures, setFailures] = useState(mockControls.simulateFailures);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const dirty = !!form && !!data && JSON.stringify(form) !== JSON.stringify(data);
  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: (s) => {
      qc.setQueryData(queries.settings().queryKey, s);
      notify.success("Settings saved", "Your changes are live.");
    },
    onError: () => notify.error("Couldn't save settings", "The RD4X API is unavailable."),
  });

  const set = <K extends keyof Settings>(section: K, patch: Partial<Settings[K]>) =>
    setForm((f) => (f ? { ...f, [section]: { ...f[section], ...patch } } : f));

  const applyAccent = (id: string) => {
    const a = ACCENTS.find((x) => x.id === id);
    if (!a) return;
    const root = document.documentElement.style;
    root.setProperty("--primary", a.value);
    root.setProperty("--chart-1", a.value);
    root.setProperty("--sidebar-primary", a.value);
    set("appearance", { accent: id });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your workspace and account preferences."
        actions={
          <>
            {dirty && (
              <Button variant="ghost" size="sm" onClick={() => setForm(data ?? null)}>
                Discard
              </Button>
            )}
            <Button size="sm" disabled={!dirty || mutation.isPending} onClick={() => form && mutation.mutate(form)}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate({ search: { tab: t.id }, replace: true })}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                tab === t.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <t.icon className={cn("size-4", tab === t.id && "text-primary")} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading || !form ? (
            <LoadingSkeleton variant="cards" count={2} />
          ) : (
            <div key={tab} className="space-y-4 fade-up">
              {tab === "general" && (
                <Section title="Workspace" description="Basic information about this RD4X workspace.">
                  <Field label="Workspace name"><Input value={form.general.workspace} onChange={(e) => set("general", { workspace: e.target.value })} /></Field>
                  <Field label="Support email"><Input type="email" value={form.general.supportEmail} onChange={(e) => set("general", { supportEmail: e.target.value })} /></Field>
                  <Field label="Timezone">
                    <Select value={form.general.timezone} onValueChange={(v) => set("general", { timezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["America/Sao_Paulo", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "UTC"].map((z) => (
                          <SelectItem key={z} value={z}>{z.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Language">
                    <Select value={form.general.language} onValueChange={(v) => set("general", { language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português (BR)</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </Section>
              )}

              {tab === "profile" && (
                <Section title="Profile" description="How you appear to staff and users.">
                  <div className="flex items-center gap-4 sm:col-span-2">
                    <UserAvatar name={form.profile.displayName} hue={currentAdmin.hue} size="lg" />
                    <div>
                      <p className="text-sm font-medium">Avatar synced from Discord</p>
                      <p className="text-xs text-muted-foreground">Change it in Discord and it updates here automatically.</p>
                    </div>
                  </div>
                  <Field label="Display name"><Input value={form.profile.displayName} onChange={(e) => set("profile", { displayName: e.target.value })} /></Field>
                  <Field label="Username"><Input value={form.profile.username} disabled className="font-mono" /></Field>
                  <Field label="Email"><Input type="email" value={form.profile.email} onChange={(e) => set("profile", { email: e.target.value })} /></Field>
                  <Field label="Discord ID"><Input value={currentAdmin.discordId} disabled className="font-mono" /></Field>
                  <Field label="Bio" full><Textarea rows={3} value={form.profile.bio} onChange={(e) => set("profile", { bio: e.target.value })} /></Field>
                </Section>
              )}

              {tab === "security" && (
                <>
                  <Section title="Authentication" description="Protect admin access to RD4X.">
                    <Toggle full label="Two-factor authentication" description="Require a TOTP code after Discord sign-in." checked={form.security.twoFactor} onChange={(v) => set("security", { twoFactor: v })} />
                    <Field label="Session timeout">
                      <Select value={form.security.sessionTimeout} onValueChange={(v) => set("security", { sessionTimeout: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["1h", "4h", "12h", "24h", "7d"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </Section>
                  <Section title="Active sessions" description="Devices currently signed in to your account." grid={false}>
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {form.security.sessions.map((s) => (
                        <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                          <Laptop className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{s.device}</p>
                            <p className="truncate text-xs text-muted-foreground">{s.location} · {s.current ? "Active now" : timeAgo(s.lastSeen)}</p>
                          </div>
                          {s.current ? (
                            <StatusBadge value="current" tone="success">This device</StatusBadge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-danger hover:text-danger"
                              onClick={() => {
                                set("security", { sessions: form.security.sessions.filter((x) => x.id !== s.id) });
                                notify.success("Session revoked", s.device);
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Section>
                </>
              )}

              {tab === "notifications" && (
                <Section title="Notifications" description="Choose what you get alerted about on Discord and email." grid={false}>
                  <div className="divide-y divide-border rounded-xl border border-border">
                    {(
                      [
                        ["tickets", "Ticket updates", "New tickets, replies and assignments."],
                        ["incidents", "Incidents", "Outages and degraded services."],
                        ["releases", "Releases", "When a new version is published."],
                        ["security", "Security alerts", "New logins and permission changes."],
                        ["weekly", "Weekly digest", "A summary of platform metrics every Monday."],
                      ] as const
                    ).map(([key, label, desc]) => (
                      <div key={key} className="px-4 py-3.5">
                        <Toggle label={label} description={desc} checked={form.notifications[key]} onChange={(v) => set("notifications", { [key]: v })} />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {tab === "appearance" && (
                <Section title="Appearance" description="Personalize the look of your dashboard." grid={false}>
                  <div>
                    <Label className="text-xs text-muted-foreground">Accent color</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ACCENTS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => applyAccent(a.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                            form.appearance.accent === a.id ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50",
                          )}
                        >
                          <span className="size-3.5 rounded-full" style={{ background: a.value }} />
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5">
                    <Label className="text-xs text-muted-foreground">Theme</Label>
                    <div className="mt-2 grid max-w-md grid-cols-2 gap-3">
                      <div className="rounded-xl border-2 border-primary/50 bg-background p-3">
                        <div className="h-16 rounded-md border border-border bg-card" />
                        <p className="mt-2 text-sm font-medium">Dark</p>
                      </div>
                      <div className="rounded-xl border border-dashed border-border-strong p-3 opacity-60">
                        <div className="h-16 rounded-md bg-muted" />
                        <p className="mt-2 text-sm text-muted-foreground">Light · soon</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 divide-y divide-border rounded-xl border border-border">
                    <div className="px-4 py-3.5">
                      <Toggle label="Compact density" description="Tighter spacing in tables and lists." checked={form.appearance.density === "compact"} onChange={(v) => set("appearance", { density: v ? "compact" : "comfortable" })} />
                    </div>
                    <div className="px-4 py-3.5">
                      <Toggle label="Reduce motion" description="Minimize animations across the dashboard." checked={form.appearance.reduceMotion} onChange={(v) => set("appearance", { reduceMotion: v })} />
                    </div>
                  </div>
                </Section>
              )}

              {tab === "system" && (
                <>
                  <Section title="System" description="Environment and API connection.">
                    <Info label="Environment" value={<StatusBadge value={form.system.environment} tone="success" />} />
                    <Info label="Version" value={<span className="font-mono">v{form.system.version}</span>} />
                    <Info label="Region" value={<span className="font-mono">{form.system.region}</span>} />
                    <Info
                      label="API"
                      value={
                        apiInfo.mode === "mock" ? (
                          <StatusBadge value="mock" tone="warning">Mock data</StatusBadge>
                        ) : (
                          <span className="truncate font-mono text-xs">{apiInfo.baseUrl}</span>
                        )
                      }
                    />
                    <Toggle full label="Maintenance mode" description="Blocks client logins and shows a maintenance banner." checked={form.system.maintenance} onChange={(v) => set("system", { maintenance: v })} />
                  </Section>
                  <Section title="Developer" description="Tools for testing the dashboard states." grid={false}>
                    <div className="space-y-4">
                      <Toggle
                        label="Simulate API failures"
                        description="Every mock request fails so you can preview error states."
                        checked={failures}
                        onChange={(v) => {
                          mockControls.setSimulateFailures(v);
                          setFailures(v);
                          qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "settings" });
                          notify.info(v ? "API failures enabled" : "API failures disabled", "Visit any page to see the effect.");
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          qc.clear();
                          notify.success("Cache cleared", "All data will be refetched.");
                        }}
                      >
                        Clear query cache
                      </Button>
                    </div>
                  </Section>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children, grid = true }: { title: string; description?: string; children: React.ReactNode; grid?: boolean }) {
  return (
    <section className="surface-card p-4 sm:p-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className={cn("mt-5", grid && "grid gap-4 sm:grid-cols-2")}>{children}</div>
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("grid gap-1.5", full && "sm:col-span-2")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange, full }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; full?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4", full && "sm:col-span-2")}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
