"use client";

import { CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

import { cn } from "./cn";

type Tone = "success" | "info";
type ToastItem = { id: number; message: string; tone: Tone };

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

/** Aviso curto que some sozinho (confirmações como "Salvo em Meus Favoritos."). Anunciado a leitores de tela. */
export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast precisa estar dentro de ToastProvider");
  return show;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = next.current++;
      setItems((l) => [...l.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-20 z-[70] flex flex-col items-center gap-2 lg:bottom-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex max-w-md items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-pop",
              t.tone === "success" ? "bg-primary text-on-primary" : "bg-surface text-text",
            )}
          >
            {t.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Fechar aviso"
              className="-my-1 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
