import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { allNavItems } from "@/lib/nav";
import { searchMock } from "@/lib/api";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

/** Topbar search trigger + ⌘K command palette. */
export function GlobalSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = q.trim().length > 1 ? searchMock(q) : null;
  const go = (fn: () => void) => {
    setOpen(false);
    setQ("");
    fn();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg border border-input bg-card/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground",
          className,
        )}
        aria-label="Open global search"
      >
        <Search className="size-4" />
        <span className="hidden flex-1 text-left md:inline">Search users, tickets, keys…</span>
        <kbd className="hidden rounded border border-border-strong bg-muted px-1.5 font-mono text-[10px] md:inline">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search users, tickets, keys, releases…"
          value={q}
          onValueChange={setQ}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim() && !results) {
              go(() => navigate({ to: "/search", search: { q } }));
            }
          }}
        />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>No results for “{q}”.</CommandEmpty>
          {q.trim() && (
            <CommandGroup heading="Search">
              <CommandItem value={`search-all-${q}`} onSelect={() => go(() => navigate({ to: "/search", search: { q } }))}>
                <Search className="size-4" /> See all results for “{q}”
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          )}
          {results && results.users.length > 0 && (
            <CommandGroup heading="Users">
              {results.users.slice(0, 4).map((u) => (
                <CommandItem key={u.id} value={`user-${u.username}-${u.discordId}`} onSelect={() => go(() => navigate({ to: "/users", search: { q: u.username } }))}>
                  <UserAvatar name={u.username} hue={u.hue} size="xs" />
                  {u.username}
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">{u.discordId}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.tickets.length > 0 && (
            <CommandGroup heading="Tickets">
              {results.tickets.slice(0, 4).map((t) => (
                <CommandItem key={t.id} value={`ticket-${t.id}-${t.subject}`} onSelect={() => go(() => navigate({ to: "/tickets", search: { id: t.id } }))}>
                  <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                  <span className="truncate">{t.subject}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Pages">
            {allNavItems.map((item) => (
              <CommandItem key={item.to} value={`page-${item.title}`} onSelect={() => go(() => navigate({ to: item.to }))}>
                <item.icon className="size-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
