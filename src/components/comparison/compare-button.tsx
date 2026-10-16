"use client";

import { Check, Scale } from "lucide-react";

import { cn } from "@/components/ui/cn";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import type { SearchItem } from "@/lib/api/search";
import { buttonState, itemRef } from "@/lib/domain/comparison";

/** Pílula "Comparar" do card: Comparar · Na comparação · Outra categoria · Comparação cheia. */
export function CompareButton({
  item,
  origin = "pesquisa",
  variant = "pill",
}: {
  item: SearchItem;
  origin?: string;
  /** `icon`: botão redondo de 32 px sobre a foto do card (Explorar); o rótulo vira dica e nome acessível. */
  variant?: "pill" | "icon";
}) {
  const { list, toggle } = useComparisonSelection();
  // Lugares não entram na comparação (não há critérios comparáveis); a pílula nem aparece.
  if (item.type === "place") return null;
  const icon = variant === "icon";
  if (!item.group) {
    // Produto ou serviço sem grupo comparável vindo do servidor: o botão continua visível, desabilitado, com o motivo.
    return (
      <button
        type="button"
        disabled
        title="Esta opção ainda não tem categoria comparável no servidor."
        aria-label={`Comparar indisponível: ${item.title}`}
        className={cn(
          "relative z-10 inline-flex items-center justify-center border border-border bg-surface/95 text-xs font-bold text-text-2 opacity-50",
          icon ? "size-8 rounded-full" : "h-9 gap-1.5 rounded-full px-3",
        )}
      >
        <Scale className="size-3.5" aria-hidden />
        {!icon && "Comparar"}
      </button>
    );
  }

  const ref = itemRef(item.type, item.id);
  const state = buttonState(list, ref, item.group.id);
  const label = {
    can_add: "Comparar",
    in: "Na comparação",
    other_group: "Outra categoria",
    full: "Comparação cheia",
  }[state];
  const disabled = state === "other_group" || state === "full";
  const hint =
    state === "other_group"
      ? `Sua comparação é de ${list[0]?.group.label}. Só dá para comparar opções da mesma categoria.`
      : state === "full"
        ? "Você já tem 3 opções. Remova uma na tela Comparar para adicionar outra."
        : undefined;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={state === "in"}
      aria-label={`${label}: ${item.title}`}
      onClick={() => item.group && toggle({ ref, group: item.group, origin })}
      title={hint ?? (icon ? label : undefined)}
      className={cn(
        "relative z-10 inline-flex items-center justify-center border text-xs font-bold transition-colors",
        icon ? "size-8 rounded-full shadow-card" : "h-9 gap-1.5 rounded-full px-3",
        state === "in"
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface/95 text-text-2 hover:border-navy-300 disabled:opacity-50",
      )}
    >
      {state === "in" ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Scale className="size-3.5" aria-hidden />
      )}
      {!icon && label}
    </button>
  );
}
