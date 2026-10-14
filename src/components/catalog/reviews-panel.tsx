"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Flag, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { actions } from "@/lib/api/actions";
import { catalog, type Review, type ReviewSort } from "@/lib/api/catalog";
import { formatRating, formatTimeAgo } from "@/lib/format";
import { denunciarHref } from "@/lib/routes";

import { BlockSkeleton, SectionError } from "./section-state";
import { Stars } from "./stars";

/**
 * Avaliações de produto, loja ou prestador: média, barras 5–1, filtros com contagem, ordenação,
 * 5 por vez e voto "Útil" (um por pessoa). Tudo vem do servidor; nada é calculado ou inventado aqui.
 */
export function ReviewsPanel({
  target,
  slug,
  reviewHref,
  reviewLabel,
  reportKind = true,
}: {
  target: "products" | "profiles";
  slug: string;
  /** Destino de "Avaliar…" (tela Avaliar); visitante vê o convite antes. */
  reviewHref: string;
  reviewLabel: string;
  /** Mostra "Denunciar" em cada avaliação (padrão: sim). */
  reportKind?: boolean;
}) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  useResumeAction("review", undefined, () => router.push(reviewHref));
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<ReviewSort>("recent");

  const q = useInfiniteQuery({
    queryKey: ["reviews", target, slug, filter, sort],
    queryFn: ({ pageParam }) => catalog.reviews(target, slug, { filter, sort, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });

  if (q.isPending) return <BlockSkeleton label="Carregando avaliações" />;
  if (q.isError) return <SectionError what="as avaliações" error={q.error} onRetry={() => q.refetch()} />;

  const first = q.data.pages[0];
  const items = q.data.pages.flatMap((p) => p.items);
  const { summary } = first;
  const last = q.data.pages[q.data.pages.length - 1];
  const remaining = Math.max(0, last.total - items.length);
  const maxCount = Math.max(1, ...[5, 4, 3, 2, 1].map((n) => summary.distribution[String(n)] ?? 0));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col items-start gap-1">
          <p className="text-4xl font-bold text-text-strong">
            {summary.average !== null ? formatRating(summary.average) : "—"}
          </p>
          {summary.average !== null && <Stars value={summary.average} />}
          <p className="text-sm text-text-muted">
            {summary.total} {summary.total === 1 ? "avaliação" : "avaliações"}
            {summary.recommendPct != null && ` · ${summary.recommendPct}% recomendam`}
          </p>
        </div>
        <ul className="flex flex-1 flex-col gap-1.5" aria-label="Distribuição das notas">
          {[5, 4, 3, 2, 1].map((n) => {
            const c = summary.distribution[String(n)] ?? 0;
            const pct = summary.total ? `${Math.round((c / summary.total) * 100)}%` : "—";
            return (
              <li key={n} className="flex items-center gap-2 text-sm text-text-muted">
                <span className="w-4 text-right">{n}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(c / maxCount) * 100}%` }}
                  />
                </span>
                <span className="w-10 text-right">{pct}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {summary.attributes && summary.attributes.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {summary.attributes.map((a) => (
            <li key={a.label} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-text-muted">{a.label}</span>
              <span className="font-bold text-text-strong">{formatRating(a.value)}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => {
          if (!requireAuth("review")) return;
          router.push(reviewHref);
        }}
        className="h-11 self-start rounded-lg border border-primary px-5 text-sm font-bold text-text-strong hover:bg-surface-2"
      >
        {reviewLabel}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        {first.filters.length === 0 && (
          <Chip label="Todas" count={summary.total} size="sm" selected onClick={() => setFilter("all")} />
        )}
        {first.filters.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            count={f.count}
            size="sm"
            selected={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-text-muted">
          Ordenar
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ReviewSort)}
            className="h-10 rounded-lg border border-border-strong bg-surface px-2 text-sm text-text"
          >
            <option value="recent">Mais recentes</option>
            <option value="helpful">Mais úteis</option>
          </select>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-xl border border-dashed border-border-strong bg-surface-2 p-4 text-sm">
          <p className="font-semibold text-text">
            {filter === "all" ? "Ainda não há avaliações." : "Nenhuma avaliação neste filtro."}
          </p>
          <p className="text-text-muted">
            {filter === "all"
              ? "Quando alguém avaliar, as notas, os filtros e os comentários aparecem aqui. Você pode ser a primeira pessoa a avaliar."
              : "Escolha outro filtro para ver as demais avaliações."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((r) => (
            <ReviewItem key={r.id} review={r} reportKind={reportKind} />
          ))}
        </ul>
      )}

      {q.hasNextPage && (
        <button
          type="button"
          disabled={q.isFetchingNextPage}
          onClick={() => q.fetchNextPage()}
          className="h-11 self-center rounded-lg border border-primary px-6 text-sm font-bold text-text-strong hover:bg-surface-2 disabled:opacity-60"
        >
          {q.isFetchingNextPage ? "Carregando…" : `Ver mais avaliações (${remaining} restantes)`}
        </button>
      )}
    </div>
  );
}

function ReviewItem({ review, reportKind }: { review: Review; reportKind?: boolean }) {
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const [on, setOn] = useState(review.markedHelpful);
  const [count, setCount] = useState(review.helpfulCount);
  const ago = formatTimeAgo(review.createdAt);

  const m = useMutation({
    mutationFn: (next: boolean) => actions.helpful(review.id, next),
    onMutate: (next) => {
      setOn(next);
      setCount((c) => c + (next ? 1 : -1));
    },
    onSuccess: (d) => setCount(d.helpfulCount),
    onError: (e, next) => {
      setOn(!next);
      setCount((c) => c + (next ? -1 : 1));
      toast(e instanceof Error ? e.message : "Não foi possível registrar seu voto agora.", "info");
    },
  });
  useResumeAction("helpful", review.id, () => {
    if (!on) m.mutate(true);
  });

  return (
    <li className="flex flex-col gap-2 border-b border-border pb-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-text-strong">{review.author}</span>
        <Stars value={review.rating} />
        <span className="text-xs text-text-subtle">
          {[ago, review.context, review.sizeLabel ? `Tamanho ${review.sizeLabel}` : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      {review.text ? (
        <p className="text-text">{review.text}</p>
      ) : (
        <p className="text-sm text-text-muted">Esta pessoa deu a nota sem escrever comentário.</p>
      )}
      {review.photoUrls.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {review.photoUrls.map((u) => (
            <li key={u}>
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos enviadas por clientes */}
              <img
                src={u}
                alt="Foto enviada por quem avaliou"
                loading="lazy"
                className="size-20 rounded-lg object-cover"
              />
            </li>
          ))}
        </ul>
      )}
      {review.reply && (
        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-semibold text-text-strong">Resposta de {review.reply.author}</p>
          <p className="text-text-muted">{review.reply.text}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={on}
          disabled={m.isPending}
          onClick={() => {
            if (!requireAuth("helpful", review.id)) return;
            m.mutate(!on);
          }}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold",
            on ? "border-primary bg-selected text-link" : "border-border text-text-2 hover:bg-surface-2",
          )}
        >
          <ThumbsUp className="size-3.5" aria-hidden />
          Útil ({count})
        </button>
        {reportKind && (
          <Link
            href={denunciarHref("avaliacao", review.id)}
            className="inline-flex h-9 items-center gap-1 px-2 text-xs font-semibold text-text-subtle hover:underline"
          >
            <Flag className="size-3.5" aria-hidden />
            Denunciar
          </Link>
        )}
      </div>
    </li>
  );
}
