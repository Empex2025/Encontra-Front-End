"use client";

import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import type { LowestPrice } from "@/lib/api/catalog";
import { formatKm, formatMoney, formatTimeAgo } from "@/lib/format";
import { explorarComBusca } from "@/lib/routes";

type State = "no-place" | "loading" | "error" | "ready";

const box = "rounded-2xl bg-surface shadow-card";

/**
 * "Menores preços perto de você" (protótipo › Ofertas). Cada cartão é um item com o menor preço informado por uma
 * loja do raio. Só vem do servidor; sem dado, a seção continua com título e um estado (nunca some, nunca inventa).
 */
export function LowestPrices({
  prices,
  state,
  error,
  onRetry,
}: {
  prices: LowestPrice[];
  state: State;
  error: Error | null;
  onRetry: () => void;
}) {
  if (state === "loading")
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} aria-hidden className="h-[168px] animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  if (state === "error" && error)
    return (
      <ErrorState
        error={error}
        compact
        title="Não foi possível carregar os menores preços"
        onRetry={onRetry}
      />
    );
  if (state === "no-place")
    return (
      <p className={`${box} px-5 py-6 text-sm text-text-muted`}>
        Defina seu local para ver os menores preços perto de você.
      </p>
    );
  if (prices.length === 0)
    return (
      <p className={`${box} px-5 py-6 text-sm text-text-muted`}>
        Ainda não há preços de lojas do seu raio para comparar. Quando mais de uma loja informar o preço de um
        mesmo item, o menor aparece aqui.
      </p>
    );

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {prices.map((p) => {
        const ago = formatTimeAgo(p.updatedAt);
        return (
          <li key={p.id} className="min-w-0">
            <Link
              href={
                p.href && p.href.startsWith("/") && !p.href.startsWith("//")
                  ? p.href
                  : explorarComBusca(p.item)
              }
              className="flex h-full flex-col gap-1.5 rounded-2xl bg-surface px-[18px] py-4 shadow-card transition-shadow hover:shadow-raised"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-bold text-text-muted">{p.item}</span>
                <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-accent px-2 text-[11px] font-extrabold text-on-accent">
                  1º menor preço
                </span>
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-[26px] leading-8 font-extrabold text-text-strong">
                  {formatMoney(p.priceCents)}
                </span>
                {p.unit && <span className="text-xs text-text-subtle">{p.unit}</span>}
              </span>
              <span className="text-[13px] leading-[18px] text-text">
                <b>{p.profile.name}</b>
                {p.distanceKm !== null && <> · {formatKm(p.distanceKm)}</>}
              </span>
              {p.saving && (
                <span className="text-xs leading-4 font-bold text-success-text">
                  Até {formatMoney(p.saving.cents)} mais barato que outras {p.saving.others}{" "}
                  {p.saving.others === 1 ? "loja" : "lojas"}
                </span>
              )}
              <span className="mt-auto flex items-center justify-between gap-2 border-t border-surface-2 pt-1.5 text-xs text-text-subtle">
                <span>Atualizado {ago ? ago : "em data não informada"}</span>
                <span className="font-bold text-link">Ver no Explorar ›</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
