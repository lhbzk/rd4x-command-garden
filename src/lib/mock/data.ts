// Centralized mock dataset. Deterministic (seeded) so values stay stable between reloads.
import type {
  Activity,
  AppNotification,
  AuditEvent,
  ChatMessage,
  Incident,
  IncidentsPayload,
  KeyRecord,
  Range,
  Release,
  ServiceHealth,
  Settings,
  Statistics,
  Ticket,
  Transcript,
  User,
} from "@/lib/api/types";

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seeded(1042);
const pick = <T,>(arr: readonly T[], r = rand) => arr[Math.floor(r() * arr.length)];
const int = (min: number, max: number, r = rand) => Math.floor(r() * (max - min + 1)) + min;

const NOW = Date.now();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

const USERNAMES = [
  "nyx.dev", "kairo", "voltage", "mirae", "obsidian", "sable", "zenith", "halcyon",
  "corvid", "lumen", "aster", "quill", "ronin", "ember", "vanta", "solace",
  "orbit", "fjord", "nova.kt", "cipher", "drift", "atlas", "juniper", "pyre",
  "wraith", "echo", "marrow", "tundra", "glyph", "onyx", "rivet", "sprocket",
  "talon", "umbra", "velvet", "wren", "yarrow", "zephyr", "basalt", "cobalt",
];
const COUNTRIES = ["BR", "US", "DE", "PT", "JP", "GB", "FR", "CA", "MX", "AR"];
const STAFF = ["rd4x.admin", "kairo", "mirae", "halcyon"];

const discordId = () => {
  let id = "1";
  for (let i = 0; i < 17; i++) id += int(0, 9);
  return id;
};

export const users: User[] = USERNAMES.map((username, i) => {
  const role =
    i === 0 ? "owner" : i < 4 ? "admin" : i < 8 ? "moderator" : i < 11 ? "support" : "member";
  const statusRoll = rand();
  const status =
    statusRoll < 0.62 ? "active" : statusRoll < 0.82 ? "inactive" : statusRoll < 0.92 ? "pending" : "banned";
  return {
    id: `usr_${(1000 + i).toString(36)}${i}`,
    username,
    discordId: discordId(),
    email: `${username.replace(".", "")}@mail.rd4x.io`,
    role,
    status,
    keys: int(0, 4),
    executions: int(40, 18_000),
    lastActive: minutesAgo(int(1, 60 * 24 * 12)),
    joinedAt: minutesAgo(int(60 * 24 * 20, 60 * 24 * 600)),
    country: pick(COUNTRIES),
    hue: int(0, 360),
  };
});

const userByName = (n: string) => users.find((u) => u.username === n) ?? users[0];

const keySegment = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => pick(chars.split(""))).join("");
};

export const keys: KeyRecord[] = Array.from({ length: 36 }, (_, i) => {
  const u = users[i % users.length];
  const status = i % 7 === 3 ? "expired" : i % 11 === 5 ? "revoked" : "active";
  const created = int(60 * 24 * 2, 60 * 24 * 200);
  return {
    key: `RD4X-${keySegment()}-${keySegment()}-${keySegment()}`,
    owner: u.username,
    status,
    plan: pick(["Lifetime", "Monthly", "Weekly"] as const),
    createdAt: minutesAgo(created),
    expiresAt:
      status === "expired" ? minutesAgo(int(60, 60 * 24 * 30)) : new Date(NOW + int(1, 300) * 86_400_000).toISOString(),
  };
});

// Demo keys for the RD4X Key screen
export const DEMO_KEYS = {
  valid: "RD4X-DEMO-2026-V10X",
  expired: "RD4X-EXPD-0000-2025",
};

const TICKET_SUBJECTS: [string, string][] = [
  ["Key not activating after purchase", "Billing"],
  ["Executor crashes on injection", "Technical"],
  ["HWID reset request", "Account"],
  ["Script hub not loading", "Technical"],
  ["Refund for duplicate charge", "Billing"],
  ["Discord role not syncing", "Account"],
  ["Error 0x51 on startup", "Technical"],
  ["Upgrade from Monthly to Lifetime", "Billing"],
  ["Anti-virus flags latest release", "Technical"],
  ["Can't link second Discord account", "Account"],
  ["Slow execution after V10 update", "Technical"],
  ["Request for reseller access", "Partnership"],
  ["Lost access to my key email", "Account"],
  ["API rate limit too strict", "Technical"],
];

