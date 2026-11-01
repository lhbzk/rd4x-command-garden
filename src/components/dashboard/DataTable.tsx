import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "./States";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Hide this column below the given breakpoint. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  className?: string;
  align?: "left" | "right";
}

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  empty,
  pageSize = 10,
  caption,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  pageSize?: number;
  caption?: string;
  className?: string;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => setPage(0), [rows.length]);
  const visible = useMemo(() => rows.slice(page * pageSize, (page + 1) * pageSize), [rows, page, pageSize]);

  if (loading) return <LoadingSkeleton variant="table" count={Math.min(pageSize, 8)} />;

  return (
    <div className={cn("surface-card overflow-hidden fade-up", className)}>
      {rows.length === 0 ? (
        empty
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {caption && <caption className="sr-only">{caption}</caption>}
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={cn(
                        "h-10 whitespace-nowrap px-4 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                        c.align === "right" && "text-right",
                        c.hideBelow && HIDE[c.hideBelow],
                        c.className,
                      )}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter") onRowClick(row);
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn(
                      "border-b border-border transition-colors last:border-0",
                      onRowClick && "cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-4 py-3 align-middle",
                          c.align === "right" && "text-right",
                          c.hideBelow && HIDE[c.hideBelow],
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span className="tabular">
              {page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} of {rows.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-1 tabular">
                {page + 1} / {pageCount}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
