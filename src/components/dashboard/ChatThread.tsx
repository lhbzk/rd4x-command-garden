import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import type { ChatMessage } from "@/lib/api/types";
import { formatDateTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

/** Chat-style conversation renderer shared by Tickets and Transcripts. */
export function ChatThread({ messages, className }: { messages: ChatMessage[]; className?: string }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  let lastDay = "";
  return (
    <div className={cn("space-y-4 px-4 py-5 sm:px-6", className)}>
      {messages.map((m) => {
        const day = new Date(m.createdAt).toDateString();
        const showDay = day !== lastDay;
        lastDay = day;
        if (m.authorRole === "system") {
          return (
            <div key={m.id} className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
              <Bot className="size-3.5" /> {m.content}
              <span className="text-muted-foreground/60">· {formatTime(m.createdAt)}</span>
            </div>
          );
        }
        const staff = m.authorRole === "staff";
        return (
          <div key={m.id}>
            {showDay && (
              <div className="mb-4 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {formatDateTime(m.createdAt).split(" · ")[0]}
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            <div className={cn("flex gap-3 fade-up", staff && "flex-row-reverse")}>
              <UserAvatar name={m.author} hue={m.hue} size="sm" className="mt-5" />
              <div className={cn("flex max-w-[82%] flex-col sm:max-w-[70%]", staff && "items-end")}>
                <div className={cn("mb-1 flex items-center gap-2 text-xs", staff && "flex-row-reverse")}>
                  <span className="font-medium">{m.author}</span>
                  {staff && (
                    <span className="rounded border border-primary/20 bg-primary/10 px-1 text-[10px] text-primary">STAFF</span>
                  )}
                  <span className="text-muted-foreground">{formatTime(m.createdAt)}</span>
                </div>
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    staff
                      ? "rounded-tr-sm border border-primary/15 bg-primary/10 text-foreground"
                      : "rounded-tl-sm border border-border bg-muted/60",
                  )}
                >
                  {m.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