const USER_LINES = [
  "Hey, I'm running into this since this morning. Any idea what's going on?",
  "I already tried reinstalling and restarting my PC, still the same.",
  "Here is the log output, let me know if you need anything else.",
  "Thanks, that worked partially but the issue comes back after a while.",
  "Is there an ETA for a fix? This is blocking me.",
];
const STAFF_LINES = [
  "Thanks for reaching out! Could you share your key prefix and the exact error?",
  "I've escalated this to the engineering team, we'll get back shortly.",
  "Please try clearing the cache folder and launching as administrator.",
  "I've reset your HWID — you should be able to activate now.",
  "We pushed a hotfix in v10.2.1 that should resolve this.",
];

let msgCounter = 0;
function conversation(user: string, userHue: number, staff: string, start: number, count: number): ChatMessage[] {
  const out: ChatMessage[] = [];
  let t = start;
  for (let i = 0; i < count; i++) {
    const isUser = i % 2 === 0;
    out.push({
      id: `msg_${++msgCounter}`,
      author: isUser ? user : staff,
      authorRole: isUser ? "user" : "staff",
      hue: isUser ? userHue : 185,
      content: isUser ? USER_LINES[i % USER_LINES.length] : STAFF_LINES[(i + start) % STAFF_LINES.length],
      createdAt: minutesAgo(t),
    });
    t = Math.max(1, t - int(3, 40));
  }
  return out;
}

export const tickets: Ticket[] = TICKET_SUBJECTS.map(([subject, category], i) => {
  const u = users[(i * 3 + 5) % users.length];
  const status = (["open", "open", "pending", "resolved", "open", "pending", "closed"] as const)[i % 7];
  const priority = (["high", "medium", "low", "urgent", "medium", "high", "low"] as const)[(i * 2) % 7];
  const start = int(60, 60 * 24 * 6);
  const assignee = status === "open" && i % 3 === 0 ? null : STAFF[i % STAFF.length];
  const messages = conversation(u.username, u.hue, assignee ?? "rd4x.admin", start, int(2, 6));
  return {
    id: `TK-${1042 + i}`,
    subject,
    status,
    priority,
    category,
    user: { username: u.username, discordId: u.discordId, hue: u.hue },
    assignee,
    createdAt: minutesAgo(start),
    updatedAt: messages[messages.length - 1].createdAt,
    messages,
  };
}).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

export const staffMembers = STAFF;

export const releases: Release[] = [
  {
    id: "rel_10_2_1", version: "10.2.1", title: "Injection stability hotfix", channel: "hotfix",
    date: minutesAgo(60 * 26), author: "rd4x.admin", downloads: 18_420,
    changes: [
      { type: "fix", text: "Resolved crash on injection for Windows 11 24H2" },
      { type: "fix", text: "Fixed key validation timeout on slow networks" },
    ],
  },
  {
    id: "rel_10_2_0", version: "10.2.0", title: "Script hub & performance", channel: "stable",
    date: minutesAgo(60 * 24 * 9), author: "kairo", downloads: 64_210,
    changes: [
      { type: "feature", text: "New script hub with categories and search" },
      { type: "improvement", text: "Execution engine 32% faster on cold start" },
      { type: "fix", text: "Memory leak when switching tabs" },
    ],
  },
  {
    id: "rel_10_2_0_b", version: "10.2.0-beta.3", title: "Beta: new execution engine", channel: "beta",
    date: minutesAgo(60 * 24 * 16), author: "mirae", downloads: 7_830,
    changes: [
      { type: "feature", text: "Experimental parallel execution queue" },
      { type: "improvement", text: "Reduced bundle size by 4.1 MB" },
    ],
  },
  {
    id: "rel_10_1_0", version: "10.1.0", title: "Discord role sync", channel: "stable",
    date: minutesAgo(60 * 24 * 34), author: "rd4x.admin", downloads: 81_904,
    changes: [
      { type: "feature", text: "Automatic Discord role sync for key owners" },
      { type: "feature", text: "Transcripts archive for closed tickets" },
      { type: "fix", text: "HWID reset no longer requires relog" },
    ],
  },
  {
    id: "rel_10_0_0", version: "10.0.0", title: "RD4X V10", channel: "stable",
    date: minutesAgo(60 * 24 * 61), author: "rd4x.admin", downloads: 142_377,
    changes: [
      { type: "feature", text: "Complete rewrite of the client and dashboard" },
      { type: "feature", text: "New key format RD4X-XXXX-XXXX-XXXX" },
      { type: "improvement", text: "End-to-end encrypted key exchange" },
    ],
  },
  {
    id: "rel_9_8_4", version: "9.8.4", title: "Legacy maintenance", channel: "hotfix",
    date: minutesAgo(60 * 24 * 88), author: "halcyon", downloads: 39_002,
    changes: [{ type: "fix", text: "Security patch for legacy loader" }],
  },
];

