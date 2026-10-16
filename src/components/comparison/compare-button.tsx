"use client";

import { Check, Lock, Plus, Scale } from "lucide-react";

import { cn } from "@/components/ui/cn";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import type { SearchItem } from "@/lib/api/search";
import { buttonState, itemRef } from "@/lib/domain/comparison";

/** O que a pessoa viu ao escolher o item; só serve à bandeja "Sua comparação". */
const snapshotOf = (item: SearchItem) => ({
  title: item.title,
  imageUrl: item.imageUrl,
  priceCents: item.price?.amountCents ?? null,
  categoryId: item.categoryId,
});

/** Estado do botão de um item contra a seleção atual. `null`: lugares e itens sem grupo não entram. */
export function useCompareState(item: SearchItem, origin = "pesquisa") {
  const { list, toggle } = useComparisonSelection();
  if (item.type === "place" || !item.group) return null;
  const ref = itemRef(item.type, item.id);
  const state = buttonState(list, ref, item.group.id);
  const group = item.group;
  const hint =
    state === "other_group"
      ? `Sua comparação é de ${list[0]?.group.label}. Só dá para comparar opções da mesma categoria.`
      : state === "full"
        ? "Você já tem 3 opções. Remova uma na bandeja “Sua comparação” para adicionar outra."
        : undefined;
  return {
    state,
    hint,
    firstGroupLabel: list[0]?.group.label,
    toggle: () => toggle({ ref, group, origin, ...snapshotOf(item) }),
  };
}

/**
 * Botão "Comparar" do card.
 * - `pill` (padrão): pílula no pé do card (Home, listas).
 * - `overlay`: pílula branca sobre a foto, como no protótipo (Comparar, Favoritos): "+ Comparar" · "✓ Na comparação"
 *   (âmbar) · "🔒 Outra categoria" (cinza). Quem usa posiciona (`className`).
 */
export function CompareButton({
  item,
  origin = "pesquisa",
  variant = "pill",
  className,
}: {
  item: SearchItem;
  origin?: string;
  /** Posição e z-index do botão sobre a foto. */
  className?: string;
  /** `icon`: botão redondo de 32 px sobre a foto do card (Explorar); o rótulo vira dica e nome acessível. */
  variant?: "pill" | "overlay" | "icon";
}) {
  const c = useCompareState(item, origin);
  // Lugares não entram na comparação (não há critérios comparáveis); a pílula nem aparece.
  if (item.type === "place") return null;
  const icon = variant === "icon";
  if (!c) {
    // Produto ou serviço sem grupo comparável vindo do servidor: o botão continua visível, desabilitado, com o motivo.
    return (
      <button
        type="button"
        disabled
        title="Esta opção ainda não tem categoria comparável no servidor."
        aria-label={`Comparar indisponível: ${item.title}`}
        className={cn(
          icon
            ? "relative z-10 inline-flex size-8 items-center justify-center rounded-full border border-border bg-surface/95 text-xs font-bold text-text-2 opacity-50"
            : variant === "overlay"
              ? "inline-flex h-[30px] items-center gap-1.5 rounded-full bg-surface-3 pr-3 pl-2 text-xs font-bold text-text-subtle shadow-card"
              : "relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface/95 px-3 text-xs font-bold text-text-2 opacity-50",
          className,
        )}
      >
        <Lock className="size-3.5" aria-hidden />
        {!icon && "Comparar"}
      </button>
    );
  }

  const label = {
    can_add: "Comparar",
    in: "Na comparação",
    other_group: "Outra categoria",
    full: "Comparação cheia",
  }[c.state];
  const disabled = c.state === "other_group" || c.state === "full";

  if (variant === "overlay")
    return (
      <button
        type="button"
        disabled={disabled}
        aria-pressed={c.state === "in"}
        title={c.hint}
        aria-label={
          c.state === "in"
            ? `Remover ${item.title} da comparação`
            : disabled
              ? `${label}: ${item.title}`
              : `Salvar ${item.title} para comparar`
        }
        onClick={c.toggle}
        className={cn(
          "savebtn inline-flex h-[30px] items-center gap-1.5 rounded-full pr-3 pl-2 text-xs font-bold shadow-card transition-transform enabled:hover:scale-105",
          c.state === "in"
            ? "bg-accent text-on-accent"
            : disabled
              ? "bg-surface-3 text-text-subtle"
              : "bg-white text-navy",
          className,
        )}
      >
        {c.state === "in" ? (
          <Check className="size-3.5" aria-hidden />
        ) : disabled ? (
          <Lock className="size-3.5" aria-hidden />
        ) : (
          <Plus className="size-3.5" aria-hidden />
        )}
        {label}
      </button>
    );

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={c.state === "in"}
      title={c.hint ?? (icon ? label : undefined)}
      aria-label={`${label}: ${item.title}`}
      onClick={c.toggle}
      className={cn(
        "relative z-10 inline-flex items-center justify-center border text-xs font-bold transition-colors",
        icon ? "size-8 rounded-full shadow-card" : "h-9 gap-1.5 rounded-full px-3",
        c.state === "in"
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface/95 text-text-2 hover:border-navy-300 disabled:opacity-50",
        className,
      )}
    >
      {c.state === "in" ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Scale className="size-3.5" aria-hidden />
      )}
      {!icon && label}
    </button>
  );
}
