import { Star } from "lucide-react";

import { cn } from "@/components/ui/cn";

/** Estrelas de 1 a 5 (só leitura). O valor também vai em texto para leitor de tela. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < Math.round(value) ? "fill-accent text-accent" : "text-border-strong")}
          aria-hidden
        />
      ))}
      <span className="sr-only">{value} de 5 estrelas</span>
    </span>
  );
}
