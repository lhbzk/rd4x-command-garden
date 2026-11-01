import { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const SearchBar = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
    size?: "md" | "lg";
    autoFocus?: boolean;
    onSubmit?: (v: string) => void;
  }
>(function SearchBar({ value, onChange, placeholder = "Search…", className, size = "md", autoFocus, onSubmit }, ref) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "lg" ? "size-5 left-4" : "size-4",
        )}
      />
      <input
        ref={ref}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.(value);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "w-full rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/40 [&::-webkit-search-cancel-button]:hidden",
          size === "lg" ? "h-12 rounded-xl pl-12 pr-10 text-base" : "h-9 pl-9 pr-8",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
});
