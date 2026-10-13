"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import { cn } from "./cn";

/** Janela sobre a página (usa <dialog>: foco preso, Esc fecha, fundo inerte). */
export function Modal({
  title,
  onClose,
  children,
  className,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className={cn(
        "m-auto max-h-[92dvh] w-[min(94vw,480px)] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-text shadow-pop backdrop:bg-black/50",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-text-strong">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Fechar"
            className="-mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
