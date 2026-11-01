import { toast } from "sonner";

/** App-wide toast helpers. Rendered by <AppToaster /> in the root layout. */
export const notify = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  error: (title: string, description?: string) => toast.error(title, { description }),
  info: (title: string, description?: string) => toast(title, { description }),
  warning: (title: string, description?: string) => toast.warning(title, { description }),
  promise: toast.promise,
};