export const incidents: Incident[] = [
  {
    id: "inc_301", title: "Elevated API latency in EU region", severity: "major", status: "monitoring",
    service: "API Gateway", startedAt: minutesAgo(95), resolvedAt: null,
    updates: [
      { at: minutesAgo(20), status: "monitoring", message: "Fix deployed. Latency back to baseline, monitoring." },
      { at: minutesAgo(60), status: "identified", message: "Traced to a saturated connection pool on eu-west-2." },
      { at: minutesAgo(95), status: "investigating", message: "We're seeing increased p95 response times in EU." },
    ],
  },
  {
    id: "inc_300", title: "Key validation failures for a subset of users", severity: "critical", status: "investigating",
    service: "Key Service", startedAt: minutesAgo(18), resolvedAt: null,
    updates: [
      { at: minutesAgo(18), status: "investigating", message: "Reports of valid keys returning INVALID. Investigating." },
    ],
  },
  {
    id: "inc_299", title: "Discord OAuth callback errors", severity: "minor", status: "resolved",
    service: "Auth", startedAt: minutesAgo(60 * 30), resolvedAt: minutesAgo(60 * 29),
    updates: [
      { at: minutesAgo(60 * 29), status: "resolved", message: "Discord resolved upstream issue. All logins normal." },
      { at: minutesAgo(60 * 30), status: "investigating", message: "Some users unable to sign in with Discord." },
    ],
  },
  {
    id: "inc_298", title: "Release CDN serving stale build", severity: "major", status: "resolved",
    service: "CDN", startedAt: minutesAgo(60 * 24 * 5), resolvedAt: minutesAgo(60 * 24 * 5 - 42),
    updates: [
      { at: minutesAgo(60 * 24 * 5 - 42), status: "resolved", message: "Cache purged globally, v10.2.0 served everywhere." },
      { at: minutesAgo(60 * 24 * 5), status: "identified", message: "Edge cache not invalidated after release." },
    ],
  },
  {
    id: "inc_297", title: "Ticket notifications delayed", severity: "minor", status: "resolved",
    service: "Notifications", startedAt: minutesAgo(60 * 24 * 12), resolvedAt: minutesAgo(60 * 24 * 12 - 75),
    updates: [
      { at: minutesAgo(60 * 24 * 12 - 75), status: "resolved", message: "Queue drained, notifications delivered." },
      { at: minutesAgo(60 * 24 * 12), status: "investigating", message: "Notification queue backlog detected." },
    ],
  },
];

export const incidentsPayload = (): IncidentsPayload => ({
  incidents,
  uptime: 99.982,
  mttrMinutes: 47,
  uptimeDays: Array.from({ length: 90 }, (_, i) => {
    const d = 89 - i;
    const status = d === 5 || d === 30 ? "degraded" : d === 61 ? "down" : d === 0 ? "degraded" : "up";
    return { date: new Date(NOW - d * 86_400_000).toISOString(), status };
  }),
});

const AUDIT_ACTIONS: [string, (t: string) => string][] = [
  ["user.ban", (t) => `@${t}`],
  ["user.role.update", (t) => `@${t} → moderator`],
  ["key.revoke", () => `RD4X-${keySegment()}-••••-••••`],
  ["key.generate", () => `RD4X-${keySegment()}-••••-••••`],
  ["ticket.close", () => `TK-${int(1000, 1060)}`],
  ["ticket.assign", () => `TK-${int(1000, 1060)}`],
  ["release.publish", () => `v10.${int(0, 2)}.${int(0, 3)}`],
  ["settings.update", () => "security.sessionTimeout"],
  ["hwid.reset", (t) => `@${t}`],
  ["auth.login", () => "dashboard"],
];

export const auditEvents: AuditEvent[] = Array.from({ length: 64 }, (_, i) => {
  const actor = userByName(pick(STAFF));
  const [action, target] = pick(AUDIT_ACTIONS);
  const roll = rand();
  return {
    id: `evt_${9000 - i}`,
    timestamp: minutesAgo(i * int(8, 70) + int(1, 6)),
    user: actor.username,
    hue: actor.hue,
    action,
    target: target(pick(USERNAMES)),
    status: roll < 0.84 ? "success" : roll < 0.93 ? "warning" : "failed",
    ip: `${int(10, 220)}.${int(0, 255)}.${int(0, 255)}.${int(1, 254)}`,
  };
});

