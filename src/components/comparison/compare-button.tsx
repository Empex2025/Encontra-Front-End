"use client";

import { Check, Scale } from "lucide-react";

import { cn } from "@/components/ui/cn";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import type { SearchItem } from "@/lib/api/search";
import { buttonState, itemRef } from "@/lib/domain/comparison";

/** Pílula "Comparar" do card: Comparar · Na comparação · Outra categoria · Comparação cheia. */
export function CompareButton({ item, origin = "pesquisa" }: { item: SearchItem; origin?: string }) {
  const { list, toggle } = useComparisonSelection();
  // Lugares não entram na comparação (não há critérios comparáveis); a pílula nem aparece.
  if (item.type === "place") return null;
  if (!item.group) {
    // Produto ou serviço sem grupo comparável vindo do servidor: o botão continua visível, desabilitado, com o motivo.
    return (
      <button
        type="button"
        disabled
        title="Esta opção ainda não tem categoria comparável no servidor."
        aria-label={`Comparar indisponível: ${item.title}`}
        className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3 text-xs font-bold text-text-2 opacity-50"
      >
        <Scale className="size-3.5" aria-hidden />
        Comparar
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
      title={hint}
      aria-label={`${label}: ${item.title}`}
      onClick={() => item.group && toggle({ ref, group: item.group, origin })}
      className={cn(
        "relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors",
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
      {label}
    </button>
  );
}
