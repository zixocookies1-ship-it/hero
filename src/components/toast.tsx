"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  const getStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-[var(--natural-green)] text-[var(--white)]";
      case "error":
        return "bg-red-600 text-[var(--white)]";
      case "info":
        return "bg-[var(--jaggery-brown)] text-[var(--white)]";
      default:
        return "bg-[var(--dark-text)] text-[var(--white)]";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-2" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getStyles(toast.type)} px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-xs animate-slide-up`}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}