export const transcripts: Transcript[] = Array.from({ length: 14 }, (_, i) => {
  const [subject] = TICKET_SUBJECTS[(i + 4) % TICKET_SUBJECTS.length];
  const u = users[(i * 5 + 2) % users.length];
  const staff = STAFF[i % STAFF.length];
  const start = int(60 * 24 * 2, 60 * 24 * 60);
  const messages = conversation(u.username, u.hue, staff, start, int(4, 8));
  messages.push({
    id: `msg_${++msgCounter}`,
    author: "RD4X Bot",
    authorRole: "system",
    hue: 0,
    content: `Ticket closed by ${staff}. Transcript archived.`,
    createdAt: minutesAgo(Math.max(1, start - 400)),
  });
  return {
    id: `TR-${7300 + i}`,
    ticketId: `TK-${980 + i}`,
    subject,
    user: u.username,
    hue: u.hue,
    staff,
    closedAt: messages[messages.length - 1].createdAt,
    tags: [pick(["billing", "technical", "account", "hwid"]), ...(i % 3 === 0 ? ["escalated"] : [])],
    messages,
  };
}).sort((a, b) => +new Date(b.closedAt) - +new Date(a.closedAt));

const health: ServiceHealth[] = [
  { service: "API Gateway", status: "degraded", latency: 184, uptime: 99.94 },
  { service: "Key Service", status: "operational", latency: 42, uptime: 99.99 },
  { service: "Auth (Discord)", status: "operational", latency: 96, uptime: 99.98 },
  { service: "Release CDN", status: "operational", latency: 23, uptime: 100 },
  { service: "Database", status: "operational", latency: 8, uptime: 99.99 },
];

const recentActivity: Activity[] = [
  { kind: "key", action: "activated key", target: "RD4X-7KQ2-••••-••••", user: "nyx.dev", min: 2 },
  { kind: "ticket", action: "opened ticket", target: "TK-1055", user: "sable", min: 9 },
  { kind: "release", action: "published release", target: "v10.2.1", user: "rd4x.admin", min: 26 },
  { kind: "user", action: "joined via Discord", target: "", user: "wren", min: 41 },
  { kind: "system", action: "reset HWID for", target: "@ember", user: "kairo", min: 58 },
  { kind: "key", action: "generated 12 keys", target: "Lifetime", user: "mirae", min: 84 },
  { kind: "ticket", action: "resolved ticket", target: "TK-1047", user: "halcyon", min: 120 },
].map((a, i) => ({
  id: `act_${i}`,
  user: a.user,
  hue: userByName(a.user).hue,
  action: a.action,
  target: a.target,
  at: minutesAgo(a.min),
  kind: a.kind as Activity["kind"],
}));

export const overview = () => ({
  stats: {
    totalUsers: { value: 48_216, delta: 8.4 },
    activeUsers: { value: 12_904, delta: 3.1 },
    totalExecutions: { value: 2_841_552, delta: 14.2 },
    successRate: { value: 98.7, delta: 0.4 },
    openTickets: { value: tickets.filter((t) => t.status === "open").length, delta: -12.5 },
    activeKeys: { value: 31_480, delta: 5.6 },
  },
  executions: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(NOW - (13 - i) * 86_400_000);
    const base = 160_000 + Math.sin(i / 2) * 30_000 + i * 4_200;
    const r = seeded(500 + i);
    return {
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      executions: Math.round(base + r() * 22_000),
      failures: Math.round(1_600 + r() * 1_400),
    };
  }),
  recentActivity,
  recentTickets: tickets.slice(0, 5),
  health,
});

