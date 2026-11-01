import { Toaster } from "sonner";

/** Global toast host. Trigger toasts with `notify` from "@/lib/notify". */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "!bg-popover !text-popover-foreground !border !border-border-strong !rounded-xl !shadow-[var(--shadow-float)] !font-sans",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
          warning: "[&_[data-icon]]:!text-warning",
        },
      }}
    />
  );
}
