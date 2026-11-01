import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "./SearchBar";
import { cn } from "@/lib/utils";

export interface FilterDef {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  placeholder = "Search…",
  filters = [],
  actions,
  className,
}: {
  search?: string;
  onSearchChange?: (v: string) => void;
  placeholder?: string;
  filters?: FilterDef[];
  actions?: React.ReactNode;
  className?: string;
}) {
  const active = filters.filter((f) => f.value !== "all").length + (search ? 1 : 0);
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center fade-up", className)}>
      {onSearchChange && (
        <SearchBar
          value={search ?? ""}
          onChange={onSearchChange}
          placeholder={placeholder}
          className="sm:w-72"
        />
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {filters.map((f) => (
          <Select key={f.id} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="h-9 w-full bg-card sm:w-[150px]" aria-label={f.label}>
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      {active > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground sm:self-auto"
          onClick={() => {
            onSearchChange?.("");
            filters.forEach((f) => f.onChange("all"));
          }}
        >
          <X className="size-3.5" /> Clear ({active})
        </Button>
      )}
      {actions && <div className="flex gap-2 sm:ml-auto">{actions}</div>}
    </div>
  );
}