const RANGE_POINTS: Record<Range, { n: number; label: (i: number, n: number) => string; scale: number }> = {
  "24h": { n: 24, scale: 1 / 24, label: (i, n) => `${String((new Date(NOW).getHours() - (n - 1 - i) + 48) % 24).padStart(2, "0")}:00` },
  "7d": { n: 7, scale: 1, label: (i, n) => new Date(NOW - (n - 1 - i) * 86_400_000).toLocaleDateString("en-US", { weekday: "short" }) },
  "30d": { n: 30, scale: 1, label: (i, n) => new Date(NOW - (n - 1 - i) * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
  "90d": { n: 13, scale: 7, label: (i, n) => `W${(52 - (n - 1 - i)) % 52 || 52}` },
};

export const statistics = (range: Range): Statistics => {
  const cfg = RANGE_POINTS[range];
  const r = seeded({ "24h": 11, "7d": 22, "30d": 33, "90d": 44 }[range]);
  const executions = Array.from({ length: cfg.n }, (_, i) => ({
    label: cfg.label(i, cfg.n),
    executions: Math.round((170_000 + Math.sin(i / 1.7) * 38_000 + r() * 26_000) * cfg.scale),
  }));
  const totalExec = executions.reduce((s, p) => s + p.executions, 0);
  const failure = Math.round(totalExec * (0.011 + r() * 0.006));
  const activeUsers = Array.from({ length: cfg.n }, (_, i) => ({
    label: cfg.label(i, cfg.n),
    users: Math.round((range === "24h" ? 2_400 : 11_000) + Math.cos(i / 2.2) * 1_400 + r() * 900 + i * 40),
  }));
  const responseTime = Array.from({ length: cfg.n }, (_, i) => {
    const p50 = Math.round(48 + r() * 22 + Math.sin(i) * 6);
    return { label: cfg.label(i, cfg.n), p50, p95: Math.round(p50 * (2.1 + r() * 0.8)) };
  });
  const avg = Math.round(responseTime.reduce((s, p) => s + p.p50, 0) / responseTime.length);
  return {
    range,
    totals: {
      executions: { value: totalExec, delta: +(r() * 18 - 3).toFixed(1) },
      successRate: { value: +(100 - (failure / totalExec) * 100).toFixed(2), delta: +(r() * 0.8).toFixed(1) },
      activeUsers: { value: Math.max(...activeUsers.map((p) => p.users)), delta: +(r() * 9).toFixed(1) },
      avgResponse: { value: avg, delta: +(-r() * 6).toFixed(1) },
    },
    executions,
    successFailure: [
      { name: "Success", value: totalExec - failure },
      { name: "Failure", value: failure },
    ],
    activeUsers,
    responseTime,
    topEndpoints: [
      { endpoint: "POST /v10/execute", calls: Math.round(totalExec * 0.62), p95: 142, errorRate: 0.9 },
      { endpoint: "POST /v10/keys/validate", calls: Math.round(totalExec * 0.21), p95: 88, errorRate: 0.4 },
      { endpoint: "GET /v10/scripts", calls: Math.round(totalExec * 0.11), p95: 64, errorRate: 0.2 },
      { endpoint: "POST /v10/hwid/reset", calls: Math.round(totalExec * 0.004), p95: 210, errorRate: 2.1 },
    ],
  };
};

export const settings: Settings = {
  general: { workspace: "RD4X", timezone: "America/Sao_Paulo", language: "en", supportEmail: "support@rd4x.io" },
  profile: { displayName: "RD4X Admin", username: "rd4x.admin", email: "admin@rd4x.io", bio: "Platform owner." },
  security: {
    twoFactor: true,
    sessionTimeout: "12h",
    sessions: [
      { id: "s1", device: "Chrome · Windows 11", location: "São Paulo, BR", lastSeen: minutesAgo(0), current: true },
      { id: "s2", device: "Safari · iPhone 16", location: "São Paulo, BR", lastSeen: minutesAgo(180), current: false },
      { id: "s3", device: "Firefox · Ubuntu", location: "Frankfurt, DE", lastSeen: minutesAgo(60 * 50), current: false },
    ],
  },
  notifications: { tickets: true, incidents: true, releases: true, security: true, weekly: false },
  appearance: { accent: "aqua", density: "comfortable", reduceMotion: false },
  system: { environment: "production", version: "10.2.1", region: "sa-east-1", maintenance: false },
};

export const notifications: AppNotification[] = [
  { id: "n1", kind: "incident", title: "Critical incident opened", description: "Key validation failures for a subset of users", at: minutesAgo(18), read: false },
  { id: "n2", kind: "ticket", title: "Urgent ticket assigned to you", description: "TK-1045 · HWID reset request", at: minutesAgo(42), read: false },
  { id: "n3", kind: "release", title: "v10.2.1 published", description: "Injection stability hotfix is live", at: minutesAgo(60 * 26), read: false },
  { id: "n4", kind: "security", title: "New login from Frankfurt, DE", description: "Firefox on Ubuntu", at: minutesAgo(60 * 50), read: true },
];

export const currentAdmin = {
  username: "rd4x.admin",
  displayName: "RD4X Admin",
  discordId: "1098341276650012345",
  role: "owner" as const,
  hue: 185,
};
