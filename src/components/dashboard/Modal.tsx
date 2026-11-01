import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof SIZES;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "surface-float max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] gap-0 overflow-hidden rounded-2xl p-0",
          SIZES[size],
        )}
      >
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <DialogFooter className="gap-2 border-t border-border bg-muted/20 px-5 py-3.5">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
