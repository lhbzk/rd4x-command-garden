import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/dashboard/AuthShell";
import { LogoMark } from "@/components/dashboard/Logo";
import { UserAvatar } from "@/components/dashboard/UserAvatar";
import { DEMO_KEYS, currentAdmin, validateKey } from "@/lib/api";
import type { KeyRecord } from "@/lib/api/types";
import { formatDate, formatKeyInput, isCompleteKey } from "@/lib/format";
import { notify } from "@/lib/notify";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/key")({
  head: () => pageHead("RD4X Key", "Activate your RD4X key to unlock the admin console."),
  component: KeyPage,
});

type KeyState =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "invalid" }
  | { s: "expired"; at: string }
  | { s: "success"; key: KeyRecord };

function KeyPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("RD4X-");
  const [state, setState] = useState<KeyState>({ s: "idle" });
  const [shakeId, setShakeId] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const complete = isCompleteKey(value);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!complete || state.s === "loading") return;
    setState({ s: "loading" });
    try {
      const res = await validateKey(value);
      if (res.status === "success") {
        setState({ s: "success", key: res.key });
        notify.success("Key activated", "Redirecting to your dashboard…");
        setTimeout(() => navigate({ to: "/overview" }), 1600);
      } else if (res.status === "expired") {
        setState({ s: "expired", at: res.expiredAt });
        setShakeId((x) => x + 1);
      } else {
        setState({ s: "invalid" });
        setShakeId((x) => x + 1);
      }
    } catch {
      setState({ s: "idle" });
      notify.error("Couldn't reach the key server", "Please try again in a moment.");
    }
  };

  const error = state.s === "invalid" || state.s === "expired";

  return (
    <AuthShell>
      <div className="w-full max-w-[440px] fade-up">
        <div className="surface-float overflow-hidden rounded-2xl">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
            <UserAvatar name={currentAdmin.displayName} hue={currentAdmin.hue} status="online" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">@{currentAdmin.username}</p>
              <p className="flex items-center gap-1.5 text-xs text-success">
                <span className="size-1.5 rounded-full bg-success" /> Discord connected
              </p>
            </div>
            <Link to="/login" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Switch
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            {state.s === "success" ? (
              <div className="flex flex-col items-center py-4 text-center fade-up">
                <span className="relative inline-flex size-14 items-center justify-center rounded-2xl border border-success/25 bg-success/10 text-success">
                  <span className="absolute inset-0 animate-ping rounded-2xl bg-success/10" />
                  <CheckCircle2 className="relative size-7" />
                </span>
                <h1 className="mt-5 text-xl font-semibold tracking-tight">Access granted</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {state.key.plan} key · valid until {formatDate(state.key.expiresAt)}
                </p>
                <p className="mt-4 font-mono text-sm tracking-wider text-primary">{state.key.key}</p>
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Opening dashboard…
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex flex-col items-center text-center">
                  <LogoMark className="size-12 rounded-xl" />
                  <h1 className="mt-5 text-xl font-semibold tracking-tight">Enter your RD4X Key</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Activate your license to continue to the dashboard.
                  </p>
                </div>

                <label htmlFor="rd4x-key" className="mt-7 block text-xs font-medium text-muted-foreground">
                  License key
                </label>
                <div key={shakeId} className={cn("relative mt-2", shakeId > 0 && error && "animate-shake")}>
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="rd4x-key"
                    ref={inputRef}
                    value={value}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    inputMode="text"
                    onChange={(e) => {
                      setValue(formatKeyInput(e.target.value));
                      if (state.s !== "idle" && state.s !== "loading") setState({ s: "idle" });
                    }}
                    placeholder="RD4X-XXXX-XXXX-XXXX"
                    aria-invalid={error}
                    disabled={state.s === "loading"}
                    className={cn(
                      "h-12 w-full rounded-xl border bg-background/60 pl-10 pr-4 font-mono text-[15px] uppercase tracking-[0.14em] text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2 disabled:opacity-60",
                      error
                        ? "border-danger/50 focus:ring-danger/30"
                        : "border-input focus:border-primary/40 focus:ring-ring/40",
                    )}
                  />
                </div>

                {state.s === "invalid" && (
                  <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-xs text-danger fade-up">
                    <AlertCircle className="size-3.5" /> This key is invalid. Check for typos and try again.
                  </p>
                )}
                {state.s === "expired" && (
                  <p role="alert" className="mt-2.5 flex items-center gap-1.5 text-xs text-warning fade-up">
                    <Clock className="size-3.5" /> This key expired on {formatDate(state.at)}. Renew it to continue.
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={!complete || state.s === "loading"}
                  className="mt-5 h-11 w-full"
                >
                  {state.s === "loading" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Validating key…
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {state.s !== "success" && (
          <div className="mt-5 rounded-xl border border-dashed border-border-strong px-4 py-3 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground/80">Demo keys</p>
            <div className="flex flex-col gap-1.5 font-mono">
              {[
                ["Valid", DEMO_KEYS.valid],
                ["Expired", DEMO_KEYS.expired],
                ["Invalid", "RD4X-ABCD-EFGH-1234"],
              ].map(([label, k]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setValue(k);
                    setState({ s: "idle" });
                    inputRef.current?.focus();
                  }}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
                >
                  <span>{k}</span>
                  <span className="font-sans text-[11px] text-muted-foreground/70">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
