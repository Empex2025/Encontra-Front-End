"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ResultCard } from "@/components/search/result-card";
import { ErrorState } from "@/components/ui/error-state";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useUserLocation } from "@/hooks/use-user-location";
import { fetchSearch } from "@/lib/api/search";
import { MAX_COMPARE } from "@/lib/domain/comparison";

/**
 * "Sua comparação" (bandeja) + pesquisa para escolher o que comparar (Documento de entrega › CompararSelecao).
 * Os cards mostram o botão "Comparar"; o que não for do mesmo grupo aparece como "Outra categoria".
 */
export function ComparisonPicker() {
  const { list, remove, clear } = useComparisonSelection();
  const { location, isLoading } = useUserLocation();
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQ(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  const hasLocation = (location.lat !== null && location.lng !== null) || !!location.label;
  const search = useQuery({
    queryKey: ["compare-picker", q, location.radiusKm, location.lat, location.lng, location.label],
    enabled: q.length >= 2 && !isLoading && hasLocation,
    queryFn: () =>
      fetchSearch(
        {
          q,
          specialty: [],
          sort: "relevance",
          radiusKm: location.radiusKm,
          lat: location.lat,
          lng: location.lng,
          where: location.label,
        },
        1,
      ),
  });
  // Só entra na comparação o que tem grupo comparável.
  const items = (search.data?.items ?? []).filter((i) => i.type !== "place" && i.group);

  return (
    <section
      aria-labelledby="picker-t"
      className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="picker-t" className="text-lg font-bold text-text-strong">
          Sua comparação ({list.length} de {MAX_COMPARE})
        </h2>
        {list.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="py-2 text-sm font-semibold text-link hover:underline"
          >
            Limpar
          </button>
        )}
      </div>
      {list.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Itens escolhidos">
          {list.map((e) => (
            <li
              key={e.ref}
              className="flex items-center gap-1.5 rounded-full bg-surface-2 py-1 pr-1 pl-3 text-sm"
            >
              <span className="font-semibold text-text">{e.group.label}</span>
              <button
                type="button"
                onClick={() => remove(e.ref)}
                aria-label={`Remover ${e.group.label} da comparação`}
                className="flex size-8 items-center justify-center rounded-full hover:bg-border"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {list.length < MAX_COMPARE && (
        <>
          <label className="relative block">
            <span className="sr-only">Buscar o que comparar</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Busque um produto ou serviço para comparar"
              className="h-12 w-full rounded-lg border border-border-strong bg-surface pr-3 pl-9 text-text"
            />
          </label>
          {!hasLocation && q.length >= 2 && (
            <p className="text-sm text-text-muted">
              Defina seu local no topo da página para buscar o que está perto.
            </p>
          )}
          {search.isError && <ErrorState error={search.error} onRetry={() => search.refetch()} />}
          {search.data && items.length === 0 && (
            <p className="text-sm text-text-muted">
              Nada comparável encontrado para “{q}”. Tente outro termo.
            </p>
          )}
          {items.length > 0 && (
            <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
              {items.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <ResultCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
