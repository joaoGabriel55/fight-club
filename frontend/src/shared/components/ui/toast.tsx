import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ─── Global imperative API (for use outside React tree) ──────────────────────

let _globalShowToast:
  | ((message: string, variant?: ToastVariant) => void)
  | null = null;

export function showToast(message: string, variant: ToastVariant = "info") {
  _globalShowToast?.(message, variant);
}

// ─── Provider ────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register global handler
  useEffect(() => {
    _globalShowToast = addToast;
    return () => {
      _globalShowToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Single toast item ───────────────────────────────────────────────────────

const variantClasses: Record<ToastVariant, string> = {
  success:
    "border-green-500/30 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
  error:
    "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  warning:
    "border-yellow-500/30 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100",
  info: "border-border bg-background text-foreground",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm animate-in slide-in-from-top-2 fade-in",
        variantClasses[toast.variant],
      )}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
